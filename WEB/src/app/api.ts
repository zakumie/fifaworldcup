import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args, api, extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = (api.getState() as RootState).auth.refreshToken;
    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const { setCredentials } = await import('../features/auth/authSlice');
        api.dispatch(setCredentials(refreshResult.data as { accessToken: string; refreshToken: string; user: { id: string; email: string; displayName: string; avatarUrl: string | null } }));
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        const { logout } = await import('../features/auth/authSlice');
        api.dispatch(logout());
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Groups', 'Matches', 'Bets', 'Leaderboard', 'Users'],
  endpoints: () => ({}),
});
