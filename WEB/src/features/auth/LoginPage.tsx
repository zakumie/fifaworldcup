import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Link, Divider } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ width: 400, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" textAlign="center" gutterBottom>
            ⚽ World Cup 2026
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
            Sign in to your prediction account
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              {...register('email')}
              label="Email"
              fullWidth
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
              autoFocus
            />
            <TextField
              {...register('password')}
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{ mt: 2, mb: 2 }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 2 }}>or</Divider>

          <Box display="flex" justifyContent="center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed')}
              size="large"
              width="100%"
              text="signin_with"
            />
          </Box>

          <Typography variant="body2" textAlign="center" mt={2}>
            Don't have an account?{' '}
            <Link component={RouterLink} to="/register">Sign up</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
