import { useEffect, useState, useCallback } from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface Props {
  closeTime: string;
}

export default function PredictionDeadlineTimer({ closeTime }: Props) {
  const [timeLeft, setTimeLeft] = useState('--:--:--');
  const [isPassed, setIsPassed] = useState(false);
  const [days, setDays] = useState(0);

  const updateTimer = useCallback(() => {
    const diff = new Date(closeTime).getTime() - Date.now();
    if (diff <= 0) {
      setTimeLeft('00:00:00');
      setIsPassed(true);
      return;
    }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    setDays(d);
    setTimeLeft(
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    );
  }, [closeTime]);

  useEffect(() => {
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [updateTimer]);

  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border backdrop-blur ${
      isPassed
        ? 'bg-red-100/80 border-red-300'
        : 'bg-white/20 border-white/30'
    }`}>
      <AccessTimeIcon sx={{ fontSize: 18, color: isPassed ? '#dc2626' : '#78350f' }} />
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${isPassed ? 'text-red-700' : 'text-amber-900/70'}`}>
          {isPassed ? 'Expired' : 'Time Left'}
        </p>
        <p className={`text-base font-mono font-black tracking-wide ${isPassed ? 'text-red-600' : 'text-amber-950'}`}>
          {days > 0 && <span>{days}d </span>}{timeLeft}
        </p>
      </div>
    </div>
  );
}
