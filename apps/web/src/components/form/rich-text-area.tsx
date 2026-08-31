'use client';

import { useRef, type TextareaHTMLAttributes } from 'react';
import { TextArea } from './filled-field';
import { RichTextToolbar, type RichTextCommand } from './rich-text-toolbar';

/**
 * A plain textarea (still uncontrolled, still submits via `name`) plus a
 * working formatting bar. Each command rewrites the current selection with
 * Markdown-style markers, keeping native undo/redo intact via
 * `execCommand('insertText')`.
 */
export function RichTextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function run(cmd: RichTextCommand) {
    const el = ref.current;
    if (!el) return;
    el.focus();
    applyCommand(el, cmd);
  }

  return (
    <>
      <RichTextToolbar onCommand={run} />
      <TextArea ref={ref} {...props} />
    </>
  );
}

const WRAP: Partial<Record<RichTextCommand, [string, string]>> = {
  bold: ['**', '**'],
  italic: ['*', '*'],
  underline: ['<u>', '</u>'],
  strike: ['~~', '~~'],
};

function applyCommand(el: HTMLTextAreaElement, cmd: RichTextCommand) {
  if (cmd === 'undo' || cmd === 'redo') {
    document.execCommand(cmd);
    return;
  }
  if (cmd === 'ul' || cmd === 'ol') {
    applyList(el, cmd);
    return;
  }

  const pair = WRAP[cmd];
  if (!pair) return;
  const [open, close] = pair;

  const { selectionStart: start, selectionEnd: end, value } = el;
  const selected = value.slice(start, end);
  const wrappedOutside =
    value.slice(start - open.length, start) === open &&
    value.slice(end, end + close.length) === close;
  const wrappedInside =
    selected.startsWith(open) && selected.endsWith(close) && selected.length >= open.length + close.length;

  if (wrappedOutside) {
    el.setSelectionRange(start - open.length, end + close.length);
    insertText(el, selected);
  } else if (wrappedInside) {
    insertText(el, selected.slice(open.length, selected.length - close.length));
  } else {
    insertText(el, `${open}${selected}${close}`);
    if (start === end) {
      const caret = el.selectionStart - close.length;
      el.setSelectionRange(caret, caret);
    }
  }
}

function applyList(el: HTMLTextAreaElement, kind: 'ul' | 'ol') {
  const { selectionStart: start, selectionEnd: end, value } = el;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const nextBreak = value.indexOf('\n', end);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;

  const rewritten = value
    .slice(lineStart, lineEnd)
    .split('\n')
    .map((line, i) => {
      const bare = line.replace(/^(\s*)(?:[-*]\s+|\d+\.\s+)/, '$1');
      if (!bare.trim()) return line;
      return kind === 'ul' ? `- ${bare}` : `${i + 1}. ${bare}`;
    })
    .join('\n');

  el.setSelectionRange(lineStart, lineEnd);
  insertText(el, rewritten);
}

/** Replace the current selection, preserving the textarea's undo history. */
function insertText(el: HTMLTextAreaElement, text: string) {
  const ok = document.execCommand('insertText', false, text);
  if (!ok) {
    const { selectionStart: s, selectionEnd: e, value } = el;
    el.value = value.slice(0, s) + text + value.slice(e);
    el.setSelectionRange(s + text.length, s + text.length);
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
