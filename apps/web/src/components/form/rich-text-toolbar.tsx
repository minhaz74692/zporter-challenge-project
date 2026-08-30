import {
  Bold,
  ChevronRight,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react';

const GROUPS = [
  [Undo2, Redo2],
  [Bold, Italic, Underline, Strikethrough],
  [List, ListOrdered],
] as const;

/**
 * Presentational formatting bar above the description box — matches the Figma.
 * The field itself is a plain textarea; this is chrome, not a real editor.
 */
export function RichTextToolbar() {
  return (
    <div className="flex items-center gap-1 rounded-t-[var(--radius-control)] border-b border-black/30 bg-surface-3 px-2 py-1.5 text-muted">
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <span className="mx-1 h-4 w-px bg-white/10" />}
          {group.map((Icon, i) => (
            <span
              key={i}
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/5 hover:text-fg"
            >
              <Icon className="h-[15px] w-[15px]" />
            </span>
          ))}
        </div>
      ))}
      <ChevronRight className="ml-auto h-4 w-4" />
    </div>
  );
}
