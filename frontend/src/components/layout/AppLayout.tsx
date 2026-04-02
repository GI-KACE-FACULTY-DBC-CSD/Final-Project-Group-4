import { ReactNode, useState } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

interface SidebarLink {
  label: string;
  href: string;
}

interface AppLayoutProps {
  children: ReactNode;
  sidebarLinks: SidebarLink[];
  backgroundImage?: string;
}

export function AppLayout({ children, sidebarLinks, backgroundImage }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`flex h-screen ${backgroundImage ? '' : 'bg-gray-50'}`}>
      {/* full-viewport background (optional) */}
      {typeof (backgroundImage) !== 'undefined' && (
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.18,
            filter: 'saturate(0.95) brightness(0.98)'
          }}
        />
      )}

      <div className="relative z-10 flex w-full">
        <AppSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          links={sidebarLinks}
        />
        <div className="flex-1 flex flex-col">
          <AppHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
