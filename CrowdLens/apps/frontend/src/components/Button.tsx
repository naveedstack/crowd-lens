import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  onClick,
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40";

  const variants = {
    primary: "bg-violet-500 hover:bg-violet-600 text-white",
    secondary: "bg-cyan-500 hover:bg-cyan-400 text-slate-950",
    outline: "bg-transparent border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-white",
    text: "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white",
  };

  const sizes = {
    sm: "text-xs px-3 py-2",
    md: "text-sm px-4 py-2.5",
    lg: "text-base px-6 py-3",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
