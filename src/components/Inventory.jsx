import { useState, useEffect } from 'preact/hooks';
import { useStore } from '../stores/store';

// Property type options for dropdown
const PROPERTY_TYPES = [
    'Residential Apartment',
    'Independent House/Villa',
    'Plot/Land',
    'Commercial Shop',
    'Commercial Office',
    'Agricultural Land',
    'Industrial',
    'Warehouse',
    'Other'
];

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
        property_type: '',
        listing_type: 'sale',
        status: 'available',
        is_hot: false,
        price: '',
        other_details: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchInventory();
    }, []);

    const resetForm = () => {
        setFormData({
            photo_link: '', location: '', size: '', demand: '',
            property_type: '', listing_type: 'sale', status: 'available', is_hot: false,
            price: '', other_details: ''
        });
        setEditingItem(null);
        setErrors({});
    };

    const openAddModal = () => {
        // Prefill with dummy data for easy testing
        setFormData({
            photo_link: '',
            location: 'Andheri West, Mumbai',
            size: '2 BHK - 850 sqft',
            demand: 'High',
            property_type: 'Residential Apartment',
            listing_type: 'sale',
            status: 'available',
            is_hot: false,
            price: '7500000',
            other_details: 'Sea facing, 5th floor, covered parking'
        });
        setEditingItem(null);
        setErrors({});
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            photo_link: item.photo_link || '',
            location: item.location || '',
            size: item.size || '',
            demand: item.demand || '',
            property_type: item.property_type || '',
            listing_type: item.listing_type || 'sale',
            status: item.status || 'available',
            is_hot: item.is_hot || false,
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
                                    <th>Type</th>
                                    <th>Size</th>
                                    <th>Price</th>
                                    <th>Status</th>
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
                                        <td style={{ fontWeight: '500' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {item.is_hot && <span title="Hot Property">🔥</span>}
                                                {item.location}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                {item.listing_type === 'rent' ? '🏷️ Rent' : '🏠 Sale'}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '12px' }}>{item.property_type || '-'}</td>
                                        <td>{item.size || '-'}</td>
                                        <td style={{ fontWeight: '600', color: 'var(--accent-success)' }}>
                                            {item.price ? `₹${Number(item.price).toLocaleString('en-IN')}` : '-'}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                background: item.status === 'engaged' ? '#FEF3C7' :
                                                    item.status === 'sold' ? '#FEE2E2' : '#D1FAE5',
                                                color: item.status === 'engaged' ? '#92400E' :
                                                    item.status === 'sold' ? '#991B1B' : '#065F46'
                                            }}>
                                                {item.status === 'engaged' ? '🔒 Engaged' :
                                                    item.status === 'sold' ? '✓ Sold' : '✓ Available'}
                                            </span>
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
                                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-8)' }}>
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

                                {/* Property Type and Listing Type Row */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Property Type</label>
                                        <select
                                            className="form-select"
                                            value={formData.property_type}
                                            onChange={(e) => setFormData(f => ({ ...f, property_type: e.target.value }))}
                                        >
                                            <option value="">Select Type</option>
                                            {PROPERTY_TYPES.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">For Sale / Rent</label>
                                        <select
                                            className="form-select"
                                            value={formData.listing_type}
                                            onChange={(e) => setFormData(f => ({ ...f, listing_type: e.target.value }))}
                                        >
                                            <option value="sale">🏠 For Sale</option>
                                            <option value="rent">🏷️ For Rent</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Status and Hot Property Row */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={formData.status}
                                            onChange={(e) => setFormData(f => ({ ...f, status: e.target.value }))}
                                        >
                                            <option value="available">✓ Available</option>
                                            <option value="engaged">🔒 Engaged</option>
                                            <option value="sold">✓ Sold</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Demand Level</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.demand}
                                            onInput={(e) => setFormData(f => ({ ...f, demand: e.target.value }))}
                                            placeholder="e.g. High / Low / Medium"
                                        />
                                    </div>
                                </div>

                                {/* Hot Property Toggle */}
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '8px 16px',
                                        background: formData.is_hot ? '#FEF3C7' : 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        border: formData.is_hot ? '2px solid #F59E0B' : '2px solid transparent'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_hot}
                                            onChange={(e) => setFormData(f => ({ ...f, is_hot: e.target.checked }))}
                                            style={{ width: '18px', height: '18px' }}
                                        />
                                        <span>🔥 Mark as Hot Property</span>
                                    </label>
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
