// Minimal Google Drive client for a personal Google account (OAuth refresh token).
// Scope drive.file: the website only sees files and folders it created itself.

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const DRIVE_ROOT_FOLDER = "Einsparprofis Abrechnungen";

const FOLDER_MIME = "application/vnd.google-apps.folder";

export const isDriveConfigured = () =>
  Boolean(process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_CLIENT_SECRET && process.env.GOOGLE_DRIVE_REFRESH_TOKEN);

async function googleFetch<T>(url: string, accessToken: string, init: RequestInit = {}): Promise<{ data: T; response: Response }> {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...init.headers },
  });
  if (!response.ok) {
    throw new Error(`Google Drive API ${response.status}: ${await response.text()}`);
  }
  const text = await response.text();
  return { data: (text ? JSON.parse(text) : {}) as T, response };
}

/** Exchanges an OAuth code (setup) or the stored refresh token (uploads) at Google's token endpoint. */
export async function requestToken(params: Record<string, string>) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET ?? "",
      ...params,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Google token error ${response.status}: ${data.error_description || data.error}`);
  }
  return data as { access_token: string; refresh_token?: string };
}

export async function getAccessToken() {
  const { access_token } = await requestToken({
    grant_type: "refresh_token",
    refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN ?? "",
  });
  return access_token;
}

const quote = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

/** Returns the folder with this name below parent, creating it if needed. */
export async function ensureFolder(accessToken: string, name: string, parentId = "root") {
  const q = `name = ${quote(name)} and mimeType = '${FOLDER_MIME}' and ${quote(parentId)} in parents and trashed = false`;
  const { data } = await googleFetch<{ files: { id: string; webViewLink: string }[] }>(
    `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({ q, fields: "files(id,webViewLink)", pageSize: "1" })}`,
    accessToken
  );
  if (data.files.length) return data.files[0];

  const created = await googleFetch<{ id: string; webViewLink: string }>(
    "https://www.googleapis.com/drive/v3/files?fields=id,webViewLink",
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
    }
  );
  return created.data;
}

/** Resumable upload (works for the full 20 MB; multipart uploads are meant for ≤ 5 MB). */
export async function uploadFile(accessToken: string, file: { name: string; mimeType: string; parentId: string; data: ArrayBuffer }) {
  const { response } = await googleFetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink",
    accessToken,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": file.mimeType,
        "X-Upload-Content-Length": String(file.data.byteLength),
      },
      body: JSON.stringify({ name: file.name, parents: [file.parentId] }),
    }
  );
  const sessionUrl = response.headers.get("location");
  if (!sessionUrl) throw new Error("Google Drive did not return an upload URL");

  const { data } = await googleFetch<{ id: string; webViewLink: string }>(sessionUrl, accessToken, {
    method: "PUT",
    headers: { "Content-Type": file.mimeType },
    body: file.data,
  });
  return data;
}
