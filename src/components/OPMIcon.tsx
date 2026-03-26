import React from 'react';

export default function OPMIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Object (Rectangle) */}
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      
      {/* State 1 (Small rounded rect) */}
      <rect x="5" y="14" width="4" height="3" rx="1" fill="currentColor" opacity="0.4" />
      
      {/* State 2 (Small rounded rect) */}
      <rect x="15" y="14" width="4" height="3" rx="1" fill="currentColor" />
      
      {/* Process (Ellipse) */}
      <ellipse cx="12" cy="10" rx="5" ry="3" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Transformation Path (Arrow) */}
      <path 
        d="M 7 14 C 7 10, 9 10, 10 10" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeDasharray="2 1"
      />
      <path 
        d="M 14 10 C 15 10, 17 10, 17 14" 
        stroke="currentColor" 
        strokeWidth="1" 
        markerEnd="url(#arrowhead-icon)"
      />
      
      <defs>
        <marker 
          id="arrowhead-icon" 
          viewBox="0 0 10 10" 
          refX="9" 
          refY="5" 
          markerWidth="4" 
          markerHeight="4" 
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  );
}
