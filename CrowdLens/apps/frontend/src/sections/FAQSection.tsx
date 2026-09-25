"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';

interface FAQItem {
  question: string;
  answer: string;
  isOpen?: boolean;
}

const FAQSection: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      question: "How does CrowdLens collect feedback from real users?",
      answer: "CrowdLens leverages the UpRock DePIN network, a decentralized community of real users who provide genuine feedback on your content. These users are verified through blockchain technology and incentivized to give honest opinions. You get data from actual people, not algorithms or bots.",
      isOpen: false,
    },
    {
      question: "How long does it take to get results?",
      answer: "Most tests deliver complete results within 2-4 hours, depending on your target audience specifications. Our network includes users worldwide, so you can get feedback 24/7. For highly specific demographics, it might take slightly longer.",
      isOpen: false,
    },
    {
      question: "How is a task priced?",
      answer: "You pay a fixed amount of SOL per vote and choose a batch size. The whole payment is split across the validators who complete that batch. There is no monthly subscription.",
      isOpen: false,
    },
    {
      question: "What do I get when the batch finishes?",
      answer: "You see the vote split, the winning image, and how long the batch took. You can export the votes as CSV or JSON. CrowdLens does not invent click-through rates.",
      isOpen: false,
    },
    {
      question: "Is my content secure when I upload it for testing?",
      answer: "Yes, we take security seriously. Your thumbnails are encrypted, access-controlled, and only shown to users participating in your specific test. We also have built-in protections against screenshot capturing and unauthorized downloading.",
      isOpen: false,
    },
    {
      question: "Can I test other content besides thumbnails?",
      answer: "Yes! While thumbnails are our most popular test type, you can also test video titles, descriptions, channel banners, and even short intro clips to optimize all aspects of your content strategy.",
      isOpen: false,
    },
  ]);

  const toggleFAQ = (index: number) => {
    setFaqs(
      faqs.map((faq, i) => {
        if (i === index) {
          return { ...faq, isOpen: !faq.isOpen };
        }
        return faq;
      })
    );
  };

  return (
    <section id="faq" className="py-20 bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about CrowdLens and optimizing your content."
          centered
          light
        />

        <div className="max-w-3xl mx-auto mt-10">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="mb-4 border-b border-slate-800 pb-4 last:border-0 last:pb-0"
            >
              <button
                className="flex justify-between items-center w-full text-left focus:outline-none group"
                onClick={() => toggleFAQ(index)}
              >
                <h3 className="text-xl font-medium text-white">{faq.question}</h3>
                <span className="ml-4 flex-shrink-0 p-1 rounded-full group-hover:bg-slate-800 transition-colors">
                  {faq.isOpen ? (
                    <ChevronUp className="h-6 w-6 text-violet-400" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-slate-400" />
                  )}
                </span>
              </button>
              <div 
                className={`mt-2 text-slate-400 transition-all duration-300 overflow-hidden ${
                  faq.isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="py-2">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-400 mb-6">
            Still have questions? We are here to help!
          </p>
          <a
            href="#"
            className="inline-flex items-center text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 px-6 py-3 rounded-lg font-medium shadow-lg shadow-violet-600/20 transition-all duration-200"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;