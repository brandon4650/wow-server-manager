import React from 'react';

const Button = ({ 
  children, 
  variant = 'default', 
  size = 'medium', 
  className = '', 
  ...props 
}) => {
  const baseClasses = "rounded font-medium transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400";
  
  const variantClasses = {
    default: "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600",
    primary: "bg-blue-600 hover:bg-blue-500 text-white",
    secondary: "bg-gray-600 hover:bg-gray-500 text-white",
    gold: "bg-yellow-600 hover:bg-yellow-500 text-white font-bold",
    danger: "bg-red-600 hover:bg-red-500 text-white"
  };
  
  const sizeClasses = {
    small: "px-2 py-1 text-sm",
    medium: "px-4 py-2",
    large: "px-6 py-3 text-lg"
  };
  
  const disabledClasses = props.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  
  const classes = `
    ${baseClasses} 
    ${variantClasses[variant]} 
    ${sizeClasses[size]} 
    ${disabledClasses}
    ${className}
  `;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;