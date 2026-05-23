import axios from 'axios';

const API_URL = 'http://localhost:8080/defenses';

const DefenseService = {
    getAllDefenses: () => {
        const token = localStorage.getItem('jwt_token');
        return axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};

export default DefenseService;