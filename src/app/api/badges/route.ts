import { NextResponse } from "next/server";
import { getOverdueTasks } from "@/lib/queries";

export const dynamic = "force-dynamic";

export function GET() {
  const overdue = getOverdueTasks();
  const badges: Record<string, number> = {};
  if (overdue.length > 0) badges["/tasks"] = overdue.length;
  return NextResponse.json(badges);
}
