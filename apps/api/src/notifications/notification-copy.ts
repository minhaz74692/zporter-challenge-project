import type { NotificationType } from '@zporter/shared';

/**
 * Title + body for each notification type, in the Figma format
 * (`"Challenge Headline" is now live` / `Will you Accept or Decline?`).
 * Keeping it in one place so every producer stays consistent.
 */
export function notificationCopy(
  type: NotificationType,
  challengeTitle: string,
  actorName?: string,
): { title: string; body: string } {
  const quoted = `"${challengeTitle}"`;
  const who = actorName ?? 'A player';

  switch (type) {
    case 'challenge_invite':
    case 'challenge_launched':
      return { title: `${quoted} is now live`, body: 'Will you Accept or Decline?' };
    case 'challenge_ended':
      return { title: `${quoted} is now finished`, body: 'Who is the winner?' };
    case 'challenge_reminder':
      return {
        title: `${quoted} closes in 48h`,
        body: 'We have not seen your results yet!',
      };
    case 'result_submitted':
      return { title: `${who} reported a result`, body: quoted };
    case 'result_verify_request':
      return { title: `${who} asks you to verify a result`, body: quoted };
    case 'result_verified':
      return { title: 'Your result was verified', body: quoted };
  }
}
