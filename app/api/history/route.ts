import { NextResponse } from "next/server";
import { listHistory } from "@/lib/db";

export async function GET() {
  try {
    const history = await listHistory(12);
    return NextResponse.json({ history });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
