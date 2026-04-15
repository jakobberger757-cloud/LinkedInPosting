type SourceInputResult = {
  title: string;
  url: string | null;
  sourceText: string;
  sourceType: "notes" | "url" | "mixed";
};

const urlRegex = /(https?:\/\/[^\s]+)/g;

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchTextFromUrl(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { "user-agent": "Mozilla/5.0" } });
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
    const html = await response.text();
    return stripHtml(html).slice(0, 12000);
  } finally {
    clearTimeout(timeout);
  }
}

export async function collectSourceText(rawInput: string): Promise<SourceInputResult> {
  const urls = rawInput.match(urlRegex) ?? [];
  const noteText = rawInput.replace(urlRegex, " ").trim();
  const fetchedTexts = await Promise.all(urls.slice(0, 3).map(fetchTextFromUrl).map((p) => p.catch(() => "")));
  const mergedFetched = fetchedTexts.filter(Boolean).join("\n\n");
  const sourceText = [noteText, mergedFetched].filter(Boolean).join("\n\n").trim();

  if (!sourceText) {
    throw new Error("Please paste notes or at least one reachable URL.");
  }

  const sourceType = urls.length > 0 && noteText ? "mixed" : urls.length > 0 ? "url" : "notes";
  const title = urls[0] ? new URL(urls[0]).hostname.replace(/^www\./, "") : "Raw notes";

  return {
    title,
    url: urls[0] ?? null,
    sourceText,
    sourceType
  };
}
