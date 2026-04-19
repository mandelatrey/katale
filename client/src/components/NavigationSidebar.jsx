import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../routes';
import { LayoutDashboard, Users, Factory, CreditCard, Receipt, Truck, FileText, Settings, Bell, MessageSquare, LogOut, ChevronDown, ChevronUp } from './Icons';
import * as paymentsApi from '../api/payments.js';
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
  { label: 'Commodities',  icon: Factory,          route: ROUTES.MAP },
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
    paymentsApi.listPayments({ status: 'pending', limit: 100 })
      .then(data => {
        if (Array.isArray(data)) setPendingPayments(data.length);
      })
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
              style={{ height: 30, width: 'auto', marginRight: 'auto' }}
            />
            <button
              onClick={toggleSidebar}
              title="Collapse sidebar"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center', transition: 'color 0.15s',
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
                display: 'flex', alignItems: 'center', transition: 'color 0.15s',
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
