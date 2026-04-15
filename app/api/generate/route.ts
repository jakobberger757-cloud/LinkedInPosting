import { NextResponse } from "next/server";
import { runDraftRegenerationFlow, runFullGenerationFlow } from "@/lib/pipeline";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = body.mode || "full";

    if (mode === "regenerate_drafts") {
      const sourceId = String(body.sourceId || "");
      const angleId = String(body.angleId || "");
      if (!sourceId || !angleId) {
        return NextResponse.json({ error: "sourceId and angleId are required." }, { status: 400 });
      }
      const result = await runDraftRegenerationFlow(sourceId, angleId);
      return NextResponse.json(result);
    }

    const input = String(body.input || "").trim();
    if (!input) {
      return NextResponse.json({ error: "Please paste notes or a URL." }, { status: 400 });
    }

    const result = await runFullGenerationFlow(input);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
