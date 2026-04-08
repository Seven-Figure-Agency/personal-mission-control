import { NextRequest, NextResponse } from "next/server";
import { searchAll } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json([]);
  const results = searchAll(q);
  return NextResponse.json(results);
}
