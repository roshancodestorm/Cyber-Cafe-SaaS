import { create } from 'zustand';

export interface ActivePC {
  id: string;
  pcNumber: number;
  userId: string | null;
  status: 'available' | 'in-use' | 'maintenance' | 'offline';
  timeRemaining?: number;
}

interface AdminStore {
  activePCs: ActivePC[];
  dailyRevenue: number;
  activeUsersCount: number;
  setPCs: (pcs: ActivePC[]) => void;
  updatePCStatus: (pcNumber: number, status: ActivePC['status']) => void;
  setDailyRevenue: (revenue: number) => void;
}

const mockPCs: ActivePC[] = Array.from({ length: 20 }, (_, i) => ({
  id: `pc-${i + 1}`,
  pcNumber: i + 1,
  userId: i < 5 ? `user-${i}` : null,
  status: i < 5 ? 'in-use' : i === 19 ? 'maintenance' : 'available',
  timeRemaining: i < 5 ? Math.floor(Math.random() * 120) + 10 : undefined,
}));

export const useAdminStore = create<AdminStore>((set) => ({
  activePCs: mockPCs,
  dailyRevenue: 450.50,
  activeUsersCount: 5,
  setPCs: (pcs) => set({ activePCs: pcs }),
  updatePCStatus: (pcNumber, status) =>
    set((state) => ({
      activePCs: state.activePCs.map((pc) =>
        pc.pcNumber === pcNumber ? { ...pc, status } : pc
      ),
    })),
  setDailyRevenue: (revenue) => set({ dailyRevenue: revenue }),
}));
