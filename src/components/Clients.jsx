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
        source: 'manual'
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
        setNewClient({ name: '', phone: '', email: '', location: '', source: 'manual' });
    };

    return (
        <div className="content-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>Clients</h1>
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                    <input
                        type="text"
                        placeholder="Search clients..."
                        className="form-input"
                        style={{ width: '200px' }}
                        value={searchTerm}
                        onInput={handleSearch}
                    />
                    <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
                        + Add Client
                    </button>
                </div>
            </div>

            {isLoading && clients.length === 0 ? (
                <div className="loading" />
            ) : (
                <div className="card full-width">
                    {clients.length > 0 ? (
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
