import { useState, useEffect, useMemo, useRef } from 'react';
import InternshipService from '../services/internship.service';
import UserService from '../services/user.service';
import CompanyService from '../services/company.service';
import DefenseService from '../services/defense.service'; // <-- NOUVEL IMPORT
import { jwtDecode } from 'jwt-decode';
import '../styles/layout.css';

const Internships = () => {
    const [internships, setInternships] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    const [selectedInternship, setSelectedInternship] = useState(null);
    const [formData, setFormData] = useState({
        id: null, objective: '', startDate: '', durationWeeks: 12, 
        companySiret: '', studentEmail: '', teacherEmail: ''
    });

    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [companies, setCompanies] = useState([]);

    const [isAddingNewCompany, setIsAddingNewCompany] = useState(false);
    const [newCompanyData, setNewCompanyData] = useState({ 
        siret: '', corporateName: '', address: '', contactEmail: '', contactPhone: '' 
    });

    // Détails de la modale
    const [details, setDetails] = useState({ student: null, teacher: null, company: null, report: null, defense: null });
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Formulaires
    const [evaluationForm, setEvaluationForm] = useState({ grade: '', comment: '' });
    const [defenseForm, setDefenseForm] = useState({ date: '', time: '', room: '' }); // <-- NOUVEAU

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
        if (userRole !== 'STUDENT') fetchDropdownData();
    }, []);

    const fetchInternships = async () => {
        setIsLoading(true);
        try {
            const params = userRole === 'STUDENT' ? { studentEmail: userEmail } : {};
            const response = await InternshipService.getAllInternships(params);
            setInternships(response.data || []);
        } catch (err) { console.error("Failed to load internships", err); } 
        finally { setIsLoading(false); }
    };

    const fetchDropdownData = async () => {
        try {
            const [usersRes, compRes] = await Promise.all([
                UserService.getAllUsers(), CompanyService.getAllCompanies()
            ]);
            const allUsers = usersRes.data || [];
            setStudents(allUsers.filter(u => u.role === 'STUDENT'));
            setTeachers(allUsers.filter(u => u.role === 'TEACHER' || u.role === 'ADMINISTRATOR'));
            setCompanies(compRes.data || []);
        } catch (error) { console.error("Error loading reference data", error); }
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const processedInternships = useMemo(() => {
        let result = [...internships];
        if (userRole === 'TEACHER') result = result.filter(i => i.teacherEmail === userEmail);
        if (activeTab !== 'ALL') result = result.filter(i => i.status === activeTab);
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(i => 
                (i.studentEmail?.toLowerCase().includes(term)) ||
                (i.teacherEmail?.toLowerCase().includes(term)) ||
                (i.companySiret?.toLowerCase().includes(term)) ||
                (i.objective?.toLowerCase().includes(term))
            );
        }
        
        if (sortConfig.key !== null) {
            result.sort((a, b) => {
                let aValue = String(a[sortConfig.key] || '').toLowerCase();
                let bValue = String(b[sortConfig.key] || '').toLowerCase();
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [internships, activeTab, searchTerm, sortConfig, userRole, userEmail]);

    const handleDetailsClick = async (internship) => {
        setSelectedInternship(internship);
        setUploadFile(null);
        setEvaluationForm({ grade: '', comment: '' }); 
        setDefenseForm({ date: '', time: '', room: '' }); // Reset defense form
        setIsDetailsModalOpen(true);
        setIsDetailsLoading(true);
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
            
            let reportData = null;
            try {
                const reportRes = await InternshipService.getReport(internship.id);
                reportData = reportRes.data;
            } catch(e) {}

            // --- FETCH DEFENSE ---
            let defenseData = null;
            try {
                const defRes = await DefenseService.getAllDefenses();
                defenseData = defRes.data.find(d => d.studentEmail === internship.studentEmail);
            } catch(e) {}

            setDetails({ student: studentRes.data, company: companyRes.data, teacher: teacherData, report: reportData, defense: defenseData });
        } catch (err) { console.error("Error loading details", err); } 
        finally { setIsDetailsLoading(false); }
    };

    const handleUploadReport = async () => {
        if (!uploadFile) return;
        setIsUploading(true);
        try {
            await InternshipService.uploadReport(selectedInternship.id, uploadFile);
            const reportRes = await InternshipService.getReport(selectedInternship.id);
            setDetails(prev => ({ ...prev, report: reportRes.data }));
            setUploadFile(null);
        } catch (err) { alert("Error uploading report. Please try again."); } 
        finally { setIsUploading(false); }
    };

    const handleViewReport = async (fileName) => {
        try {
            const response = await InternshipService.downloadReport(fileName);
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (error) { alert("Error downloading the report. The file may have been moved."); }
    };

    const handleDeleteReport = async () => {
        if (window.confirm("Are you sure you want to delete this report?")) {
            try {
                await InternshipService.deleteReport(selectedInternship.id);
                setDetails(prev => ({ ...prev, report: null }));
            } catch (e) { alert("Cannot delete the report. It may have just been graded by the teacher."); }
        }
    };

    const handleEvaluateReport = async () => {
        if (!evaluationForm.grade || evaluationForm.grade < 0 || evaluationForm.grade > 20) {
            return alert("Please enter a valid grade between 0 and 20.");
        }
        setIsUploading(true);
        try {
            const payload = { grade: parseFloat(evaluationForm.grade), comment: evaluationForm.comment || "" };
            await InternshipService.evaluateReport(details.report.fileName, payload);
            const reportRes = await InternshipService.getReport(selectedInternship.id);
            setDetails(prev => ({ ...prev, report: reportRes.data }));
            await handleStatusDropdownChange(selectedInternship.id, 'VALIDATED');
        } catch (err) { alert("Error submitting evaluation."); } 
        finally { setIsUploading(false); }
    };

    // --- NOUVEAU HANDLER : Programmer la soutenance ---
    const handleScheduleDefense = async () => {
        if (!defenseForm.date || !defenseForm.time || !defenseForm.room) return;
        setIsUploading(true);
        try {
            // Combinaison de la date et de l'heure au format ISO pour le Backend
            const isoDate = new Date(`${defenseForm.date}T${defenseForm.time}`).toISOString();
            const payload = {
                studentEmail: selectedInternship.studentEmail,
                date: isoDate,
                room: defenseForm.room
            };
            await DefenseService.scheduleDefense(payload);
            
            const defRes = await DefenseService.getAllDefenses();
            const updatedDefense = defRes.data.find(d => d.studentEmail === selectedInternship.studentEmail);
            setDetails(prev => ({ ...prev, defense: updatedDefense }));
            
            alert("Defense successfully scheduled!");
        } catch (err) {
            alert("Error scheduling defense.");
        } finally {
            setIsUploading(false);
        }
    };

    const openCreateModal = () => {
        setFormData({ id: null, objective: '', startDate: '', durationWeeks: 12, companySiret: '', studentEmail: '', teacherEmail: '' });
        setIsAddingNewCompany(false);
        setIsFormModalOpen(true);
    };

    const openEditModal = (internship) => {
        setFormData({
            id: internship.id, objective: internship.objective || '', startDate: internship.startDate || '',
            durationWeeks: internship.durationWeeks || 12, companySiret: internship.companySiret || '',
            studentEmail: internship.studentEmail || '', teacherEmail: internship.teacherEmail || ''
        });
        setIsAddingNewCompany(false);
        setIsFormModalOpen(true);
    };

    const handleSaveInternship = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) { await InternshipService.updateInternship(formData.id, formData); } 
            else { await InternshipService.createInternship(formData); }
            setIsFormModalOpen(false);
            fetchInternships();
        } catch (err) { alert("Error saving the internship. Check your data."); }
    };

    const handleQuickAddCompany = async () => {
        if (!newCompanyData.siret || !newCompanyData.corporateName) return alert("SIRET and Name required.");
        try {
            await CompanyService.createCompany(newCompanyData);
            setCompanies([...companies, newCompanyData]);
            setFormData({ ...formData, companySiret: newCompanyData.siret });
            setIsAddingNewCompany(false);
            setNewCompanyData({ siret: '', corporateName: '', address: '', contactEmail: '', contactPhone: '' });
        } catch (e) { alert("Failed to add company. SIRET may already exist."); }
    };

    const handleStatusDropdownChange = async (internshipId, newStatus) => {
        const previousInternships = [...internships];
        setInternships(internships.map(i => i.id === internshipId ? { ...i, status: newStatus } : i));
        try { await InternshipService.updateStatus(internshipId, newStatus); } 
        catch (err) { alert("Error updating status."); setInternships(previousInternships); }
    };

    const handleDeleteClick = (internship) => {
        setInternships(prev => prev.filter(i => i.id !== internship.id));
        setDeletedInternship(internship);
        if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
        deleteTimeoutRef.current = setTimeout(async () => {
            try { await InternshipService.deleteInternship(internship.id); } 
            catch (err) { alert("Error during deletion."); fetchInternships(); }
            setDeletedInternship(null);
        }, 5000);
    };

    const handleUndoDelete = () => {
        if (deleteTimeoutRef.current) { clearTimeout(deleteTimeoutRef.current); deleteTimeoutRef.current = null; }
        if (deletedInternship) { setInternships(prev => [...prev, deletedInternship]); setDeletedInternship(null); }
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
                        <p className="page-subtitle">
                            {userRole === 'STUDENT' ? 'Track your internship progress.' : 'Track, monitor, and validate student internship life cycles.'}
                        </p>
                    </div>
                    {userRole === 'ADMINISTRATOR' && (
                        <div className="page-header-actions">
                            <button onClick={openCreateModal} className="auth-button btn-action" style={{ gap: '8px' }}>
                                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>+</span> Add Internship
                            </button>
                        </div>
                    )}
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
                            <table style={{ width: '100%', minWidth: '768px', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                                <thead style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <tr>
                                        <th style={{ width: '25%', padding: '15px' }} className="sortable-header" onClick={() => requestSort('studentEmail')}>Student {sortConfig.key === 'studentEmail' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : '↕'}</th>
                                        <th style={{ width: '20%', padding: '15px' }} className="sortable-header" onClick={() => requestSort('teacherEmail')}>Teacher {sortConfig.key === 'teacherEmail' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : '↕'}</th>
                                        <th style={{ width: '20%', padding: '15px' }} className="sortable-header" onClick={() => requestSort('companySiret')}>Company {sortConfig.key === 'companySiret' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : '↕'}</th>
                                        <th style={{ width: '10%', padding: '15px' }} className="sortable-header" onClick={() => requestSort('status')}>Status {sortConfig.key === 'status' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : '↕'}</th>
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
                                                        <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{internship.studentEmail || 'Not Assigned'}</div>
                                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{internship.objective?.substring(0,30)}...</div>
                                                    </td>
                                                    <td style={{ padding: '15px', fontSize: '13px', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{internship.teacherEmail || 'Not Assigned'}</td>
                                                    <td style={{ padding: '15px', fontSize: '13px', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={internship.companySiret}>
                                                        {companies.find(c => c.siret === internship.companySiret)?.corporateName || internship.companySiret}
                                                    </td>
                                                    <td style={{ padding: '15px', verticalAlign: 'middle' }}>
                                                        {userRole === 'STUDENT' ? (
                                                            <span style={{ 
                                                                padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: badge.color, 
                                                                background: badge.bg, fontWeight: 'bold', border: `1px solid ${badge.border}`
                                                            }}>
                                                                {internship.status}
                                                            </span>
                                                        ) : (
                                                            <select
                                                                value={internship.status}
                                                                onChange={(e) => handleStatusDropdownChange(internship.id, e.target.value)}
                                                                style={{ 
                                                                    padding: '4px 8px', borderRadius: '20px', fontSize: '11px', color: badge.color, 
                                                                    background: badge.bg, fontWeight: 'bold', border: `1px solid ${badge.border}`,
                                                                    cursor: 'pointer', outline: 'none', appearance: 'auto', maxWidth: '100%'
                                                                }}
                                                            >
                                                                <option value="ONGOING" style={{color: '#fff', background: '#1f2937'}}>ONGOING</option>
                                                                <option value="COMPLETED" style={{color: '#fff', background: '#1f2937'}}>COMPLETED</option>
                                                                <option value="VALIDATED" style={{color: '#fff', background: '#1f2937'}}>VALIDATED</option>
                                                                <option value="REJECTED" style={{color: '#fff', background: '#1f2937'}}>REJECTED</option>
                                                            </select>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '15px', verticalAlign: 'middle' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                                                            <button onClick={() => handleDetailsClick(internship)} className="logout-button btn-action">Details</button>
                                                            {userRole === 'ADMINISTRATOR' && (
                                                                <>
                                                                    <button onClick={() => openEditModal(internship)} className="auth-button btn-action">Edit</button>
                                                                    <button onClick={() => handleDeleteClick(internship)} className="logout-button btn-action" style={{ borderColor: '#ef4444', color: '#ef4444' }}>Delete</button>
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

                {isFormModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999 }}>
                        <div className="glass-card" style={{ width: '600px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', animation: 'fadeIn 0.3s ease' }}>
                            <h3 style={{ marginBottom: '20px', marginTop: 0 }}>{formData.id ? 'Edit Internship' : 'Register New Internship'}</h3>
                            
                            <form onSubmit={handleSaveInternship} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                    <div className="auth-input-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                                        <label className="auth-label">Student</label>
                                        <select className="auth-input" value={formData.studentEmail} onChange={e => setFormData({...formData, studentEmail: e.target.value})}>
                                            <option value="">-- Select Student --</option>
                                            {students.map(s => <option key={s.email} value={s.email}>{s.firstName} {s.lastName}</option>)}
                                        </select>
                                    </div>
                                    <div className="auth-input-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                                        <label className="auth-label">Supervising Teacher</label>
                                        <select className="auth-input" value={formData.teacherEmail} onChange={e => setFormData({...formData, teacherEmail: e.target.value})}>
                                            <option value="">-- Select Teacher --</option>
                                            {teachers.map(t => <option key={t.email} value={t.email}>{t.firstName} {t.lastName}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <label className="auth-label">Company</label>
                                        {!isAddingNewCompany && <button type="button" onClick={() => setIsAddingNewCompany(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', cursor: 'pointer' }}>+ Add New Company</button>}
                                    </div>
                                    
                                    {!isAddingNewCompany ? (
                                        <select className="auth-input" value={formData.companySiret} onChange={e => setFormData({...formData, companySiret: e.target.value})} required>
                                            <option value="">-- Select Company --</option>
                                            {companies.map(c => <option key={c.siret} value={c.siret}>{c.corporateName} ({c.siret})</option>)}
                                        </select>
                                    ) : (
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '5px' }}>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                <input className="auth-input" placeholder="SIRET (14 digits)" value={newCompanyData.siret} onChange={e => setNewCompanyData({...newCompanyData, siret: e.target.value})} style={{ marginBottom: '10px', flex: 1, minWidth: '150px' }} maxLength={14}/>
                                                <input className="auth-input" placeholder="Corporate Name" value={newCompanyData.corporateName} onChange={e => setNewCompanyData({...newCompanyData, corporateName: e.target.value})} style={{ marginBottom: '10px', flex: 1, minWidth: '150px' }} />
                                            </div>
                                            <input className="auth-input" placeholder="Address" value={newCompanyData.address} onChange={e => setNewCompanyData({...newCompanyData, address: e.target.value})} style={{ marginBottom: '10px' }} />
                                            
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                <input className="auth-input" type="email" placeholder="Contact Email" value={newCompanyData.contactEmail} onChange={e => setNewCompanyData({...newCompanyData, contactEmail: e.target.value})} style={{ marginBottom: '10px', flex: 1, minWidth: '150px' }} />
                                                <input className="auth-input" placeholder="Contact Phone" value={newCompanyData.contactPhone} onChange={e => setNewCompanyData({...newCompanyData, contactPhone: e.target.value})} style={{ marginBottom: '10px', flex: 1, minWidth: '150px' }} />
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button type="button" onClick={handleQuickAddCompany} className="auth-button btn-action" style={{ padding: '0 10px', height: '35px' }}>Save Company</button>
                                                <button type="button" onClick={() => setIsAddingNewCompany(false)} className="logout-button btn-action" style={{ padding: '0 10px', height: '35px' }}>Cancel</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                    <div className="auth-input-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
                                        <label className="auth-label">Start Date</label>
                                        <input type="date" className="auth-input" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                                    </div>
                                    <div className="auth-input-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
                                        <label className="auth-label">Duration (Weeks)</label>
                                        <input type="number" className="auth-input" value={formData.durationWeeks} onChange={e => setFormData({...formData, durationWeeks: e.target.value})} required min="1" />
                                    </div>
                                </div>

                                <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                    <label className="auth-label">Internship Objective</label>
                                    <textarea className="auth-input" value={formData.objective} onChange={e => setFormData({...formData, objective: e.target.value})} style={{ height: '80px', resize: 'none' }} required />
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                    <button type="button" onClick={() => setIsFormModalOpen(false)} className="logout-button btn-action">Cancel</button>
                                    <button type="submit" className="auth-button btn-action">Save Internship</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isDetailsModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999 }}>
                        <div className="glass-card" style={{ width: '650px', maxWidth: '95%', padding: '40px', maxHeight: '90vh', overflowY: 'auto', animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                                <h2 style={{ margin: 0 }}>Internship File #{selectedInternship?.id}</h2>
                                <button onClick={() => setIsDetailsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px' }}>✖</button>
                            </div>

                            {isDetailsLoading ? <p style={{ textAlign: 'center' }}>Loading detailed data...</p> : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', textAlign: 'left' }}>
                                    
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <h4 style={{ color: '#3b82f6', marginBottom: '12px', marginTop: 0 }}>👤 Student</h4>
                                        <p><strong>{details.student?.firstName} {details.student?.lastName}</strong></p>
                                        <p style={{ fontSize: '12px', opacity: 0.7, wordBreak: 'break-all' }}>{details.student?.email}</p>
                                        <p style={{ fontSize: '12px' }}>Major: {details.student?.major}</p>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <h4 style={{ color: '#10b981', marginBottom: '12px', marginTop: 0 }}>🏢 Company</h4>
                                        <p><strong>{details.company?.corporateName}</strong></p>
                                        <p style={{ fontSize: '11px', opacity: 0.7 }}>SIRET: {details.company?.siret}</p>
                                        <p style={{ fontSize: '12px', marginTop: '8px' }}>{details.company?.address}</p>
                                    </div>

                                    <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                                        <h4 style={{ color: '#f59e0b', marginBottom: '12px', marginTop: 0 }}>🎓 Supervision</h4>
                                        {details.teacher ? (
                                            <p>Assigned Tutor: <strong>{details.teacher.firstName} {details.teacher.lastName}</strong> ({details.teacher.email})</p>
                                        ) : <p style={{ opacity: 0.5, fontStyle: 'italic' }}>No teacher assigned yet.</p>}
                                    </div>
                                    
                                    {/* --- NOUVELLE SECTION : ORAL DEFENSE --- */}
                                    <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                                        <h4 style={{ color: '#ec4899', marginBottom: '12px', marginTop: 0 }}>🎤 Oral Defense</h4>
                                        
                                        {details.defense ? (
                                            <div style={{ padding: '15px', background: 'rgba(236, 72, 153, 0.1)', borderLeft: '4px solid #ec4899', borderRadius: '4px' }}>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Date & Time:</strong> {new Date(details.defense.date).toLocaleString()}</p>
                                                <p style={{ margin: 0 }}><strong>Room:</strong> {details.defense.room}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p style={{ opacity: 0.7, marginBottom: '15px' }}>No defense scheduled yet.</p>
                                                
                                                {userRole === 'ADMINISTRATOR' && (
                                                    <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        <h5 style={{ margin: '0 0 10px 0', color: '#ec4899' }}>📅 Schedule Defense</h5>
                                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                            <input 
                                                                type="date" className="auth-input" style={{ flex: 1, minWidth: '130px', marginBottom: 0 }} 
                                                                value={defenseForm.date} onChange={e => setDefenseForm({...defenseForm, date: e.target.value})} 
                                                            />
                                                            <input 
                                                                type="time" className="auth-input" style={{ width: '100px', marginBottom: 0 }} 
                                                                value={defenseForm.time} onChange={e => setDefenseForm({...defenseForm, time: e.target.value})} 
                                                            />
                                                            <input 
                                                                type="text" className="auth-input" placeholder="Room (e.g. Amphi A)" style={{ flex: 1, minWidth: '120px', marginBottom: 0 }} 
                                                                value={defenseForm.room} onChange={e => setDefenseForm({...defenseForm, room: e.target.value})} 
                                                            />
                                                            <button 
                                                                className="auth-button btn-action" onClick={handleScheduleDefense} 
                                                                disabled={!defenseForm.date || !defenseForm.time || !defenseForm.room || isUploading}
                                                                style={{ opacity: (!defenseForm.date || !defenseForm.time || !defenseForm.room || isUploading) ? 0.5 : 1 }}
                                                            >
                                                                Schedule
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                                        <h4 style={{ color: '#a855f7', marginBottom: '12px', marginTop: 0 }}>📄 Final Report & Evaluation</h4>
                                        
                                        {details.report ? (
                                            <div style={{ marginBottom: '15px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', flexWrap: 'wrap', gap: '10px' }}>
                                                    <p style={{ margin: 0, wordBreak: 'break-all' }}><strong>Uploaded File:</strong> {details.report.fileName}</p>
                                                    
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => handleViewReport(details.report.fileName)} className="auth-button btn-action" style={{ padding: '0 15px', height: '30px', fontSize: '12px' }}>
                                                            👁️ View PDF
                                                        </button>

                                                        {userRole === 'STUDENT' && !details.report.evaluation && (
                                                            <button onClick={handleDeleteReport} className="logout-button btn-action" style={{ padding: '0 15px', height: '30px', fontSize: '12px', borderColor: '#ef4444', color: '#ef4444' }}>
                                                                🗑️ Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '12px', opacity: 0.7, margin: 0 }}>Submitted on: {new Date(details.report.submissionDate).toLocaleString()}</p>
                                                
                                                {details.report.evaluation ? (
                                                    <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(34, 197, 94, 0.1)', borderLeft: '4px solid #22c55e', borderRadius: '4px' }}>
                                                        <p style={{ margin: '0 0 10px 0', fontSize: '18px' }}><strong>Grade: {details.report.evaluation.grade} / 20</strong></p>
                                                        <p style={{ margin: 0, fontStyle: 'italic', opacity: 0.9 }}>"{details.report.evaluation.comment}"</p>
                                                    </div>
                                                ) : (
                                                    <p style={{ marginTop: '15px', color: '#fcd34d', fontWeight: 'bold' }}>⏳ Report submitted. Waiting for teacher evaluation.</p>
                                                )}

                                                {userRole === 'TEACHER' && !details.report.evaluation && (
                                                    <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        <h5 style={{ margin: '0 0 10px 0', color: '#a855f7' }}>✍️ Evaluate this report</h5>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <label style={{ fontSize: '12px' }}>Grade (/20):</label>
                                                                <input type="number" min="0" max="20" step="0.5" className="auth-input" style={{ width: '80px', padding: '5px', marginBottom: 0 }} value={evaluationForm.grade} onChange={e => setEvaluationForm({...evaluationForm, grade: e.target.value})} />
                                                            </div>
                                                            <textarea className="auth-input" placeholder="Teacher's comments..." style={{ height: '60px', resize: 'none', marginBottom: 0 }} value={evaluationForm.comment} onChange={e => setEvaluationForm({...evaluationForm, comment: e.target.value})}></textarea>
                                                            <button className="auth-button btn-action" onClick={handleEvaluateReport} disabled={isUploading || !evaluationForm.grade} style={{ width: '100%', opacity: (isUploading || !evaluationForm.grade) ? 0.5 : 1 }}>
                                                                Submit Evaluation
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p style={{ opacity: 0.7, marginBottom: '15px' }}>No report uploaded yet.</p>
                                        )}

                                        {userRole === 'STUDENT' && (!details.report || !details.report.evaluation) && (
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: details.report ? '15px' : '0', paddingTop: details.report ? '15px' : '0', borderTop: details.report ? '1px solid rgba(255,255,255,0.1)' : 'none', flexWrap: 'wrap' }}>
                                                <input type="file" accept=".pdf" onChange={(e) => setUploadFile(e.target.files[0])} style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', flex: 1, minWidth: '200px', border: '1px solid rgba(255,255,255,0.2)' }} />
                                                <button onClick={handleUploadReport} className="auth-button btn-action" disabled={!uploadFile || isUploading} style={{ opacity: (!uploadFile || isUploading) ? 0.5 : 1 }}>
                                                    {isUploading ? 'Uploading...' : (details.report ? 'Replace PDF' : 'Upload PDF')}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ gridColumn: '1 / -1', marginTop: '5px' }}>
                                        <h4 style={{ marginBottom: '8px' }}>📝 Objective</h4>
                                        <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.8, maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                                            {selectedInternship?.objective}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {deletedInternship && (
                    <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: '#fff', padding: '12px 24px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '20px', zIndex: 9999, border: '1px solid rgba(255,255,255,0.1)', animation: 'slideUp 0.3s ease', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                        <span>Internship #<strong>{deletedInternship.id}</strong> deleted.</span>
                        <button onClick={handleUndoDelete} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>UNDO</button>
                    </div>
                )}
            </div>
            <style>{`@keyframes slideUp { from { bottom: -50px; opacity: 0; } to { bottom: 30px; opacity: 1; } }`}</style>
        </div>
    );
};

export default Internships;