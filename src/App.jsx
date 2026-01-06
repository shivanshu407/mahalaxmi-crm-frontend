import { useEffect, useState } from 'preact/hooks';
import { useStore } from './stores/store';
import Dashboard from './components/Dashboard';
import Leads from './components/Leads';
import FollowUps from './components/FollowUps';
import Clients from './components/Clients';
import Team from './components/Team';
import Login from './components/Login';
import Sidebar from './components/Sidebar';

/**
 * Main App Component
 * RELIABILITY: Route-based rendering with auth protection
 * SPEED: Lazy component mounting - only render active view
 */
export default function App() {
    const { isAuthenticated, currentView, fetchSources, fetchUsers } = useStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Pre-fetch lookup data on auth
    useEffect(() => {
        if (isAuthenticated) {
            fetchSources();
            fetchUsers();
        }
    }, [isAuthenticated]);

    // Show login if not authenticated
    if (!isAuthenticated) {
        return <Login />;
    }

    // Render current view
    const renderView = () => {
        switch (currentView) {
            case 'leads':
                return <Leads mode="new" />;
            case 'warm-leads':
                return <Leads mode="warm" />;
            case 'archived-leads':
                return <Leads mode="archived" />;
            case 'followups':
                return <FollowUps />;
            case 'clients':
                return <Clients />;
            case 'team':
                return <Team />;
            case 'dashboard':
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="app-layout">
            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            {/* Mobile Header */}
            <header className="mobile-header">
                <button className="btn-icon" onClick={() => setIsMobileMenuOpen(true)}>
                    ☰
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src="/assets/logo.svg" alt="Logo" style={{ height: '24px' }} />
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>Mahalaxmi</span>
                </div>
                <div style={{ width: '32px' }}></div> {/* Spacer for centering */}
            </header>

            <main className="main-content">
                {renderView()}
            </main>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
            )}
        </div>
    );
}
