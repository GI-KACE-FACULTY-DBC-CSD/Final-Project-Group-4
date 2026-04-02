import { ReactNode } from 'react';
import { User } from '../types';
export interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    logout: () => void;
    setAuth: (user: User, token: string) => void;
    isLoading: boolean;
}
export declare const AuthContext: import("react").Context<AuthContextType | undefined>;
export declare function AuthProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AuthContext.d.ts.map