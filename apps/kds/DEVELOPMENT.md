# KDS Development Guide

Complete guide for developing and extending the Kitchen Display System.

## Architecture Overview

The KDS follows a component-based architecture with clear separation of concerns:

```
App (state management, routing)
├── TopBar (static header info + real-time clock)
├── Station Filter (state management)
└── KDSKanban (order display)
    └── OrderTicket[] (individual orders)
        └── useElapsedTime (custom hook)
```

## Component Responsibilities

### App.tsx
**Responsibility**: Top-level orchestration
- Station filter state management
- Clock updates (every second)
- Connection status management
- Props drilling to child components

**Key Props**:
```tsx
selectedStation: KitchenStation | null
isConnected: boolean
currentTime: Date
```

### TopBar.tsx
**Responsibility**: Display app branding, current time, and connection status
- Formats time with seconds precision (HH:MM:SS)
- Shows connection indicator (green/red dot with label)
- Non-interactive (display only)

**Props**:
```tsx
currentTime: Date
isConnected: boolean
stationCount: number  // For context/stats
```

### KDSKanban.tsx
**Responsibility**: Manage orders and display 3-column kanban
- Local order state management
- Status transitions (CONFIRMED → PREPARING → READY → SERVED)
- Item-level status management
- Elapsed time tracking

**State**:
```tsx
orders: Order[]
elapsedTimes: Record<string, number>  // order ID -> seconds
```

### OrderTicket.tsx
**Responsibility**: Display a single order with full interactivity
- Visual urgency indicators
- Item-level completion checkboxes
- Context-aware action buttons
- Elapsed time display with color coding

**Props**:
```tsx
order: Order
onBump: () => void
onItemStatusChange?: (itemId: string, status: OrderItemStatus) => void
```

**State**:
```tsx
completedItems: Set<string>  // Item IDs marked as done
```

## Custom Hooks

### useElapsedTime
**Location**: `src/hooks/useElapsedTime.ts`
**Purpose**: Track elapsed time since ISO timestamp and determine urgency

**Usage**:
```tsx
const elapsed = useElapsedTime(order.createdAt);
// Returns:
// {
//   elapsedMinutes: number
//   elapsedSeconds: number
//   formattedTime: string (e.g., "5m 23s")
//   urgencyLevel: 'normal' | 'warning' | 'critical'
// }
```

**Update Frequency**: 30 seconds (for performance)
**Urgency Levels**:
- `normal`: < 10 minutes (gold timer)
- `warning`: 10-20 minutes (crimson timer)
- `critical`: > 20 minutes (red flashing timer)

### useNewOrderAlert
**Location**: `src/hooks/useNewOrderAlert.ts`
**Purpose**: Play audio alert when new order arrives

**Usage**:
```tsx
const hasNewOrder = newOrders.length > previousLength;
useNewOrderAlert(hasNewOrder, '/sounds/custom-beep.mp3');
```

**Features**:
- Generates Web Audio API beep if no custom sound provided
- Prevents multiple alerts for same order
- Gracefully handles audio context errors

## Data Flow

### Order Status Transitions
```
CONFIRMED (Mới)
    ↓ [Bump button: "Bắt đầu nấu"]
PREPARING (Đang nấu)
    ↓ [Bump button: "Sẵn sàng phục vụ"]
READY (Sẵn sàng)
    ↓ [Bump button: "Đã giao"]
SERVED
```

### Item-Level Status Flow
```
PENDING (shown in card)
    ↓ [Click checkbox: "○"]
PREPARING (shown in card)
    ↓ [Click checkbox again]
READY (checkbox shows "✓", item visually completed)
```

## Styling System

### Color Scheme
Used consistently across the KDS:

```tsx
// Kitchen Environment Colors
const colors = {
  background: '#1A1A1A',      // Main dark background
  cardBackground: '#2E2E2E',  // Order card background
  text: '#F5F0EB',            // Warm off-white text

  // Brand Colors
  gold: '#C9A96E',            // Timer < 10min
  crimson: '#8B1A1A',         // Timer 10-20min
  red: '#C94444',             // Timer > 20min (critical)

  // Status Colors
  ready: '#4A7C59',           // Sage green for ready
  disabled: '#808080',        // Tertiary for inactive
};
```

### Responsive Font Sizing
- Table Number: 28px / 1.75rem (bold)
- Elapsed Time: 24px / 1.5rem (bold)
- Order Item Name: 14px / 0.875rem (semi-bold)
- Modifications: 12px / 0.75rem (italic)
- Labels: 10-12px / 0.625-0.75rem

### Touch Target Sizing
- Buttons: Minimum 48px height
- Checkboxes: 28x28px
- Station filter buttons: 32px height
- All interactive elements follow touch-friendly guidelines

## Testing Strategy

### Unit Tests (not yet implemented)
```tsx
// Test helpers
describe('useElapsedTime', () => {
  it('should calculate minutes correctly', () => {
    const createdAt = new Date(Date.now() - 5 * 60000).toISOString();
    const { elapsedMinutes } = useElapsedTime(createdAt);
    expect(elapsedMinutes).toBe(5);
  });

  it('should return critical urgency > 20min', () => {
    const createdAt = new Date(Date.now() - 25 * 60000).toISOString();
    const { urgencyLevel } = useElapsedTime(createdAt);
    expect(urgencyLevel).toBe('critical');
  });
});
```

### Integration Tests (not yet implemented)
- Order status transitions
- Item-level status updates
- Station filtering
- Mock WebSocket message handling

### Manual Testing Checklist
- [ ] Clock updates every second smoothly
- [ ] Elapsed time colors change at 10min and 20min thresholds
- [ ] Bump buttons transition orders between columns
- [ ] Checkboxes toggle item completion
- [ ] Station filter shows/hides orders correctly
- [ ] Scrolling works smoothly in busy kitchen (10+ orders)
- [ ] Touch interaction on tablets (iPad, Android)
- [ ] Responsive layout on different display sizes
- [ ] Sound alert plays on new order
- [ ] Connection indicator toggles correctly

## Performance Considerations

### Optimization Done
1. **Interval Updates**: Clock and timers use 1000ms/30000ms intervals (not on every render)
2. **Memoization**: Consider wrapping components in `React.memo()` if needed
3. **List Rendering**: Using `.map()` with stable keys
4. **CSS Classes**: Tailwind CSS for zero-runtime overhead

### Potential Optimizations
```tsx
// If performance degrades with many orders:

// 1. Memoize expensive renders
const OrderTicketMemo = React.memo(OrderTicket, (prev, next) => {
  return prev.order.id === next.order.id &&
         prev.order.status === next.order.status;
});

// 2. Virtualize long lists (if > 50 orders)
import { FixedSizeList } from 'react-window';

// 3. Reduce timer update frequency
const [updateInterval, setUpdateInterval] = useState(30000);
```

## Common Development Tasks

### Adding a New Column to Kanban
1. Define new OrderStatus enum value in shared types
2. Add grouping logic in KDSKanban.tsx:
   ```tsx
   const newColumn = filteredOrders.filter(o => o.status === OrderStatus.NEW_STATUS);
   ```
3. Create new JSX section with header and cards

### Customizing Urgency Thresholds
Edit `src/hooks/useElapsedTime.ts`:
```tsx
let urgencyLevel: UrgencyLevel = 'normal';
if (minutes >= 25) {  // Change from 20 to 25
  urgencyLevel = 'critical';
} else if (minutes >= 15) {  // Change from 10 to 15
  urgencyLevel = 'warning';
}
```

### Adding Audio Alerts
Use the existing `useNewOrderAlert` hook:
```tsx
useNewOrderAlert(newOrdersDetected, '/sounds/beep.mp3');
```

Place custom audio files in `public/sounds/`.

### Customizing Colors
Edit `tailwind.config.ts` theme.extend.colors:
```tsx
gold: {
  500: '#YOUR_COLOR', // Change primary brand color
},
```

## Debugging Tips

### Check Elapsed Time Calculation
```tsx
// In browser console
const createdAt = new Date(order.createdAt);
const now = new Date();
console.log('Seconds elapsed:', (now - createdAt) / 1000);
```

### Monitor State Changes
Add logging in KDSKanban:
```tsx
console.log('Orders updated:', orders);
console.log('Elapsed times:', elapsedTimes);
```

### Inspect Component Hierarchy
Use React DevTools (Chrome extension) to:
- See component tree
- Inspect prop values
- Track re-renders
- Check hook state

## Building for Production

```bash
# From restopro root
pnpm build

# Output goes to: apps/kds/dist/
```

### Environment Variables
KDS uses no environment variables currently. If adding:
1. Create `.env.example`
2. Document in README
3. Add to TypeScript types in `vite-env.d.ts`

### Browser Compatibility
- Modern browsers (Chrome, Safari, Firefox, Edge)
- Minimum iOS 14 for proper audio context support
- Android 8+

## Future Roadmap

### Phase 2 (Near-term)
- [ ] WebSocket real-time order sync
- [ ] Persistent order state (localStorage fallback)
- [ ] Print order ticket (ESC/POS)
- [ ] Server-side order transitions with optimistic UI

### Phase 3 (Medium-term)
- [ ] Station-aware order routing (items go to correct station automatically)
- [ ] Kitchen metrics dashboard (avg prep time, item popularity)
- [ ] Customizable alert sounds per order type
- [ ] Admin panel for KDS settings (timeouts, colors, stations)

### Phase 4 (Long-term)
- [ ] Video display of customer order (QR code data)
- [ ] Integration with customer loyalty system
- [ ] Heat map of station workload
- [ ] AI demand forecasting for prep planning
- [ ] Voice commands ("Mark table 5 ready")

## Resources

- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **TypeScript**: https://www.typescriptlang.org
- **Vite**: https://vitejs.dev
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
