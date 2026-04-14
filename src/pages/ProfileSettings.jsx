import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Image as ImageIcon, MapPin, Phone, GraduationCap, Shield } from 'lucide-react';

export default function ProfileSettings() {
  const { userData, currentUser, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Editable states
  const [avatarUrl, setAvatarUrl] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');

  // Pre-fill form when userData is available
  useEffect(() => {
    if (userData) {
      setAvatarUrl(userData.avatarUrl || '');
      setMobile(userData.mobile || '');
      setAddress(userData.address || '');
    }
  }, [userData]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      await updateDoc(docRef, {
        avatarUrl,
        mobile,
        address
      });
      setMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setMsg({ text: 'Failed to update profile: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return <div className="p-8 text-center text-gray-500">Loading profile data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h2>
        <p className="text-gray-500">
          Manage your personal information and contact details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card (Read Only summary) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center h-fit">
          <div className="w-32 h-32 rounded-full border-4 border-indigo-50 bg-indigo-100 flex items-center justify-center overflow-hidden mb-4 shadow-sm text-indigo-500 font-bold text-4xl">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              userData.name?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{userData.name}</h3>
          <p className="text-gray-500 text-sm mb-4">{currentUser?.email}</p>
          
          <div className="w-full space-y-3 pt-4 border-t border-gray-100 text-left">
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 capitalize">Role: <span className="font-semibold text-gray-900">{userRole}</span></span>
            </div>
            {userData.branch && (
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Branch: <span className="font-semibold text-gray-900">{userData.branch}</span></span>
              </div>
            )}
            {userData.semester && (
              <div className="flex items-center gap-3 text-sm">
                <BookOpenIcon icon />
                <span className="text-gray-600">Semester: <span className="font-semibold text-gray-900">{userData.semester}</span></span>
              </div>
            )}
            <div className="text-xs text-gray-400 italic mt-2 text-center">
              (Academic details are managed by administration)
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 h-fit">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
            <div className="p-2 bg-white rounded-lg text-gray-600 shadow-sm border border-gray-200">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="p-6 md:p-8 space-y-6">
            {msg.text && (
              <div className={`p-4 rounded-lg text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {msg.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                value={userData.name || ''} 
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" 
                readOnly 
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <ImageIcon className="w-4 h-4 text-indigo-500" /> Avatar Image URL
              </label>
              <input 
                type="url" 
                placeholder="https://example.com/my-photo.jpg" 
                value={avatarUrl} 
                onChange={e => setAvatarUrl(e.target.value)} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500" 
              />
              <p className="text-xs text-gray-500 mt-1">Provide a link to your display picture.</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 text-indigo-500" /> Mobile Number
              </label>
              <input 
                type="tel" 
                placeholder="+1 234 567 890" 
                value={mobile} 
                onChange={e => setMobile(e.target.value)} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500" 
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 text-indigo-500" /> Residential Address
              </label>
              <textarea 
                rows="3" 
                placeholder="Enter your full address..." 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500" 
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-70 flex items-center gap-2"
              >
                {loading ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

// Inline helper until lucide updates
function BookOpenIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-book-open w-4 h-4 text-gray-400 ${className || ''}`}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  );
}
