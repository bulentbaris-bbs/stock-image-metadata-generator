import { KeywordTabs } from './KeywordTabs';
import { TitleDescriptionForm } from './TitleDescriptionForm';

export function MainForm({ onError }: { onError?: (msg: string) => void }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto px-[22px] pt-5">
      <TitleDescriptionForm />
      <div className="flex flex-col flex-1 min-h-0">
        <KeywordTabs onError={onError} />
      </div>
    </div>
  );
}
