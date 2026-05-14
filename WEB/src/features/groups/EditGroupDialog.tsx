import { useState, useEffect } from 'react';
import {
  Box, Dialog, DialogContent, TextField, Alert, Button,
  IconButton, InputAdornment,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CloseIcon from '@mui/icons-material/Close';
import GavelIcon from '@mui/icons-material/Gavel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EditIcon from '@mui/icons-material/Edit';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useUpdateGroupMutation } from './groupsApi';
import type { UpdateGroupRequest, GroupDto } from '../../types';

const editSchema = yup.object({
  name: yup.string().min(3).max(50).required('Name is required'),
  description: yup.string().max(200).default(''),
  maxMembers: yup.number().min(2).max(100).required(),
  defaultBalance: yup.number().min(100).max(100000).required(),
  settlementMode: yup.string().oneOf(['Normal', 'WinnerKeepsLoserPays']).required(),
  isActive: yup.boolean().required(),
});

interface Props {
  open: boolean;
  group: GroupDto | null;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function EditGroupDialog({ open, group, onClose, onSuccess, onError }: Props) {
  const [updateGroup] = useUpdateGroupMutation();
  const [error, setError] = useState('');

  const form = useForm<UpdateGroupRequest>({
    resolver: yupResolver(editSchema),
  });

  useEffect(() => {
    if (group && open) {
      form.reset({
        name: group.name,
        description: group.description || '',
        maxMembers: group.maxMembers,
        defaultBalance: group.defaultBalance,
        settlementMode: group.settlementMode,
        isActive: group.isActive,
      });
      setError('');
    }
  }, [group, open]);

  const handleSubmit = async (formData: UpdateGroupRequest) => {
    if (!group) return;
    try {
      setError('');
      await updateGroup({ id: group.id, body: formData }).unwrap();
      onSuccess?.('Group updated successfully!');
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const msg = status === 403 ? 'You do not have permission to edit this group.' : 'Failed to update group';
      setError(msg);
      onError?.(msg);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
      <Box component="form" onSubmit={form.handleSubmit(handleSubmit)}>
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-700 to-slate-900 px-6 pt-6 pb-8">
          <IconButton onClick={onClose} size="small"
            sx={{ position: 'absolute', top: 12, right: 12, color: 'white', opacity: 0.8, '&:hover': { opacity: 1 } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <EditIcon sx={{ color: 'white', fontSize: 22 }} />
            </div>
            <div>
              <h2 className="text-white text-lg font-bold">Edit Group</h2>
              <p className="text-slate-300 text-xs">{group?.name}</p>
            </div>
          </div>
        </div>

        <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          {/* Group Name */}
          <TextField {...form.register('name')} label="Group Name" fullWidth margin="normal"
            error={!!form.formState.errors.name} helperText={form.formState.errors.name?.message}
            autoFocus
            InputProps={{ startAdornment: <InputAdornment position="start"><GroupsIcon fontSize="small" color="action" /></InputAdornment> }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

          {/* Description */}
          <TextField {...form.register('description')} label="Description" fullWidth margin="normal"
            multiline rows={2}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

          {/* Two columns: Max Members & Default Balance */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <TextField {...form.register('maxMembers')} label="Max Members" type="number" fullWidth
              error={!!form.formState.errors.maxMembers} helperText={form.formState.errors.maxMembers?.message}
              InputProps={{ startAdornment: <InputAdornment position="start"><PeopleAltIcon fontSize="small" color="action" /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <TextField {...form.register('defaultBalance')} label="Default Balance" type="number" fullWidth
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

          {/* Deactivate Group */}
          <div className="mt-5 p-4 rounded-xl border-2 border-red-100 bg-red-50/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Group Status</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {form.watch('isActive') ? 'Group is active and accepting bets' : 'Group is deactivated'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...form.register('isActive')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </DialogContent>

        {/* Footer */}
        <div className="px-6 pb-5 pt-2 flex justify-end gap-2">
          <Button onClick={onClose}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained"
            sx={{
              borderRadius: 2, textTransform: 'none', px: 4,
              background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
              boxShadow: '0 4px 14px rgba(51,65,85,0.3)',
              '&:hover': { boxShadow: '0 6px 20px rgba(51,65,85,0.4)' },
            }}
            startIcon={<EditIcon />}>
            Save Changes
          </Button>
        </div>
      </Box>
    </Dialog>
  );
}
