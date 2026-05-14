import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

export interface Song {
  id: string;
  name: string;
  path: string;
}

interface MusicContextType {
  songs: Song[];
  currentSongIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  play: () => void;
  pause: () => void;
  nextSong: () => void;
  prevSong: () => void;
  setSongIndex: (index: number) => void;
  setVolume: (vol: number) => void;
  seek: (time: number) => void;
  currentSong: Song | null;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadSongs = async () => {
      try {
        const modules = import.meta.glob<true>('/public/music/*.{mp3,wav,ogg,m4a}', { eager: false });
        const paths = Object.keys(modules);
        
        if (paths.length > 0) {
          const loadedSongs: Song[] = paths.map((path, index) => {
            const filename = path.split('/').pop() || `Song ${index + 1}`;
            const name = filename.replace(/\.[^/.]+$/, '');
            return {
              id: `song-${index}`,
              name,
              path: path.replace('/public', ''),
            };
          });
          setSongs(loadedSongs);
          const randomIndex = Math.floor(Math.random() * loadedSongs.length);
          setCurrentSongIndex(randomIndex);
        }
      } catch (error) {
        console.error('Error loading songs:', error);
      }
    };
    loadSongs();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => nextSong();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || songs.length === 0) return;

    if (isPlaying) {
      audio.play().catch(err => console.error('Playback error:', err));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSongIndex, songs]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || songs.length === 0) return;

    const currentSong = songs[currentSongIndex];
    audio.src = currentSong.path;
    setCurrentTime(0);
    
    if (isPlaying) {
      audio.play().catch(err => console.error('Playback error:', err));
    }
  }, [currentSongIndex, songs]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);

  const nextSong = () => {
    if (songs.length === 0) return;
    setCurrentSongIndex((prev) => (prev + 1) % songs.length);
    setIsPlaying(true);
  };

  const prevSong = () => {
    if (songs.length === 0) return;
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    } else {
      setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
    }
    setIsPlaying(true);
  };

  const setSongIndex = (index: number) => {
    if (index >= 0 && index < songs.length) {
      setCurrentSongIndex(index);
      setIsPlaying(true);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const currentSong = songs.length > 0 ? songs[currentSongIndex] : null;

  return (
    <MusicContext.Provider
      value={{
        songs,
        currentSongIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        play,
        pause,
        nextSong,
        prevSong,
        setSongIndex,
        setVolume,
        seek,
        currentSong,
      }}
    >
      <audio ref={audioRef} crossOrigin="anonymous" />
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within MusicProvider');
  }
  return context;
}
