# QuantumCue Design System v2.0

## Overview

QuantumCue Design System v2.0 transforms the platform into a modern, professional quantum AI platform with a clean light theme, smooth interactions, and subtle quantum aesthetics. The design system is optimized for technical users and investors, emphasizing clean data visualization and professional presentation.

## Color Palette

### Primary Colors (Navy - Brand)

The navy color scale serves as the primary brand color, with navy-900 (#102a43) being the logo and primary brand color.

```css
--qc-navy-50:  #f0f4f8   /* Lightest - backgrounds, hover states */
--qc-navy-100: #d9e2ec   /* Very light - borders, disabled states */
--qc-navy-200: #bcccdc   /* Light - subtle elements */
--qc-navy-300: #9fb3c8   /* Medium-light - secondary text */
--qc-navy-400: #829ab1   /* Medium - icons, labels */
--qc-navy-500: #627d98   /* Base - secondary buttons */
--qc-navy-600: #486581   /* Dark - text, primary elements */
--qc-navy-700: #334e68   /* Darker - headings */
--qc-navy-800: #243b53   /* Very dark - emphasis */
--qc-navy-900: #102a43   /* Primary brand - logo, primary buttons */
```

### Quantum Accent Colors

**Quantum Navy** - Used for AI/ML features, model metrics, quantum-related elements (replaces purple):
```css
--qc-quantum-50:  #f0f4f8   /* Lightest navy */
--qc-quantum-100: #d9e2ec   /* Very light navy */
--qc-quantum-200: #bcccdc   /* Light navy */
--qc-quantum-300: #9fb3c8   /* Medium-light navy */
--qc-quantum-400: #829ab1   /* Medium navy */
--qc-quantum-500: #334e68   /* Primary quantum accent (navy-700) */
--qc-quantum-600: #243b53   /* Dark navy */
--qc-quantum-700: #102a43   /* Darker navy */
--qc-quantum-800: #0a1f33   /* Darkest navy */
```

**Quantum Cyan** - Used for jobs, providers, real-time data:
```css
--qc-cyan-50:  #ecfeff
--qc-cyan-100: #cffafe
--qc-cyan-200: #a5f3fc
--qc-cyan-300: #67e8f9
--qc-cyan-400: #22d3ee
--qc-cyan-500: #06b6d4   /* Primary quantum cyan */
--qc-cyan-600: #0891b2
--qc-cyan-700: #0e7490
--qc-cyan-800: #155e75
```

### Semantic Colors

**Success** - Completed jobs, successful operations:
```css
--qc-success-50:  #f0fdf4
--qc-success-100: #dcfce7
--qc-success-500: #22c55e
--qc-success-600: #16a34a
--qc-success-700: #15803d
```

**Warning** - Queued, processing:
```css
--qc-warning-50:  #fffbeb
--qc-warning-100: #fef3c7
--qc-warning-500: #f59e0b
--qc-warning-600: #d97706
```

**Error** - Failed jobs, validation errors:
```css
--qc-error-50:  #fef2f2
--qc-error-100: #fee2e2
--qc-error-500: #ef4444
--qc-error-600: #dc2626
```

**Info** - General information:
```css
--qc-info-50:  #eff6ff
--qc-info-100: #dbeafe
--qc-info-500: #3b82f6
--qc-info-600: #2563eb
```

### Neutral Greys (Cool-toned)

```css
--qc-grey-50:  #f8fafc   /* Primary background */
--qc-grey-100: #f1f5f9   /* Secondary background, cards */
--qc-grey-200: #e2e8f0   /* Borders, dividers */
--qc-grey-300: #cbd5e1   /* Disabled elements */
--qc-grey-400: #94a3b8   /* Placeholder text */
--qc-grey-500: #64748b   /* Secondary text */
--qc-grey-600: #475569   /* Primary text */
--qc-grey-700: #334155   /* Headings */
--qc-grey-800: #1e293b   /* Emphasis headings */
--qc-grey-900: #0f172a   /* Maximum contrast */
```

## Typography

### Font Stack
- **Primary**: Inter (clean, modern, excellent for data)
- **Monospace**: JetBrains Mono (code, metrics)
- **Display**: Inter Display (large headings, hero text)

### Type Scale
- **Display Large**: 3.75rem (60px) - Hero headings
- **Display Medium**: 3rem (48px) - Section heroes
- **Display Small**: 2.25rem (36px) - Card headers
- **H1**: 2rem (32px) - Page titles
- **H2**: 1.5rem (24px) - Section headers
- **H3**: 1.25rem (20px) - Subsection headers
- **H4**: 1.125rem (18px) - Card titles
- **Body Large**: 1.125rem (18px) - Emphasized body
- **Body**: 1rem (16px) - Standard body
- **Small**: 0.875rem (14px) - Secondary info
- **Extra Small**: 0.75rem (12px) - Labels, captions

## Components

### Buttons

**Primary Button** - Navy gradient, for main actions:
```typescript
<Button variant="primary">Primary Action</Button>
```

**Quantum Button** - Navy-cyan gradient, for special CTAs:
```typescript
<Button variant="quantum">Quantum Action</Button>
```

**Secondary Button** - Flat, for secondary actions:
```typescript
<Button variant="secondary">Secondary Action</Button>
```

**Ghost Button** - Transparent, for subtle actions:
```typescript
<Button variant="ghost">Ghost Action</Button>
```

### Cards

**Standard Card**:
```typescript
<Card>Content</Card>
```

**Elevated Card** - With hover lift effect:
```typescript
<Card variant="elevated">Content</Card>
```

**Stat Card** - With gradient accent bar on hover:
```typescript
<Card variant="stat">Content</Card>
```

### Badges

```typescript
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="quantum">Quantum</Badge>
```

## Charts (Recharts)

All charts use Recharts library with consistent styling:

### Chart Components
- `ChartContainer` - Wrapper with consistent styling
- `CustomTooltip` - Branded tooltip component
- `GradientDefs` - SVG gradient definitions

### Chart Colors
- Primary: Quantum navy (#334e68)
- Secondary: Quantum cyan (#06b6d4)
- Success: Green (#22c55e)
- Comparison: Grey (#64748b) for classical

### Animation
- Duration: 800ms
- Easing: ease-out
- Stagger delay: 100ms between series

## Animations

### Principles
1. Purposeful - Enhance understanding, not distract
2. Fast - Keep under 300ms for interactions
3. Smooth - Use cubic-bezier easing
4. Subtle - Prefer opacity and transform
5. Respect `prefers-reduced-motion`

### Common Animations
- **Fade In**: `animate-fade-in` (300ms)
- **Scale Pop**: `animate-scale-pop` (200ms)
- **Shimmer**: `animate-shimmer` (2s infinite) - for loading
- **Pulse**: `animate-pulse-slow` (3s infinite) - for live indicators

## Dark Mode

Dark mode is supported as an optional toggle. All components include dark mode variants using the `dark:` prefix.

### Theme Management
```typescript
import { useTheme } from '@/contexts/ThemeContext';

const { theme, toggleTheme } = useTheme();
```

### Implementation
- Light theme is default
- Dark mode toggle in Header
- Preference persisted in localStorage
- System preference detection on first load

## Logo Usage

### Logo Variants
- `variant="q"` - Q logo only (favicon, sidebar, compact)
- `variant="full"` - Logo + "QuantumCue" text (headers, navigation)
- `variant="full-with-tagline"` - Logo + text + tagline (login, marketing)

### Logo Files
- `/public/logo-q.svg` - Q logo (navy #102a43)
- `/public/logo-full.svg` - Full logo with tagline
- Favicon files (PNG/ICO formats) - Generated from Q logo

## Spacing System

Base unit: 4px
- 1 = 0.25rem (4px)
- 2 = 0.5rem (8px)
- 3 = 0.75rem (12px)
- 4 = 1rem (16px)
- 6 = 1.5rem (24px)
- 8 = 2rem (32px)
- 12 = 3rem (48px)
- 16 = 4rem (64px)

## Gradients

### Button Gradients
- `bg-gradient-primary` - Navy gradient (102a43 → 243b53)
- `bg-gradient-quantum` - Quantum gradient (334e68 → 243b53)

### Chart Gradients
- `url(#barGradient)` - Vertical navy to cyan
- `url(#purpleGradient)` - Navy gradient (legacy name)
- `url(#cyanGradient)` - Cyan gradient
- `url(#quantumGradient)` - Horizontal navy to cyan

## Accessibility

- WCAG AA color contrast compliance
- Keyboard navigation for all interactive elements
- ARIA labels for charts and complex components
- Screen reader support
- Respect `prefers-reduced-motion`

## Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Charts are responsive by default (Recharts)
- Grid layouts adapt: 4-col → 2-col → 1-col

## Implementation Status

✅ Tailwind configuration updated
✅ Global CSS with light/dark theme support
✅ Base UI components (Button, Card, Input, Badge, LoadingSpinner, Skeleton)
✅ Chart infrastructure (Recharts)
✅ Logo component with variants
✅ Theme context and toggle
✅ Dashboard redesign
✅ Job Results redesign
✅ Model Metrics redesign
✅ Layout components (Sidebar, Header, MainLayout, PageContainer)
✅ Login page with new logo

## Notes

- Favicon PNG/ICO files need to be generated from logo-q.svg
- Some pages may still need design system updates (Jobs, Models, Datasets, Providers, Settings)
- Animations can be enhanced with framer-motion if needed
- Chart performance should be monitored with large datasets

