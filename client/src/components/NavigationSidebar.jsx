import { LayoutDashboard, Users, Truck, Factory, CreditCard, Receipt, FileText, Settings, Bell, MessageSquare, LogOut } from 'lucide-react';

export default function NavigationSidebar({ activeView = 'map', onNavigate }) {
  // Map nav labels to view keys
  const VIEW_MAP = {
    'Dashboard': 'dashboard',
    'Commodities': 'map',
  };

  const mainMenuItems = [
    { label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, view: 'dashboard' },
    { label: 'Carriers', icon: <Users className="h-4 w-4" /> },
    { label: 'Assets', icon: <Truck className="h-4 w-4" /> },
    { label: 'Commodities', icon: <Factory className="h-4 w-4" />, view: 'map' },
    { label: 'Transactions', icon: <CreditCard className="h-4 w-4" /> },
    { label: 'Payments', icon: <Receipt className="h-4 w-4" /> },
    { label: 'Reports', icon: <FileText className="h-4 w-4" /> },
    { label: 'Statements', icon: <FileText className="h-4 w-4" /> },
  ];

  const bottomMenuItems = [
    { label: 'Staff', icon: <Users className="h-4 w-4" /> },
    { label: 'Company settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const getActiveLabel = () => {
    const found = mainMenuItems.find(i => i.view === activeView);
    return found?.label ?? 'Commodities';
  };

  const activeLabel = getActiveLabel();

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
          {mainMenuItems.map((item) => (
            <div
              key={item.label}
              className={`nav-item ${activeLabel === item.label ? 'active' : ''}`}
              onClick={() => item.view && onNavigate ? onNavigate(item.view) : undefined}
              style={{ cursor: item.view ? 'pointer' : 'default', opacity: item.view ? 1 : 0.5 }}
            >
              <div className="nav-item-icon">{item.icon}</div>
              <span>{item.label}</span>
            </div>
          ))}
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
