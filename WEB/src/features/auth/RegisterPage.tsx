import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  SportsSoccer as BallIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  HowToReg as RegisterIcon,
} from '@mui/icons-material';
import { useRegisterMutation } from './authApi';
import { setCredentials } from './authSlice';
import { useAppDispatch } from '../../app/hooks';
import { getBrowserTimeZone } from '../../utils/timezone';
import type { RegisterRequest } from '../../types';

const schema = yup.object({
  displayName: yup.string().min(2, 'Min 2 characters').required('Display name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

interface RegisterForm extends RegisterRequest {
  confirmPassword: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: yupResolver(schema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('');
      const { confirmPassword: _confirmPassword, ...payload } = data;
      const result = await registerUser({ ...payload, timeZone: getBrowserTimeZone() }).unwrap();
      dispatch(setCredentials(result));
      navigate('/dashboard');
    } catch {
      setError('Registration failed. Email may already be in use.');
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-all ${
      hasError
        ? 'border-red-500/50 focus:ring-red-500/30'
        : 'border-slate-300 focus:ring-emerald-500/30 focus:border-emerald-500'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#173b2a] via-[#2e503b] to-[#173b2a] relative overflow-hidden">
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
          <p className="text-sm text-slate-400 mt-2">Create your prediction account</p>
        </div>

        {/* Card */}
        <div className="bg-white backdrop-blur-xl border border-slate-200 rounded-3xl p-8 shadow-2xl shadow-black/8">
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Display Name */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Display Name
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <PersonIcon sx={{ fontSize: 18 }} />
                </div>
                <input
                  {...register('displayName')}
                  type="text"
                  autoFocus
                  placeholder="Your name"
                  className={inputClass(!!errors.displayName)}
                />
              </div>
              {errors.displayName && (
                <p className="mt-1.5 text-xs text-red-400">{errors.displayName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <EmailIcon sx={{ fontSize: 18 }} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className={inputClass(!!errors.email)}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
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
                  className={inputClass(!!errors.password)}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <LockIcon sx={{ fontSize: 18 }} />
                </div>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  className={inputClass(!!errors.confirmPassword)}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm hover:from-emerald-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/30"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <RegisterIcon sx={{ fontSize: 18 }} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <RouterLink to="/login" className="text-emerald-600 font-semibold hover:text-emerald-500 transition-colors">
              Sign in
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
