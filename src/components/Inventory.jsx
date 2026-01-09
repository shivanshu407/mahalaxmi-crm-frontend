import { useState, useEffect } from 'preact/hooks';
import { useStore } from '../stores/store';

export default function Inventory() {
    const {
        inventory, fetchInventory, addInventory, updateInventory, deleteInventory,
        user, isLoading, showToast
    } = useStore();

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewItem, setViewItem] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        photo_link: '',
        location: '',
        size: '',
        demand: '',
        price: '',
        other_details: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchInventory();
    }, []);

    const resetForm = () => {
        setFormData({ photo_link: '', location: '', size: '', demand: '', price: '', other_details: '' });
        setEditingItem(null);
        setErrors({});
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            photo_link: item.photo_link || '',
            location: item.location || '',
            size: item.size || '',
            demand: item.demand || '',
            price: item.price || '',
            other_details: item.other_details || ''
        });
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        resetForm();
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            if (editingItem) {
                await updateInventory(editingItem.id, formData);
                showToast('Property updated successfully', 'success');
            } else {
                await addInventory(formData);
                showToast('Property added to inventory', 'success');
            }
            closeModal();
        } catch (error) {
            console.error('Error saving inventory:', error);
            showToast(error.message || 'Failed to save property', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (item) => {
        if (window.confirm(`Delete property at "${item.location}"?`)) {
            try {
                await deleteInventory(item.id);
                showToast('Property deleted', 'success');
            } catch (error) {
                showToast('Failed to delete property', 'error');
            }
        }
    };

    const filteredInventory = inventory.filter(item =>
        item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.demand?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="leads-page">
            {/* Header with title and action button on same row */}
            <div className="page-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-6)'
            }}>
                <h1 style={{ margin: 0 }}>🏠 Property Inventory</h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    ➕ Add Property
                </button>
            </div>

            {/* Search bar with proper spacing */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="🔍 Search by location, size, or demand..."
                    value={searchTerm}
                    onInput={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: '400px', width: '100%' }}
                />
            </div>

            {isLoading && inventory.length === 0 ? (
                <div className="loading" />
            ) : (
                <div className="card full-width">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Location</th>
                                    <th>Size</th>
                                    <th>Demand</th>
                                    <th>Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.map(item => (
                                    <tr
                                        key={item.id}
                                        onClick={() => setViewItem(item)}
                                        style={{ cursor: 'pointer' }}
                                        title="Click to view details"
                                    >
                                        <td style={{ fontWeight: '500' }}>{item.location}</td>
                                        <td>{item.size || '-'}</td>
                                        <td>{item.demand || '-'}</td>
                                        <td style={{ fontWeight: '600', color: 'var(--accent-success)' }}>
                                            {item.price ? `₹${Number(item.price).toLocaleString()}` : '-'}
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => openEditModal(item)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ background: '#666' }}
                                                        onClick={() => handleDelete(item)}
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredInventory.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-8)' }}>
                                            No properties in inventory yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="modal" style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingItem ? '✏️ Edit Property' : '➕ Add Property'}</h2>
                            <button className="btn-icon" onClick={closeModal}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Location *</label>
                                    <input
                                        type="text"
                                        className={`form-input ${errors.location ? 'error' : ''}`}
                                        value={formData.location}
                                        onInput={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
                                        placeholder="e.g. Andheri West, Mumbai"
                                        required
                                    />
                                    {errors.location && (
                                        <span style={{ color: 'var(--accent-danger)', fontSize: '12px', marginTop: '4px' }}>
                                            {errors.location}
                                        </span>
                                    )}
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Size</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.size}
                                            onInput={(e) => setFormData(f => ({ ...f, size: e.target.value }))}
                                            placeholder="e.g. 2 BHK / 1200 sqft"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Price (₹)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.price}
                                            onInput={(e) => setFormData(f => ({ ...f, price: e.target.value }))}
                                            placeholder="e.g. 5000000"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Demand / Category</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.demand}
                                        onInput={(e) => setFormData(f => ({ ...f, demand: e.target.value }))}
                                        placeholder="e.g. High Demand / Ready to Move"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Photo Link (Google Drive)</label>
                                    <input
                                        type="url"
                                        className="form-input"
                                        value={formData.photo_link}
                                        onInput={(e) => setFormData(f => ({ ...f, photo_link: e.target.value }))}
                                        placeholder="https://drive.google.com/..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Other Details</label>
                                    <textarea
                                        className="form-input"
                                        rows="3"
                                        value={formData.other_details}
                                        onInput={(e) => setFormData(f => ({ ...f, other_details: e.target.value }))}
                                        placeholder="Additional details about the property..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isSubmitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? '⏳ Saving...' : (editingItem ? '💾 Save Changes' : '➕ Add Property')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {viewItem && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewItem(null); }}>
                    <div className="modal" style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">🏠 Property Details</h2>
                            <button className="btn-icon" onClick={() => setViewItem(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Location</div>
                                    <div style={{ fontWeight: '600', fontSize: '18px' }}>{viewItem.location}</div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Size</div>
                                        <div>{viewItem.size || '-'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Price</div>
                                        <div style={{ fontWeight: '600', color: 'var(--accent-success)' }}>
                                            {viewItem.price ? `₹${Number(viewItem.price).toLocaleString()}` : '-'}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Demand / Category</div>
                                    <div>{viewItem.demand || '-'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Photos</div>
                                    {viewItem.photo_link ? (
                                        <a href={viewItem.photo_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>
                                            View Photos ↗
                                        </a>
                                    ) : '-'}
                                </div>
                                {viewItem.other_details && (
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Other Details</div>
                                        <div style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                                            {viewItem.other_details}
                                        </div>
                                    </div>
                                )}
                                <hr style={{ borderColor: 'var(--border-color)' }} />
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    Added by {viewItem.created_by_name || 'Unknown'} on {new Date(viewItem.created_at).toLocaleDateString('en-IN')}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setViewItem(null)}>Close</button>
                            <button type="button" className="btn btn-primary" onClick={() => { setViewItem(null); openEditModal(viewItem); }}>✏️ Edit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
