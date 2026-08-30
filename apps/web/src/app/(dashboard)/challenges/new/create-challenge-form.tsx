'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import type { ChallengeTemplate } from '@zporter/shared';
import { createChallenge, type CreateState } from '../actions';
import {
  COLLECTIONS,
  EQUIPMENT_TAGS,
  LOCATIONS,
  MAIN_CATEGORIES,
  RESULT_TYPES,
  RESULT_UNITS,
  SCORING,
  VISIBILITIES,
} from '@/components/challenges/challenge-options';
import { FilledField, SelectInput, TextArea, TextInput } from '@/components/form/filled-field';
import { Segmented } from '@/components/form/segmented';
import { MultiPill } from '@/components/form/multi-pill';
import { TagPicker } from '@/components/form/tag-picker';
import { PointsSlider } from '@/components/form/points-slider';
import { IconChevronLeft } from '@/components/ui/icons';

function iso(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return { date: d.toISOString().slice(0, 10), time: '18:00' };
}

export function CreateChallengeForm({ template }: { template: ChallengeTemplate | null }) {
  const [state, action, pending] = useActionState<CreateState, FormData>(createChallenge, {});
  const start = iso(0);
  const end = iso(14);
  const t = template;

  return (
    <div className="mx-auto max-w-3xl">
      <form
        action={action}
        className="rounded-[var(--radius-panel)] border border-border bg-surface p-6 sm:p-8"
      >
        <input type="hidden" name="templateId" value={t?.id ?? ''} />

        {/* header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/challenges" className="text-muted hover:text-fg">
              <IconChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-[17px] font-semibold text-fg">Create challenge</h1>
          </div>
          <span className="text-[13px] font-bold text-accent">Zai</span>
        </div>
        <div className="mb-6 flex gap-7 border-b border-border-soft text-[13px]">
          <span className="border-b-2 border-accent pb-2 font-medium text-accent">Challenge</span>
          <span className="cursor-default pb-2 text-faint">Invites</span>
          <span className="cursor-default pb-2 text-faint">Leaderboard</span>
        </div>

        <div className="space-y-5">
          {/* text block */}
          <div className="overflow-hidden rounded-[var(--radius-control)]">
            <FilledField label="Headline" hint="Max 40 characters — required">
              <TextInput
                name="title"
                maxLength={40}
                required
                defaultValue={t?.title ?? ''}
                placeholder="Set a unique, memorable name"
              />
            </FilledField>
          </div>
          <FilledField label="Ingress" hint="Max 200 characters">
            <TextInput
              name="ingress"
              maxLength={200}
              defaultValue={t?.ingress ?? ''}
              placeholder="Describe why to run this challenge"
            />
          </FilledField>
          <FilledField label="Description">
            <TextArea
              name="description"
              rows={4}
              defaultValue={t ? `${t.description}\n\n${t.rules}` : ''}
              placeholder="How to run and fulfil it, and the reward for finishing"
            />
          </FilledField>

          {/* result model */}
          <div className="grid gap-3 sm:grid-cols-3">
            <FilledField label="Result type">
              <SelectInput name="resultType" defaultValue={t?.resultType ?? 'count'}>
                {RESULT_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </SelectInput>
            </FilledField>
            <FilledField label="Unit">
              <SelectInput name="resultUnit" defaultValue={t?.resultUnit ?? 'reps'}>
                {RESULT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </SelectInput>
            </FilledField>
            <FilledField label="Scoring">
              <SelectInput name="scoringDirection" defaultValue={t?.scoringDirection ?? 'higher_better'}>
                {SCORING.map((sc) => (
                  <option key={sc.value} value={sc.value}>
                    {sc.label}
                  </option>
                ))}
              </SelectInput>
            </FilledField>
          </div>

          {/* time + location */}
          <div className="grid gap-3 sm:grid-cols-2">
            <FilledField label="Time (minutes)">
              <TextInput
                name="durationMinutes"
                type="number"
                min={1}
                defaultValue={t?.durationMinutes ?? 20}
              />
            </FilledField>
            <FilledField label="Location">
              <SelectInput name="location" defaultValue={t?.location ?? 'anywhere'}>
                {LOCATIONS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </SelectInput>
            </FilledField>
          </div>

          {/* dates */}
          <div className="grid gap-3 sm:grid-cols-2">
            <FilledField label="Start date">
              <TextInput name="startDate" type="date" defaultValue={start.date} />
            </FilledField>
            <FilledField label="Start time">
              <TextInput name="startTime" type="time" defaultValue={start.time} />
            </FilledField>
            <FilledField label="End date">
              <TextInput name="endDate" type="date" defaultValue={end.date} />
            </FilledField>
            <FilledField label="End time">
              <TextInput name="endTime" type="time" defaultValue={end.time} />
            </FilledField>
          </div>

          {/* points */}
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-faint">
              Points to participate
            </p>
            <PointsSlider name="pointsToParticipate" defaultValue={t?.pointsToParticipate ?? 10} />
          </div>

          {/* details */}
          <div className="pt-2 text-center text-[13px] font-semibold text-fg">Challenge details</div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FilledField label="Min. participants">
              <TextInput name="minParticipants" type="number" min={1} defaultValue={2} />
            </FilledField>
            <FilledField label="Reward points">
              <TextInput
                name="rewardPoints"
                type="number"
                min={0}
                defaultValue={t?.rewardPoints ?? 50}
              />
            </FilledField>
            <FilledField label="Age from">
              <TextInput name="ageFrom" type="number" min={0} placeholder="Any" />
            </FilledField>
            <FilledField label="Age to">
              <TextInput name="ageTo" type="number" min={0} placeholder="Any" />
            </FilledField>
            <FilledField label="Target position" className="sm:col-span-2">
              <TextInput name="position" placeholder="e.g. Forwards — leave blank for all" />
            </FilledField>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-faint">Tags</p>
            <TagPicker
              name="equipmentTags"
              options={EQUIPMENT_TAGS}
              defaultValue={t?.equipmentTags ?? []}
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-faint">Main category</p>
            <Segmented
              name="mainCategory"
              options={MAIN_CATEGORIES}
              defaultValue={t?.mainCategory ?? 'other'}
              columns={3}
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-faint">
              Add to collections as
            </p>
            <MultiPill
              name="collections"
              options={COLLECTIONS}
              defaultValue={t?.collections ?? []}
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-faint">Share with</p>
            <Segmented name="visibility" options={VISIBILITIES} defaultValue="private" columns={4} />
            <p className="pl-1 text-[11px] text-faint">
              “All” publishes to every player — admin only. Private keeps it to the people you invite.
            </p>
          </div>

          {state.error && <p className="text-[12px] text-danger">{state.error}</p>}

          <div className="grid grid-cols-[1fr_1.4fr] gap-3 pt-1">
            <Link
              href="/challenges"
              className="flex h-10 items-center justify-center rounded-[var(--radius-control)] border border-border text-[13px] text-fg hover:bg-surface-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="h-10 rounded-[var(--radius-control)] bg-primary text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {pending ? 'Publishing…' : 'Save & publish'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
