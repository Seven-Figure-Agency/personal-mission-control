import { NextRequest, NextResponse } from "next/server";
import { getRockById, updateRock, deleteRock } from "@/lib/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rock = getRockById(Number(id));
  if (!rock) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rock);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  updateRock(Number(id), body);
  const updated = getRockById(Number(id));
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteRock(Number(id));
  return NextResponse.json({ ok: true });
}
