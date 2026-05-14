import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import {
  SportsSoccer as BallIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useLoginMutation, useGoogleLoginMutation } from './authApi';
import { setCredentials } from './authSlice';
import { useAppDispatch } from '../../app/hooks';
import type { LoginRequest } from '../../types';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [googleLogin] = useGoogleLoginMutation();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginRequest) => {
    try {
      setError('');
      const result = await login(data).unwrap();
      dispatch(setCredentials(result));
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password');
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return;
    try {
      setError('');
      const result = await googleLogin({ credential: response.credential }).unwrap();
      dispatch(setCredentials(result));
      navigate('/dashboard');
    } catch {
      setError('Google login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a0f] via-[#0f2618] to-[#0a1a0f] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-600/5 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-amber-500/3 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-900/40 mb-5">
            <BallIcon sx={{ fontSize: 40, color: 'white' }} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            WORLD CUP <span className="text-emerald-400">2026</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">Predict. Compete. Win.</p>
        </div>

        {/* Card */}
        <div className="bg-[#111b14]/80 backdrop-blur-xl border border-emerald-800/30 rounded-3xl p-8 shadow-2xl shadow-black/40">
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(220,38,38,0.1)', color: '#fca5a5', '& .MuiAlert-icon': { color: '#f87171' } }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email field */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <EmailIcon sx={{ fontSize: 18 }} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  autoFocus
                  placeholder="you@example.com"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-[#0a1a0f] border text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-emerald-800/30 focus:ring-emerald-500/30 focus:border-emerald-600/50'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <LockIcon sx={{ fontSize: 18 }} />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-[#0a1a0f] border text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-emerald-800/30 focus:ring-emerald-500/30 focus:border-emerald-600/50'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm hover:from-emerald-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/30"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LoginIcon sx={{ fontSize: 18 }} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-emerald-800/30" />
            <span className="text-xs font-medium text-slate-500 uppercase">or</span>
            <div className="flex-1 h-px bg-emerald-800/30" />
          </div>

          {/* Google login */}
          <Box display="flex" justifyContent="center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed')}
              size="large"
              width="100%"
              text="signin_with"
              theme="filled_black"
              shape="pill"
            />
          </Box>

          {/* Register link */}
          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{' '}
            <RouterLink to="/register" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
              Sign up
            </RouterLink>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          FIFA World Cup 2026™ Prediction Game
        </p>
      </div>
    </div>
  );
}
