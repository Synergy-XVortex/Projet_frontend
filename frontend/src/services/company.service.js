import axios from 'axios';

const API_URL = "http://localhost:8080/companies";

const CompanyService = {
    getAllCompanies: async () => {
        const token = localStorage.getItem('jwt_token');
        return axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    // --- NOUVELLE MÉTHODE : Récupérer une entreprise spécifique ---
    getCompanyBySiret: async (siret) => {
        const token = localStorage.getItem('jwt_token');
        // Astuce : Le backend n'ayant pas de route GET /companies/{siret} exposée,
        // on récupère la liste et on filtre côté Frontend pour vous éviter de recompiler le Backend Java !
        const response = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const company = response.data.find(c => c.siret === siret);
        if (company) {
            return { data: company };
        } else {
            throw new Error("Company not found");
        }
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

    createCompany: async (companyData) => {
        const token = localStorage.getItem('jwt_token');
        return axios.post(API_URL, companyData, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    deleteCompany: async (siret) => {
        const token = localStorage.getItem('jwt_token');
        return axios.delete(`${API_URL}/${siret}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};

export default CompanyService;