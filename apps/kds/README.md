# Kitchen Display System (KDS)

The Kitchen Display System is a full-screen, real-time order management interface optimized for restaurant kitchen environments.

## Overview

The KDS displays incoming orders in a 3-column kanban layout:
1. **Mới (New)** - Orders just placed, waiting to be started
2. **Đang nấu (Cooking)** - Orders actively being prepared
3. **Sẵn sàng (Ready)** - Orders ready to serve

## Design Theme

Dark theme optimized for kitchen environments with **The Red Chair** brand colors:
- **Background**: Charcoal (#1A1A1A)
- **Cards**: #2E2E2E
- **Text**: Warm off-white (#F5F0EB)
- **Gold** (#C9A96E): Timer accent for orders < 10 minutes
- **Crimson** (#8B1A1A): Warning for orders 10-20 minutes old
- **Error Red** (#C94444): Critical alerts for orders > 20 minutes (flashing)
- **Sage Green** (#4A7C59): Ready status indicator

## Key Features

### Order Ticket Card
- **Large table number** (28px bold) - visible from distance
- **Elapsed time** with color-coded urgency:
  - Gold: < 10 minutes
  - Crimson: 10-20 minutes
  - Red (flashing): > 20 minutes
- **Order items** with quantity, modifications, and notes
- **Per-item status indicators** - mark items as ready with checkbox
- **Context-aware bump button**:
  - "Bắt đầu nấu" (Start cooking) - in New column
  - "Sẵn sàng phục vụ" (Ready to serve) - in Cooking column
  - "Đã giao" (Delivered) - in Ready column

### Station Filtering
- Filter orders by kitchen station (Bếp nóng / Bar / Nướng / etc.)
- "Tất cả" button shows all orders

### Real-Time Updates
- Elapsed time updates every second
- Order transitions between columns in real-time
- WebSocket integration ready (mock data for development)

### Kitchen-Optimized UI
- Touch-friendly buttons (min 48px height)
- Large, readable fonts for distance viewing
- Smooth scrolling in order lists
- Prevents accidental text selection and pinch-zoom

## Development

### Running Locally

```bash
# From the restopro root
pnpm dev:kds

# Or from this directory
pnpm dev
```

The app runs on `http://localhost:5173` by default.

### Project Structure

```
src/
├── App.tsx                    # Main app component with station filter
├── components/
│   ├── TopBar.tsx            # Header with logo, time, connection status
│   ├── KDSKanban.tsx         # 3-column kanban layout
│   └── OrderTicket.tsx       # Individual order card component
├── hooks/
│   ├── useElapsedTime.ts     # Track time since order placed (returns urgency)
│   └── useNewOrderAlert.ts   # Sound alert for new orders
├── data/
│   └── mockOrders.ts         # Realistic mock orders for development
├── styles/
│   └── globals.css           # Kitchen-optimized dark theme styles
└── main.tsx                  # Entry point
```

### Mock Data

The app ships with `MOCK_ORDERS` including:
- 3 new orders (CONFIRMED status)
- 4 cooking orders (PREPARING status)
- 2 ready orders (READY status)

All orders have realistic Vietnamese dishes, modifications, and timing.

## Component API

### TopBar
Displays branding, current time (updates every second), and connection status.

```tsx
<TopBar
  currentTime={currentTime}
  isConnected={true}
  stationCount={5}
/>
```

### KDSKanban
3-column kanban board showing orders grouped by status.

```tsx
<KDSKanban selectedStation={KitchenStation.HOT_KITCHEN | null} />
```

### OrderTicket
Individual order card with elapsed time, items, and action buttons.

```tsx
<OrderTicket
  order={order}
  onBump={() => handleStatusChange(order.id)}
  onItemStatusChange={(itemId, status) => updateItem(itemId, status)}
/>
```

## Hooks

### useElapsedTime
Tracks elapsed time since order placement and returns urgency level.

```tsx
const elapsed = useElapsedTime(order.createdAt);
// Returns: { elapsedMinutes, elapsedSeconds, formattedTime, urgencyLevel }
```

### useNewOrderAlert
Plays a sound alert when a new order arrives.

```tsx
useNewOrderAlert(newOrderDetected, '/sounds/beep.mp3');
```

## Color Coding System

The elapsed time indicator changes color based on order age:

| Time | Color | Status | Visual |
|------|-------|--------|--------|
| < 10 min | Gold (#C9A96E) | Normal | Static |
| 10-20 min | Crimson (#8B1A1A) | Warning | Static |
| > 20 min | Red (#C94444) | Critical | Flashing animation |

## Typography

- **Font Family**: Inter (imported from Google Fonts)
- **Table Number**: 28px bold
- **Elapsed Time**: 24px bold
- **Item Name**: 14px semi-bold
- **Modifications**: 12px italic

## Responsive Design

The KDS is optimized for:
- **Primary**: 1920x1080 landscape (large kitchen displays)
- **Secondary**: Touch-friendly interaction patterns
- **Fallback**: Responsive scaling for smaller screens

All interactive elements are minimum 48px for reliable touch targeting.

## Build and Deploy

```bash
# Build the app
pnpm build

# Preview the production build locally
pnpm preview
```

The built app is a standalone SPA that can be:
1. Deployed to Vercel
2. Wrapped in Electron for desktop
3. Run in a browser on a kitchen display system

## Future Enhancements

- WebSocket integration for real-time order sync from backend
- Audio alerts customization (different sounds for new orders vs. VIP orders)
- Station-specific routing (items automatically appear in relevant station)
- Print functionality (ESP/POS thermal printer support)
- Offline support with local order queue
- Performance metrics tracking per station
- Integration with POS system for order confirmations

## Notes for Kitchen Staff

- **Gold timer**: Order is progressing normally
- **Red timer**: Order is taking too long, needs attention
- **Click checkbox**: Mark individual items as ready
- **Bump button**: Confirm order status or acknowledge reminder
- **Station buttons**: Filter to your specific station or see all orders
- **Connection indicator**: Green = connected to server, red = working offline
