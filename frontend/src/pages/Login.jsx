import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../services/auth.service';
import '../styles/auth.css';

/**
 * Login component for user authentication.
 */
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        try {
            await AuthService.login(email, password);
            navigate('/dashboard');
        } catch (error) {
            if (error.response) {
                if (error.response.status === 401) {
                    setErrorMessage('Invalid credentials. Please try again.');
                } else if (error.response.status === 403) {
                    setErrorMessage('Your account is inactive. Contact an administrator.');
                } else {
                    setErrorMessage('An unexpected error occurred.');
                }
            } else {
                setErrorMessage('Connection failed. Verify your server status.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Academic Platform</h1>
                <p className="auth-subtitle">Please enter your credentials to continue.</p>
                
                {errorMessage && <div className="auth-error">{errorMessage}</div>}
                
                <form onSubmit={handleLogin}>
                    <div className="auth-input-group">
                        <label className="auth-label">Email Address</label>
                        <input 
                            type="email" 
                            className="auth-input"
                            placeholder="name@university.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="auth-input-group">
                        <label className="auth-label">Password</label>
                        <input 
                            type="password" 
                            className="auth-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-footer">
                    SIGL 1 Project • 2026 Academic Management <Link to="/register" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>
                        Create Account
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;