import { EditableText } from './EditableText';
import { KwBar } from './KwBar';
import { PreviewImage } from './PreviewImage';
import { TrInline } from './TrInline';
import { useApp } from '../state/AppContext';

const TITLE_MIN = 130;
const TITLE_MAX = 200;

export function TitleDescriptionForm() {
  const { files, currentFileId, metadataByFileId, updateMetadata } = useApp();
  if (!currentFileId) return null;
  const entry = files.find((f) => f.id === currentFileId);
  const record = metadataByFileId[currentFileId];
  if (!entry || !record) return null;

  const titleLen = (record.title_en ?? '').length;
  const titleInRange = titleLen >= TITLE_MIN && titleLen <= TITLE_MAX;
  const titleOverMax = titleLen > TITLE_MAX;
  const titleFillClass = titleLen === 0 ? 'bg-[#E1E6EC]' : titleOverMax ? 'bg-redBg' : titleInRange ? 'bg-greenBg' : 'bg-[#E1E6EC]';
  const titleCountClass = titleLen === 0 ? 'text-text2' : titleOverMax ? 'text-red' : titleInRange ? 'text-green' : 'text-text2';

  const descLen = (record.description_en ?? '').length;

  return (
    <>
      <div className="flex gap-[18px] mb-[18px] items-center">
        <PreviewImage key={entry.id} entry={entry} />
        <div className="flex-1 min-w-0 border border-borderSoft rounded-xl overflow-hidden bg-card">
          <KwBar
            stopId="title"
            label="Başlık"
            actionLabel="Kopyala"
            countText={`${titleLen} · ${TITLE_MIN}–${TITLE_MAX}`}
            countClassName={titleCountClass}
            fillPercent={Math.min(100, (titleLen / TITLE_MAX) * 100)}
            fillColorClass={titleFillClass}
            getCopyText={() => record.title_en ?? ''}
          />
          <div className="px-3.5 pt-2.5 pb-3">
            <EditableText value={record.title_en ?? ''} onChange={(v) => updateMetadata(currentFileId, { title_en: v })} placeholder="Başlık" />
            <TrInline value={record.title_tr ?? ''} onCommit={(v) => updateMetadata(currentFileId, { title_tr: v })} />
          </div>
        </div>
      </div>

      <div className="border border-borderSoft rounded-xl overflow-hidden bg-card mb-[18px]">
        <KwBar
          stopId="description"
          label="Açıklama"
          actionLabel="Kopyala"
          countText={`${descLen} karakter`}
          getCopyText={() => record.description_en ?? ''}
        />
        <div className="px-3.5 pt-2.5 pb-3">
          <EditableText value={record.description_en ?? ''} onChange={(v) => updateMetadata(currentFileId, { description_en: v })} multiline placeholder="Açıklama" />
          <TrInline value={record.description_tr ?? ''} onCommit={(v) => updateMetadata(currentFileId, { description_tr: v })} />
        </div>
      </div>
    </>
  );
}
