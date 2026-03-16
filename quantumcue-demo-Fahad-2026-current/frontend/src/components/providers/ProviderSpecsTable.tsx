import React from 'react';
import { Cpu } from 'lucide-react';
import type { ProviderHardwareSpecs } from '../../api/endpoints/providers';

interface ProviderSpecsTableProps {
  specs: ProviderHardwareSpecs;
}

export const ProviderSpecsTable: React.FC<ProviderSpecsTableProps> = ({ specs }) => {
  const formatValue = (value: number | string | null, unit?: string): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      if (unit === 'K' && value < 1) {
        return `${(value * 1000).toFixed(1)} mK`;
      }
      if (unit === 'μs' && value >= 1000000) {
        return `${(value / 1000000).toFixed(1)} s`;
      }
      if (unit === 'μs' && value >= 1000) {
        return `${(value / 1000).toFixed(1)} ms`;
      }
      if (unit === 'ns' && value >= 1000) {
        return `${(value / 1000).toFixed(1)} μs`;
      }
      if (unit === '%') {
        return `${(value * 100).toFixed(2)}%`;
      }
      return `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`;
    }
    return String(value);
  };

  const specRows = [
    { label: 'Level Count', value: specs.qubit_count, unit: '' },
    { label: 'Qubit Type', value: specs.qubit_type, unit: '' },
    { label: 'Connectivity', value: specs.connectivity, unit: '' },
    // { label: 'Single-Qubit Gate Fidelity', value: specs.gate_fidelity_1q, unit: '%' },
    // { label: 'Two-Qubit Gate Fidelity', value: specs.gate_fidelity_2q, unit: '%' },
    // { label: 'T1 Coherence Time', value: specs.coherence_time_t1_us, unit: 'μs' },
    // { label: 'T2 Coherence Time', value: specs.coherence_time_t2_us, unit: 'μs' },
    // { label: 'Gate Time', value: specs.gate_time_ns, unit: 'ns' },
    { label: 'Processor', value: specs.processor_name, unit: '' },
    // { label: 'Generation', value: specs.processor_generation, unit: '' },
    { label: 'Operating Temperature', value: "ROOM TEMPERATURE", unit: '' },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-quantum-500/30 transition-all duration-300 group">
      <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-navy-900">
        <Cpu size={200} />
      </div>

      <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-quantum-600">
          <Cpu size={20} />
        </div>
        Hardware Specifications
      </h3>
      <div className="relative z-10 divide-y divide-gray-100">
        {specRows.map((row) => (
          <div key={row.label} className="flex justify-between py-3 hover:bg-gray-50 transition-colors">
            <span className="text-sm text-gray-600">{row.label}</span>
            <span className="text-gray-900 font-mono text-sm">
              {formatValue(row.value, row.unit)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProviderSpecsTable;
