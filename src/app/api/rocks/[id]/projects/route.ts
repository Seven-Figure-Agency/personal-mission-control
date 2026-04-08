import { NextRequest, NextResponse } from "next/server";
import { getProjectsByRock } from "@/lib/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(getProjectsByRock(Number(id)));
}
