import { NextRequest } from "next/server";
import { DRIVE_ROOT_FOLDER, ensureFolder, requestToken } from "@/app/lib/googleDrive";
import { verify } from "@/app/lib/uploadSigning";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const page = (title: string, body: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;background:#FFF7EA;color:#1C1233;max-width:640px;margin:0 auto;padding:24px 16px;line-height:1.5}h1{font-size:24px}textarea{width:100%;min-height:110px;font:14px monospace;padding:10px;border:2px solid #1C1233;border-radius:10px}ol{padding-left:20px}a{color:#DB2C14}</style></head><body>${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );

// Shows the refresh token once so it can be stored in Vercel as GOOGLE_DRIVE_REFRESH_TOKEN
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (!verify(params.get("state"))) {
    return page("Fehler", "<h1>Link abgelaufen</h1><p>Bitte die Einrichtung erneut über /api/drive/connect starten.</p>", 400);
  }
  if (params.get("error")) {
    return page("Abgebrochen", `<h1>Abgebrochen</h1><p>Google meldet: ${escapeHtml(params.get("error") ?? "")}</p>`, 400);
  }

  try {
    const tokens = await requestToken({
      grant_type: "authorization_code",
      code: params.get("code") ?? "",
      redirect_uri: `${request.nextUrl.origin}/api/drive/callback`,
    });
    if (!tokens.refresh_token) {
      return page("Fehler", "<h1>Kein Refresh-Token erhalten</h1><p>Bitte die Einrichtung erneut starten.</p>", 400);
    }
    // Test the connection right away by creating the target folder
    const folder = await ensureFolder(tokens.access_token, DRIVE_ROOT_FOLDER);

    return page(
      "Google Drive verbunden",
      `<h1>✅ Google Drive ist verbunden</h1>
<p>Der Ordner <a href="${escapeHtml(folder.webViewLink)}" target="_blank">${DRIVE_ROOT_FOLDER}</a> wurde in deinem Drive angelegt.</p>
<p><b>Letzter Schritt:</b></p>
<ol>
<li>Den Schlüssel unten komplett kopieren.</li>
<li>In Vercel → Settings → Environment Variables eine Variable <code>GOOGLE_DRIVE_REFRESH_TOKEN</code> mit diesem Wert anlegen (Production + Preview).</li>
<li>Neu deployen (Deployments → Redeploy).</li>
</ol>
<textarea readonly onclick="this.select()">${escapeHtml(tokens.refresh_token)}</textarea>
<p><small>Diesen Schlüssel niemandem schicken – er erlaubt Zugriff auf die Dateien, die die Website in deinem Drive anlegt.</small></p>`
    );
  } catch (error) {
    console.error("Drive OAuth callback error:", error);
    return page("Fehler", `<h1>Verbindung fehlgeschlagen</h1><p>${escapeHtml(error instanceof Error ? error.message : String(error))}</p>`, 500);
  }
}
