import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog, DialogContent, TextField, MenuItem,
  CircularProgress, Alert, IconButton, Button,
  ThemeProvider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import TuneIcon from '@mui/icons-material/Tune';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';
import type { BettingConfigDto, MatchDto, MatchStatus } from '../../types';
import { useUpdateScoreMutation } from './matchesApi';
import { BettingConfigForm } from './BettingConfigForm';
import { formatStage } from '../../utils/formatStage';
import { useUserTimeZone } from '../../utils/useUserTimeZone';
import { getTheme } from '../../app/theme';
import { inputSx } from '../../utils/formStyles';

const lightTheme = getTheme('light');

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

const STATUSES: MatchStatus[] = ['Open', 'Upcoming', 'Live', 'Finished', 'Postponed', 'Cancelled'];
const SCORE_STATUSES: MatchStatus[] = ['Live', 'Finished'];

export function MatchAdminDialog({ open, match, groupId, config, onClose }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'score' | 'betting'>('betting');
  const [showBettingForm, setShowBettingForm] = useState(false);
  const { formatDate, formatDateLocalized } = useUserTimeZone();

  const [updateScore, { isLoading, error, reset: resetMutation }] = useUpdateScoreMutation();

  // Score form
  const { control, handleSubmit, watch, reset } = useForm<ScoreFormValues>({
    defaultValues: {
      status: config ? 'Upcoming' : match.status,
      homeScore: match.homeScore ?? '',
      awayScore: match.awayScore ?? '',
    },
  });

  const watchedStatus = watch('status');
  const showScores = SCORE_STATUSES.includes(watchedStatus);

  useEffect(() => {
    if (open) {
      reset({
        status: config ? 'Upcoming' : match.status,
        homeScore: match.homeScore ?? '',
        awayScore: match.awayScore ?? '',
      });
      resetMutation();
      setActiveTab('betting');
      setShowBettingForm(false);
    }
  }, [open, match, config, reset, resetMutation]);

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

  const isLive = match.status === 'Live';

  return (
    <ThemeProvider theme={lightTheme}>
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>

      {/* Header */}
      <div className="relative bg-gradient-to-t from-slate-800 to-blue-900 px-4 sm:px-6 pt-4 sm:pt-6 pb-6 sm:pb-8">
        <IconButton onClick={onClose} size="small"
          sx={{ position: 'absolute', top: 8, right: 8, color: 'white', opacity: 0.8, '&:hover': { opacity: 1 } }}>
          <CloseIcon fontSize="small" />
        </IconButton>

        <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <SportsSoccerIcon sx={{ color: 'white', fontSize: { xs: 18, sm: 22 } }} />
          </div>
          <div>
            <h2 className="text-white text-base sm:text-lg font-bold">{t('admin.matches.dialog.title')}</h2>
            <p className="text-sky-200 text-[10px] sm:text-xs">{formatStage(match.stage, match.group)}</p>
          </div>
        </div>

        {/* Match teams display */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-4 mt-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {match.homeTeam.flagUrl && (
              <img src={match.homeTeam.flagUrl} alt="" className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white/30 shrink-0" />
            )}
            <span className="text-white font-bold text-xs sm:text-sm truncate">{match.homeTeam.name}</span>
          </div>
          <div className={`px-2.5 sm:px-3 py-1 rounded-lg shrink-0 ${isLive ? 'bg-red-500/30' : 'bg-white/10'}`}>
            {match.status === 'Live' || match.status === 'Finished' ? (
              <span className="text-white font-black text-base sm:text-lg">{match.homeScore} - {match.awayScore}</span>
            ) : (
              <span className="text-white/60 font-semibold text-xs sm:text-sm">vs</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-white font-bold text-xs sm:text-sm truncate">{match.awayTeam.name}</span>
            {match.awayTeam.flagUrl && (
              <img src={match.awayTeam.flagUrl} alt="" className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white/30 shrink-0" />
            )}
          </div>
        </div>
        <div className="flex items-center justify-center">
          <p className="text-gray-100 text-[12px] flex items-center gap-1 mt-1 font-semibold">
            <AccessTimeIcon sx={{ fontSize: 16, fontFamily: 'monospace'}} />
            {formatDate(match.startTime, 'MMM dd, yyyy · HH:mm')}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('betting')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all
            ${activeTab === 'betting'
            ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50/50'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }
          `}
        >
          <TuneIcon sx={{ fontSize: 18 }} />
          {t('admin.matches.dialog.tabs.betting')}
          {!config && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('score')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all
            ${activeTab === 'score'
            ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50/50'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }
          `}
        >
          <ScoreboardIcon sx={{ fontSize: 18 }} />
          {t('admin.matches.dialog.tabs.statusScore')}
        </button>
      </div>

      <DialogContent sx={{ pt: 3, pb: 2, px: { xs: 2, sm: 3 } }}>
        {/* ── Tab: Status & Score ── */}
        {activeTab === 'score' && (
          <div className="space-y-4">
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {'data' in error ? (error.data as { error?: string })?.error : t('admin.matches.dialog.error.updateFailed')}
              </Alert>
            )}

            {/* Status selector */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <AccessTimeIcon sx={{ fontSize: 14 }} /> {t('admin.matches.dialog.matchStatus')}
              </p>
              <Controller name="status" control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth size="small"
                    sx={inputSx}>
                    {STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </TextField>
                )} />
            </div>

            {/* Score inputs */}
            {showScores && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <ScoreboardIcon sx={{ fontSize: 14 }} /> {t('admin.matches.dialog.score')}
                </p>
                <div className="grid grid-cols-5 gap-3 items-center">
                  <div className="col-span-2">
                    <Controller name="homeScore" control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={match.homeTeam.code}
                          type="number"
                          size="small"
                          fullWidth
                          inputProps={{ min: 0 }}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          sx={inputSx}
                        />
                      )} />
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-xl font-black text-gray-300">–</span>
                  </div>
                  <div className="col-span-2">
                    <Controller name="awayScore" control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={match.awayTeam.code}
                          type="number"
                          size="small"
                          fullWidth
                          inputProps={{ min: 0 }}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          sx={inputSx}
                        />
                      )} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Betting Config ── */}
        {activeTab === 'betting' && (
          <div>
            {!groupId ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <TuneIcon sx={{ fontSize: 24, color: '#94a3b8' }} />
                </div>
                <p className="text-sm text-gray-500">{t('admin.matches.dialog.noGroup')}</p>
              </div>
            ) : (config && !showBettingForm) ? (
              <div className="space-y-4">
                {/* Config summary cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-100 p-3 bg-gray-50/50">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{t('common.handicap')}</p>
                    <p className="text-sm font-bold text-gray-800">
                      {config.handicap !== 0
                        ? `${config.favoredTeamName ?? 'Home'} ${config.handicap > 0 ? '+' : ''}${config.handicap}`
                        : t('common.none')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-3 bg-gray-50/50">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{t('admin.matches.dialog.odds')}</p>
                    <p className="text-sm font-bold text-gray-800">×{config.odds}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-3 bg-gray-50/50">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{t('admin.matches.dialog.betAmount')}</p>
                    <p className="text-sm font-bold text-gray-800">
                      {config.isFixedBet
                        ? `$${(config.defaultBetAmount ?? config.minBetAmount).toLocaleString()}`
                        : `$${config.minBetAmount.toLocaleString()} – $${config.maxBetAmount.toLocaleString()}`}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-3 bg-gray-50/50">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{t('common.status')}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      config.isSettled ? 'text-gray-600 bg-gray-100' : 'text-emerald-700 bg-emerald-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.isSettled ? 'bg-gray-400' : 'bg-emerald-500'}`} />
                      {config.isSettled ? t('common.filter.settled') : t('common.active')}
                    </span>
                  </div>
                </div>

                {/* Betting window */}
                <div className="rounded-xl border border-gray-100 p-3 bg-gray-50/50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{t('admin.matches.dialog.bettingWindow')}</p>
                  <p className="text-xs text-gray-600">
                    {formatDateLocalized(config.bettingOpenTime)} → {formatDateLocalized(config.bettingCloseTime)}
                  </p>
                </div>

                {!config.isSettled && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowBettingForm(true)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#054696', color: '#052e96', padding: '0.45rem', float: 'right' }}
                  >
                    {t('admin.matches.dialog.editConfig')}
                  </Button>
                )}
              </div>
            ) : (
              <BettingConfigForm
                match={match}
                groupId={groupId}
                existingConfig={config}
                onSuccess={() => setShowBettingForm(false)}
                onCancel={config ? () => setShowBettingForm(false) : undefined}
              />
            )}
          </div>
        )}
      </DialogContent>

      {/* Footer - only show for Score tab */}
      {activeTab === 'score' && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-2 flex justify-end gap-2 border-t border-gray-100">
          <Button onClick={onClose}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3, color: '#64748b' }}>
            {t('common.close')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmitScore)}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : <SaveIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: 2, textTransform: 'none', px: 4, fontWeight: 600,
              background: 'linear-gradient(135deg, #053a96 0%, #042f78 100%)',
              boxShadow: '0 4px 6px rgba(5, 56, 150, 0.3)',
              '&:hover': { boxShadow: '0 6px 10px rgba(5, 29, 150, 0.4)' },
            }}
          >
            {t('common.saveChanges')}
          </Button>
        </div>
      )}
    </Dialog>
    </ThemeProvider>
  );
}
