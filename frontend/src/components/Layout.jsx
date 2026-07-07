import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="d-flex vh-100 overflow-hidden bg-light position-relative">
      <Sidebar isOpen={isSidebarOpen} />
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && window.innerWidth < 768 && (
        <div 
          className="d-md-none bg-dark bg-opacity-50 position-fixed top-0 start-0 w-100 h-100" 
          style={{ zIndex: 99 }}
          onClick={toggleSidebar}
        ></div>
      )}
      
      <div className="d-flex flex-column flex-grow-1 overflow-hidden transition-all">
        <TopNavbar toggleSidebar={toggleSidebar} />
        
        <main className="flex-grow-1 overflow-auto p-4 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
