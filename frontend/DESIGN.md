# Integrated Government Online Directory (IGOD) — Design System Specification

## Overview
This document defines the exact visual design system, layout rules, color palette, typography, component hierarchies, and interactive behaviors for the Integrated Government Online Directory (IGOD) and Q-GreenFleet National Mission Platform.

---

## 1. Color Palette

| Token / Usage | Hex / RGB | Description |
|---|---|---|
| **Primary Blue** | `#0076a8` | Main brand color for primary buttons, active states, icons, section highlights |
| **Dark Navy (Sectors)** | `#23354b` | Background for Sectors & Modules grid |
| **Light Cyan BG** | `#e6f7ff` | Background for "In Focus" and "New Additions" section |
| **Orange Brand Accent** | `#f48020` | "igod" logo brand accent color |
| **Pure White** | `#ffffff` | Headers, cards, content backgrounds |
| **Top Bar Gray** | `#f8f8f8` | Utility bar background |
| **Text Dark** | `#333333` | Primary body typography |
| **Text Light / Muted** | `#666666` | Secondary typography, metadata |
| **Border Gray** | `#dddddd` / `#e0e0e0` | Dividers, card borders, search bar borders |
| **Footer Deep Navy** | `#182332` | National Informatics Centre bottom bar |

---

## 2. Typography

- **Primary Font**: `'Open Sans', sans-serif`
- **Fallback Fonts**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **Sizes & Weights**:
  - `Logo Brand`: 24px bold (`#f48020`) + 18px semi-bold (`#444444`)
  - `Section Headings`: 16px - 20px uppercase, letter-spacing: 1.5px - 2px, semi-bold
  - `Card Titles`: 16px - 18px semi-bold (`#0076a8` / `#333333`)
  - `Body Copy`: 13px - 14px regular, line-height: 1.6
  - `Navigation Links`: 13px semi-bold, pill buttons (radius: 20px)
  - `Utility Bar`: 11px - 12px

---

## 3. Structural Layout & Components

### 3.1. Top Utility Bar
- **Height**: ~30px, background `#f8f8f8`, border-bottom `1px solid #ddd`
- **Left**:
  - "Skip to main content" link
  - Wheelchair accessibility icon (`fas fa-wheelchair`)
- **Right**:
  - Text resize buttons: `A-`, `A`, `A+`
  - Theme switches: Light circle (`#fff`) and Dark circle (`#333`)
  - Language selection dropdown: `English`, `हिन्दी`

### 3.2. National Header
- **Height**: ~70px, background `#ffffff`, clean shadow
- **Brand Area (Left)**:
  - National Emblem of India SVG (`https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg`, height: 50-55px)
  - Text: **`igod`** (24px, orange `#f48020`) + **Integrated Government Online Directory** (16px, `#444`)
- **Navigation (Right)**:
  - Rounded pill links (`border-radius: 20px`, padding: `6px 16px`, font-size: `12px` - `13px`)
  - Active / Hover state: background `#0076a8`, text `#ffffff`
  - Normal state: transparent, text `#444444`, hover to `#0076a8`
  - Links: `HOME`, `SCENARIO`, `OPTIMIZATION`, `BENCHMARKING`, `PREDICTION`, `EMISSIONS`, `PROVENANCE`, `LOGIN`

### 3.3. Hero Banner & Search
- **Background**: Panoramic high-resolution imagery of Parliament House / North Block (`https://upload.wikimedia.org/wikipedia/commons/4/43/Parliament_House%2C_New_Delhi.jpg`), height 350px, with `rgba(0,0,0,0.3)` overlay.
- **Search Box**:
  - Max width: 800px, translucent white backdrop (`rgba(255, 255, 255, 0.92)`), 10px padding, 5px border-radius
  - Left select box: "All Categories" (width 150px)
  - Central input: "Search for Directory / Fleet / Ports / Fuels..."
  - Right submit button: Blue `#0076a8` with magnifying glass icon
- **Sub-links**: "Advanced Search" in white italic/underline below search box.
- **Discover Tab**: Floating pill centered at bottom edge (`bottom: -15px`), white background with shadow, blue text `DISCOVER YOUR SERVICES IN`.

### 3.4. In Focus & New Additions Section
- **Background**: `#e6f7ff` light cyan, padding: 60px 0 40px
- **In Focus Card**:
  - Card style: White background, 1px border `#d0e6f5`, rounded corners, flex layout
  - Visual: Desktop computer monitor mockup displaying the national seal / portal visual
  - Content: Title ("Passport Seva / Q-GreenFleet"), descriptive text, and a blue pill "Know More" button (`#0076a8`)
- **New Additions Card**:
  - List of updated services / directory entries with forward bullet arrows
  - Blue pill "View All" button at bottom

### 3.5. Sectors & Modules Section
- **Background**: Deep Navy `#23354b`, padding: 50px 0, text color `#ffffff`
- **Heading**: Centered uppercase "SECTORS" with clean underline accent
- **Grid**: 6 columns (or responsive 2-4 columns on mobile), 12 circular icon items:
  1. Agriculture & Cooperation (`fas fa-tractor`)
  2. Animal Husbandry & Fishing (`fas fa-fish`)
  3. Maritime & Fleet Optimization (`fas fa-ship`)
  4. Commerce & Industry (`fas fa-building`)
  5. Communications (`fas fa-satellite-dish`)
  6. Defence (`fas fa-shield-alt`)
  7. Information & Technology (`fas fa-laptop-code`)
  8. Education & Training (`fas fa-graduation-cap`)
  9. Employment & Labour (`fas fa-briefcase`)
  10. Energy & Power (`fas fa-bolt`)
  11. Environment & Climate (`fas fa-tree`)
  12. Fuel & Emissions Analytics (`fas fa-smog`)
- **Button**: Centered white outline rounded button `"VIEW ALL SECTORS"`

### 3.6. Feedback & Engagement Section
- **Background**: Oceanic Blue `#0076a8`, padding: 50px 0, white text
- **Icon**: Outlined handshake icon (`far fa-handshake` / `fas fa-handshake-angle`, 40px)
- **Title**: "HELP US IN MAKING IT BETTER"
- **Subtitle**: "We welcome your participation in enhancing the Directory further and also invite your comments and suggestions for improvement."
- **Buttons**: Two pill buttons: "Suggest a Site" and "Give Feedback" (white bg with blue text or translucent white outline)
- **Connect With Us**: Social links with Twitter (`@igod_india`) and Facebook (`/igodindia`) handles

### 3.7. Partner Logos Strip
- **Background**: White `#ffffff`, padding: 25px 0, border-top & bottom `1px solid #eee`
- **Logos**: Official vector SVG logos:
  - India.gov.in
  - Digital India
  - MyGov India
  - Data.gov.in
  - PMO India

### 3.8. National Footer
- **Background**: Deep Dark Navy `#182332`, padding: 30px 0 20px, text `#aaaaaa`
- **Top Links**: `About the Portal | Sitemap | Website Policies | Feedback | Contact Us`
- **Disclaimer**:
  > This Portal is a Mission Mode Project under the National E-Governance Plan, designed and developed by National Informatics Centre (NIC), Ministry of Electronics & Information Technology, Government of India.
- **Timestamp**: `Last Updated: Oct 2026`
- **Bottom Logos**: National Informatics Centre (NIC) logo and Digital India logo.

---

## 4. Inner Pages Consistency
Every inner page (`/scenario`, `/optimization`, `/benchmarking`, `/prediction`, `/emissions`, `/provenance`, `/login`) adopts:
1. The exact same Top Utility Bar and Header with the Indian Emblem & rounded pill navigation.
2. Official government breadcrumb bar (`Home / Modules / [Page Name]`).
3. Clean cards with white backgrounds, subtle border `#dddddd`, and primary blue accents.
4. Consistent footer with NIC and Digital India credits.
