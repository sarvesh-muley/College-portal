# Admin User Guide: College Portal

This guide provides administrators with the necessary instructions to manage users, courses, and the college timetable.

## 👤 User Management

### 📥 Bulk User Creation (CSV)
For ease of onboarding, use the CSV upload tool in the **User Management** tab.
- **CSV Format**: Must include headers: `Name`, `Email`, `Password`, `Role` (admin/cr/student), `Branch`, `Semester`.
- **Course Linking**: Use `Course1`, `Section1`, `Course2`, `Section2` as headers to automatically enroll users in specific classes.
- **Operation**: Select the file and Wait for the status message. The portal uses a secondary auth instance to create accounts without logging you out.

### ✏️ Manual Editing
- Click the pencil icon next to any user in the table to modify their Role, Branch, or Enrollment.
- This is the primary way to promote a student to **CR (Class Representative)** status.

---

## 📚 Course Management
Located in the **Course Manager** tab.
1. **Define Courses**: Assign unique course codes (e.g., CS101) and names.
2. **Assign Faculty**: Add multiple teacher names to a course for display in the timetable.
3. **Categorization**: Links courses to specific branches and semesters to help CRs filter their tools.

---

## 🗓️ Timetable Control
Manage the master schedule through the **Timetable Manager**.

### 1. Defining Time Slots
- Set up the grid structure (e.g., 09:00 - 10:30).
- **Recess/Break**: Mark slots as "Breaks" to visually fade them and exclude them from academic data entry.

### 2. Scheduling Classes
- Select a **Day of the Week** and a **Time Slot**.
- Choose the **Subject** and **Teacher**.
- Define the **Section** (e.g., A, B, C) to ensure students only see classes relevant to them.

### 3. Special Events & Overrides
- Use the **Special Event** form for one-off occurrences (e.g., Guest Lectures or Exams).
- These use specific **Start/End times** and will automatically map into the grid by calculating overlap with existing slots.

---

## 🔔 Notice Governance
Admins have "Global" scope powers.
- When publishing a notice, select **Global** to ensure every student in the college sees it in their dashboard.
- Admins can edit or delete *any* notice published by themselves or CRs from the management section.
