const code = `<span class="f-comment"># Strict Finite State Machine Matrix</span>
<span class="f-keyword">class</span> <span class="f-func">ContractFSM</span>:
    states = [
        <span class="f-string">'DRAFT'</span>,
        <span class="f-string">'PENDING_FUNDING'</span>,
        <span class="f-string">'FUNDED'</span>,
        <span class="f-string">'IN_PROGRESS'</span>,
        <span class="f-string">'DISPUTED'</span>,
        <span class="f-string">'COMPLETED'</span>,
    ]

    <span class="f-keyword">@guard_protected</span>
    <span class="f-keyword">async def</span> <span class="f-func">transition_to_funded</span>(self, intent):
        <span class="f-keyword">if</span> <span class="f-keyword">not</span> intent.status == <span class="f-string">'succeeded'</span>:
            <span class="f-keyword">raise</span> <span class="f-func">InvalidStateError</span>()
        <span class="f-keyword">await</span> self.<span class="f-func">update_state</span>(<span class="f-string">'FUNDED'</span>)`;

export default function FSMMockup({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        padding: '2.5rem',
        boxShadow: '20px 20px 0 var(--accent-dim)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translate(-5px, -5px)';
        e.currentTarget.style.boxShadow = '25px 25px 0 var(--accent-glow)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translate(0, 0)';
        e.currentTarget.style.boxShadow = '20px 20px 0 var(--accent-dim)';
      }}
    >
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingBottom: '0.75rem', marginBottom: '1rem',
          borderBottom: '1px solid var(--border-faint)',
          fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
          textTransform: 'uppercase' as const, letterSpacing: '0.08em',
          color: 'var(--text-muted)',
        }}
      >
        <span>escrow_engine.py</span>
        <span style={{ color: 'var(--accent)' }}>Guard Transitions</span>
      </div>
      <pre
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          lineHeight: 1.8,
          color: 'var(--text-main)',
          margin: 0,
          overflow: 'auto',
        }}
        dangerouslySetInnerHTML={{ __html: code }}
      />
      <style>{`
        .f-keyword { color: var(--accent); }
        .f-func { color: var(--text-main); }
        .f-string { color: var(--text-muted); }
        .f-comment { color: var(--text-faint); font-style: italic; }
      `}</style>
    </div>
  );
}
