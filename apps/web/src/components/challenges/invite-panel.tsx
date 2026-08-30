'use client';

import { useActionState, useEffect, useRef } from 'react';
import { invitePlayers, type InviteState } from '@/app/(dashboard)/challenges/actions';
import { UserPicker } from './user-picker';

export function InvitePanel({
  challengeId,
  invitedIds,
  onInvited,
}: {
  challengeId: string;
  invitedIds: string[];
  onInvited?: () => void;
}) {
  const [state, action, pending] = useActionState<InviteState, FormData>(invitePlayers, {});

  // The invited list is fetched client-side, so revalidatePath can't refresh it —
  // tell the parent to refetch after each successful invite round. useActionState
  // hands back a fresh state object per dispatch, so identity tracks "new result".
  const lastState = useRef<InviteState | null>(null);
  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.invited != null && state.invited > 0) onInvited?.();
  }, [state, onInvited]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="challengeId" value={challengeId} />
      <UserPicker name="userIds" excludeIds={invitedIds} />

      {state.error && <p className="text-[12px] text-danger">{state.error}</p>}
      {state.invited != null && (
        <p className="text-[12px] text-success">
          {state.invited === 0
            ? 'Those players were already invited.'
            : `Invited ${state.invited} player${state.invited === 1 ? '' : 's'}.`}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-[var(--radius-control)] bg-primary px-5 text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Send invites'}
      </button>
    </form>
  );
}
