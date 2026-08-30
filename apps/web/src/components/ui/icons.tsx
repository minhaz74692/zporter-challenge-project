import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const S = (props: P) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    width={18}
    height={18}
    {...props}
  />
);

export const IconFeed = (p: P) => (
  <S {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </S>
);
export const IconDashboard = (p: P) => (
  <S {...p}>
    <path d="M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10" />
  </S>
);
export const IconTest = (p: P) => (
  <S {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </S>
);
export const IconPrograms = (p: P) => (
  <S {...p}>
    <path d="M12 3l9 5-9 5-9-5 9-5Z" />
    <path d="M3 13l9 5 9-5" />
  </S>
);
export const IconChallenges = (p: P) => (
  <S {...p}>
    <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
    <path d="M16 5h3a3 3 0 0 1-3 3M8 5H5a3 3 0 0 0 3 3M12 11v4M9 20h6M10 17h4" />
  </S>
);
export const IconContact = (p: P) => (
  <S {...p}>
    <path d="M21 15a3 3 0 0 1-3 3H8l-4 3V6a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v9Z" />
  </S>
);
export const IconBiography = (p: P) => (
  <S {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="M5 17c.6-2 2.2-3 4-3s3.4 1 4 3M14 9h5M14 13h5" />
  </S>
);
export const IconSupport = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 17v.01M9.5 9.5a2.5 2.5 0 1 1 3.6 2.3c-.7.4-1.1 1-1.1 1.9" />
  </S>
);
export const IconSearch = (p: P) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </S>
);
export const IconBell = (p: P) => (
  <S {...p}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6M10 20a2 2 0 0 0 4 0" />
  </S>
);
export const IconChat = (p: P) => (
  <S {...p}>
    <path d="M20 14a2 2 0 0 1-2 2H8l-4 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8Z" />
  </S>
);
export const IconChevronDown = (p: P) => (
  <S {...p}>
    <path d="m6 9 6 6 6-6" />
  </S>
);
export const IconChevronLeft = (p: P) => (
  <S {...p}>
    <path d="m15 18-6-6 6-6" />
  </S>
);
export const IconX = (p: P) => (
  <S {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </S>
);
export const IconCalendar = (p: P) => (
  <S {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </S>
);
export const IconClock = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </S>
);
export const IconImage = (p: P) => (
  <S {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="m4 19 5-5 4 4 3-3 4 4" />
  </S>
);
export const IconVideo = (p: P) => (
  <S {...p}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="m16 10 5-3v10l-5-3" />
  </S>
);
export const IconPlay = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m10 9 5 3-5 3V9Z" />
  </S>
);
export const IconLink = (p: P) => (
  <S {...p}>
    <path d="M10 13a4 4 0 0 0 6 .5l2-2a4 4 0 0 0-6-6l-1 1M14 11a4 4 0 0 0-6-.5l-2 2a4 4 0 0 0 6 6l1-1" />
  </S>
);
export const IconFilter = (p: P) => (
  <S {...p}>
    <path d="M4 5h16M7 12h10M10 19h4" />
  </S>
);
export const IconPlus = (p: P) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);
export const IconDiary = (p: P) => (
  <S {...p}>
    <path d="M6 3h11a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2Z" />
    <path d="M9 8h6M9 12h6" />
  </S>
);
