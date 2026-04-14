import { auth, db, secondaryAuth } from './config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, getDocs } from 'firebase/firestore';

export async function seedDatabase() {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    if (!usersSnapshot.empty) {
      console.log('Database already seeded!');
      return { success: true, message: 'Database already seeded' };
    }

    // Use secondaryAuth so the primary session isn't overriden immediately
    // Wait, the person clicking Seed is probably not logged in. Using auth is fine, but we'll use auth and just sign out at the end, OR just use secondaryAuth entirely for these to leave the primary auth completely clean.
    
    // 1. Create Admin User
    const adminCreds = await createUserWithEmailAndPassword(secondaryAuth, 'admin@college.edu', 'password123');
    await setDoc(doc(db, 'users', adminCreds.user.uid), {
      name: 'Super Admin',
      email: 'admin@college.edu',
      role: 'admin',
      branch: 'All',
      semester: 0,
      enrollments: []
    });

    // 2. Create sample CR User
    const crCreds = await createUserWithEmailAndPassword(secondaryAuth, 'cr@college.edu', 'password123');
    await setDoc(doc(db, 'users', crCreds.user.uid), {
      name: 'John Doe (CR)',
      email: 'cr@college.edu',
      role: 'cr',
      branch: 'Computer Science',
      semester: 6,
      enrollments: [
        { course: 'CS301-Machine Learning', section: 'A' },
        { course: 'CS302-Cloud Computing', section: 'A' }
      ]
    });

    // 3. Create sample Student User
    const studentCreds = await createUserWithEmailAndPassword(secondaryAuth, 'student@college.edu', 'password123');
    await setDoc(doc(db, 'users', studentCreds.user.uid), {
      name: 'Alice Smith',
      email: 'student@college.edu',
      role: 'student',
      branch: 'Computer Science',
      semester: 6,
      enrollments: [
        { course: 'CS301-Machine Learning', section: 'A' },
        { course: 'CS302-Cloud Computing', section: 'A' }
      ]
    });

    // 4. Sample Timetable
    const timetableData = [
      { dayOfWeek: 'Monday', subject: 'Cloud Computing', courseLink: 'CS302-Cloud Computing', sectionLink: 'A', timeStart: '09:00', timeEnd: '10:30', teacher: 'Prof. Anderson' },
      { dayOfWeek: 'Monday', subject: 'Machine Learning', courseLink: 'CS301-Machine Learning', sectionLink: 'A', timeStart: '10:45', timeEnd: '12:15', teacher: 'Dr. Roberts' },
      { dayOfWeek: 'Tuesday', subject: 'Cloud Computing Lab', courseLink: 'CS302-Cloud Computing', sectionLink: 'A', timeStart: '13:00', timeEnd: '15:00', teacher: 'Prof. Anderson' },
      { dayOfWeek: 'Wednesday', subject: 'Machine Learning Lab', courseLink: 'CS301-Machine Learning', sectionLink: 'A', timeStart: '09:00', timeEnd: '11:00', teacher: 'Dr. Roberts' },
    ];
    for (const entry of timetableData) {
      await addDoc(collection(db, 'timetable'), entry);
    }

    // 5. Sample Assignments
    const startDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);
    await addDoc(collection(db, 'assignments'), {
      title: 'ML Project Phase 1',
      description: 'Submit the dataset analysis report along with initial preprocessing scripts.',
      startDate: startDate,
      dueDate: dueDate,
      courseLink: 'CS301-Machine Learning',
      sectionLink: 'A',
      createdBy: crCreds.user.uid
    });

    // 6. Sample Events Notice
    await addDoc(collection(db, 'events'), {
      title: 'Annual Tech Symposium',
      description: 'Join us for our yearly showcase of engineering projects and guest tech talks.',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
      date: new Date(),
      type: 'college',
      scope: 'global',
      createdBy: adminCreds.user.uid
    });

    await addDoc(collection(db, 'events'), {
      title: 'Extra lab session',
      description: 'The CS Lab will be open late this Friday for project work.',
      imageUrl: '',
      date: new Date(),
      type: 'notice',
      scope: 'section',
      courseLink: 'CS301-Machine Learning',
      sectionLink: 'A',
      createdBy: crCreds.user.uid
    });

    // sign out secondary auth to clean up
    await secondaryAuth.signOut();

    return { success: true, message: 'Seeded successfully! Test with admin@college.edu / password123' };
  } catch (error) {
    console.error('Error seeding DB:', error);
    return { success: false, message: error.message };
  }
}
