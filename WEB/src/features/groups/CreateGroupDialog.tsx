import { useState } from 'react';
import {
  Box, Dialog, DialogContent, TextField, Alert, Button,
  IconButton, InputAdornment,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CloseIcon from '@mui/icons-material/Close';
import GavelIcon from '@mui/icons-material/Gavel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateGroupMutation } from './groupsApi';
import type { CreateGroupRequest } from '../../types';

const createSchema = yup.object({
  name: yup.string().min(3).max(50).required('Name is required'),
  description: yup.string().max(200).default(''),
  maxMembers: yup.number().min(2).max(100).required().default(20),
  defaultBalance: yup.number().min(100).max(100000).required().default(10000),
  settlementMode: yup.string().oneOf(['Normal', 'WinnerKeepsLoserPays']).required().default('Normal'),
});

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (groupId: string) => void;
  onError?: (message: string) => void;
}

export function CreateGroupDialog({ open, onClose, onCreated, onError }: Props) {
  const [createGroup] = useCreateGroupMutation();
  const [error, setError] = useState('');

  const form = useForm<CreateGroupRequest>({
    resolver: yupResolver(createSchema),
    defaultValues: { name: '', description: '', maxMembers: 20, defaultBalance: 10000, settlementMode: 'Normal' },
  });

  const handleSubmit = async (formData: CreateGroupRequest) => {
    try {
      setError('');
      const result = await createGroup(formData).unwrap();
      form.reset();
      onCreated(result.id);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const msg = status === 403 ? 'You do not have permission to create groups.' : 'Failed to create group';
      setError(msg);
      onError?.(msg);
    }
  };

  const handleClose = () => {
    setError('');
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
      <Box component="form" onSubmit={form.handleSubmit(handleSubmit)}>
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-950 to-indigo-950 px-6 pt-6 pb-8">
          <IconButton onClick={handleClose} size="small"
            sx={{ position: 'absolute', top: 12, right: 12, color: 'white', opacity: 0.8, '&:hover': { opacity: 1 } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <GroupsIcon sx={{ color: 'white', fontSize: 22 }} />
            </div>
            <div>
              <h2 className="text-white text-lg font-bold">Create New Group</h2>
              <p className="text-blue-100 text-xs">Set up a new betting group for members</p>
            </div>
          </div>
        </div>

        <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          {/* Group Name */}
          <TextField {...form.register('name')} label="Group Name" fullWidth margin="normal"
            placeholder="e.g. World Cup Legends"
            error={!!form.formState.errors.name} helperText={form.formState.errors.name?.message}
            autoFocus
            InputProps={{ startAdornment: <InputAdornment position="start"><GroupsIcon fontSize="small" color="action" /></InputAdornment> }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

          {/* Description */}
          <TextField {...form.register('description')} label="Description (optional)" fullWidth margin="normal"
            placeholder="What's this group about?"
            multiline rows={2}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

          {/* Two columns: Max Members & Default Balance */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <TextField {...form.register('maxMembers')} label="Max Members" type="number" fullWidth
              error={!!form.formState.errors.maxMembers} helperText={form.formState.errors.maxMembers?.message}
              InputProps={{ startAdornment: <InputAdornment position="start"><PeopleAltIcon fontSize="small" color="action" /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <TextField {...form.register('defaultBalance')} label="Starting Balance" type="number" fullWidth
              error={!!form.formState.errors.defaultBalance} helperText={form.formState.errors.defaultBalance?.message}
              InputProps={{ startAdornment: <InputAdornment position="start"><AccountBalanceWalletIcon fontSize="small" color="action" /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          </div>

          {/* Settlement Mode - Card selector */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <GavelIcon sx={{ fontSize: 14 }} /> Settlement Mode
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${
                  form.watch('settlementMode') === 'Normal'
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input type="radio" value="Normal" {...form.register('settlementMode')} className="sr-only" />
                <div className="flex flex-col items-center text-center gap-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    form.watch('settlementMode') === 'Normal' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <AccountBalanceWalletIcon sx={{ fontSize: 18 }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Normal</span>
                  <span className="text-[10px] text-gray-400 leading-tight">Win = bet + profit<br/>Lose = lose bet</span>
                </div>
              </label>
              <label
                className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${
                  form.watch('settlementMode') === 'WinnerKeepsLoserPays'
                    ? 'border-amber-500 bg-amber-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input type="radio" value="WinnerKeepsLoserPays" {...form.register('settlementMode')} className="sr-only" />
                <div className="flex flex-col items-center text-center gap-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    form.watch('settlementMode') === 'WinnerKeepsLoserPays' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <EmojiEventsIcon sx={{ fontSize: 18 }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Winner Keeps</span>
                  <span className="text-[10px] text-gray-400 leading-tight">Win = +0, Lose = -bet<br/>Skip = auto lose</span>
                </div>
              </label>
            </div>
          </div>
        </DialogContent>

        {/* Footer */}
        <div className="px-6 pb-5 pt-2 flex justify-end gap-2">
          <Button onClick={handleClose}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained"
            sx={{
              borderRadius: 2, textTransform: 'none', px: 4,
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
              '&:hover': { boxShadow: '0 6px 20px rgba(37,99,235,0.4)' },
            }}
            startIcon={<AddIcon />}>
            Create Group
          </Button>
        </div>
      </Box>
    </Dialog>
  );
}
