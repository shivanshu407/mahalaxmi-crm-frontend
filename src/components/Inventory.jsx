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

// Unit types for projects
const UNIT_TYPES = ['1BHK', '2BHK', '3BHK', '4BHK', 'Studio', 'Penthouse', 'Shop', 'Office', 'Plot'];

export default function Inventory() {
    const {
        inventory, fetchInventory, addInventory, updateInventory, deleteInventory,
        projects, fetchProjects, createProject, updateProject, deleteProject,
        user, isLoading, showToast
    } = useStore();

    // Tab state: 'properties' or 'projects'
    const [activeTab, setActiveTab] = useState('properties');

    // Modal states
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(null); // 'property' or 'project'
    const [editingItem, setEditingItem] = useState(null);
    const [viewItem, setViewItem] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Property form data
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

    // Project form data
    const [projectFormData, setProjectFormData] = useState({
        name: '',
        location: '',
        builder: '',
        description: '',
        unit_types: {}
    });

    const [searchTerm, setSearchTerm] = useState('');
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchInventory();
        fetchProjects();
    }, []);

    // Reset functions
    const resetPropertyForm = () => {
        setFormData({
            photo_link: '', location: '', size: '', demand: '',
            property_type: '', listing_type: 'sale', status: 'available', is_hot: false,
            price: '', other_details: ''
        });
        setEditingItem(null);
        setErrors({});
    };

    const resetProjectForm = () => {
        setProjectFormData({
            name: '', location: '', builder: '', description: '', unit_types: {}
        });
        setEditingItem(null);
        setErrors({});
    };

    // Open type selector (for adding new)
    const openAddModal = () => {
        setShowTypeSelector(true);
    };

    // Select type and open form
    const selectAddType = (type) => {
        setShowTypeSelector(false);
        setModalType(type);
        if (type === 'property') {
            resetPropertyForm();
        } else {
            resetProjectForm();
        }
        setShowModal(true);
    };

    // Edit property
    const openEditPropertyModal = (item) => {
        setEditingItem(item);
        setModalType('property');
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

    // Edit project
    const openEditProjectModal = (project) => {
        setEditingItem(project);
        setModalType('project');
        setProjectFormData({
            name: project.name,
            location: project.location || '',
            builder: project.builder || '',
            description: project.description || '',
            unit_types: project.unit_types ? (typeof project.unit_types === 'string' ? JSON.parse(project.unit_types) : project.unit_types) : {}
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setShowTypeSelector(false);
        resetPropertyForm();
        resetProjectForm();
    };

    // Property validation
    const validatePropertyForm = () => {
        const newErrors = {};
        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle property submit
    const handlePropertySubmit = async (e) => {
        e.preventDefault();
        if (!validatePropertyForm()) return;

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

    // Handle project submit
    const handleProjectSubmit = async (e) => {
        e.preventDefault();
        if (!projectFormData.name.trim()) {
            showToast('Project name is required', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const total_units = Object.values(projectFormData.unit_types).reduce((sum, count) => sum + (parseInt(count) || 0), 0);
            const data = { ...projectFormData, total_units };

            if (editingItem) {
                await updateProject(editingItem.id, data);
                showToast('Project updated', 'success');
            } else {
                await createProject(data);
                showToast('Project created', 'success');
            }
            closeModal();
        } catch (error) {
            console.error('Project save error:', error);
            showToast(error.message || 'Failed to save project', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete handlers
    const handleDeleteProperty = async (item) => {
        if (window.confirm(`Delete property at "${item.location}"?`)) {
            try {
                await deleteInventory(item.id);
                showToast('Property deleted', 'success');
            } catch (error) {
                showToast('Failed to delete property', 'error');
            }
        }
    };

    const handleDeleteProject = async (id) => {
        if (confirm('Delete this project?')) {
            try {
                await deleteProject(id);
                showToast('Project deleted', 'success');
            } catch (error) {
                showToast('Failed to delete', 'error');
            }
        }
    };

    // Update unit count for project
    const updateUnitCount = (type, value) => {
        setProjectFormData(prev => ({
            ...prev,
            unit_types: {
                ...prev.unit_types,
                [type]: Math.max(0, parseInt(value) || 0)
            }
        }));
    };

    // Filter state
    const [filters, setFilters] = useState({
        property_type: '',
        listing_type: '',
        status: ''
    });

    // Apply filters for properties
    const safeInventory = Array.isArray(inventory) ? inventory : [];
    const filteredInventory = safeInventory.filter(item => {
        const matchesSearch = !searchTerm ||
            item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.demand?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !filters.property_type || item.property_type === filters.property_type;
        const matchesListing = !filters.listing_type || item.listing_type === filters.listing_type;
        const matchesStatus = !filters.status || item.status === filters.status;
        return matchesSearch && matchesType && matchesListing && matchesStatus;
    });

    // Filter projects
    const safeProjects = Array.isArray(projects) ? projects : [];
    const filteredProjects = safeProjects.filter(p =>
        !searchTerm ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.builder?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const clearFilters = () => {
        setFilters({ property_type: '', listing_type: '', status: '' });
        setSearchTerm('');
    };

    const hasActiveFilters = filters.property_type || filters.listing_type || filters.status || searchTerm;

    // Project helpers
    const getTotalUnits = (project) => {
        const types = project.unit_types ? (typeof project.unit_types === 'string' ? JSON.parse(project.unit_types) : project.unit_types) : {};
        return Object.values(types).reduce((sum, count) => sum + (parseInt(count) || 0), 0);
    };

    const getUnitTypesDisplay = (project) => {
        const types = project.unit_types ? (typeof project.unit_types === 'string' ? JSON.parse(project.unit_types) : project.unit_types) : {};
        return Object.entries(types)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => `${type}: ${count}`)
            .join(' • ') || 'No units defined';
    };

    return (
        <div className="leads-page">
            {/* Header */}
            <div className="page-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-6)'
            }}>
                <h1 style={{ margin: 0 }}>🏠 Inventory</h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    ➕ Add New
                </button>
            </div>

            {/* Tab Selector */}
            <div style={{
                display: 'flex',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
                borderBottom: '2px solid var(--border-color)',
                paddingBottom: 'var(--space-2)'
            }}>
                <button
                    className={`btn ${activeTab === 'properties' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('properties')}
                    style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
                >
                    🏠 Properties ({filteredInventory.length})
                </button>
                <button
                    className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('projects')}
                    style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
                >
                    🏗️ Projects ({filteredProjects.length})
                </button>
            </div>

            {/* Search bar */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder={activeTab === 'properties' ? '🔍 Search by location, size, or demand...' : '🔍 Search by name, location, or builder...'}
                    value={searchTerm}
                    onInput={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: '400px', width: '100%' }}
                />
            </div>

            {/* Property filters (only show for properties tab) */}
            {activeTab === 'properties' && (
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    flexWrap: 'wrap',
                    marginBottom: 'var(--space-6)',
                    alignItems: 'center'
                }}>
                    <select
                        className="form-select"
                        value={filters.property_type}
                        onChange={(e) => setFilters(f => ({ ...f, property_type: e.target.value }))}
                        style={{ minWidth: '160px' }}
                    >
                        <option value="">All Types</option>
                        {PROPERTY_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    <select
                        className="form-select"
                        value={filters.listing_type}
                        onChange={(e) => setFilters(f => ({ ...f, listing_type: e.target.value }))}
                        style={{ minWidth: '120px' }}
                    >
                        <option value="">Sale & Rent</option>
                        <option value="sale">🏠 For Sale</option>
                        <option value="rent">🏷️ For Rent</option>
                    </select>

                    <select
                        className="form-select"
                        value={filters.status}
                        onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                        style={{ minWidth: '130px' }}
                    >
                        <option value="">All Status</option>
                        <option value="available">✓ Available</option>
                        <option value="engaged">🔒 Engaged</option>
                        <option value="sold">✓ Sold</option>
                    </select>

                    {hasActiveFilters && (
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={clearFilters}
                            style={{ marginLeft: 'auto' }}
                        >
                            ✕ Clear Filters
                        </button>
                    )}
                </div>
            )}

            {/* Properties Tab Content */}
            {activeTab === 'properties' && (
                isLoading && filteredInventory.length === 0 ? (
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
                                                        onClick={() => openEditPropertyModal(item)}
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    {isAdmin && (
                                                        <button
                                                            className="btn btn-sm"
                                                            style={{ background: '#666' }}
                                                            onClick={() => handleDeleteProperty(item)}
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
                )
            )}

            {/* Projects Tab Content */}
            {activeTab === 'projects' && (
                isLoading && filteredProjects.length === 0 ? (
                    <div className="loading" />
                ) : (
                    <div className="card full-width">
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Project Name</th>
                                        <th>Location</th>
                                        <th>Builder</th>
                                        <th>Units</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProjects.map(project => (
                                        <tr key={project.id}>
                                            <td style={{ fontWeight: '500' }}>{project.name}</td>
                                            <td>{project.location || '-'}</td>
                                            <td>{project.builder || '-'}</td>
                                            <td>
                                                <div style={{ fontWeight: '600' }}>{getTotalUnits(project)} units</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    {getUnitTypesDisplay(project)}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => openEditProjectModal(project)}
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    {isAdmin && (
                                                        <button
                                                            className="btn btn-sm"
                                                            style={{ background: '#666' }}
                                                            onClick={() => handleDeleteProject(project.id)}
                                                            title="Delete"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProjects.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-8)' }}>
                                                No projects added yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            )}

            {/* Type Selector Modal */}
            {showTypeSelector && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowTypeSelector(false); }}>
                    <div className="modal" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">What do you want to add?</h2>
                            <button className="btn-icon" onClick={() => setShowTypeSelector(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <button
                                    onClick={() => selectAddType('property')}
                                    style={{
                                        padding: 'var(--space-6)',
                                        background: 'var(--bg-tertiary)',
                                        border: '2px solid var(--border-color)',
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; }}
                                    onMouseOut={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
                                >
                                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>📍</div>
                                    <div style={{ fontWeight: '600', fontSize: '16px' }}>Single Property</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Individual flat, plot, or shop
                                    </div>
                                </button>
                                <button
                                    onClick={() => selectAddType('project')}
                                    style={{
                                        padding: 'var(--space-6)',
                                        background: 'var(--bg-tertiary)',
                                        border: '2px solid var(--border-color)',
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; }}
                                    onMouseOut={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
                                >
                                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>🏗️</div>
                                    <div style={{ fontWeight: '600', fontSize: '16px' }}>Project</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Building with multiple units
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Property Modal */}
            {showModal && modalType === 'property' && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="modal" style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingItem ? '✏️ Edit Property' : '📍 Add Property'}</h2>
                            <button className="btn-icon" onClick={closeModal}>✕</button>
                        </div>
                        <form onSubmit={handlePropertySubmit}>
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

            {/* Add/Edit Project Modal */}
            {showModal && modalType === 'project' && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="modal" style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingItem ? '✏️ Edit Project' : '🏗️ Add Project'}</h2>
                            <button className="btn-icon" onClick={closeModal}>✕</button>
                        </div>
                        <form onSubmit={handleProjectSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Project Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={projectFormData.name}
                                        onInput={(e) => setProjectFormData(f => ({ ...f, name: e.target.value }))}
                                        placeholder="e.g. Sunrise Towers"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Location</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={projectFormData.location}
                                            onInput={(e) => setProjectFormData(f => ({ ...f, location: e.target.value }))}
                                            placeholder="e.g. Andheri West"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Builder</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={projectFormData.builder}
                                            onInput={(e) => setProjectFormData(f => ({ ...f, builder: e.target.value }))}
                                            placeholder="e.g. ABC Builders"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-input"
                                        rows="2"
                                        value={projectFormData.description}
                                        onInput={(e) => setProjectFormData(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Brief description of the project..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unit Configuration</label>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: 'var(--space-2)',
                                        background: 'var(--bg-tertiary)',
                                        padding: 'var(--space-4)',
                                        borderRadius: 'var(--radius-md)'
                                    }}>
                                        {UNIT_TYPES.map(type => (
                                            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <label style={{ fontSize: '13px', minWidth: '60px' }}>{type}</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="form-input"
                                                    style={{ width: '60px', padding: '4px 8px', textAlign: 'center' }}
                                                    value={projectFormData.unit_types[type] || ''}
                                                    onInput={(e) => updateUnitCount(type, e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isSubmitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? '⏳ Saving...' : (editingItem ? '💾 Save Changes' : '➕ Add Project')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Property Details Modal */}
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
                            <button type="button" className="btn btn-primary" onClick={() => { setViewItem(null); openEditPropertyModal(viewItem); }}>✏️ Edit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
