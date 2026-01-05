/**
 * Zustand Store for CRM State Management
 * RELIABILITY: Persists to localStorage for offline-first capability
 * SPEED: In-memory state with selective persistence
 * SUSTAINABILITY: Minimal boilerplate, ~2KB library
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// API helper with error handling
const api = async (path, options = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
        const res = await fetch(`${API_BASE_URL}/api/v1${path}`, { ...options, headers });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
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
            sources: [],
            users: [],
            followUps: [],
            dashboardStats: null,

            // UI state
            isLoading: false,
            error: null,
            currentView: 'dashboard',
            selectedLead: null,
            isModalOpen: false,

            // Auth actions
            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const data = await api('/auth/login', {
                        method: 'POST',
                        body: JSON.stringify({ email, password }),
                    });
                    localStorage.setItem('auth_token', data.token);
                    set({ user: data.user, isAuthenticated: true, isLoading: false });
                    return true;
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            logout: () => {
                localStorage.removeItem('auth_token');
                set({ user: null, isAuthenticated: false, leads: [], dashboardStats: null });
            },

            // Lead actions - OPTIMISTIC UI for speed
            fetchLeads: async (filters = {}) => {
                set({ isLoading: true });
                try {
                    const params = new URLSearchParams(filters).toString();
                    const leads = await api(`/leads${params ? `?${params}` : ''}`);
                    set({ leads, isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
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

            completeFollowUp: async (id) => {
                try {
                    await api(`/followups/${id}/complete`, { method: 'PATCH' });
                    set(state => ({
                        followUps: state.followUps.filter(f => f.id !== id)
                    }));
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
