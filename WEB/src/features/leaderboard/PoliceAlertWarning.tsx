import { Dialog, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
          borderRadius: 4,
          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #dc2626 100%)',
          border: '4px solid #fbbf24',
          position: 'relative',
          overflow: 'hidden',
        },
      }}
    >
      {/* Close button */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            minWidth: 'auto',
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid #fbbf24',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          <CloseIcon sx={{ color: '#fbbf24', fontSize: 28 }} />
        </Button>
      </Box>

      <DialogContent sx={{ p: 4, pt: 5 }}>
        {/* Header with badge */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            component="img"
            src="/images/cand.png"
            alt="Police Badge"
            sx={{
              width: 100,
              height: 80,
              mb: 2,
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
            }}
          >
            {t('leaderboard.warning.department')}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#fde68a',
              fontSize: '0.75rem',
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
            borderRadius: 3,
            p: 3,
            mb: 3,
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
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
            }}
          >
            {t('leaderboard.warning.title')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                minWidth: 80,
                mr: 2,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: '#dc2626',
                  border: '3px solid #991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    fontSize: '2rem',
                    lineHeight: 1,
                  }}
                >
                  🎰
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '4px solid #dc2626',
                    transform: 'rotate(45deg)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      width: '120%',
                      height: 4,
                      bgcolor: '#dc2626',
                      top: '50%',
                      left: '-10%',
                      transform: 'translateY(-50%)',
                    },
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#1f2937',
                  lineHeight: 1.6,
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                }}
              >
                {t('leaderboard.warning.description')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 2,
                bgcolor: '#dbeafe',
                borderRadius: 2,
                border: '1px solid #3b82f6',
              }}
            >
              <Box
                sx={{
                  fontSize: '1.5rem',
                  lineHeight: 1,
                }}
              >
                🔒
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#1e40af',
                  fontSize: '0.75rem',
                  lineHeight: 1.4,
                }}
              >
                {t('leaderboard.warning.dataProtection')}
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 2,
                bgcolor: '#dbeafe',
                borderRadius: 2,
                border: '1px solid #3b82f6',
              }}
            >
              <Box
                sx={{
                  fontSize: '1.5rem',
                  lineHeight: 1,
                }}
              >
                👮
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#1e40af',
                  fontSize: '0.75rem',
                  lineHeight: 1.4,
                }}
              >
                {t('leaderboard.warning.enforcement')}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer message */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            p: 2,
            bgcolor: 'rgba(254, 243, 199, 0.3)',
            borderRadius: 2,
          }}
        >
          <WarningAmberIcon sx={{ color: '#fbbf24', fontSize: 20 }} />
          <Typography
            variant="caption"
            sx={{
              color: '#fef3c7',
              fontWeight: 600,
              fontSize: '0.8rem',
              textAlign: 'center',
            }}
          >
            {t('leaderboard.warning.footer')}
          </Typography>
        </Box>

        {/* Additional footer info */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            p: 2,
            mt: 2,
            bgcolor: 'rgba(169, 249, 229, 0.2)',
            borderRadius: 2,
            border: '1px solid rgba(251, 191, 36, 0.3)',
          }}
        >
          <CheckCircleOutlinedIcon sx={{ color: '#17ccab', fontSize: 20 }} />
          <Typography
            variant="caption"
            sx={{
              color: '#3cd7a6',
              fontWeight: 500,
              fontSize: '0.75rem',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            {t('leaderboard.warning.footer2')}
          </Typography>
        </Box>

        
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: 'center',
          pb: 3,
          px: 4,
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
            fontSize: '1rem',
            px: 6,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'uppercase',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
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
