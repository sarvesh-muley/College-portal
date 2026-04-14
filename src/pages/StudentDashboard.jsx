import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, query, getDocs } from 'firebase/firestore';
import { BookOpen, Calendar as CalendarIcon, Bell, Clock, MapPin, Maximize2, Info, Eye } from 'lucide-react';

export default function StudentDashboard() {
  const { userData } = useAuth();
  const [timetable, setTimetable] = useState({ today: [], tomorrow: [], dayAfter: [] });
  const [assignments, setAssignments] = useState([]);
  const [events, setEvents] = useState({ academic: [], slideEvents: [] });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    if (events.slideEvents.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % events.slideEvents.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [events.slideEvents.length]);

  useEffect(() => {
    async function fetchData() {
      if (!userData) return;
      try {
        const { enrollments, branch, semester } = userData;
        const myCourses = enrollments ? enrollments.map(e => e.course) : [];
        const mySections = enrollments ? enrollments.map(e => `${e.course}:${e.section}`) : [];

        // Global Fetch (could be optimized with complex queries later if dataset grows)
        
        const isAdmin = userData?.role === 'admin';

        // --- 1. Fetch Events & Notices ---
        const snapshotEvents = await getDocs(collection(db, 'events'));
        const allEvents = snapshotEvents.docs.map(d => ({ id: d.id, ...d.data() }));
        const nowMs = new Date().getTime();
        
        const relevantEvents = allEvents.filter(e => {
          if (isAdmin) return true;
          if (e.scope === 'global' || e.type === 'college') return true;
          if (e.scope === 'batch' && e.branch === branch && e.semester === semester) return true;
          if (e.scope === 'section' && mySections.includes(`${e.courseLink}:${e.sectionLink}`)) return true;
          return false;
        }).sort((a,b) => {
           const timeA = a.date?.seconds || a.date || 0;
           const timeB = b.date?.seconds || b.date || 0;
           return timeB - timeA;
        }); // newest first
        
        const eventNoticesArr = [];
        const academicNoticesArr = [];

        for (const e of relevantEvents) {
            let isDead = false;
            if (e.endDate) {
                const endMs = e.endDate.seconds ? e.endDate.seconds * 1000 : new Date(e.endDate).getTime();
                if (nowMs > endMs + (24 * 60 * 60 * 1000)) isDead = true; 
            }
            if (!isDead) {
                if (e.type === 'Academic Notice') {
                    academicNoticesArr.push(e);
                } else {
                    eventNoticesArr.push(e);
                }
            }
        }

        setEvents({
           academic: academicNoticesArr,
           slideEvents: eventNoticesArr
        });

        // --- 2. Fetch Assignments ---
        const snapshotAssignments = await getDocs(collection(db, 'assignments'));
        const allAssgs = snapshotAssignments.docs.map(d => ({ id: d.id, ...d.data() }));
        const relevantAssgs = isAdmin ? allAssgs : allAssgs.filter(a => mySections.includes(`${a.courseLink}:${a.sectionLink}`));
        setAssignments(relevantAssgs);

        // --- 3. Fetch Timetable & group into 3 Days ---
        const snapshotTimetable = await getDocs(collection(db, 'timetable'));
        const allTt = snapshotTimetable.docs.map(d => ({ id: d.id, ...d.data() }));
        const myTt = isAdmin ? allTt : allTt.filter(t => mySections.includes(`${t.courseLink}:${t.sectionLink}`));

        const todayVal = new Date();
        const tmrwVal = new Date(); tmrwVal.setDate(tmrwVal.getDate()+1);
        const datVal = new Date(); datVal.setDate(datVal.getDate()+2);

        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        const dayNameToday = daysOfWeek[todayVal.getDay()];
        const dayNameTmrw = daysOfWeek[tmrwVal.getDay()];
        const dayNameDat = daysOfWeek[datVal.getDay()];

        const toIsoStr = (d) => {
            const offset = d.getTimezoneOffset();
            const ret = new Date(d.getTime() - (offset*60*1000));
            return ret.toISOString().split('T')[0];
        };

        const strToday = toIsoStr(todayVal);
        const strTmrw = toIsoStr(tmrwVal);
        const strDat = toIsoStr(datVal);

        const filterSort = (dayName, dateStr) => 
          myTt
            .filter(t => (t.date === dateStr || (!t.date && t.dayOfWeek === dayName)))
            .sort((a, b) => (a.timeStart || '').localeCompare(b.timeStart || ''));

        setTimetable({
          today: filterSort(dayNameToday, strToday),
          tomorrow: filterSort(dayNameTmrw, strTmrw),
          dayAfter: filterSort(dayNameDat, strDat),
          todayName: dayNameToday,
          tmrwName: dayNameTmrw,
          datName: dayNameDat,
        });

      } catch (err) {
        console.error('Error fetching student data', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userData]);

  if (loading) return <div className="text-center pt-10">Loading portal data...</div>;

  return (
    <div className="space-y-8">
      {/* 1. Event Notices Slideshow — Poster Layout */}
      {events.slideEvents.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
              <Bell className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Events &amp; Notices</h2>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl">
              {events.slideEvents.map((ev, i) => (
                <div key={ev.id} className={`transition-all duration-700 ${i === currentSlide ? 'block' : 'hidden'}`}>
                  <div className="flex flex-col md:flex-row bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden min-h-[500px] lg:min-h-[600px]">
                    {/* Poster image — portrait focused */}
                    {ev.imageUrl && (
                      <div 
                        className="w-full md:w-80 lg:w-[420px] shrink-0 bg-gray-50 flex items-center justify-center relative group cursor-zoom-in overflow-hidden" 
                        onClick={() => setSelectedNotice(ev)}
                      >
                        <img
                          src={ev.imageUrl}
                          alt={ev.title}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Maximize2 className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </div>
                      </div>
                    )}
                    {/* Event details */}
                    <div className="flex flex-col justify-between p-8 lg:p-10 flex-1 bg-gradient-to-br from-white to-gray-50">
                      <div>
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          <span className="inline-block bg-pink-100 text-pink-700 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">Event Notice</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ev.date?.seconds ? new Date(ev.date.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}</span>
                          {ev.creatorName && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                By {ev.creatorName}
                              </span>
                            </>
                          )}
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-5 leading-tight">{ev.title}</h2>
                        <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap line-clamp-[8] lg:line-clamp-[12]">{ev.description}</p>
                      </div>
                      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {ev.endDate && (
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-gray-400">Ends On</span>
                              <span className="text-sm font-bold text-gray-700">{ev.endDate.seconds ? new Date(ev.endDate.seconds * 1000).toLocaleDateString() : ''}</span>
                            </div>
                          )}
                          {ev.courseLink && (
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-gray-400">Location / Scope</span>
                              <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-pink-500"/> {ev.courseLink}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setSelectedNotice(ev)}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition shadow-lg shadow-gray-200"
                          >
                            <Info className="w-4 h-4" /> View Full Notice
                          </button>
                          {ev.linkUrl && (
                            <a href={ev.linkUrl} target="_blank" rel="noreferrer" className="p-3 bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-100 transition border border-pink-100 shadow-sm" title="External Link">
                              <Eye className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation arrows if multiple slides */}
            {events.slideEvents.length > 1 && (
              <div className="flex items-center justify-between mt-3">
                <button onClick={() => setCurrentSlide(p => (p - 1 + events.slideEvents.length) % events.slideEvents.length)} className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600 transition" type="button">&larr;</button>
                <div className="flex gap-1.5">
                  {events.slideEvents.map((_, i) => (
                    <button key={i} onClick={() => setCurrentSlide(i)} className={`h-2 rounded-full transition-all ${i === currentSlide ? 'bg-pink-500 w-4' : 'bg-gray-300 w-2 hover:bg-gray-400'}`} type="button" />
                  ))}
                </div>
                <button onClick={() => setCurrentSlide(p => (p + 1) % events.slideEvents.length)} className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600 transition" type="button">&rarr;</button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. Academic Notices (Timeline) */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Academic Notices</h2>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
          {events.academic.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent academic notices.</p>
          ) : (
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {events.academic.map((ev, idx) => (
                <div key={ev.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-400 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border border-gray-100 p-4 rounded-2xl shadow hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-2">
                       <div className="flex items-center gap-2 flex-wrap">
                         <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">Academic Notice</span>
                         {ev.creatorName && (
                           <span className="text-[10px] font-semibold text-gray-500">by {ev.creatorName}</span>
                         )}
                       </div>
                       <span className="text-xs text-gray-400">{ev.date?.seconds ? new Date(ev.date.seconds * 1000).toLocaleDateString() : 'Recent'}</span>
                    </div>
                    
                    <h3 className="font-bold text-gray-900 text-base mb-1">{ev.title}</h3>
                    <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{ev.description}</p>
                        
                    <div className="flex flex-wrap items-center gap-3">
                       {ev.linkUrl && (
                          <a href={ev.linkUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                            View Link &rarr;
                          </a>
                       )}
                       {ev.courseLink && (
                          <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                             <MapPin className="w-3 h-3"/> Scope: {ev.courseLink} (Sec {ev.sectionLink})
                          </p>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. 3-Day Timetable & Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Timetable spanning 2 cols */}
        <section className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Schedule</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Day 1 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Today</span>
                <p className="text-sm text-gray-500">{timetable.todayName}</p>
              </div>
              <div className="p-4 space-y-3 flex-1">
                {timetable.today.length === 0 ? <p className="text-xs text-center text-gray-400 py-4">No classes</p> : 
                  timetable.today.map(slot => <TimetableSlot key={slot.id} slot={slot} />)
                }
              </div>
            </div>

            {/* Day 2 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col opacity-90">
              <div className="p-4 bg-gray-50/50 border-b border-gray-100 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Tomorrow</span>
                <p className="text-sm text-gray-500">{timetable.tmrwName}</p>
              </div>
              <div className="p-4 space-y-3 flex-1">
                {timetable.tomorrow.length === 0 ? <p className="text-xs text-center text-gray-400 py-4">No classes</p> : 
                  timetable.tomorrow.map(slot => <TimetableSlot key={slot.id} slot={slot} />)
                }
              </div>
            </div>

            {/* Day 3 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col opacity-75">
              <div className="p-4 bg-gray-50/50 border-b border-gray-100 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Day After</span>
                <p className="text-sm text-gray-500">{timetable.datName}</p>
              </div>
              <div className="p-4 space-y-3 flex-1">
                {timetable.dayAfter.length === 0 ? <p className="text-xs text-center text-gray-400 py-4">No classes</p> : 
                  timetable.dayAfter.map(slot => <TimetableSlot key={slot.id} slot={slot} />)
                }
              </div>
            </div>
          </div>
        </section>

        {/* Assignments side bar */}
        <section className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            {assignments.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No pending assignments!</p>
            ) : (
              assignments.map(assg => (
                <div key={assg.id} className="p-4 rounded-xl bg-pink-50/40 border border-pink-100 hover:border-pink-200 transition">
                  <h3 className="font-semibold text-gray-900 leading-tight mb-2">{assg.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-white text-xs font-medium text-gray-600 border border-gray-200 rounded">
                      {assg.courseLink?.split('-')[0] || 'Unknown'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">{assg.description}</p>
                  
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-gray-500">From: {assg.startDate?.seconds ? new Date(assg.startDate.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                     <span className="font-medium px-2 py-1 bg-pink-100 text-pink-700 rounded ring-1 ring-pink-200 ring-inset">
                       Due: {assg.dueDate?.seconds ? new Date(assg.dueDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                     </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={() => setSelectedNotice(null)} />
          
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
            <button 
              onClick={() => setSelectedNotice(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full transition md:text-gray-400 md:hover:text-gray-600 md:bg-gray-100 md:hover:bg-gray-200"
            >
              <Maximize2 className="w-6 h-6 rotate-45" />
            </button>

            {/* Modal Image Area */}
            {selectedNotice.imageUrl && (
              <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center p-4 md:p-0">
                <img 
                  src={selectedNotice.imageUrl} 
                  alt={selectedNotice.title} 
                  className="max-h-[50vh] md:max-h-full w-full object-contain"
                />
              </div>
            )}

            {/* Modal Content Area */}
            <div className="flex-1 p-6 md:p-12 overflow-y-auto">
              <span className="inline-block bg-pink-100 text-pink-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6">
                Official Notice
              </span>
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6 leading-tight">
                {selectedNotice.title}
              </h2>
              <div className="prose prose-pink max-w-none">
                <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
                  {selectedNotice.description}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 border-t border-gray-100">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Author</span>
                  <span className="font-bold text-gray-700">
                    {selectedNotice.creatorName || 'Unknown'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Posted On</span>
                  <span className="font-bold text-gray-700">
                    {selectedNotice.date?.seconds ? new Date(selectedNotice.date.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Valid Until</span>
                  <span className="font-bold text-gray-700">
                    {selectedNotice.endDate?.seconds ? new Date(selectedNotice.endDate.seconds * 1000).toLocaleDateString() : 'Until further notice'}
                  </span>
                </div>
                {selectedNotice.courseLink && (
                  <div className="col-span-2 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Scope</span>
                    <span className="font-bold text-gray-700 flex items-center gap-2">
                       <MapPin className="w-4 h-4 text-pink-500" />
                       {selectedNotice.courseLink} (Section {selectedNotice.sectionLink || 'All'})
                    </span>
                  </div>
                )}
              </div>

              {selectedNotice.linkUrl && (
                <div className="mt-10">
                  <a 
                    href={selectedNotice.linkUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 transition shadow-lg shadow-pink-200"
                  >
                    View Official Link <Eye className="w-5 h-5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimetableSlot({ slot }) {
  return (
    <div className="p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:border-indigo-200 transition relative overflow-hidden group">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400" />
      <div className="flex items-start justify-between mb-1 pl-1">
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
          {slot.timeStart} - {slot.timeEnd}
        </span>
        <span className="text-[10px] text-gray-400 bg-gray-50 border px-1 rounded truncate max-w-[60px]">
          {slot.sectionLink}
        </span>
      </div>
      <h4 className="font-semibold text-sm text-gray-800 leading-tight pl-1 mb-1" title={slot.subject}>{slot.subject}</h4>
      <p className="text-xs text-gray-500 pl-1 flex items-center gap-1">
        <Clock className="w-3 h-3" /> {slot.teacher}
      </p>
    </div>
  )
}
