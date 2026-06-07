import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import i18n from '../../i18n';
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

// Sync i18n language on app load if user is already logged in
if (initialState.user?.language) {
  i18n.changeLanguage(initialState.user.language);
  localStorage.setItem('language', initialState.user.language);
}

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
      // Sync language preference
      if (action.payload.user.language) {
        i18n.changeLanguage(action.payload.user.language);
        localStorage.setItem('language', action.payload.user.language);
      }
    },
    updateUser(state, action: PayloadAction<Partial<UserInfo>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        sessionStorage.setItem('user', JSON.stringify(state.user));
        if (action.payload.language) {
          i18n.changeLanguage(action.payload.language);
          localStorage.setItem('language', action.payload.language);
        }
      }
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

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
