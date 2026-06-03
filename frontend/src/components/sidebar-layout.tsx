import React, { ReactNode, useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

interface SidebarLayoutProps {
  navbar?: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

export function SidebarLayout({ navbar, sidebar, children }: SidebarLayoutProps) {
  const [autoCollapse, setAutoCollapse] = useState(() => {
    const saved = localStorage.getItem('sgh_autoCollapse_enabled');
    return saved !== 'false';
  });
  const [isCollapsed, setIsCollapsed] = useState(autoCollapse);
  const location = useLocation();

  useEffect(() => {
    if (autoCollapse) {
      setIsCollapsed(true);
    }
  }, [location.pathname, autoCollapse]);

  const [lastRightClick, setLastRightClick] = useState(0);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar que salga el menú del navegador
    const now = Date.now();
    if (now - lastRightClick < 500) { // Detectar doble clic derecho (menos de 500ms)
      const newValue = !autoCollapse;
      setAutoCollapse(newValue);
      localStorage.setItem('sgh_autoCollapse_enabled', newValue.toString());
      if (!newValue) {
        setIsCollapsed(false); // Abrir si se desactiva el modo automático
        toast.success('Modo automático desactivado (Layout expandido)');
      } else {
        toast.success('Modo automático activado (Layout contraído)');
      }
      setLastRightClick(0);
    } else {
      setLastRightClick(now);
    }
  };

  return (
    <div className="c-app-layout">
      {/* Mobile/Top Navbar */}
      <div className="c-app-navbar-mobile lg:hidden">
        {navbar}
      </div>

      {/* Desktop Sidebar */}
      <aside className={`c-app-sidebar hidden lg:flex ${isCollapsed ? 'collapsed' : ''}`}>
        <button 
          className="c-sidebar-toggle" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          onContextMenu={handleContextMenu}
          title="Doble clic derecho para alternar modo automático"
          aria-label="Toggle Sidebar"
        >
          <Menu width={24} />
        </button>
        {sidebar}
      </aside>

      {/* Main Content Area */}
      <main className="c-app-main">
        {/* Desktop Navbar (optional, if you want top nav next to sidebar) */}
        <div className="hidden lg:block c-app-navbar-desktop">
          {navbar}
        </div>
        <div className="c-app-content">
          {children}
        </div>
      </main>
    </div>
  );
}
