import type { Theme } from '@mui/material';
import type { SystemStyleObject } from '@mui/system';

/**
 * Shared input styling for all forms — border-radius, background,
 * font sizes, hover/focus states, and label styling.
 * Add spacing (mt, mb) at the consumer level via array sx: sx={[inputSx, { mt: 2 }]}
 */
export const inputSx: SystemStyleObject<Theme> = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    fontSize: '0.875rem',
    backgroundColor: '#f8fafc',
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', borderWidth: 2 },
  },
  '& .MuiInputLabel-root': { fontSize: '0.8rem', fontWeight: 500 },
  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
};
