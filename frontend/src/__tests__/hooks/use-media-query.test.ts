import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '@/hooks/use-media-query';

describe('useMediaQuery', () => {
  let listeners: Array<(e?: { matches: boolean }) => void>;

  beforeEach(() => {
    listeners = [];
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      const mql = {
        matches: query === '(min-width: 768px)',
        media: query,
        addEventListener: (_event: string, handler: (e?: { matches: boolean }) => void) => {
          listeners.push(handler);
        },
        removeEventListener: vi.fn(),
      };
      return mql;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true when query matches', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('should return false when query does not match', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1200px)'));
    expect(result.current).toBe(false);
  });

  it('should update matches on change event', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);

    act(() => {
      const handler = listeners[0];
      if (handler) {
        handler({ matches: false });
      }
    });

    expect(result.current).toBe(false);
  });

  it('should clean up event listener on unmount', () => {
    const removeMock = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: vi.fn(),
      removeEventListener: removeMock,
    });

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    unmount();
    expect(removeMock).toHaveBeenCalledTimes(1);
  });
});
