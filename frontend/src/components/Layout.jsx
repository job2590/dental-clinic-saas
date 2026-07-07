import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="d-flex vh-100 overflow-hidden bg-light">
      <Sidebar isOpen={isSidebarOpen} />
      
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
