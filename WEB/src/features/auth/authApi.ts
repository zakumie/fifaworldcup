import { apiSlice } from '../../app/api';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../../types';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),
    googleLogin: builder.mutation<AuthResponse, { credential: string }>({
      query: (data) => ({
        url: '/auth/google-login',
        method: 'POST',
        body: data,
      }),
    }),
    refreshToken: builder.mutation<AuthResponse, { refreshToken: string }>({
      query: (data) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation, useRegisterMutation, useGoogleLoginMutation, useRefreshTokenMutation,
} = authApi;
