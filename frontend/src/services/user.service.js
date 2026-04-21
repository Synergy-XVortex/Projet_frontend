import api from './api';

const UserService = {
    getAllUsers: () => {
        return api.get('/users');
    },

    updateUser: (email, userData) => {
        if (!email) return Promise.reject("Missing User Email");
        return api.put(`/users/${email}`, userData);
    },

    activateUser: (email) => {
        if (!email) return Promise.reject("Missing User Email");
        // Use PATCH as defined in swagger.yaml
        return api.patch(`/users/${email}/activate`); 
    },

    toggleUserStatus: (user) => {
        if (!user || !user.email) return Promise.reject("Invalid user object");
        
        if (!user.active) {
            // Activate the user using the specific endpoint
            return UserService.activateUser(user.email);
        } else {
            // Deactivate the user by updating the whole profile
            const updatedUser = { ...user, active: false };
            return UserService.updateUser(user.email, updatedUser);
        }
    }
};

export default UserService;