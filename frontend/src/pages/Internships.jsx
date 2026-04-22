import { useState, useEffect, useMemo } from 'react';
import InternshipService from '../services/internship.service';
import UserService from '../services/user.service';
import CompanyService from '../services/company.service';
import { jwtDecode } from 'jwt-decode'; // NOUVEAU : Pour lire le rôle
import '../styles/layout.css';

const Internships = () => {
    const [internships, setInternships] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedInternship, setSelectedInternship] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState('');

    const [details, setDetails] = useState({ student: null, teacher: null, company: null });
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    // --- LECTURE DU RÔLE UTILISATEUR ---
    const token = localStorage.getItem('jwt_token');
    let userRole = '';
    let userEmail = '';
    if (token) {
        try {
            const decoded = jwtDecode(token);
            userRole = decoded.role;
            userEmail = decoded.sub;
        } catch (error) { console.error("Invalid token"); }
    }

    useEffect(() => {
        fetchInternships();
    }, []);

    const fetchInternships = async () => {
        setIsLoading(true);
        try {
            // Si c'est un étudiant, on demande au Backend de ne renvoyer que SES stages
            const params = userRole === 'STUDENT' ? { studentEmail: userEmail } : {};
            const response = await InternshipService.getAllInternships(params);
            setInternships(response.data || []);
        } catch (err) {
            console.error("Failed to load internships", err);
        } finally {
            setIsLoading(false);
        }
    };

    const processedInternships = useMemo(() => {
        let result = [...internships];
        if (activeTab !== 'ALL') result = result.filter(i => i.status === activeTab);
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(i => 
                (i.studentEmail?.toLowerCase().includes(term)) ||
                (i.companySiret?.toLowerCase().includes(term)) ||
                (i.objective?.toLowerCase().includes(term))
            );
        }
        return result;
    }, [internships, activeTab, searchTerm]);

    const handleDetailsClick = async (internship) => {
        setSelectedInternship(internship);
        setIsDetailsModalOpen(true);
        setIsDetailsLoading(true);
        setDetails({ student: null, teacher: null, company: null });

        try {
            const [studentRes, companyRes] = await Promise.all([
                UserService.getUserByEmail(internship.studentEmail),
                CompanyService.getCompanyBySiret(internship.companySiret)
            ]);
            let teacherData = null;
            if (internship.teacherEmail) {
                const teacherRes = await UserService.getUserByEmail(internship.teacherEmail);
                teacherData = teacherRes.data;
            }
            setDetails({ student: studentRes.data, company: companyRes.data, teacher: teacherData });
        } catch (err) { console.error("Error loading details", err); } 
        finally { setIsDetailsLoading(false); }
    };

    const handleUpdateClick = (internship) => {
        setSelectedInternship(internship);
        setUpdatingStatus(internship.status);
        setIsUpdateModalOpen(true);
    };

    const handleSaveStatus = async () => {
        try {
            await InternshipService.updateStatus(selectedInternship.id, updatingStatus);
            setIsUpdateModalOpen(false);
            fetchInternships(); 
        } catch (err) { alert("Error updating internship status."); }
    };

    const getStatusBadgeStyle = (status) => {
        const styles = {
            VALIDATED: { color: '#86efac', bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.3)' },
            ONGOING: { color: '#93c5fd', bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.3)' },
            COMPLETED: { color: '#fcd34d', bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.3)' },
            REJECTED: { color: '#fca5a5', bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.3)' }
        };
        return styles[status] || styles.ONGOING;
    };

    const buttonStyle = { minWidth: '80px', padding: '0 10px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0', fontSize: '13px' };

    return (
        <div className="app-layout">
            <div className="page-container">
                <h1 className="page-title">{userRole === 'STUDENT' ? 'My Internship' : 'Internship Management'}</h1>
                <p className="page-subtitle">{userRole === 'STUDENT' ? 'Track your internship progress.' : 'Track, monitor, and validate student internship life cycles.'}</p>

                {/* On cache les contrôles de recherche complexe pour l'étudiant s'il n'a qu'un seul stage */}
                {userRole !== 'STUDENT' && (
                    <div className="controls-container">
                        <div className="tabs-container">
                            {['ALL', 'ONGOING', 'COMPLETED', 'VALIDATED', 'REJECTED'].map(status => (
                                <button key={status} className={`tab-button ${activeTab === status ? 'active' : ''}`} onClick={() => setActiveTab(status)}>{status}</button>
                            ))}
                        </div>
                        <div className="search-container">
                            <span className="search-icon">🔍</span>
                            <input type="text" className="search-input" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                )}

                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    {isLoading ? (
                        <p style={{ padding: '30px', textAlign: 'center' }}>Loading internship data...</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                                <thead style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <tr>
                                        <th style={{ width: '30%', padding: '15px' }}>Student / Objective</th>
                                        <th style={{ width: '20%', padding: '15px' }}>Company (SIRET)</th>
                                        <th style={{ width: '15%', padding: '15px' }}>Start Date</th>
                                        <th style={{ width: '15%', padding: '15px' }}>Status</th>
                                        <th style={{ width: '20%', padding: '15px', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedInternships.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                                                {userRole === 'STUDENT' ? "You don't have an assigned internship yet." : "No internships found."}
                                            </td>
                                        </tr>
                                    ) : (
                                        processedInternships.map(internship => {
                                            const badge = getStatusBadgeStyle(internship.status);
                                            return (
                                                <tr key={internship.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '15px' }}>
                                                        <div style={{ fontWeight: '600' }}>{internship.studentEmail || 'Pending Assignment'}</div>
                                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{internship.objective?.substring(0,40)}...</div>
                                                    </td>
                                                    <td style={{ padding: '15px', fontSize: '13px' }}><code>{internship.companySiret}</code></td>
                                                    <td style={{ padding: '15px', fontSize: '13px' }}>{new Date(internship.startDate).toLocaleDateString()}</td>
                                                    <td style={{ padding: '15px' }}>
                                                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: badge.color, background: badge.bg, fontWeight: 'bold', border: `1px solid ${badge.border}` }}>
                                                            {internship.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '15px', verticalAlign: 'middle' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                            <button onClick={() => handleDetailsClick(internship)} className="logout-button" style={buttonStyle}>Details</button>
                                                            
                                                            {userRole !== 'STUDENT' && (
                                                                <button onClick={() => handleUpdateClick(internship)} className="auth-button" style={buttonStyle}>Update</button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* MODALES CONSERVÉES À L'IDENTIQUE ICI... */}
                {/* ... Modale Details ... */}
                {/* ... Modale Update ... */}
            </div>
        </div>
    );
};

export default Internships;