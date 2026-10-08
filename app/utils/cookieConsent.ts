export type CookieConsent = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

export const getCookieConsent = (): CookieConsent | null => {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("cookieConsent");
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const hasCookieConsent = (type: keyof CookieConsent): boolean => {
  const consent = getCookieConsent();
  return consent?.[type] ?? false;
};

export const isConsentGiven = (): boolean => {
  const stored = localStorage.getItem("cookieConsent");
  return stored !== null;
};

export const getConsentDate = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cookieConsentDate");
};

export const resetCookieConsent = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("cookieConsent");
  localStorage.removeItem("cookieConsentDate");
};
