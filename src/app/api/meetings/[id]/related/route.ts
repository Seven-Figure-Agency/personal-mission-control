import { NextRequest, NextResponse } from "next/server";
import { getTasksByMeeting, getDecisionsByMeeting } from "@/lib/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meetingId = Number(id);
  return NextResponse.json({
    tasks: getTasksByMeeting(meetingId),
    decisions: getDecisionsByMeeting(meetingId),
  });
}
