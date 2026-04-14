import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, secondaryAuth } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import Papa from 'papaparse';
import { Shield, UploadCloud, Users, Calendar, Loader2, Edit2, Trash2, X, BookOpen, Plus, GraduationCap } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users'); 
  
  return (
    <div className={`space-y-6 mx-auto ${activeTab === 'timetable' ? 'max-w-full px-4 lg:px-8' : 'max-w-6xl'}`}>
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl shadow-xl overflow-hidden p-8 text-white flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Administration Control</h2>
          <p className="text-indigo-200">Manage user enrollments and college schedules.</p>
        </div>
        <div className="hidden md:block p-4 bg-white/10 rounded-full backdrop-blur-md">
          <Shield className="h-12 w-12 text-indigo-200" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>User Management</button>
        <button onClick={() => setActiveTab('courses')} className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'courses' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Course Manager</button>
        <button onClick={() => setActiveTab('timetable')} className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'timetable' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Timetable Manager</button>
      </div>

      {activeTab === 'users' && <UserManager />}
      {activeTab === 'courses' && <CourseManager />}
      {activeTab === 'timetable' && <TimetableManager />}
    </div>
  );
}

function UserManager() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  // Edit Modal State
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editSemester, setEditSemester] = useState('');
  const [editEnrollStr, setEditEnrollStr] = useState(''); // comma separated CS101:A, CS102:B

  async function fetchUsers() {
    setLoading(true);
    const sn = await getDocs(collection(db, 'users'));
    setUsersList(sn.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => { fetchUsers() }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setMsg('Parsing CSV...');
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        let successCount = 0; let failCount = 0;

        for (const row of rows) {
          try {
            const { Name, Email, Password, Branch, Semester, Role, ...rest } = row;
            if(!Email || !Password) throw new Error("Missing");

            const enrollments = [];
            for(let i=1; i<=10; i++) {
              if(rest[`Course${i}`] && rest[`Section${i}`]) {
                enrollments.push({ course: rest[`Course${i}`], section: rest[`Section${i}`] });
              }
            }

            const creds = await createUserWithEmailAndPassword(secondaryAuth, Email, Password);
            await setDoc(doc(db, 'users', creds.user.uid), {
              name: Name || Email.split('@')[0],
              email: Email,
              role: Role ? Role.toLowerCase() : 'student',
              branch: Branch || '',
              semester: Number(Semester) || 1,
              enrollments
            });
            successCount++;
          } catch(err) { failCount++; }
        }
        setMsg(`Upload complete! Successfully created ${successCount} users. Failed on ${failCount}.`);
        setUploading(false);
        fetchUsers();
      }
    });
  }

  const openEdit = (usr) => {
    setEditRole(usr.role);
    setEditBranch(usr.branch || '');
    setEditSemester(usr.semester || 1);
    setEditEnrollStr((usr.enrollments||[]).map(e => `${e.course}:${e.section}`).join(', '));
    setEditUser(usr);
  }

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const enrollArr = editEnrollStr.split(',').map(s => s.trim()).filter(s => s.includes(':')).map(s => {
        const [c, sec] = s.split(':');
        return { course: c.trim(), section: sec.trim() };
      });
      await updateDoc(doc(db, 'users', editUser.id), {
        role: editRole,
        branch: editBranch,
        semester: Number(editSemester),
        enrollments: enrollArr
      });
      setEditUser(null);
      fetchUsers();
    } catch(err) {
      alert("Failed to save: " + err.message);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      
      {/* Edit Modal Overlay */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit {editUser.name}</h3>
              <button onClick={()=>setEditUser(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                 <label className="block text-sm font-medium mb-1">Role</label>
                 <select className="w-full border py-2 px-3 rounded-lg" value={editRole} onChange={e=>setEditRole(e.target.value)}>
                   <option value="student">Student</option>
                   <option value="cr">CR</option>
                   <option value="admin">Admin</option>
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-sm font-medium mb-1">Branch</label>
                   <input className="w-full border py-2 px-3 rounded-lg" value={editBranch} onChange={e=>setEditBranch(e.target.value)} />
                 </div>
                 <div>
                   <label className="block text-sm font-medium mb-1">Semester</label>
                   <input type="number" className="w-full border py-2 px-3 rounded-lg" value={editSemester} onChange={e=>setEditSemester(e.target.value)} />
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium mb-1">Enrollments (Course:Section, ...)</label>
                 <textarea className="w-full border py-2 px-3 rounded-lg text-sm" value={editEnrollStr} onChange={e=>setEditEnrollStr(e.target.value)} rows="3"></textarea>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white rounded-lg py-2 mt-2">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* CSV Uploader */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-1 h-fit">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><UploadCloud className="w-5 h-5 text-indigo-500" /> Bulk Create Users</h3>
        <p className="text-sm text-gray-500 mb-4">Upload a CSV file. Expected headers: <code>Name, Email, Password, Role, Branch, Semester, Course1, Section1, Course2, Section2...</code></p>
        
        {msg && <div className="text-sm p-3 mb-4 rounded bg-blue-50 text-blue-700">{msg}</div>}

        <label className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-indigo-400 focus:outline-none">
          <span className="flex items-center space-x-2">
            <UploadCloud className="w-6 h-6 text-gray-400" />
            <span className="font-medium text-gray-600">
               {uploading ? 'Processing...' : 'Drop CSV file to input'}
            </span>
          </span>
          <input type="file" accept=".csv" name="file_upload" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>
      </div>

      {/* User Directory */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold flex items-center gap-2"><Users className="w-5 h-5 text-gray-500"/> Current Directory</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-4 text-gray-500 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersList.map((usr) => (
                  <tr key={usr.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{usr.name}</div>
                      <div className="text-sm text-gray-500">{usr.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${usr.role === 'admin' ? 'bg-purple-100 text-purple-800' : usr.role === 'cr' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {usr.enrollments && usr.enrollments.length > 0 ? (
                        <div className="text-xs text-gray-500 truncate max-w-[120px]" title={usr.enrollments.map(e=>e.course).join(', ')}>
                           {usr.enrollments.length} Course(s)
                        </div>
                      ) : <span className="text-xs text-red-400">None</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <button onClick={()=>openEdit(usr)} className="text-indigo-600 hover:text-indigo-900 p-1 bg-indigo-50 rounded"><Edit2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Course Manager ──────────────────────────────────────────────────────────
function CourseManager() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [facultyInput, setFacultyInput] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  async function fetchCourses() {
    setLoading(true);
    const sn = await getDocs(collection(db, 'courses'));
    setCourses(sn.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }
  useEffect(() => { fetchCourses(); }, []);

  function addFaculty() {
    const trimmed = facultyInput.trim();
    if (trimmed && !faculties.includes(trimmed)) {
      setFaculties(prev => [...prev, trimmed]);
    }
    setFacultyInput('');
  }

  function removeFaculty(f) {
    setFaculties(prev => prev.filter(x => x !== f));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!code || !name) { alert('Course code and name are required.'); return; }
    setSaving(true);
    try {
      const payload = { code, name, branch, semester: Number(semester) || 0, faculties };
      if (editId) {
        await updateDoc(doc(db, 'courses', editId), payload);
      } else {
        await addDoc(collection(db, 'courses'), payload);
      }
      setCode(''); setName(''); setBranch(''); setSemester(''); setFaculties([]); setEditId(null);
      fetchCourses();
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(false);
  }

  function startEdit(c) {
    setEditId(c.id); setCode(c.code); setName(c.name);
    setBranch(c.branch || ''); setSemester(c.semester?.toString() || '');
    setFaculties(c.faculties || []);
  }

  async function handleDel(id) {
    if (!confirm('Delete this course?')) return;
    await deleteDoc(doc(db, 'courses', id));
    fetchCourses();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit lg:col-span-1">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-500" />
          {editId ? 'Edit Course' : 'Add Course'}
        </h3>
        <form onSubmit={handleSave} className="space-y-3">
          <input required type="text" placeholder="Course Code (e.g. CS101)" className="w-full px-3 py-2 border rounded-lg text-sm" value={code} onChange={e => setCode(e.target.value)} />
          <input required type="text" placeholder="Subject / Course Name" className="w-full px-3 py-2 border rounded-lg text-sm" value={name} onChange={e => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Branch (e.g. CSE)" className="w-full px-3 py-2 border rounded-lg text-sm" value={branch} onChange={e => setBranch(e.target.value)} />
            <input type="number" placeholder="Semester" className="w-full px-3 py-2 border rounded-lg text-sm" value={semester} onChange={e => setSemester(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Add Faculty</label>
            <div className="flex gap-2">
              <input type="text" placeholder="Faculty name" className="flex-1 px-3 py-2 border rounded-lg text-sm" value={facultyInput} onChange={e => setFacultyInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFaculty(); } }} />
              <button type="button" onClick={addFaculty} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"><Plus className="w-4 h-4" /></button>
            </div>
            {faculties.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {faculties.map(f => (
                  <span key={f} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">
                    {f}
                    <button type="button" onClick={() => removeFaculty(f)} className="text-indigo-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60">
            {saving ? 'Saving...' : editId ? 'Update Course' : 'Add Course'}
          </button>
          {editId && <button type="button" onClick={() => { setEditId(null); setCode(''); setName(''); setBranch(''); setSemester(''); setFaculties([]); }} className="w-full text-sm text-gray-500 hover:text-gray-700 mt-1">Cancel Edit</button>}
        </form>
      </div>

      {/* Course list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
        <h3 className="text-lg font-bold text-gray-900 mb-4">All Courses</h3>
        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
          courses.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">No courses added yet.</p> : (
            <div className="space-y-3">
              {courses.map(c => (
                <div key={c.id} className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded mr-2">{c.code}</span>
                      <span className="font-semibold text-gray-900">{c.name}</span>
                      {c.branch && <span className="ml-2 text-xs text-gray-400">{c.branch}{c.semester ? ` · Sem ${c.semester}` : ''}</span>}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => startEdit(c)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDel(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {(c.faculties || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(c.faculties || []).map(f => (
                        <span key={f} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── Timetable Manager ────────────────────────────────────────────────────────
// ─── Slot Manager ─────────────────────────────────────────────────────────
function SlotManager() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd]   = useState('10:30');
  const [isBreak, setIsBreak] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchSlots() {
    setLoading(true);
    const sn = await getDocs(collection(db, 'timeSlots'));
    const raw = sn.docs.map(d => ({ id: d.id, ...d.data() }));
    raw.sort((a, b) => a.start.localeCompare(b.start));
    setSlots(raw);
    setLoading(false);
  }
  useEffect(() => { fetchSlots(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!label) { alert('Label is required'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'timeSlots'), { label, start, end, isBreak });
      setLabel(''); setIsBreak(false);
      fetchSlots();
    } catch (err) { alert(err.message); }
    setSaving(false);
  }

  async function handleDel(id) {
    await deleteDoc(doc(db, 'timeSlots', id));
    fetchSlots();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit lg:col-span-1">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" /> Add Time Slot
        </h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Period Label</label>
            <input required type="text" placeholder="e.g. Period 1, Lunch Break" className="w-full px-3 py-2 border rounded-lg text-sm" value={label} onChange={e => setLabel(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Start</label>
              <input required type="time" className="w-full px-3 py-2 border rounded-lg text-sm" value={start} onChange={e => {
                setStart(e.target.value);
                if (e.target.value) {
                  const [h, m] = e.target.value.split(':').map(Number);
                  const tot = h * 60 + m + 90;
                  setEnd(`${String(Math.floor(tot/60)%24).padStart(2,'0')}:${String(tot%60).padStart(2,'0')}`);
                }
              }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">End</label>
              <input required type="time" className="w-full px-3 py-2 border rounded-lg text-sm" value={end} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isBreak} onChange={e => setIsBreak(e.target.checked)} />
            Mark as Break / Recess (won't appear in Timetable dropdown)
          </label>
          <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60">
            {saving ? 'Adding...' : 'Add Slot'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Defined Time Slots</h3>
        <p className="text-xs text-gray-400 mb-4">Listed in chronological order. Break slots are shown with a different colour.</p>
        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
          slots.length === 0
            ? <p className="text-gray-400 text-sm text-center py-8">No time slots defined yet.</p>
            : <div className="space-y-2">
                {slots.map((s, i) => (
                  <div key={s.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border group ${
                    s.isBreak ? 'bg-orange-50 border-orange-100' : 'bg-indigo-50 border-indigo-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold w-5 text-center ${
                        s.isBreak ? 'text-orange-400' : 'text-indigo-400'
                      }`}>{i + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                        <p className="text-xs text-gray-500">{s.start} – {s.end}</p>
                      </div>
                      {s.isBreak && <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Break</span>}
                    </div>
                    <button onClick={() => handleDel(s.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
        )}
      </div>
    </div>
  );
}

// ─── Timetable Manager ────────────────────────────────────────────────────────
function TimetableManager() {
  const [ttItems, setTtItems] = useState([]);
  const [courses, setCourses]   = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Inline slot form state
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotLabel, setSlotLabel] = useState('');
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd,   setSlotEnd]   = useState('10:30');
  const [slotIsBreak, setSlotIsBreak] = useState(false);
  const [slotSaving, setSlotSaving]   = useState(false);

  // Schedule form state
  const [day, setDay] = useState('Monday');
  const [specificDate, setSpecificDate] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [secLink, setSecLink] = useState('');
  const [teacher, setTeacher] = useState('');
  const [eventType, setEventType] = useState('class');
  const [specialLabel, setSpecialLabel] = useState('');
  const [specialStart, setSpecialStart] = useState('09:00');
  const [specialEnd,   setSpecialEnd]   = useState('10:00');

  async function loadData() {
    setLoading(true);
    const [ttSn, cSn, slotSn] = await Promise.all([
      getDocs(collection(db, 'timetable')),
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'timeSlots')),
    ]);
    setTtItems(ttSn.docs.map(d => ({ id: d.id, ...d.data() })));
    const cList = cSn.docs.map(d => ({ id: d.id, ...d.data() }));
    setCourses(cList);
    if (cList.length > 0) { setSelectedCourse(cList[0]); setTeacher(cList[0].faculties?.[0] || ''); }
    const allSlots = slotSn.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.start.localeCompare(b.start));
    setTimeSlots(allSlots);
    const first = allSlots.find(s => !s.isBreak);
    if (first) setSelectedSlotId(first.id);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function handleCourseChange(courseId) {
    const c = courses.find(x => x.id === courseId);
    setSelectedCourse(c || null);
    setTeacher(c?.faculties?.[0] || '');
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      if (!selectedCourse && eventType === 'class') { alert('Please select a course.'); return; }
      if (eventType === 'class' && !selectedSlotId) { alert('Please select a time slot.'); return; }
      if (eventType === 'special' && !specialLabel) { alert('Please enter an event label.'); return; }

      const slot = timeSlots.find(s => s.id === selectedSlotId);
      const subject = eventType === 'special' ? specialLabel : selectedCourse.name;
      await addDoc(collection(db, 'timetable'), {
        dayOfWeek: specificDate ? '' : day,
        date: specificDate,
        subject,
        courseCode: selectedCourse?.code || '',
        courseLink: selectedCourse?.code || '',
        sectionLink: secLink,
        timeStart: eventType === 'special' ? specialStart : (slot?.start || ''),
        timeEnd:   eventType === 'special' ? specialEnd   : (slot?.end   || ''),
        slotLabel: eventType === 'special' ? '' : (slot?.label || ''),
        teacher,
        eventType,
      });
      setSpecialLabel(''); setSpecificDate('');
      loadData();
    } catch (err) {
      alert('Failed to append schedule: ' + err.message);
    }
  };


  const handleDel = async (id) => {
    try {
      await deleteDoc(doc(db, 'timetable', id));
      loadData();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  // Inline slot save
  async function handleAddSlot(e) {
    e.preventDefault();
    if (!slotLabel) return;
    setSlotSaving(true);
    try {
      await addDoc(collection(db, 'timeSlots'), { label: slotLabel, start: slotStart, end: slotEnd, isBreak: slotIsBreak });
      setSlotLabel(''); setSlotIsBreak(false);
      setShowSlotForm(false);
      loadData();
    } catch (err) { alert(err.message); }
    setSlotSaving(false);
  }

  async function handleDeleteSlot(id) {
    await deleteDoc(doc(db, 'timeSlots', id));
    loadData();
  }

  const facultyOptions = selectedCourse?.faculties || [];
  const allSlotsSorted = [...timeSlots].sort((a,b) => a.start.localeCompare(b.start));

  return (
    <div className="space-y-8">
      {/* Top: Append Schedule & Time Slot Manager (Stacked on mobile, side-by-side on desktop but constrained) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left/Top: Append Schedule form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500" /> Append Schedule</h3>
          
          {courses.length === 0 && !loading && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              No courses found — add them in <strong>Course Manager</strong> first.
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-3">
            {/* Same form content as before */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Entry Type</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" value="class" checked={eventType === 'class'} onChange={() => setEventType('class')} /> Regular Class
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" value="special" checked={eventType === 'special'} onChange={() => setEventType('special')} /> Special Event
                </label>
              </div>
            </div>
            {eventType === 'special' && (
              <input required type="text" placeholder="Event label (e.g. Exam, Workshop)" className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-amber-50" value={specialLabel} onChange={e => setSpecialLabel(e.target.value)} />
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Recurring Day</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm" value={day} onChange={e => setDay(e.target.value)}>
                  {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Specific Date</label>
                <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" value={specificDate} onChange={e => setSpecificDate(e.target.value)} />
              </div>
            </div>

            <select required className="w-full px-3 py-2 border rounded-lg text-sm" value={selectedCourse?.id || ''} onChange={e => handleCourseChange(e.target.value)}>
              <option value="" disabled>Select course...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>

            <input type="text" placeholder="Section (e.g. A)" className="w-full px-3 py-2 border rounded-lg text-sm" value={secLink} onChange={e => setSecLink(e.target.value)} />

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Faculty</label>
              {facultyOptions.length > 0 ? (
                <select required className="w-full px-3 py-2 border rounded-lg text-sm" value={teacher} onChange={e => setTeacher(e.target.value)}>
                  {facultyOptions.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="Faculty name" className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" value={teacher} onChange={e => setTeacher(e.target.value)} />
              )}
            </div>

            {eventType === 'class' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Period / Time Slot</label>
                {allSlotsSorted.filter(s => !s.isBreak).length > 0 ? (
                  <select required className="w-full px-3 py-2 border rounded-lg text-sm" value={selectedSlotId} onChange={e => setSelectedSlotId(e.target.value)}>
                    {allSlotsSorted.filter(s => !s.isBreak).map(s => (
                      <option key={s.id} value={s.id}>{s.label} ({s.start} – {s.end})</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">No periods defined — add one below ↓</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Start Time</label>
                  <input required type="time" className="w-full px-3 py-2 border rounded-lg text-sm" value={specialStart} onChange={e => {
                    setSpecialStart(e.target.value);
                    if (e.target.value) {
                      const [h, m] = e.target.value.split(':').map(Number);
                      const tot = h*60 + m + 60;
                      setSpecialEnd(`${String(Math.floor(tot/60)%24).padStart(2,'0')}:${String(tot%60).padStart(2,'0')}`);
                    }
                  }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">End Time</label>
                  <input required type="time" className="w-full px-3 py-2 border rounded-lg text-sm" value={specialEnd} onChange={e => setSpecialEnd(e.target.value)} />
                </div>
              </div>
            )}

            <button type="submit" className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700">Add to Timetable</button>
          </form>
        </div>

        {/* Right/Bottom: Inline Slot Manager */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-500" /> Define Time Slots</h3>
          <div className="space-y-4">
            <button onClick={() => setShowSlotForm(f => !f)} className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-indigo-600 transition py-1">
              <span>⏰ Manage Time Slots / Periods</span>
              <span>{showSlotForm ? '▲ Hide' : '▼ Show'}</span>
            </button>

            {showSlotForm && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                {allSlotsSorted.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {allSlotsSorted.map((s, i) => (
                      <div key={s.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs group ${s.isBreak ? 'bg-orange-50' : 'bg-indigo-50'}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-400">{i+1}.</span>
                          <span className="font-semibold text-gray-700">{s.label}</span>
                          <span className="text-gray-400">{s.start}–{s.end}</span>
                          {s.isBreak && <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[9px] font-bold">Break</span>}
                        </div>
                        <button onClick={() => handleDeleteSlot(s.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleAddSlot} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                  <input required type="text" placeholder="Slot label (e.g. Period 1)" className="w-full px-2.5 py-1.5 border rounded-lg text-xs" value={slotLabel} onChange={e => setSlotLabel(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <input required type="time" className="w-full px-2.5 py-1.5 border rounded-lg text-xs" value={slotStart} onChange={e => {
                      setSlotStart(e.target.value);
                      if (e.target.value) {
                        const [h, m] = e.target.value.split(':').map(Number);
                        const tot = h*60 + m + 90;
                        setSlotEnd(`${String(Math.floor(tot/60)%24).padStart(2,'0')}:${String(tot%60).padStart(2,'0')}`);
                      }
                    }} />
                    <input required type="time" className="w-full px-2.5 py-1.5 border rounded-lg text-xs" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer text-gray-600">
                    <input type="checkbox" checked={slotIsBreak} onChange={e => setSlotIsBreak(e.target.checked)} /> Break slot
                  </label>
                  <button type="submit" disabled={slotSaving} className="w-full py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700">{slotSaving ? 'Saving...' : '+ Add Slot'}</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Width Timetable View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">College Timetable (Full View)</h3>
        {/* smart scroll: active on mobile, visible on desktop */}
        <div className="max-md:overflow-x-auto overflow-x-visible">
          {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 py-12"/> : <TimetableGrid items={ttItems} onDelete={handleDel} definedSlots={timeSlots} />}
        </div>
      </div>
    </div>
  );
}


function TimetableGrid({ items, onDelete, definedSlots = [] }) {
  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  // Helper to convert HH:MM to minutes from midnight
  const toMin = (s) => {
    if(!s) return 0;
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };

  // Helper to check for overlap
  const isOverlapping = (start1, end1, start2, end2) => {
    return toMin(start1) < toMin(end2) && toMin(end1) > toMin(start2);
  };

  // Normalise: resolve dayOfWeek for date-specific entries
  const normalised = items.map(t => {
    if (t.date) {
      const [y, m, d] = t.date.split('-').map(Number);
      const dayIdx = new Date(y, m - 1, d, 12).getDay();
      return { ...t, resolvedDay: DAY_NAMES[dayIdx] };
    }
    return { ...t, resolvedDay: t.dayOfWeek };
  });

  // Use admin-defined slots (sorted) as the column set.
  const headerSlots = [...definedSlots].sort((a, b) => a.start.localeCompare(b.start));

  if (headerSlots.length === 0 && !items.length) {
    return <p className="text-gray-400 text-sm text-center py-8">No schedule entries or time slots defined yet.</p>;
  }

  // Build unified lookup: resolvedDay -> slotId -> [entries]
  const lookup = {};
  for (const t of normalised) {
    const key = t.resolvedDay;
    if (!lookup[key]) lookup[key] = {};
    
    // For every header slot, check if this item belongs in it
    headerSlots.forEach(slot => {
      // Logic: Item matches if it's explicitly assigned to this slot or overlaps by time range
      const matchesSlot = (t.slotLabel === slot.label && t.eventType === 'class') || 
                          isOverlapping(t.timeStart, t.timeEnd, slot.start, slot.end);
      
      if (matchesSlot) {
        if (!lookup[key][slot.id]) lookup[key][slot.id] = [];
        lookup[key][slot.id].push(t);
      }
    });
  }

  const activeDays = DAYS.filter(d => normalised.some(t => t.resolvedDay === d));

  function EntryCard({ e }) {
    return (
      <div className={`rounded-lg p-2.5 flex items-start justify-between gap-1 group border shadow-sm transition-all hover:shadow-md ${
        e.eventType === 'special' ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-100'
        : e.date ? 'bg-teal-50 border-teal-100'
        : 'bg-indigo-50 border-indigo-100'
      }`}>
        <div className="min-w-0">
          <div className="flex gap-1 items-center mb-1">
            {e.date && <span className="text-[9px] font-bold text-teal-600 bg-teal-100 px-1 rounded truncate max-w-[60px]">{e.date}</span>}
            {e.eventType === 'special' && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1 rounded">
                {e.timeStart}–{e.timeEnd}
              </span>
            )}
            {e.eventType !== 'special' && !e.date && (
                <span className="text-[9px] font-bold text-indigo-400">Regular</span>
            )}
          </div>
          <p className="text-xs font-bold text-gray-800 truncate leading-tight mb-0.5">{e.subject}</p>
          {e.courseLink && <p className="text-[10px] text-indigo-500 font-medium truncate">{e.courseLink}{e.sectionLink ? `:${e.sectionLink}` : ''}</p>}
          <p className="text-[10px] text-gray-400 truncate mt-0.5 italic">{e.teacher}</p>
        </div>
        <button onClick={() => onDelete(e.id)} className="shrink-0 p-1 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-full transition opacity-0 group-hover:opacity-100" title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-visible min-w-full">
      <table className="w-full border-separate" style={{ borderSpacing: '8px' }}>
        <thead>
          <tr>
            <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-widest px-4 py-3 bg-gray-50 rounded-xl min-w-[110px] sticky left-0 z-20 backdrop-blur-sm bg-gray-50/90">Day</th>
            {headerSlots.map(s => (
              <th key={s.id} className={`text-center p-3 rounded-xl whitespace-nowrap min-w-[160px] border shadow-sm ${
                s.isBreak
                  ? 'bg-orange-50/50 border-orange-100 opacity-60'
                  : 'bg-indigo-50/30 border-indigo-100'
              }`}>
                <div className="text-sm font-black text-indigo-900">{s.label}</div>
                <div className="font-bold text-[11px] text-indigo-400 uppercase">{s.start} – {s.end}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map(day => {
            const hasData = normalised.some(t => t.resolvedDay === day);
            if (!hasData && !normalised.length) return null;
            
            return (
              <tr key={day} className={hasData ? '' : 'opacity-40'}>
                <td className="align-top sticky left-0 z-20">
                  <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-100 rounded-xl px-4 py-4 h-full shadow-sm">
                    <p className="text-sm font-black text-gray-800">{day}</p>
                    {normalised
                      .filter(e => e.resolvedDay === day && e.date)
                      .map(e => e.date)
                      .filter((d, i, arr) => arr.indexOf(d) === i)
                      .sort()
                      .map(dateStr => (
                        <span key={dateStr} className="inline-block mt-2 text-[10px] font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
                          {dateStr}
                        </span>
                      ))
                    }
                  </div>
                </td>

                {headerSlots.map(s => {
                  if (s.isBreak) {
                    return (
                      <td key={s.id} className="align-middle">
                        <div className="min-h-[70px] rounded-xl bg-orange-50/30 border-2 border-dashed border-orange-100/50 flex flex-col items-center justify-center grayscale">
                          <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Off Period</span>
                        </div>
                      </td>
                    );
                  }
                  const entries = lookup[day]?.[s.id] || [];
                  return (
                    <td key={s.id} className="align-top">
                      {entries.length === 0 ? (
                        <div className="min-h-[70px] rounded-xl bg-gray-50/30 border border-dashed border-gray-100 transition-colors hover:bg-gray-50/50" />
                      ) : (
                        <div className="flex flex-col gap-2">
                          {entries.map(e => <EntryCard key={e.id} e={e} />)}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


