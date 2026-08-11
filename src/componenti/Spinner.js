import React from 'react';

export default function Spinner({ size = 8, className = '' }) {
  return (
    <div className={`flex justify-center py-12 ${className}`}>
      <div className={`w-${size} h-${size} border-4 border-ama-500 border-t-transparent rounded-full animate-spin`} />
    </div>
  );
}
