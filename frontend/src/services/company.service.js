import axios from 'axios';

// Utilisation de l'instance axios avec le token si nécessaire
const API_URL = "http://localhost:8080/api/companies";

const CompanyService = {
    // Récupère les vraies entreprises depuis le Backend
    getAllCompanies: async () => {
        const token = localStorage.getItem('jwt_token');
        return axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    // Compte dynamiquement pour le Dashboard
    countCompanies: async () => {
        const token = localStorage.getItem('jwt_token');
        const response = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // On compte les entreprises retournées par la DB
        return response.data.length;
    }
};

export default CompanyService;