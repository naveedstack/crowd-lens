import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div 
      className={`
        bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700
        ${hover ? 'hover:border-violet-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;