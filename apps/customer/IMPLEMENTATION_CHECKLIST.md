# Implementation Checklist

## Completed

### Architecture & Setup
- [x] React Router v6 with parameterized routes
- [x] Zustand cart store with localStorage persistence
- [x] Axios API client with mock fallback
- [x] Vite configuration with path aliases (@/ and @restopro/shared)
- [x] TypeScript strict mode throughout

### Pages (4/4)
- [x] Menu.tsx - Main menu with hero, tabs, grid, floating cart
- [x] ItemDetail.tsx - Item detail with modifications, notes, quantity
- [x] Cart.tsx - Order review with adjustments, special requests, checkout
- [x] OrderTracking.tsx - Real-time order status with timeline

### Components (7/7)
- [x] MenuItemCard.tsx - Grid card component
- [x] CategoryTabs.tsx - Horizontal scrolling tabs
- [x] CartBar.tsx - Floating bottom cart bar
- [x] QuantitySelector.tsx - +/- quantity control
- [x] PriceDisplay.tsx - VND formatter
- [x] StatusBadge.tsx - Order/item status badges
- [x] (App-level routing with proper params)

### State Management
- [x] Zustand cart store with all methods
- [x] localStorage persistence
- [x] CartItem interface
- [x] VAT calculation (8%)

### Styling & Theme
- [x] Tailwind colors (crimson, gold, surface, text)
- [x] Typography (Playfair Display, Inter, JetBrains Mono)
- [x] Dark theme optimization
- [x] Mobile-first responsive design
- [x] Safe area support (notches)
- [x] Scrollbar styling

### Utilities & Formatting
- [x] formatPrice() → "189.000₫"
- [x] formatPriceShort() → "189k₫"
- [x] formatDate(), formatTime(), formatDateTime()
- [x] No floating-point price errors (integers in VND)

### Animations & UX
- [x] Framer Motion page transitions
- [x] Card layout animations
- [x] Button tap feedback (scale)
- [x] Status timeline pulse
- [x] Smooth color transitions

### Data & Mock Content
- [x] 12 sample menu items
- [x] 7 categories (Khai vị, Pizza, Pasta, Thịt & Cá, Tráng miệng, Đồ uống, Rượu vang)
- [x] Sample order with item statuses
- [x] Allergen information

### Configuration & Documentation
- [x] .env.example with VITE_API_URL
- [x] README.md with full documentation
- [x] IMPLEMENTATION_CHECKLIST.md (this file)
- [x] Inline TODO comments for API integration

---

## TODO - API Integration

### Backend Integration
- [ ] Replace mock menuItems in Menu.tsx with `restoproAPI.fetchMenuItems()`
- [ ] Replace mock items in ItemDetail.tsx with `restoproAPI.fetchMenuItem()`
- [ ] Implement real order placement in Cart.tsx
- [ ] Connect OrderTracking to backend for real-time updates
- [ ] Add WebSocket support for live order status (vs polling)

### Payment Integration
- [ ] VNPay gateway integration
- [ ] MoMo e-wallet integration
- [ ] ZaloPay integration
- [ ] Payment method selection in checkout

### PWA Features
- [ ] Service worker for offline support
- [ ] Web app manifest (manifest.json)
- [ ] Install-to-home-screen prompt
- [ ] Offline fallback page

### Performance
- [ ] Code splitting per route
- [ ] Image optimization (lazy loading)
- [ ] Bundle size analysis
- [ ] Lighthouse audit (target: 90+)

### Testing
- [ ] Unit tests for useCartStore
- [ ] Component tests (MenuItemCard, CartBar, etc.)
- [ ] Integration tests (order flow)
- [ ] E2E tests (Menu → ItemDetail → Cart → Order)
- [ ] Performance tests

### Accessibility
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Color contrast audit (WCAG AA)
- [ ] Screen reader testing
- [ ] Focus visible states

### Monitoring & Analytics
- [ ] Error tracking (Sentry)
- [ ] Analytics (Vercel Analytics or custom)
- [ ] Performance monitoring
- [ ] Real user monitoring (RUM)

---

## Development Guide

### Adding a New Menu Item
1. Add to `menuItems` array in Menu.tsx (id, name, description, price, category)
2. Add details to `menuItems` object in ItemDetail.tsx
3. Update category dropdown if needed

### Customizing Colors
Edit `tailwind.config.ts` `extend.colors` section. Already includes:
- crimson, burgundy
- gold, gold-dark, gold-light
- surface base, dark, medium, light
- text primary, secondary, tertiary

### Modifying Cart Logic
Edit `src/store/cart.ts`:
- Add item properties to `CartItem` interface
- Add computed properties with getters
- Methods are automatically memoized by Zustand

### API Endpoint Changes
Update `src/lib/api.ts` RestoproAPI class:
- Modify request paths
- Update request/response types
- Add new endpoints

### Styling a Component
1. Use Tailwind utility classes (preferred)
2. Extend with `@apply` in globals.css if complex
3. Use theme colors from config
4. Avoid hardcoded colors

---

## Key Files Locations

- **Source Root**: `/sessions/admiring-ecstatic-fermi/mnt/Red Chair System/restopro/apps/customer/src/`
- **Pages**: `.../src/pages/`
- **Components**: `.../src/components/`
- **State**: `.../src/store/`
- **API**: `.../src/lib/api.ts`
- **Utilities**: `.../src/lib/format.ts`
- **Styles**: `.../src/styles/globals.css`
- **Config**: `tailwind.config.ts`, `vite.config.ts`, `tsconfig.json`

---

## Testing the App Locally

1. Install dependencies:
   ```bash
   cd apps/customer
   pnpm install
   ```

2. Start the dev server:
   ```bash
   pnpm dev
   ```

3. Open http://localhost:3003/menu/table-1

4. Test flows:
   - Add items to cart (Menu page)
   - Adjust quantities (Menu cart bar)
   - View item details (ItemDetail page)
   - Checkout (Cart page)
   - Track order status (OrderTracking page)
   - Refresh - cart should persist (Zustand localStorage)

---

## Notes for Next Developer

- **Cart is persistent** - Uses Zustand with localStorage middleware
- **Table identification** - Passed via URL param (e.g., `/menu/table-12`)
- **VND prices** - Always integers, formatted on display
- **Mock data** - In place, ready to swap with real API calls
- **Animations** - Framer Motion, 300ms ease default
- **Dark theme** - All text colors use semantic variables (text-primary, text-secondary)
- **Mobile-first** - 375px baseline, scales up gracefully
- **No external icons** - Using lucide-react for consistent, small bundle

---

## Known Limitations (by design)

1. **Order status auto-refresh** - Currently polling every 10s, should be WebSocket
2. **No payment UI** - Ready for VNPay/MoMo/ZaloPay integration
3. **No authentication** - Assumes table identification via QR/URL param
4. **No order history** - Only current order tracking
5. **No notifications** - Browser push notifications TODO (PWA feature)

---

## Future Enhancements

### Phase 2
- [ ] User accounts / loyalty system
- [ ] Order history per customer
- [ ] Promotional codes / discounts
- [ ] Multiple language support (Italian for tourists)
- [ ] Accessibility mode (larger text, high contrast)

### Phase 3
- [ ] Voice ordering (speech recognition)
- [ ] Photo upload for special requests
- [ ] Nutritional information / diet filters
- [ ] Estimated wait time calculation
- [ ] Staff to-table notifications

