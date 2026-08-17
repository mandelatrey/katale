import { X, Phone, LogOut } from './Icons';

const ROLE_LABELS = {
  admin:   { label: 'Admin',       color: '#1f8a3e', bg: '#e6f2ea' },
  staff:   { label: 'Team Member', color: '#7c3aed', bg: '#ede9fe' },
  farmer:  { label: 'Farmer',      color: '#d97706', bg: '#fef3c7' },
  broker:  { label: 'Broker',      color: '#0284c7', bg: '#e0f2fe' },
};

function RoleBadge({ role }) {
  const cfg = ROLE_LABELS[role] || { label: role, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
      color: cfg.color, background: cfg.bg,
      padding: '4px 10px', borderRadius: 20, textTransform: 'capitalize',
    }}>
      {cfg.label}
    </span>
  );
}

function InfoRow({ icon, label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: '#f3f4f6', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: valueColor || '#111827', fontFamily: label === 'Phone' ? 'var(--font-mono)' : 'inherit' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function AccountModal({ user, onClose, onLogout }) {
  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 360,
        boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(160deg, #0d3b1a 0%, #1a5c2e 100%)',
          padding: '48px 20px 64px', position: 'relative', textAlign: 'center',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.8)', transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 10, left: -30, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        </div>

        {/* Avatar — overlaps header/body boundary */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -48 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: '#1f8a3e', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px',
            border: '4px solid #fff',
            boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
          }}>
            {initials}
          </div>

          <div style={{ marginTop: 14, textAlign: 'center', padding: '0 24px' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.2px' }}>
              {user.name}
            </div>
            <div style={{ marginTop: 6 }}>
              <RoleBadge role={user.role} />
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div style={{ margin: '20px 20px 0', padding: '4px 16px', background: '#f9fafb', borderRadius: 12, border: '1px solid #f0f0f0' }}>
          <InfoRow
            label="Phone"
            value={user.phoneE164}
            icon={
              <svg style={{ width: 15, height: 15, color: '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            }
          />
          <div style={{ borderTop: '1px solid #f0f0f0' }} />
          {joined && (
            <>
              <InfoRow
                label="Member since"
                value={joined}
                icon={
                  <svg style={{ width: 15, height: 15, color: '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
              <div style={{ borderTop: '1px solid #f0f0f0' }} />
            </>
          )}
          <InfoRow
            label="Status"
            value={user.active !== false ? 'Active' : 'Inactive'}
            valueColor={user.active !== false ? '#1f8a3e' : '#dc2626'}
            icon={
              <svg style={{ width: 15, height: 15, color: '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Sign out */}
        <div style={{ padding: '16px 20px 24px' }}>
          <button
            onClick={() => { onLogout(); onClose(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 16px', borderRadius: 10, border: '1.5px solid #fecaca',
              background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#fecaca'; }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
