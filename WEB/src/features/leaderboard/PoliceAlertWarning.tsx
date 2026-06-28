import { Dialog, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useTranslation } from 'react-i18next';

interface PoliceAlertWarningProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function PoliceAlertWarning({ open, onClose, onAccept }: PoliceAlertWarningProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 4 },
          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #dc2626 100%)',
          border: { xs: '2px solid #fbbf24', sm: '4px solid #fbbf24' },
          position: 'relative',
          overflow: 'hidden',
          m: { xs: 1, sm: 2 },
          maxHeight: { xs: '95vh', sm: '90vh' },
        },
      }}
    >
      {/* Close button */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 8, sm: 16 },
          right: { xs: 8, sm: 16 },
          zIndex: 10,
        }}
      >
      </Box>

      <DialogContent sx={{ p: { xs: 2, sm: 4 }, pt: { xs: 3, sm: 5 }, overflowY: 'auto' }}>
        {/* Header with badge */}
        <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 3 } }}>
          <Box
            component="img"
            src="/images/cand.png"
            alt="Police Badge"
            sx={{
              width: { xs: 80, sm: 100 },
              height: { xs: 64, sm: 80 },
              mb: { xs: 1.5, sm: 2 },
              mx: 'auto',
              display: 'block',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
            }}
            onError={(e) => {
              // Fallback if image not found
              e.currentTarget.style.display = 'none';
            }}
          />
          <Typography
            variant="h5"
            sx={{
              color: '#fef3c7',
              fontWeight: 700,
              textTransform: 'uppercase',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
              mb: 0.5,
              fontSize: { xs: '1rem', sm: '1.5rem' },
            }}
          >
            {t('leaderboard.warning.department')}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#fde68a',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {t('leaderboard.warning.subtitle')}
          </Typography>
        </Box>

        {/* Warning content */}
        <Box
          sx={{
            bgcolor: 'rgba(254, 243, 199, 0.95)',
            borderRadius: { xs: 2, sm: 3 },
            p: { xs: 2, sm: 3 },
            mb: { xs: 2, sm: 3 },
            border: '2px solid #fbbf24',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: '#dc2626',
              fontWeight: 800,
              textAlign: 'center',
              mb: 2,
              fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
              lineHeight: 1.3,
            }}
          >
            {t('leaderboard.warning.title')}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: { xs: 2, sm: 3 }, mb: 2 }}>
            {/* Left: Deny bet image */}
            <Box
              sx={{
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Box
                component="img"
                src="/images/denybet.png"
                alt="Deny Betting"
                sx={{
                  width: { xs: 100, sm: 130 },
                  height: { xs: 100, sm: 130 },
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </Box>

            {/* Right: Info boxes stacked */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 2,
                  bgcolor: '#eff6ff',
                  borderRadius: 2,
                  border: '1px solid #bfdbfe',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                }}
              >
                <Box sx={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>🔒</Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#1e40af',
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  {t('leaderboard.warning.dataProtection')}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 2,
                  bgcolor: '#eff6ff',
                  borderRadius: 2,
                  border: '1px solid #bfdbfe',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                }}
              >
                <Box sx={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>👮</Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#1e40af',
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  {t('leaderboard.warning.enforcement')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Footer message */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            p: { xs: 1.5, sm: 2 },
            bgcolor: 'rgba(254, 243, 199, 0.3)',
            borderRadius: 2,
          }}
        >
          <WarningAmberIcon sx={{ color: '#fbbf24', fontSize: { xs: 18, sm: 20 }, flexShrink: 0 }} />
          <Typography
            variant="caption"
            sx={{
              color: '#fef3c7',
              fontWeight: 600,
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            {t('leaderboard.warning.footer')}
          </Typography>
        </Box>

        {/* Additional footer info */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            p: { xs: 1.5, sm: 2 },
            mt: 2,
            bgcolor: 'rgba(169, 249, 229, 0.2)',
            borderRadius: 2,
            border: '1px solid rgba(251, 191, 36, 0.3)',
          }}
        >
          <CheckCircleOutlinedIcon sx={{ color: '#17ccab', fontSize: { xs: 18, sm: 20 }, flexShrink: 0 }} />
          <Typography
            variant="caption"
            sx={{
              color: '#3cd7a6',
              fontWeight: 500,
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              textAlign: 'center',
              fontStyle: 'italic',
              lineHeight: 1.4,
            }}
          >
            {t('leaderboard.warning.footer2')}
          </Typography>
        </Box>

        
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: 'center',
          pb: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 4 },
        }}
      >
        <Button
          onClick={onAccept}
          variant="contained"
          size="large"
          sx={{
            bgcolor: '#fbbf24',
            color: '#7f1d1d',
            fontWeight: 700,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            px: { xs: 4, sm: 6 },
            py: { xs: 1.25, sm: 1.5 },
            borderRadius: 2,
            textTransform: 'uppercase',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            minHeight: 44,
            '&:hover': {
              bgcolor: '#f59e0b',
            },
          }}
        >
          {t('leaderboard.warning.understood')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
