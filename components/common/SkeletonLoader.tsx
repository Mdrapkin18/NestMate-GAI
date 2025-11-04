import React from 'react';

export const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse ${className}`} />
  );
};
