import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, LayoutDashboard, Menu, X, User, BookOpen, Shield } from 'lucide-react';

export default function Layout({ children }) {
  const { userData, userRole, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'default';

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out', err);
    }
  }

  const navItems = [];

  if (userRole === 'student') {
    navItems.push({ label: 'My Dashboard', icon: LayoutDashboard, tab: 'default' });
  }

  if (userRole === 'cr') {
    navItems.push({ label: 'CR Tools', icon: Shield, tab: 'default' });
    navItems.push({ label: 'My Student View', icon: LayoutDashboard, tab: 'student' });
  }

  if (userRole === 'admin') {
    navItems.push({ label: 'Admin Desk', icon: Shield, tab: 'default' });
    navItems.push({ label: 'Content Tools (CR Powers)', icon: BookOpen, tab: 'cr' });
    navItems.push({ label: 'Global Student View', icon: LayoutDashboard, tab: 'student' });
  }

  navItems.push({ label: 'My Profile', icon: User, tab: 'profile' });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 bg-indigo-600 text-white">
          <span className="text-xl font-bold tracking-tight">College Portal</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white hover:text-indigo-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          {navItems.map((item, index) => (
            <button 
              key={index} 
              onClick={() => {
                navigate(`/?tab=${item.tab}`);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                currentTab === item.tab ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="mb-4 px-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden text-indigo-600 font-bold">
              {userData?.avatarUrl ? (
                <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                userData?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{userData?.name}</p>
              <p className="text-xs text-gray-500 capitalize truncate">{userRole} {userData?.branch ? `• ${userData.branch}` : ''}</p>
            </div>
          </div>
          <div className="mb-4 px-2">

            {userData?.enrollments && userData.enrollments.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-gray-600">Enrolled In:</p>
                {userData.enrollments.map((e, i) => (
                  <p key={i} className="text-xs text-gray-400 truncate">- {e.course} ({e.section})</p>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white shadow-sm flex items-center px-4 sm:px-6 lg:px-8 border-b border-gray-100 z-10">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0 rounded-md"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-800">Welcome, {userData?.name?.split(' ')[0] || 'User'}</h1>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
