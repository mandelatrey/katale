import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../routes';
import { LayoutDashboard, Users, Factory, CreditCard, Receipt, Truck, FileText, Settings, Bell, MessageSquare, LogOut, ChevronDown, ChevronUp } from './Icons';

const API_URL = '/api';

export default function NavigationSidebar({ onNavigate }) {
  const location = useLocation();
  const [pendingPayments, setPendingPayments] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('nav-collapsed') === 'true'; } catch { return false; }
  });

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('nav-collapsed', String(next)); } catch {}
  }

  useEffect(() => {
    fetch(`${API_URL}/payments?status=pending&limit=100`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setPendingPayments(data.length);
      })
      .catch(() => {});
  }, []);

  const mainMenuItems = [
    { label: 'Commodities', icon: <Factory className="h-4 w-4" />, route: ROUTES.MAP },
    { label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, route: ROUTES.DASHBOARD },
    { label: 'Carriers', icon: <Users className="h-4 w-4" />, route: ROUTES.CARRIERS },
    { label: 'Transactions', icon: <CreditCard className="h-4 w-4" />, route: ROUTES.TRANSACTIONS },
    { label: 'Payments', icon: <Receipt className="h-4 w-4" />, route: ROUTES.PAYMENTS },
  ];

  const moreMenuItems = [
    { label: 'Assets', icon: <Truck className="h-4 w-4" />, route: ROUTES.ASSETS },
    { label: 'Reports', icon: <FileText className="h-4 w-4" />, route: ROUTES.REPORTS },
    { label: 'Statements', icon: <FileText className="h-4 w-4" />, route: ROUTES.STATEMENTS },
  ];

  // Auto-expand "More" if current route is one of the more items
  const isMoreRoute = moreMenuItems.some(item => item.route === location.pathname);

  const renderNavItem = (item) => (
    <div
      key={item.label}
      className={`nav-item ${location.pathname === item.route ? 'active' : ''}`}
      onClick={() => onNavigate(item.route)}
      style={{ cursor: 'pointer' }}
    >
      <div className="nav-item-icon">{item.icon}</div>
      <span>{item.label}</span>
      {item.route === ROUTES.PAYMENTS && pendingPayments > 0 && (
        <span style={{
          background: '#dc2626',
          color: '#fff',
          fontSize: 10,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 4,
          padding: '0 4px',
          fontWeight: 600,
          lineHeight: 1,
        }}>
          {pendingPayments <= 99 ? pendingPayments : '99+'}
        </span>
      )}
    </div>
  );

  return (
    <div className={`global-nav${collapsed ? ' collapsed' : ''}`}>
      {/* ── Header: logo + collapse toggle ── */}
      {collapsed ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 12px', gap: 12 }}>
          <img src="/assets/agribridge-icon.svg" alt="Agribridge" style={{ width: 32, height: 32 }} />
          <button
            onClick={toggleCollapse}
            title="Expand sidebar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          >
            <ChevronDown style={{ width: 13, height: 13, transform: 'rotate(-90deg)' }} />
          </button>
        </div>
      ) : (
        <div className="global-nav-header">
          <img src="/assets/agribridge-logo-white.svg" alt="Agribridge" style={{ height: 30, width: 'auto', flexShrink: 0 }} />
          <button
            onClick={toggleCollapse}
            title="Collapse sidebar"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6, transition: 'color 0.15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          >
            <ChevronDown style={{ width: 13, height: 13, transform: 'rotate(90deg)' }} />
          </button>
        </div>
      )}

      <div className="global-nav-section">
        <div className="global-nav-menu">
          {mainMenuItems.map(renderNavItem)}

          {/* More section — hidden when collapsed */}
          {!collapsed && (
            <>
              <div
                className="nav-item"
                onClick={() => setMoreOpen(o => !o)}
                style={{ cursor: 'pointer' }}
              >
                <div className="nav-item-icon">
                  {(moreOpen || isMoreRoute) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                <span>More</span>
              </div>
              {(moreOpen || isMoreRoute) && moreMenuItems.map(renderNavItem)}
            </>
          )}
        </div>
      </div>

      <div className="global-nav-spacer" />

      <div className="global-nav-section">
        <div className="global-nav-menu">
          <div className="nav-item">
            <div className="nav-item-icon"><Bell className="h-4 w-4" /></div>
            <span>Notifications</span>
            <span className="nav-item-badge">3</span>
          </div>
          <div className="nav-item">
            <div className="nav-item-icon"><MessageSquare className="h-4 w-4" /></div>
            <span>Chat</span>
            <span className="nav-item-badge">5</span>
          </div>
          <div className="nav-item" style={{ opacity: 0.45, cursor: 'default' }}>
            <div className="nav-item-icon"><Settings className="h-4 w-4" /></div>
            <span>Settings</span>
          </div>
        </div>
      </div>

      <div className="global-nav-user mt-4">
        <div className="user-avatar">
          <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-xs">IM</div>
        </div>
        {!collapsed && (
          <>
            <div className="user-info">
              <span className="user-name">Ismail M.</span>
              <span className="user-role">Broker</span>
            </div>
            <div className="ml-auto text-gray-500 hover:text-white transition-colors">
              <LogOut className="h-4 w-4" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
