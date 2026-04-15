import type { DraftEvaluation } from "@/lib/types";

const bannedPhrases = [
  "the landscape",
  "delve",
  "robust",
  "cutting-edge",
  "game-changer",
  "exciting",
  "thrilled",
  "proud to announce",
  "it's no secret",
  "in today's fast-paced world"
];

const promotionalPhrases = ["book a demo", "reach out to learn more", "our platform", "our solution"];

function scoreRange(value: number) {
  return Math.max(1, Math.min(5, value));
}

function tokenSet(input: string) {
  return new Set(input.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

function jaccard(a: string, b: string) {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function evaluateDraft(text: string, recentDrafts: string[]): DraftEvaluation {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const hardFails: string[] = [];
  const advisories: string[] = [];

  if (/^i\b/i.test(trimmed)) {
    hardFails.push("Draft opens with 'I'. Start with the idea instead.");
  }

  if (trimmed.includes("—") || trimmed.includes("–")) {
    hardFails.push("Draft contains an em dash or en dash.");
  }

  for (const phrase of bannedPhrases) {
    if (lower.includes(phrase)) {
      hardFails.push(`Draft uses banned phrase: ${phrase}`);
    }
  }

  for (const phrase of promotionalPhrases) {
    if (lower.includes(phrase)) {
      hardFails.push(`Draft sounds promotional: ${phrase}`);
    }
  }

  const paragraphCount = trimmed.split(/\n\s*\n/).filter(Boolean).length;
  if (paragraphCount <= 1) {
    advisories.push("Consider using shorter paragraphs for LinkedIn readability.");
  }

  const stopScroll = scoreRange((/\?|keep hearing|real issue|nobody|thing getting skipped|quarterback/i.test(trimmed) ? 2 : 1) + (trimmed.length > 220 ? 2 : 1));
  const pointOfView = scoreRange((/issue isn't|real constraint|what people miss|what this means/i.test(trimmed) ? 3 : 1) + (lower.includes("because") ? 1 : 0));
  const voice = scoreRange((paragraphCount >= 2 ? 2 : 1) + (!hardFails.length ? 2 : 0));
  const specificity = scoreRange((/\d|cfo|coo|aml|kyc|lp|gp|fund admin/i.test(trimmed) ? 3 : 1) + (trimmed.includes(":") ? 1 : 0));
  const discipline = scoreRange((trimmed.length < 1400 ? 3 : 1) + (paragraphCount <= 6 ? 1 : 0));

  const repetitionWarning = recentDrafts.some((draft) => jaccard(draft, trimmed) > 0.6);
  if (repetitionWarning) {
    advisories.push("Draft looks close to a recent draft. Consider a fresher angle or opening.");
  }

  if (pointOfView <= 2) advisories.push("Point of view feels light. Push the actual take earlier.");
  if (specificity <= 2) advisories.push("Add a more concrete operating implication, quote, or signal.");
  if (stopScroll <= 2) advisories.push("Opening may not be strong enough for a CFO stop-scroll.");

  return {
    pass: hardFails.length === 0,
    hardFails,
    advisories,
    repetitionWarning,
    scores: { stopScroll, pointOfView, voice, specificity, discipline }
  };
}
