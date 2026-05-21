import { useEffect, useState } from 'react';
import { Typography, Box } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface Props {
  closeTime: string;
}

export default function PredictionDeadlineTimer({ closeTime }: Props) {
  const [timeLeft, setTimeLeft] = useState<string>('--:--:--');
  const [isPassed, setIsPassed] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const deadline = new Date(closeTime).getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setIsPassed(true);
        return;
      }

      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [closeTime]);

  return (
    <Box className="flex items-center gap-2 px-3 py-2 bg-orange-100 rounded-lg border border-orange-300">
      <AccessTimeIcon sx={{ fontSize: 18, color: '#ea580c' }} />
      <div>
        <Typography variant="caption" className="text-orange-900 font-bold">
          Time Left
        </Typography>
        <Typography
          variant="body2"
          className={`font-mono font-bold ${isPassed ? 'text-red-600' : 'text-orange-600'}`}
        >
          {timeLeft}
        </Typography>
      </div>
    </Box>
  );
}
