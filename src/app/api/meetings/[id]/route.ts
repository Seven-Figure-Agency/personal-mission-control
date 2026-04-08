import { NextRequest, NextResponse } from "next/server";
import { getMeetingById, updateMeeting, deleteMeeting } from "@/lib/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = getMeetingById(Number(id));
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(meeting);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  updateMeeting(Number(id), body);
  const updated = getMeetingById(Number(id));
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteMeeting(Number(id));
  return NextResponse.json({ ok: true });
}
