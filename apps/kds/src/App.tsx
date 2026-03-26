import React, { useState } from 'react';
import { KitchenStation, KITCHEN_STATION_LABELS } from '@restopro/shared';
import TopBar from './components/TopBar';
import KDSKanban from './components/KDSKanban';

/**
 * Kitchen Display System (KDS) Main Application
 *
 * A full-screen, real-time kitchen management interface designed for:
 * - Large kitchen displays (1920x1080 landscape)
 * - Dark theme optimized for kitchen lighting
 * - Large fonts for viewing from distance
 * - Touch-friendly interactive elements
 *
 * Key features:
 * - 3-column kanban board (Mới / Đang nấu / Sẵn sàng)
 * - Station-based filtering (Tất cả / Bếp nóng / Bar / etc.)
 * - Real-time elapsed time tracking with urgency indicators
 * - Item-level status management
 * - Vietnamese language throughout
 * - Color-coded urgency (gold < 10min, crimson 10-20min, red flashing > 20min)
 */
export default function App(): React.ReactElement {
  const [selectedStation, setSelectedStation] = useState<KitchenStation | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update clock every second for smooth time display
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // All available kitchen stations
  const stations: KitchenStation[] = [
    KitchenStation.HOT_KITCHEN,
    KitchenStation.COLD_KITCHEN,
    KitchenStation.BAR,
    KitchenStation.DESSERT,
    KitchenStation.GRILL,
  ];

  return (
    <div className="flex flex-col h-screen bg-surface-dark">
      {/* Top Bar: Logo, time, connection status */}
      <TopBar
        currentTime={currentTime}
        isConnected={isConnected}
        stationCount={selectedStation ? 1 : stations.length}
      />

      {/* Station Filter Buttons */}
      <div className="bg-surface-medium border-b border-surface-light px-6 py-4 flex gap-3 overflow-x-auto flex-shrink-0">
        {/* "Tất cả" button */}
        <button
          onClick={() => setSelectedStation(null)}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap
            ${
              selectedStation === null
                ? 'bg-gold-500 text-surface-dark font-bold'
                : 'bg-surface-light text-secondary hover:bg-surface-light hover:text-primary'
            }
          `}
        >
          Tất cả
        </button>

        {/* Station buttons */}
        {stations.map((station) => (
          <button
            key={station}
            onClick={() => setSelectedStation(station)}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap
              ${
                selectedStation === station
                  ? 'bg-gold-500 text-surface-dark font-bold'
                  : 'bg-surface-light text-secondary hover:bg-surface-light hover:text-primary'
              }
            `}
          >
            {KITCHEN_STATION_LABELS[station]}
          </button>
        ))}
      </div>

      {/* Kanban Board: 3-column layout with orders */}
      <KDSKanban selectedStation={selectedStation} />
    </div>
  );
}
