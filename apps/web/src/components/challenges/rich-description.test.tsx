import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RichDescription } from './rich-description';

const html = (text: string) => render(<RichDescription text={text} />).container;

describe('RichDescription', () => {
  it('renders a plain line as a paragraph', () => {
    const c = html('Just run forty metres.');
    expect(c.querySelectorAll('p')).toHaveLength(1);
    expect(c.textContent).toContain('Just run forty metres.');
  });

  it('treats a short line ending in a colon as a heading', () => {
    const c = html('Warm up:');
    const p = c.querySelector('p');
    expect(p?.className).toContain('font-semibold');
  });

  it('does not treat a long colon-terminated line as a heading', () => {
    const long = `${'x'.repeat(60)}:`;
    expect(html(long).querySelector('p')?.className ?? '').not.toContain('font-semibold');
  });

  it('renders "- " and "* " lines as bullets', () => {
    const c = html('- first\n* second');
    expect(c.textContent).toContain('•first');
    expect(c.textContent).toContain('•second');
  });

  it('renders "N. " lines as a numbered row keeping the number', () => {
    const c = html('1. lace up\n2. sprint');
    expect(c.textContent).toContain('1.lace up');
    expect(c.textContent).toContain('2.sprint');
  });

  it('applies inline bold / italic / strike / underline', () => {
    const c = html('a **bold** b *italic* c ~~gone~~ d <u>under</u>');
    expect(c.querySelector('strong')?.textContent).toBe('bold');
    expect(c.querySelector('em')?.textContent).toBe('italic');
    expect(c.querySelector('s')?.textContent).toBe('gone');
    expect(c.querySelector('u')?.textContent).toBe('under');
  });

  it('renders a blank line as a spacer rather than an empty paragraph', () => {
    const c = html('one\n\ntwo');
    expect(c.querySelector('div.h-2')).not.toBeNull();
  });

  it('forwards an extra className to the wrapper', () => {
    const c = render(<RichDescription text="x" className="mt-4" />).container;
    expect(c.firstElementChild?.className).toContain('mt-4');
  });
});
