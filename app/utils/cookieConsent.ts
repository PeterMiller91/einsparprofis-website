export interface ConsentData {
  v: number;
  necessary: boolean;
  statistics: boolean;
  marketing: boolean;
  ts: number;
}

export const getCookieConsent = (): ConsentData | null => {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("ep_consent");
  if (!stored) return null;

  try {
    return JSON.parse(stored) as ConsentData;
  } catch {
    return null;
  }
};

export const hasCookieConsent = (category: "statistics" | "marketing"): boolean => {
  const consent = getCookieConsent();
  return consent?.[category] ?? false;
};

export const isConsentGiven = (): boolean => {
  const stored = localStorage.getItem("ep_consent");
  return stored !== null;
};

export const getConsentTimestamp = (): number | null => {
  const consent = getCookieConsent();
  return consent?.ts ?? null;
};

export const resetCookieConsent = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("ep_consent");
};
