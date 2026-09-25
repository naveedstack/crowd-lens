import { Appbar } from "../components/Appbar";
import { Upload } from "../components/Upload";

export default function NewTaskPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <Appbar />
      <Upload />
    </div>
  );
}
