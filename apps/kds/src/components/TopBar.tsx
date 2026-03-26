import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface TopBarProps {
  currentTime: Date;
  isConnected: boolean;
  stationCount: number;
}

/**
 * Top bar component for the Kitchen Display System.
 * Displays branding, current time, and connection status.
 * Height: 56px
 */
export default function TopBar({
  currentTime,
  isConnected,
  stationCount,
}: TopBarProps): React.ReactElement {
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');

  return (
    <div className="bg-surface-dark border-b border-surface-light px-6 py-3 flex items-center justify-between h-14 flex-shrink-0">
      {/* Left: Logo + Brand Name */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-surface-dark font-bold text-sm">RC</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gold-500 leading-none">
            the RED CHAIR
          </h1>
          <p className="text-xs text-secondary">Màn hình bếp</p>
        </div>
      </div>

      {/* Center Spacer */}
      <div className="flex-1" />

      {/* Right: Clock + Connection Status */}
      <div className="flex items-center gap-6">
        {/* Clock - Large prominent display */}
        <div className="text-right">
          <div className="text-2xl font-bold text-primary tabular-nums">
            {hours}:{minutes}:{seconds}
          </div>
          <p className="text-xs text-secondary">Bây giờ</p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 pl-6 border-l border-surface-light">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-semibold text-green-400">
                    Kết nối
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-semibold text-red-400">
                    Mất kết nối
                  </span>
                </>
              )}
            </div>
            <div
              className={`
                w-2 h-2 rounded-full
                ${
                  isConnected
                    ? 'bg-green-500 animate-pulse'
                    : 'bg-red-500 animate-pulse'
                }
              `}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
