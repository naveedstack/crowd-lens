"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Users, BarChart3, Award } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const HowItWorksSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const steps: Step[] = [
    {
      icon: <Upload className="h-6 w-6" />,
      title: "1. Upload Your Thumbnails",
      description: "Upload multiple versions of your thumbnails or poster designs to the CrowdLens platform.",
      color: "from-violet-500 to-violet-600"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "2. Collect Real Feedback",
      description: "Our decentralized network of viewers provides honest feedback on which thumbnail would make them click.",
      color: "from-cyan-500 to-cyan-600"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "3. Analyze the Results",
      description: "View detailed analytics showing which thumbnails performed best and with which demographics.",
      color: "from-fuchsia-500 to-fuchsia-600"
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "4. Implement & Succeed",
      description: "Use the winning thumbnail for your content and watch your engagement metrics improve.",
      color: "from-emerald-500 to-emerald-600"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 to-transparent opacity-30"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          title="How CrowdLens Works"
          subtitle="A simple four-step process to optimize your content with real human feedback."
          centered
          light
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-16">
          {/* Left side: Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`flex items-start p-6 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeStep === index 
                    ? 'bg-slate-800/60 border border-slate-700 shadow-lg transform scale-105' 
                    : 'hover:bg-slate-800/30'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div className={`shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center mr-4 shadow-lg`}>
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right side: Animated illustration */}
          <div className="relative h-80 md:h-96 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 blur-3xl opacity-30 rounded-full"></div>
            
            <div className="relative w-full max-w-md h-full">
              {/* Step 1 Visualization */}
              <div className={`absolute inset-0 transition-all duration-500 ${
                activeStep === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}>
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl backdrop-blur-sm h-full flex flex-col">
                  <div className="border-b border-slate-700 pb-4 mb-4 flex items-center">
                    <Upload className="h-5 w-5 text-violet-500 mr-2" />
                    <h4 className="text-lg font-semibold text-white">Upload Thumbnails</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div className="border border-dashed border-slate-600 rounded-lg flex items-center justify-center h-32">
                      <div className="flex flex-col items-center text-sm text-slate-400">
                        <Upload className="h-5 w-5 mb-2" />
                        <span>Thumbnail A</span>
                      </div>
                    </div>
                    <div className="border border-dashed border-slate-600 rounded-lg flex items-center justify-center h-32">
                      <div className="flex flex-col items-center text-sm text-slate-400">
                        <Upload className="h-5 w-5 mb-2" />
                        <span>Thumbnail B</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
                        <div className="bg-violet-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 Visualization */}
              <div className={`absolute inset-0 transition-all duration-500 ${
                activeStep === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}>
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl backdrop-blur-sm h-full flex flex-col">
                  <div className="border-b border-slate-700 pb-4 mb-4 flex items-center">
                    <Users className="h-5 w-5 text-cyan-500 mr-2" />
                    <h4 className="text-lg font-semibold text-white">Collecting Feedback</h4>
                  </div>
                  <div className="flex flex-col space-y-3 flex-1">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs mr-2">M</div>
                      <div className="bg-slate-700 rounded-lg p-2 text-sm text-white max-w-[80%]">
                        I prefer the second thumbnail, more eye-catching!
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs mr-2">K</div>
                      <div className="bg-slate-700 rounded-lg p-2 text-sm text-white max-w-[80%]">
                        The first one communicates the topic better.
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs mr-2">S</div>
                      <div className="bg-slate-700 rounded-lg p-2 text-sm text-white max-w-[80%]">
                        Definitely would click on thumbnail A.
                      </div>
                    </div>
                    <div className="text-center text-slate-400 text-sm pt-4">
                      <div className="animate-pulse flex justify-center">
                        <div className="h-2 w-2 bg-cyan-500 rounded-full mr-1"></div>
                        <div className="h-2 w-2 bg-cyan-500 rounded-full mr-1"></div>
                        <div className="h-2 w-2 bg-cyan-500 rounded-full"></div>
                      </div>
                      <div className="mt-1">12 people viewing now</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 Visualization */}
              <div className={`absolute inset-0 transition-all duration-500 ${
                activeStep === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}>
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl backdrop-blur-sm h-full flex flex-col">
                  <div className="border-b border-slate-700 pb-4 mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 text-fuchsia-500 mr-2" />
                    <h4 className="text-lg font-semibold text-white">Analytics Dashboard</h4>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">64%</div>
                        <div className="text-xs text-slate-400">Thumbnail A</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">36%</div>
                        <div className="text-xs text-slate-400">Thumbnail B</div>
                      </div>
                    </div>
                    <div className="bg-slate-700 h-4 rounded-full mb-4 flex overflow-hidden">
                      <div className="bg-fuchsia-500 h-full" style={{ width: '64%' }}></div>
                      <div className="bg-cyan-500 h-full" style={{ width: '36%' }}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-700 p-3 rounded-lg">
                        <div className="text-xs text-slate-400 mb-1">Votes in</div>
                        <div className="text-sm font-medium text-white">64 / 100</div>
                      </div>
                      <div className="bg-slate-700 p-3 rounded-lg">
                        <div className="text-xs text-slate-400 mb-1">Leading image</div>
                        <div className="text-sm font-medium text-white">Thumbnail A</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 Visualization */}
              <div className={`absolute inset-0 transition-all duration-500 ${
                activeStep === 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}>
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl backdrop-blur-sm h-full flex flex-col">
                  <div className="border-b border-slate-700 pb-4 mb-4 flex items-center">
                    <Award className="h-5 w-5 text-emerald-500 mr-2" />
                    <h4 className="text-lg font-semibold text-white">Implementation Results</h4>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <img 
                          src="https://images.pexels.com/photos/2263436/pexels-photo-2263436.jpeg" 
                          alt="Winning thumbnail" 
                          className="rounded-lg w-full max-w-[220px] h-auto shadow-lg border-2 border-emerald-500" 
                        />
                        <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-bold rounded-full h-8 w-8 flex items-center justify-center">
                          #1
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">Winning option</div>
                        <div className="font-medium text-emerald-400">Thumbnail A</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">Vote share</div>
                        <div className="font-medium text-white">64%</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">Export</div>
                        <div className="font-medium text-white">CSV or JSON</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;