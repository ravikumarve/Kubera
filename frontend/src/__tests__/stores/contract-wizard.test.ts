import { describe, it, expect, beforeEach } from 'vitest';
import { useContractWizard } from '@/stores/contract-wizard';

describe('useContractWizard', () => {
  beforeEach(() => {
    useContractWizard.setState({
      step: 1,
      contract: {
        title: '',
        description: '',
        sellerEmail: '',
        amount: '',
        currency: 'USD',
        milestones: [],
      },
    });
  });

  it('should have correct initial state', () => {
    const state = useContractWizard.getState();
    expect(state.step).toBe(1);
    expect(state.contract).toEqual({
      title: '',
      description: '',
      sellerEmail: '',
      amount: '',
      currency: 'USD',
      milestones: [],
    });
  });

  it('should update step via setStep', () => {
    useContractWizard.getState().setStep(3);
    expect(useContractWizard.getState().step).toBe(3);
  });

  it('should allow step === 0', () => {
    useContractWizard.getState().setStep(0);
    expect(useContractWizard.getState().step).toBe(0);
  });

  it('should allow negative step (no validation in store)', () => {
    useContractWizard.getState().setStep(-1);
    expect(useContractWizard.getState().step).toBe(-1);
  });

  it('should update individual contract fields via updateContract', () => {
    useContractWizard.getState().updateContract({ title: 'Test Contract' });
    expect(useContractWizard.getState().contract.title).toBe('Test Contract');
    expect(useContractWizard.getState().contract.amount).toBe('');
  });

  it('should merge multiple fields via updateContract', () => {
    useContractWizard.getState().updateContract({
      title: 'Deal',
      amount: '5000',
      currency: 'EUR',
    });
    const c = useContractWizard.getState().contract;
    expect(c.title).toBe('Deal');
    expect(c.amount).toBe('5000');
    expect(c.currency).toBe('EUR');
    expect(c.description).toBe('');
  });

  it('should reset to initial state via reset', () => {
    useContractWizard.getState().setStep(5);
    useContractWizard.getState().updateContract({
      title: 'Something',
      amount: '999',
    });
    useContractWizard.getState().reset();
    const state = useContractWizard.getState();
    expect(state.step).toBe(1);
    expect(state.contract).toEqual({
      title: '',
      description: '',
      sellerEmail: '',
      amount: '',
      currency: 'USD',
      milestones: [],
    });
  });
});
