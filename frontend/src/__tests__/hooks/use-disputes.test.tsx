import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useDisputes, useCreateDispute } from '@/hooks/use-disputes';

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

describe('useDisputes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be disabled when contractId is empty', () => {
    const { result } = renderHook(() => useDisputes(''), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('should be loading when contractId is provided', () => {
    const { result } = renderHook(() => useDisputes('contract-1'), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
  });
});

describe('useCreateDispute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not crash when rendered', () => {
    const { result } = renderHook(() => useCreateDispute(), {
      wrapper: createWrapper(),
    });
    expect(result.current).toBeDefined();
    expect(result.current.isIdle).toBe(true);
  });
});
