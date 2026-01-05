import { useEffect, useState } from 'preact/hooks';
import { useStore, LEAD_STATUSES } from '../stores/store';
import LeadForm from './LeadForm';

// Helper to mask phone number for employees
const maskPhone = (phone) => {
    if (!phone) return '-';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) return '****';
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 4);
};

// Helper to mask email for employees
const maskEmail = (email) => {
    if (!email) return '-';
    const [local, domain] = email.split('@');
    if (!domain) return '****@****';
    return local.charAt(0) + '***@' + domain;
};

/**
 * Leads Component - Kanban Pipeline View
 * SPEED: Virtual list for large datasets, optimistic updates
 * SUSTAINABILITY: Minimal re-renders with careful state management
 */
/**
 * Leads Component - Supports New, Warm, and Archived views
 */
export default function Leads({ mode = 'new' }) {
    const {
        leads, warmLeads, fetchLeads, fetchWarmLeads, isLoading,
        isModalOpen, openModal, closeModal, selectedLead, setSelectedLead,
        updateLeadStatus, convertLeadToClient, rejectLead, scheduleVisit, deleteLead, user
    } = useStore();

    const [viewMode, setViewMode] = useState(mode === 'warm' ? 'table' : 'pipeline');
    const [filter, setFilter] = useState({ status: '', search: '' });
    const [showVisitModal, setShowVisitModal] = useState(null); // lead ID to schedule
    const [visitData, setVisitData] = useState({ scheduled_at: '', location: '', notes: '' });

    const isAdmin = user?.role === 'admin';

    // Select data source and fetch action based on mode
    const dataSource = mode === 'warm' ? warmLeads : leads;

    useEffect(() => {
        if (mode === 'warm') {
            fetchWarmLeads();
        } else if (mode === 'archived') {
            fetchLeads({ status: 'rejected' });
        } else {
            // New/Active leads (default)
            // If we want ONLY 'new' status, passing status='new' would filter strict
            // But usually 'New Leads' dashboard might mean active pipeline?
            // User said "rename... as new leads", implying the main pipeline
            // If we strictly filter status='new', they won't see other active stages.
            // So we'll fetch all non-rejected, non-client if possible?
            // Or just fetch all and let frontend filter?
            // Existing default fetchLeads gets everything (unless filtered by API).
            // Let's stick to default fetchLeads for now.
            fetchLeads();
        }
    }, [mode]);

    // Group leads by status for pipeline view
    const leadsByStatus = LEAD_STATUSES.reduce((acc, status) => {
        acc[status.id] = dataSource.filter(lead => lead.status === status.id);
        return acc;
    }, {});

    // Filtered leads for table view
    const filteredLeads = dataSource.filter(lead => {
        // Strict status filter if provided in UI
        if (filter.status && lead.status !== filter.status) return false;

        // Mode specific filtering (if data source is mixed)
        // For 'new' mode (active pipeline), hide rejected/client/warm if the API returned them
        if (mode === 'new') {
            if (lead.status === 'rejected' || lead.status === 'client' || (lead.escalated === 1 && !isAdmin)) return false;
        }

        if (filter.search) {
            const search = filter.search.toLowerCase();
            return lead.name?.toLowerCase().includes(search) ||
                lead.location?.toLowerCase().includes(search);
        }
        return true;
    });

    const handleStatusChange = async (leadId, newStatus) => {
        await updateLeadStatus(leadId, newStatus);
    };

    // Employee can only add leads, not view all (unless in their own view? keeping existing logic)
    if (!isAdmin && mode !== 'new') {
        return <div className="content-section">Access Denied</div>;
    }

    // Employee view handling (unchanged)
    if (!isAdmin && mode === 'new') {
        // ... (existing employee view logic or return logic if handled below)
        // The original code returned early for non-admin. We keep that.
        return (
            <div className="content-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                    <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>Add Lead</h1>
                </div>
                <div className="card" style={{ maxWidth: '600px' }}>
                    <div className="card-header">
                        <h2 className="card-title">Enter New Lead Details</h2>
                    </div>
                    <EmployeeLeadForm />
                </div>
            </div>
        );
    }

    const getTitle = () => {
        switch (mode) {
            case 'warm': return '🔥 Warm Leads (Escalated)';
            case 'archived': return '🗑️ Archived / Rejected Leads';
            default: return 'New Leads';
        }
    };

    return (
        <div className="content-section">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>{getTitle()}</h1>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    {mode === 'new' && (
                        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                            <button
                                className={`btn ${viewMode === 'pipeline' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setViewMode('pipeline')}
                            >
                                Pipeline
                            </button>
                            <button
                                className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setViewMode('table')}
                            >
                                Table
                            </button>
                        </div>
                    )}
                    {mode === 'new' && (
                        <button className="btn btn-primary" onClick={openModal}>
                            + New Lead
                        </button>
                    )}
                </div>
            </div>

            {/* Search and Filter */}
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search leads..."
                    value={filter.search}
                    onInput={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
                    style={{ flex: 1, maxWidth: '400px' }}
                />
                {mode === 'new' && (
                    <select
                        className="form-select"
                        value={filter.status}
                        onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
                    >
                        <option value="">All Statuses</option>
                        {LEAD_STATUSES.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                    </select>
                )}
            </div>

            {isLoading && dataSource.length === 0 ? (
                <div className="loading" />
            ) : viewMode === 'pipeline' && mode === 'new' ? (
                /* Pipeline View (Only for New/Active Leads) */
                <div className="pipeline" style={{ width: '100%' }}>
                    {LEAD_STATUSES.map(status => (
                        <div key={status.id} className="pipeline-column">
                            <div className="pipeline-header">
                                <h3 style={{ color: `var(--status-${status.color})` }}>{status.label}</h3>
                                <span className="pipeline-count">{leadsByStatus[status.id]?.length || 0}</span>
                            </div>
                            <div className="pipeline-cards">
                                {leadsByStatus[status.id]?.map(lead => (
                                    <div
                                        key={lead.id}
                                        className="lead-card"
                                        onClick={() => { setSelectedLead(lead); openModal(); }}
                                    >
                                        <div className="lead-card-name">{lead.name}</div>
                                        <div className="lead-card-meta">
                                            <span>{lead.phone || 'No phone'}</span>
                                        </div>
                                        {lead.budget_max && (
                                            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--accent-success)' }}>
                                                ₹{(lead.budget_max / 100000).toFixed(0)}L budget
                                            </div>
                                        )}
                                        {lead.location && (
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                📍 {lead.location}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Table View (Default for Warm/Archive) */
                <div className="card full-width">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Location</th>
                                    <th>Budget</th>
                                    <th>Status</th>
                                    {mode === 'warm' && <th>Escalated Info</th>}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.map(lead => (
                                    <tr key={lead.id}>
                                        <td style={{ fontWeight: '500' }}>{lead.name}</td>
                                        <td>{lead.phone || '-'}</td>
                                        <td>{lead.location || '-'}</td>
                                        <td>
                                            {lead.budget_max
                                                ? `₹${(lead.budget_max / 100000).toFixed(0)}L`
                                                : '-'
                                            }
                                        </td>
                                        <td>
                                            {mode === 'new' ? (
                                                <select
                                                    className="form-select"
                                                    value={lead.status}
                                                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                    style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-xs)' }}
                                                >
                                                    {LEAD_STATUSES.map(s => (
                                                        <option key={s.id} value={s.id}>{s.label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className={`status-badge ${lead.status}`}>{lead.status}</span>
                                            )}
                                        </td>
                                        {mode === 'warm' && (
                                            <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {lead.interest ? `Interested in ${lead.interest}` : '-'}
                                            </td>
                                        )}
                                        <td>
                                            {mode === 'warm' ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => convertLeadToClient(lead.id)}
                                                        title="Convert to Client"
                                                    >
                                                        Convert
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ background: 'var(--accent-warning)', color: 'white' }}
                                                        onClick={() => setShowVisitModal(lead)}
                                                        title="Schedule Site Visit"
                                                    >
                                                        📅 Visit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => rejectLead(lead.id)}
                                                        title="Reject / Archive"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ background: '#666' }}
                                                        onClick={() => {
                                                            if (confirm('Delete this lead permanently?')) deleteLead(lead.id);
                                                        }}
                                                        title="Delete Permanently"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            ) : mode === 'archived' ? (
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ background: '#666' }}
                                                    onClick={() => {
                                                        if (confirm('Delete this lead permanently?')) deleteLead(lead.id);
                                                    }}
                                                    title="Delete Permanently"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => { setSelectedLead(lead); openModal(); }}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ background: '#666' }}
                                                        onClick={() => {
                                                            if (confirm('Delete this lead permanently?')) deleteLead(lead.id);
                                                        }}
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredLeads.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <p>No leads found in this view.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Lead Form Modal */}
            {isModalOpen && <LeadForm />}

            {/* Visit Scheduling Modal */}
            {showVisitModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowVisitModal(null)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">📅 Schedule Site Visit</h2>
                            <button className="btn-icon" onClick={() => setShowVisitModal(null)}>✕</button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            await scheduleVisit({ ...visitData, lead_id: showVisitModal.id });
                            setShowVisitModal(null);
                            setVisitData({ scheduled_at: '', location: '', notes: '' });
                        }}>
                            <div className="modal-body">
                                <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                                    <strong>{showVisitModal.name}</strong>
                                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                        {showVisitModal.phone} • {showVisitModal.location}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Visit Date & Time *</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={visitData.scheduled_at}
                                        onInput={(e) => setVisitData(v => ({ ...v, scheduled_at: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location / Property</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={visitData.location}
                                        onInput={(e) => setVisitData(v => ({ ...v, location: e.target.value }))}
                                        placeholder="e.g., Green Valley, Sector 62"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-input"
                                        value={visitData.notes}
                                        onInput={(e) => setVisitData(v => ({ ...v, notes: e.target.value }))}
                                        rows="2"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowVisitModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">📅 Schedule Visit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Simplified form for employees - only input, no viewing data
function EmployeeLeadForm() {
    const { createLead } = useStore();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        budget_min: '',
        budget_max: '',
        location: '',
        interest: '',
        motive_to_buy: '',
        contact_person: '',
        source: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const data = {
                ...formData,
                budget_min: formData.budget_min ? parseFloat(formData.budget_min) * 100000 : null,
                budget_max: formData.budget_max ? parseFloat(formData.budget_max) * 100000 : null,
            };

            await createLead(data);
            setSuccess(true);
            setFormData({
                name: '', phone: '', email: '', budget_min: '', budget_max: '',
                location: '', interest: '', motive_to_buy: '', contact_person: '', source: '',
            });
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to create lead:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const locations = ['Gurugram', 'Noida', 'Delhi', 'Faridabad', 'Ghaziabad', 'Greater Noida', 'Dwarka', 'South Delhi', 'North Delhi'];

    return (
        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-4)' }}>
            {success && (
                <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid var(--accent-success)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    marginBottom: 'var(--space-4)',
                    color: 'var(--accent-success)',
                }}>
                    ✅ Lead added successfully!
                </div>
            )}

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input type="text" name="name" className="form-input" value={formData.name} onInput={handleChange} required />
                </div>
                <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input type="tel" name="phone" className="form-input" value={formData.phone} onInput={handleChange} placeholder="+91 9876543210" />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" name="email" className="form-input" value={formData.email} onInput={handleChange} />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Budget Min (Lakhs)</label>
                    <input type="number" name="budget_min" className="form-input" value={formData.budget_min} onInput={handleChange} min="0" />
                </div>
                <div className="form-group">
                    <label className="form-label">Budget Max (Lakhs)</label>
                    <input type="number" name="budget_max" className="form-input" value={formData.budget_max} onInput={handleChange} min="0" />
                </div>
            </div>

            {/* Location and Interest - with custom entry support */}
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                        type="text"
                        name="location"
                        className="form-input"
                        value={formData.location}
                        onInput={handleChange}
                        placeholder="Type or select location"
                        list="emp-location-options"
                    />
                    <datalist id="emp-location-options">
                        {locations.map(loc => <option key={loc} value={loc} />)}
                    </datalist>
                </div>
                <div className="form-group">
                    <label className="form-label">Interest</label>
                    <input
                        type="text"
                        name="interest"
                        className="form-input"
                        value={formData.interest}
                        onInput={handleChange}
                        placeholder="Type or select property type"
                        list="emp-interest-options"
                    />
                    <datalist id="emp-interest-options">
                        <option value="1 BHK" />
                        <option value="2 BHK" />
                        <option value="3 BHK" />
                        <option value="4 BHK" />
                        <option value="Villa" />
                        <option value="Plot" />
                        <option value="Commercial" />
                        <option value="Penthouse" />
                        <option value="Studio" />
                    </datalist>
                </div>
            </div>

            {/* Motive to Buy - with custom entry support */}
            <div className="form-group">
                <label className="form-label">Motive to Buy</label>
                <input
                    type="text"
                    name="motive_to_buy"
                    className="form-input"
                    value={formData.motive_to_buy}
                    onInput={handleChange}
                    placeholder="Type or select motive"
                    list="emp-motive-options"
                />
                <datalist id="emp-motive-options">
                    <option value="Investment" />
                    <option value="Self Use" />
                    <option value="Relocation" />
                    <option value="Upgrade" />
                    <option value="First Home" />
                    <option value="Rental Income" />
                    <option value="Office Space" />
                </datalist>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input type="text" name="contact_person" className="form-input" value={formData.contact_person} onInput={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Source</label>
                    <input
                        type="text"
                        name="source"
                        className="form-input"
                        value={formData.source}
                        onInput={handleChange}
                        placeholder="e.g., Facebook, Referral, Walk-in"
                    />
                </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-4)' }} disabled={isSubmitting}>
                {isSubmitting ? 'Adding Lead...' : '+ Add Lead'}
            </button>
        </form>
    );
}
