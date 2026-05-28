import { formatISO, isValid } from "date-fns";

function toIsoDate(year: number, month: number, day: number): string | null {
  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(fullYear, month - 1, day);
  if (date.getFullYear() !== fullYear || date.getMonth() !== month - 1 || date.getDate() !== day || !isValid(date)) {
    return null;
  }
  return formatISO(date, { representation: "date" });
}

export function parseJapaneseExpiryDate(text: string): string | null {
  const normalized = text.normalize("NFKC");
  const match = normalized.match(/(\d{2,4})\s*(?:年|[./-])\s*(\d{1,2})\s*(?:月|[./-])\s*(\d{1,2})\s*(?:日)?/);
  if (!match) return null;
  return toIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function extractExpiryDateCandidates(text: string): string[] {
  const normalized = text.normalize("NFKC");
  const matcher = /(\d{2,4})\s*(?:年|[./-])\s*(\d{1,2})\s*(?:月|[./-])\s*(\d{1,2})\s*(?:日)?/g;
  const dates = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(normalized)) !== null) {
    const date = toIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));
    if (date) dates.add(date);
  }

  return Array.from(dates).sort();
}

export async function readExpiryTextFromImage(_imageUri?: string): Promise<string> {
  return "";
}
