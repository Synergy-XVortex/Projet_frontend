import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

/**
 * Component used to protect routes based on authentication status and user roles.
 * * @param {Object} props
 * @param {JSX.Element} props.children - The page component to render if access is granted.
 * @param {Array<string>} [props.allowedRoles] - Optional list of roles allowed to view this page.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    // Retrieve the token from local storage
    const token = localStorage.getItem('jwt_token');

    // 1. Check if the user is authenticated
    if (!token) {
        // If no token exists, redirect immediately to the login page
        return <Navigate to="/login" replace />;
    }

    // 2. Check for role-based access control (RBAC)
    if (allowedRoles && allowedRoles.length > 0) {
        try {
            // Decode the JWT to read the claims injected by the Spring Boot backend
            const decodedToken = jwtDecode(token);
            const userRole = decodedToken.role; 

            // If the user's role is not in the allowed list, redirect them
            if (!allowedRoles.includes(userRole)) {
                // Redirecting to the general dashboard is a safe fallback
                return <Navigate to="/dashboard" replace />;
            }
        } catch (error) {
            // If the token is corrupted or invalid, clear it and force a new login
            localStorage.removeItem('jwt_token');
            return <Navigate to="/login" replace />;
        }
    }

    // 3. If the user is authenticated and has the right role, render the requested page
    return children;
};

export default ProtectedRoute;