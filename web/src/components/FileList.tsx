import { useCallback, useMemo } from 'react';

import { useT } from '../lib/useT';
import { metadataRingStatus } from '../lib/limits';
import { getFileId, sortedAllowedFiles } from '../lib/media';
import { useApp, useAppMeta } from '../state/AppContext';
import { Thumbnail } from './Thumbnail';

export function FileList({ collapsed, search }: { collapsed: boolean; search: string }) {
  const { files, setFiles, currentFileId, setCurrentFileId, selectedIds, toggleSelection, setKbZone } = useApp();
  const metadataByFileId = useAppMeta();
  const t = useT();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const items = e.dataTransfer?.files;
    if (!items?.length) return;
    const list = sortedAllowedFiles(items);
    setFiles(list.map((file) => ({ id: getFileId(file), file, name: file.name })));
  };

  const handleDropzoneClick = () => {
    document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  };

  const handleSelect = useCallback((id: string) => {
    setCurrentFileId(id);
    setKbZone('sidebar');
  }, [setCurrentFileId, setKbZone]);

  const handleToggleBatch = useCallback((id: string) => {
    toggleSelection(id);
  }, [toggleSelection]);

  const visibleFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? files.filter((f) => f.name.toLowerCase().includes(q)) : files;
  }, [files, search]);

  const doneCount = files.filter((f) => metadataRingStatus(metadataByFileId[f.id]) !== 'pending').length;

  return (
    <div className="flex flex-col h-full min-h-0">
      {!collapsed && (
        <div className="flex items-center justify-between px-4 pt-3 pb-2 text-[12px] text-text2">
          <span>{t('files_count', { n: files.length })}</span>
          <span>{t('files_done', { n: doneCount })}</span>
          {selectedIds.size > 0 && <span className="text-accent">{t('files_selected', { n: selectedIds.size })}</span>}
        </div>
      )}

      <div className={`flex-1 overflow-y-auto min-h-0 ${collapsed ? 'px-2 pb-3 pt-0.5' : 'px-2 pb-3'}`} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
        {files.length === 0 && !collapsed && (
          <div
            role="button"
            tabIndex={0}
            onClick={handleDropzoneClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDropzoneClick(); } }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border rounded-lg p-6 mt-2 text-center text-text3 text-sm cursor-pointer transition-colors hover:border-accent hover:bg-hover"
          >
            {t('dropzone_text')}
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
              ringTitle={status === 'warn' ? t('ring_warn_title') : undefined}
              collapsed={collapsed}
              onClick={handleSelect}
              onToggleBatch={handleToggleBatch}
            />
          );
        })}
      </div>

      <div className="px-3 py-2.5 border-t border-borderSoft">
        <a
          href="https://buymeacoffee.com/bulentbaris"
          target="_blank"
          rel="noopener noreferrer"
          title={t('coffee_title')}
          className="btn-press flex items-center justify-center gap-1.5 h-[34px] rounded-lg border border-[#E8C48A] text-[#9A6B12] text-[12.5px] font-semibold hover:bg-[#FEF6E7]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" /><line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" /></svg>
          {!collapsed && <span>{t('coffee_btn')}</span>}
        </a>
      </div>
    </div>
  );
}
