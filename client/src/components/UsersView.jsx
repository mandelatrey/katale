import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, Pencil, X, Check, ChevronDown, ChevronRight, Phone } from './Icons';

function EyeIcon({ open }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
import * as usersApi from '../api/users.js';

const ROLE_LABELS = {
  admin:   { label: 'Admin',       color: '#1f8a3e', bg: '#e6f2ea' },
  staff:   { label: 'Team Member', color: '#7c3aed', bg: '#ede9fe' },
  farmer:  { label: 'Farmer',      color: '#d97706', bg: '#fef3c7' },
  broker:  { label: 'Broker',      color: '#0284c7', bg: '#e0f2fe' },
};

const CATEGORIES = [
  { key: 'all',     label: 'All Users'    },
  { key: 'admin',   label: 'Admins'       },
  { key: 'staff',   label: 'Team Members' },
  { key: 'farmer',  label: 'Farmers'      },
  { key: 'broker',  label: 'Brokers'      },
];

const PERMISSIONS = [
  { key: 'canViewCommodities',  label: 'View Commodities'  },
  { key: 'canViewTransactions', label: 'View Transactions' },
  { key: 'canViewPayments',     label: 'View Payments'     },
  { key: 'canViewReports',      label: 'View Reports'      },
  { key: 'canViewStatements',   label: 'View Statements'   },
  { key: 'canAddUsers',         label: 'Add Users'         },
];

function RoleBadge({ role }) {
  const cfg = ROLE_LABELS[role] || { label: role, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
      color: cfg.color, background: cfg.bg,
      padding: '2px 7px', borderRadius: 4, textTransform: 'capitalize',
    }}>
      {cfg.label}
    </span>
  );
}

function Avatar({ name, size = 32 }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: 8, flexShrink: 0,
      background: '#1f8a3e', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

function PermissionToggle({ label, checked, onChange, disabled }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}>
      <div
        onClick={disabled ? undefined : () => onChange(!checked)}
        style={{
          width: 32, height: 18, borderRadius: 9,
          background: checked ? '#1f8a3e' : '#d1d5db',
          position: 'relative', cursor: disabled ? 'default' : 'pointer',
          transition: 'background 0.2s ease', flexShrink: 0,
        }}
      >
        <div style={{
          width: 14, height: 14, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2,
          left: checked ? 16 : 2,
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      <span style={{ fontSize: 11, color: '#374151', userSelect: 'none' }}>{label}</span>
    </label>
  );
}

function UserRow({ user, isAdmin, onDelete, onUpdatePermissions, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [perms, setPerms] = useState(user.permissions || {});
  const [saving, setSaving] = useState(false);

  const handlePermChange = useCallback(async (key, val) => {
    if (!isAdmin) return;
    const next = { ...perms, [key]: val };
    setPerms(next);
    setSaving(true);
    try {
      await onUpdatePermissions(user._id, next);
    } finally {
      setSaving(false);
    }
  }, [perms, user._id, onUpdatePermissions, isAdmin]);

  return (
    <div style={{
      borderBottom: '1px solid #f3f4f6',
      transition: 'background 0.1s ease',
    }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 20px', cursor: 'default',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Avatar name={user.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{user.name}</span>
            <RoleBadge role={user.role} />
            {!user.active && (
              <span style={{ fontSize: 9, fontWeight: 600, color: '#dc2626', background: '#fee2e2', padding: '1px 5px', borderRadius: 3 }}>
                INACTIVE
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Phone className="h-3 w-3" style={{ color: '#9ca3af' }} />
            <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'var(--font-mono)' }}>{user.phoneE164}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {user.role === 'staff' && isAdmin && (
            <button
              onClick={() => setExpanded(v => !v)}
              title="Manage permissions"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 6,
                border: '1px solid #e5e7eb', background: '#fff',
                fontSize: 10, fontWeight: 500, color: '#374151', cursor: 'pointer',
              }}
            >
              Permissions
              {expanded
                ? <ChevronDown className="h-3 w-3" />
                : <ChevronRight className="h-3 w-3" />
              }
            </button>
          )}
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit(user)}
                title="Edit user"
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  border: '1px solid #e5e7eb', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#6b7280',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#1f8a3e'; e.currentTarget.style.color = '#1f8a3e'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={() => onDelete(user)}
                title="Remove user"
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  border: '1px solid #e5e7eb', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#6b7280',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Permissions panel — staff only */}
      {expanded && user.role === 'staff' && (
        <div style={{
          margin: '0 20px 12px',
          padding: '12px 16px',
          background: '#f9fafb',
          borderRadius: 8,
          border: '1px solid #f0f0f0',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Permissions {saving && <span style={{ color: '#1f8a3e' }}>— saving…</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px 24px' }}>
            {PERMISSIONS.map(p => (
              <PermissionToggle
                key={p.key}
                label={p.label}
                checked={!!perms[p.key]}
                onChange={(val) => handlePermChange(p.key, val)}
                disabled={!isAdmin}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddUserModal({ onClose, onSave, defaultRole }) {
  const [form, setForm] = useState({
    name: '', phoneE164: '', role: defaultRole || 'farmer', password: '',
    permissions: {
      canViewCommodities: true,
      canViewTransactions: false,
      canViewPayments: false, canViewReports: false, canViewStatements: false,
    },
  });
  const [revealPassword, setRevealPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const needsPassword = form.role === 'admin' || form.role === 'staff';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        phoneE164: form.phoneE164.trim(),
        role: form.role,
      };
      if (needsPassword) body.password = form.password;
      if (form.role === 'staff') body.permissions = form.permissions;
      await onSave(body);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb',
    borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none',
    color: '#111827', background: '#fff', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Add User</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>Add a new user to the platform</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              style={inputStyle} required
              placeholder="e.g. John Kagaba"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label style={labelStyle}>Phone (E.164 format)</label>
            <input
              style={inputStyle} required
              placeholder="+256700000000"
              value={form.phoneE164}
              onChange={e => setForm(f => ({ ...f, phoneE164: e.target.value }))}
            />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            >
              <option value="admin">Admin — full access</option>
              <option value="staff">Team Member — limited access</option>
              <option value="farmer">Farmer</option>
              <option value="broker">Broker</option>
            </select>
          </div>

          {needsPassword && (
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={revealPassword ? 'text' : 'password'}
                  style={{ ...inputStyle, paddingRight: 36 }} required
                  placeholder="Min. 8 characters"
                  minLength={8}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setRevealPassword(v => !v)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 2,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#374151'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                >
                  <EyeIcon open={revealPassword} />
                </button>
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                This user will log in with their phone number and this password.
              </div>
            </div>
          )}

          {form.role === 'staff' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Initial Permissions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                {PERMISSIONS.map(p => (
                  <PermissionToggle
                    key={p.key}
                    label={p.label}
                    checked={!!form.permissions[p.key]}
                    onChange={(val) => setForm(f => ({ ...f, permissions: { ...f.permissions, [p.key]: val } }))}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 11, color: '#dc2626', padding: '8px 10px', background: '#fee2e2', borderRadius: 6 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button
              type="button" onClick={onClose}
              style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              style={{ padding: '8px 16px', border: 'none', borderRadius: 6, background: saving ? '#9ca3af' : '#1f8a3e', color: '#fff', fontSize: 12, fontWeight: 600, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit' }}
            >
              {saving ? 'Adding…' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ name: user.name, active: user.active });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(user._id, { name: form.name.trim(), active: form.active });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb',
    borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none',
    color: '#111827', background: '#fff', boxSizing: 'border-box',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Edit User</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Full Name</label>
            <input
              style={inputStyle} required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div
              onClick={() => setForm(f => ({ ...f, active: !f.active }))}
              style={{ width: 32, height: 18, borderRadius: 9, background: form.active ? '#1f8a3e' : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s ease', flexShrink: 0 }}
            >
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: form.active ? 16 : 2, transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <span style={{ fontSize: 12, color: '#374151' }}>Account active</span>
          </label>
          {error && <div style={{ fontSize: 11, color: '#dc2626', padding: '8px 10px', background: '#fee2e2', borderRadius: 6 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '8px 16px', border: 'none', borderRadius: 6, background: saving ? '#9ca3af' : '#1f8a3e', color: '#fff', fontSize: 12, fontWeight: 600, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ user, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Remove User</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>
          Are you sure you want to remove <strong>{user.name}</strong> from the platform? This cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              try { await onConfirm(); onClose(); } finally { setDeleting(false); }
            }}
            style={{ padding: '8px 16px', border: 'none', borderRadius: 6, background: deleting ? '#9ca3af' : '#dc2626', color: '#fff', fontSize: 12, fontWeight: 600, cursor: deleting ? 'default' : 'pointer', fontFamily: 'inherit' }}
          >
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersView({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const [activeCategory, setActiveCategory] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await usersApi.listUsers({});
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (body) => {
    await usersApi.createUser(body);
    await load();
  };

  const handleEdit = async (id, body) => {
    await usersApi.updateUser(id, body);
    await load();
  };

  const handleDelete = async (id) => {
    await usersApi.deleteUser(id);
    await load();
  };

  const handleUpdatePermissions = async (id, permissions) => {
    await usersApi.updateUser(id, { permissions });
    setUsers(prev => prev.map(u => u._id === id ? { ...u, permissions } : u));
  };

  const filtered = users.filter(u => {
    const matchesCategory = activeCategory === 'all' || u.role === activeCategory;
    const q = search.toLowerCase();
    const matchesSearch = !search || u.name.toLowerCase().includes(q) || u.phoneE164.includes(q);
    return matchesCategory && matchesSearch;
  });

  const counts = {};
  CATEGORIES.forEach(c => {
    counts[c.key] = c.key === 'all' ? users.length : users.filter(u => u.role === c.key).length;
  });

  const defaultRole = activeCategory !== 'all' ? activeCategory : 'farmer';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Users</h1>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '3px 0 0', maxWidth: 260 }}>
              Manage platform users, team members, and their permissions
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8, border: 'none',
                background: '#1f8a3e', color: '#fff',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              <Plus className="h-3 w-3" />
              Add User
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: activeCategory === cat.key ? 600 : 500,
                background: activeCategory === cat.key ? '#0d3b1a' : '#f3f4f6',
                color: activeCategory === cat.key ? '#fff' : '#374151',
                fontFamily: 'inherit', transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {cat.label}
              <span style={{
                fontSize: 9, fontWeight: 700,
                background: activeCategory === cat.key ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
                color: activeCategory === cat.key ? '#fff' : '#6b7280',
                padding: '1px 5px', borderRadius: 3,
              }}>
                {counts[cat.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
        <div style={{ position: 'relative', maxWidth: 320 }}>
          <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#9ca3af' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
              border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 12, outline: 'none',
              fontFamily: 'inherit', background: '#f9fafb', color: '#111827', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* User list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#9ca3af', gap: 10 }}>
            <div style={{ width: 18, height: 18, border: '2px solid #e5e7eb', borderTopColor: '#1f8a3e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 12 }}>Loading users…</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#dc2626', fontSize: 12 }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Users className="h-8 w-8" style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>No users found</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>
              {search ? 'Try a different search term' : isAdmin ? 'Add a user to get started' : 'No users in this category yet'}
            </div>
          </div>
        ) : (
          filtered.map(u => (
            <UserRow
              key={u._id}
              user={u}
              isAdmin={isAdmin}
              onDelete={setDeleteUser}
              onEdit={setEditUser}
              onUpdatePermissions={handleUpdatePermissions}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddUserModal
          defaultRole={defaultRole}
          onClose={() => setShowAddModal(false)}
          onSave={handleAdd}
        />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={handleEdit}
        />
      )}
      {deleteUser && (
        <ConfirmDeleteModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={() => handleDelete(deleteUser._id)}
        />
      )}
    </div>
  );
}
