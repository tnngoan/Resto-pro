/**
 * POSMain.tsx — Main POS screen: split view with menu (left) and order ticket (right).
 *
 * Layout:
 *   ┌──────────────────────────┬─────────────────────────┐
 *   │                          │                         │
 *   │      Menu Panel          │     Order Ticket        │
 *   │   (categories + items)   │  (items + totals)       │
 *   │                          │                         │
 *   └──────────────────────────┴─────────────────────────┘
 *          ~60%                        ~40%
 */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOSStore } from '@/store/pos';
import { MenuPanel } from '@/components/menu/MenuPanel';
import { OrderTicket } from '@/components/orders/OrderTicket';

export function POSMain() {
  const navigate = useNavigate();
  const selectedTableId = usePOSStore((s) => s.selectedTableId);
  const addItem = usePOSStore((s) => s.addItem);

  // Guard: must select a table first
  useEffect(() => {
    if (!selectedTableId) {
      navigate('/', { replace: true });
    }
  }, [selectedTableId, navigate]);

  if (!selectedTableId) return null;

  return (
    <div className="flex h-full">
      {/* Left: Menu */}
      <div className="flex-[3] min-w-0 border-r border-surface-light">
        <MenuPanel onSelectItem={addItem} />
      </div>

      {/* Right: Order Ticket */}
      <div className="flex-[2] min-w-[340px] max-w-[480px]">
        <OrderTicket
          onOrderSent={() => {
            // After sending, go back to table select
            navigate('/');
          }}
        />
      </div>
    </div>
  );
}
