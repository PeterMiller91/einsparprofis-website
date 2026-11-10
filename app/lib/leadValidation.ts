// Validation shared by the lead forms – same rules as the PHP endpoints

export const isNameValid = (name: string) => /^[a-zA-ZäöüßÄÖÜ\s-]{2,}$/.test(name.trim());
export const isPlzValid = (plz: string) => /^[1-9]\d{4}$/.test(plz);

/** "0151 1234567", "0049…", "49…" or "+49…" -> "+491511234567" */
export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (input.trim().startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+49${digits.slice(1)}`;
  if (digits.startsWith("49")) return `+${digits}`;
  return `+49${digits}`;
}

export const isPhoneValid = (tel: string) => {
  const normalized = normalizePhone(tel);
  const digits = normalized.replace(/\D/g, "");
  return normalized.startsWith("+49") && digits.length >= 11 && digits.length <= 13;
};
