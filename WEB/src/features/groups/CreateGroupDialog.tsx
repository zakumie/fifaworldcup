import { useState } from 'react';
import {
  Box, Dialog, DialogContent, TextField, Alert, Button,
  IconButton, InputAdornment, ThemeProvider,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CloseIcon from '@mui/icons-material/Close';
import GavelIcon from '@mui/icons-material/Gavel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useCreateGroupMutation } from './groupsApi';
import { useCreateChampionConfigMutation } from '../predictions/championApi';
import type { CreateGroupRequest } from '../../types';
import { getTheme } from '../../app/theme';
import { inputSx } from '../../utils/formStyles';

const lightTheme = getTheme('light');

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
  const { t } = useTranslation();
  const [createGroup] = useCreateGroupMutation();
  const [createChampionConfig] = useCreateChampionConfigMutation();
  const [error, setError] = useState('');
  const [championEnabled, setChampionEnabled] = useState(false);
  const [championOpenTime, setChampionOpenTime] = useState('');
  const [championCloseTime, setChampionCloseTime] = useState('');

  const form = useForm<CreateGroupRequest>({
    resolver: yupResolver(createSchema),
    defaultValues: { name: '', description: '', maxMembers: 20, defaultBalance: 10000, settlementMode: 'Normal' },
  });

  const settlementMode = useWatch({ control: form.control, name: 'settlementMode' });

  const handleSubmit = async (formData: CreateGroupRequest) => {
    try {
      setError('');
      const result = await createGroup(formData).unwrap();

      if (championEnabled && championOpenTime && championCloseTime) {
        try {
          await createChampionConfig({
            groupId: result.id,
            isEnabled: true,
            predictionOpenTime: new Date(championOpenTime).toISOString(),
            predictionCloseTime: new Date(championCloseTime).toISOString(),
          }).unwrap();
        } catch {
          // Group created but champion config failed - still proceed
        }
      }

      form.reset();
      setChampionEnabled(false);
      setChampionOpenTime('');
      setChampionCloseTime('');
      onCreated(result.id);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const msg = status === 403 ? t('groups.create.error.noPermission') : t('groups.create.error.failed');
      setError(msg);
      onError?.(msg);
    }
  };

  const handleClose = () => {
    setError('');
    form.reset();
    setChampionEnabled(false);
    setChampionOpenTime('');
    setChampionCloseTime('');
    onClose();
  };

  return (
    <ThemeProvider theme={lightTheme}>
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' } }}>
      <Box component="form" onSubmit={form.handleSubmit(handleSubmit)} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div className="relative bg-gradient-to-b from-sky-700 to-blue-900 px-6 pt-6 pb-8 shrink-0">
          <IconButton onClick={handleClose} size="small"
            sx={{ position: 'absolute', top: 12, right: 12, color: 'white', opacity: 0.8, '&:hover': { opacity: 1 } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <GroupsIcon sx={{ color: 'white', fontSize: 22 }} />
            </div>
            <div>
            <h2 className="text-white text-lg font-bold">{t('groups.create.title')}</h2>
            <p className="text-blue-100 text-xs">{t('groups.create.subtitle')}</p>
            </div>
          </div>
        </div>

        <DialogContent sx={{ pt: 3, pb: 2, px: 3, overflowY: 'auto', flex: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          {/* Group Name */}
          <TextField {...form.register('name')} label={t('groups.create.nameLabel')} fullWidth size="small"
            placeholder={t('groups.create.namePlaceholder')}
            error={!!form.formState.errors.name} helperText={form.formState.errors.name?.message}
            autoFocus
            InputProps={{ startAdornment: <InputAdornment position="start"><GroupsIcon sx={{ fontSize: 18, color: '#64748b' }} /></InputAdornment> }}
            sx={[inputSx, { mt: 2 }]} />

          {/* Description */}
          <TextField {...form.register('description')} label={t('groups.create.descriptionLabel')} fullWidth size="small"
            placeholder={t('groups.create.descriptionPlaceholder')}
            multiline rows={2}
            sx={[inputSx, { mt: 2 }]} />

          {/* Two columns: Max Members & Default Balance */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <TextField {...form.register('maxMembers')} label={t('groups.create.maxMembersLabel')} type="number" fullWidth size="small"
              error={!!form.formState.errors.maxMembers} helperText={form.formState.errors.maxMembers?.message}
              InputProps={{ startAdornment: <InputAdornment position="start"><PeopleAltIcon sx={{ fontSize: 18, color: '#64748b' }} /></InputAdornment> }}
              sx={inputSx} />
            <TextField {...form.register('defaultBalance')} label={t('groups.create.balanceLabel')} type="number" fullWidth size="small"
              error={!!form.formState.errors.defaultBalance} helperText={form.formState.errors.defaultBalance?.message}
              InputProps={{ startAdornment: <InputAdornment position="start"><AccountBalanceWalletIcon sx={{ fontSize: 18, color: '#64748b' }} /></InputAdornment> }}
              sx={inputSx} />
          </div>

          {/* Settlement Mode - Card selector */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <GavelIcon sx={{ fontSize: 14 }} /> {t('groups.create.settlementMode')}
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
                  <span className="text-sm font-semibold text-gray-700">{t('groups.mode.normal')}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">{t('groups.mode.normalWin')}<br/>{t('groups.mode.normalLose')}</span>
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
                  <span className="text-sm font-semibold text-gray-700">{t('groups.mode.winnerKeeps')}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">{t('groups.mode.winnerKeepsDesc')}<br/>{t('groups.mode.skipAutoLose')}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Champion Prediction */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <MilitaryTechIcon sx={{ fontSize: 14 }} /> {t('groups.create.championSection')}
            </p>
            <div
              onClick={() => setChampionEnabled(!championEnabled)}
              className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${
                championEnabled ? 'border-amber-500 bg-amber-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
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
                    <span className="text-sm font-semibold text-gray-700">{t('groups.create.enableChampion')}</span>
                    <p className="text-[10px] text-gray-400">{t('groups.create.championDescription')}</p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors ${championEnabled ? 'bg-amber-500' : 'bg-gray-300'} relative`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${championEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>
            </div>

            {championEnabled && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <TextField
                  label={t('groups.create.openTimeLabel')}
                  type="datetime-local"
                  value={championOpenTime}
                  onChange={(e) => setChampionOpenTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={inputSx}
                />
                <TextField
                  label={t('groups.create.closeTimeLabel')}
                  type="datetime-local"
                  value={championCloseTime}
                  onChange={(e) => setChampionCloseTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={inputSx}
                />
              </div>
            )}
          </div>
        </DialogContent>

        {/* Footer */}
        <div className="px-6 pb-5 pt-2 flex justify-end gap-2 shrink-0 border-t border-gray-100">
          <Button onClick={handleClose}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="contained"
            sx={{
              borderRadius: 2, textTransform: 'none', px: 4,
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
              '&:hover': { boxShadow: '0 6px 20px rgba(37,99,235,0.4)' },
            }}
            startIcon={<AddIcon />}>
            {t('groups.create.submitButton')}
          </Button>
        </div>
      </Box>
    </Dialog>
    </ThemeProvider>
  );
}
