import Link from "next/link";
import Button from "../components/Button";
import { Reveal } from "@/components/landing/Reveal";

const CTASection: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
        <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-card px-8 py-12 text-center">
          <h2 className="font-display text-3xl font-bold text-fg md:text-4xl">
            Upload images. See which option people choose.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-fg-muted">
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
            <div className="rounded-xl border border-line bg-subtle px-4 py-3">
              <p className="text-sm text-fg-muted">Task</p>
              <p className="mt-1 font-medium text-fg">Image comparison</p>
            </div>
            <div className="rounded-xl border border-line bg-subtle px-4 py-3">
              <p className="text-sm text-fg-muted">Result</p>
              <p className="mt-1 font-medium text-fg">Winner and export</p>
            </div>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
};

export default CTASection;
