import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = "", hover = false }) => {
  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900 p-6 ${
        hover ? "transition-colors hover:border-violet-500/40" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
