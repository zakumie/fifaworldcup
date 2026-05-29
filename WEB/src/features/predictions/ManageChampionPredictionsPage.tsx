import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
  Alert,
  FormControlLabel,
  Switch,
  ThemeProvider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useGetChampionConfigQuery, useCreateChampionConfigMutation, useUpdateChampionConfigMutation, useSettleChampionPredictionsMutation } from './championApi';
import { getTheme } from '../../app/theme';
import { inputSx } from '../../utils/formStyles';

const lightTheme = getTheme('light');
import { useGetTeamsQuery } from '../matches/matchesApi';
import { useAlert } from '../../components/AlertSnackbar';
import type { TeamDto } from '../../types';

export default function ManageChampionPredictionsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { showAlert } = useAlert();
  const { t } = useTranslation();

  if (!groupId) return <Typography>{t('common.groupNotFound')}</Typography>;

  const { data: config, isLoading: configLoading } = useGetChampionConfigQuery({ groupId });
  const { data: teams } = useGetTeamsQuery();
  const [createConfig, { isLoading: isCreating }] = useCreateChampionConfigMutation();
  const [updateConfig, { isLoading: isUpdating }] = useUpdateChampionConfigMutation();
  const [settleConfig, { isLoading: isSettling }] = useSettleChampionPredictionsMutation();

  const [isEnabled, setIsEnabled] = useState(false);
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [selectedWinnerTeamId, setSelectedWinnerTeamId] = useState<string>('');
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);

  useEffect(() => {
    if (config) {
      setIsEnabled(config.isEnabled);
      setOpenTime(new Date(config.predictionOpenTime).toISOString().slice(0, 16));
      setCloseTime(new Date(config.predictionCloseTime).toISOString().slice(0, 16));
    }
  }, [config]);

  const handleCreateOrUpdate = async () => {
    try {
      const isoOpenTime = new Date(openTime).toISOString();
      const isoCloseTime = new Date(closeTime).toISOString();

      if (!config) {
        await createConfig({
          groupId,
          isEnabled,
          predictionOpenTime: isoOpenTime,
          predictionCloseTime: isoCloseTime,
        }).unwrap();
        showAlert(t('admin.predictions.createSuccess'), 'success');
      } else {
        await updateConfig({
          groupId,
          body: {
            isEnabled,
            predictionOpenTime: isoOpenTime,
            predictionCloseTime: isoCloseTime,
          },
        }).unwrap();
        showAlert(t('admin.predictions.updateSuccess'), 'success');
      }
    } catch (error) {
      showAlert(error ? String(error) : t('admin.predictions.error.saveFailed'), 'error');
    }
  };

  const handleSettle = async () => {
    if (!selectedWinnerTeamId) {
      showAlert(t('admin.predictions.error.selectTeam'), 'error');
      return;
    }

    try {
      await settleConfig({
        groupId,
        body: {
          groupId,
          winnerTeamId: selectedWinnerTeamId,
        },
      }).unwrap();
      showAlert(t('admin.predictions.settleSuccess'), 'success');
      setSettleDialogOpen(false);
    } catch (error) {
      showAlert(error ? String(error) : t('admin.predictions.error.settleFailed'), 'error');
    }
  };

  if (configLoading) return <CircularProgress />;

  return (
    <div className="p-6">
      <Typography variant="h4" className="font-bold mb-6">
        {t('admin.predictions.title')}
      </Typography>

      <Grid container spacing={4}>
        {/* Configuration Card */}
        <Grid item xs={12} md={6}>
          <Card className="p-6">
            <Typography variant="h6" className="font-bold mb-4">
              {t('admin.predictions.settings')}
            </Typography>

            {config?.isSettled && (
              <Alert severity="success" className="mb-4">
                <CheckCircleIcon className="mr-2" />
                {t('admin.predictions.settledAlert')}
              </Alert>
            )}

            <div className="space-y-4">
              {/* Enable/Disable */}
              <FormControlLabel
                control={<Switch checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />}
                label={t('admin.predictions.enableToggle')}
                disabled={config?.isSettled}
              />

              {/* Open Time */}
              <TextField
                fullWidth
                label={t('admin.predictions.openTime')}
                type="datetime-local"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={config?.isSettled}
              />

              {/* Close Time */}
              <TextField
                fullWidth
                label={t('admin.predictions.closeTime')}
                type="datetime-local"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={config?.isSettled}
              />

              {/* Save Button */}
              {!config?.isSettled && (
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleCreateOrUpdate}
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? t('common.saving') : config ? t('admin.predictions.updateButton') : t('admin.predictions.createButton')}
                </Button>
              )}
            </div>
          </Card>
        </Grid>

        {/* Settlement Card */}
        {config && !config.isSettled && (
          <Grid item xs={12} md={6}>
            <Card className="p-6 border border-yellow-200 bg-yellow-50">
              <Typography variant="h6" className="font-bold mb-4">
                {t('admin.predictions.settleTitle')}
              </Typography>

              <Typography variant="body2" className="text-gray-600 mb-4">
                {t('admin.predictions.settleDescription')}
              </Typography>

              <Button
                fullWidth
                variant="contained"
                color="warning"
                onClick={() => setSettleDialogOpen(true)}
                disabled={isSettling}
              >
                {isSettling ? t('admin.predictions.settling') : t('admin.predictions.settleButton')}
              </Button>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Settle Dialog */}
      <ThemeProvider theme={lightTheme}>
      <Dialog open={settleDialogOpen} onClose={() => setSettleDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
        <DialogTitle>{t('admin.predictions.settleDialog.title')}</DialogTitle>
        <DialogContent className="pt-6">
          <Typography variant="body2" className="text-gray-600 mb-4">
            {t('admin.predictions.settleDialog.description')}
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            label={t('admin.predictions.settleDialog.selectWinner')}
            value={selectedWinnerTeamId}
            onChange={(e) => setSelectedWinnerTeamId(e.target.value)}
            SelectProps={{
              native: true,
            }}
            sx={inputSx}
          >
            <option value="">{t('admin.predictions.settleDialog.chooseTeam')}</option>
            {teams?.map((team: TeamDto) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettleDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSettle}
            variant="contained"
            color="warning"
            disabled={!selectedWinnerTeamId || isSettling}
          >
            {isSettling ? t('admin.predictions.settling') : t('admin.predictions.settleDialog.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
      </ThemeProvider>
    </div>
  );
}
