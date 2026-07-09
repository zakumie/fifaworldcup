import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { setCredentials, logout } from '../../features/auth/authSlice';
import { apiSlice } from '../../app/api';
import { authApi } from '../../features/auth/authApi';

function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthGuard() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);

  const needsRefresh = !!token && isTokenExpired(token) && !!refreshToken && !refreshFailed;

  useEffect(() => {
    if (!needsRefresh || isRefreshing) return;

    setIsRefreshing(true);
    dispatch(authApi.endpoints.refreshToken.initiate({ refreshToken: refreshToken! }))
      .unwrap()
      .then((data) => {
        dispatch(setCredentials(data));
        setIsRefreshing(false);
      })
      .catch(() => {
        dispatch(logout());
        dispatch(apiSlice.util.resetApiState());
        setRefreshFailed(true);
        setIsRefreshing(false);
      });
  }, [needsRefresh, isRefreshing, refreshToken, dispatch]);

  if (!token) return <Navigate to="/login" replace />;
  if (refreshFailed) return <Navigate to="/login" replace />;
  if (isRefreshing) return null;
  if (isTokenExpired(token) && !refreshToken) return <Navigate to="/login" replace />;

  return <Outlet />;
}
