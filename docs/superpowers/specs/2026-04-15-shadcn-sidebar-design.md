# Shadcn Sidebar — Design Spec
**Date:** 2026-04-15
**Status:** Approved

## Overview

Replace the custom `NavigationSidebar.jsx` with shadcn's `Sidebar` component primitives. Maintain the existing dark green brand palette, icon-only collapse behavior, and all current navigation structure — but flatten the "More" collapsible group so all items are visible in a single list.

## Components Used

| Shadcn Primitive | Purpose |
|---|---|
| `SidebarProvider` | Wraps layout in `App.jsx`, owns open/closed state |
| `Sidebar` | Root sidebar element, `collapsible="icon"` |
| `SidebarHeader` | Logo + collapse toggle button |
| `SidebarContent` | Scrollable nav area |
| `SidebarGroup` | Groups nav items (single group, no "More") |
| `SidebarMenu` | Ordered list of nav items |
| `SidebarMenuItem` | Individual nav item wrapper |
| `SidebarMenuButton` | Clickable nav button with icon + label |
| `SidebarFooter` | Bottom utility items + user avatar strip |
| `useSidebar()` | Hook for `open`, `toggleSidebar` state |

## Theming — CSS Variable Overrides

Add to `client/src/index.css`, replacing `.global-nav` rules:

```css
:root {
  --sidebar-background: #0d3b1a;
  --sidebar-foreground: rgba(255, 255, 255, 0.75);
  --sidebar-primary: #1f8a3e;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: rgba(255, 255, 255, 0.08);
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: rgba(255, 255, 255, 0.06);
  --sidebar-ring: #1f8a3e;
}
```

## Navigation Structure

All items in a single flat `SidebarMenu` — no collapsible "More" group:

1. Commodities (map icon) → `ROUTES.MAP`
2. Dashboard (layout dashboard icon) → `ROUTES.DASHBOARD`
3. Carriers (users icon) → `ROUTES.CARRIERS`
4. Transactions (credit card icon) → `ROUTES.TRANSACTIONS`
5. Payments (receipt icon) → `ROUTES.PAYMENTS` — pending badge
6. Assets (truck icon) → `ROUTES.ASSETS`
7. Reports (file text icon) → `ROUTES.REPORTS`
8. Statements (file text icon) → `ROUTES.STATEMENTS`

Active state: `isActive={location.pathname === item.route}` on `SidebarMenuButton`.

## Footer Items

`SidebarFooter` contains two rows:
- Utility row: Notifications (badge: 3), Chat (badge: 5), Settings (disabled)
- User row: avatar (initials "IM"), name "Ismail M.", role "Broker", logout icon

Both rows collapse to icons-only when sidebar is in icon mode.

## Collapse Behavior

- `<SidebarProvider defaultOpen={localStorage.getItem('nav-collapsed') !== 'true'}>` initializes from stored state
- `collapsible="icon"` on `<Sidebar>` — shadcn handles the icon-only collapsed rendering
- Inside `NavigationSidebar`: `useEffect(() => { localStorage.setItem('nav-collapsed', String(!open)) }, [open])` syncs state to storage
- Toggle button in `SidebarHeader` calls `toggleSidebar()`

## App.jsx Changes

- Wrap the existing layout with `<SidebarProvider>` (replace the outer `div` or add as a wrapper)
- Remove the `collapsed` prop passing — state is internal to `SidebarProvider`
- `NavigationSidebar` remains desktop-only (`!isMobile` guard stays)

## Files Changed

| File | Change |
|---|---|
| `client/src/components/NavigationSidebar.jsx` | Full rewrite using shadcn primitives |
| `client/src/components/ui/sidebar.jsx` | New — installed by shadcn CLI |
| `client/src/index.css` | Add CSS variable overrides, remove `.global-nav` rules |
| `client/src/App.jsx` | Wrap layout with `SidebarProvider` |
| `client/package.json` | Add shadcn sidebar dependency (`@radix-ui/react-tooltip` etc.) |

## Out of Scope

- Mobile navigation — unchanged
- Any other component or view
- Route structure or navigation logic
