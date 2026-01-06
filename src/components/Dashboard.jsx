import { useEffect } from 'preact/hooks';
import { useStore } from '../stores/store';

/**
 * Dashboard Component
 * SPEED: Fetches data once on mount, displays cached stats
 * SUSTAINABILITY: Minimal DOM nodes for lower memory usage
 */
export default function Dashboard() {
    const { dashboardStats, fetchDashboard, warmLeads, fetchWarmLeads, visits, fetchVisits, isLoading, setCurrentView, user } = useStore();

    // Get today and tomorrow dates for visit filter
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    useEffect(() => {
        fetchDashboard();
        if (user?.role === 'admin') {
            fetchWarmLeads();
            fetchVisits(today, tomorrow);
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

            {/* Upcoming Site Visits - Admin only */}
            {isAdmin && visits?.length > 0 && (
                <div className="card full-width" style={{ marginBottom: 'var(--space-6)', border: '1px solid var(--accent-warning)' }}>
                    <div className="card-header">
                        <h2 className="card-title" style={{ color: 'var(--accent-warning)' }}>📅 Upcoming Site Visits (Today & Tomorrow)</h2>
                        <span className="pipeline-count">{visits.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
                        {visits.map(visit => (
                            <div key={visit.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 'var(--space-3)',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                flexWrap: 'wrap',
                                gap: '8px'
                            }}>
                                <div>
                                    <strong>{visit.lead_name}</strong>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        📞 {visit.lead_phone} • 📍 {visit.location || visit.lead_location || 'TBD'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                        {new Date(visit.scheduled_at).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    <div style={{ fontSize: '14px' }}>
                                        {new Date(visit.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Employee Dashboard */}
            {!isAdmin && (
                <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
                    {/* Welcome + Quick Stats */}
                    <div className="card" style={{ padding: 'var(--space-6)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>
                            Welcome, {user?.name || 'Agent'}! 👋
                        </h2>
                        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                            <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', flex: 1, textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                    {stats.recent_leads?.filter(l => l.assigned_to === user?.id).length || 0}
                                </div>
                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>My Leads</div>
                            </div>
                            <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', flex: 1, textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: 'var(--accent-warning)' }}>
                                    {stats.upcoming_followups?.filter(f => f.user_id === user?.id).length || 0}
                                </div>
                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Pending Follow-ups</div>
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={() => setCurrentView('leads')}>
                            + Add New Lead
                        </button>
                    </div>

                    {/* My Follow-ups */}
                    {stats.upcoming_followups?.filter(f => f.user_id === user?.id).length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">📅 My Upcoming Follow-ups</h2>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
                                {stats.upcoming_followups?.filter(f => f.user_id === user?.id).slice(0, 5).map(followup => (
                                    <div key={followup.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: 'var(--space-3)',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)'
                                    }}>
                                        <div>
                                            <strong>{followup.lead_name}</strong>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{followup.notes}</div>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: '14px', color: 'var(--accent-warning)' }}>
                                            {new Date(followup.scheduled_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
