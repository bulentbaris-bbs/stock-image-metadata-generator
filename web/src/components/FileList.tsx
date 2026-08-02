import { useEffect, useMemo, useRef, useState } from 'react';

import { metadataRingStatus } from '../lib/limits';
import { getFileId, isAllowedMedia } from '../lib/media';
import { useApp } from '../state/AppContext';
import { Thumbnail } from './Thumbnail';

export function FileList({ collapsed }: { collapsed: boolean }) {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  useEffect(() => {
    const el = folderInputRef.current;
    if (el) { el.setAttribute('webkitdirectory', ''); el.setAttribute('directory', ''); }
  }, []);
  const { files, setFiles, currentFileId, setCurrentFileId, selectedIds, toggleSelection, metadataByFileId, setKbZone } = useApp();

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;
    const list: File[] = [];
    for (let i = 0; i < selected.length; i++) {
      const f = selected[i];
      if (isAllowedMedia(f)) list.push(f);
    }
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    setFiles(list.map((file) => ({ id: getFileId(file), file, name: file.name })));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const items = e.dataTransfer?.files;
    if (!items?.length) return;
    const list: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const f = items[i];
      if (isAllowedMedia(f)) list.push(f);
    }
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    setFiles(list.map((file) => ({ id: getFileId(file), file, name: file.name })));
  };

  const visibleFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? files.filter((f) => f.name.toLowerCase().includes(q)) : files;
  }, [files, search]);

  const doneCount = files.filter((f) => metadataRingStatus(metadataByFileId[f.id]) !== 'pending').length;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 pt-[18px] pb-3 border-b border-borderSoft">
        <div className="flex items-center gap-2">
          <div className="w-[34px] h-[34px] rounded-lg bg-card border border-borderSoft flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/logo.png" alt="BBS Studio" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex items-center gap-2 flex-1 h-[34px] bg-card border border-border rounded-md px-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text3 shrink-0"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16" y2="16" /></svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Dosya ara..." className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[13px] text-text placeholder-text3" />
            </div>
          )}
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            title="Dosya / klasör seç"
            className="btn-press w-[34px] h-[34px] rounded-lg border border-border bg-card flex items-center justify-center text-accent hover:bg-accentSoft hover:border-[#CFE3FA] shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="9.5" y1="13.5" x2="14.5" y2="13.5" /></svg>
          </button>
          <input ref={folderInputRef} type="file" multiple accept=".jpg,.jpeg,.mov,.mp4" onChange={handleFolderChange} className="hidden" />
        </div>
      </div>

      {!collapsed && (
        <div className="flex items-center justify-between px-4 pt-3 pb-2 text-[12px] text-text2">
          <span>{files.length} dosya</span>
          <span>{doneCount} tamamlandı</span>
          {selectedIds.size > 0 && <span className="text-accent">{selectedIds.size} seçili</span>}
        </div>
      )}

      <div className={`flex-1 overflow-y-auto min-h-0 ${collapsed ? 'px-2 pb-3 pt-0.5' : 'px-2 pb-3'}`} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
        {files.length === 0 && !collapsed && (
          <div className="border-2 border-dashed border-border rounded-lg p-6 mt-2 text-center text-text3 text-sm" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
            Görsel/video sürükleyin ya da yukarıdaki butonu kullanın
          </div>
        )}
        {visibleFiles.map((entry) => {
          const status = metadataRingStatus(metadataByFileId[entry.id]);
          return (
            <Thumbnail
              key={entry.id}
              entry={entry}
              selected={currentFileId === entry.id}
              selectedForBatch={selectedIds.has(entry.id)}
              ringStatus={status}
              ringTitle={status === 'warn' ? 'Bazı platformlarda anahtar kelime limiti dolmadı' : undefined}
              collapsed={collapsed}
              onClick={() => { setCurrentFileId(entry.id); setKbZone('sidebar'); }}
              onToggleBatch={() => toggleSelection(entry.id)}
            />
          );
        })}
      </div>

      <div className="px-3 py-2.5 border-t border-borderSoft">
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          title="Bu uygulamayı beğendiyseniz bir kahve ısmarlayabilirsiniz"
          className="btn-press flex items-center justify-center gap-1.5 h-[34px] rounded-lg border border-[#E8C48A] text-[#9A6B12] text-[12.5px] font-semibold hover:bg-[#FEF6E7]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" /><line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" /></svg>
          {!collapsed && <span>Kahve ısmarla</span>}
        </a>
      </div>
    </div>
  );
}
