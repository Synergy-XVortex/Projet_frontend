import { useState, useEffect, useMemo } from 'react';
import CompanyService from '../services/company.service';
import '../styles/layout.css';

const Companies = () => {
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const response = await CompanyService.getAllCompanies();
            setCompanies(response.data);
        } catch (error) {
            console.error("Failed to load companies:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filtrage dynamique
    const filteredCompanies = useMemo(() => {
        if (!searchTerm) return companies;
        const lowerTerm = searchTerm.toLowerCase();
        return companies.filter(c => 
            c.name.toLowerCase().includes(lowerTerm) || 
            c.sector.toLowerCase().includes(lowerTerm) ||
            c.location.toLowerCase().includes(lowerTerm)
        );
    }, [companies, searchTerm]);

    return (
        <div className="app-layout">
            <div className="page-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: '5px' }}>Companies Directory</h1>
                        <p className="page-subtitle" style={{ margin: 0 }}>Browse partner companies and find your next internship.</p>
                    </div>

                    {/* Barre de recherche (réutilise vos classes CSS existantes) */}
                    <div className="search-container">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="Search name, sector, city..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="glass-card">
                        <p style={{ textAlign: 'center' }}>Loading companies directory...</p>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                        gap: '20px' 
                    }}>
                        {filteredCompanies.length === 0 ? (
                            <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                                <p>No companies found matching your search.</p>
                            </div>
                        ) : (
                            filteredCompanies.map(company => (
                                <div key={company.id} className="glass-card" style={{ 
                                    padding: '20px', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '15px',
                                    transition: 'transform 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ 
                                            width: '50px', height: '50px', 
                                            background: 'rgba(255,255,255,0.1)', 
                                            borderRadius: '10px',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                                            fontSize: '24px'
                                        }}>
                                            {company.logo}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{company.name}</h3>
                                            <span style={{ 
                                                fontSize: '11px', 
                                                padding: '3px 8px', 
                                                background: 'rgba(59, 130, 246, 0.2)', 
                                                color: '#93c5fd', 
                                                borderRadius: '10px',
                                                border: '1px solid rgba(59, 130, 246, 0.3)'
                                            }}>
                                                {company.sector}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                                        <span>📍</span> {company.location}
                                    </div>

                                    <button className="auth-button" style={{ marginTop: 'auto', padding: '10px' }}>
                                        View Details
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Companies;