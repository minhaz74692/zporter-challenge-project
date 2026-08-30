'use client';

import { useState } from 'react';
import { cn } from '@/components/ui/cn';
import { POINT_STEPS } from '@/components/challenges/challenge-options';

/** Figma "Points to participate" — a green slider snapping to 5 / 10 / 20 / 50 / 100. */
export function PointsSlider({ name, defaultValue = 10 }: { name: string; defaultValue?: number }) {
  const start = Math.max(0, POINT_STEPS.indexOf(defaultValue));
  const [i, setI] = useState(start === -1 ? 1 : start);
  const value = POINT_STEPS[i];

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <input
        type="range"
        min={0}
        max={POINT_STEPS.length - 1}
        step={1}
        value={i}
        onChange={(e) => setI(Number(e.target.value))}
        className="w-full"
        style={{
          background: `linear-gradient(to right, var(--color-success) ${(i / (POINT_STEPS.length - 1)) * 100}%, var(--color-surface-3) 0)`,
        }}
        aria-label="Points to participate"
      />
      <div className="mt-1.5 flex justify-between text-[11px]">
        {POINT_STEPS.map((p, idx) => (
          <span key={p} className={cn(idx === i ? 'font-semibold text-success' : 'text-faint')}>
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
