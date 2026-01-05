import { useState, useEffect } from 'preact/hooks';
import { useStore, LEAD_STATUSES } from '../stores/store';

/**
 * Lead Form Modal
 * RELIABILITY: Form validation before submit
 * SPEED: Optimistic updates close modal immediately
 */
export default function LeadForm() {
    const {
        selectedLead, closeModal, createLead, updateLead, deleteLead,
        sources, users
    } = useStore();

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
        status: 'new',
        assigned_to: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Populate form when editing
    useEffect(() => {
        if (selectedLead) {
            setFormData({
                name: selectedLead.name || '',
                phone: selectedLead.phone || '',
                email: selectedLead.email || '',
                budget_min: selectedLead.budget_min ? String(selectedLead.budget_min / 100000) : '',
                budget_max: selectedLead.budget_max ? String(selectedLead.budget_max / 100000) : '',
                location: selectedLead.location || '',
                interest: selectedLead.interest || '',
                motive_to_buy: selectedLead.motive_to_buy || '',
                contact_person: selectedLead.contact_person || '',
                source: selectedLead.source_name || selectedLead.source || '',
                status: selectedLead.status || 'new',
                assigned_to: selectedLead.assigned_to || '',
            });
        }
    }, [selectedLead]);

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
                assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
            };

            if (selectedLead) {
                await updateLead(selectedLead.id, data);
            } else {
                await createLead(data);
            }
            closeModal();
        } catch (error) {
            console.error('Failed to save lead:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this lead?')) {
            await deleteLead(selectedLead.id);
            closeModal();
        }
    };

    // Delhi NCR locations for quick selection
    const locations = [
        'Gurugram', 'Noida', 'Delhi', 'Faridabad', 'Ghaziabad',
        'Greater Noida', 'Dwarka', 'South Delhi', 'North Delhi'
    ];

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <div className="modal" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">{selectedLead ? 'Edit Lead' : 'Add New Lead'}</h2>
                    <button className="btn-icon" onClick={closeModal}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Basic Info */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    value={formData.name}
                                    onInput={handleChange}
                                    placeholder="Full name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-input"
                                    value={formData.phone}
                                    onInput={handleChange}
                                    placeholder="+91 9876543210"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onInput={handleChange}
                                placeholder="email@example.com"
                            />
                        </div>

                        {/* Budget - in Lakhs (Indian notation) */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Budget Min (Lakhs)</label>
                                <input
                                    type="number"
                                    name="budget_min"
                                    className="form-input"
                                    value={formData.budget_min}
                                    onInput={handleChange}
                                    placeholder="e.g., 50"
                                    min="0"
                                    step="5"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Budget Max (Lakhs)</label>
                                <input
                                    type="number"
                                    name="budget_max"
                                    className="form-input"
                                    value={formData.budget_max}
                                    onInput={handleChange}
                                    placeholder="e.g., 100"
                                    min="0"
                                    step="5"
                                />
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
                                    list="location-options"
                                />
                                <datalist id="location-options">
                                    {locations.map(loc => (
                                        <option key={loc} value={loc} />
                                    ))}
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
                                    list="interest-options"
                                />
                                <datalist id="interest-options">
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
                                list="motive-options"
                            />
                            <datalist id="motive-options">
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
                                <input
                                    type="text"
                                    name="contact_person"
                                    className="form-input"
                                    value={formData.contact_person}
                                    onInput={handleChange}
                                    placeholder="Reference/Contact"
                                />
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

                        {/* Status and Assignment */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    name="status"
                                    className="form-select"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    {LEAD_STATUSES.map(s => (
                                        <option key={s.id} value={s.id}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Assign To</label>
                                <select
                                    name="assigned_to"
                                    className="form-select"
                                    value={formData.assigned_to}
                                    onChange={handleChange}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        {selectedLead && (
                            <button type="button" className="btn btn-danger" onClick={handleDelete}>
                                Delete
                            </button>
                        )}
                        <div style={{ flex: 1 }} />
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : selectedLead ? 'Update Lead' : 'Create Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
