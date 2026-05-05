import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { AuthGuard } from './components/guards/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';

const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const GroupListPage = lazy(() => import('./features/groups/GroupListPage').then(m => ({ default: m.GroupListPage })));
const GroupDetailPage = lazy(() => import('./features/groups/GroupDetailPage').then(m => ({ default: m.GroupDetailPage })));
const MatchListPage = lazy(() => import('./features/matches/MatchListPage').then(m => ({ default: m.MatchListPage })));
const BetHistoryPage = lazy(() => import('./features/betting/BetHistoryPage').then(m => ({ default: m.BetHistoryPage })));
const LeaderboardPage = lazy(() => import('./features/leaderboard/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));

const Loader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<AuthGuard />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Suspense fallback={<Loader />}><DashboardPage /></Suspense>} />
          <Route path="/groups" element={<Suspense fallback={<Loader />}><GroupListPage /></Suspense>} />
          <Route path="/groups/:id" element={<Suspense fallback={<Loader />}><GroupDetailPage /></Suspense>} />
          <Route path="/matches" element={<Suspense fallback={<Loader />}><MatchListPage /></Suspense>} />
          <Route path="/bets" element={<Suspense fallback={<Loader />}><BetHistoryPage /></Suspense>} />
          <Route path="/leaderboard" element={<Suspense fallback={<Loader />}><LeaderboardPage /></Suspense>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
