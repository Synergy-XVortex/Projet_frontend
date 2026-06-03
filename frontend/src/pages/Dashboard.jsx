import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import UserService from '../services/user.service';
import CompanyService from '../services/company.service';
import InternshipService from '../services/internship.service';
import DefenseService from '../services/defense.service';
import '../styles/layout.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({ email: '', role: '' });
    
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingActivations: 0,
        registeredCompanies: 0, 
        internshipsToValidate: 0,
        teacherStudentsCount: 0, 
        studentStatus: 'Searching',
        studentCompanyName: 'None',
        hasInternship: false,
        defenseDate: null,
        defenseRoom: null,
        // --- NEW GUEST STATS ---
        guestActiveInterns: 0,
        guestTotalInterns: 0,
        guestCompanyName: 'Loading...'
    });
    
    const [isStatsLoading, setIsStatsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserInfo({ email: decoded.sub, role: decoded.role });
                fetchDashboardData(decoded.role, decoded.sub);
            } catch (error) {
                console.error("Invalid token on dashboard");
            }
        }
    }, []);

    const fetchDashboardData = async (role, email) => {
        setIsStatsLoading(true);
        try {
            if (role === 'ADMINISTRATOR') {
                const response = await UserService.getAllUsers();
                let companiesCount = 0;
                try { companiesCount = await CompanyService.countCompanies(); } catch (e) {}

                if (Array.isArray(response.data)) {
                    setStats(prev => ({
                        ...prev,
                        totalUsers: response.data.length,
                        pendingActivations: response.data.filter(u => !u.active).length,
                        registeredCompanies: companiesCount
                    }));
                }
            }
            else if (role === 'TEACHER') {
                const response = await InternshipService.getAllInternships();
                const allInternships = response.data || [];
                const myInternships = allInternships.filter(i => i.teacherEmail === email);
                const toValidateCount = myInternships.filter(i => i.status === 'COMPLETED').length;
                const myStudentsCount = new Set(myInternships.map(i => i.studentEmail)).size;

                setStats(prev => ({
                    ...prev,
                    internshipsToValidate: toValidateCount,
                    teacherStudentsCount: myStudentsCount
                }));
            }
            else if (role === 'STUDENT') {
                const response = await InternshipService.getAllInternships({ studentEmail: email });
                let hasInternship = false;
                let status = 'Searching';
                let compName = 'None';

                if (response.data && response.data.length > 0) {
                    const myInternship = response.data[0];
                    hasInternship = true;
                    status = myInternship.status;
                    compName = myInternship.companySiret;
                    try {
                        const compRes = await CompanyService.getCompanyBySiret(myInternship.companySiret);
                        compName = compRes.data.corporateName;
                    } catch (e) {}
                }

                let dDate = null;
                let dRoom = null;
                try {
                    const defRes = await DefenseService.getAllDefenses();
                    const myDefense = defRes.data.find(d => d.studentEmail === email);
                    if (myDefense) {
                        dDate = myDefense.date;
                        dRoom = myDefense.room;
                    }
                } catch (e) { console.warn("Could not fetch defenses"); }

                setStats(prev => ({
                    ...prev,
                    studentStatus: status,
                    studentCompanyName: compName,
                    hasInternship: hasInternship,
                    defenseDate: dDate,
                    defenseRoom: dRoom
                }));
            }
            // --- NEW LOGIC FOR GUEST ROLE ---
            else if (role === 'GUEST') {
                const userRes = await UserService.getUserByEmail(email);
                const guestSiret = userRes.data.companySiret;
                
                let companyName = "Unknown Company";
                if (guestSiret) {
                    try {
                        const compRes = await CompanyService.getCompanyBySiret(guestSiret);
                        companyName = compRes.data.corporateName;
                    } catch (e) { console.warn("Could not fetch company details"); }
                }

                const response = await InternshipService.getAllInternships();
                const allInternships = response.data || [];
                const companyInterns = allInternships.filter(i => i.companySiret === guestSiret);
                const activeInternsCount = companyInterns.filter(i => ['ONGOING', 'COMPLETED'].includes(i.status)).length;

                setStats(prev => ({
                    ...prev,
                    guestActiveInterns: activeInternsCount,
                    guestTotalInterns: companyInterns.length,
                    guestCompanyName: companyName
                }));
            }
        } catch (error) {
            console.error("Dashboard Error:", error);
        } finally {
            setIsStatsLoading(false);
        }
    };

    const renderAdminDashboard = () => (
        <>
            <div className="stats-grid">
                <div className="stats-card highlight">
                    <span className="stats-icon">👥</span>
                    <div>
                        <span className="stats-label">Total Users</span>
                        <span className="stats-value">{isStatsLoading ? "..." : stats.totalUsers}</span>
                    </div>
                </div>
                <div className="stats-card" style={{ borderColor: '#10b981' }}>
                    <span className="stats-icon">🏢</span>
                    <div>
                        <span className="stats-label">Registered Companies</span>
                        <span className="stats-value">{isStatsLoading ? "..." : stats.registeredCompanies}</span> 
                    </div>
                </div>
                <div className="stats-card" style={{ borderColor: stats.pendingActivations > 0 ? '#fca5a5' : 'rgba(255, 255, 255, 0.4)' }}>
                    <span className="stats-icon">⚠️</span>
                    <div>
                        <span className="stats-label">Pending Activations</span>
                        <span className="stats-value" style={{ color: stats.pendingActivations > 0 ? '#fca5a5' : '#fff' }}>
                            {isStatsLoading ? "..." : stats.pendingActivations}
                        </span>
                    </div>
                </div>
            </div>
            <div className="glass-card" style={{ marginTop: '20px' }}>
                <h3>Quick Actions</h3>
                <p>Manage platform settings and user access.</p>
                <button onClick={() => navigate('/admin/users')} className="auth-button" style={{ width: 'auto', padding: '10px 20px', marginTop: '15px' }}>Go to User Management</button>
            </div>
        </>
    );

    const renderStudentDashboard = () => (
        <>
            <div className="stats-grid">
                <div className="stats-card highlight" style={{ borderColor: stats.studentStatus === 'VALIDATED' ? '#10b981' : '#3b82f6' }}>
                    <span className="stats-icon">🎓</span>
                    <div>
                        <span className="stats-label">Internship Status</span>
                        <span className="stats-value" style={{ fontSize: '18px', color: stats.studentStatus === 'VALIDATED' ? '#10b981' : '#fff' }}>
                            {isStatsLoading ? "..." : stats.studentStatus}
                        </span>
                    </div>
                </div>
                <div className="stats-card">
                    <span className="stats-icon">🏢</span>
                    <div>
                        <span className="stats-label">Assigned Company</span>
                        <span className="stats-value" style={{ fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', display: 'inline-block' }}>
                            {isStatsLoading ? "..." : stats.studentCompanyName}
                        </span>
                    </div>
                </div>
            </div>

            {stats.defenseDate && (
                <div className="glass-card" style={{ marginTop: '20px', borderColor: '#a855f7', background: 'rgba(168, 85, 247, 0.1)', borderLeft: '4px solid #a855f7' }}>
                    <h3 style={{ color: '#d8b4fe', margin: '0 0 10px 0' }}>🗓️ Upcoming Defense Scheduled!</h3>
                    <p style={{ margin: '5px 0' }}>Your oral defense is scheduled for: <strong style={{ color: '#fff' }}>{new Date(stats.defenseDate).toLocaleString()}</strong></p>
                    <p style={{ margin: '0' }}>Room: <strong style={{ color: '#fff' }}>{stats.defenseRoom}</strong></p>
                </div>
            )}

            <div className="glass-card" style={{ marginTop: '20px' }}>
                {stats.hasInternship ? (
                    <>
                        <h3 style={{ color: '#86efac' }}>You are on track!</h3>
                        <p>Your internship has been registered. Don't forget to submit your final report before the deadline.</p>
                        <button onClick={() => navigate('/internships')} className="auth-button btn-action" style={{ width: 'auto', marginTop: '15px' }}>View Internship Details</button>
                    </>
                ) : (
                    <>
                        <h3>Next Steps</h3>
                        <ul style={{ color: 'rgba(255,255,255,0.8)', paddingLeft: '20px', lineHeight: '1.8' }}>
                            <li>Complete your profile information.</li>
                            <li>Browse the Companies Directory to find opportunities.</li>
                            <li>Contact your administration to register your internship.</li>
                        </ul>
                        <button onClick={() => navigate('/companies')} className="auth-button btn-action" style={{ width: 'auto', marginTop: '15px' }}>Browse Companies</button>
                    </>
                )}
            </div>
        </>
    );

    const renderTeacherDashboard = () => (
        <>
            <div className="stats-grid">
                <div className="stats-card highlight" style={{ borderColor: stats.internshipsToValidate > 0 ? '#f59e0b' : '#3b82f6' }}>
                    <span className="stats-icon">📋</span>
                    <div>
                        <span className="stats-label">Reports to Grade</span>
                        <span className="stats-value" style={{ color: stats.internshipsToValidate > 0 ? '#fcd34d' : '#fff' }}>
                            {isStatsLoading ? "..." : stats.internshipsToValidate}
                        </span>
                    </div>
                </div>
                <div className="stats-card">
                    <span className="stats-icon">👨‍🎓</span>
                    <div>
                        <span className="stats-label">My Students</span>
                        <span className="stats-value">
                            {isStatsLoading ? "..." : stats.teacherStudentsCount}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="glass-card" style={{ marginTop: '20px' }}>
                {stats.internshipsToValidate > 0 ? (
                    <>
                        <h3 style={{ color: '#fcd34d' }}>Action Required</h3>
                        <p>You have {stats.internshipsToValidate} internship report(s) waiting for your evaluation.</p>
                        <button onClick={() => navigate('/internships')} className="auth-button btn-action" style={{ width: 'auto', marginTop: '15px' }}>Go to Internships</button>
                    </>
                ) : (
                    <>
                        <h3>You're all caught up!</h3>
                        <p>No new internship reports need your evaluation at this moment.</p>
                        <button onClick={() => navigate('/internships')} className="auth-button btn-action" style={{ width: 'auto', marginTop: '15px' }}>View My Students</button>
                    </>
                )}
            </div>
        </>
    );

    const renderGuestDashboard = () => (
        <>
            <div className="stats-grid">
                <div className="stats-card highlight">
                    <span className="stats-icon">🏢</span>
                    <div>
                        <span className="stats-label">My Company</span>
                        <span className="stats-value" style={{ fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px', display: 'inline-block' }}>
                            {isStatsLoading ? "..." : stats.guestCompanyName}
                        </span>
                    </div>
                </div>
                <div className="stats-card" style={{ borderColor: '#10b981' }}>
                    <span className="stats-icon">👨‍🎓</span>
                    <div>
                        <span className="stats-label">Active Interns</span>
                        <span className="stats-value">{isStatsLoading ? "..." : stats.guestActiveInterns}</span>
                    </div>
                </div>
            </div>
            <div className="glass-card" style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#3b82f6' }}>Welcome, Company Partner</h3>
                <p>Here you can review and monitor the progress of the students you are currently supervising.</p>
                <button onClick={() => navigate('/internships')} className="auth-button btn-action" style={{ width: 'auto', marginTop: '15px' }}>View My Interns</button>
            </div>
        </>
    );

    return (
        <div className="app-layout">
            <div className="page-container">
                <div className="page-header">
                    <div className="page-header-text">
                        <h1 className="page-title">Welcome back!</h1>
                        <p className="page-subtitle">Logged in as: <strong>{userInfo.email}</strong> ({userInfo.role})</p>
                    </div>
                </div>

                {userInfo.role === 'ADMINISTRATOR' && renderAdminDashboard()}
                {userInfo.role === 'STUDENT' && renderStudentDashboard()}
                {userInfo.role === 'TEACHER' && renderTeacherDashboard()}
                {userInfo.role === 'GUEST' && renderGuestDashboard()}
                
                {!['ADMINISTRATOR', 'STUDENT', 'TEACHER', 'GUEST'].includes(userInfo.role) && (
                    <div className="glass-card"><p>Loading your dashboard...</p></div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;