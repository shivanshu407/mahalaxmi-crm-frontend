import { useStore } from '../stores/store';

/**
 * Sidebar Navigation
 * SPEED: Pure component with minimal re-renders
 * SECURITY: Role-based menu items
 */
export default function Sidebar({ isOpen, onClose }) {
    const { currentView, setCurrentView, user, logout } = useStore();

    const isAdmin = user?.role === 'admin';

    // Admin sees all menu items, Employee sees limited options
    const navItems = isAdmin
        ? [
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'leads', label: 'New Leads', icon: '👥' },
            { id: 'warm-leads', label: 'Warm Leads', icon: '🔥' },
            { id: 'clients', label: 'Clients', icon: '🏆' },
            { id: 'inventory', label: 'Inventory', icon: '🏠' },
            { id: 'followups', label: 'Follow-ups', icon: '📞' },
            { id: 'archived-leads', label: 'Archives', icon: '🗑️' },
            { id: 'all-clients', label: 'All Clients', icon: '📊' },
            { id: 'team', label: 'Team', icon: '👔' },
            { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
        ]
        : [
            { id: 'dashboard', label: 'Home', icon: '🏠' },
            { id: 'leads', label: 'Add Lead', icon: '➕' },
            { id: 'clients', label: 'Add Client', icon: '🏆' },
            { id: 'inventory', label: 'Inventory', icon: '🏢' },
            { id: 'followups', label: 'My Follow-ups', icon: '📞' },
        ];

    const handleNavClick = (view) => {
        setCurrentView(view);
        if (window.innerWidth <= 768 && onClose) {
            onClose();
        }
    };

    return (
        <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header-mobile">
                <div className="sidebar-logo">
                    <img src="/assets/logo.svg" alt="Logo" style={{ height: '32px', width: 'auto' }} />
                    <span style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#000000' }}>Mahalaxmi Associates</span>
                </div>
                <button className="btn-icon mobile-close-btn" onClick={onClose}>✕</button>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                        onClick={() => handleNavClick(item.id)}
                    >
                        <span>{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', padding: 'var(--space-4)' }}>
                <div style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-muted)',
                    marginBottom: 'var(--space-2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)'
                }}>
                    <span style={{
                        background: isAdmin ? 'var(--accent-primary)' : 'var(--accent-success)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)',
                        textTransform: 'uppercase',
                    }}>
                        {isAdmin ? 'Admin' : 'Agent'}
                    </span>
                    {user?.name || 'User'}
                </div>
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={logout}>
                    Logout
                </button>
            </div>
        </aside>
    );
}
