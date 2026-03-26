# Kitchen Display System (KDS) - Quick Start Guide

## 30-Second Setup

```bash
# From restopro root directory
cd apps/kds
pnpm install
pnpm dev
```

Open `http://localhost:5173` in your browser. Done!

## What You're Looking At

### Three-Column Order Board
```
┌──────────────────┬──────────────────┬──────────────────┐
│ Mới (New)        │ Đang nấu (Cook)  │ Sẵn sàng (Ready) │
│ Gold timer       │ Crimson timer    │ Sage green       │
│ 3 orders         │ 4 orders         │ 2 orders         │
└──────────────────┴──────────────────┴──────────────────┘
```

### Order Card Features
- **Table Number**: Big (28px) for visibility
- **Elapsed Time**: Color-coded urgency
  - Gold: < 10 min (normal)
  - Crimson: 10-20 min (warning)
  - Red flashing: > 20 min (critical!)
- **Items**: List with checkboxes to mark done
- **Button**: Context-aware ("Start cooking", "Ready to serve", "Delivered")

## Key Interactions

### Mark Item Done
Click the checkbox circle (○) next to any item to mark it ready (✓)

### Progress Order
Click the button at bottom of order card:
- New column: "Bắt đầu nấu" (Start cooking) → moves to Cooking
- Cooking column: "Sẵn sàng phục vụ" (Ready) → moves to Ready
- Ready column: "Đã giao" (Delivered) → moves to Served

### Filter by Station
Click buttons at top: "Tất cả" or specific kitchen station

## Files to Explore

### Start Here
- `src/App.tsx` - Main app structure
- `src/components/TopBar.tsx` - Header (time, connection)
- `src/components/KDSKanban.tsx` - Kanban board
- `src/components/OrderTicket.tsx` - Order card

### Mock Data
- `src/data/mockOrders.ts` - Demo orders (replace with API)

### Styling
- `src/styles/globals.css` - Global styles
- `tailwind.config.ts` - Color palette

## Color Quick Reference

| What | Color | Hex |
|------|-------|-----|
| Background | Charcoal | #1A1A1A |
| Text | Off-white | #F5F0EB |
| Timer < 10min | Gold | #C9A96E |
| Timer 10-20min | Crimson | #8B1A1A |
| Timer > 20min | Red | #C94444 |
| Ready Status | Sage Green | #4A7C59 |

## Development Workflow

1. **Edit component** → Saves automatically
2. **Browser reloads** → Hot Module Reload (HMR)
3. **See changes** → Instant feedback

## Common Tasks

### Change Timer Thresholds
Edit `src/hooks/useElapsedTime.ts`:
```tsx
if (minutes >= 15) urgencyLevel = 'warning';  // Was 10
if (minutes >= 25) urgencyLevel = 'critical'; // Was 20
```

### Add New Orders
Edit `src/data/mockOrders.ts` - add to `MOCK_ORDERS` array

### Customize Colors
Edit `tailwind.config.ts` theme colors

### Change Language
Search/replace Vietnamese text (all strings in components)

## Build for Production

```bash
pnpm build      # Creates dist/ folder
pnpm preview    # Test production locally
```

## Documentation

- **README.md** - Features & setup
- **DEVELOPMENT.md** - Architecture & dev guide
- **DESIGN_SPEC.md** - Design specs & colors
- **BUILD_SUMMARY.md** - Complete overview

## Keyboard Shortcuts (Vite Dev)

- `r` - Restart server
- `u` - Show module updates
- `c` - Clear console
- `q` - Quit

## Troubleshooting

**Port 5173 already in use?**
```bash
pnpm dev -- --port 3000
```

**Styles not updating?**
- Check `tailwind.config.ts` includes `'./src/**/*.{jsx,tsx}'`
- Restart dev server

**Types not working?**
```bash
pnpm type-check
```

**Want to reset state?**
- Refresh page (F5 or Cmd+R)
- All mock data resets

## Next: Connect to Backend

Once working locally, next steps:
1. Replace `MOCK_ORDERS` with API call
2. Add WebSocket for real-time updates
3. Implement order status transitions via API
4. Add authentication

See `DEVELOPMENT.md` for detailed integration guide.

## Vietnam Time Note

All times in the app use Vietnam timezone (UTC+7). The code handles this automatically when you integrate with backend APIs.

---

**Need Help?**
- Check BUILD_SUMMARY.md for complete overview
- Check DEVELOPMENT.md for architecture & patterns
- Check DESIGN_SPEC.md for visual specifications

**Status**: ✅ Ready to develop and deploy

**Built**: March 25, 2026
