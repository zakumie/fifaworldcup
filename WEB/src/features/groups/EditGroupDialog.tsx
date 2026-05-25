import { useState, useEffect } from 'react';
import {
  Box, Dialog, DialogContent, TextField, Alert, Button,
  IconButton, InputAdornment, ThemeProvider,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CloseIcon from '@mui/icons-material/Close';
import GavelIcon from '@mui/icons-material/Gavel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EditIcon from '@mui/icons-material/Edit';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useUpdateGroupMutation } from './groupsApi';
import {
  useGetChampionConfigQuery,
  useCreateChampionConfigMutation,
  useUpdateChampionConfigMutation,
  useSettleChampionPredictionsMutation,
} from '../predictions/championApi';
import { useGetTeamsQuery } from '../matches/matchesApi';
import type { UpdateGroupRequest, GroupDto, TeamDto } from '../../types';
import { getTheme } from '../../app/theme';
import { toLocalDatetimeInput } from '../../utils/timezone';
import { inputSx } from '../../utils/formStyles';

const lightTheme = getTheme('light');

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

  // Champion prediction state
  const { data: championConfig } = useGetChampionConfigQuery(
    { groupId: group?.id ?? '' },
    { skip: !group?.id || !open }
  );
  const { data: teams } = useGetTeamsQuery(undefined, { skip: !open });
  const [createChampionConfig] = useCreateChampionConfigMutation();
  const [updateChampionConfig] = useUpdateChampionConfigMutation();
  const [settleChampion, { isLoading: isSettling }] = useSettleChampionPredictionsMutation();

  const [championEnabled, setChampionEnabled] = useState(false);
  const [championOpenTime, setChampionOpenTime] = useState('');
  const [championCloseTime, setChampionCloseTime] = useState('');
  const [settleWinnerTeamId, setSettleWinnerTeamId] = useState('');

  const form = useForm<UpdateGroupRequest>({
    resolver: yupResolver(editSchema),
  });

  const settlementMode = useWatch({ control: form.control, name: 'settlementMode' });
  const isActive = useWatch({ control: form.control, name: 'isActive' });

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

  useEffect(() => {
    if (championConfig) {
      setChampionEnabled(championConfig.isEnabled);
      setChampionOpenTime(championConfig.predictionOpenTime ? toLocalDatetimeInput(championConfig.predictionOpenTime) : '');
      setChampionCloseTime(championConfig.predictionCloseTime ? toLocalDatetimeInput(championConfig.predictionCloseTime) : '');
    } else {
      setChampionEnabled(false);
      setChampionOpenTime('');
      setChampionCloseTime('');
    }
    setSettleWinnerTeamId('');
  }, [championConfig, open]);

  const handleSubmit = async (formData: UpdateGroupRequest) => {
    if (!group) return;
    try {
      setError('');
      await updateGroup({ id: group.id, body: formData }).unwrap();

      // Save champion config
      if (championEnabled && championOpenTime && championCloseTime) {
        const configBody = {
          isEnabled: true,
          predictionOpenTime: new Date(championOpenTime).toISOString(),
          predictionCloseTime: new Date(championCloseTime).toISOString(),
        };
        if (championConfig) {
          await updateChampionConfig({ groupId: group.id, body: configBody }).unwrap();
        } else {
          await createChampionConfig({ groupId: group.id, ...configBody }).unwrap();
        }
      } else if (championConfig && !championEnabled) {
        await updateChampionConfig({
          groupId: group.id,
          body: {
            isEnabled: false,
            predictionOpenTime: championConfig.predictionOpenTime,
            predictionCloseTime: championConfig.predictionCloseTime,
          },
        }).unwrap();
      }

      onSuccess?.('Group updated successfully!');
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const msg = status === 403 ? 'You do not have permission to edit this group.' : 'Failed to update group';
      setError(msg);
      onError?.(msg);
    }
  };

  const handleSettle = async () => {
    if (!group || !settleWinnerTeamId) return;
    try {
      await settleChampion({
        groupId: group.id,
        body: { groupId: group.id, winnerTeamId: settleWinnerTeamId },
      }).unwrap();
      onSuccess?.('Champion predictions settled!');
    } catch {
      setError('Failed to settle champion predictions');
    }
  };

  return (
    <ThemeProvider theme={lightTheme}>
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' } }}>
      <Box component="form" onSubmit={form.handleSubmit(handleSubmit)} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div className="relative bg-gradient-to-b from-sky-700 to-blue-900 px-6 pt-6 pb-8 shrink-0">
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

        <DialogContent sx={{ pt: 3, pb: 2, px: 3, overflowY: 'auto', flex: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          {/* Group Name */}
          <TextField {...form.register('name')} label="Group Name" fullWidth size="small"
            error={!!form.formState.errors.name} helperText={form.formState.errors.name?.message}
            autoFocus
            InputProps={{ startAdornment: <InputAdornment position="start"><GroupsIcon sx={{ fontSize: 18, color: '#64748b' }} /></InputAdornment> }}
            sx={[inputSx, { mt: 2 }]} />

          {/* Description */}
          <TextField {...form.register('description')} label="Description" fullWidth size="small"
            multiline rows={2}
            sx={[inputSx, { mt: 2 }]} />

          {/* Two columns: Max Members & Default Balance */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <TextField {...form.register('maxMembers')} label="Max Members" type="number" fullWidth size="small"
              error={!!form.formState.errors.maxMembers} helperText={form.formState.errors.maxMembers?.message}
              InputProps={{ startAdornment: <InputAdornment position="start"><PeopleAltIcon sx={{ fontSize: 18, color: '#64748b' }} /></InputAdornment> }}
              sx={inputSx} />
            <TextField {...form.register('defaultBalance')} label="Default Balance" type="number" fullWidth size="small"
              error={!!form.formState.errors.defaultBalance} helperText={form.formState.errors.defaultBalance?.message}
              InputProps={{ startAdornment: <InputAdornment position="start"><AccountBalanceWalletIcon sx={{ fontSize: 18, color: '#64748b' }} /></InputAdornment> }}
              sx={inputSx} />
          </div>

          {/* Settlement Mode - Card selector */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <GavelIcon sx={{ fontSize: 14 }} /> Settlement Mode
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${
                  settlementMode === 'Normal'
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input type="radio" value="Normal" {...form.register('settlementMode')} className="sr-only" />
                <div className="flex flex-col items-center text-center gap-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    settlementMode === 'Normal' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <AccountBalanceWalletIcon sx={{ fontSize: 18 }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Normal</span>
                  <span className="text-[10px] text-gray-400 leading-tight">Win = bet + profit<br/>Lose = lose bet</span>
                </div>
              </label>
              <label
                className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${
                  settlementMode === 'WinnerKeepsLoserPays'
                    ? 'border-amber-500 bg-amber-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input type="radio" value="WinnerKeepsLoserPays" {...form.register('settlementMode')} className="sr-only" />
                <div className="flex flex-col items-center text-center gap-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    settlementMode === 'WinnerKeepsLoserPays' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <EmojiEventsIcon sx={{ fontSize: 18 }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Winner Keeps</span>
                  <span className="text-[10px] text-gray-400 leading-tight">Win = +0, Lose = -bet<br/>Skip = auto lose</span>
                </div>
              </label>
            </div>
          </div>

          {/* Champion Prediction */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <MilitaryTechIcon sx={{ fontSize: 14 }} /> Champion Prediction
            </p>

            {championConfig?.isSettled ? (
              <Alert icon={<CheckCircleIcon />} severity="success" sx={{ borderRadius: 3 }}>
                Settled — Winner: <strong>{championConfig.winnerTeamName}</strong>
              </Alert>
            ) : (
              <>
                <div
                  onClick={() => setChampionEnabled(!championEnabled)}
                  className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${
                    championEnabled ? 'border-amber-400 bg-amber-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        championEnabled ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <EmojiEventsIcon sx={{ fontSize: 18 }} />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-700">Enable Champion Prediction</span>
                        <p className="text-[10px] text-gray-400">Members predict the World Cup winner</p>
                      </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-colors ${championEnabled ? 'bg-amber-500' : 'bg-gray-300'} relative`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${championEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                </div>

                

                {/* Settle section - only if config exists and not settled */}
                    {championEnabled && (
                  <div className="mt-3 p-3 rounded-xl border-2 border-amber-400 bg-amber-50/50">
                        {championEnabled && (
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <TextField
                              label="Open Time"
                              type="datetime-local"
                              value={championOpenTime}
                              onChange={(e) => setChampionOpenTime(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              size="small"
                              sx={inputSx}
                            />
                            <TextField
                              label="Close Time"
                              type="datetime-local"
                              value={championCloseTime}
                              onChange={(e) => setChampionCloseTime(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              size="small"
                              sx={inputSx}
                            />
                          </div>
                        )}
                        { championConfig && !championConfig.isSettled && (
                        <div className="flex gap-2 mt-3">
                          <TextField
                            select
                            size="small"
                            value={settleWinnerTeamId}
                            onChange={(e) => setSettleWinnerTeamId(e.target.value)}
                            sx={[inputSx, { flex: 1 }]}
                            SelectProps={{ native: true }}
                          >
                            <option value="">Select winner team...</option>
                            {teams?.map((t: TeamDto) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </TextField>
                          <Button
                            variant="contained"
                            size="small"
                            disabled={!settleWinnerTeamId || isSettling}
                            onClick={handleSettle}
                            sx={{
                              color: 'white !important',
                              borderRadius: 2, textTransform: 'none',
                              background: 'linear-gradient(135deg, #d97706 0%, #ee802c 100%)'
                            }}
                          >
                            Settle
                          </Button>
                          </div>)}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Deactivate Group */}
          <div className="mt-5 p-4 rounded-xl border-2 border-red-100 bg-red-50/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Group Status</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isActive ? 'Group is active and accepting bets' : 'Group is deactivated'}
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
        <div className="px-6 pb-5 pt-2 flex justify-end gap-2 shrink-0 border-t border-gray-100">
          <Button onClick={onClose}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained"
            sx={{
              borderRadius: 2, textTransform: 'none', px: 4,
              background: 'linear-gradient(135deg, #2960ac 0%, #2e59a0 100%)',
              boxShadow: '0 4px 14px rgba(51,65,85,0.3)',
              '&:hover': { boxShadow: '0 6px 20px rgba(51,65,85,0.4)' },
            }}
            startIcon={<EditIcon />}>
            Save Changes
          </Button>
        </div>
      </Box>
    </Dialog>
    </ThemeProvider>
  );
}
