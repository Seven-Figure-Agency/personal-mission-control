import { getAllDecisions } from "@/lib/queries";
import DecisionsClient from "@/components/decisions/DecisionsClient";

export default function DecisionsPage() {
  const decisions = getAllDecisions();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-heading font-bold text-text-primary">Decisions</h2>
        <p className="text-xs text-text-tertiary font-ui mt-0.5">
          {decisions.filter(d => d.status === "Active").length} active · {decisions.length} total
        </p>
      </div>
      <DecisionsClient initialDecisions={decisions} />
    </div>
  );
}
