import { useRef, useState } from 'react';

/** Readonly by default; double-click to edit (mirrors the design mockup's field-input pattern). */
export function EditableText({
  value,
  onChange,
  multiline,
  placeholder,
  small,
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  small?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startEditing = () => {
    setEditing(true);
    requestAnimationFrame(() => {
      const el = multiline ? textareaRef.current : inputRef.current;
      el?.focus();
      el?.select();
    });
  };

  const className = `w-full border-0 outline-none bg-transparent text-text ${small ? 'text-[12.5px]' : 'text-[13.5px]'} ${multiline ? `leading-[1.4] resize-none ${small ? 'h-9' : 'h-11'}` : ''} ${editing ? 'cursor-text' : 'cursor-default'}`;

  if (multiline) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={!editing}
        onDoubleClick={startEditing}
        onBlur={() => setEditing(false)}
        placeholder={placeholder}
        className={className}
      />
    );
  }
  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={!editing}
      onDoubleClick={startEditing}
      onBlur={() => setEditing(false)}
      placeholder={placeholder}
      className={className}
    />
  );
}
