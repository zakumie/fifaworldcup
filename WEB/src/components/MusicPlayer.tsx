import { Dialog, IconButton, Slider, useMediaQuery, useTheme } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import CloseIcon from '@mui/icons-material/Close';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import { useMusic, Song } from '../contexts/MusicContext';
import { useRef, useEffect } from 'react';

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1446057032654-9d8885db76c6?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop',
];

function getCoverForSong(index: number) {
  return COVER_IMAGES[index % COVER_IMAGES.length];
}

function SongListItem({ song, index, isActive, isMobile, onClick }: {
  song: Song; index: number; isActive: boolean; isMobile: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center rounded-xl transition-all duration-200 
        ${isMobile ? 'gap-2.5 px-2.5 py-2' : 'gap-3 px-3 py-2'}
        ${isActive
          ? 'bg-gradient-to-r from-blue-500/15 to-purple-500/10 ring-1 ring-blue-400/30 shadow-sm shadow-blue-500/10'
          : 'hover:bg-white/[0.06] active:bg-white/10'
        }`}
    >
      {/* Track number / playing indicator */}
      <div className={`shrink-0 flex items-center justify-center ${isMobile ? 'w-5' : 'w-6'}`}>
        {isActive ? (
          <GraphicEqIcon sx={{ fontSize: isMobile ? 14 : 16, color: '#60a5fa', animation: 'pulse 1.5s infinite' }} />
        ) : (
          <span className="text-[11px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
            {String(index + 1).padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Thumbnail */}
      <div className="relative shrink-0">
        <img
          src={getCoverForSong(index)}
          alt={song.name}
          className={`rounded-lg object-cover shadow-md transition-all duration-200
            ${isMobile ? 'w-9 h-9' : 'w-10 h-10'}
            ${isActive
              ? 'ring-2 ring-blue-400/60 shadow-blue-500/20'
              : 'group-hover:shadow-lg group-hover:scale-105'
            }`}
        />
        {isActive && (
          <div className="absolute inset-0 rounded-lg bg-black/20 flex items-center justify-center">
            <MusicNoteIcon sx={{ fontSize: isMobile ? 14 : 16, color: 'white', opacity: 0.9 }} />
          </div>
        )}
      </div>

      {/* Song info */}
      <div className="flex-1 min-w-0 text-left">
        <p className={`font-semibold truncate transition-colors
          ${isMobile ? 'text-[13px]' : 'text-sm'}
          ${isActive ? 'text-blue-300' : 'text-slate-200 group-hover:text-white'}`}
        >
          {song.name}
        </p>
        <p className={`text-blue-400/50 ${isMobile ? 'text-[10px]' : 'text-[11px]'}`}>World Cup 2026</p>
      </div>

      {/* Now playing badge */}
      {isActive && (
        <span className={`shrink-0 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-400/20
          ${isMobile ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}
        >
          PLAYING
        </span>
      )}
    </button>
  );
}

interface MusicPlayerDialogProps {
  open: boolean;
  onClose: () => void;
}

export function MusicPlayerDialog({ open, onClose }: MusicPlayerDialogProps) {
  const {
    songs, currentSong, currentSongIndex, isPlaying,
    play, pause, nextSong, prevSong, setSongIndex,
    volume, setVolume, currentTime, duration, seek,
  } = useMusic();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const playlistRef = useRef<HTMLDivElement>(null);
  const progress = duration ? (currentTime / duration) * 100 : 0;

  // Auto-scroll to active song
  useEffect(() => {
    if (!open || !playlistRef.current) return;
    const activeEl = playlistRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentSongIndex, open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 4,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #0f172a 0%, #0c1a3a 40%, #0a1628 100%)',
          maxHeight: isMobile ? '100vh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Close button */}
      <IconButton
        onClick={onClose}
        size="small"
        sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255, 255, 255, 0.84)', zIndex: 1, '&:hover': { color: 'white' } }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      {/* ─── Now Playing Card ─── */}
      <div className={isMobile ? 'px-6 pt-6 pb-3' : 'px-10 pt-4 pb-4'}>
        <div className="relative bg-gradient-to-t from-white/10 to-slate-400/60 rounded-xl shadow-xl ring-1 ring-white/10"
          style={{ padding: isMobile ? '0px' : '0px', marginTop: '15px' }}
        >
          {/* Cover art */}
          <div className="mb-4">
            <div className="relative">
              <img
                src={currentSong ? getCoverForSong(currentSongIndex) : COVER_IMAGES[0]}
                alt={currentSong?.name || 'No song'}
                className="w-full h-48 mb-4 aspect-square rounded-t-xl object-cover shadow-2xl"
              />
              {isPlaying && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                  <MusicNoteIcon sx={{ fontSize: 14, color: 'white' }} />
                </div>
              )}
            </div>
          </div>

          {/* Song info */}
          <div className="text-center mb-4">
            <h3 className="text-base sm:text-lg font-bold text-white truncate">{currentSong?.name || 'No songs available'}</h3>
            <p className="text-xs text-blue-300/70 mt-0.5">World Cup 2026</p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-mono text-slate-400 tabular-nums w-9 text-right">{formatTime(currentTime)}</span>
            <Slider
              size="small"
              value={progress}
              onChange={(_, v) => { if (typeof v === 'number' && duration) seek((v / 100) * duration); }}
              sx={{
                flex: 1, height: 4,
                color: '#60a5fa',
                '& .MuiSlider-thumb': { width: 12, height: 12, bgcolor: 'white', boxShadow: '0 0 8px rgba(96,165,250,0.5)' },
                '& .MuiSlider-track': { bgcolor: '#60a5fa' },
                '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.15)' },
              }}
            />
            <span className="text-[11px] font-mono text-slate-400 tabular-nums w-9">{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <IconButton onClick={prevSong} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
              <SkipPreviousIcon sx={{ fontSize: 28 }} />
            </IconButton>
            <IconButton
              onClick={isPlaying ? pause : play}
              sx={{
                width: 52, height: 52,
                bgcolor: 'white', color: '#0f172a',
                boxShadow: '0 4px 20px rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: '#e2e8f0', transform: 'scale(1.05)' },
                transition: 'all 0.2s',
              }}
            >
              {isPlaying ? <PauseIcon sx={{ fontSize: 28 }} /> : <PlayArrowIcon sx={{ fontSize: 28 }} />}
            </IconButton>
            <IconButton onClick={nextSong} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
              <SkipNextIcon sx={{ fontSize: 28 }} />
            </IconButton>
          </div>

          {/* Volume */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <IconButton
              size="small"
              onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
              sx={{ color: 'rgba(255,255,255,0.5)', p: 0.5 }}
            >
              {volume === 0 ? <VolumeOffIcon sx={{ fontSize: 16 }} /> : <VolumeUpIcon sx={{ fontSize: 16 }} />}
            </IconButton>
            <Slider
              size="small"
              value={volume * 100}
              onChange={(_, v) => { if (typeof v === 'number') setVolume(v / 100); }}
              sx={{
                width: 100, height: 3,
                color: 'rgba(255,255,255,0.4)',
                '& .MuiSlider-thumb': { width: 10, height: 10, bgcolor: 'white' },
                '& .MuiSlider-track': { bgcolor: 'rgba(255,255,255,0.6)' },
                '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── Playlist ─── */}
      <div className={`flex-1 min-h-0 flex flex-col ${isMobile ? 'px-3 pb-4' : 'px-4 pb-5'}`}>
        {/* Playlist header */}
        <div className="flex items-center gap-2 px-2 py-2 shrink-0">
          <QueueMusicIcon sx={{ fontSize: 16, color: 'rgba(148,163,184,0.6)' }} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400/80">
            Playlist
          </span>
          <span className="text-[10px] text-slate-500 ml-auto font-mono">{songs.length} songs</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-2 mb-1.5 shrink-0" />

        {/* Song list */}
        <div
          ref={playlistRef}
          className={`flex-1 overflow-y-auto overscroll-contain ${isMobile ? 'max-h-[40vh]' : 'max-h-[240px]'}`}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.15) transparent',
          }}
        >
          <div className="space-y-0.5">
            {songs.map((song, i) => (
              <div key={song.id} data-active={i === currentSongIndex}>
                <SongListItem
                  song={song}
                  index={i}
                  isActive={i === currentSongIndex}
                  isMobile={isMobile}
                  onClick={() => setSongIndex(i)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}