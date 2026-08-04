import { useEffect, useRef, useState } from 'react';

/** Inline, contentEditable secondary-language translation — flashes green ("is-synced") for a moment after a manual edit is committed on blur. */
export function TrInline({ value, onCommit, small }: { value: string; onCommit: (v: string) => void; small?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const originalRef = useRef(value);
  const [synced, setSynced] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className={`flex items-start gap-2 ${small ? 'mt-1.5 pt-1.5' : 'mt-2 pt-2'} border-t border-dashed border-borderSoft transition-colors ${synced ? 'bg-greenBg rounded-lg px-2 -mx-2 pb-1' : ''}`}>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        className={`flex-1 min-w-0 ${small ? 'text-[11.5px] leading-[1.45]' : 'text-[12.5px] leading-[1.55]'} outline-none cursor-text border-b border-dashed transition-colors ${synced ? 'text-green border-transparent' : 'text-text2 border-transparent hover:border-border focus:text-text focus:border-accent'}`}
        onFocus={() => { originalRef.current = ref.current?.textContent ?? ''; }}
        onBlur={() => {
          const next = (ref.current?.textContent ?? '').trim();
          if (next !== originalRef.current.trim()) {
            onCommit(next);
            setSynced(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setSynced(false), 1400);
          }
        }}
      />
    </div>
  );
}
