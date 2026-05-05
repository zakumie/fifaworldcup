import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthGuard() {
  const token = useAppSelector((state) => state.auth.token);
  if (!token || isTokenExpired(token)) return <Navigate to="/login" replace />;
  return <Outlet />;
}
