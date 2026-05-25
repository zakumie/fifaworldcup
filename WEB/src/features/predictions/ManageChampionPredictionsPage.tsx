import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

  if (!groupId) return <Typography>Group not found</Typography>;

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
        showAlert('Configuration created successfully', 'success');
      } else {
        await updateConfig({
          groupId,
          body: {
            isEnabled,
            predictionOpenTime: isoOpenTime,
            predictionCloseTime: isoCloseTime,
          },
        }).unwrap();
        showAlert('Configuration updated successfully', 'success');
      }
    } catch (error) {
      showAlert(error ? String(error) : 'Failed to save configuration', 'error');
    }
  };

  const handleSettle = async () => {
    if (!selectedWinnerTeamId) {
      showAlert('Please select a winning team', 'error');
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
      showAlert('Predictions settled successfully', 'success');
      setSettleDialogOpen(false);
    } catch (error) {
      showAlert(error ? String(error) : 'Failed to settle predictions', 'error');
    }
  };

  if (configLoading) return <CircularProgress />;

  return (
    <div className="p-6">
      <Typography variant="h4" className="font-bold mb-6">
        Manage Champion Predictions
      </Typography>

      <Grid container spacing={4}>
        {/* Configuration Card */}
        <Grid item xs={12} md={6}>
          <Card className="p-6">
            <Typography variant="h6" className="font-bold mb-4">
              Prediction Settings
            </Typography>

            {config?.isSettled && (
              <Alert severity="success" className="mb-4">
                <CheckCircleIcon className="mr-2" />
                Predictions have been settled for this group
              </Alert>
            )}

            <div className="space-y-4">
              {/* Enable/Disable */}
              <FormControlLabel
                control={<Switch checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />}
                label="Enable Champion Predictions"
                disabled={config?.isSettled}
              />

              {/* Open Time */}
              <TextField
                fullWidth
                label="Prediction Open Time"
                type="datetime-local"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={config?.isSettled}
              />

              {/* Close Time */}
              <TextField
                fullWidth
                label="Prediction Close Time"
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
                  {isCreating || isUpdating ? 'Saving...' : config ? 'Update Configuration' : 'Create Configuration'}
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
                Settle Predictions
              </Typography>

              <Typography variant="body2" className="text-gray-600 mb-4">
                Once settled, members will see if their prediction was correct.
              </Typography>

              <Button
                fullWidth
                variant="contained"
                color="warning"
                onClick={() => setSettleDialogOpen(true)}
                disabled={isSettling}
              >
                {isSettling ? 'Settling...' : 'Settle Predictions'}
              </Button>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Settle Dialog */}
      <ThemeProvider theme={lightTheme}>
      <Dialog open={settleDialogOpen} onClose={() => setSettleDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
        <DialogTitle>Settle Championship Prediction</DialogTitle>
        <DialogContent className="pt-6">
          <Typography variant="body2" className="text-gray-600 mb-4">
            Select the winning team to settle all member predictions
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            label="Select Winner Team"
            value={selectedWinnerTeamId}
            onChange={(e) => setSelectedWinnerTeamId(e.target.value)}
            SelectProps={{
              native: true,
            }}
            sx={inputSx}
          >
            <option value="">-- Choose Team --</option>
            {teams?.map((team: TeamDto) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSettle}
            variant="contained"
            color="warning"
            disabled={!selectedWinnerTeamId || isSettling}
          >
            {isSettling ? 'Settling...' : 'Confirm Settlement'}
          </Button>
        </DialogActions>
      </Dialog>
      </ThemeProvider>
    </div>
  );
}
