import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useContracts, useContract, useCreateContract } from '@/hooks/use-contracts';

vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useContracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not crash when rendered', () => {
    const { result } = renderHook(() => useContracts(), {
      wrapper: createWrapper(),
    });
    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(true);
  });
});

describe('useContract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be disabled when id is empty', () => {
    const { result } = renderHook(() => useContract(''), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('should be loading when id is provided', () => {
    const { result } = renderHook(() => useContract('test-id'), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
  });
});

describe('useCreateContract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not crash when rendered', () => {
    const { result } = renderHook(() => useCreateContract(), {
      wrapper: createWrapper(),
    });
    expect(result.current).toBeDefined();
    expect(result.current.isIdle).toBe(true);
  });
});
