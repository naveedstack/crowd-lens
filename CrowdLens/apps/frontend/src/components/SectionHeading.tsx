import React from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle: string;
  centered?: boolean;
  light?: boolean;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  centered = false,
  light = false,
}) => {
  return (
    <div className={`mb-12 ${centered ? 'text-center' : ''}`}>
      <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${light ? 'text-white' : 'bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent'}`}>
        {title}
      </h2>
      <p className={`text-lg ${light ? 'text-slate-300' : 'text-slate-400'} max-w-2xl ${centered ? 'mx-auto' : ''}`}>
        {subtitle}
      </p>
    </div>
  );
};

export default SectionHeading;