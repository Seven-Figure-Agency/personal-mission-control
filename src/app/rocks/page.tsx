import { getAllRocks } from "@/lib/queries";
import RocksClient from "@/components/rocks/RocksClient";

export default function RocksPage() {
  const rocks = getAllRocks();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-heading font-bold text-text-primary">Rocks</h2>
        <p className="text-xs text-text-tertiary font-ui mt-0.5">Quarterly goals</p>
      </div>
      <RocksClient initialRocks={rocks} />
    </div>
  );
}
