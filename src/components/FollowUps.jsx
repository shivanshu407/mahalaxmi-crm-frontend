import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../stores/store';

/**
 * Follow-ups Component
 * FEATURES: Searchable lead selection, lead details, outcome workflow
 */
export default function FollowUps() {
    const { followUps, fetchFollowUps, completeFollowUp, createFollowUp, leads, fetchLeads, isLoading, user } = useStore();

    // Modal & Form States
    const [showAddForm, setShowAddForm] = useState(false);
    const [showOutcomeModal, setShowOutcomeModal] = useState(null); // ID of follow-up being completed

    // Outcome State
    const [outcomeData, setOutcomeData] = useState({
        outcome: 'completed',
        notes: '',
        reschedule_date: ''
    });

    // Add Follow-up State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLead, setSelectedLead] = useState(null);
    const [newFollowUp, setNewFollowUp] = useState({
        lead_id: '',
        scheduled_at: '',
        type: 'call',
        notes: ''
    });

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchFollowUps(true);
        fetchLeads(); // Always fetch leads to select from
    }, []);

    // Filter leads for search - exclude clients and rejected leads
    const availableLeads = leads.filter(l => l.status !== 'client' && l.status !== 'rejected');
    const filteredLeads = searchTerm
        ? availableLeads.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.phone?.includes(searchTerm))
        : [];

    const handleSelectLead = (lead) => {
        setSelectedLead(lead);
        setNewFollowUp(prev => ({ ...prev, lead_id: lead.id }));
        setSearchTerm(lead.name);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!selectedLead) return alert('Please select a lead');

        try {
            await createFollowUp(newFollowUp);
            setShowAddForm(false);
            resetAddForm();
        } catch (error) {
            alert(error.message); // Will show "This lead already has a pending follow-up scheduled."
        }
    };

    const resetAddForm = () => {
        setNewFollowUp({ lead_id: '', scheduled_at: '', type: 'call', notes: '' });
        setSelectedLead(null);
        setSearchTerm('');
    };

    const handleOutcomeSubmit = async (e) => {
        e.preventDefault();
        if (!showOutcomeModal) return;

        await completeFollowUp(showOutcomeModal, outcomeData);
        setShowOutcomeModal(null);
        setOutcomeData({ outcome: 'completed', notes: '', reschedule_date: '' });
    };

    const getOutcomeLabel = (type) => {
        switch (type) {
            case 'completed': return '✅ Completed';
            case 'try_again': return '🔄 Try Again';
            case 'rescheduled': return '📅 Reschedule';
            case 'escalated': return '🔥 Escalate to Admin';
            case 'rejected': return '❌ Reject Lead';
            default: return type;
        }
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
                                                onClick={() => setShowOutcomeModal(followUp.id)}
                                                title="Complete"
                                            >
                                                ✓
                                            </button>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <div style={{ fontWeight: '600' }}>
                                                        {followUp.lead_name || 'Lead'}
                                                        {followUp.lead_phone && <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '8px' }}>({followUp.lead_phone})</span>}
                                                    </div>
                                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                        {followUp.lead_location && `📍 ${followUp.lead_location}`}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', display: 'flex', gap: 'var(--space-3)', marginTop: '4px' }}>
                                                    <span style={{ textTransform: 'capitalize' }}>{followUp.type}</span>
                                                    <span>•</span>
                                                    <span>{new Date(followUp.scheduled_at).toLocaleString()}</span>
                                                </div>
                                                {followUp.lead_interest && (
                                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-primary)', marginTop: '4px' }}>
                                                        Interested in: {followUp.lead_interest} {followUp.lead_budget_max && `(Budget: ${(followUp.lead_budget_max / 100000).toFixed(0)}L)`}
                                                    </div>
                                                )}
                                                {followUp.notes && (
                                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', fontStyle: 'italic' }}>
                                                        "{followUp.notes}"
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
                                <p>No pending follow-ups. Schedule one to get started!</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add Follow-up Modal */}
            {showAddForm && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddForm(false); resetAddForm(); } }}>
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Schedule Follow-up</h2>
                            <button className="btn-icon" onClick={() => { setShowAddForm(false); resetAddForm(); }}>✕</button>
                        </div>
                        <form onSubmit={handleAdd}>
                            <div className="modal-body">
                                {/* Searchable Lead Selector */}
                                <div className="form-group" style={{ position: 'relative' }}>
                                    <label className="form-label">Search Lead *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Type name or phone number..."
                                        value={searchTerm}
                                        onInput={(e) => {
                                            setSearchTerm(e.target.value);
                                            if (!e.target.value) setSelectedLead(null);
                                        }}
                                        required
                                    />
                                    {searchTerm && !selectedLead && filteredLeads.length > 0 && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0,
                                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-md)', zIndex: 10, maxHeight: '200px', overflowY: 'auto'
                                        }}>
                                            {filteredLeads.map(lead => (
                                                <div
                                                    key={lead.id}
                                                    style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                                                    onClick={() => handleSelectLead(lead)}
                                                >
                                                    <div>{lead.name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lead.phone} • {lead.location}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Lead Details Panel */}
                                {selectedLead && (
                                    <div style={{
                                        background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)',
                                        marginBottom: '16px', fontSize: '14px', position: 'relative'
                                    }}>
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedLead(null); setSearchTerm(''); setNewFollowUp(prev => ({ ...prev, lead_id: '' })); }}
                                            style={{
                                                position: 'absolute', top: '8px', right: '8px',
                                                background: 'var(--accent-danger)', color: 'white',
                                                border: 'none', borderRadius: '50%', width: '20px', height: '20px',
                                                cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title="Change lead"
                                        >
                                            ✕
                                        </button>
                                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{selectedLead.name}</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <div>📞 {selectedLead.phone}</div>
                                            <div>📍 {selectedLead.location || '-'}</div>
                                            <div>🏠 {selectedLead.interest || '-'}</div>
                                            <div>💰 {selectedLead.budget_max ? `${(selectedLead.budget_max / 100000).toFixed(0)}L` : '-'}</div>
                                            <div>🎯 {selectedLead.motive_to_buy || '-'}</div>
                                        </div>
                                    </div>
                                )}

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
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddForm(false); resetAddForm(); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={!selectedLead}>Schedule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Outcome Modal */}
            {showOutcomeModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowOutcomeModal(null)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Complete Follow-up</h2>
                            <button className="btn-icon" onClick={() => setShowOutcomeModal(null)}>✕</button>
                        </div>
                        <form onSubmit={handleOutcomeSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Outcome *</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        {['completed', 'try_again', 'rescheduled', 'escalated', 'rejected'].map(type => (
                                            <div
                                                key={type}
                                                onClick={() => setOutcomeData(d => ({ ...d, outcome: type }))}
                                                style={{
                                                    padding: '10px',
                                                    border: `1px solid ${outcomeData.outcome === type ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                                    borderRadius: 'var(--radius-md)',
                                                    background: outcomeData.outcome === type ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    fontWeight: '500',
                                                    color: type === 'rejected' ? 'var(--accent-danger)' : 'inherit'
                                                }}
                                            >
                                                {getOutcomeLabel(type)}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {(outcomeData.outcome === 'try_again' || outcomeData.outcome === 'rescheduled') && (
                                    <div className="form-group">
                                        <label className="form-label">Next Follow-up Date *</label>
                                        <input
                                            type="datetime-local"
                                            className="form-input"
                                            value={outcomeData.reschedule_date}
                                            onInput={(e) => setOutcomeData(d => ({ ...d, reschedule_date: e.target.value }))}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Outcome Notes</label>
                                    <textarea
                                        className="form-textarea"
                                        value={outcomeData.notes}
                                        onInput={(e) => setOutcomeData(d => ({ ...d, notes: e.target.value }))}
                                        placeholder="Result of the interaction..."
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowOutcomeModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-success">Complete</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
