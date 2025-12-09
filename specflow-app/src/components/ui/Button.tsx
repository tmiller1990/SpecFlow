import React from 'react';

interface ButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
    disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
    children, 
    onClick, 
    className = '', 
    disabled = false 
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
            disabled 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
        } ${className}`}
    >
        {children}
    </button>
);
