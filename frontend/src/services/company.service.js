import api from './api';

/**
 * Service handling company-related API calls.
 */
class CompanyService {
    /**
     * Retrieves all companies.
     * @returns {Promise} List of companies.
     */
    async getAllCompanies() {
        const response = await api.get('/companies');
        return response.data;
    }

    /**
     * Registers a new company in the system.
     * @param {Object} companyData - { siret, corporateName, address, contactEmail, contactPhone }
     * @returns {Promise} Created company.
     */
    async createCompany(companyData) {
        const response = await api.post('/companies', companyData);
        return response.data;
    }
}

export default new CompanyService();