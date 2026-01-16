// API Configuration
// If using Flask to serve HTML, use relative path
const API_BASE_URL = window.location.origin + '/api';
// If using XAMPP, uncomment below:
// const API_BASE_URL = 'http://localhost:5000/api';

// API Helper Functions
const api = {
    // Generic fetch wrapper
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include',
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    auth: {
        login: (email, password) => 
            api.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            }),

        signup: (userData) => 
            api.request('/auth/signup', {
                method: 'POST',
                body: JSON.stringify(userData)
            }),

        logout: () => 
            api.request('/auth/logout', { method: 'POST' })
    },

    // User endpoints
    users: {
        getAll: () => api.request('/users'),
        
        getById: (id) => api.request(`/users/${id}`),
        
        update: (id, data) => 
            api.request(`/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            }),
        
        delete: (id) => 
            api.request(`/users/${id}`, { method: 'DELETE' }),
        
        verify: (id, qrCode) => 
            api.request(`/users/${id}/verify`, {
                method: 'POST',
                body: JSON.stringify({ qrCode })
            }),
        
        updateRole: (id, role) => 
            api.request(`/users/${id}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role })
            })
    },

    // Event endpoints
    events: {
        getAll: () => api.request('/events'),
        
        create: (eventData) => 
            api.request('/events', {
                method: 'POST',
                body: JSON.stringify(eventData)
            }),
        
        update: (id, data) => 
            api.request(`/events/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            }),
        
        delete: (id) => 
            api.request(`/events/${id}`, { method: 'DELETE' })
    },

    // Attendance endpoints
    attendance: {
        getAll: () => api.request('/attendance'),
        
        record: (eventId, studentId) => 
            api.request('/attendance', {
                method: 'POST',
                body: JSON.stringify({ eventId, studentId })
            }),
        
        delete: (id) => 
            api.request(`/attendance/${id}`, { method: 'DELETE' })
    },

    // Stats endpoints
    stats: {
        getDashboard: () => api.request('/stats/dashboard')
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE_URL, api };
}