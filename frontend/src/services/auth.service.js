import api from './api';

/**
 * Service handling authentication operations.
 */
class AuthService {
    
    /**
     * Authenticates a user and stores the token.
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise} API response
     */
    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        
        if (response.data && response.data.token) {
            localStorage.setItem('jwt_token', response.data.token);
        }
        
        return response.data;
    }

    /**
     * Registers a new user with extended details.
     * @param {Object} userData 
     * @returns {Promise} API response
     */
    async register(userData) {
        const response = await api.post('/auth/register', userData);
        return response.data;
    }

    /**
     * Clears local storage to log the user out.
     */
    logout() {
        localStorage.removeItem('jwt_token');
    }
}

export default new AuthService();