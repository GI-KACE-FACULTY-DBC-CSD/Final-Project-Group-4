import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
export function NavigationBlocker() {
    const { isAuthenticated, user, logout } = useAuth();
    // Initialize history on login and setup back button handler
    useEffect(() => {
        if (!isAuthenticated || !user)
            return;
        // Create a history entry that the user can try to go back to
        window.history.pushState({ protected: true }, '', window.location.href);
        const handlePopState = (event) => {
            // If this is the protected entry we just created, show confirmation
            if (event.state?.protected) {
                // Push it back so we stay on the page
                window.history.pushState({ protected: true }, '', window.location.href);
            }
            // Show confirmation dialog
            const confirmed = window.confirm('Going back will log you out. Do you want to continue?');
            if (confirmed) {
                logout();
                // Redirect to the correct login page based on user role
                window.location.href = user?.role === 'admin' ? '/admin/login' : '/login';
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isAuthenticated, user, logout]);
    return null;
}
//# sourceMappingURL=NavigationBlocker.js.map