import axios from 'axios';

const API_URL = 'http://localhost:8080/internships';
const BASE_URL = 'http://localhost:8080';

class InternshipService {
    // --- GESTION DES STAGES ---
    getAllInternships(params) {
        const token = localStorage.getItem('jwt_token');
        return axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` },
            params: params
        });
    }

    updateStatus(id, status) {
        const token = localStorage.getItem('jwt_token');
        return axios.patch(`${API_URL}/${id}/status`, { status }, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    deleteInternship(id) {
        const token = localStorage.getItem('jwt_token');
        return axios.delete(`${API_URL}/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    createInternship(internshipData) {
        const token = localStorage.getItem('jwt_token');
        return axios.post(API_URL, internshipData, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    updateInternship(id, internshipData) {
        const token = localStorage.getItem('jwt_token');
        return axios.put(`${API_URL}/${id}`, internshipData, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    // --- GESTION DES RAPPORTS ET NOTES ---
    getReport(internshipId) {
        const token = localStorage.getItem('jwt_token');
        return axios.get(`${API_URL}/${internshipId}/report`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    uploadReport(internshipId, file) {
        const token = localStorage.getItem('jwt_token');
        const formData = new FormData();
        formData.append('file', file); 
        
        return axios.post(`${API_URL}/${internshipId}/report`, formData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data' 
            }
        });
    }

    downloadReport(fileName) {
        const token = localStorage.getItem('jwt_token');
        return axios.get(`${BASE_URL}/reports/${encodeURIComponent(fileName)}/download`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob' 
        });
    }

    deleteReport(internshipId) {
        const token = localStorage.getItem('jwt_token');
        return axios.delete(`${API_URL}/${internshipId}/report`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    evaluateReport(reportFileName, evaluationData) {
        const token = localStorage.getItem('jwt_token');
        return axios.post(`${BASE_URL}/reports/${encodeURIComponent(reportFileName)}/evaluation`, evaluationData, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
}

export default new InternshipService();