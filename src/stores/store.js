/**
 * Zustand Store for CRM State Management
 * RELIABILITY: Persists to localStorage for offline-first capability
 * SPEED: In-memory state with selective persistence
 * SUSTAINABILITY: Minimal boilerplate, ~2KB library
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Remove trailing slash from API URL if present
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

console.log('API Base URL:', API_BASE_URL);

// API helper with error handling
const api = async (path, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };

    const url = `${API_BASE_URL}/api/v1${path}`;
    console.log('Fetching:', url);

    try {
        const res = await fetch(url, { ...options, headers });

        if (!res.ok) {
            const errorText = await res.text();
            let error;
            try {
                error = JSON.parse(errorText);
            } catch (e) {
                // If not JSON, use text or status
                error = { error: errorText || `Request failed (${res.status} ${res.statusText})` };
            }
            throw new Error(error.error || `Request failed (${res.status})`);
        }

        if (res.status === 204) return null;
        return res.json();
    } catch (error) {
        console.error(`API Error [${path}]:`, error);
        throw error;
    }
};

// Lead statuses for pipeline
export const LEAD_STATUSES = [
    { id: 'new', label: 'New', color: 'new' },
    { id: 'contacted', label: 'Contacted', color: 'contacted' },
    { id: 'qualified', label: 'Qualified', color: 'qualified' },
    { id: 'proposal', label: 'Proposal', color: 'proposal' },
    { id: 'negotiation', label: 'Negotiation', color: 'negotiation' },
    { id: 'won', label: 'Won', color: 'won' },
    { id: 'lost', label: 'Lost', color: 'lost' },
];

// Main store with persistence
export const useStore = create(
    persist(
        (set, get) => ({
            // Auth state
            user: null,
            isAuthenticated: false,

            // Data state
            leads: [],
            warmLeads: [],
            followUps: [],
            sources: [],
            users: [],
            dashboardStats: null,
            isLoading: false,
            error: null,
            currentView: 'dashboard',
            isModalOpen: false,

            // UI state (selectedLead is removed as per instruction's implied state)
            // selectedLead: null, // Removed

            // Actions
            setIsLoading: (isLoading) => set({ isLoading }),
            setCurrentView: (view) => set({ currentView: view }),
            openModal: () => set({ isModalOpen: true }),
            closeModal: () => set({ isModalOpen: false }),
            // setSelectedLead and clearError are removed as per instruction's implied actions

            // Auth
            login: async (email, password) => {
                try {
                    const data = await api('/auth/login', {
                        method: 'POST',
                        body: JSON.stringify({ email, password }),
                    });
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    set({ user: data.user, isAuthenticated: true, error: null }); // Re-added isAuthenticated for consistency
                    return true;
                } catch (error) {
                    set({ error: error.message });
                    return false;
                }
            },

            logout: () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                set({ user: null, isAuthenticated: false, dashboardStats: null, leads: [], followUps: [] }); // Re-added isAuthenticated for consistency
            },

            // Leads
            fetchLeads: async (filters = {}) => {
                set({ isLoading: true }); // Keep original isLoading behavior
                try {
                    const queryParams = new URLSearchParams(filters).toString();
                    const leads = await api(`/leads?${queryParams}`);
                    set({ leads, isLoading: false }); // Keep original isLoading behavior
                } catch (error) {
                    set({ error: error.message, isLoading: false }); // Keep original isLoading behavior
                }
            },

            fetchWarmLeads: async () => {
                try {
                    const leads = await api('/leads?escalated=1');
                    set({ warmLeads: leads });
                } catch (error) {
                    console.error('Failed to fetch warm leads:', error);
                }
            },

            // Clients
            clients: [],
            fetchClients: async (search = '') => {
                try {
                    const query = search ? `?search=${search}` : '';
                    const clients = await api(`/clients${query}`);
                    set({ clients });
                } catch (error) {
                    console.error('Failed to fetch clients:', error);
                }
            },

            createClient: async (data) => {
                try {
                    await api('/clients', {
                        method: 'POST',
                        body: JSON.stringify(data),
                    });
                    get().fetchClients();
                } catch (error) {
                    set({ error: error.message });
                    throw error;
                }
            },

            deleteClient: async (id) => {
                try {
                    await api(`/clients/${id}`, { method: 'DELETE' });
                    get().fetchClients();
                } catch (error) {
                    set({ error: error.message });
                }
            },

            deleteLead: async (id) => {
                try {
                    await api(`/leads/${id}`, { method: 'DELETE' });
                    get().fetchLeads();
                    get().fetchWarmLeads();
                } catch (error) {
                    set({ error: error.message });
                }
            },

            // Lead Workflows
            convertLeadToClient: async (id) => {
                try {
                    await api(`/leads/${id}/convert-client`, { method: 'PUT' });
                    // Refresh all lists
                    get().fetchLeads();
                    get().fetchWarmLeads();
                    get().fetchClients();
                } catch (error) {
                    set({ error: error.message });
                }
            },

            rejectLead: async (id) => {
                try {
                    await api(`/leads/${id}/reject`, { method: 'PATCH' });
                    // Refresh lists
                    get().fetchLeads();
                    get().fetchWarmLeads();
                } catch (error) {
                    set({ error: error.message });
                }
            },

            // Site Visits
            visits: [],
            fetchVisits: async (fromDate, toDate) => {
                try {
                    let url = '/visits';
                    const params = [];
                    if (fromDate) params.push(`from_date=${fromDate}`);
                    if (toDate) params.push(`to_date=${toDate}`);
                    if (params.length) url += '?' + params.join('&');

                    const visits = await api(url);
                    set({ visits });
                } catch (error) {
                    console.error('Failed to fetch visits:', error);
                }
            },

            scheduleVisit: async (data) => {
                try {
                    await api('/visits', {
                        method: 'POST',
                        body: JSON.stringify(data),
                    });
                    get().fetchVisits();
                    return true;
                } catch (error) {
                    set({ error: error.message });
                    throw error;
                }
            },

            createLead: async (leadData) => {
                const tempId = Date.now();
                const optimisticLead = { ...leadData, id: tempId, status: 'new', created_at: new Date().toISOString() };

                // SPEED: Optimistic update - show immediately
                set(state => ({ leads: [optimisticLead, ...state.leads], isModalOpen: false }));

                try {
                    const result = await api('/leads', {
                        method: 'POST',
                        body: JSON.stringify(leadData),
                    });
                    // Replace temp with real ID
                    set(state => ({
                        leads: state.leads.map(l => l.id === tempId ? { ...l, id: result.id } : l)
                    }));
                    return result;
                } catch (error) {
                    // Rollback on failure
                    set(state => ({
                        leads: state.leads.filter(l => l.id !== tempId),
                        error: error.message
                    }));
                    throw error;
                }
            },

            updateLead: async (id, updates) => {
                const originalLeads = get().leads;

                // SPEED: Optimistic update
                set(state => ({
                    leads: state.leads.map(l => l.id === id ? { ...l, ...updates } : l)
                }));

                try {
                    await api(`/leads/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify(updates),
                    });
                } catch (error) {
                    // Rollback on failure
                    set({ leads: originalLeads, error: error.message });
                    throw error;
                }
            },

            updateLeadStatus: async (id, status, notes = null) => {
                const originalLeads = get().leads;
                const userId = get().user?.id || 1;

                // SPEED: Optimistic update
                set(state => ({
                    leads: state.leads.map(l => l.id === id ? { ...l, status } : l)
                }));

                try {
                    await api(`/leads/${id}/status`, {
                        method: 'PATCH',
                        body: JSON.stringify({ status, notes, user_id: userId }),
                    });
                } catch (error) {
                    set({ leads: originalLeads, error: error.message });
                    throw error;
                }
            },

            deleteLead: async (id) => {
                const originalLeads = get().leads;

                set(state => ({
                    leads: state.leads.filter(l => l.id !== id)
                }));

                try {
                    await api(`/leads/${id}`, { method: 'DELETE' });
                } catch (error) {
                    set({ leads: originalLeads, error: error.message });
                    throw error;
                }
            },

            // Dashboard
            fetchDashboard: async () => {
                set({ isLoading: true });
                try {
                    const stats = await api('/dashboard');
                    set({ dashboardStats: stats, isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                }
            },

            // Sources
            fetchSources: async () => {
                try {
                    const sources = await api('/sources');
                    set({ sources });
                } catch (error) {
                    console.error('Failed to fetch sources:', error);
                }
            },

            // Follow-ups
            fetchFollowUps: async (pending = true) => {
                try {
                    const followUps = await api(`/followups?pending=${pending}`);
                    set({ followUps });
                } catch (error) {
                    set({ error: error.message });
                }
            },

            createFollowUp: async (data) => {
                try {
                    const result = await api('/followups', {
                        method: 'POST',
                        body: JSON.stringify(data),
                    });
                    get().fetchFollowUps();
                    return result;
                } catch (error) {
                    set({ error: error.message });
                    throw error;
                }
            },

            completeFollowUp: async (id, outcomeData = {}) => {
                try {
                    await api(`/followups/${id}/complete`, {
                        method: 'PATCH',
                        body: JSON.stringify(outcomeData)
                    });
                    set(state => ({
                        followUps: state.followUps.filter(f => f.id !== id)
                    }));

                    // If rescheduled, fetch follow-ups again to show the new one
                    if (outcomeData.outcome === 'try_again' || outcomeData.outcome === 'rescheduled') {
                        get().fetchFollowUps();
                    }
                    // If escalated or rejected, fetch leads to update status if on leads page
                    if (outcomeData.outcome === 'escalated' || outcomeData.outcome === 'rejected') {
                        get().fetchLeads();
                    }
                } catch (error) {
                    set({ error: error.message });
                }
            },

            // Users for assignment
            fetchUsers: async () => {
                try {
                    const users = await api('/users');
                    set({ users });
                } catch (error) {
                    console.error('Failed to fetch users:', error);
                }
            },

            deleteUser: async (id) => {
                try {
                    await api(`/users/${id}`, { method: 'DELETE' });
                    // Optimistic update
                    set(state => ({
                        users: state.users.filter(u => u.id !== id)
                    }));
                } catch (error) {
                    set({ error: error.message });
                    throw error;
                }
            },

            registerUser: async (userData) => {
                try {
                    await api('/auth/register', {
                        method: 'POST',
                        body: JSON.stringify(userData)
                    });
                    // Refresh users list
                    get().fetchUsers();
                } catch (error) {
                    set({ error: error.message });
                    throw error;
                }
            },

            // UI actions
            setCurrentView: (view) => set({ currentView: view }),
            setSelectedLead: (lead) => set({ selectedLead: lead }),
            openModal: () => set({ isModalOpen: true }),
            closeModal: () => set({ isModalOpen: false, selectedLead: null }),
            clearError: () => set({ error: null }),
        }),
        {
            name: 'crm-mahalaxmi-storage',
            // RELIABILITY: Only persist essential data
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                currentView: state.currentView,
            }),
        }
    )
);
