import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  Prayer,
  UserPrayerStats,
  prayerService,
} from '@/services/prayer.service';

interface PrayerState {
  prayers: Prayer[];
  userPrayers: Prayer[];
  userStats: UserPrayerStats | null;
  prayerCounts: { [stupaId: string]: number };
  loading: boolean;
  error: string | null;
}

const initialState: PrayerState = {
  prayers: [],
  userPrayers: [],
  userStats: null,
  prayerCounts: {},
  loading: false,
  error: null,
};

export const offerPrayer = createAsyncThunk(
  'prayer/offerPrayer',
  async (input: {
    stupaId: string;
    text?: string;
    isPrivate?: boolean;
    language?: string;
  }) => {
    return await prayerService.offerPrayer(input);
  }
);

export const getPrayers = createAsyncThunk(
  'prayer/getPrayers',
  async ({ stupaId, limit }: { stupaId: string; limit?: number }) => {
    return await prayerService.getPrayers(stupaId, limit);
  }
);

export const getUserPrayers = createAsyncThunk(
  'prayer/getUserPrayers',
  async (userId: string) => {
    return await prayerService.getUserPrayers(userId);
  }
);

export const getPrayerCount = createAsyncThunk(
  'prayer/getPrayerCount',
  async (stupaId: string) => {
    const count = await prayerService.getPrayerCount(stupaId);
    return { stupaId, count };
  }
);

export const getUserPrayerStats = createAsyncThunk(
  'prayer/getUserPrayerStats',
  async (userId: string) => {
    return await prayerService.getUserPrayerStats(userId);
  }
);

const prayerSlice = createSlice({
  name: 'prayer',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Offer Prayer
    builder
      .addCase(offerPrayer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(offerPrayer.fulfilled, (state, action) => {
        state.loading = false;
        state.prayers.unshift(action.payload);
        state.userPrayers.unshift(action.payload);
        if (state.prayerCounts[action.payload.stupaId]) {
          state.prayerCounts[action.payload.stupaId]++;
        }
      })
      .addCase(offerPrayer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to offer prayer';
      });

    // Get Prayers
    builder
      .addCase(getPrayers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPrayers.fulfilled, (state, action) => {
        state.loading = false;
        state.prayers = action.payload;
      })
      .addCase(getPrayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get prayers';
      });

    // Get User Prayers
    builder
      .addCase(getUserPrayers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserPrayers.fulfilled, (state, action) => {
        state.loading = false;
        state.userPrayers = action.payload;
      })
      .addCase(getUserPrayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get user prayers';
      });

    // Get Prayer Count
    builder
      .addCase(getPrayerCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPrayerCount.fulfilled, (state, action) => {
        state.loading = false;
        state.prayerCounts[action.payload.stupaId] = action.payload.count;
      })
      .addCase(getPrayerCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get prayer count';
      });

    // Get User Prayer Stats
    builder
      .addCase(getUserPrayerStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserPrayerStats.fulfilled, (state, action) => {
        state.loading = false;
        state.userStats = action.payload;
      })
      .addCase(getUserPrayerStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get user prayer stats';
      });
  },
});

export const { clearError } = prayerSlice.actions;
export default prayerSlice.reducer; 