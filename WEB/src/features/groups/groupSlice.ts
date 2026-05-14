import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GroupState {
  selectedGroupId: string;
}

const initialState: GroupState = {
  selectedGroupId: '',
};

const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    setSelectedGroupId(state, action: PayloadAction<string>) {
      state.selectedGroupId = action.payload;
    },
  },
});

export const { setSelectedGroupId } = groupSlice.actions;
export default groupSlice.reducer;
