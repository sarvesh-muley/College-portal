# 🎓 College Student Portal

A comprehensive, real-time student management and notification portal built with **React**, **Tailwind CSS**, and **Firebase**. This application features role-based access control for Admins, CRs, and Students to streamline campus coordination.

## ✨ Features
- **Dynamic Timetable**: A unified grid showing regular classes, special events, and academic notices with smart time-overlap logic.
- **Content Publisher**: CRs and Admins can blast notices and assignments to specific sections or the entire college.
- **Smart Event Gallery**: Interactive slideshow with portrait poster support and click-to-zoom full-screen details.
- **Profile Management**: Real-time synced profiles with avatar, mobile, and address editing.
- **Admin Control**: Bulk user creation via CSV, master course management, and full timetable override.

---

## 📖 Documentation
Detailed documentation is available in the [`/docs`](./docs) folder:

- **[Technical Architecture](./docs/technical_architecture.md)**: Tech stack, Firestore data models, and RBAC implementation.
- **[Admin User Guide](./docs/user_guide_admin.md)**: Management instructions for user onboarding and college scheduling.
- **[CR & Student Guide](./docs/user_guide_cr_student.md)**: How to navigate the dashboard, set profiles, and publish content.

---

## 🛠️ Setup & Local Development

### 1. Prerequisites
- Node.js (v20+ recommended)
- npm or yarn
- A Firebase Project

### 2. Environment Variables
Create a `.env` file in the root directory and add your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Installation
```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Deployment
The app is optimized for Firebase Hosting.
```bash
npm run build
firebase deploy
```

---

## 📜 License
This project is for educational use within the college ecosystem.
