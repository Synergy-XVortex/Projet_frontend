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

    // Créer un stage
    createInternship(internshipData) {
        const token = localStorage.getItem('jwt_token');
        return axios.post(API_URL, internshipData, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    // Mettre à jour un stage existant (Modification totale)
    updateInternship(id, internshipData) {
        const token = localStorage.getItem('jwt_token');
        return axios.put(`${API_URL}/${id}`, internshipData, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
    
    // Récupérer le rapport et la note
    getReport(internshipId) {
        const token = localStorage.getItem('jwt_token');
        return axios.get(`${API_URL}/${internshipId}/report`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    // Uploader le PDF
    uploadReport(internshipId, file) {
        const token = localStorage.getItem('jwt_token');
        const formData = new FormData();
        formData.append('file', file); // Le nom 'file' correspond au @RequestParam du Backend
        
        return axios.post(`${API_URL}/${internshipId}/report`, formData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data' // Crucial pour l'envoi de fichiers
            }
        });
    }
}

export default new InternshipService();