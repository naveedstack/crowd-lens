import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  onClick,
}) => {
  const baseStyles = "font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-lg shadow-violet-600/20 focus:ring-violet-500",
    secondary: "bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/20 focus:ring-cyan-500",
    outline: "bg-transparent border-2 border-slate-700 hover:border-slate-500 text-white focus:ring-slate-500",
    text: "bg-transparent text-white hover:bg-slate-800 focus:ring-slate-500",
  };
  
  const sizes = {
    sm: "text-xs px-3 py-2",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3",
  };
  
  const widthClass = fullWidth ? "w-full" : "";
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;