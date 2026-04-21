import api from './api';

/**
 * Service handling user-related operations.
 */
class UserService {
    
    /**
     * Retrieves the list of all users (Admin only).
     * @returns {Promise} API response
     */
    async getAllUsers() {
        const response = await api.get('/users');
        return response.data;
    }

    /**
     * Activates a user account (Admin only).
     * @param {string} email - The email of the user to activate.
     * @returns {Promise} API response
     */
    async activateUser(email) {
        const response = await api.patch(`/users/${email}/activate`);
        return response.data;
    }
}

export default new UserService();