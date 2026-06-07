import { Dialog, IconButton, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const STEPS_CONFIG = [
  {
    key: 'joinGroup',
    icon: <GroupIcon sx={{ fontSize: 28 }} />,
    color: 'from-blue-500 to-blue-600',
    image: '/help/join-group.png',
    stepCount: 4,
  },
  {
    key: 'placeBet',
    icon: <SportsSoccerIcon sx={{ fontSize: 28 }} />,
    color: 'from-emerald-500 to-emerald-600',
    image: '/help/place-bet.png',
    stepCount: 6,
  },
  {
    key: 'viewBets',
    icon: <VisibilityIcon sx={{ fontSize: 28 }} />,
    color: 'from-purple-500 to-purple-600',
    image: '/help/view-match.png',
    stepCount: 4,
  },
  {
    key: 'myBets',
    icon: <FavoriteBorderIcon sx={{ fontSize: 28 }} />,
    color: 'from-pink-500 to-pink-600',
    image: '/help/my-bets.png',
    stepCount: 5,
  },
  {
    key: 'leaderboard',
    icon: <EmojiEventsIcon sx={{ fontSize: 28 }} />,
    color: 'from-amber-500 to-amber-600',
    image: '/help/leaderboard.png',
    stepCount: 5,
  },
  {
    key: 'champion',
    icon: <MilitaryTechIcon sx={{ fontSize: 28 }} />,
    color: 'from-indigo-500 to-indigo-600',
    image: '/help/champion.png',
    stepCount: 5,
  },
];

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const step = STEPS_CONFIG[activeStep];
  const instructions = Array.from({ length: step.stepCount }, (_, i) => t(`help.steps.${step.key}.step${i + 1}`));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 4,
          overflow: 'hidden',
          bgcolor: '#f8fafc',
          maxHeight: isMobile ? '100vh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 sm:px-8 pt-5 pb-6">
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.8)', zIndex: 1, '&:hover': { color: 'white' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <HelpOutlineOutlinedIcon fontSize="medium" /> {t('help.title')}
        </h2>
        <p className="text-sm text-slate-400 mt-1">{t('help.subtitle')}</p>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 mt-4 overflow-x-auto scrollbar-hide pb-1">
          {STEPS_CONFIG.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0
                ${activeStep === i
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                ${activeStep === i ? 'bg-slate-900 text-white' : 'bg-slate-700 text-slate-400'}`}
              >
                {i + 1}
              </span>
              {(!isMobile || activeStep === i) && t(`help.steps.${s.key}.title`)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-8">
        {/* Step header */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg`}>
            {step.icon}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t(`help.steps.${step.key}.title`)}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{t(`help.steps.${step.key}.description`)}</p>
          </div>
        </div>

        {/* Screenshot */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg mb-6">
          <img
            src={step.image}
            alt={t(`help.steps.${step.key}.title`)}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('help.stepsLabel')}</p>
          <ol className="space-y-2.5">
            {instructions.map((instruction, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 leading-relaxed">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-t border-gray-200 bg-white">
        <button
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          disabled={activeStep === 0}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {t('help.navigation.previous')}
        </button>
        <span className="text-xs text-slate-400 font-medium">
          {activeStep + 1} / {STEPS_CONFIG.length}
        </span>
        {activeStep < STEPS_CONFIG.length - 1 ? (
          <button
            onClick={() => setActiveStep(activeStep + 1)}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all active:scale-95"
          >
            {t('help.navigation.next')}
            <ArrowForwardIcon sx={{ fontSize: 16 }} />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-sm transition-all active:scale-95"
          >
            {t('help.navigation.gotIt')}
          </button>
        )}
      </div>
    </Dialog>
  );
}
