import { ReactNode } from 'react';
interface SidebarLink {
    label: string;
    href: string;
}
interface AppLayoutProps {
    children: ReactNode;
    sidebarLinks: SidebarLink[];
    backgroundImage?: string;
}
export declare function AppLayout({ children, sidebarLinks, backgroundImage }: AppLayoutProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AppLayout.d.ts.map