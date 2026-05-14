# Music Player Guide

## Overview
The World Cup 2026 app now includes a built-in music player on the header center. When users log in, a random song from the music folder will be selected and ready to play.

## Features
- **Automatic Loading**: Songs are loaded from the \/public/music\ folder
- **Random Start**: When the app loads, a random song is selected
- **Controls**:
  - \Play/Pause\: Toggle between playing and pausing
  - \Previous\: Go to previous song (or restart current if >3s in)
  - \Next\: Skip to the next song
  - \Volume Control\: Adjust volume (visible on desktop)
  - \Progress Bar\: Seek to any part of the song (visible on desktop)

## Supported Audio Formats
- MP3 (\.mp3\)
- WAV (\.wav\)
- OGG (\.ogg\)
- M4A (\.m4a\)

## How to Add Music

1. Place your audio files in \WEB/public/music/\ folder
2. Example structure:
   \\\
   WEB/
   ├── public/
   │   └── music/
   │       ├── song1.mp3
   │       ├── song2.mp3
   │       ├── background-music.wav
   │       └── .gitkeep
   \\\

3. Supported file names:
   - \	heme.mp3\
   - \ackground_music.mp3\
   - \world_cup_anthem.wav\
   - Any valid audio filename

## File Structure

### Components
- **MusicPlayer** (\src/components/MusicPlayer.tsx\): UI component for the player
- **MusicContext** (\src/contexts/MusicContext.tsx\): State management

### How It Works
1. \MusicProvider\ wraps the entire app (in \main.tsx\)
2. Automatically discovers songs from \/public/music/\ on app load
3. Randomly selects initial song
4. \MusicPlayer\ component displays in header center
5. All playback controls are managed by the context

## Responsive Design
- **Desktop (md+)**: Full player with progress bar and volume slider
- **Tablet (sm+)**: Player with controls and volume
- **Mobile (xs)**: Compact player with song info and basic controls

## Implementation Details

### Loading Songs
The music context uses Vite's \import.meta.glob\ to discover all audio files:
\\\	ypescript
const dynamicImport = import.meta.glob('/public/music/*.{mp3,wav,ogg,m4a}');
const paths = Object.keys(dynamicImport);
\\\

### Audio Element
- Uses HTML5 \<audio>\ element for playback
- CORS attribute set to \nonymous\ for broader compatibility
- Automatic next song on track end

### State Management
Song data stored in context with:
- \currentSongIndex\: Current playing song
- \isPlaying\: Play/pause state
- \currentTime\ & \duration\: Track progress
- \olume\: 0-1 range

## Tips
1. Use high-quality MP3s (128-320 kbps) for good balance between size and quality
2. Keep file names descriptive for easy identification
3. Test playback on different browsers
4. For large music libraries, consider organizing by subfolders (future enhancement)

## Troubleshooting

### No Songs Appear
- Check files are in \WEB/public/music/\ folder
- Verify file extensions match supported formats
- Ensure file names don't have special characters
- Check browser console for error messages

### Playback Issues
- Some browsers require user interaction before auto-play
- Check browser audio/media permissions
- Verify CORS settings if hosting externally
- Test with different audio formats

## Future Enhancements
- [ ] Shuffle mode
- [ ] Repeat options
- [ ] Playlist management
- [ ] Volume persistence
- [ ] Recently played
- [ ] Visualizer
- [ ] Keyboard shortcuts
