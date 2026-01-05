import { useEffect } from 'preact/hooks';
import { useStore } from '../stores/store';

/**
 * Dashboard Component
 * SPEED: Fetches data once on mount, displays cached stats
 * SUSTAINABILITY: Minimal DOM nodes for lower memory usage
 */
export default function Dashboard() {
    const { dashboardStats, fetchDashboard, warmLeads, fetchWarmLeads, isLoading, setCurrentView, user } = useStore();

    useEffect(() => {
        fetchDashboard();
        if (user?.role === 'admin') {
            fetchWarmLeads();
        }
    }, [user]);

    if (isLoading && !dashboardStats) {
        return <div className="loading" />;
    }

    const stats = dashboardStats || {
        total_leads: 0,
        leads_by_status: {},
        today_followups: 0,
        pending_tasks: 0,
        recent_leads: [],
        upcoming_followups: []
    };

    const isAdmin = user?.role === 'admin';

    return (
        <div className="content-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>Dashboard</h1>
                <button className="btn btn-primary" onClick={() => { setCurrentView('leads'); useStore.getState().openModal(); }}>
                    + New Lead
                </button>
            </div>

            {/* Stats Grid - Only visible to Admin */}
            {isAdmin && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-label">Total Leads</span>
                        <span className="stat-value">{stats.total_leads}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">New Leads</span>
                        <span className="stat-value">{stats.leads_by_status?.new || 0}</span>
                        <span className="stat-change">Fresh inquiries</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Today's Follow-ups</span>
                        <span className="stat-value">{stats.today_followups}</span>
                        <span className="stat-change">{stats.today_followups > 0 ? 'Action needed' : 'All caught up!'}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Pending Tasks</span>
                        <span className="stat-value">{stats.pending_tasks}</span>
                    </div>
                </div>
            )}

            {/* Warm Leads Section - Admin only */}
            {isAdmin && warmLeads?.length > 0 && (
                <div className="card full-width" style={{ marginBottom: 'var(--space-6)', border: '1px solid var(--accent-primary)' }}>
                    <div className="card-header">
                        <h2 className="card-title" style={{ color: 'var(--accent-primary)' }}>🔥 Warm Leads (Escalated)</h2>
                        <span className="pipeline-count">{warmLeads.length}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                        {warmLeads.map(lead => (
                            <div key={lead.id} style={{
                                background: 'rgba(59, 130, 246, 0.05)',
                                padding: 'var(--space-4)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(59, 130, 246, 0.2)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 'bold' }}>{lead.name}</span>
                                    <span className={`status-badge ${lead.status}`}>{lead.status}</span>
                                </div>
                                <div style={{ fontSize: '14px', marginBottom: '4px' }}>📞 {lead.phone}</div>
                                {lead.interest && <div style={{ fontSize: '14px', marginBottom: '4px' }}>🏠 {lead.interest}</div>}
                                {lead.budget_max && <div style={{ fontSize: '14px', marginBottom: '8px' }}>💰 {(lead.budget_max / 100000).toFixed(0)}L</div>}
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📍 {lead.location}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Employee Welcome Card */}
            {!isAdmin && (
                <div className="card" style={{ marginBottom: 'var(--space-6)', textAlign: 'center', padding: 'var(--space-8)' }}>
                    <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>Welcome, {user?.name || 'Agent'}!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
                        Add new leads and manage your follow-ups from here.
                    </p>
                    <button className="btn btn-primary" onClick={() => { setCurrentView('leads'); useStore.getState().openModal(); }}>
                        + Add New Lead
                    </button>
                </div>
            )}

            {/* Pipeline Summary - Admin only */}
            {isAdmin && (
                <div className="card" style={{ marginBottom: 'var(--space-6)', width: '100%' }}>
                    <div className="card-header">
                        <h2 className="card-title">Lead Pipeline</h2>
                        <button className="btn btn-secondary" onClick={() => setCurrentView('leads')}>
                            View All →
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        {['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map(status => (
                            <div key={status} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                                padding: 'var(--space-2) var(--space-3)',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                flex: '1 1 auto',
                                minWidth: '120px',
                                justifyContent: 'center'
                            }}>
                                <span className={`status-badge ${status}`}>{status}</span>
                                <span style={{ fontWeight: '600' }}>{stats.leads_by_status?.[status] || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Two Column Layout - Admin only */}
            {isAdmin && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', width: '100%' }}>
                    {/* Recent Leads */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Recent Leads</h2>
                        </div>
                        {stats.recent_leads?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                {stats.recent_leads.map(lead => (
                                    <div
                                        key={lead.id}
                                        className="lead-card"
                                        onClick={() => { setCurrentView('leads'); }}
                                    >
                                        <div className="lead-card-name">{lead.name}</div>
                                        <div className="lead-card-meta">
                                            <span>{lead.phone || 'No phone'}</span>
                                            <span className={`status-badge ${lead.status}`}>{lead.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <p>No leads yet. Add your first lead!</p>
                            </div>
                        )}
                    </div>

                    {/* Upcoming Follow-ups */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Upcoming Follow-ups</h2>
                        </div>
                        {stats.upcoming_followups?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                {stats.upcoming_followups.map(followUp => (
                                    <div key={followUp.id} className="lead-card">
                                        <div className="lead-card-name">{followUp.lead_name || 'Lead'}</div>
                                        <div className="lead-card-meta">
                                            <span>{followUp.type}</span>
                                            <span>{new Date(followUp.scheduled_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">📅</div>
                                <p>No upcoming follow-ups</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Employee: Only show their follow-ups */}
            {!isAdmin && (
                <div className="card" style={{ width: '100%' }}>
                    <div className="card-header">
                        <h2 className="card-title">Your Upcoming Follow-ups</h2>
                        <button className="btn btn-secondary" onClick={() => setCurrentView('followups')}>
                            View All →
                        </button>
                    </div>
                    {stats.upcoming_followups?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {stats.upcoming_followups.map(followUp => (
                                <div key={followUp.id} className="lead-card">
                                    <div className="lead-card-name">{followUp.lead_name || 'Lead'}</div>
                                    <div className="lead-card-meta">
                                        <span>{followUp.type}</span>
                                        <span>{new Date(followUp.scheduled_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">✅</div>
                            <p>No pending follow-ups. Great job staying on top of things!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
