import { promises as fs } from "fs";
import path from "path";

const fallbackCore = {
  voice_profile: `Write like Jakob Berger: warm but sharp, peer-to-peer, grounded, specific, not promotional, and never generic finance slop. Never start with I. No em dashes. Prefer one clear idea, short paragraphs, real operational implications, and a credible point of view over article summary.`,
  angle_generator: `Generate angles that surface the hidden burden, what operators underestimate, what this means for CFOs or COOs, and where technology helps versus where judgment still sits.`,
  post_rubric: `Good drafts feel specific, thoughtful, and useful to private-market operators. They should sound like an informed peer, not a consultant or company page.`,
  anti_repetition_rules: `Avoid repeating the same thesis, hook, or opening structure from recent drafts.`,
  orchestration_principles: `Behave like an editorial partner, not a template machine. Keep quality fixed and expression flexible.`
};

const corePaths = [
  ["voice_profile", "skills/linkedin-posting/resources/voice_profile.md"],
  ["angle_generator", "skills/linkedin-posting/resources/angle_generator.md"],
  ["post_rubric", "skills/linkedin-posting/resources/post_rubric.md"],
  ["anti_repetition_rules", "skills/linkedin-posting/resources/anti_repetition_rules.md"],
  ["orchestration_principles", "skills/linkedin-posting/resources/orchestration_principles.md"]
] as const;

export async function loadSkillCore() {
  const blocks: string[] = [];

  for (const [label, relativePath] of corePaths) {
    const absolutePath = path.join(process.cwd(), relativePath);
    try {
      const content = await fs.readFile(absolutePath, "utf8");
      blocks.push(`## ${label}\n${content}`);
    } catch {
      blocks.push(`## ${label}\n${fallbackCore[label]}`);
    }
  }

  return blocks.join("\n\n");
}
