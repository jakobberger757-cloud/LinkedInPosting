import { insertAngles, insertDrafts, insertSource, getAngleById, getSourceById, recentDraftTexts } from "@/lib/db";
import { evaluateDraft } from "@/lib/evaluation";
import { generateObject } from "@/lib/llm";
import { collectSourceText } from "@/lib/source";
import { loadSkillCore } from "@/lib/skills";
import type { FullGenerationResponse } from "@/lib/types";

type SummaryOutput = { summary: string };
type AnglesOutput = { angles: Array<{ text: string; audienceLens: string; suggestedFormat: string; confidence: number }> };
type DraftsOutput = { drafts: Array<{ label: string; text: string }> };

async function summarizeSource(sourceText: string, guidance: string) {
  const system = `${guidance}\n\nReturn JSON only.`;
  const user = `Summarize this source for Jakob's LinkedIn drafting app. Keep it tight, specific, and focused on the operating implication.\n\nReturn JSON like: {\"summary\":\"...\"}\n\nSOURCE:\n${sourceText}`;
  const result = await generateObject<SummaryOutput>({ system, user, temperature: 0.4 });
  return result.summary.trim();
}

async function generateAngles(summary: string, guidance: string) {
  const system = `${guidance}\n\nReturn JSON only.`;
  const user = `Generate 3 to 5 distinct LinkedIn post angles from this summary. Prioritize hidden burden, operator implication, what buyers underestimate, and where judgment still sits.\n\nReturn JSON like {\"angles\":[{\"text\":\"...\",\"audienceLens\":\"CFO\",\"suggestedFormat\":\"original post\",\"confidence\":4}]}\n\nSUMMARY:\n${summary}`;
  const result = await generateObject<AnglesOutput>({ system, user, temperature: 0.8 });
  return result.angles.slice(0, 5);
}

async function generateDrafts(summary: string, angleText: string, guidance: string) {
  const system = `${guidance}\n\nReturn JSON only.`;
  const user = `Write exactly 2 LinkedIn draft variants in Jakob's voice for this angle. One should be more measured, the other a bit sharper. Never start with I. No em dashes. Sound like a credible peer with a real take, not a template.\n\nReturn JSON like {\"drafts\":[{\"label\":\"Measured\",\"text\":\"...\"},{\"label\":\"Sharper\",\"text\":\"...\"}]}\n\nSUMMARY:\n${summary}\n\nANGLE:\n${angleText}`;
  const result = await generateObject<DraftsOutput>({ system, user, temperature: 0.85 });
  return result.drafts.slice(0, 2);
}

export async function runFullGenerationFlow(input: string): Promise<FullGenerationResponse> {
  const guidance = await loadSkillCore();
  const sourceInput = await collectSourceText(input);
  const summary = await summarizeSource(sourceInput.sourceText, guidance);
  const source = await insertSource({
    title: sourceInput.title,
    url: sourceInput.url,
    rawInput: input,
    sourceText: sourceInput.sourceText,
    summary,
    sourceType: sourceInput.sourceType
  });

  const angleSeed = await generateAngles(summary, guidance);
  const angles = await insertAngles(source.id, angleSeed.map((angle) => ({
    text: angle.text,
    audienceLens: angle.audienceLens || "CFO / COO",
    suggestedFormat: angle.suggestedFormat || "original post",
    confidence: Math.max(1, Math.min(5, Math.round(angle.confidence || 3)))
  })));

  const chosenAngle = angles[0];
  const draftsSeed = await generateDrafts(summary, chosenAngle.text, guidance);
  const recentDrafts = await recentDraftTexts();
  const drafts = await insertDrafts(chosenAngle.id, draftsSeed.map((draft) => ({
    label: draft.label,
    text: draft.text,
    evaluation: evaluateDraft(draft.text, recentDrafts)
  })));

  return { source, angles, selectedAngleId: chosenAngle.id, drafts };
}

export async function runDraftRegenerationFlow(sourceId: string, angleId: string): Promise<FullGenerationResponse> {
  const guidance = await loadSkillCore();
  const source = await getSourceById(sourceId);
  const angle = await getAngleById(angleId);

  if (!source || !angle || angle.sourceId !== source.id) {
    throw new Error("Source or angle not found.");
  }

  const draftsSeed = await generateDrafts(source.summary, angle.text, guidance);
  const recentDrafts = await recentDraftTexts();
  const drafts = await insertDrafts(angle.id, draftsSeed.map((draft) => ({
    label: draft.label,
    text: draft.text,
    evaluation: evaluateDraft(draft.text, recentDrafts)
  })));

  return { source, angles: [angle], selectedAngleId: angle.id, drafts };
}
