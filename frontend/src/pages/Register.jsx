import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../services/auth.service';
import '../styles/auth.css';

/**
 * Register component for creating new accounts.
 */
const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        try {
            await AuthService.register(email, password, role);
            navigate('/login');
        } catch (error) {
            setErrorMessage('Registration failed. Please check your information.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join the Academic Platform.</p>
                
                {errorMessage && <div className="auth-error">{errorMessage}</div>}
                
                <form onSubmit={handleRegister}>
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

                    <div className="auth-input-group">
                        <label className="auth-label">Role</label>
                        <select 
                            className="auth-input"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            style={{ appearance: 'auto' }}
                        >
                            <option value="STUDENT">Student</option>
                            <option value="SUPERVISOR">Supervisor</option>
                            <option value="ADMINISTRATOR">Administrator</option>
                        </select>
                    </div>
                    
                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Sign Up'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;