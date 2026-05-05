import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Tab, Tabs, TextField, MenuItem,
  CircularProgress, Alert, Divider, Chip,
} from '@mui/material';
import type { BettingConfigDto, MatchDto, MatchStatus } from '../../types';
import { useUpdateScoreMutation } from './matchesApi';
import { BettingConfigDialog } from '../betting/BettingConfigDialog';

interface Props {
  open: boolean;
  match: MatchDto;
  groupId: string;
  config?: BettingConfigDto;
  onClose: () => void;
}

interface ScoreFormValues {
  status: MatchStatus;
  homeScore: number | '';
  awayScore: number | '';
}

const STATUSES: MatchStatus[] = ['Scheduled', 'Live', 'Finished', 'Postponed', 'Cancelled'];
const SCORE_STATUSES: MatchStatus[] = ['Live', 'Finished'];

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box pt={2}>{children}</Box> : null;
}

export function MatchAdminDialog({ open, match, groupId, config, onClose }: Props) {
  const [tab, setTab] = useState(0);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const [updateScore, { isLoading, error, reset: resetMutation }] = useUpdateScoreMutation();

  const { control, handleSubmit, watch, reset } = useForm<ScoreFormValues>({
    defaultValues: {
      status: match.status,
      homeScore: match.homeScore ?? '',
      awayScore: match.awayScore ?? '',
    },
  });

  const watchedStatus = watch('status');
  const showScores = SCORE_STATUSES.includes(watchedStatus);

  useEffect(() => {
    if (open) {
      reset({
        status: match.status,
        homeScore: match.homeScore ?? '',
        awayScore: match.awayScore ?? '',
      });
      resetMutation();
      setTab(0);
    }
  }, [open, match]);

  const onSubmitScore = async (values: ScoreFormValues) => {
    await updateScore({
      id: match.id,
      body: {
        status: values.status,
        homeScore: showScores && values.homeScore !== '' ? Number(values.homeScore) : 0,
        awayScore: showScores && values.awayScore !== '' ? Number(values.awayScore) : 0,
      },
    });
  };

  const statusColor = (s: MatchStatus) =>
    s === 'Live' ? 'error' : s === 'Finished' ? 'default' : s === 'Scheduled' ? 'primary' : 'warning';

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h6">{match.homeTeam.name} vs {match.awayTeam.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {match.stage} &nbsp;·&nbsp; Match Day {match.matchDay}
              </Typography>
            </Box>
            <Chip label={match.status} size="small" color={statusColor(match.status)} />
          </Box>
        </DialogTitle>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Status & Score" />
          <Tab label="Betting Config" />
        </Tabs>

        <DialogContent>
          {/* ── Tab 0: Status & Score ── */}
          <TabPanel value={tab} index={0}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {'data' in error ? (error.data as { error?: string })?.error : 'Failed to update match'}
              </Alert>
            )}

            <Box display="flex" flexDirection="column" gap={2}>
              <Controller name="status" control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Match Status" size="small" fullWidth>
                    {STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </TextField>
                )} />

              {showScores && (
                <Box display="flex" gap={2} alignItems="center">
                  <Controller name="homeScore" control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={`${match.homeTeam.name} Score`}
                        type="number"
                        size="small"
                        fullWidth
                        inputProps={{ min: 0 }}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    )} />
                  <Typography variant="h5" color="text.secondary" sx={{ flexShrink: 0 }}>–</Typography>
                  <Controller name="awayScore" control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={`${match.awayTeam.name} Score`}
                        type="number"
                        size="small"
                        fullWidth
                        inputProps={{ min: 0 }}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    )} />
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* ── Tab 1: Betting Config ── */}
          <TabPanel value={tab} index={1}>
            {!groupId ? (
              <Box display="flex" flexDirection="column" alignItems="center" gap={1} py={3}>
                <Typography color="text.secondary" textAlign="center">
                  Select a group from the Matches page to manage betting for this match.
                </Typography>
              </Box>
            ) : config ? (
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  <Chip
                    label={config.handicap !== 0
                      ? `Handicap: ${config.favoredTeamName ?? 'Home'} ${config.handicap > 0 ? '+' : ''}${config.handicap}`
                      : 'No handicap'}
                    size="small" variant="outlined" />
                  <Chip label={`Odds ×${config.odds}`} size="small" color="primary" variant="outlined" />
                  <Chip label={config.isFixedBet ? 'Fixed Bet' : `${config.minBetAmount}–${config.maxBetAmount}`}
                    size="small" variant="outlined" />
                  <Chip label={config.isSettled ? 'Settled' : 'Active'}
                    size="small" color={config.isSettled ? 'default' : 'success'} />
                </Box>
                <Divider />
                <Typography variant="caption" color="text.secondary">
                  Betting window: {new Date(config.bettingOpenTime).toLocaleString()} → {new Date(config.bettingCloseTime).toLocaleString()}
                </Typography>
                {!config.isSettled && (
                  <Button variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}
                    onClick={() => setConfigDialogOpen(true)}>
                    Edit Config
                  </Button>
                )}
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={2}>
                <Typography color="text.secondary">No betting config for this match in the selected group.</Typography>
                <Button variant="contained" size="small" onClick={() => setConfigDialogOpen(true)}>
                  Setup Betting
                </Button>
              </Box>
            )}
          </TabPanel>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          {tab === 0 && (
            <Button
              variant="contained"
              onClick={handleSubmit(onSubmitScore)}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={16} /> : undefined}>
              Save Status
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {configDialogOpen && (
        <BettingConfigDialog
          open={configDialogOpen}
          match={match}
          groupId={groupId}
          existingConfig={config}
          onClose={() => setConfigDialogOpen(false)}
        />
      )}
    </>
  );
}
