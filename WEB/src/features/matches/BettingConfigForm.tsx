import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  TextField, MenuItem, Alert, Button, CircularProgress,
  FormControlLabel, Switch, InputAdornment,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import BalanceIcon from '@mui/icons-material/Balance';
import PaidIcon from '@mui/icons-material/Paid';
import ScheduleIcon from '@mui/icons-material/Schedule';
import type { BettingConfigDto, CreateBettingConfigRequest, MatchDto } from '../../types';
import { useCreateBettingConfigMutation, useUpdateBettingConfigMutation } from '../betting/bettingApi';

interface Props {
  match: MatchDto;
  groupId: string;
  existingConfig?: BettingConfigDto;
  onSuccess: () => void;
  onCancel?: () => void;
}

interface BettingFormValues {
  handicap: number;
  favoredTeamId: string;
  odds: number;
  minBetAmount: number;
  maxBetAmount: number;
  defaultBetAmount: number | '';
  isFixedBet: boolean;
  bettingOpenTime: string;
  bettingCloseTime: string;
}

function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#f8fafc' } };

export function BettingConfigForm({ match, groupId, existingConfig, onSuccess, onCancel }: Props) {
  const isEdit = !!existingConfig;
  const [createConfig, { isLoading: isCreating, error: createError }] = useCreateBettingConfigMutation();
  const [updateConfig, { isLoading: isUpdating, error: updateError }] = useUpdateBettingConfigMutation();
  const isSaving = isCreating || isUpdating;
  const apiError = createError || updateError;

  const defaultOpen = toLocalDatetimeInput(new Date().toISOString());
  const defaultClose = toLocalDatetimeInput(
    new Date(new Date(match.startTime).getTime() - 2 * 60 * 60 * 1000).toISOString()
  );

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<BettingFormValues>({
    defaultValues: {
      handicap: existingConfig?.handicap ?? 0,
      favoredTeamId: existingConfig?.favoredTeamId ?? match.homeTeam.id,
      odds: existingConfig?.odds ?? 1.0,
      minBetAmount: existingConfig?.minBetAmount ?? 10,
      maxBetAmount: existingConfig?.maxBetAmount ?? 1000,
      defaultBetAmount: existingConfig?.defaultBetAmount ?? 50,
      isFixedBet: existingConfig?.isFixedBet ?? true,
      bettingOpenTime: existingConfig ? toLocalDatetimeInput(existingConfig.bettingOpenTime) : defaultOpen,
      bettingCloseTime: existingConfig ? toLocalDatetimeInput(existingConfig.bettingCloseTime) : defaultClose,
    },
  });

  const isFixedBet = watch('isFixedBet');

  useEffect(() => {
    reset({
      handicap: existingConfig?.handicap ?? 0,
      favoredTeamId: existingConfig?.favoredTeamId ?? match.homeTeam.id,
      odds: existingConfig?.odds ?? 1.0,
      minBetAmount: existingConfig?.minBetAmount ?? 10,
      maxBetAmount: existingConfig?.maxBetAmount ?? 1000,
      defaultBetAmount: existingConfig?.defaultBetAmount ?? 10,
      isFixedBet: existingConfig?.isFixedBet ?? true,
      bettingOpenTime: existingConfig ? toLocalDatetimeInput(existingConfig.bettingOpenTime) : defaultOpen,
      bettingCloseTime: existingConfig ? toLocalDatetimeInput(existingConfig.bettingCloseTime) : defaultClose,
    });
  }, [existingConfig]);

  const teamOptions = [
    { id: match.homeTeam.id, label: `${match.homeTeam.name} (Home)` },
    { id: match.awayTeam.id, label: `${match.awayTeam.name} (Away)` },
  ];

  const onSubmit = async (values: BettingFormValues) => {
    const body = {
      handicap: Number(values.handicap),
      favoredTeamId: values.favoredTeamId || null,
      odds: Number(values.odds),
      minBetAmount: Number(values.minBetAmount),
      maxBetAmount: Number(values.maxBetAmount),
      defaultBetAmount: values.defaultBetAmount !== '' ? Number(values.defaultBetAmount) : null,
      isFixedBet: values.isFixedBet,
      bettingOpenTime: new Date(values.bettingOpenTime).toISOString(),
      bettingCloseTime: new Date(values.bettingCloseTime).toISOString(),
    };

    if (isEdit && existingConfig) {
      const result = await updateConfig({ configId: existingConfig.id, groupId, body });
      if (!('error' in result)) onSuccess();
    } else {
      const request: CreateBettingConfigRequest = { matchId: match.id, groupId, ...body };
      const result = await createConfig(request);
      if (!('error' in result)) onSuccess();
    }
  };

  return (
    <div className="space-y-5">
      {apiError && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {'data' in apiError ? (apiError.data as { error?: string })?.error : 'An error occurred'}
        </Alert>
      )}

      {/* ─── Section: Match Odds ─── */}
      <div className="rounded-xl border border-gray-100 p-4 bg-gradient-to-br from-slate-50 to-gray-50/50">
        <div className="flex items-center gap-2 mb-3">
          <BalanceIcon sx={{ fontSize: 16, color: '#6366f1' }} />
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Match Odds</p>
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-4">
            <p className="text-[10px] font-medium text-gray-400 mb-1">Handicap</p>
            <Controller name="handicap" control={control}
              render={({ field }) => (
                <TextField {...field} type="number" fullWidth size="small"
                  inputProps={{ step: 0.5 }}
                  sx={inputSx} />
              )} />
          </div>
          <div className="col-span-5">
            <p className="text-[10px] font-medium text-gray-400 mb-1">Favored Team</p>
            <Controller name="favoredTeamId" control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth size="small" sx={inputSx}>
                  <MenuItem value="">None</MenuItem>
                  {teamOptions.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>
                  ))}
                </TextField>
              )} />
          </div>
          <div className="col-span-3">
            <p className="text-[10px] font-medium text-gray-400 mb-1">Odds ×</p>
            <Controller name="odds" control={control}
              render={({ field }) => (
                <TextField {...field} type="number" fullWidth size="small"
                  inputProps={{ step: 0.05, min: 1 }}
                  sx={inputSx} />
              )} />
          </div>
        </div>
      </div>

      {/* ─── Section: Bet Amounts ─── */}
      <div className="rounded-xl border border-gray-100 p-4 bg-gradient-to-br from-slate-50 to-gray-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PaidIcon sx={{ fontSize: 16, color: '#059669' }} />
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Bet Amount</p>
          </div>
          <Controller name="isFixedBet" control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch checked={field.value} onChange={field.onChange} size="small"
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#059669' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#059669' } }}
                  />
                }
                label={<span className="text-[11px] font-semibold text-gray-500">Fixed Amount</span>}
                labelPlacement="start"
                sx={{ mr: 0, gap: 0.5 }}
              />
            )} />
        </div>

        {isFixedBet ? (
          <div>
            <p className="text-[10px] font-medium text-gray-400 mb-1">Fixed Bet Amount</p>
            <Controller name="defaultBetAmount" control={control}
              render={({ field }) => (
                <TextField {...field} type="number" fullWidth size="small"
                  placeholder="Enter fixed bet amount"
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  inputProps={{ min: 0 }}
                  value={field.value === '' ? '' : field.value}
                  sx={inputSx} />
              )} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-medium text-gray-400 mb-1">Min Bet</p>
              <Controller name="minBetAmount" control={control}
                render={({ field }) => (
                  <TextField {...field} type="number" fullWidth size="small"
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    inputProps={{ min: 0 }}
                    sx={inputSx} />
                )} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-400 mb-1">Max Bet</p>
              <Controller name="maxBetAmount" control={control}
                render={({ field }) => (
                  <TextField {...field} type="number" fullWidth size="small"
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    inputProps={{ min: 0 }}
                    sx={inputSx} />
                )} />
            </div>
          </div>
        )}
      </div>

      {/* ─── Section: Betting Window ─── */}
      <div className="rounded-xl border border-gray-100 p-4 bg-gradient-to-br from-slate-50 to-gray-50/50">
        <div className="flex items-center gap-2 mb-3">
          <ScheduleIcon sx={{ fontSize: 16, color: '#d97706' }} />
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Betting Window</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-medium text-gray-400 mb-1">Opens at</p>
            <Controller name="bettingOpenTime" control={control}
              render={({ field }) => (
                <TextField {...field} type="datetime-local" fullWidth size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={inputSx} />
              )} />
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 mb-1">Closes at</p>
            <Controller name="bettingCloseTime" control={control}
              rules={{
                validate: (value) => {
                  const closeDate = new Date(value);
                  const matchStart = new Date(match.startTime);
                  if (closeDate > matchStart) return 'Close time must not be after match start time';
                  return true;
                },
              }}
              render={({ field }) => (
                <TextField {...field} type="datetime-local" fullWidth size="small"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.bettingCloseTime}
                  helperText={errors.bettingCloseTime?.message}
                  sx={inputSx} />
              )} />
          </div>
        </div>
      </div>

      {/* ─── Actions ─── */}
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button onClick={onCancel} disabled={isSaving}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3, color: '#64748b' }}>
            Cancel
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={16} /> : <SaveIcon sx={{ fontSize: 16 }} />}
          sx={{
            borderRadius: 2, textTransform: 'none', px: 4, fontWeight: 600,
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            boxShadow: '0 4px 14px rgba(5,150,105,0.3)',
            '&:hover': { boxShadow: '0 6px 20px rgba(5,150,105,0.4)' },
          }}
        >
          {isEdit ? 'Update Config' : 'Create Config'}
        </Button>
      </div>
    </div>
  );
}
