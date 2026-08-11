import { EditableText } from './EditableText';
import { KwBar } from './KwBar';
import { PreviewImage } from './PreviewImage';
import { TrInline } from './TrInline';
import { getLanguage, isEnglishOnly } from '../lib/languages';
import { useT } from '../lib/useT';
import { useApp } from '../state/AppContext';

const TITLE_MIN = 150;
const TITLE_MAX = 200;

export function TitleDescriptionForm() {
  const { files, currentFileId, metadataByFileId, updateMetadata, settings } = useApp();
  const t = useT();
  const englishOnly = isEnglishOnly(getLanguage(settings.target_language));
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
      <div className="flex gap-[18px] mb-[10px] h-[130px]">
        <PreviewImage key={entry.id} entry={entry} />
        <div className="flex-1 min-w-0 h-full border border-borderSoft rounded-xl overflow-hidden bg-card flex flex-col">
          <KwBar
            stopId="title"
            label={t('field_title')}
            actionLabel={t('copy_action')}
            countText={`${titleLen} · ${TITLE_MIN}–${TITLE_MAX}`}
            countClassName={titleCountClass}
            fillPercent={Math.min(100, (titleLen / TITLE_MAX) * 100)}
            fillColorClass={titleFillClass}
            getCopyText={() => record.title_en ?? ''}
          />
          <div className="px-3.5 pt-2.5 pb-3">
            <EditableText value={record.title_en ?? ''} onChange={(v) => updateMetadata(currentFileId, { title_en: v })} placeholder={t('field_title')} />
            <TrInline value={record.title_secondary ?? ''} onCommit={(v) => updateMetadata(currentFileId, { title_secondary: v })} translating={record.translating} englishOnly={englishOnly} />
          </div>
        </div>
      </div>

      <div className="border border-borderSoft rounded-xl overflow-hidden bg-card mb-3">
        <KwBar
          stopId="description"
          label={t('field_description')}
          actionLabel={t('copy_action')}
          countText={t('char_count', { n: descLen })}
          getCopyText={() => record.description_en ?? ''}
        />
        <div className="px-3 pt-1.5 pb-2">
          <EditableText value={record.description_en ?? ''} onChange={(v) => updateMetadata(currentFileId, { description_en: v })} multiline placeholder={t('field_description')} small />
          <TrInline value={record.description_secondary ?? ''} onCommit={(v) => updateMetadata(currentFileId, { description_secondary: v })} small translating={record.translating} englishOnly={englishOnly} />
        </div>
      </div>
    </>
  );
}
