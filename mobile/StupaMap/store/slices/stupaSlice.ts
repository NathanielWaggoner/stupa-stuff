import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { stupaService } from '@/services/stupa.service';

export interface Stupa {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
  videoUrls: string[];
  prayerCount: number;
  lastPrayerAt: string;
  osmId?: string;
  osmTags?: {
    'historic:stupa'?: string;
    'religion'?: string;
    'denomination'?: string;
    [key: string]: string | undefined;
  };
  lastOsmSync?: string;
}

interface StupaState {
  stupas: Stupa[];
  selectedStupa: Stupa | null;
  loading: boolean;
  error: string | null;
}

const initialState: StupaState = {
  stupas: [],
  selectedStupa: null,
  loading: false,
  error: null,
};

export const fetchStupasInRegion = createAsyncThunk(
  'stupa/fetchInRegion',
  async (region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
    return await stupaService.getStupasInRegion(region);
  }
);

export const addStupa = createAsyncThunk(
  'stupa/add',
  async (stupa: Omit<Stupa, 'id'>) => {
    return await stupaService.addStupa(stupa);
  }
);

export const updateStupa = createAsyncThunk(
  'stupa/update',
  async ({ stupaId, data }: { stupaId: string; data: Partial<Stupa> }) => {
    await stupaService.updateStupa(stupaId, data);
    return { stupaId, data };
  }
);

const stupaSlice = createSlice({
  name: 'stupa',
  initialState,
  reducers: {
    setSelectedStupa: (state, action: PayloadAction<Stupa | null>) => {
      state.selectedStupa = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Stupas
    builder
      .addCase(fetchStupasInRegion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStupasInRegion.fulfilled, (state, action) => {
        state.loading = false;
        state.stupas = action.payload;
      })
      .addCase(fetchStupasInRegion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch stupas';
      });

    // Add Stupa
    builder
      .addCase(addStupa.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addStupa.fulfilled, (state, action) => {
        state.loading = false;
        state.stupas.push(action.payload);
      })
      .addCase(addStupa.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add stupa';
      });

    // Update Stupa
    builder
      .addCase(updateStupa.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStupa.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.stupas.findIndex(s => s.id === action.payload.stupaId);
        if (index !== -1) {
          state.stupas[index] = {
            ...state.stupas[index],
            ...action.payload.data,
          };
        }
      })
      .addCase(updateStupa.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update stupa';
      });
  },
});

export const { setSelectedStupa, clearError } = stupaSlice.actions;
export default stupaSlice.reducer; 