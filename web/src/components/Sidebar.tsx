import { FileList } from './FileList';

export function Sidebar({ collapsed, search }: { collapsed: boolean; search: string }) {
  return (
    <aside className={`flex flex-col bg-bgSidebar border-r border-border shrink-0 min-h-0 transition-[width] duration-150 ${collapsed ? 'w-[92px]' : 'w-[280px]'}`}>
      <FileList collapsed={collapsed} search={search} />
    </aside>
  );
}
