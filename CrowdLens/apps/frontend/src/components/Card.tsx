import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = "", hover = false }) => {
  return (
    <div
      className={`rounded-2xl border border-line bg-card p-6 ${
        hover ? "landing-card" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
