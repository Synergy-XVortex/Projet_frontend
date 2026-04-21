import { useState, useEffect } from 'react';
import CompanyService from '../services/company.service';
import '../styles/layout.css';

const Companies = () => {
    const [companies, setCompanies] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        siret: '',
        corporateName: '',
        address: '',
        contactEmail: '',
        contactPhone: ''
    });

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            const data = await CompanyService.getAllCompanies();
            setCompanies(data);
        } catch (error) {
            console.error("Error loading companies", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await CompanyService.createCompany(formData);
            setShowForm(false);
            setFormData({ siret: '', corporateName: '', address: '', contactEmail: '', contactPhone: '' });
            loadCompanies();
        } catch (error) {
            alert("Error creating company. Check if SIRET already exists.");
        }
    };

    return (
        <div className="app-layout">
            <div className="page-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h1 className="page-title">Companies Directory</h1>
                        <p className="page-subtitle">Manage partner companies and their contact information.</p>
                    </div>
                    <button 
                        className="auth-button" 
                        style={{ width: 'auto', padding: '10px 20px' }}
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? 'Cancel' : '+ Add Company'}
                    </button>
                </div>

                {showForm && (
                    <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3>New Company Details</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
                            <input type="text" placeholder="SIRET (14 digits)" className="auth-input" style={{ color: '#000' }} 
                                onChange={e => setFormData({...formData, siret: e.target.value})} required />
                            <input type="text" placeholder="Corporate Name" className="auth-input" style={{ color: '#000' }}
                                onChange={e => setFormData({...formData, corporateName: e.target.value})} required />
                            <input type="email" placeholder="Contact Email" className="auth-input" style={{ color: '#000' }}
                                onChange={e => setFormData({...formData, contactEmail: e.target.value})} required />
                            <input type="text" placeholder="Phone Number" className="auth-input" style={{ color: '#000' }}
                                onChange={e => setFormData({...formData, contactPhone: e.target.value})} required />
                            <input type="text" placeholder="Full Address" className="auth-input" style={{ color: '#000', gridColumn: 'span 2' }}
                                onChange={e => setFormData({...formData, address: e.target.value})} required />
                            <button type="submit" className="auth-button" style={{ gridColumn: 'span 2' }}>Register Company</button>
                        </form>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {companies.map(company => (
                        <div key={company.siret} style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #3b82f6' }}>
                            <h3 style={{ marginBottom: '5px' }}>{company.corporateName}</h3>
                            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '15px' }}>SIRET: {company.siret}</p>
                            <p style={{ fontSize: '14px', marginBottom: '5px' }}>📍 {company.address}</p>
                            <p style={{ fontSize: '14px', marginBottom: '5px' }}>✉️ {company.contactEmail}</p>
                            <p style={{ fontSize: '14px' }}>📞 {company.contactPhone}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Companies;