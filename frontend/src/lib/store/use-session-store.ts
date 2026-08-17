import { create } from 'zustand';

interface UserSession {
  pcNumber: number | null;
  timeRemainingMinutes: number;
  balance: number;
  isActive: boolean;
}

interface SessionStore {
  session: UserSession;
  startSession: (pcNumber: number, initialBalance: number) => void;
  endSession: () => void;
  deductTime: (minutes: number) => void;
  addBalance: (amount: number) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  session: {
    pcNumber: null,
    timeRemainingMinutes: 0,
    balance: 0,
    isActive: false,
  },
  startSession: (pcNumber, initialBalance) =>
    set({
      session: {
        pcNumber,
        balance: initialBalance,
        timeRemainingMinutes: initialBalance * 60, // Assuming 1 unit of balance = 1 hour
        isActive: true,
      },
    }),
  endSession: () =>
    set({
      session: {
        pcNumber: null,
        timeRemainingMinutes: 0,
        balance: 0,
        isActive: false,
      },
    }),
  deductTime: (minutes) =>
    set((state) => ({
      session: {
        ...state.session,
        timeRemainingMinutes: Math.max(0, state.session.timeRemainingMinutes - minutes),
      },
    })),
  addBalance: (amount) =>
    set((state) => ({
      session: {
        ...state.session,
        balance: state.session.balance + amount,
        timeRemainingMinutes: state.session.timeRemainingMinutes + amount * 60,
      },
    })),
}));
