import { NextRequest, NextResponse } from "next/server";
import { getAllDecisions, createDecision } from "@/lib/queries";

export async function GET() {
  const decisions = getAllDecisions();
  return NextResponse.json(decisions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.decision_title) {
    return NextResponse.json({ error: "decision_title is required" }, { status: 400 });
  }
  const id = createDecision(body);
  return NextResponse.json({ id }, { status: 201 });
}
