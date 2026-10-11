import Link from "next/link";
import Button from "../components/Button";

const CTASection: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 px-8 py-12 text-center">
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Upload images. See which option people choose.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Image comparison tasks. Winner and export when the batch fills. Settled in Devnet SOL.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/creator/new">
              <Button size="lg">Create a task</Button>
            </Link>
            <Link href="/validators">
              <Button variant="outline" size="lg">
                Vote as a validator
              </Button>
            </Link>
          </div>
          <div className="mx-auto mt-10 grid max-w-lg grid-cols-1 gap-4 text-left sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <p className="text-sm text-slate-500">Task</p>
              <p className="mt-1 font-medium text-white">Image comparison</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <p className="text-sm text-slate-500">Result</p>
              <p className="mt-1 font-medium text-white">Winner and export</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
