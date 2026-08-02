import { useState } from 'react';

import { FileList } from './FileList';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={`relative flex flex-col bg-bgSidebar border-r border-border shrink-0 min-h-0 transition-[width] duration-150 ${collapsed ? 'w-[92px]' : 'w-[280px]'}`}>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        title="Menüyü daralt / genişlet"
        className="btn-press absolute top-4 -right-[11px] z-10 w-[22px] h-[22px] rounded-full bg-card border border-border flex items-center justify-center text-text2 hover:text-accent hover:border-[#CFE3FA]"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? 'scaleX(-1)' : undefined }}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <FileList collapsed={collapsed} />
    </aside>
  );
}
