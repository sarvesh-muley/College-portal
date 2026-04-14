import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import CRDashboard from './CRDashboard';
import StudentDashboard from './StudentDashboard';
import ProfileSettings from './ProfileSettings';
import Layout from '../components/Layout';

export default function DashboardHub() {
  const { userRole } = useAuth();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'default';

  const renderDashboard = () => {
    if (tab === 'profile') return <ProfileSettings />;

    if (userRole === 'admin') {
      if (tab === 'student') return <StudentDashboard />;
      if (tab === 'cr') return <CRDashboard />;
      return <AdminDashboard />;
    }

    if (userRole === 'cr') {
      return tab === 'student' ? <StudentDashboard /> : <CRDashboard />;
    }

    // Fallback for student
    return <StudentDashboard />;
  };

  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
}
