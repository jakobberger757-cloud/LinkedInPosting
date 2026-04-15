import { NextResponse } from "next/server";
import { insertFeedback } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const draftId = String(body.draftId || "");
    const vote = body.vote === "down" ? "down" : "up";

    if (!draftId) {
      return NextResponse.json({ error: "draftId is required." }, { status: 400 });
    }

    const feedback = await insertFeedback(draftId, vote);
    return NextResponse.json({ feedback });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
