import {
  Bold,
  ChevronRight,
  Italic,
  List,
  ListOrdered,
  type LucideIcon,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react';

export type RichTextCommand =
  | 'undo'
  | 'redo'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'ul'
  | 'ol';

const GROUPS: { icon: LucideIcon; cmd: RichTextCommand; label: string }[][] = [
  [
    { icon: Undo2, cmd: 'undo', label: 'Undo' },
    { icon: Redo2, cmd: 'redo', label: 'Redo' },
  ],
  [
    { icon: Bold, cmd: 'bold', label: 'Bold' },
    { icon: Italic, cmd: 'italic', label: 'Italic' },
    { icon: Underline, cmd: 'underline', label: 'Underline' },
    { icon: Strikethrough, cmd: 'strike', label: 'Strikethrough' },
  ],
  [
    { icon: List, cmd: 'ul', label: 'Bullet list' },
    { icon: ListOrdered, cmd: 'ol', label: 'Numbered list' },
  ],
];

/**
 * Formatting bar above the description box. Each button applies a Markdown-style
 * transform to the textarea selection (see `RichTextArea`) — no editor library,
 * the field stays plain text.
 */
export function RichTextToolbar({
  onCommand,
}: {
  onCommand: (cmd: RichTextCommand) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-t-[var(--radius-control)] border-b border-black/30 bg-surface-3 px-2 py-1.5 text-muted">
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <span className="mx-1 h-4 w-px bg-white/10" />}
          {group.map(({ icon: Icon, cmd, label }) => (
            <button
              key={cmd}
              type="button"
              title={label}
              aria-label={label}
              // Keep the textarea's selection when the button is pressed.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onCommand(cmd)}
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/5 hover:text-fg"
            >
              <Icon className="h-[15px] w-[15px]" />
            </button>
          ))}
        </div>
      ))}
      <ChevronRight className="ml-auto h-4 w-4" />
    </div>
  );
}
