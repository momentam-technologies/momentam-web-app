import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center min-h-screen w-full">
      <div className="relative">
        <div className="absolute inset-0 w-16 h-16 border-4 border-t-transparent border-neutral-800 dark:border-white rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-b-transparent border-neutral-800 dark:border-white rounded-full animate-spin delay-150"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-l-transparent border-neutral-800 dark:border-white rounded-full animate-spin delay-300"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
