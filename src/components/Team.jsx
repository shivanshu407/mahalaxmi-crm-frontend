import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../stores/store';

/**
 * Team Management Component - Admin Only
 * Allows admin to create and manage employee accounts
 */
export default function Team() {
    const { user, users, fetchUsers, deleteUser, registerUser } = useStore();
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'agent',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchUsers();
    }, []);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            await registerUser(formData);
            setMessage({ type: 'success', text: 'Employee account created successfully!' });
            resetForm();
            setShowAddForm(false);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to create account' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', role: 'agent' });
        setMessage({ type: '', text: '' });
    };

    const handleCloseModal = () => {
        setShowAddForm(false);
        resetForm();
    };

    const employees = users.filter(u => u.role !== 'admin');
    const admins = users.filter(u => u.role === 'admin');

    return (
        <div className="content-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>Team</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                        Manage employee accounts
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
                    + Add Employee
                </button>
            </div>

            {message.text && (
                <div style={{
                    background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    marginBottom: 'var(--space-4)',
                    color: message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
                }}>
                    {message.type === 'success' ? '✅' : '❌'} {message.text}
                </div>
            )}

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div className="stat-card">
                    <span className="stat-label">Total Team</span>
                    <span className="stat-value">{users.length}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Admins</span>
                    <span className="stat-value">{admins.length}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Employees</span>
                    <span className="stat-value">{employees.length}</span>
                </div>
            </div>

            {/* Team List */}
            <div className="card full-width">
                <div className="card-header">
                    <h2 className="card-title">Team Members</h2>
                </div>
                {users.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(member => (
                                    <tr key={member.id}>
                                        <td style={{ fontWeight: '600' }}>{member.name}</td>
                                        <td>{member.email}</td>
                                        <td>
                                            <span style={{
                                                background: member.role === 'admin' ? 'var(--accent-primary)' : 'var(--accent-success)',
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: 'var(--text-xs)',
                                                textTransform: 'uppercase',
                                            }}>
                                                {member.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ color: 'var(--accent-success)' }}>● Active</span>
                                        </td>
                                        <td>
                                            {member.role !== 'admin' && (
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ background: '#666', padding: '4px 8px' }}
                                                    onClick={async () => {
                                                        if (window.confirm(`Are you sure you want to delete ${member.name}? This cannot be undone.`)) {
                                                            try {
                                                                await deleteUser(member.id);
                                                            } catch (err) {
                                                                alert('Failed to delete user: ' + err.message);
                                                            }
                                                        }
                                                    }}
                                                    title="Delete Employee"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">👥</div>
                        <p>No team members yet. Add your first employee!</p>
                    </div>
                )}
            </div>

            {/* Add Employee Modal */}
            {showAddForm && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}>
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Add Employee</h2>
                            <button className="btn-icon" onClick={handleCloseModal}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        value={formData.name}
                                        onInput={handleChange}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        value={formData.email}
                                        onInput={handleChange}
                                        placeholder="john@mahalaxmi.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password *</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-input"
                                        value={formData.password}
                                        onInput={handleChange}
                                        placeholder="Minimum 6 characters"
                                        minLength="6"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select
                                        name="role"
                                        className="form-select"
                                        value={formData.role}
                                        onChange={handleChange}
                                    >
                                        <option value="agent">Agent (Employee)</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
