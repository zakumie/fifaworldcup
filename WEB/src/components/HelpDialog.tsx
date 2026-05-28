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

const STEPS = [
  {
    icon: <GroupIcon sx={{ fontSize: 28 }} />,
    color: 'from-blue-500 to-blue-600',
    title: 'Join a Group',
    description: 'Start by joining a betting group using an invite code from your friends or create your own group.',
    instructions: [
      'Go to the Groups page from the sidebar menu',
      'Click the "Join Group" button at the top',
      'Enter the invite code shared by your group admin',
      'Once joined, you\'ll see the group in your list with members count and default balance',
    ],
    image: '/help/join-group.png',
  },
  {
    icon: <VisibilityIcon sx={{ fontSize: 28 }} />,
    color: 'from-purple-500 to-purple-600',
    title: 'View Match Bets',
    description: 'After a match starts or finishes, see how other members in your group have bet.',
    instructions: [
      'On a Live or Finished match card, click the "View" button',
      'See all group members\' bets with their avatars and chosen teams',
      'The winning team column is highlighted after settlement',
      'Track who won and who lost in each match',
    ],
    image: '/help/match-center.png',
  },
  {
    icon: <SportsSoccerIcon sx={{ fontSize: 28 }} />,
    color: 'from-emerald-500 to-emerald-600',
    title: 'Place a Bet',
    description: 'Browse upcoming World Cup matches and place your predictions with virtual currency.',
    instructions: [
      'Navigate to the Match Center from the sidebar',
      'Find an upcoming match with a "Bet Now" button',
      'Click "Bet Now" to open the betting dialog',
      'Select which team you think will win (considering the handicap)',
      'Enter your bet amount within the allowed range',
      'Confirm your bet before the betting window closes',
    ],
    image: '/help/place-bet.png',
  },
  {
    icon: <FavoriteBorderIcon sx={{ fontSize: 28 }} />,
    color: 'from-pink-500 to-pink-600',
    title: 'My Bets',
    description: 'Track all your betting history — see your pending, won, and lost bets in one place.',
    instructions: [
      'Click "My Bets" in the sidebar menu',
      'View all your bets organized by match',
      'Filter by status: Pending, Won, Lost, or All',
      'See your profit/loss for each individual bet',
      'Also accessible from Match Center → "My Bets" tab',
    ],
    image: '/help/my-bets.png',
  },
  {
    icon: <EmojiEventsIcon sx={{ fontSize: 28 }} />,
    color: 'from-amber-500 to-amber-600',
    title: 'Leaderboard',
    description: 'Check the group rankings — see who\'s leading in profit, win rate, and total bets.',
    instructions: [
      'Go to the Leaderboard page from the sidebar',
      'See all members ranked by their performance',
      'Track stats: Balance, Profit, Win Rate, Total Bets',
      'The top 3 players are highlighted with medals 🥇🥈🥉',
      'Compare your performance against other group members',
    ],
    image: '/help/leaderboard.png',
  },
  {
    icon: <MilitaryTechIcon sx={{ fontSize: 28 }} />,
    color: 'from-indigo-500 to-indigo-600',
    title: 'Champion Prediction',
    description: 'The mini game! Predict which team will win the World Cup 2026 for bonus rewards.',
    instructions: [
      'From the Groups page, look for the "Predict Champion" button on your group card',
      'Browse all 48 participating teams organized by group',
      'Select the team you believe will win the World Cup',
      'Submit your prediction before the deadline',
      'If your team wins the tournament, you earn bonus points!',
    ],
    image: '/help/champion.png',
  },
];

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const step = STEPS[activeStep];

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
                <HelpOutlineOutlinedIcon fontSize="medium" /> How to Play
        </h2>
        <p className="text-sm text-slate-400 mt-1">Your guide to World Cup 2026 Predictions</p>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 mt-4 overflow-x-auto scrollbar-hide pb-1">
          {STEPS.map((s, i) => (
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
              {(!isMobile || activeStep === i) && s.title}
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
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{step.title}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
          </div>
        </div>

        {/* Screenshot */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg mb-6">
          <img
            src={step.image}
            alt={step.title}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Steps</p>
          <ol className="space-y-2.5">
            {step.instructions.map((instruction, i) => (
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
          Previous
        </button>
        <span className="text-xs text-slate-400 font-medium">
          {activeStep + 1} / {STEPS.length}
        </span>
        {activeStep < STEPS.length - 1 ? (
          <button
            onClick={() => setActiveStep(activeStep + 1)}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all active:scale-95"
          >
            Next
            <ArrowForwardIcon sx={{ fontSize: 16 }} />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-sm transition-all active:scale-95"
          >
            Got it!
          </button>
        )}
      </div>
    </Dialog>
  );
}
