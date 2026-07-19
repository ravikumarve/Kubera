import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/stores/ui-store';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: true });
  });

  it('should have sidebar open by default', () => {
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('should toggle sidebar from true to false', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it('should toggle sidebar from false to true', () => {
    useUIStore.getState().toggleSidebar();
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('should toggle multiple times correctly', () => {
    useUIStore.getState().toggleSidebar();
    useUIStore.getState().toggleSidebar();
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });
});
