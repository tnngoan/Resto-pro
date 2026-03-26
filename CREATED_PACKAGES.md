# RestoPro Shared Packages & KDS App

## Created Packages

### 1. `packages/shared/` — Shared Types & Utilities

This package contains all shared types, constants, and utility functions used across RestoPro apps.

**Directories:**
- `src/types/` — Type definitions
  - `order.ts` — Order and OrderItem types with status enums
  - `menu.ts` — MenuItem, MenuCategory, KitchenStation types
  - `table.ts` — Table and TableStatus types
  - `user.ts` — User and UserRole types
  - `finance.ts` — Transaction and DailyRevenue types
  - `inventory.ts` — Ingredient and StockMovement types
  
- `src/constants/` — Application constants
  - `index.ts` — VAT_RATE, TIMEZONE, ORDER_STATUS_FLOW, KITCHEN_STATION_LABELS, etc.
  
- `src/utils/` — Utility functions
  - `currency.ts` — formatVND, parseVND, calculateVAT functions
  - `date.ts` — formatDateVN, formatTimeVN, toVietnamTime, formatElapsedTime, etc.

**Exports:** All types, constants, and utilities via main `index.ts`

---

### 2. `packages/ui/` — Shared UI Components

Reusable React components styled with Tailwind CSS for the Red Chair theme (dark mode, crimson/gold colors).

**Components:**
- `Button.tsx` — Variants: primary, secondary, tertiary, danger; sizes: sm, md, lg; loading state
- `Card.tsx` — Card with CardHeader, CardContent, CardFooter subcomponents
- `Badge.tsx` — Status badge with multiple color variants (gold, crimson, green, etc.)
- `Input.tsx` — Form input with label, error message, icon support
- `KPICard.tsx` — Dashboard KPI metric card with value, change indicator, sparkline
- `StatusBadge.tsx` — Order/table status badge with Vietnamese labels
- `Modal.tsx` — Modal dialog with scrim, dark theme, gold top border accent
- `Table.tsx` — Data table with sortable columns, alternating row colors, pagination footer

All components use consistent Red Chair color scheme and are production-ready.

---

### 3. `apps/kds/` — Kitchen Display System

Full-screen kitchen display app built with React + Vite. Displays orders in a 3-column Kanban layout.

**Key Features:**
- **Top bar** with RestoPro logo, clock, connection status
- **Station tabs** to filter by kitchen station (Tất cả, Bếp nóng, Bar, etc.)
- **3-column Kanban board:**
  - Mới (New) — Confirmed orders
  - Đang nấu (Cooking) — Preparing orders
  - Sẵn sàng (Ready) — Ready orders (green border highlight)
  
- **Order Ticket Component** (`OrderTicket.tsx`):
  - Large table number (28px bold)
  - Elapsed timer (updates every second)
  - Item list with qty, name, Italian name (if available), modifications
  - Status indicators (◯ pending, → preparing, ✓ ready)
  - Bump button (touch-friendly, large)
  - Left border color for priority (gold normal, crimson VIP)
  
- **Real-time updates:** Clock and elapsed timers update every second
- **Demo data included:** 3 sample orders with realistic data

**Build & Run:**
```bash
pnpm install
pnpm dev:kds  # Runs on port 3002
```

---

## File Structure

```
restopro/
├── packages/
│   ├── shared/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types/
│   │       │   ├── order.ts
│   │       │   ├── menu.ts
│   │       │   ├── table.ts
│   │       │   ├── user.ts
│   │       │   ├── finance.ts
│   │       │   ├── inventory.ts
│   │       │   └── index.ts
│   │       ├── constants/
│   │       │   └── index.ts
│   │       ├── utils/
│   │       │   ├── currency.ts
│   │       │   ├── date.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   │
│   └── ui/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── components/
│           │   ├── Button.tsx
│           │   ├── Card.tsx
│           │   ├── Badge.tsx
│           │   ├── Input.tsx
│           │   ├── KPICard.tsx
│           │   ├── StatusBadge.tsx
│           │   ├── Modal.tsx
│           │   └── Table.tsx
│           └── index.ts
│
└── apps/
    └── kds/
        ├── package.json
        ├── tsconfig.json
        ├── tsconfig.node.json
        ├── vite.config.ts
        ├── tailwind.config.ts
        ├── postcss.config.js
        ├── index.html
        └── src/
            ├── main.tsx
            ├── App.tsx
            ├── styles/
            │   └── globals.css
            └── components/
                ├── TopBar.tsx
                ├── KDSKanban.tsx
                └── OrderTicket.tsx
```

---

## Design System

All components use the Red Chair theme:

**Colors:**
- Primary text: #F5F5F5 (light gray)
- Secondary text: #B3B3B3 (medium gray)
- Tertiary text: #808080 (dark gray)
- Gold accent: #FFB700
- Crimson: #FF314B (danger/priority)
- Green: #22C55E (success)
- Surface dark: #1A1A1A
- Surface medium: #242424
- Surface light: #2F2F2F

**Typography:**
- Font: Inter (Google Fonts)
- Sizes: xs, sm, base, lg, xl, 2xl, 3xl, 4xl
- Weights: 400, 500, 600, 700, 800

**Spacing & Radius:**
- Card radius: 12px
- Consistent 6px, 12px, 24px spacing grid

---

## Next Steps

1. **Install dependencies:** `pnpm install` (when ready)
2. **Backend integration:** Wire KDS app to WebSocket for real-time orders
3. **Dashboard (web app):** Use UI components to build ordering, revenue, reporting screens
4. **POS app (Electron):** Table management, order input
5. **Database schema:** Define Prisma models matching shared types
