import { configureStore } from '@reduxjs/toolkit';
import stupaReducer from './slices/stupaSlice';
import prayerReducer from './slices/prayerSlice';
import videoReducer from './slices/videoSlice';

export const store = configureStore({
  reducer: {
    stupa: stupaReducer,
    prayer: prayerReducer,
    video: videoReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 