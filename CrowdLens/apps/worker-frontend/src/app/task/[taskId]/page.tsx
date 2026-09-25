import { Appbar } from "@/components/Appbar";
import { VoteTask } from "@/components/VoteTask";

export default function VoteTaskPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <Appbar />
      <VoteTask />
    </div>
  );
}
