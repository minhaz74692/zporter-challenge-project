import type { ReactNode } from 'react';
import { cn } from '@/components/ui/cn';

/**
 * Renders a challenge description written with the formatting bar's light
 * Markdown: whole "Heading:" lines and `**bold**` bold, `*italic*` italic,
 * `~~strike~~` struck, `<u>underline</u>` underlined, `- ` / `N. ` as lists.
 * Parses into React elements (no `dangerouslySetInnerHTML`).
 */
const HEADING = /^.{1,48}:\s*$/;
const BULLET = /^\s*[-*]\s+(.*)$/;
const NUMBERED = /^\s*(\d+)\.\s+(.*)$/;
const INLINE = /\*\*(.+?)\*\*|~~(.+?)~~|<u>(.+?)<\/u>|\*(.+?)\*/g;

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    if (m[1] != null) out.push(<strong key={key++} className="font-semibold text-fg">{m[1]}</strong>);
    else if (m[2] != null) out.push(<s key={key++}>{m[2]}</s>);
    else if (m[3] != null) out.push(<u key={key++}>{m[3]}</u>);
    else if (m[4] != null) out.push(<em key={key++}>{m[4]}</em>);
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichDescription({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('space-y-1 text-[13px] leading-relaxed text-fg/80', className)}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;

        const bullet = BULLET.exec(line);
        if (bullet) {
          return (
            <div key={i} className="flex gap-2">
              <span className="select-none">•</span>
              <span>{inline(bullet[1])}</span>
            </div>
          );
        }

        const numbered = NUMBERED.exec(line);
        if (numbered) {
          return (
            <div key={i} className="flex gap-2">
              <span className="select-none">{numbered[1]}.</span>
              <span>{inline(numbered[2])}</span>
            </div>
          );
        }

        if (HEADING.test(line)) {
          return (
            <p key={i} className="font-semibold text-fg">
              {inline(line)}
            </p>
          );
        }

        return <p key={i}>{inline(line)}</p>;
      })}
    </div>
  );
}
