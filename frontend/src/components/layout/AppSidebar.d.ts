interface SidebarLink {
    label: string;
    href: string;
}
interface AppSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    links: SidebarLink[];
}
export declare function AppSidebar({ isOpen, onClose, links }: AppSidebarProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AppSidebar.d.ts.map