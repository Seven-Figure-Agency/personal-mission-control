import { NextRequest, NextResponse } from "next/server";
import { getAllRocks, createRock, updateRock } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(getAllRocks());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.rock_name) {
    return NextResponse.json({ error: "rock_name required" }, { status: 400 });
  }
  const id = createRock(body);
  const rock = getAllRocks().find((r) => r.id === id);
  return NextResponse.json(rock, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  updateRock(body.id, body);
  return NextResponse.json({ ok: true });
}
