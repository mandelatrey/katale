import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../routes';
import { LayoutDashboard, Users, Factory, CreditCard, Receipt, Truck, FileText, Settings, Bell, MessageSquare, LogOut, ChevronDown, ChevronUp } from './Icons';

const API_URL = '/api';

export default function NavigationSidebar({ onNavigate }) {
  const location = useLocation();
  const [pendingPayments, setPendingPayments] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

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

  const bottomMenuItems = [
    { label: 'Staff', icon: <Users className="h-4 w-4" /> },
    { label: 'Company settings', icon: <Settings className="h-4 w-4" /> },
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
    <div className="global-nav">
      <div className="global-nav-header">
        <div className="global-nav-logo">A</div>
        <div className="global-nav-brand">
          <span className="global-nav-title">Agribridge</span>
          <span className="global-nav-subtitle">Company</span>
        </div>
      </div>

      <div className="global-nav-section">
        <div className="global-nav-menu">
          {mainMenuItems.map(renderNavItem)}

          {/* More section */}
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
        </div>
      </div>

      <div className="global-nav-spacer" />

      <div className="global-nav-section">
        <div className="global-nav-menu">
          {bottomMenuItems.map((item) => (
            <div key={item.label} className="nav-item" style={{ opacity: 0.5, cursor: 'default' }}>
              <div className="nav-item-icon">{item.icon}</div>
              <span>{item.label}</span>
            </div>
          ))}
          <div className="nav-item mt-2">
            <div className="nav-item-icon"><Bell className="h-4 w-4" /></div>
            <span>Notification</span>
            <span className="nav-item-badge">3</span>
          </div>
          <div className="nav-item">
            <div className="nav-item-icon"><MessageSquare className="h-4 w-4" /></div>
            <span>Chat</span>
            <span className="nav-item-badge">5</span>
          </div>
        </div>
      </div>

      <div className="global-nav-user mt-4">
        <div className="user-avatar">
          <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-xs">IM</div>
        </div>
        <div className="user-info">
          <span className="user-name">Ismail M.</span>
          <span className="user-role">Broker</span>
        </div>
        <div className="ml-auto text-gray-500 hover:text-white transition-colors">
          <LogOut className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
