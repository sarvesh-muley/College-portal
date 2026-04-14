# Technical Architecture: College Portal

This document outlines the technical foundation, data structures, and architectural decisions of the College Portal.

## 🚀 Tech Stack
- **Frontend**: [React 19](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend / DB**: [Firebase](https://firebase.google.com/)
  - **Authentication**: Email/Password based Auth.
  - **Firestore**: NoSQL Real-time Database.

---

## 🏗️ Data Models (Firestore)

### 1. `users`
Stores user identity, roles, and personal info.
| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | string | Full name (Read-only for users). |
| `email` | string | Secondary auth email. |
| `role` | string | `admin`, `cr`, or `student`. |
| `branch` | string | Department (e.g., Computer Science). |
| `semester` | number | Current enrollment semester. |
| `mobile` | string | User-editable contact number. |
| `address` | string | User-editable residential address. |
| `avatarUrl` | string | Link to profile picture. |
| `enrollments` | array | List of `{ course, section }` objects. |

### 2. `events` (Notices)
Stores all campus notifications and events.
| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | string | Notice headline. |
| `description` | string | Full description. |
| `type` | string | `Academic Notice`, `Event Notice`, or `Custom`. |
| `scope` | string | `global`, `batch`, or `section`. |
| `date` | timestamp | Publication date. |
| `endDate` | timestamp | Expiry date for auto-cleanup. |
| `creatorName` | string | Name of the publisher (for attribution). |
| `imageUrl` | string | Optional banner for event posters. |

### 3. `courses`
The master list of courses managed by Admins.
| Field | Type | Description |
| :--- | :--- | :--- |
| `code` | string | e.g., CS101. |
| `name` | string | e.g., Data Structures. |
| `faculties` | array | Names of teachers assigned. |
| `branch/sem` | string/num | Course categorization. |

### 4. `timetable` & `timeSlots`
- **`timeSlots`**: Defines the grid (e.g., Period 1, Break).
- **`timetable`**: Maps entries to specific slots or custom times. Supports `courseCode`, `subject`, `teacher`, and `sectionLink`.

---

## 🔄 Real-time Sync System
The application uses a **"Push" architecture** for user data:
1. When a user logs in, the `AuthContext` establishes an `onSnapshot` listener on their specific document in the `users` collection.
2. Any external update (by an Admin) or internal update (via Profile Settings) triggers a real-time state update across the UI.
3. This eliminates the need for manual refreshes and ensures that role changes or profile picture updates are visible instantly in the Sidebar and Header.

---

## 🔒 Security & Access Control
- **Role-Based Access (RBAC)**: Managed via the `userRole` state derived from Firestore.
- **Route Protection**: Implemented via `ProtectedRoute.jsx` component which wraps private routes in `App.jsx`.
- **Publisher Permissions**: 
  - Admins can manage all global and specific notices.
  - CRs are permitted to post to their specific branch/semester or course sections.
