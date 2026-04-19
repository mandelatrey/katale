# Shadcn Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the custom `NavigationSidebar` with shadcn's `Sidebar` primitives, keeping the dark green palette, icon-only collapse, and a flat (non-grouped) nav list.

**Architecture:** Install the shadcn sidebar component, override its CSS variables to match the existing dark green brand, wrap `App.jsx`'s layout in `SidebarProvider`, and rewrite `NavigationSidebar.jsx` to use the shadcn primitives.

**Tech Stack:** React, shadcn/ui sidebar, Tailwind CSS v4, Radix UI, React Router v6

---

## File Map

| File | Action |
|---|---|
| `client/src/components/ui/sidebar.jsx` | **Create** — installed by shadcn CLI |
| `client/src/components/NavigationSidebar.jsx` | **Rewrite** — replace with shadcn primitives |
| `client/src/index.css` | **Modify** — add CSS variable overrides, remove `.global-nav` rules (lines 187–345) |
| `client/src/App.jsx` | **Modify** — wrap layout with `SidebarProvider` |

---

## Task 1: Install shadcn sidebar component

**Files:**
- Create: `client/src/components/ui/sidebar.jsx`

- [ ] **Step 1: Run the shadcn CLI from the client directory**

```bash
cd client && npx shadcn@latest add sidebar
```

Accept all prompts. This installs `client/src/components/ui/sidebar.jsx` and may add `@radix-ui/react-tooltip` to `package.json`.

- [ ] **Step 2: Verify the file exists**

```bash
ls client/src/components/ui/sidebar.jsx
```

Expected: file listed without error.

- [ ] **Step 3: Note the CSS variable names used in sidebar.jsx**

Open `client/src/components/ui/sidebar.jsx` and search for `--sidebar`. Note the exact variable names (they are referenced in Tailwind classes like `bg-sidebar`, `text-sidebar-foreground`, etc.). Typical names:

```
--sidebar-background  (or --sidebar)
--sidebar-foreground
--sidebar-primary
--sidebar-primary-foreground
--sidebar-accent
--sidebar-accent-foreground
--sidebar-border
--sidebar-ring
--sidebar-width
--sidebar-width-icon
```

- [ ] **Step 4: Commit**

```bash
cd client && git add src/components/ui/sidebar.jsx package.json package-lock.json
git commit -m "chore: install shadcn sidebar component"
```

---

## Task 2: Override CSS variables and remove old nav styles

**Files:**
- Modify: `client/src/index.css` (lines 187–345 contain the `.global-nav` rules to delete)

- [ ] **Step 1: Add sidebar CSS variable overrides at the top of index.css**

Insert the following block directly after the existing `:root { ... }` block (search for the closing `}` of the first `:root` rule and add after it):

```css
/* ─── Shadcn Sidebar — brand color overrides ─────────────────────────────── */
:root {
  --sidebar-background: #0d3b1a;
  --sidebar-foreground: rgba(255, 255, 255, 0.75);
  --sidebar-primary: rgba(78, 201, 107, 0.12);
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: rgba(255, 255, 255, 0.05);
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: rgba(255, 255, 255, 0.06);
  --sidebar-ring: #1f8a3e;
  --sidebar-width: 240px;
  --sidebar-width-icon: 64px;
}
```

> **Note:** If the installed `sidebar.jsx` uses `--sidebar` instead of `--sidebar-background`, rename the variable accordingly. Check by searching the file for `bg-sidebar` or `var(--sidebar`.

- [ ] **Step 2: Delete the old `.global-nav` CSS block**

Remove everything from line 187 (`/* ─── Dark Global Navigation Sidebar ───`) through line 345 (end of `.user-avatar img { ... }` rule — the entire custom nav block). Keep everything before and after it.

The block to delete starts with:
```css
/* ─── Dark Global Navigation Sidebar ───────────────────────────────────── */
.global-nav {
```
and ends after:
```css
.user-avatar img {
```
(the last rule in the nav block — check the file to confirm the exact end line).

- [ ] **Step 3: Start the dev server and confirm no CSS errors in the terminal**

```bash
cd client && npm run dev
```

Expected: no PostCSS/Tailwind errors about undefined variables.

- [ ] **Step 4: Commit**

```bash
git add client/src/index.css
git commit -m "style: replace .global-nav CSS with shadcn sidebar variable overrides"
```

---

## Task 3: Wrap App.jsx layout with SidebarProvider

**Files:**
- Modify: `client/src/App.jsx`

The current layout root is `<div className="app">`. We wrap only the desktop sidebar + content area (the `!isMobile` block) with `SidebarProvider`. The mobile layout below is untouched.

- [ ] **Step 1: Add the SidebarProvider import to App.jsx**

Find the existing import from `./components/ui/sidebar` (or add it if absent):

```js
import { SidebarProvider } from './components/ui/sidebar';
```

- [ ] **Step 2: Wrap the NavigationSidebar + content area with SidebarProvider**

Find this block in the `return` (around line 376):

```jsx
return (
  <div className="app">
    {!isMobile && (
      <NavigationSidebar
        onNavigate={navigate}
      />
    )}

    {/* ── Right-side content area ── */}
    <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'row' }}>
```

Replace `<div className="app">` with:

```jsx
return (
  <SidebarProvider
    defaultOpen={localStorage.getItem('nav-collapsed') !== 'true'}
    style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: 'white' }}
  >
    {!isMobile && (
      <NavigationSidebar
        onNavigate={navigate}
      />
    )}

    {/* ── Right-side content area ── */}
    <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'row' }}>
```

And close with `</SidebarProvider>` instead of the old `</div>` at the very end of the return.

> The `.app` class on the outer div is replaced by the inline style on `SidebarProvider` — same layout, same values.

- [ ] **Step 3: Confirm the app still renders without errors**

```bash
npm run dev
```

Open `http://localhost:5173`. The page should load (sidebar will break visually — that's fine, we haven't rewritten it yet).

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat: wrap App layout with SidebarProvider"
```

---

## Task 4: Rewrite NavigationSidebar.jsx

**Files:**
- Modify: `client/src/components/NavigationSidebar.jsx`

This is a full replacement. The new file uses shadcn primitives and the `useSidebar()` hook.

- [ ] **Step 1: Replace NavigationSidebar.jsx with the following**

```jsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../routes';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from './ui/sidebar';
import {
  LayoutDashboard, Users, Factory, CreditCard, Receipt,
  Truck, FileText, Settings, Bell, MessageSquare, LogOut,
  ChevronDown, ChevronRight,
} from './Icons';

const API_URL = '/api';

const NAV_ITEMS = [
  { label: 'Commodities',  icon: Factory,         route: ROUTES.MAP },
  { label: 'Dashboard',    icon: LayoutDashboard,  route: ROUTES.DASHBOARD },
  { label: 'Carriers',     icon: Users,            route: ROUTES.CARRIERS },
  { label: 'Transactions', icon: CreditCard,       route: ROUTES.TRANSACTIONS },
  { label: 'Payments',     icon: Receipt,          route: ROUTES.PAYMENTS },
  { label: 'Assets',       icon: Truck,            route: ROUTES.ASSETS },
  { label: 'Reports',      icon: FileText,         route: ROUTES.REPORTS },
  { label: 'Statements',   icon: FileText,         route: ROUTES.STATEMENTS },
];

export default function NavigationSidebar({ onNavigate }) {
  const location = useLocation();
  const { open, toggleSidebar } = useSidebar();
  const [pendingPayments, setPendingPayments] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/payments?status=pending&limit=100`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPendingPayments(data.length); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('nav-collapsed', String(!open));
  }, [open]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {open ? (
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 12px' }}>
            <img
              src="/assets/agribridge-logo-white.svg"
              alt="Agribridge"
              style={{ height: 30, width: 'auto', flex: 1 }}
            />
            <button
              onClick={toggleSidebar}
              title="Collapse sidebar"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >
              <ChevronDown style={{ width: 13, height: 13, transform: 'rotate(90deg)' }} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 12px', gap: 12 }}>
            <img src="/assets/agribridge-icon.svg" alt="Agribridge" style={{ width: 32, height: 32 }} />
            <button
              onClick={toggleSidebar}
              title="Expand sidebar"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >
              <ChevronRight style={{ width: 13, height: 13 }} />
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.route}
                    onClick={() => onNavigate(item.route)}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.route === ROUTES.PAYMENTS && pendingPayments > 0 && (
                      <SidebarMenuBadge>
                        {pendingPayments <= 99 ? pendingPayments : '99+'}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {[
            { label: 'Notifications', icon: Bell,          badge: 3 },
            { label: 'Chat',          icon: MessageSquare, badge: 5 },
          ].map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton tooltip={item.label}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings" disabled style={{ opacity: 0.45, cursor: 'default' }}>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '10px 12px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: '#4b5563', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 11, fontWeight: 600,
          }}>
            IM
          </div>
          {open && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>Ismail M.</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>Broker</div>
              </div>
              <LogOut
                className="h-4 w-4"
                style={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer', flexShrink: 0 }}
              />
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
```

- [ ] **Step 2: Verify the app loads correctly**

```bash
npm run dev
```

Open `http://localhost:5173`. You should see:
- Dark green sidebar with Agribridge logo
- 8 flat nav items (Commodities → Statements)
- Footer with Notifications, Chat, Settings, user strip
- Clicking the chevron button collapses to icon-only mode
- Active route highlighted

- [ ] **Step 3: Test collapse persistence**

1. Collapse the sidebar (click the toggle)
2. Refresh the page
3. Expected: sidebar opens in collapsed state

- [ ] **Step 4: Test tooltip on collapsed items**

Collapse the sidebar. Hover over a nav icon. Expected: a tooltip showing the item label appears (provided by shadcn's built-in tooltip support on `SidebarMenuButton`).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/NavigationSidebar.jsx
git commit -m "feat: replace NavigationSidebar with shadcn Sidebar primitives"
```

---

## Task 5: Fix any styling issues

This task handles common post-install issues. Check each one.

- [ ] **Step 1: Check for background bleed on the SidebarProvider wrapper**

If the area around the sidebar shows an unwanted background color, add this to `index.css`:

```css
[data-sidebar="sidebar"] {
  background-color: #0d3b1a;
}
```

- [ ] **Step 2: Check active item styling**

The active nav item should have a subtle green background and white text. If it appears unstyled, add:

```css
[data-sidebar="menu-button"][data-active="true"] {
  background-color: rgba(78, 201, 107, 0.12);
  color: #ffffff;
  border-left: 1px solid rgba(78, 201, 107, 0.3);
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
```

- [ ] **Step 3: Check hover state**

Hovering a non-active item should show a subtle white-on-dark highlight. If not:

```css
[data-sidebar="menu-button"]:hover:not([data-active="true"]) {
  background-color: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}
```

- [ ] **Step 4: Check the sidebar width in expanded vs collapsed mode**

The expanded sidebar should be 240px and collapsed should be 64px. If wrong, the CSS variable overrides from Task 2 (`--sidebar-width: 240px; --sidebar-width-icon: 64px`) should fix it. Confirm they are present in index.css.

- [ ] **Step 5: Commit any fixes**

```bash
git add client/src/index.css
git commit -m "style: fix shadcn sidebar visual overrides"
```
