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
        return api.patch(`/users/${email}/activate`); 
    },

    toggleUserStatus: (user) => {
        if (!user || !user.email) return Promise.reject("Invalid user object");
        if (!user.active) {
            return UserService.activateUser(user.email);
        } else {
            const updatedUser = { ...user, active: false };
            return UserService.updateUser(user.email, updatedUser);
        }
    },

    // NOUVELLE MÉTHODE : Suppression
    deleteUser: (email) => {
        return api.delete(`/users/${email}`);
    }
};

export default UserService;