import axios from 'axios';

const API_URL = 'http://localhost:8080/internships';

/**
 * Service to handle internship-related API calls.
 */
class InternshipService {
    // Get all internships
    getAllInternships(params) {
        const token = localStorage.getItem('jwt_token');
        return axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` },
            params: params
        });
    }

    // Update internship status
    updateStatus(id, status) {
        const token = localStorage.getItem('jwt_token');
        return axios.patch(`${API_URL}/${id}/status`, { status }, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    // À l'intérieur de la classe InternshipService :
    deleteInternship(id) {
        const token = localStorage.getItem('jwt_token');
        return axios.delete(`${API_URL}/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
}

export default new InternshipService();