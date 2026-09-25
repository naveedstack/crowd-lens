import React from 'react';
import Button from '../components/Button';

const CTASection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-30"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600 rounded-full filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-600 rounded-full filter blur-3xl opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
            Ready to Boost Your <span className="bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">Content Performance</span>?
          </h2>
          
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Upload your images, pay per vote, and see which option people actually choose.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
            <a href="/dashboard/new">
              <Button size="lg" className="px-8">
                Create a task
              </Button>
            </a>
            {process.env.NEXT_PUBLIC_WORKER_URL ? (
              <a href={process.env.NEXT_PUBLIC_WORKER_URL}>
                <Button variant="outline" size="lg">
                  Vote as a validator
                </Button>
              </a>
            ) : null}
          </div>

          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Price</p>
              <p className="mt-1 font-medium text-white">Pay per vote</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Task</p>
              <p className="mt-1 font-medium text-white">Image comparison</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Result</p>
              <p className="mt-1 font-medium text-white">Winner and export</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;