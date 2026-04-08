import { NextRequest, NextResponse } from "next/server";
import { getDecisionById, updateDecision, deleteDecision } from "@/lib/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decision = getDecisionById(Number(id));
  if (!decision) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(decision);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  updateDecision(Number(id), body);
  const updated = getDecisionById(Number(id));
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteDecision(Number(id));
  return NextResponse.json({ ok: true });
}
