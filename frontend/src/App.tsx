import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell, PublicHeader } from './components/layout/AppShell';
import { GuestOnly, RequireAdmin, RequireAuth } from './components/layout/Guards';
import { PageSkeleton } from './components/ui';

// Sahifalar kod bo'yicha bo'linadi (lazy) — birinchi yuklanish tez
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const WorldMap = lazy(() => import('./pages/WorldMap'));
const CourseMap = lazy(() => import('./pages/CourseMap'));
const Lesson = lazy(() => import('./pages/Lesson'));
const Exam = lazy(() => import('./pages/Exam'));
const Practice = lazy(() => import('./pages/Practice'));
const Game = lazy(() => import('./pages/Game'));
const Battle = lazy(() => import('./pages/Battle'));
const Projects = lazy(() => import('./pages/Projects'));
const Project = lazy(() => import('./pages/Project'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Shop = lazy(() => import('./pages/Shop'));
const Certificates = lazy(() => import('./pages/Certificates'));
const Verify = lazy(() => import('./pages/Verify'));
const Mentor = lazy(() => import('./pages/Mentor'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/admin/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));

const auth = (el: ReactNode) => <RequireAuth>{el}</RequireAuth>;

function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="space-bg min-h-screen">
      <PublicHeader />
      <main id="main">{children}</main>
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl p-6"><PageSkeleton /></div>}>
      <Routes>
        <Route path="/" element={<PublicPage><Landing /></PublicPage>} />
        <Route path="/login" element={<PublicPage><GuestOnly><Login /></GuestOnly></PublicPage>} />
        <Route path="/register" element={<PublicPage><GuestOnly><Register /></GuestOnly></PublicPage>} />
        <Route path="/forgot-password" element={<PublicPage><ForgotPassword /></PublicPage>} />
        <Route path="/reset-password" element={<PublicPage><ResetPassword /></PublicPage>} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={auth(<Dashboard />)} />
          <Route path="/map" element={<WorldMap />} />
          <Route path="/course/:slug" element={<CourseMap />} />
          <Route path="/lesson/:id" element={<Lesson />} />
          <Route path="/exam/:moduleId" element={auth(<Exam />)} />
          <Route path="/practice" element={auth(<Practice />)} />
          <Route path="/game" element={auth(<Game />)} />
          <Route path="/battle" element={auth(<Battle />)} />
          <Route path="/projects" element={auth(<Projects />)} />
          <Route path="/project/:id" element={auth(<Project />)} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/shop" element={auth(<Shop />)} />
          <Route path="/certificates" element={auth(<Certificates />)} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/:code" element={<Verify />} />
          <Route path="/mentor" element={auth(<Mentor />)} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/settings" element={auth(<Settings />)} />
          <Route path="/admin/*" element={<RequireAdmin><Admin /></RequireAdmin>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
