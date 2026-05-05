# Design Library Reference

This document defines the design system for all frontend pages. All new pages and components must conform to these patterns.

---

## Colour Palette

### UI Colours

| Token              | Hex       | Usage                                      |
|---------------------|-----------|---------------------------------------------|
| `navy`             | `#1B2A4A` | Navigation bar background, dark headers     |
| `primary`          | `#2D7D7D` | Primary actions, links, active states        |
| `primary-dark`     | `#246666` | Primary button hover                        |
| `primary-darker`   | `#1A4F4F` | Primary button active/pressed               |
| `primary-light`    | `#3A9E9E` | Primary highlights, focus rings             |
| `slate-900`        | `#0F172A` | Headings, Display text                      |
| `slate-700`        | `#334155` | Body text, labels                           |
| `slate-600`        | `#475569` | Secondary text                              |
| `slate-500`        | `#64748B` | Muted text, placeholders                    |
| `slate-400`        | `#94A3B8` | Disabled text, icons                        |
| `slate-300`        | `#CBD5E1` | Borders, dividers                           |
| `slate-200`        | `#E2E8F0` | Input borders, table borders                |
| `slate-100`        | `#F1F5F9` | Table headers, section backgrounds          |
| `slate-50`         | `#F8FAFC` | Page backgrounds, hover rows                |
| `white`            | `#FFFFFF` | Card backgrounds, input backgrounds         |

### Accent Colours

| Token       | Hex       | Usage                                 |
|-------------|-----------|----------------------------------------|
| `coral`     | `#EF8C7E` | Accent highlights, decorative badges   |
| `peach`     | `#FBCEB1` | Light accent backgrounds               |
| `green`     | `#6FCF97` | Positive accents                       |
| `lime`      | `#C5E17A` | Secondary positive accents             |

### Message Colours

| Token      | Hex       | Background Hex | Usage                     |
|------------|-----------|----------------|---------------------------|
| `error`    | `#EF4444` | `#FEF2F2`      | Error states, destructive |
| `warning`  | `#F59E0B` | `#FFFBEB`      | Warning states            |
| `success`  | `#22C55E` | `#F0FDF4`      | Success states            |
| `info`     | `#3B82F6` | `#EFF6FF`      | Informational states      |

---

## Typography

Font family: **Inter**, system-ui, sans-serif

| Style         | Size   | Weight    | Line Height | Usage                         |
|---------------|--------|-----------|-------------|-------------------------------|
| Display 1     | 32px   | Bold (700)| 1.2         | Page hero titles              |
| Display 2     | 24px   | Bold (700)| 1.25        | Section hero titles           |
| Heading 1     | 20px   | Semibold (600) | 1.3    | Page titles                   |
| Heading 2     | 18px   | Semibold (600) | 1.35   | Section headings              |
| Heading 3     | 16px   | Semibold (600) | 1.4    | Card headings, sub-sections   |
| Heading 4     | 14px   | Semibold (600) | 1.4    | Table headers, labels         |
| Body Large    | 16px   | Regular (400)  | 1.5    | Primary body text             |
| Body Medium   | 14px   | Regular (400)  | 1.5    | Default body text             |
| Body Small    | 12px   | Regular (400)  | 1.5    | Captions, help text           |
| Subtitle      | 11px   | Semibold (600) | 1.4    | Uppercase labels, tracking    |

---

## Spacing

Use Tailwind's default spacing scale. Key values:

| Token | Value | Usage                          |
|-------|-------|--------------------------------|
| `1`   | 4px   | Tight inner spacing            |
| `2`   | 8px   | Default inner padding          |
| `3`   | 12px  | Input padding, small gaps      |
| `4`   | 16px  | Section padding, card padding  |
| `5`   | 20px  | Section gaps                   |
| `6`   | 24px  | Large section gaps             |
| `8`   | 32px  | Page-level spacing             |

---

## Border Radius

| Token    | Value | Usage                         |
|----------|-------|-------------------------------|
| `sm`     | 2px   | Tags, small badges            |
| `md`     | 4px   | Buttons, inputs, cards        |
| `lg`     | 6px   | Dialogs, panels               |
| `full`   | 9999px| Avatars, circular badges      |

---

## Shadows

| Token     | Value                                       | Usage                    |
|-----------|----------------------------------------------|--------------------------|
| `sm`      | `0 1px 2px rgba(0,0,0,0.05)`               | Cards, dropdowns         |
| `md`      | `0 4px 6px -1px rgba(0,0,0,0.1)`           | Dialogs, popovers        |
| `lg`      | `0 10px 15px -3px rgba(0,0,0,0.1)`         | Modals                   |

---

## Components

### Buttons

**Primary Button**
* Background: `primary` (#2D7D7D)
* Text: white, 14px semibold
* Border radius: `md` (4px)
* Height: 36px (default), 32px (sm), 40px (lg)
* Padding: 16px horizontal
* Hover: `primary-dark` (#246666)
* Active: `primary-darker` (#1A4F4F)
* Disabled: opacity 50%, pointer-events none

**Secondary / Outline Button**
* Background: white
* Border: 1px `slate-300`
* Text: `slate-700`, 14px medium
* Hover: background `slate-50`, border `primary`
* Active: background `slate-100`

**Destructive Button**
* Background: `error` (#EF4444)
* Text: white
* Hover: darker red (#DC2626)

**Ghost Button**
* Background: transparent
* Text: `slate-700`
* Hover: background `slate-100`

**Link Button**
* No background or border
* Text: `primary`, underline on hover

### Inputs

**Text Input**
* Height: 36px
* Border: 1px `slate-200` (#E2E8F0)
* Border radius: `md` (4px)
* Padding: 12px horizontal
* Font: 14px regular
* Background: white
* Placeholder: `slate-400`
* Focus: border `primary`, ring 1px `primary-light`
* **State indicators (left border accent, 3px):**
  * Default: no left accent
  * Read-only: `slate-400` left border, `slate-50` background
  * Success: `success` green left border
  * Error: `error` red left border, error message below in `error` colour (12px)
* Label sits above the input (14px semibold `slate-700`, 4px margin-bottom)

**Select / Dropdown**
* Same base style as text input
* Chevron icon on right side (`slate-400`)
* Dropdown list: white background, `md` shadow, `md` border-radius
* List items: 14px, 8px vertical / 12px horizontal padding
* Selected item: `primary` background with white text
* Hover item: `slate-50` background

**Textarea**
* Same border/focus style as text input
* Min-height: 80px
* Resize: vertical only

### Checkboxes

* Size: 16x16px
* Border: 1px `slate-300`, radius 3px
* Checked: `primary` background, white checkmark
* Hover: border `primary`
* Disabled: `slate-200` background, `slate-400` border

### Radio Buttons

* Size: 16x16px
* Border: 1px `slate-300`, circular (full radius)
* Selected: `primary` outer ring, `primary` filled inner dot (6px)
* Hover: border `primary`

### Toggle / Switch

* Track: 36px wide x 20px tall, rounded-full
* Off: `slate-300` track, white knob
* On: `primary` track, white knob
* Transition: smooth 150ms

### Badges / Tags

* Border radius: `full` (pill shape)
* Padding: 2px 10px
* Font: 12px semibold
* Variants:
  * Default: `primary` bg, white text
  * Secondary: `slate-100` bg, `slate-700` text
  * Outline: white bg, `slate-300` border, `slate-700` text
  * Success: `#F0FDF4` bg, `#166534` text
  * Warning: `#FFFBEB` bg, `#92400E` text
  * Destructive: `#FEF2F2` bg, `#991B1B` text
* Dismissable tags include an X icon (12px) on the right

### Tabs

**Horizontal Tabs**
* Container: bottom border 1px `slate-200`
* Tab item: 14px medium, `slate-500` text, 12px horizontal / 8px vertical padding
* Selected: `primary` text, 2px bottom border `primary`
* Hover: `slate-700` text
* No background change on selection (underline style only)

**Vertical Tabs**
* Tab item: 14px medium, `slate-500` text, 12px horizontal / 8px vertical padding
* Selected: `primary` text, 2px left border `primary`, `slate-50` background
* Hover: `slate-100` background

### Tables / Datagrids

* Header row: `slate-100` background, `slate-600` text, 12px uppercase semibold, letter-spacing 0.05em
* Header border-bottom: 2px `slate-200`
* Body rows: white background, `slate-700` text, 14px regular
* Row border-bottom: 1px `slate-200`
* Row hover: `slate-50` background
* Padding: 12px horizontal, 8px vertical per cell
* Sticky first column where applicable (white background with shadow)
* Sort indicator: chevron icon in header, `primary` colour when active
* Actions column: icon buttons or dropdown menu, right-aligned

### Dialogs / Modals

* Overlay: black at 50% opacity
* Container: white background, `lg` border-radius (6px), `lg` shadow
* Header: `navy` (#1B2A4A) background, white text, 16px semibold, 16px padding
  * Close button (X): white, top-right corner
* Body: white background, 16px padding
* Footer: `slate-50` background, top border 1px `slate-200`, 12px vertical / 16px horizontal padding
  * Primary action button on right
  * Cancel/Close button (outline) next to it
* Max-width: 480px (sm), 640px (md), 960px (lg), full-screen (xl)

### Cards / Panels

* Background: white
* Border: 1px `slate-200`
* Border radius: `lg` (6px)
* Shadow: `sm`
* Header (optional): `slate-50` background, bottom border, 16px padding
* Body: 16px padding

### Navigation Bar (Top)

* Background: `primary` (#2D7D7D) — full width
* Height: 48px
* Logo: left side, white/light mark
* Nav items: white text, 14px medium, horizontal list
  * Active: white text with bottom underline or opacity 1
  * Inactive: white text with opacity 0.8
  * Hover: opacity 1
* Right side: user avatar (32px circle), notification bell icon
* Text colour: white

### Sidebar Navigation

* Background: white
* Width: 240px
* Items: 14px medium, `slate-700` text, 8px vertical / 16px horizontal padding
* Selected: `primary` text, `slate-50` background, 2px left border `primary`
* Hover: `slate-50` background
* Icon: 16px, `slate-500` (selected: `primary`)

### Wizard / Stepper

* Horizontal layout with numbered steps
* Step indicator: 28px circle with step number
  * Completed: `primary` background, white text/checkmark
  * Current: `primary` border, `primary` text, white background
  * Upcoming: `slate-300` border, `slate-500` text
* Step label: 12px, below the circle
* Connector line between steps: `slate-300` (completed: `primary`)

### Skeleton / Loading

* Background: `slate-200`
* Animated shimmer (pulse or wave)
* Rounded: match the element being loaded (text: 4px, avatar: full, card: 6px)

### Score Badges (Insurance-specific)

* Rounded: `md` (4px)
* Font: 10px bold
* Colour scale:
  * >= 85: `#DCFCE7` bg, `#166534` text (emerald)
  * >= 70: `#F0FDF4` bg, `#15803D` text (green)
  * >= 55: `#FEFCE8` bg, `#854D0E` text (yellow)
  * >= 40: `#FFF7ED` bg, `#C2410C` text (orange)
  * < 40: `#FEF2F2` bg, `#991B1B` text (red)

---

## Form Layout

* Label above field (not inline)
* Label: 14px semibold `slate-700`, margin-bottom 4px
* Field spacing: 16px between field groups
* Error message: 12px `error` red, 4px below the field
* Required indicator: red asterisk (*) after label text
* Help text: 12px `slate-500`, 4px below the field

---

## Responsive

* Breakpoints follow Tailwind defaults: sm (640px), md (768px), lg (1024px), xl (1280px)
* Tables scroll horizontally on small screens
* Modals go full-screen below `sm`
* Navigation collapses to hamburger menu below `md`
