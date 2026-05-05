import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserInfo } from '../../types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
}

const initialState: AuthState = {
  token: sessionStorage.getItem('token'),
  refreshToken: sessionStorage.getItem('refreshToken'),
  user: JSON.parse(sessionStorage.getItem('user') || 'null'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string; refreshToken: string; user: UserInfo }>) {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      sessionStorage.setItem('token', action.payload.accessToken);
      sessionStorage.setItem('refreshToken', action.payload.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('user');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
