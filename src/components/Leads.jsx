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
export default function Leads() {
    const {
        leads, fetchLeads, isLoading,
        isModalOpen, openModal, closeModal, selectedLead, setSelectedLead,
        updateLeadStatus, user
    } = useStore();

    const [viewMode, setViewMode] = useState('pipeline');
    const [filter, setFilter] = useState({ status: '', search: '' });

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchLeads();
    }, []);

    // Group leads by status for pipeline view
    const leadsByStatus = LEAD_STATUSES.reduce((acc, status) => {
        acc[status.id] = leads.filter(lead => lead.status === status.id);
        return acc;
    }, {});

    // Filtered leads for table view
    const filteredLeads = leads.filter(lead => {
        if (filter.status && lead.status !== filter.status) return false;
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

    // Employee can only add leads, not view all
    if (!isAdmin) {
        return (
            <div className="content-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                    <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>Add Lead</h1>
                </div>

                {/* Employee Lead Entry Form */}
                <div className="card" style={{ maxWidth: '600px' }}>
                    <div className="card-header">
                        <h2 className="card-title">Enter New Lead Details</h2>
                    </div>
                    <EmployeeLeadForm />
                </div>
            </div>
        );
    }

    return (
        <div className="content-section">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>Leads</h1>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
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
                    <button className="btn btn-primary" onClick={openModal}>
                        + New Lead
                    </button>
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
            </div>

            {isLoading && leads.length === 0 ? (
                <div className="loading" />
            ) : viewMode === 'pipeline' ? (
                /* Pipeline View */
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
                                {leadsByStatus[status.id]?.length === 0 && (
                                    <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                                        No leads
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Table View */
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
                                    <th>Source</th>
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
                                            {lead.budget_min && lead.budget_max
                                                ? `₹${(lead.budget_min / 100000).toFixed(0)}L - ₹${(lead.budget_max / 100000).toFixed(0)}L`
                                                : lead.budget_max
                                                    ? `Up to ₹${(lead.budget_max / 100000).toFixed(0)}L`
                                                    : '-'
                                            }
                                        </td>
                                        <td>
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
                                        </td>
                                        <td>{lead.source_name || '-'}</td>
                                        <td>
                                            <button
                                                className="btn-icon"
                                                onClick={() => { setSelectedLead(lead); openModal(); }}
                                            >
                                                ✏️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredLeads.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <p>No leads found. Add your first lead!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Lead Form Modal */}
            {isModalOpen && <LeadForm />}
        </div>
    );
}

// Simplified form for employees - only input, no viewing data
function EmployeeLeadForm() {
    const { createLead, sources, fetchSources } = useStore();
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
        source_id: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchSources();
    }, []);

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
                source_id: formData.source_id ? parseInt(formData.source_id) : null,
            };

            await createLead(data);
            setSuccess(true);
            setFormData({
                name: '', phone: '', email: '', budget_min: '', budget_max: '',
                location: '', interest: '', motive_to_buy: '', contact_person: '', source_id: '',
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

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Location</label>
                    <select name="location" className="form-select" value={formData.location} onChange={handleChange}>
                        <option value="">Select location</option>
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Interest</label>
                    <select name="interest" className="form-select" value={formData.interest} onChange={handleChange}>
                        <option value="">Select type</option>
                        <option value="1BHK">1 BHK</option>
                        <option value="2BHK">2 BHK</option>
                        <option value="3BHK">3 BHK</option>
                        <option value="4BHK">4 BHK</option>
                        <option value="Villa">Villa</option>
                        <option value="Plot">Plot</option>
                        <option value="Commercial">Commercial</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Motive to Buy</label>
                <select name="motive_to_buy" className="form-select" value={formData.motive_to_buy} onChange={handleChange}>
                    <option value="">Select motive</option>
                    <option value="Investment">Investment</option>
                    <option value="Self Use">Self Use</option>
                    <option value="Relocation">Relocation</option>
                    <option value="Upgrade">Upgrade</option>
                    <option value="First Home">First Home</option>
                </select>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input type="text" name="contact_person" className="form-input" value={formData.contact_person} onInput={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Source</label>
                    <select name="source_id" className="form-select" value={formData.source_id} onChange={handleChange}>
                        <option value="">Select source</option>
                        {sources.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}
                    </select>
                </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-4)' }} disabled={isSubmitting}>
                {isSubmitting ? 'Adding Lead...' : '+ Add Lead'}
            </button>
        </form>
    );
}
