# RestoPro Customer App — Mobile QR Ordering

The customer-facing React + Vite web app for scanning QR codes at The Red Chair restaurant tables and placing orders.

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Zustand (lightweight cart store)
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Build**: Vite
- **Typography**: Playfair Display (serif) + Inter (body)

### File Structure
```
src/
├── App.tsx                  # Router configuration
├── main.tsx                 # Entry point
├── pages/
│   ├── Menu.tsx            # Main menu page (/:tableSlug)
│   ├── ItemDetail.tsx      # Item detail page
│   ├── Cart.tsx            # Order review & checkout
│   └── OrderTracking.tsx   # Real-time order status
├── components/
│   ├── MenuItemCard.tsx    # Menu item grid card
│   ├── CategoryTabs.tsx    # Horizontal category tabs
│   ├── CartBar.tsx         # Floating cart summary bar
│   ├── QuantitySelector.tsx # +/- quantity control
│   ├── PriceDisplay.tsx    # VND price formatter
│   └── StatusBadge.tsx     # Order/item status
├── store/
│   └── cart.ts             # Zustand cart store
├── lib/
│   ├── api.ts              # Axios API client
│   └── format.ts           # Utility: formatPrice, formatDate, etc.
└── styles/
    └── globals.css         # Global Tailwind + custom styles
```

## Features

### 1. **Menu Page** (`/menu/:tableSlug`)
- Hero section with restaurant branding ("the RED CHAIR")
- Table number display ("Bàn 12")
- Horizontal scrolling category tabs (Pizza, Pasta, Thịt & Cá, etc.)
- Menu grid with item cards
- Add to cart button on each item
- Floating bottom cart bar (sticky) showing subtotal and item count
- Link to cart page

### 2. **Item Detail Page** (`/menu/:tableSlug/item/:itemId`)
- Large item photo placeholder (gradient with first letter)
- Italian name + Vietnamese name
- Full description & allergens
- Special requests text area (ghi chú đặc biệt)
- Quantity selector (- 1 +)
- Price breakdown
- "Thêm vào đơn" button with total

### 3. **Cart Page** (`/menu/:tableSlug/cart`)
- List of all items in cart
- Quantity adjustment per item with remove button
- Special requests text area for entire order
- Price breakdown: Tạm tính, VAT (8%), Tổng cộng
- "Gửi đơn hàng" (Place Order) button
- "Quay lại thực đơn" (Back to Menu) link

### 4. **Order Tracking Page** (`/menu/:tableSlug/order/:orderId`)
- Order number prominently displayed
- Status badge (PLACED, CONFIRMED, PREPARING, READY, SERVED)
- Visual status timeline with steps
- Live item status list (each item shows individual status)
- Price summary
- Auto-refresh every 10 seconds (TODO: WebSocket)
- "Đặt thêm" button once order is served

## Cart Store (Zustand)

Located in `src/store/cart.ts`. Persisted to localStorage.

```typescript
interface CartItem {
  menuItemId: string;
  name: string;
  nameIt: string;
  price: number;
  quantity: number;
  modifications?: string;
  notes?: string;
  category: string;
}

// Methods:
cartStore.addItem(item)          // Add or update quantity
cartStore.removeItem(menuItemId)
cartStore.updateQuantity(id, qty)
cartStore.updateNotes(id, notes)
cartStore.clearCart()
cartStore.getTotal()             // Subtotal + VAT
cartStore.getSubtotal()
cartStore.getVAT(subtotal)
cartStore.getItemCount()
```

## API Client

Located in `src/lib/api.ts`. Axios wrapper with mock data fallback.

```typescript
// TODO: Implement real endpoints once backend is ready
restoproAPI.fetchCategories(restaurantSlug)
restoproAPI.fetchMenuItems(restaurantSlug, categoryId?)
restoproAPI.fetchMenuItem(id)
restoproAPI.placeOrder(data)
restoproAPI.getOrder(id)
```

Base URL: `VITE_API_URL` environment variable (default: `http://localhost:3001/api/v1`)

## Styling

### Colors
- **Primary Action**: `crimson` (#8B1A1A)
- **Accent**: `gold` (#C9A96E)
- **Background**: `surface-base` (#1A1A1A)
- **Text Primary**: `text-primary` (#F5F0EB)
- **Text Secondary**: `text-secondary` (#A89B8C)

All defined in `tailwind.config.ts`.

### Typography
- **Headings**: Playfair Display (serif), 400-700 weight
- **Body**: Inter, 400-700 weight
- **Monospace**: JetBrains Mono

### Responsive
Mobile-first design targeting 375px (iPhone SE). Scales up gracefully.

## VND Price Formatting

All prices stored as **integers in VND** (smallest unit). Never use floats.

- `formatPrice(189000)` → `"189.000₫"` (full format)
- `formatPriceShort(189000)` → `"189k₫"` (compact)

Example:
```typescript
import { formatPrice, formatPriceShort } from '@/lib/format';

<PriceDisplay priceVND={189000} variant="short" />  // 189k₫
<PriceDisplay priceVND={189000} variant="full" />   // 189.000₫
```

## Animations

Framer Motion is used for:
- Page transitions (fade in, slide up)
- Card layouts (layout animation on category change)
- Button tap feedback (scale 0.95)
- Status timeline pulse effect

## Environment Variables

Create `.env.local`:
```
VITE_API_URL=http://localhost:3001/api/v1
```

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (port 3003)
pnpm dev

# Build for production
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint
```

## TODO / Roadmap

1. **API Integration**
   - Replace mock menu data with real API calls
   - Implement real order placement
   - Add WebSocket connection for real-time order status updates

2. **Payment Integration**
   - VNPay payment gateway
   - MoMo e-wallet
   - ZaloPay

3. **PWA Features**
   - Service worker for offline support
   - Install-to-home-screen prompt
   - App manifest

4. **Performance**
   - Code splitting per route
   - Image optimization
   - Bundle size audit

5. **Accessibility**
   - ARIA labels on all buttons
   - Keyboard navigation
   - Screen reader testing

6. **Testing**
   - Unit tests for hooks and utilities
   - E2E tests for critical flows (order → cart → tracking)
   - Lighthouse audit

## Notes

- **Mobile safe area**: CSS uses `safe-area-inset` for devices with notches
- **App-like feel**: Full viewport, no browser chrome on iOS
- **Dark theme**: Optimized for late-night ordering (restaurants close late)
- **Vietnamese-first**: All UI text in Vietnamese with Italian dish names as design feature
- **Table identification**: QR code URL includes `tableSlug` param (e.g., `/menu/table-12`)

## Brand Guidelines

- Luxury Italian restaurant theme
- Warm, sophisticated color palette (crimson, burgundy, gold)
- Clean typography with serif headings
- Generous whitespace and card-based layout
- Smooth animations (300ms ease)
- Gold accents for interactive elements
