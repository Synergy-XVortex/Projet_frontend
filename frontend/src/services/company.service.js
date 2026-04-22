import axios from 'axios';

const API_URL = "http://localhost:8080/companies";

const CompanyService = {
    getAllCompanies: async () => {
        const token = localStorage.getItem('jwt_token');
        return axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    countCompanies: async () => {
        const token = localStorage.getItem('jwt_token');
        const response = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.length;
    },

    updateCompany: async (siret, companyData) => {
        const token = localStorage.getItem('jwt_token');
        return axios.put(`${API_URL}/${siret}`, companyData, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    // NOUVELLE MÉTHODE : Création
    createCompany: async (companyData) => {
        const token = localStorage.getItem('jwt_token');
        return axios.post(API_URL, companyData, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};

export default CompanyService;