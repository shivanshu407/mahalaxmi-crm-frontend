import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../stores/store';

/**
 * Clients Component
 * FEATURES: List clients, Search, Manual Add Client
 */
export default function Clients() {
    const { clients, fetchClients, createClient, deleteClient, isLoading } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newClient, setNewClient] = useState({
        name: '',
        phone: '',
        email: '',
        location: '',
        source: 'manual',
        deal_date: '',
        price: '',
        property_details: '',
        documents_link: ''
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        fetchClients(e.target.value);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        await createClient(newClient);
        setShowAddForm(false);
        setNewClient({ name: '', phone: '', email: '', location: '', source: 'manual', deal_date: '', price: '', property_details: '', documents_link: '' });
    };

    return (
        <div className="content-section">
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-6)',
                gap: 'var(--space-4)'
            }}>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', margin: 0 }}>Clients</h1>
                <div style={{ display: 'flex', gap: 'var(--space-4)', width: 'auto', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search clients..."
                        className="form-input"
                        style={{ width: '200px', flex: '1 1 auto' }}
                        value={searchTerm}
                        onInput={handleSearch}
                    />
                    <button className="btn btn-primary" onClick={() => setShowAddForm(true)} style={{ whiteSpace: 'nowrap' }}>
                        + Add Client
                    </button>
                </div>
            </div>

            {isLoading && clients.length === 0 ? (
                <div className="loading" />
            ) : (
                <div className="card full-width">
                    {clients.length > 0 ? (
                        <>
                            <div className="desktop-only">
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                            <th style={{ padding: 'var(--space-3)' }}>Name</th>
                                            <th style={{ padding: 'var(--space-3)' }}>Contact</th>
                                            <th style={{ padding: 'var(--space-3)' }}>Location</th>
                                            <th style={{ padding: 'var(--space-3)' }}>Source</th>
                                            <th style={{ padding: 'var(--space-3)' }}>Converted From</th>
                                            <th style={{ padding: 'var(--space-3)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clients.map(client => (
                                            <tr key={client.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: 'var(--space-3)', fontWeight: '500' }}>{client.name}</td>
                                                <td style={{ padding: 'var(--space-3)' }}>
                                                    <div>{client.phone}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{client.email}</div>
                                                </td>
                                                <td style={{ padding: 'var(--space-3)' }}>{client.location || '-'}</td>
                                                <td style={{ padding: 'var(--space-3)' }}>
                                                    <span className="status-badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                                        {client.source}
                                                    </span>
                                                </td>
                                                <td style={{ padding: 'var(--space-3)' }}>{client.lead_name ? `Lead #${client.lead_id}` : 'Manual'}</td>
                                                <td style={{ padding: 'var(--space-3)' }}>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ background: '#666' }}
                                                        onClick={() => {
                                                            if (window.confirm('Delete this client permanently?')) {
                                                                console.log('Deleting client:', client.id);
                                                                deleteClient(client.id);
                                                            }
                                                        }}
                                                        title="Delete Client"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="mobile-only">
                                {clients.map(client => (
                                    <div key={client.id} style={{
                                        background: 'var(--bg-tertiary)',
                                        padding: 'var(--space-4)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: 'var(--space-3)',
                                        border: '1px solid var(--border-color)',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '16px' }}>{client.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{client.phone}</div>
                                            </div>
                                            <button
                                                className="btn btn-sm"
                                                style={{ background: '#666', padding: '8px', minWidth: '36px' }}
                                                onClick={() => {
                                                    if (window.confirm('Delete this client permanently?')) {
                                                        deleteClient(client.id);
                                                    }
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>📧</span>
                                                <span style={{ wordBreak: 'break-all' }}>{client.email || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>📍</span>
                                                <span>{client.location || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>🏷️</span>
                                                <span className="status-badge" style={{ background: 'var(--bg-secondary)', fontSize: '12px' }}>{client.source}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    From: {client.lead_name ? `Lead #${client.lead_id}` : 'Manual Entry'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">👥</div>
                            <p>No clients yet. Convert warm leads or add one manually!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Client Modal */}
            {showAddForm && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddForm(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Add New Client</h2>
                            <button className="btn-icon" onClick={() => setShowAddForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAdd}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newClient.name}
                                        onInput={(e) => setNewClient(c => ({ ...c, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={newClient.phone}
                                            onInput={(e) => setNewClient(c => ({ ...c, phone: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={newClient.email}
                                            onInput={(e) => setNewClient(c => ({ ...c, email: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newClient.location}
                                        onInput={(e) => setNewClient(c => ({ ...c, location: e.target.value }))}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Deal Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={newClient.deal_date}
                                            onInput={(e) => setNewClient(c => ({ ...c, deal_date: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Price (₹)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={newClient.price}
                                            onInput={(e) => setNewClient(c => ({ ...c, price: e.target.value }))}
                                            placeholder="e.g. 5000000"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Property Details</label>
                                    <textarea
                                        className="form-input"
                                        rows="3"
                                        value={newClient.property_details}
                                        onInput={(e) => setNewClient(c => ({ ...c, property_details: e.target.value }))}
                                        placeholder="Description of the property..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Documents Link (Google Drive)</label>
                                    <input
                                        type="url"
                                        className="form-input"
                                        value={newClient.documents_link}
                                        onInput={(e) => setNewClient(c => ({ ...c, documents_link: e.target.value }))}
                                        placeholder="https://drive.google.com/..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Client</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
