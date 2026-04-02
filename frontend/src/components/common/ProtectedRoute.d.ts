import { ReactNode } from 'react';
interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: 'admin' | 'lecturer' | 'student';
}
export declare function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ProtectedRoute.d.ts.map