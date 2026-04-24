import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import UserService from '../services/user.service';
import CompanyService from '../services/company.service';
import '../styles/layout.css';

/**
 * Main Dashboard component.
 * Displays different widgets and dynamic statistics based on the user's role.
 */
const Dashboard = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({ email: '', role: '' });
    
    // State to store real figures fetched from the backend
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingActivations: 0,
        registeredCompanies: 0, 
        internshipsToValidate: 0 
    });
    const [isStatsLoading, setIsStatsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const role = decoded.role;
                setUserInfo({ 
                    email: decoded.sub, 
                    role: role 
                });

                // Trigger data fetching based on role
                fetchDashboardData(role);

            } catch (error) {
                console.error("Invalid token on dashboard");
            }
        }
    }, []);

    /**
     * Function to fetch dynamic data from the API
     */
    const fetchDashboardData = async (role) => {
        setIsStatsLoading(true);
        try {
            if (role === 'ADMINISTRATOR') {
                // 1. Fetch users first
                const response = await UserService.getAllUsers();
                
                // 2. Isolate the companies request to prevent a domino effect
                let companiesCount = 0;
                try {
                    companiesCount = await CompanyService.countCompanies();
                } catch (companyError) {
                    console.warn("Companies API not ready, default count to 0.");
                    // Error is caught here, the rest of the code continues to execute!
                }

                if (Array.isArray(response.data)) {
                    const users = response.data;
                    
                    const total = users.length;
                    const pending = users.filter(user => user.active === false).length;

                    setStats(prev => ({
                        ...prev,
                        totalUsers: total,
                        pendingActivations: pending,
                        registeredCompanies: companiesCount // Will be 0 if API fails, or the real figure if it works
                    }));
                }
            }
            // Other roles...
            
        } catch (error) {
            console.error("Major error while fetching users:", error);
        } finally {
            setIsStatsLoading(false);
        }
    };

    // =========================================
    // ROLE-SPECIFIC VIEWS
    // =========================================

    /**
     * View for ADMINISTRATOR
     */
    const renderAdminDashboard = () => (
        <>
            <div className="stats-grid">
                {/* 1. Total Users Card (Blue border via 'highlight' class) */}
                <div className="stats-card highlight">
                    <span className="stats-icon">👥</span>
                    <div>
                        <span className="stats-label">Total Users</span>
                        <span className="stats-value">
                            {isStatsLoading ? "..." : stats.totalUsers}
                        </span>
                    </div>
                </div>
                
                {/* 2. Registered Companies Card (Emerald/green border) */}
                <div className="stats-card" style={{ borderColor: '#10b981' }}>
                    <span className="stats-icon">🏢</span>
                    <div>
                        <span className="stats-label">Registered Companies</span>
                        <span className="stats-value">
                            {isStatsLoading ? "..." : stats.registeredCompanies}
                        </span> 
                    </div>
                </div>
                
                {/* 3. Pending Activations Card (White border if 0, light red if > 0) */}
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
                    style={{ width: 'auto', padding: '10px 20px', marginTop: '15px' }}
                >
                    Go to User Management
                </button>
            </div>
        </>
    );

    /**
     * View for STUDENT
     */
    const renderStudentDashboard = () => (
        <>
            <div className="stats-grid">
                <div className="stats-card highlight">
                    <span className="stats-icon">🎓</span>
                    <div>
                        <span className="stats-label">Internship Status</span>
                        <span className="stats-value" style={{ fontSize: '18px' }}>Searching</span>
                    </div>
                </div>
                <div className="stats-card">
                    <span className="stats-icon">📄</span>
                    <div>
                        <span className="stats-label">Applications Sent</span>
                        <span className="stats-value">0</span>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ marginTop: '20px' }}>
                <h3>Next Steps</h3>
                <ul style={{ color: 'rgba(255,255,255,0.8)', paddingLeft: '20px', lineHeight: '1.8' }}>
                    <li>Complete your profile information.</li>
                    <li>Browse the Companies Directory to find opportunities.</li>
                    <li>Submit your internship convention for approval.</li>
                </ul>
                <button 
                    onClick={() => navigate('/companies')} 
                    className="auth-button btn-action" 
                    style={{ width: 'auto', padding: '10px 20px', marginTop: '15px' }}
                >
                    Browse Companies
                </button>
            </div>
        </>
    );

    /**
     * View for TEACHER
     */
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

    /**
     * View for GUEST (Company Tutor)
     */
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