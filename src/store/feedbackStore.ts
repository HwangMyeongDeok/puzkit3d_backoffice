import { create } from 'zustand';

interface FeedbackFilter {
  search: string;
  rating: number | 'all';
  setSearch: (val: string) => void;
  setRating: (val: number | 'all') => void;
}

export const useFeedbackStore = create<FeedbackFilter>((set) => ({
  search: '',
  rating: 'all',
  setSearch: (val) => set({ search: val }),
  setRating: (val) => set({ rating: val }),
}));