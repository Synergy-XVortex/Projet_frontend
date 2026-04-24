import { useState, useEffect, useMemo, useRef } from 'react';
import InternshipService from '../services/internship.service';
import UserService from '../services/user.service';
import CompanyService from '../services/company.service';
import { jwtDecode } from 'jwt-decode';
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

    const [deletedInternship, setDeletedInternship] = useState(null);
    const deleteTimeoutRef = useRef(null);

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

    const handleDeleteClick = (internship) => {
        setInternships(prev => prev.filter(i => i.id !== internship.id));
        setDeletedInternship(internship);

        if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);

        deleteTimeoutRef.current = setTimeout(async () => {
            try {
                await InternshipService.deleteInternship(internship.id);
            } catch (err) {
                console.error(err);
                alert("Error during deletion. The internship might be linked to other data.");
                fetchInternships(); 
            }
            setDeletedInternship(null);
        }, 5000);
    };

    const handleUndoDelete = () => {
        if (deleteTimeoutRef.current) {
            clearTimeout(deleteTimeoutRef.current);
            deleteTimeoutRef.current = null;
        }
        if (deletedInternship) {
            setInternships(prev => [...prev, deletedInternship]);
            setDeletedInternship(null);
        }
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

    return (
        <div className="app-layout">
            <div className="page-container">
                <div className="page-header">
                    <div className="page-header-text">
                        <h1 className="page-title">{userRole === 'STUDENT' ? 'My Internship' : 'Internship Management'}</h1>
                        <p className="page-subtitle">{userRole === 'STUDENT' ? 'Track your internship progress.' : 'Track, monitor, and validate student internship life cycles.'}</p>
                    </div>
                </div>

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
                                        <th style={{ width: '10%', padding: '15px' }}>Status</th>
                                        <th style={{ width: '25%', padding: '15px', textAlign: 'center' }}>Actions</th>
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
                                                    <td style={{ padding: '15px', verticalAlign: 'middle' }}>
                                                        <div style={{ fontWeight: '600' }}>{internship.studentEmail || 'Pending Assignment'}</div>
                                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{internship.objective?.substring(0,40)}...</div>
                                                    </td>
                                                    <td style={{ padding: '15px', fontSize: '13px', verticalAlign: 'middle' }}><code>{internship.companySiret}</code></td>
                                                    <td style={{ padding: '15px', fontSize: '13px', verticalAlign: 'middle' }}>{new Date(internship.startDate).toLocaleDateString()}</td>
                                                    <td style={{ padding: '15px', verticalAlign: 'middle' }}>
                                                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: badge.color, background: badge.bg, fontWeight: 'bold', border: `1px solid ${badge.border}` }}>
                                                            {internship.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '15px', verticalAlign: 'middle' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                            <button onClick={() => handleDetailsClick(internship)} className="logout-button btn-action">Details</button>
                                                            
                                                            {userRole !== 'STUDENT' && (
                                                                <>
                                                                    <button onClick={() => handleUpdateClick(internship)} className="auth-button btn-action">Update</button>
                                                                    <button onClick={() => handleDeleteClick(internship)} className="logout-button btn-action" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                                                                        Delete
                                                                    </button>
                                                                </>
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

                {isDetailsModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999 }}>
                        <div className="glass-card" style={{ width: '650px', maxWidth: '95%', padding: '40px', animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                                <h2 style={{ margin: 0 }}>Internship File #{selectedInternship?.id}</h2>
                                <button onClick={() => setIsDetailsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px' }}>✖</button>
                            </div>

                            {isDetailsLoading ? <p style={{ textAlign: 'center' }}>Loading detailed data...</p> : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <h4 style={{ color: '#3b82f6', marginBottom: '12px', marginTop: 0 }}>👤 Student</h4>
                                        <p><strong>{details.student?.firstName} {details.student?.lastName}</strong></p>
                                        <p style={{ fontSize: '12px', opacity: 0.7 }}>{details.student?.email}</p>
                                        <p style={{ fontSize: '12px' }}>Major: {details.student?.major}</p>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <h4 style={{ color: '#10b981', marginBottom: '12px', marginTop: 0 }}>🏢 Company</h4>
                                        <p><strong>{details.company?.corporateName}</strong></p>
                                        <p style={{ fontSize: '11px', opacity: 0.7 }}>SIRET: {details.company?.siret}</p>
                                        <p style={{ fontSize: '12px', marginTop: '8px' }}>{details.company?.address}</p>
                                    </div>
                                    <div style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                                        <h4 style={{ color: '#f59e0b', marginBottom: '12px', marginTop: 0 }}>🎓 Supervision</h4>
                                        {details.teacher ? (
                                            <p>Assigned Tutor: <strong>{details.teacher.firstName} {details.teacher.lastName}</strong> ({details.teacher.email})</p>
                                        ) : <p style={{ opacity: 0.5, fontStyle: 'italic' }}>No teacher assigned yet.</p>}
                                    </div>
                                    <div style={{ gridColumn: 'span 2', marginTop: '15px' }}>
                                        <h4 style={{ marginBottom: '8px' }}>📝 Objective</h4>
                                        <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.8, maxHeight: '150px', overflowY: 'auto' }}>
                                            {selectedInternship?.objective}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isUpdateModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999 }}>
                        <div className="glass-card" style={{ width: '400px', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
                            <h3 style={{ marginBottom: '20px' }}>Update Status</h3>
                            <select className="auth-input" value={updatingStatus} onChange={(e) => setUpdatingStatus(e.target.value)} style={{ marginBottom: '25px', width: '100%' }}>
                                <option value="ONGOING">ONGOING</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="VALIDATED">VALIDATED</option>
                                <option value="REJECTED">REJECTED</option>
                            </select>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button onClick={handleSaveStatus} className="auth-button btn-action">Save</button>
                                <button onClick={() => setIsUpdateModalOpen(false)} className="logout-button btn-action">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {deletedInternship && (
                    <div style={{
                        position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                        background: '#1f2937', color: '#fff', padding: '12px 24px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: '20px', zIndex: 9999, border: '1px solid rgba(255,255,255,0.1)', animation: 'slideUp 0.3s ease',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }}>
                        <span>Internship #<strong>{deletedInternship.id}</strong> deleted.</span>
                        <button onClick={handleUndoDelete} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>UNDO</button>
                    </div>
                )}
                <style>{`@keyframes slideUp { from { bottom: -50px; opacity: 0; } to { bottom: 30px; opacity: 1; } }`}</style>
            </div>
        </div>
    );
};

export default Internships;