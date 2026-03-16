/**
 * SVG gradient definitions for quantum navy and cyan gradients.
 * Include this component in Recharts charts that need gradients.
 */

import React from 'react';

export const GradientDefs: React.FC = () => {
  return (
    <defs>
      {/* Navy Gradient */}
      <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#334e68" stopOpacity={0.8} />
        <stop offset="100%" stopColor="#334e68" stopOpacity={0.2} />
      </linearGradient>

      {/* Cyan Gradient */}
      <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.2} />
      </linearGradient>

      {/* Quantum Gradient (Navy to Cyan) */}
      <linearGradient id="quantumGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#334e68" stopOpacity={0.8} />
        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.8} />
      </linearGradient>

      {/* Bar Gradient (vertical) */}
      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#334e68" stopOpacity={0.8} />
        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.8} />
      </linearGradient>

      {/* Area Chart Navy Gradient */}
      <linearGradient id="areaPurpleGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#334e68" stopOpacity={0.2} />
        <stop offset="100%" stopColor="#334e68" stopOpacity={0} />
      </linearGradient>

      {/* Area Chart Cyan Gradient */}
      <linearGradient id="areaCyanGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
      </linearGradient>

      {/* Radial Gradient for circular charts */}
      <radialGradient id="radialQuantumGradient" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#334e68" stopOpacity={0.8} />
        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.8} />
      </radialGradient>
    </defs>
  );
};

export default GradientDefs;

