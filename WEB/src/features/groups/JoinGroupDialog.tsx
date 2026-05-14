import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Dialog, DialogContent, Alert, IconButton, CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LoginIcon from '@mui/icons-material/Login';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import GroupsIcon from '@mui/icons-material/Groups';
import { useJoinGroupMutation } from './groupsApi';
import type { JoinGroupRequest } from '../../types';

const joinSchema = yup.object({
  inviteCode: yup.string().required('Invite code is required'),
});

interface Props {
  open: boolean;
  onClose: () => void;
  onJoined?: () => void;
}

export function JoinGroupDialog({ open, onClose, onJoined }: Props) {
  const [joinGroup, { isLoading }] = useJoinGroupMutation();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<JoinGroupRequest>({
    resolver: yupResolver(joinSchema),
    defaultValues: { inviteCode: '' },
  });

  const handleClose = () => {
    setError('');
    reset();
    onClose();
  };

  const onSubmit = async (data: JoinGroupRequest) => {
    try {
      setError('');
      await joinGroup(data).unwrap();
      reset();
      onJoined?.();
      onClose();
    } catch {
      setError('Invalid invite code or group is full');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
    >
      {/* Header */}
      <div className="relative bg-gradient-to-br from-emerald-950 to-green-950 px-6 pt-6 pb-8">
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, color: 'white', opacity: 0.8, '&:hover': { opacity: 1 } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <GroupsIcon sx={{ color: 'white', fontSize: 22 }} />
          </div>
          <div>
            <h2 className="text-white text-lg font-bold">Join a Group</h2>
            <p className="text-emerald-200 text-xs">Enter an invite code to join</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <DialogContent sx={{ pt: 3, pb: 3, px: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <VpnKeyIcon sx={{ fontSize: 14 }} /> Invite Code
            </p>
            <div className="relative">
              <input
                {...register('inviteCode')}
                type="text"
                autoFocus
                placeholder="Enter invite code..."
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-gray-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all ${
                  errors.inviteCode ? 'border-red-300' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.inviteCode && (
              <p className="text-xs text-red-500 mt-1">{errors.inviteCode.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <CircularProgress size={18} sx={{ color: 'white' }} />
            ) : (
              <LoginIcon sx={{ fontSize: 18 }} />
            )}
            {isLoading ? 'Joining...' : 'Join Group'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
