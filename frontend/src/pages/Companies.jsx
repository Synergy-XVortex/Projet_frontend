import { useState, useEffect, useMemo, useRef } from 'react';
import CompanyService from '../services/company.service';
import { jwtDecode } from 'jwt-decode';
import '../styles/layout.css';

const Companies = () => {
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // États pour les modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const [editingCompany, setEditingCompany] = useState(null);
    const [formData, setFormData] = useState({
        siret: '', corporateName: '', address: '', contactEmail: '', contactPhone: ''
    });

    const [deletedCompany, setDeletedCompany] = useState(null);
    const deleteTimeoutRef = useRef(null);

    const token = localStorage.getItem('jwt_token');
    let userRole = '';
    if (token) {
        try {
            const decoded = jwtDecode(token);
            userRole = decoded.role;
        } catch (error) { console.error("Invalid token"); }
    }

    useEffect(() => { fetchCompanies(); }, []);

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const response = await CompanyService.getAllCompanies();
            setCompanies(Array.isArray(response.data) ? response.data : []);
        } catch (error) { 
            console.error("Failed to load companies:", error);
            setCompanies([]); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const filteredCompanies = useMemo(() => {
        if (!searchTerm) return companies;
        const lowerTerm = searchTerm.toLowerCase();
        return companies.filter(c => {
            const name = c.corporateName || c.corporate_name || '';
            const address = c.address || '';
            const email = c.contactEmail || c.contact_email || '';
            return name.toLowerCase().includes(lowerTerm) || 
                   address.toLowerCase().includes(lowerTerm) || 
                   email.toLowerCase().includes(lowerTerm);
        });
    }, [companies, searchTerm]);

    const handleDeleteClick = (company) => {
        setCompanies(prev => prev.filter(c => c.siret !== company.siret));
        setDeletedCompany(company);
        if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
        deleteTimeoutRef.current = setTimeout(async () => {
            try {
                await CompanyService.deleteCompany(company.siret);
            } catch (err) {
                alert("Erreur lors de la suppression de l'entreprise.");
                fetchCompanies();
            }
            setDeletedCompany(null);
        }, 5000);
    };

    const handleUndoDelete = () => {
        if (deleteTimeoutRef.current) {
            clearTimeout(deleteTimeoutRef.current);
            deleteTimeoutRef.current = null;
        }
        if (deletedCompany) {
            setCompanies(prev => [...prev, deletedCompany]);
            setDeletedCompany(null);
        }
    };

    const handleEditClick = (company) => {
        setEditingCompany(company);
        setFormData({
            siret: company.siret || '',
            corporateName: company.corporateName || company.corporate_name || '',
            address: company.address || '',
            contactEmail: company.contactEmail || company.contact_email || '',
            contactPhone: company.contactPhone || company.contact_phone || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveUpdate = async (e) => {
        e.preventDefault();
        const siretToUpdate = editingCompany.siret;
        if (!siretToUpdate) return;
        try {
            await CompanyService.updateCompany(siretToUpdate, formData);
            setEditingCompany(null);
            setIsEditModalOpen(false);
            fetchCompanies();
        } catch (err) { alert("Erreur lors de la mise à jour de l'entreprise."); }
    };

    const handleOpenCreateModal = () => {
        setFormData({ siret: '', corporateName: '', address: '', contactEmail: '', contactPhone: '' });
        setIsCreateModalOpen(true);
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        if (formData.siret.length !== 14) {
            alert("Le SIRET doit contenir exactement 14 caractères.");
            return;
        }
        try {
            await CompanyService.createCompany(formData);
            setIsCreateModalOpen(false);
            fetchCompanies();
        } catch (err) { alert("Erreur lors de la création. Le SIRET existe peut-être déjà."); }
    };

    return (
        <div className="app-layout">
            <div className="page-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: '5px' }}>Companies Directory</h1>
                        <p className="page-subtitle" style={{ margin: 0 }}>Browse partner companies and find your next internship.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div className="search-container">
                            <span className="search-icon">🔍</span>
                            <input 
                                type="text" 
                                className="search-input" 
                                placeholder="Search name, city, email..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ height: '42px', boxSizing: 'border-box' }}
                            />
                        </div>
                        
                        {userRole !== 'STUDENT' && (
                            <button 
                                onClick={handleOpenCreateModal} 
                                className="auth-button btn-action" 
                                style={{ gap: '8px' }}
                            >
                                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>+</span> Add Company
                            </button>
                        )}
                    </div>
                </div>

                {/* MODALE DE CRÉATION */}
                {isCreateModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999 }}>
                        <div className="glass-card" style={{ width: '500px', maxWidth: '90%', animation: 'fadeIn 0.3s ease' }}>
                            <h3 style={{ marginBottom: '20px', marginTop: 0 }}>Register New Company</h3>
                            <form onSubmit={handleCreateCompany} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                    <label className="auth-label">SIRET (14 digits) *</label>
                                    <input name="siret" className="auth-input" value={formData.siret} onChange={(e) => setFormData({...formData, siret: e.target.value})} required maxLength="14" minLength="14" />
                                </div>
                                <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                    <label className="auth-label">Corporate Name *</label>
                                    <input name="corporateName" className="auth-input" value={formData.corporateName} onChange={(e) => setFormData({...formData, corporateName: e.target.value})} required />
                                </div>
                                <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                    <label className="auth-label">Address</label>
                                    <input name="address" className="auth-input" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="auth-label">Contact Email</label>
                                        <input name="contactEmail" type="email" className="auth-input" value={formData.contactEmail} onChange={(e) => setFormData({...formData, contactEmail: e.target.value})} />
                                    </div>
                                    <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="auth-label">Contact Phone</label>
                                        <input name="contactPhone" className="auth-input" value={formData.contactPhone} onChange={(e) => setFormData({...formData, contactPhone: e.target.value})} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="logout-button btn-action">Cancel</button>
                                    <button type="submit" className="auth-button btn-action">Create</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODALE D'ÉDITION */}
                {isEditModalOpen && editingCompany && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999 }}>
                        <div className="glass-card" style={{ width: '500px', maxWidth: '90%', animation: 'fadeIn 0.3s ease', borderLeft: '4px solid #3b82f6' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0 }}>Edit Company</h3>
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>SIRET: {editingCompany.siret}</span>
                            </div>
                            <form onSubmit={handleSaveUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                    <label className="auth-label">Corporate Name *</label>
                                    <input name="corporateName" className="auth-input" value={formData.corporateName} onChange={(e) => setFormData({...formData, corporateName: e.target.value})} required />
                                </div>
                                <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                    <label className="auth-label">Address</label>
                                    <input name="address" className="auth-input" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="auth-label">Contact Email</label>
                                        <input name="contactEmail" type="email" className="auth-input" value={formData.contactEmail} onChange={(e) => setFormData({...formData, contactEmail: e.target.value})} />
                                    </div>
                                    <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="auth-label">Contact Phone</label>
                                        <input name="contactPhone" className="auth-input" value={formData.contactPhone} onChange={(e) => setFormData({...formData, contactPhone: e.target.value})} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                    <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingCompany(null); }} className="logout-button btn-action">Cancel</button>
                                    <button type="submit" className="auth-button btn-action">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="glass-card"><p style={{ textAlign: 'center' }}>Loading companies directory...</p></div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {filteredCompanies.length === 0 ? (
                            <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}><p>No companies found matching your search.</p></div>
                        ) : (
                            filteredCompanies.map((company) => {
                                const compName = company.corporateName || company.corporate_name || 'Unknown Company';
                                const compAddress = company.address || 'No address provided';
                                const compEmail = company.contactEmail || company.contact_email || 'No email';
                                const compPhone = company.contactPhone || company.contact_phone || 'No phone provided'; // <-- Ajout du téléphone
                                const firstLetter = compName.charAt(0).toUpperCase();

                                return (
                                    <div key={company.siret} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', transition: 'transform 0.2s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                                                {firstLetter}
                                            </div>
                                            <div style={{ overflow: 'hidden' }}>
                                                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={compName}>{compName}</h3>
                                                <span style={{ fontSize: '11px', padding: '3px 8px', background: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.2)'}}>SIRET: {company.siret}</span>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ opacity: 0.7 }}>📍</span> {compAddress}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ opacity: 0.7 }}>✉️</span> {compEmail}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ opacity: 0.7 }}>📞</span> {compPhone}</span>
                                        </div>

                                        {userRole !== 'STUDENT' && (
                                            <div className="btn-group" style={{ marginTop: 'auto', paddingTop: '15px' }}>
                                                <button onClick={() => handleEditClick(company)} className="auth-button btn-action">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDeleteClick(company)} className="logout-button btn-action" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {deletedCompany && (
                    <div style={{
                        position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                        background: '#1f2937', color: '#fff', padding: '12px 24px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: '20px', zIndex: 9999, border: '1px solid rgba(255,255,255,0.1)', animation: 'slideUp 0.3s ease',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }}>
                        <span>Company <strong>{deletedCompany.corporateName}</strong> deleted.</span>
                        <button onClick={handleUndoDelete} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>UNDO</button>
                    </div>
                )}
            </div>
            <style>{`@keyframes slideUp { from { bottom: -50px; opacity: 0; } to { bottom: 30px; opacity: 1; } }`}</style>
        </div>
    );
};

export default Companies;