import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, FormControlLabel, Switch,
  MenuItem, Typography, CircularProgress, Alert,
} from '@mui/material';
import type { BettingConfigDto, CreateBettingConfigRequest, MatchDto } from '../../types';
import { useCreateBettingConfigMutation, useUpdateBettingConfigMutation } from './bettingApi';

interface Props {
  open: boolean;
  match: MatchDto;
  groupId: string;
  existingConfig?: BettingConfigDto;
  onClose: () => void;
}

interface FormValues {
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

export function BettingConfigDialog({ open, match, groupId, existingConfig, onClose }: Props) {
  const isEdit = !!existingConfig;
  const [createConfig, { isLoading: isCreating, error: createError }] = useCreateBettingConfigMutation();
  const [updateConfig, { isLoading: isUpdating, error: updateError }] = useUpdateBettingConfigMutation();
  const isLoading = isCreating || isUpdating;
  const apiError = createError || updateError;

  const defaultOpen = toLocalDatetimeInput(match.startTime);
  const defaultClose = toLocalDatetimeInput(match.startTime);

  const { control, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      handicap: existingConfig?.handicap ?? 0,
      favoredTeamId: existingConfig?.favoredTeamId ?? match.homeTeam.id,
      odds: existingConfig?.odds ?? 1.0,
      minBetAmount: existingConfig?.minBetAmount ?? 10,
      maxBetAmount: existingConfig?.maxBetAmount ?? 1000,
      defaultBetAmount: existingConfig?.defaultBetAmount ?? '',
      isFixedBet: existingConfig?.isFixedBet ?? false,
      bettingOpenTime: existingConfig ? toLocalDatetimeInput(existingConfig.bettingOpenTime) : defaultOpen,
      bettingCloseTime: existingConfig ? toLocalDatetimeInput(existingConfig.bettingCloseTime) : defaultClose,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        handicap: existingConfig?.handicap ?? 0,
        favoredTeamId: existingConfig?.favoredTeamId ?? match.homeTeam.id,
        odds: existingConfig?.odds ?? 1.0,
        minBetAmount: existingConfig?.minBetAmount ?? 10,
        maxBetAmount: existingConfig?.maxBetAmount ?? 1000,
        defaultBetAmount: existingConfig?.defaultBetAmount ?? '',
        isFixedBet: existingConfig?.isFixedBet ?? false,
        bettingOpenTime: existingConfig ? toLocalDatetimeInput(existingConfig.bettingOpenTime) : defaultOpen,
        bettingCloseTime: existingConfig ? toLocalDatetimeInput(existingConfig.bettingCloseTime) : defaultClose,
      });
    }
  }, [open, existingConfig]);

  const isFixedBet = watch('isFixedBet');

  const onSubmit = async (values: FormValues) => {
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
      if (!('error' in result)) onClose();
    } else {
      const request: CreateBettingConfigRequest = { matchId: match.id, groupId, ...body };
      const result = await createConfig(request);
      if (!('error' in result)) onClose();
    }
  };

  const teamOptions = [
    { id: match.homeTeam.id, label: `${match.homeTeam.name} (Home)` },
    { id: match.awayTeam.id, label: `${match.awayTeam.name} (Away)` },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit Betting Config' : 'Setup Betting'}
        <Typography variant="body2" color="text.secondary">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {'data' in apiError ? (apiError.data as { error?: string })?.error : 'An error occurred'}
          </Alert>
        )}

        <Grid container spacing={2} mt={0}>
          <Grid item xs={6}>
            <Controller name="handicap" control={control}
              render={({ field }) => (
                <TextField {...field} label="Handicap" type="number" fullWidth size="small"
                  inputProps={{ step: 0.25 }} />
              )} />
          </Grid>
          <Grid item xs={6}>
            <Controller name="favoredTeamId" control={control}
              render={({ field }) => (
                <TextField {...field} select label="Favored Team" fullWidth size="small">
                  <MenuItem value="">None</MenuItem>
                  {teamOptions.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>
                  ))}
                </TextField>
              )} />
          </Grid>

          <Grid item xs={12}>
            <Controller name="odds" control={control}
              render={({ field }) => (
                <TextField {...field} label="Odds (multiplier)" type="number" fullWidth size="small"
                  inputProps={{ step: 0.05, min: 1 }} />
              )} />
          </Grid>

          <Grid item xs={6}>
            <Controller name="minBetAmount" control={control}
              render={({ field }) => (
                <TextField {...field} label="Min Bet" type="number" fullWidth size="small" inputProps={{ min: 0 }} />
              )} />
          </Grid>
          <Grid item xs={6}>
            <Controller name="maxBetAmount" control={control}
              render={({ field }) => (
                <TextField {...field} label="Max Bet" type="number" fullWidth size="small" inputProps={{ min: 0 }} />
              )} />
          </Grid>

          <Grid item xs={6}>
            <Controller name="isFixedBet" control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={field.onChange} />}
                  label="Fixed Bet Amount" />
              )} />
          </Grid>
          {isFixedBet && (
            <Grid item xs={6}>
              <Controller name="defaultBetAmount" control={control}
                render={({ field }) => (
                  <TextField {...field} label="Fixed Amount" type="number" fullWidth size="small"
                    inputProps={{ min: 0 }}
                    value={field.value === '' ? '' : field.value} />
                )} />
            </Grid>
          )}

          <Grid item xs={6}>
            <Controller name="bettingOpenTime" control={control}
              render={({ field }) => (
                <TextField {...field} label="Betting Opens" type="datetime-local" fullWidth size="small"
                  InputLabelProps={{ shrink: true }} />
              )} />
          </Grid>
          <Grid item xs={6}>
            <Controller name="bettingCloseTime" control={control}
              render={({ field }) => (
                <TextField {...field} label="Betting Closes" type="datetime-local" fullWidth size="small"
                  InputLabelProps={{ shrink: true }} />
              )} />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} /> : undefined}>
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
