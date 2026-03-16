/**
 * Waffle Chart component for displaying class distribution in a grid format.
 */

import { useMemo } from 'react';

interface WaffleData {
  name: string;
  value: number;
  color: string;
}

interface WaffleChartProps {
  data: WaffleData[];
  total: number;
  rows?: number;
  columns?: number;
  size?: number;
  gap?: number;
}

export function WaffleChart({
  data,
  total,
  rows = 10,
  columns = 10,
  size = 8,
  gap = 2,
}: WaffleChartProps) {
  const gridSize = rows * columns;
  
  // Calculate squares for each category using largest remainder method
  // This ensures exactly gridSize squares are allocated
  const squares = useMemo(() => {
    if (total === 0 || data.length === 0) {
      return [];
    }

    // Calculate exact proportions and use largest remainder method
    const allocations = data.map((item) => {
      const exact = (item.value / total) * gridSize;
      const floor = Math.floor(exact);
      const remainder = exact - floor;
      return {
        item,
        floor,
        remainder,
        allocated: floor,
      };
    });

    // Calculate how many squares we've allocated so far
    let allocated = allocations.reduce((sum, a) => sum + a.floor, 0);
    const remaining = gridSize - allocated;

    // Sort by remainder (largest first) and allocate remaining squares
    if (remaining > 0) {
      const sorted = [...allocations].sort((a, b) => b.remainder - a.remainder);
      for (let i = 0; i < remaining && i < sorted.length; i++) {
        sorted[i].allocated++;
      }
    }

    // Build the squares array
    const squaresArray: Array<{ category: string; color: string }> = [];
    allocations.forEach((allocation) => {
      for (let i = 0; i < allocation.allocated; i++) {
        squaresArray.push({
          category: allocation.item.name,
          color: allocation.item.color,
        });
      }
    });

    // Ensure we have exactly gridSize squares (safety check)
    while (squaresArray.length < gridSize && data.length > 0) {
      const lastItem = data[data.length - 1];
      squaresArray.push({
        category: lastItem.name,
        color: lastItem.color,
      });
    }

    return squaresArray.slice(0, gridSize);
  }, [data, total, gridSize]);

  // Calculate actual counts for display (more accurate than grid representation)
  const displayData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
    }));
  }, [data, total]);

  // Use the provided size, but ensure it's reasonable
  const squareSize = size || 12;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Waffle Grid */}
      <div className="flex-1 flex items-center justify-center mb-6 min-h-0">
        <div
          className="inline-grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, ${squareSize}px)`,
            gap: `${gap}px`,
          }}
        >
          {squares.map((square, index) => (
            <div
              key={index}
              className="rounded-sm transition-opacity hover:opacity-80 cursor-pointer"
              style={{
                width: `${squareSize}px`,
                height: `${squareSize}px`,
                backgroundColor: square.color,
              }}
              title={`${square.category}`}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-2">
        {displayData.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="rounded-sm"
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: item.color,
                }}
              />
              <span className="text-sm font-medium text-grey-700 dark:text-text-primary">
                {item.name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-grey-600 dark:text-text-secondary">
              <span className="font-medium">{item.value}</span>
              <span className="text-grey-500 dark:text-text-tertiary">
                ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

