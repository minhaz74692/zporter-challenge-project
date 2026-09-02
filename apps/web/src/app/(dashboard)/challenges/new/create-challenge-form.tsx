'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { ChevronLeft, Clock } from 'lucide-react';
import { cn } from '@/components/ui/cn';
import type { CreateState } from '../actions';
import {
  AGE_OPTIONS,
  COLLECTIONS,
  EQUIPMENT_TAGS,
  LOCATIONS,
  MAIN_CATEGORIES,
  RESULT_TYPES,
  RESULT_UNITS,
  SCORING,
  TARGET_GROUPS,
  TIME_OPTIONS,
  VISIBILITIES,
} from '@/components/challenges/challenge-options';
import { FilledField, SelectInput, TextInput } from '@/components/form/filled-field';
import { Segmented } from '@/components/form/segmented';
import { MultiPill } from '@/components/form/multi-pill';
import { TagPicker } from '@/components/form/tag-picker';
import { PointsSlider } from '@/components/form/points-slider';
import { RichTextArea } from '@/components/form/rich-text-area';
import { InvitesPanel } from '@/components/challenges/invites-panel';
import { LeaderboardBoard } from '@/components/challenges/leaderboard-board';
import { MediaPicker } from '@/components/challenges/media-picker';
import type { ChallengePrefill } from './prefill';

function iso(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return { date: d.toISOString().slice(0, 10), time: '18:00' };
}

const pad = (n: number) => String(n).padStart(2, '0');
function splitIso(value: string) {
  const d = new Date(value);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

const TABS = [
  { id: 'challenge', label: 'Challenge' },
  { id: 'invites', label: 'Invites' },
  { id: 'leaderboard', label: 'Leaderboard' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const sentence = (v: string) => v.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const sectionLabel = 'mb-2 block pl-1 text-[11px] font-medium text-faint';

export function CreateChallengeForm({
  prefill,
  onSubmit,
  heading = 'Create Challenge',
  submitLabel = 'Save & Publish',
  pendingLabel = 'Publishing…',
}: {
  prefill: ChallengePrefill | null;
  onSubmit: (prev: CreateState, fd: FormData) => Promise<CreateState>;
  heading?: string;
  submitLabel?: string;
  pendingLabel?: string;
}) {
  const [state, action, pending] = useActionState<CreateState, FormData>(onSubmit, {});
  const [tab, setTab] = useState<TabId>('challenge');
  const p = prefill;
  const start = p?.startAt ? splitIso(p.startAt) : iso(0);
  const end = p?.deadline ? splitIso(p.deadline) : iso(14);

  // Coach and admin have the same "Share with" options.
  const shareOptions = VISIBILITIES;

  // Editing a challenge whose current audience isn't one of the standard
  // options (e.g. a legacy value): show it read-only and submit no `visibility`
  // field so the PATCH leaves it untouched.
  const lockedVisibility =
    p?.visibility && !shareOptions.some((o) => o.value === p.visibility)
      ? VISIBILITIES.find((v) => v.value === p.visibility)
      : undefined;

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <form
        action={action}
        className="space-y-6 rounded-[var(--radius-panel)] bg-field/60 p-5 ring-1 ring-white/[0.04] sm:p-7"
      >
        <input type="hidden" name="templateId" value={p?.templateId ?? ''} />

        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/challenges" className="text-muted hover:text-fg">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-[17px] font-semibold text-fg">{heading}</h1>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/zai.png" alt="Zai" className="h-6 w-auto" />
        </div>

        {/* tabs */}
        <div className="flex justify-between border-b border-border-soft text-[14px]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'pb-2',
                tab === t.id
                  ? 'border-b-2 border-accent font-semibold text-accent'
                  : 'text-muted hover:text-fg',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {state.error && <p className="text-[12px] text-danger">{sentence(state.error)}</p>}

        {/* ============ CHALLENGE ============ */}
        <div className={cn('space-y-5', tab !== 'challenge' && 'hidden')}>
          <FilledField label="Headline" hint="Max 40 signs — required" clearable>
            <TextInput
              name="title"
              maxLength={40}
              defaultValue={p?.title ?? ''}
              placeholder="Set a unique and memorable name for the Challenge"
              className="pr-7"
            />
          </FilledField>

          <FilledField label="Ingress" hint="Max 200 signs" clearable>
            <TextInput
              name="ingress"
              maxLength={200}
              defaultValue={p?.ingress ?? ''}
              placeholder="Describe why to run this Challenge"
              className="pr-7"
            />
          </FilledField>

          {/* description with formatting bar */}
          <div>
            <span className={sectionLabel}>Description</span>
            <div className="relative overflow-hidden rounded-[var(--radius-control)] bg-field/80 ring-1 ring-white/[0.04] focus-within:ring-primary/50">
              <RichTextArea
                name="description"
                rows={5}
                defaultValue={p?.description ?? ''}
                placeholder="Write a description of this Challenge, how to run and fulfil it with ev. rewards for the winner or to those that fulfil it in time"
                className="px-3.5 py-3"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/zai.png"
                alt="Zai"
                className="pointer-events-none absolute bottom-2 right-3 h-4 w-auto opacity-80"
              />
            </div>
          </div>

          {/* media row — files upload after the challenge is saved */}
          <MediaPicker carried={p?.media ?? []} />

          {/* time + location */}
          <div className="grid gap-3 sm:grid-cols-2">
            <FilledField label="Time">
              <SelectInput name="durationMinutes" defaultValue={p?.durationMinutes ?? 20}>
                {TIME_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </SelectInput>
            </FilledField>
            <FilledField label="Location">
              <SelectInput name="location" defaultValue={p?.location ?? 'anywhere'}>
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
            <FilledField label="Start Date">
              <TextInput name="startDate" type="date" defaultValue={start.date} />
            </FilledField>
            <FilledField label="Start Time" right={<Clock className="h-4 w-4" />}>
              <TextInput name="startTime" type="time" defaultValue={start.time} />
            </FilledField>
            <FilledField label="End Date">
              <TextInput name="endDate" type="date" defaultValue={end.date} />
            </FilledField>
            <FilledField label="End Time" right={<Clock className="h-4 w-4" />}>
              <TextInput name="endTime" type="time" defaultValue={end.time} />
            </FilledField>
          </div>

          {/* points */}
          <div>
            <span className={sectionLabel}>Points to participate</span>
            <PointsSlider name="pointsToParticipate" defaultValue={p?.pointsToParticipate ?? 10} />
          </div>

          {/* ---- Challenge details ---- */}
          <div className="border-t border-border-soft pt-5">
            <p className="mb-4 text-center text-[14px] font-semibold text-fg">Challenge details</p>

            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <FilledField label="Min Participants">
                  <TextInput
                    name="minParticipants"
                    type="number"
                    min={1}
                    defaultValue={p?.minParticipants ?? 2}
                  />
                </FilledField>
                <FilledField label="Target group">
                  <SelectInput name="position" defaultValue={p?.position || ''}>
                    {TARGET_GROUPS.map((g) => (
                      <option key={g} value={g === 'All' ? '' : g}>
                        {g}
                      </option>
                    ))}
                  </SelectInput>
                </FilledField>
                <FilledField label="Age from">
                  <SelectInput name="ageFrom" defaultValue={p?.ageFrom ?? ''}>
                    <option value="">All</option>
                    {AGE_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </SelectInput>
                </FilledField>
                <FilledField label="Age to">
                  <SelectInput name="ageTo" defaultValue={p?.ageTo ?? ''}>
                    <option value="">All</option>
                    {AGE_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </SelectInput>
                </FilledField>
              </div>

              {/* result model — not in the Figma image but required by the API when no template */}
              <div className="grid gap-3 sm:grid-cols-3">
                <FilledField label="Result type">
                  <SelectInput name="resultType" defaultValue={p?.resultType ?? 'count'}>
                    {RESULT_TYPES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </SelectInput>
                </FilledField>
                <FilledField label="Unit">
                  <SelectInput name="resultUnit" defaultValue={p?.resultUnit ?? 'reps'}>
                    {RESULT_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </SelectInput>
                </FilledField>
                <FilledField label="Scoring">
                  <SelectInput
                    name="scoringDirection"
                    defaultValue={p?.scoringDirection ?? 'higher_better'}
                  >
                    {SCORING.map((sc) => (
                      <option key={sc.value} value={sc.value}>
                        {sc.label}
                      </option>
                    ))}
                  </SelectInput>
                </FilledField>
              </div>
              <FilledField label="Reward points">
                <TextInput
                  name="rewardPoints"
                  type="number"
                  min={0}
                  defaultValue={p?.rewardPoints ?? 50}
                />
              </FilledField>

              <div>
                <span className={sectionLabel}>Tags</span>
                <TagPicker
                  name="equipmentTags"
                  options={EQUIPMENT_TAGS}
                  defaultValue={p?.equipmentTags ?? []}
                />
              </div>

              <div>
                <span className={sectionLabel}>Main Category</span>
                <Segmented
                  name="mainCategory"
                  options={MAIN_CATEGORIES}
                  defaultValue={p?.mainCategory ?? 'other'}
                  columns={4}
                />
              </div>

              <div>
                <span className={sectionLabel}>Add to Collections as</span>
                <MultiPill
                  name="collections"
                  options={COLLECTIONS}
                  defaultValue={p?.collections ?? []}
                />
              </div>

              <div>
                <span className={sectionLabel}>Share with</span>
                {lockedVisibility ? (
                  <div className="rounded-[var(--radius-control)] bg-field/80 px-3.5 py-2.5 text-[13px] text-fg ring-1 ring-white/[0.04]">
                    {lockedVisibility.label}
                  </div>
                ) : (
                  <Segmented
                    name="visibility"
                    options={shareOptions}
                    defaultValue={
                      shareOptions.some((o) => o.value === p?.visibility)
                        ? p!.visibility!
                        : 'private'
                    }
                    columns={shareOptions.length}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============ INVITES ============ */}
        <div className={cn(tab !== 'invites' && 'hidden')}>
          <InvitesPanel />
        </div>

        {/* ============ LEADERBOARD ============ */}
        <div className={cn(tab !== 'leaderboard' && 'hidden')}>
          <LeaderboardBoard entries={[]} />
        </div>

        {/* sticky footer */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-soft bg-canvas lg:pl-64">
          <div className="mx-auto grid max-w-3xl grid-cols-[1fr_1.6fr] gap-3 px-4 py-3 sm:px-6">
            <Link
              href="/challenges"
              className="flex h-11 items-center justify-center rounded-[var(--radius-control)] border border-border text-[13px] font-medium text-fg hover:bg-surface-2"
            >
              Save draft
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="h-11 rounded-[var(--radius-control)] bg-primary text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {pending ? pendingLabel : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
