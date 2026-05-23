import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import UserService from '../services/user.service';
import CompanyService from '../services/company.service';
import InternshipService from '../services/internship.service'; // <-- AJOUT DE L'IMPORT
import '../styles/layout.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({ email: '', role: '' });
    
    const [stats, setStats] = useState({
        // Admin stats
        totalUsers: 0,
        pendingActivations: 0,
        registeredCompanies: 0, 
        internshipsToValidate: 0,
        // Student stats
        studentStatus: 'Searching',
        studentCompanyName: 'None',
        hasInternship: false
    });
    const [isStatsLoading, setIsStatsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const role = decoded.role;
                const email = decoded.sub;
                setUserInfo({ 
                    email: email, 
                    role: role 
                });

                fetchDashboardData(role, email);

            } catch (error) {
                console.error("Invalid token on dashboard");
            }
        }
    }, []);

    const fetchDashboardData = async (role, email) => {
        setIsStatsLoading(true);
        try {
            // =====================================
            // LOGIQUE ADMINISTRATEUR
            // =====================================
            if (role === 'ADMINISTRATOR') {
                const response = await UserService.getAllUsers();
                let companiesCount = 0;
                try {
                    companiesCount = await CompanyService.countCompanies();
                } catch (companyError) {
                    console.warn("API Entreprises non prête, compteur à 0 par défaut.");
                }

                if (Array.isArray(response.data)) {
                    const users = response.data;
                    const total = users.length;
                    const pending = users.filter(user => user.active === false).length;

                    setStats(prev => ({
                        ...prev,
                        totalUsers: total,
                        pendingActivations: pending,
                        registeredCompanies: companiesCount
                    }));
                }
            }
            
            // =====================================
            // LOGIQUE ÉTUDIANT
            // =====================================
            else if (role === 'STUDENT') {
                const response = await InternshipService.getAllInternships({ studentEmail: email });
                
                if (response.data && response.data.length > 0) {
                    const myInternship = response.data[0]; // On prend le premier stage de l'étudiant
                    
                    // On essaie de récupérer le vrai nom de l'entreprise via le SIRET
                    let compName = myInternship.companySiret;
                    try {
                        const compRes = await CompanyService.getCompanyBySiret(myInternship.companySiret);
                        compName = compRes.data.corporateName;
                    } catch (e) {
                        console.warn("Impossible de récupérer le nom de l'entreprise");
                    }

                    setStats(prev => ({
                        ...prev,
                        studentStatus: myInternship.status,
                        studentCompanyName: compName,
                        hasInternship: true
                    }));
                } else {
                    setStats(prev => ({
                        ...prev,
                        studentStatus: 'Searching',
                        studentCompanyName: 'None',
                        hasInternship: false
                    }));
                }
            }
            
        } catch (error) {
            console.error("Erreur lors de la récupération des données du tableau de bord:", error);
        } finally {
            setIsStatsLoading(false);
        }
    };

    // =========================================
    // ROLE-SPECIFIC VIEWS
    // =========================================

    const renderAdminDashboard = () => (
        <>
            <div className="stats-grid">
                <div className="stats-card highlight">
                    <span className="stats-icon">👥</span>
                    <div>
                        <span className="stats-label">Total Users</span>
                        <span className="stats-value">
                            {isStatsLoading ? "..." : stats.totalUsers}
                        </span>
                    </div>
                </div>
                
                <div className="stats-card" style={{ borderColor: '#10b981' }}>
                    <span className="stats-icon">🏢</span>
                    <div>
                        <span className="stats-label">Registered Companies</span>
                        <span className="stats-value">
                            {isStatsLoading ? "..." : stats.registeredCompanies}
                        </span> 
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
                <button 
                    onClick={() => navigate('/admin/users')} 
                    className="auth-button btn-action" 
                    style={{ width: 'auto', padding: '0 20px', marginTop: '15px' }}
                >
                    Go to User Management
                </button>
            </div>
        </>
    );

    const renderStudentDashboard = () => (
        <>
            <div className="stats-grid">
                {/* 1. Statut dynamique du stage */}
                <div className="stats-card highlight" style={{ borderColor: stats.studentStatus === 'VALIDATED' ? '#10b981' : '#3b82f6' }}>
                    <span className="stats-icon">🎓</span>
                    <div>
                        <span className="stats-label">Internship Status</span>
                        <span className="stats-value" style={{ fontSize: '18px', color: stats.studentStatus === 'VALIDATED' ? '#10b981' : '#fff' }}>
                            {isStatsLoading ? "..." : stats.studentStatus}
                        </span>
                    </div>
                </div>
                
                {/* 2. Affichage de l'entreprise assignée */}
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

            <div className="glass-card" style={{ marginTop: '20px' }}>
                {stats.hasInternship ? (
                    <>
                        <h3 style={{ color: '#86efac' }}>You are on track!</h3>
                        <p>Your internship has been registered. Don't forget to submit your final report before the deadline.</p>
                        <button 
                            onClick={() => navigate('/internships')} 
                            className="auth-button btn-action" 
                            style={{ width: 'auto', padding: '0 20px', marginTop: '15px' }}
                        >
                            View Internship Details
                        </button>
                    </>
                ) : (
                    <>
                        <h3>Next Steps</h3>
                        <ul style={{ color: 'rgba(255,255,255,0.8)', paddingLeft: '20px', lineHeight: '1.8' }}>
                            <li>Complete your profile information.</li>
                            <li>Browse the Companies Directory to find opportunities.</li>
                            <li>Contact your administration to register your internship.</li>
                        </ul>
                        <button 
                            onClick={() => navigate('/companies')} 
                            className="auth-button btn-action" 
                            style={{ width: 'auto', padding: '0 20px', marginTop: '15px' }}
                        >
                            Browse Companies
                        </button>
                    </>
                )}
            </div>
        </>
    );

    const renderTeacherDashboard = () => (
        <>
            <div className="stats-grid">
                <div className="stats-card highlight">
                    <span className="stats-icon">📋</span>
                    <div>
                        <span className="stats-label">Internships to Validate</span>
                        <span className="stats-value">0</span>
                    </div>
                </div>
                <div className="stats-card">
                    <span className="stats-icon">👨‍🎓</span>
                    <div>
                        <span className="stats-label">My Students</span>
                        <span className="stats-value">0</span>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ marginTop: '20px' }}>
                <h3>Recent Activity</h3>
                <p>No new internship agreements submitted today.</p>
            </div>
        </>
    );

    const renderGuestDashboard = () => (
        <div className="glass-card">
            <h3>Welcome, Company Partner</h3>
            <p>Here you will be able to review and validate the progress of the students you are supervising.</p>
        </div>
    );

    // =========================================
    // MAIN RENDER
    // =========================================
    return (
        <div className="app-layout">
            <div className="page-container">
                <div className="page-header">
                    <div className="page-header-text">
                        <h1 className="page-title">Welcome back!</h1>
                        <p className="page-subtitle">Logged in as: <strong>{userInfo.email}</strong> ({userInfo.role})</p>
                    </div>
                </div>

                {/* Conditional Rendering based on Role */}
                {userInfo.role === 'ADMINISTRATOR' && renderAdminDashboard()}
                {userInfo.role === 'STUDENT' && renderStudentDashboard()}
                {userInfo.role === 'TEACHER' && renderTeacherDashboard()}
                {userInfo.role === 'GUEST' && renderGuestDashboard()}
                
                {/* Fallback if role is not caught */}
                {!['ADMINISTRATOR', 'STUDENT', 'TEACHER', 'GUEST'].includes(userInfo.role) && (
                    <div className="glass-card">
                        <p>Loading your dashboard...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;