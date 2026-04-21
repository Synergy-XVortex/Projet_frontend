import { jwtDecode } from 'jwt-decode';
import '../styles/layout.css';

/**
 * Main Dashboard page for authenticated users.
 */
const Dashboard = () => {
    // Decode token to retrieve user role for display
    const token = localStorage.getItem('jwt_token');
    const decoded = jwtDecode(token);
    const role = decoded.role;

    return (
        <div className="app-layout">
            <div className="page-container">
                <h1 className="page-title">Welcome to your Dashboard</h1>
                <p className="page-subtitle">
                    You are currently logged in as an <strong>{role}</strong>.
                </p>

                {/* Dashboard widgets using the new glassmorphism style */}
                <div className="glass-card">
                    <h3>Quick Actions</h3>
                    <p>
                        Depending on your role, you will soon see statistics, recent internships, or pending reports here.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;