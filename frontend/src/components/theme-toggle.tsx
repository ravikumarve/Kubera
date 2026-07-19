'use client';

import { useTheme } from './theme-provider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="interactive"
      style={{
        background: 'none',
        border: '1px solid var(--border-faint)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        cursor: 'pointer',
        padding: '0.4rem 0.8rem',
        transition: 'all 0.2s ease',
        borderRadius: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
      title={`Switch to ${theme === 'kinetic' ? 'Vault Cobalt' : 'Kinetic Mint'} theme`}
    >
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          backgroundColor: 'var(--accent)',
          borderRadius: theme === 'vault' ? 2 : '50%',
        }}
      />
      {theme === 'kinetic' ? 'Mint' : 'Vault'}
    </button>
  );
}
