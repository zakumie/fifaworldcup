import { Tooltip, IconButton, Slider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { useMusic } from '../contexts/MusicContext';

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function MusicPlayer() {
  const { songs, currentSong, isPlaying, play, pause, nextSong, prevSong, volume, setVolume, currentTime, duration, seek } = useMusic();

  if (songs.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 text-slate-500 text-sm">
        <MusicNoteIcon sx={{ fontSize: 16 }} />
        <span>No songs</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary/5 to-primary/10 rounded-full border border-primary/20">
      <Tooltip title={currentSong?.name || 'Music Player'} placement="top">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <MusicNoteIcon sx={{ fontSize: 14, color: '#1a472a', flexShrink: 0 }} />
          <span className="text-xs font-medium text-slate-700 truncate">
            {currentSong?.name || 'Player'}
          </span>
        </div>
      </Tooltip>

      <div className="flex items-center gap-0.5">
        <Tooltip title="Previous">
          <IconButton size="small" onClick={prevSong} sx={{ padding: '4px', color: '#1a472a', '&:hover': { bgcolor: 'primary.main/10' } }}>
            <SkipPreviousIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
          <IconButton size="small" onClick={isPlaying ? pause : play} sx={{ padding: '4px', color: '#1a472a', '&:hover': { bgcolor: 'primary.main/10' } }}>
            {isPlaying ? <PauseIcon sx={{ fontSize: 16 }} /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Next">
          <IconButton size="small" onClick={nextSong} sx={{ padding: '4px', color: '#1a472a', '&:hover': { bgcolor: 'primary.main/10' } }}>
            <SkipNextIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </div>

      <div className="hidden md:flex items-center gap-2 min-w-max">
        <span className="text-xs font-medium text-slate-600">{formatTime(currentTime)}</span>
        <Slider size="small" value={duration ? (currentTime / duration) * 100 : 0} onChange={(_, newValue) => { if (typeof newValue === 'number' && duration) { seek((newValue / 100) * duration); } }} sx={{ width: 80, height: 4, '& .MuiSlider-thumb': { width: 10, height: 10, bgcolor: '#1a472a' }, '& .MuiSlider-track': { bgcolor: '#1a472a' }, '& .MuiSlider-rail': { bgcolor: '#cbd5e1' } }} />
        <span className="text-xs font-medium text-slate-600">{formatTime(duration)}</span>
      </div>

      <div className="hidden sm:flex items-center gap-1">
        <VolumeUpIcon sx={{ fontSize: 14, color: '#1a472a' }} />
        <Slider size="small" value={volume * 100} onChange={(_, newValue) => { if (typeof newValue === 'number') { setVolume(newValue / 100); } }} sx={{ width: 60, height: 4, '& .MuiSlider-thumb': { width: 8, height: 8, bgcolor: '#1a472a' }, '& .MuiSlider-track': { bgcolor: '#1a472a' }, '& .MuiSlider-rail': { bgcolor: '#cbd5e1' } }} />
      </div>
    </div>
  );
}