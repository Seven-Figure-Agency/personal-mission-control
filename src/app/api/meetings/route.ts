import { NextRequest, NextResponse } from "next/server";
import { getAllMeetings, createMeeting } from "@/lib/queries";

export async function GET() {
  const meetings = getAllMeetings();
  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.meeting_title) {
    return NextResponse.json({ error: "meeting_title is required" }, { status: 400 });
  }
  const id = createMeeting(body);
  return NextResponse.json({ id }, { status: 201 });
}
