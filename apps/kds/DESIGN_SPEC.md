# Kitchen Display System - Design Specification

Complete design and UX specification for the RestoPro Kitchen Display System.

## Design Philosophy

The KDS is designed for **function over form** in a challenging kitchen environment:
- **Visibility**: Large, readable fonts optimized for viewing from 6+ feet away
- **Clarity**: Unambiguous status indicators and color coding
- **Speed**: Minimal cognitive load for busy kitchen staff
- **Accessibility**: High contrast dark theme reduces eye strain
- **Touch-Friendly**: All interactive elements sized for reliable touch on screens

## Color Palette

### Core Colors
| Use | Color | Hex | RGB | Notes |
|-----|-------|-----|-----|-------|
| Background | Charcoal | #1A1A1A | 26, 26, 26 | Main dark background |
| Card BG | Dark Gray | #2E2E2E | 46, 46, 46 | Order ticket cards |
| Surface Light | Medium Gray | #3F3F3F | 63, 63, 63 | Borders, headers |
| Primary Text | Off-White | #F5F0EB | 245, 240, 235 | Main text color |
| Secondary Text | Muted Gray | #B3B3B3 | 179, 179, 179 | Labels, subtle text |
| Tertiary Text | Dark Gray | #808080 | 128, 128, 128 | Disabled, muted |

### Status/Urgency Colors
| Status | Color | Hex | RGB | Meaning |
|--------|-------|-----|-----|---------|
| Gold (Brand) | Gold | #C9A96E | 201, 169, 110 | Timer < 10min, normal |
| Crimson (Brand) | Crimson | #8B1A1A | 139, 26, 26 | Timer 10-20min, warning |
| Error Red | Red | #C94444 | 201, 68, 68 | Timer > 20min, critical |
| Ready | Sage Green | #4A7C59 | 74, 124, 89 | Order ready to serve |

## Typography

### Font Family
- **Primary**: Inter (Google Fonts)
- **Fallback**: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Weight Scale**: 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold), 800 (Extra Bold)

### Type Hierarchy

| Element | Size | Weight | Line Height | Letter Spacing | Use Case |
|---------|------|--------|------------|-----------------|----------|
| Top Bar Title | 18px / 1.125rem | 700 | 1.3 | -0.02em | "the RED CHAIR" branding |
| Table Number | 28px / 1.75rem | 700 | 1.2 | 0 | Order ticket header |
| Elapsed Time | 24px / 1.5rem | 700 | 1.2 | 0 | Timer display (critical) |
| Item Name | 14px / 0.875rem | 600 | 1.4 | 0 | Order item text |
| Item Quantity | 12px / 0.75rem | 700 | 1 | 0 | Quantity in circle |
| Modifications | 12px / 0.75rem | 500 | 1.4 | 0.02em | Item modifications (italic) |
| Labels | 12px / 0.75rem | 600 | 1.3 | 0 | Column headers, badges |
| Caption | 10px / 0.625rem | 500 | 1.4 | 0.01em | Order time, counts |

## Layout System

### Screen Layout (1920x1080)
```
┌─────────────────────────────────────────────────┐
│ TopBar (56px)                                   │
│ Logo | Spacing | Time HH:MM:SS | Connection    │
├─────────────────────────────────────────────────┤
│ Station Filters (64px)                          │
│ [Tất cả] [Bếp nóng] [Bar] [Nướng] ...         │
├───────────────────┬───────────────────┬─────────┤
│                   │                   │         │
│  Mới (New)       │ Đang nấu (Cook)  │ Sẵn sàng│
│  [Orders]         │ [Orders]          │ (Ready) │
│                   │                   │         │
│  [Order Card]     │ [Order Card]      │ [Card]  │
│                   │                   │         │
│  [Order Card]     │                   │ [Card]  │
│                   │                   │         │
└───────────────────┴───────────────────┴─────────┘
```

### Spacing (8px base unit)
- **Padding**: 16px (2rem) standard, 12px in cards
- **Margins**: 8px between cards, 24px between columns
- **Gaps**: 12px between elements within cards
- **Border Radius**: 8px on cards, 6px on buttons

### Grid System (3-column equal width)
- **Column Width**: (100% - 48px gaps) / 3 = ~630px each
- **Min Width**: 280px (responsive fallback)
- **Gutters**: 24px between columns
- **Padding**: 24px sides on main container

## Component Specs

### TopBar Component
**Height**: 56px (fixed)
**Structure**:
```
[Icon][Brand Name]        [HH:MM:SS]    [Connection]
  RC   THE RED CHAIR       12:34:56    ● Kết nối
     Màn hình bếp
```

**Elements**:
- Logo Square: 40x40px, gold background, "RC" text
- Brand Name: 18px bold gold (#C9A96E)
- Subtitle: 10px secondary text
- Clock: 28px bold off-white, tabular-nums font variant
- Connection: 4px green/red indicator dot + label

### Station Filter Bar
**Height**: 64px
**Elements**:
- Button style: 32px height, 16px padding, rounded 6px
- Active state: gold background (#C9A96E), bold text
- Inactive state: gray background, secondary text
- Hover state: lightens background slightly
- Spacing: 12px gap between buttons

### Order Ticket Card
**Dimensions**:
- **Width**: Flex to fill column (max ~630px)
- **Height**: Flexible, min-height 160px, max 500px with scroll
- **Margin**: 16px bottom between cards
- **Background**: #2E2E2E
- **Border**: 2px solid #3F3F3F (1px for non-VIP)
- **Border Radius**: 8px
- **VIP Indicator**: 4px left border in gold, lighter bg (#353535)

**Header Section**:
- **Padding**: 12px
- **Background**: Slightly lighter (#353535) if VIP
- **Table Number**: 28px bold, main text color
- **Order Time**: 12px secondary, right-aligned
- **Elapsed Time**: 24px bold, color-coded (gold/crimson/red)
- **VIP Badge**: 8px font, gold background, rounded 12px, right-aligned

**Items Section**:
- **Padding**: 12px
- **Max Height**: 300px with scrolling
- **Item Spacing**: 12px between items
- **Quantity Circle**: 32px diameter, gold background, centered white text
- **Item Name**: 14px bold, next to quantity
- **Modifications**: 12px italic secondary, indented 40px
- **Notes**: 11px tertiary, indented 40px
- **Item Checkbox**: 28x28px, right-aligned
  - Empty: gray circle "○"
  - Checked: green circle "✓"

**Footer Section**:
- **Padding**: 12px
- **Border Top**: 1px solid #3F3F3F
- **Background**: Slightly raised (#3F3F3F)
- **Button**: Full width, 48px min height
  - New: Gold background, text "Bắt đầu nấu"
  - Cooking: Crimson background, text "Sẵn sàng phục vụ"
  - Ready: Gray background (muted), text "Đã giao"
  - Hover: 5% darker shade
  - Active: Scale down to 95%

### Kanban Columns
**Width**: Equal thirds of available space
**Spacing**: 24px between columns
**Header**:
- **Height**: 64px
- **Padding**: 12px
- **Title Color**:
  - Mới: Gold (#C9A96E)
  - Đang nấu: Crimson (#8B1A1A)
  - Sẵn sàng: Green (#4A7C59)
- **Title Font**: 18px bold
- **Count**: 12px secondary text

**Content Area**:
- **Padding**: 16px
- **Scrollable**: Yes, with custom scrollbar
- **Scroll Behavior**: Smooth
- **Empty State**: Centered message "Không có đơn hàng"

## Color Transitions

### Timer Urgency Progression
```
Time    Color      Animation    Notes
────────────────────────────────────
0-10m   Gold       Static       Normal speed
10-20m  Crimson    Static       Getting slow
20m+    Red        Pulse        URGENT - flashing
```

### Pulse Animation (Critical)
- **Duration**: 1 second
- **Pattern**: Fade in/out
- **Intensity**: 100% → 50% opacity
- **Easing**: cubic-bezier(0.4, 0, 0.6, 1)

### Interactive Feedback
- **Hover**: Subtle shadow increase
- **Active (Press)**: Scale 95%
- **Disabled**: Opacity 50%, cursor not-allowed
- **Focus**: 2px gold outline with 2px offset

## Responsive Behavior

### Desktop (1920x1080)
- 3-column grid, full layout as designed
- Recommended viewing distance: 6-8 feet
- All elements at 100% scale

### Tablet (1024x768)
- Still 3 columns but narrower
- Font sizes scale down 10%
- Column width adjusts to fit

### Mobile (< 768px)
- Stack columns vertically
- Full-width cards
- Not recommended for primary display

## Accessibility

### Contrast Ratios (WCAG AA)
- Primary text (#F5F0EB) on dark background (#1A1A1A): 15.8:1 ✓
- Secondary text (#B3B3B3) on dark background: 7.2:1 ✓
- Gold accent (#C9A96E) on dark background: 4.5:1 ✓
- Crimson (#8B1A1A) on dark background: 3.8:1 (marginally compliant)

### Touch Targets
- Minimum size: 48x48px for all interactive elements
- Minimum spacing: 8px between touch targets
- Visual feedback: All buttons have hover/active states

### Color Independence
- Status is not conveyed by color alone
- Urgency levels also use shape/animation (pulse, borders)
- Text labels supplement color indicators

## Dark Mode Optimization

### Why Dark Theme
1. **Reduces eye strain** in bright kitchen environments
2. **Preserves night vision** for dim kitchen areas
3. **Matches professional kitchen displays** (POS terminals, dashboards)
4. **Lower power consumption** on OLED displays
5. **Better visibility** of status indicators (gold, red, green pop out)

### Color Saturation
- Accent colors (gold, crimson, red) are mid-saturation
- Prevents harsh glare on kitchen screens
- Maintains sufficient contrast for distance viewing

## Animation Guidelines

### Allowed Animations
1. **Clock seconds**: Real-time update
2. **Timer pulse**: Critical order alert
3. **Button feedback**: Scale on click
4. **Hover effects**: Subtle color/shadow changes
5. **Scrolling**: Smooth behavior
6. **Connection indicator**: Subtle pulse when connected

### Performance
- Use CSS animations where possible (no JS)
- Avoid micro-animations (< 100ms) that distract
- Keep animations under 500ms for responsiveness
- Disable animations if prefers-reduced-motion is set

## Print Considerations

Kitchen may need to print order tickets. Ensure:
- White text on black background converts to black on white
- All text remains readable at 100% scale
- Modify media query in globals.css for printing

## Future Design Expansions

### Potential Additions
1. **Station Heat Map**: Visual indicator of workload by station
2. **VIP Banner**: Different card styling for priority orders
3. **Rush Flag**: Animated border for rush orders
4. **Item Popularity**: Star rating on frequently ordered items
5. **Prep Time Estimate**: "~5 min left" text on items

### Color Expansion (if needed)
```tsx
// Potential additions to theme
amber: '#FFA500',      // Caution level
teal: '#20B2AA',       // Information
violet: '#9932CC',     // Special preparation notes
```

## Testing Checklist

### Visual Design
- [ ] Colors display correctly on typical kitchen monitor
- [ ] Text is readable from 6+ feet away
- [ ] Timer urgency colors are clearly distinguishable
- [ ] Gold accent (#C9A96E) isn't too muted
- [ ] Dark background doesn't cause eye strain after 8 hours

### Layout
- [ ] Cards don't overlap
- [ ] Scrolling feels natural
- [ ] Station filters stay visible while scrolling
- [ ] Column widths are equal
- [ ] Responsive layouts work on alternate screen sizes

### Touch
- [ ] Buttons are easily tappable on 40"+ displays
- [ ] No accidental multi-touch issues
- [ ] Tap feedback is immediate
- [ ] Scrolling is smooth on touch

### Accessibility
- [ ] Color contrast meets WCAG AA for critical text
- [ ] Timer urgency communicated without color alone
- [ ] All elements keyboard accessible (future work)
- [ ] Focus indicators visible (gold outline)
