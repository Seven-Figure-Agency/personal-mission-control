import { getAllMeetings } from "@/lib/queries";
import MeetingsClient from "@/components/meetings/MeetingsClient";

export default function MeetingsPage() {
  const meetings = getAllMeetings();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-heading font-bold text-text-primary">Meetings</h2>
        <p className="text-xs text-text-tertiary font-ui mt-0.5">{meetings.length} meetings</p>
      </div>
      <MeetingsClient initialMeetings={meetings} />
    </div>
  );
}
