
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const Icon: React.FC<React.PropsWithChildren<IconProps>> = ({ children, className, ...props }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={1.5} 
      stroke="currentColor" 
      className={`w-6 h-6 ${className}`}
      {...props}
    >
      {children}
    </svg>
  );
};
