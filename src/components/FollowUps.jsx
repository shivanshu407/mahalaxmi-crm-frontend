import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../stores/store';

/**
 * Follow-ups Component
 * RELIABILITY: Shows pending follow-ups with quick complete action
 */
export default function FollowUps() {
    const { followUps, fetchFollowUps, completeFollowUp, createFollowUp, leads, fetchLeads, isLoading, user } = useStore();
    const [showAddForm, setShowAddForm] = useState(false);
    const [newFollowUp, setNewFollowUp] = useState({
        lead_id: '',
        scheduled_at: '',
        type: 'call',
        notes: ''
    });

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchFollowUps(true);
        if (isAdmin) fetchLeads();
    }, []);

    const handleComplete = async (id) => {
        await completeFollowUp(id);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        await createFollowUp(newFollowUp);
        setShowAddForm(false);
        setNewFollowUp({ lead_id: '', scheduled_at: '', type: 'call', notes: '' });
    };

    // Group by date
    const today = new Date().toDateString();
    const groupedFollowUps = followUps.reduce((acc, f) => {
        const date = new Date(f.scheduled_at).toDateString();
        let group = 'Upcoming';
        if (date === today) group = 'Today';
        else if (new Date(f.scheduled_at) < new Date()) group = 'Overdue';

        if (!acc[group]) acc[group] = [];
        acc[group].push(f);
        return acc;
    }, {});

    return (
        <div className="content-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>Follow-ups</h1>
                <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
                    + Schedule Follow-up
                </button>
            </div>

            {isLoading && followUps.length === 0 ? (
                <div className="loading" />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
                    {['Overdue', 'Today', 'Upcoming'].map(group => (
                        groupedFollowUps[group]?.length > 0 && (
                            <div key={group} className="card full-width">
                                <div className="card-header">
                                    <h2 className="card-title" style={{
                                        color: group === 'Overdue' ? 'var(--accent-danger)' :
                                            group === 'Today' ? 'var(--accent-warning)' : 'var(--text-primary)'
                                    }}>
                                        {group === 'Overdue' ? '⚠️ ' : group === 'Today' ? '📞 ' : '📅 '}{group}
                                    </h2>
                                    <span className="pipeline-count">{groupedFollowUps[group].length}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                    {groupedFollowUps[group].map(followUp => (
                                        <div
                                            key={followUp.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-4)',
                                                padding: 'var(--space-4)',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: 'var(--radius-md)',
                                            }}
                                        >
                                            <button
                                                className="btn btn-success"
                                                style={{ padding: 'var(--space-2)' }}
                                                onClick={() => handleComplete(followUp.id)}
                                                title="Mark as done"
                                            >
                                                ✓
                                            </button>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', marginBottom: 'var(--space-1)' }}>
                                                    {followUp.lead_name || 'Lead'}
                                                </div>
                                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', display: 'flex', gap: 'var(--space-3)' }}>
                                                    <span>{followUp.type}</span>
                                                    <span>{new Date(followUp.scheduled_at).toLocaleString()}</span>
                                                </div>
                                                {followUp.notes && (
                                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                                                        {followUp.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}

                    {followUps.length === 0 && (
                        <div className="card full-width">
                            <div className="empty-state">
                                <div className="empty-state-icon">📅</div>
                                <p>No pending follow-ups. Great job staying on top of things!</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add Follow-up Modal */}
            {showAddForm && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddForm(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Schedule Follow-up</h2>
                            <button className="btn-icon" onClick={() => setShowAddForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAdd}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Lead *</label>
                                    <select
                                        className="form-select"
                                        value={newFollowUp.lead_id}
                                        onChange={(e) => setNewFollowUp(f => ({ ...f, lead_id: parseInt(e.target.value) }))}
                                        required
                                    >
                                        <option value="">Select lead</option>
                                        {leads.map(lead => (
                                            <option key={lead.id} value={lead.id}>{lead.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Date & Time *</label>
                                        <input
                                            type="datetime-local"
                                            className="form-input"
                                            value={newFollowUp.scheduled_at}
                                            onInput={(e) => setNewFollowUp(f => ({ ...f, scheduled_at: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select
                                            className="form-select"
                                            value={newFollowUp.type}
                                            onChange={(e) => setNewFollowUp(f => ({ ...f, type: e.target.value }))}
                                        >
                                            <option value="call">📞 Call</option>
                                            <option value="whatsapp">💬 WhatsApp</option>
                                            <option value="email">📧 Email</option>
                                            <option value="meeting">🤝 Meeting</option>
                                            <option value="site_visit">🏠 Site Visit</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-textarea"
                                        value={newFollowUp.notes}
                                        onInput={(e) => setNewFollowUp(f => ({ ...f, notes: e.target.value }))}
                                        placeholder="What should be discussed?"
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
