import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../stores/store';

/**
 * Clients Component - Archive of Successful Deals
 * Admin-only view for past clients who completed purchases
 * Can be contacted for future deals
 */
export default function Clients() {
    const { leads, fetchLeads, isLoading, user } = useStore();
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchLeads();
    }, []);

    // Only show "won" leads - these are successful closed deals
    const clients = leads.filter(lead =>
        lead.status === 'won' &&
        (searchTerm === '' ||
            lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.location?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // If not admin, show access denied
    if (!isAdmin) {
        return (
            <div className="content-section">
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>🔒</div>
                    <h2>Access Restricted</h2>
                    <p style={{ color: 'var(--text-muted)' }}>This section is only accessible to administrators.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="content-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>Clients</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                        Successful deals - contact again for new opportunities
                    </p>
                </div>
                <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid var(--accent-success)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-3) var(--space-5)',
                    color: 'var(--accent-success)',
                    fontWeight: '600'
                }}>
                    {clients.length} Closed Deals
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search clients by name or location..."
                    value={searchTerm}
                    onInput={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: '400px' }}
                />
            </div>

            {isLoading && clients.length === 0 ? (
                <div className="loading" />
            ) : clients.length > 0 ? (
                <div className="card full-width">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Client Name</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Location</th>
                                    <th>Property Type</th>
                                    <th>Deal Value</th>
                                    <th>Closed Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(client => (
                                    <tr key={client.id}>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{client.name}</div>
                                            {client.contact_person && (
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                    via {client.contact_person}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <a href={`tel:${client.phone}`} style={{ color: 'var(--accent-primary)' }}>
                                                {client.phone || '-'}
                                            </a>
                                        </td>
                                        <td>
                                            <a href={`mailto:${client.email}`} style={{ color: 'var(--accent-primary)' }}>
                                                {client.email || '-'}
                                            </a>
                                        </td>
                                        <td>{client.location || '-'}</td>
                                        <td>{client.interest || '-'}</td>
                                        <td style={{ color: 'var(--accent-success)', fontWeight: '600' }}>
                                            {client.budget_max
                                                ? `₹${(client.budget_max / 100000).toFixed(0)}L`
                                                : '-'
                                            }
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                                            {client.updated_at
                                                ? new Date(client.updated_at).toLocaleDateString()
                                                : '-'
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card full-width">
                    <div className="empty-state">
                        <div className="empty-state-icon">🏆</div>
                        <p>No closed deals yet. Keep working on those leads!</p>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            {clients.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
                    <div className="stat-card">
                        <span className="stat-label">Total Clients</span>
                        <span className="stat-value">{clients.length}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Total Deal Value</span>
                        <span className="stat-value" style={{ color: 'var(--accent-success)' }}>
                            ₹{(clients.reduce((sum, c) => sum + (c.budget_max || 0), 0) / 10000000).toFixed(1)}Cr
                        </span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Top Location</span>
                        <span className="stat-value" style={{ fontSize: 'var(--text-xl)' }}>
                            {(() => {
                                const locations = clients.map(c => c.location).filter(Boolean);
                                if (locations.length === 0) return '-';
                                const counts = {};
                                locations.forEach(l => counts[l] = (counts[l] || 0) + 1);
                                return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
                            })()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
