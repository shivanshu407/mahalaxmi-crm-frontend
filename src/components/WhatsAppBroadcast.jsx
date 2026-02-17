import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../stores/store';

/**
 * WhatsApp Broadcast Component
 * Admin-only: Send bulk WhatsApp messages to clients/leads
 */
export default function WhatsAppBroadcast() {
    const {
        fetchWhatsAppRecipients, sendWhatsAppBroadcast, fetchWhatsAppCampaigns,
        whatsappRecipients, whatsappCampaigns, showToast, user
    } = useStore();

    const [tab, setTab] = useState('broadcast'); // 'broadcast' | 'history'
    const [recipientType, setRecipientType] = useState('all_clients');
    const [leadStatus, setLeadStatus] = useState('');
    const [selectedIds, setSelectedIds] = useState({ clientIds: [], leadIds: [] });
    const [campaignName, setCampaignName] = useState('test');
    const [templateParams, setTemplateParams] = useState(['', '', '']);
    const [isSending, setIsSending] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [campaignDetail, setCampaignDetail] = useState(null);

    useEffect(() => {
        fetchWhatsAppRecipients();
        fetchWhatsAppCampaigns();
    }, []);

    // Recalculate on type change
    useEffect(() => {
        if (recipientType === 'leads_by_status' && leadStatus) {
            fetchWhatsAppRecipients('leads', leadStatus);
        } else if (recipientType === 'all_clients') {
            fetchWhatsAppRecipients('clients');
        } else if (recipientType === 'all_leads') {
            fetchWhatsAppRecipients('leads');
        } else {
            fetchWhatsAppRecipients('all');
        }
    }, [recipientType, leadStatus]);

    const recipients = whatsappRecipients || { clients: [], leads: [], counts: {} };
    const counts = recipients.counts || {};

    const getSelectedCount = () => {
        if (recipientType === 'all_clients') return counts.clientsWithValidPhone || 0;
        if (recipientType === 'all_leads' || recipientType === 'leads_by_status') return counts.leadsWithValidPhone || 0;
        if (recipientType === 'custom') return selectedIds.clientIds.length + selectedIds.leadIds.length;
        return 0;
    };

    const toggleRecipient = (id, type) => {
        setSelectedIds(prev => {
            const key = type === 'client' ? 'clientIds' : 'leadIds';
            const has = prev[key].includes(id);
            return {
                ...prev,
                [key]: has ? prev[key].filter(i => i !== id) : [...prev[key], id],
            };
        });
    };

    const handleBroadcast = async () => {
        setIsSending(true);
        try {
            const data = {
                campaignName,
                templateParams: templateParams.filter(p => p.trim()),
                recipientType,
                recipientFilter: recipientType === 'leads_by_status' ? { status: leadStatus } : undefined,
                recipientIds: recipientType === 'custom' ? selectedIds : undefined,
            };
            await sendWhatsAppBroadcast(data);
            showToast(`Broadcast started to ${getSelectedCount()} recipients!`, 'success');
            setShowConfirm(false);
            setTab('history');
            fetchWhatsAppCampaigns();
        } catch (error) {
            showToast(error.message || 'Failed to send broadcast', 'error');
        }
        setIsSending(false);
    };

    const viewCampaignDetail = async (id) => {
        try {
            const { fetchWhatsAppCampaignDetail } = useStore.getState();
            const detail = await fetchWhatsAppCampaignDetail(id);
            setCampaignDetail(detail);
        } catch (error) {
            showToast('Failed to load details', 'error');
        }
    };

    const selectedCount = getSelectedCount();

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }}>💬 WhatsApp Broadcast</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>Send bulk messages to clients and leads</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '2px solid var(--border-color)', paddingBottom: 'var(--space-2)' }}>
                <button
                    className={`btn ${tab === 'broadcast' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTab('broadcast')}
                >
                    📤 New Broadcast
                </button>
                <button
                    className={`btn ${tab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setTab('history'); fetchWhatsAppCampaigns(); }}
                >
                    📊 Campaign History
                </button>
            </div>

            {tab === 'broadcast' ? renderBroadcastForm() : renderHistory()}

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>⚠️ Confirm Broadcast</h3>
                            <button className="btn-icon" onClick={() => setShowConfirm(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ padding: 'var(--space-4)' }}>
                            <div style={{
                                background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-3)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)'
                            }}>
                                <strong>⚠️ This action cannot be undone!</strong>
                                <br />This will send WhatsApp messages to <strong>{selectedCount}</strong> recipients using your AiSensy account.
                            </div>
                            <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
                                <tbody>
                                    <tr><td style={{ padding: '4px 0', color: 'var(--text-muted)' }}>Campaign</td><td style={{ fontWeight: 600 }}>{campaignName}</td></tr>
                                    <tr><td style={{ padding: '4px 0', color: 'var(--text-muted)' }}>Recipients</td><td style={{ fontWeight: 600 }}>{selectedCount}</td></tr>
                                    <tr><td style={{ padding: '4px 0', color: 'var(--text-muted)' }}>Audience</td><td style={{ fontWeight: 600 }}>{recipientType.replace(/_/g, ' ')}</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', padding: 'var(--space-4)', borderTop: '1px solid var(--border-color)' }}>
                            <button className="btn btn-secondary" onClick={() => setShowConfirm(false)} disabled={isSending}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleBroadcast} disabled={isSending}
                                style={{ background: '#25D366' }}>
                                {isSending ? '⏳ Sending...' : `✅ Send to ${selectedCount} recipients`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign Detail Modal */}
            {campaignDetail && (
                <div className="modal-overlay" onClick={() => setCampaignDetail(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>📋 Campaign Detail</h3>
                            <button className="btn-icon" onClick={() => setCampaignDetail(null)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ padding: 'var(--space-4)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                                <StatBox label="Total" value={campaignDetail.total_recipients} color="#6366f1" />
                                <StatBox label="Sent" value={campaignDetail.successful_count} color="#22c55e" />
                                <StatBox label="Failed" value={campaignDetail.failed_count} color="#ef4444" />
                            </div>

                            {campaignDetail.messages && campaignDetail.messages.length > 0 && (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="data-table" style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Phone</th>
                                                <th>Type</th>
                                                <th>Status</th>
                                                <th>Error</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {campaignDetail.messages.map(msg => (
                                                <tr key={msg.id}>
                                                    <td>{msg.recipient_name || '—'}</td>
                                                    <td>{msg.phone}</td>
                                                    <td>{msg.recipient_type}</td>
                                                    <td>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                                                            background: msg.status === 'sent' ? '#dcfce7' : msg.status === 'failed' ? '#fee2e2' : '#f3f4f6',
                                                            color: msg.status === 'sent' ? '#166534' : msg.status === 'failed' ? '#b91c1c' : '#374151'
                                                        }}>
                                                            {msg.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: '#ef4444', fontSize: '12px' }}>{msg.error_message || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // ========== Broadcast Form ==========
    function renderBroadcastForm() {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                {/* Left: Audience */}
                <div className="card" style={{ padding: 'var(--space-4)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: 'var(--space-3)' }}>👥 Step 1: Select Audience</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {[
                            { value: 'all_clients', label: '🏆 All Clients', count: counts.clientsWithValidPhone },
                            { value: 'all_leads', label: '👥 All Active Leads', count: counts.leadsWithValidPhone },
                            { value: 'leads_by_status', label: '🔍 Leads by Status' },
                            { value: 'custom', label: '✅ Custom Selection' },
                        ].map(opt => (
                            <label key={opt.value} style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                                padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
                                border: `2px solid ${recipientType === opt.value ? '#25D366' : 'var(--border-color)'}`,
                                background: recipientType === opt.value ? '#f0fdf4' : 'transparent',
                                cursor: 'pointer', transition: 'all 0.2s',
                            }}>
                                <input
                                    type="radio" name="recipientType" value={opt.value}
                                    checked={recipientType === opt.value}
                                    onChange={() => setRecipientType(opt.value)}
                                />
                                <span style={{ flex: 1 }}>{opt.label}</span>
                                {opt.count !== undefined && (
                                    <span style={{ background: '#25D366', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                                        {opt.count}
                                    </span>
                                )}
                            </label>
                        ))}
                    </div>

                    {/* Status filter for leads_by_status */}
                    {recipientType === 'leads_by_status' && (
                        <div style={{ marginTop: 'var(--space-3)' }}>
                            <label className="form-label">Filter by Status</label>
                            <select className="form-input" value={leadStatus} onChange={e => setLeadStatus(e.target.value)}>
                                <option value="">Select Status</option>
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="qualified">Qualified</option>
                            </select>
                        </div>
                    )}

                    {/* Custom selection list */}
                    {recipientType === 'custom' && (
                        <div style={{ marginTop: 'var(--space-3)', maxHeight: '300px', overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)' }}>
                            {recipients.clients.length > 0 && (
                                <>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>Clients</div>
                                    {recipients.clients.filter(c => c.validPhone).map(c => (
                                        <label key={`c-${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={selectedIds.clientIds.includes(c.id)} onChange={() => toggleRecipient(c.id, 'client')} />
                                            <span>{c.name}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: 'auto' }}>{c.phone}</span>
                                        </label>
                                    ))}
                                </>
                            )}
                            {recipients.leads.length > 0 && (
                                <>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase', marginTop: '8px' }}>Leads</div>
                                    {recipients.leads.filter(l => l.validPhone).map(l => (
                                        <label key={`l-${l.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={selectedIds.leadIds.includes(l.id)} onChange={() => toggleRecipient(l.id, 'lead')} />
                                            <span>{l.name}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: 'auto' }}>{l.phone}</span>
                                        </label>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    {/* Recipient count badge */}
                    <div style={{
                        marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: selectedCount > 0 ? '#f0fdf4' : '#fef3f2',
                        borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 600,
                        color: selectedCount > 0 ? '#166534' : '#b91c1c',
                    }}>
                        {selectedCount > 0 ? `✅ ${selectedCount} recipients with valid phone numbers` : '⚠️ No valid recipients selected'}
                    </div>
                </div>

                {/* Right: Template & Send */}
                <div className="card" style={{ padding: 'var(--space-4)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: 'var(--space-3)' }}>📝 Step 2: Configure Message</h3>

                    <div style={{ marginBottom: 'var(--space-3)' }}>
                        <label className="form-label">AiSensy Campaign Name</label>
                        <input
                            className="form-input" type="text" value={campaignName}
                            onChange={e => setCampaignName(e.target.value)}
                            placeholder="Enter your AiSensy campaign name"
                        />
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                            This must match an API campaign name (not template name) in your AiSensy dashboard
                        </p>
                    </div>

                    <div style={{ marginBottom: 'var(--space-3)' }}>
                        <label className="form-label">Template Variables (optional)</label>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px' }}>
                            If your template has placeholders like {'{{1}}'}, {'{{2}}'}, fill them here
                        </p>
                        {templateParams.map((param, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '35px' }}>{`{{${idx + 1}}}`}</span>
                                <input
                                    className="form-input" type="text" value={param}
                                    onChange={e => {
                                        const newParams = [...templateParams];
                                        newParams[idx] = e.target.value;
                                        setTemplateParams(newParams);
                                    }}
                                    placeholder={`Variable ${idx + 1}`}
                                    style={{ flex: 1 }}
                                />
                            </div>
                        ))}
                        <button className="btn btn-secondary" style={{ fontSize: '12px' }}
                            onClick={() => setTemplateParams([...templateParams, ''])}>
                            + Add Variable
                        </button>
                    </div>

                    {/* Send Button */}
                    <button
                        className="btn btn-primary"
                        style={{
                            width: '100%', padding: 'var(--space-3)', fontSize: 'var(--text-md)',
                            background: '#25D366', border: 'none', marginTop: 'var(--space-4)',
                            opacity: selectedCount === 0 || !campaignName ? 0.5 : 1,
                        }}
                        disabled={selectedCount === 0 || !campaignName || isSending}
                        onClick={() => setShowConfirm(true)}
                    >
                        💬 Send to {selectedCount} recipients
                    </button>
                </div>
            </div>
        );
    }

    // ========== Campaign History ==========
    function renderHistory() {
        const campaigns = whatsappCampaigns || [];

        return (
            <div className="card" style={{ padding: 'var(--space-4)' }}>
                {campaigns.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>📭</div>
                        <p>No campaigns sent yet. Start your first broadcast!</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Campaign</th>
                                    <th>Audience</th>
                                    <th>Total</th>
                                    <th>Sent</th>
                                    <th>Failed</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ whiteSpace: 'nowrap' }}>{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                                        <td>{c.campaign_name}</td>
                                        <td>{c.recipient_type.replace(/_/g, ' ')}</td>
                                        <td style={{ fontWeight: 600 }}>{c.total_recipients}</td>
                                        <td style={{ color: '#22c55e', fontWeight: 600 }}>{c.successful_count}</td>
                                        <td style={{ color: c.failed_count > 0 ? '#ef4444' : 'inherit', fontWeight: 600 }}>{c.failed_count}</td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                                                background: c.status === 'completed' ? '#dcfce7' : c.status === 'processing' ? '#fef3c7' : c.status === 'failed' ? '#fee2e2' : '#f3f4f6',
                                                color: c.status === 'completed' ? '#166534' : c.status === 'processing' ? '#92400e' : c.status === 'failed' ? '#b91c1c' : '#374151',
                                            }}>
                                                {c.status === 'processing' ? '⏳' : c.status === 'completed' ? '✅' : c.status === 'failed' ? '❌' : '📝'} {c.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}
                                                onClick={() => viewCampaignDetail(c.id)}>
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }
}

// Mini stat box component
function StatBox({ label, value, color }) {
    return (
        <div style={{
            background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)', textAlign: 'center',
        }}>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{label}</div>
        </div>
    );
}
