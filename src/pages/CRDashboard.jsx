import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { Megaphone, BookOpen, Edit2, Trash2, X, Clock, MapPin, Eye } from 'lucide-react';

export default function CRDashboard() {
  const { userData, currentUser, userRole } = useAuth();
  const enrollmentOptions = userData?.enrollments || [];
  const isAdmin = userRole === 'admin';
  const hasEnrollments = enrollmentOptions.length > 0;
  
  // Notice Form State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeDesc, setNoticeDesc] = useState('');
  const [noticeImage, setNoticeImage] = useState('');
  const [noticeScope, setNoticeScope] = useState(isAdmin ? 'global' : 'section'); 
  const [noticeCategory, setNoticeCategory] = useState('Academic Notice');
  const [noticeCustomType, setNoticeCustomType] = useState('');
  const [noticeEndDate, setNoticeEndDate] = useState('');
  const [noticeLink, setNoticeLink] = useState('');
  const [noticeCourse, setNoticeCourse] = useState(hasEnrollments ? enrollmentOptions[0].course : '');
  const [noticeSection, setNoticeSection] = useState(hasEnrollments ? enrollmentOptions[0].section : '');
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState('');

  // Assignment Form State
  const [assgTitle, setAssgTitle] = useState('');
  const [assgDesc, setAssgDesc] = useState('');
  const [assgStart, setAssgStart] = useState('');
  const [assgEnd, setAssgEnd] = useState('');
  const [assgCourse, setAssgCourse] = useState(hasEnrollments ? enrollmentOptions[0].course : '');
  const [assgSection, setAssgSection] = useState(hasEnrollments ? enrollmentOptions[0].section : '');
  const [assgLoading, setAssgLoading] = useState(false);
  const [assgMsg, setAssgMsg] = useState('');

  // Management State
  const [notices, setNotices] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [editingNotice, setEditingNotice] = useState(null);
  const [fetchingNotices, setFetchingNotices] = useState(true);

  const fetchMasterData = async () => {
    setFetchingNotices(true);
    try {
      // Fetch Notices
      let q;
      if (isAdmin) {
        q = query(collection(db, 'events'));
      } else {
        q = query(collection(db, 'events'), where('createdBy', '==', currentUser.uid));
      }
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a,b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
      setNotices(fetched);

      // Fetch Courses
      const cSnapshot = await getDocs(collection(db, 'courses'));
      setCoursesList(cSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setFetchingNotices(false);
    }
  };

  React.useEffect(() => {
    fetchMasterData();
  }, [currentUser]);

  async function handlePostNotice(e) {
    e.preventDefault();
    if(!noticeEndDate) {
       setNoticeMsg("Failed: Please provide an expiry/end date.");
       return;
    }
    setNoticeLoading(true);
    setNoticeMsg('');
    try {
      await addDoc(collection(db, 'events'), {
        title: noticeTitle,
        description: noticeDesc,
        imageUrl: noticeCategory !== 'Academic Notice' ? noticeImage : '',
        date: new Date(),
        endDate: new Date(noticeEndDate),
        linkUrl: noticeLink,
        type: noticeCategory === 'Custom' ? (noticeCustomType || 'Custom') : noticeCategory,
        scope: noticeScope,
        branch: userData.branch || 'Admin',
        semester: userData.semester || 0,
        courseLink: noticeCourse,
        sectionLink: noticeSection,
        createdBy: currentUser.uid,
        creatorName: userData.name || currentUser.email.split('@')[0]
      });
      setNoticeMsg('Notice posted successfully!');
      setNoticeTitle(''); setNoticeDesc(''); setNoticeImage(''); setNoticeLink(''); setNoticeEndDate(''); setNoticeCustomType('');
      fetchMasterData();
    } catch (err) {
      setNoticeMsg('Failed: ' + err.message);
    } finally {
      setNoticeLoading(false);
    }
  }

  async function handlePostAssg(e) {
    e.preventDefault();
    setAssgLoading(true);
    setAssgMsg('');
    try {
      if(!assgCourse || !assgSection) throw new Error("Course and Section required.");
      await addDoc(collection(db, 'assignments'), {
        title: assgTitle,
        description: assgDesc,
        startDate: new Date(assgStart),
        dueDate: new Date(assgEnd),
        courseLink: assgCourse,
        sectionLink: assgSection,
        createdBy: currentUser.uid
      });
      setAssgMsg('Assignment posted successfully!');
      setAssgTitle(''); setAssgDesc(''); setAssgStart(''); setAssgEnd('');
    } catch (err) {
      setAssgMsg('Failed: ' + err.message);
    } finally {
      setAssgLoading(false);
    }
  }

  async function handleDeleteNotice(id) {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      setNotices(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      alert("Failed to delete notice: " + err.message);
    }
  }

  async function handleUpdateNotice(e) {
    e.preventDefault();
    if(!editingNotice) return;
    try {
      const { id, ...dataToUpdate } = editingNotice;
      if(dataToUpdate.endDate && typeof dataToUpdate.endDate === 'string') {
        dataToUpdate.endDate = new Date(dataToUpdate.endDate);
      }
      await updateDoc(doc(db, 'events', id), dataToUpdate);
      setEditingNotice(null);
      fetchMasterData();
    } catch (err) {
      alert("Failed to update notice: " + err.message);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Publisher</h2>
        <p className="text-gray-500">
          Publish notices, assignments, and events to the student body.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Post Notice Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-amber-50/50">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Publish Notice</h2>
          </div>
          <div className="p-6">
            {noticeMsg && <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm font-medium">{noticeMsg}</div>}
            <form onSubmit={handlePostNotice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Scope</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" value="section" checked={noticeScope === 'section'} onChange={(e) => setNoticeScope(e.target.value)} /> Specific Course Section
                  </label>
                  {!isAdmin && <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" value="batch" checked={noticeScope === 'batch'} onChange={(e) => setNoticeScope(e.target.value)} /> Entire Branch ({userData.branch}, Sem {userData.semester})
                  </label>}
                  {isAdmin && <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" value="global" checked={noticeScope === 'global'} onChange={(e) => setNoticeScope(e.target.value)} /> Global (All College)
                  </label>}
                </div>
              </div>

              {noticeScope === 'section' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                    {hasEnrollments ? (
                      <select required className="w-full px-3 py-2 border rounded-lg" value={noticeCourse} onChange={e => {setNoticeCourse(e.target.value); setNoticeSection(enrollmentOptions.find(opt=>opt.course===e.target.value)?.section || '')}}>
                        <option value="">Select Course</option>
                        {enrollmentOptions.map((e, i) => <option key={i} value={e.course}>{e.course}</option>)}
                      </select>
                    ) : (
                      <select required className="w-full px-3 py-2 border rounded-lg" value={noticeCourse} onChange={e => setNoticeCourse(e.target.value)}>
                        <option value="">Select Course</option>
                        {coursesList.map(c => <option key={c.id} value={c.code}>{c.code} - {c.name}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <input required type="text" className="w-full px-3 py-2 border rounded-lg bg-gray-50" readOnly={hasEnrollments} value={noticeSection} onChange={e => !hasEnrollments && setNoticeSection(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notice Category</label>
                  <select className="w-full px-3 py-2 border rounded-lg focus:ring-amber-500" value={noticeCategory} onChange={e=>setNoticeCategory(e.target.value)}>
                     <option value="Academic Notice">Academic Notice</option>
                     <option value="Event Notice">Event Notice</option>
                     {isAdmin && <option value="Custom">Custom (specify below)</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry / End Date</label>
                  <input required type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-amber-500" value={noticeEndDate} onChange={e=>setNoticeEndDate(e.target.value)}/>
                </div>
              </div>

              {noticeCategory === 'Custom' && isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Category Label</label>
                  <input required type="text" placeholder="e.g. Sports Day, Cultural Fest, Seminar..." className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-amber-50 text-sm focus:ring-amber-500" value={noticeCustomType} onChange={e=>setNoticeCustomType(e.target.value)} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <input required type="text" value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-amber-500" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {noticeCategory !== 'Academic Notice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image Banner URL</label>
                    <input type="url" placeholder="https://..." value={noticeImage} onChange={e => setNoticeImage(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-amber-500 text-sm" />
                  </div>
                )}
                <div className={noticeCategory === 'Academic Notice' ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hyperlink URL (Optional)</label>
                  <input type="url" placeholder="https://..." value={noticeLink} onChange={e => setNoticeLink(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-amber-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea required rows="4" value={noticeDesc} onChange={e => setNoticeDesc(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-amber-500"></textarea>
              </div>
              
              <button disabled={noticeLoading} type="submit" className="w-full py-2.5 px-4 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors">
                {noticeLoading ? 'Publishing...' : 'Blast Notice'}
              </button>
            </form>
          </div>
        </div>

        {/* Post Assignment Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-pink-50/50">
            <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Open Assignment</h2>
          </div>
          <div className="p-6">
            {assgMsg && <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm font-medium">{assgMsg}</div>}
            <form onSubmit={handlePostAssg} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  {hasEnrollments ? (
                    <select required className="w-full px-3 py-2 border rounded-lg" value={assgCourse} onChange={e => {setAssgCourse(e.target.value); setAssgSection(enrollmentOptions.find(opt=>opt.course===e.target.value)?.section || '')}}>
                      <option value="">Select Course</option>
                      {enrollmentOptions.map((e, i) => <option key={i} value={e.course}>{e.course}</option>)}
                    </select>
                  ) : (
                    <select required className="w-full px-3 py-2 border rounded-lg" value={assgCourse} onChange={e => setAssgCourse(e.target.value)}>
                      <option value="">Select Course</option>
                      {coursesList.map(c => <option key={c.id} value={c.code}>{c.code} - {c.name}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input required type="text" className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500" readOnly={hasEnrollments} value={assgSection} onChange={e => !hasEnrollments && setAssgSection(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required type="text" value={assgTitle} onChange={e => setAssgTitle(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-pink-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required rows="3" value={assgDesc} onChange={e => setAssgDesc(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-pink-500"></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                   <input required type="date" value={assgStart} onChange={e=>setAssgStart(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm"/>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                   <input required type="date" value={assgEnd} onChange={e=>setAssgEnd(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm"/>
                </div>
              </div>
              
              <button disabled={assgLoading} type="submit" className="w-full py-2.5 px-4 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition mt-2">
                {assgLoading ? 'Opening Assignment...' : 'Open Assignment'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* --- Management Section --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Manage Your Notices</h2>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">{notices.length} Total</span>
        </div>
        
        <div className="p-0 overflow-x-auto">
          {fetchingNotices ? (
            <div className="p-8 text-center text-gray-500 font-medium animate-pulse">Loading notices...</div>
          ) : notices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">You haven't published any notices yet.</div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100">
                  <th className="p-4">Title & Type</th>
                  <th className="p-4">Scope</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {notices.map(n => (
                  <tr key={n.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-900 mb-1">{n.title}</p>
                      <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{n.type}</span>
                    </td>
                    <td className="p-4">
                      <span className="capitalize font-medium text-gray-700">{n.scope}</span>
                      {n.courseLink && <p className="text-xs text-gray-400 mt-1">{n.courseLink} ({n.sectionLink})</p>}
                    </td>
                    <td className="p-4 text-gray-600">{n.creatorName || 'Unknown'}</td>
                    <td className="p-4 text-xs text-gray-500">
                      <div>Posted: {n.date?.seconds ? new Date(n.date.seconds * 1000).toLocaleDateString() : 'N/A'}</div>
                      <div className={n.endDate && n.endDate.seconds && (n.endDate.seconds * 1000) < Date.now() ? 'text-red-500 font-medium' : ''}>
                        Ends: {n.endDate?.seconds ? new Date(n.endDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setEditingNotice({...n, endDate: n.endDate?.seconds ? new Date(n.endDate.seconds*1000).toISOString().split('T')[0] : ''})} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteNotice(n.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- Edit Modal --- */}
      {editingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Edit Notice</h3>
              <button onClick={() => setEditingNotice(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleUpdateNotice} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <input required type="text" value={editingNotice.title || ''} onChange={e => setEditingNotice({...editingNotice, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image Banner URL</label>
                  <input type="url" placeholder="https://..." value={editingNotice.imageUrl || ''} onChange={e => setEditingNotice({...editingNotice, imageUrl: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hyperlink URL</label>
                  <input type="url" placeholder="https://..." value={editingNotice.linkUrl || ''} onChange={e => setEditingNotice({...editingNotice, linkUrl: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry / End Date</label>
                <input required type="date" value={editingNotice.endDate || ''} onChange={e => setEditingNotice({...editingNotice, endDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Description</label>
                <textarea required rows="5" value={editingNotice.description || ''} onChange={e => setEditingNotice({...editingNotice, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500"></textarea>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingNotice(null)} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
