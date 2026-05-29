import axios from 'axios';

const API_URL = 'http://localhost:8080/notifications';

class NotificationService {
    // Fetch all notifications from the backend database
    getNotifications() {
        const token = localStorage.getItem('jwt_token');
        return axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    // Toggle the read status of a specific notification by ID
    toggleRead(id) {
        const token = localStorage.getItem('jwt_token');
        return axios.patch(`${API_URL}/${id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    // Mark all notifications as read for the authenticated user
    markAllAsRead() {
        const token = localStorage.getItem('jwt_token');
        return axios.patch(`${API_URL}/read-all`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    // Delete a specific notification from the database by ID
    deleteNotification(id) {
        const token = localStorage.getItem('jwt_token');
        return axios.delete(`${API_URL}/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
}

export default new NotificationService();