import type { SVGProps } from "react";

/**
 * Minimal hand-rolled icon set (24x24, 1.75 stroke) so the app doesn't pull in an
 * icon library for a dozen glyphs. Every icon is decorative by default
 * (aria-hidden) — pass aria-label on the wrapping control instead.
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconRadar = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M0 0 C4.101939 0.01760489 4.95892934 0.14333151 8.3125 2.8125 C8.951875 3.658125 9.59125 4.50375 10.25 5.375 C10.58 5.705 10.91 6.035 11.25 6.375 C11.68836682 9.75668693 11.73685233 12.99844355 11.25 16.375 C8.8125 19.4375 8.8125 19.4375 6.25 21.375 C5.92 21.705 5.59 22.035 5.25 22.375 C1.86831307 22.81336682 -1.37344355 22.86185233 -4.75 22.375 C-7.8125 19.9375 -7.8125 19.9375 -9.75 17.375 C-10.08 17.045 -10.41 16.715 -10.75 16.375 C-11.18836682 12.99331307 -11.23685233 9.75155645 -10.75 6.375 C-8.3125 3.3125 -8.3125 3.3125 -5.75 1.375 C-4.10843264 -0.26656736 -2.25784199 0.08684008 0 0 Z M-3.75 4.375 C-3.42 5.035 -3.09 5.695 -2.75 6.375 C-1.76 6.705 -0.77 7.035 0.25 7.375 C0.58 8.035 0.91 8.695 1.25 9.375 C1.91 9.375 2.57 9.375 3.25 9.375 C3.58 8.715 3.91 8.055 4.25 7.375 C5.24 6.715 6.23 6.055 7.25 5.375 C1.71015608 2.06348851 1.71015608 2.06348851 -3.75 4.375 Z M-6.75 5.375 C-7.08 6.695 -7.41 8.015 -7.75 9.375 C-6.76 9.705 -5.77 10.035 -4.75 10.375 C-4.05062468 11.69147119 -3.38270867 13.02522151 -2.75 14.375 C-2.09 14.705 -1.43 15.035 -0.75 15.375 C-0.125 17.9375 -0.125 17.9375 0.25 20.375 C0.91 20.045 1.57 19.715 2.25 19.375 C2.90555119 16.84766765 2.90555119 16.84766765 3.25 14.375 C5.23 13.715 7.21 13.055 9.25 12.375 C8.92 11.055 8.59 9.735 8.25 8.375 C5.13214887 9.02144661 5.13214887 9.02144661 4.25 11.375 C0.25 11.375 0.25 11.375 -1.875 9.375 C-2.49375 8.715 -3.1125 8.055 -3.75 7.375 C-4.41 7.375 -5.07 7.375 -5.75 7.375 C-6.08 6.715 -6.41 6.055 -6.75 5.375 Z M-8.75 11.375 C-7.54271391 14.88702512 -7.54271391 14.88702512 -5.75 18.375 C-3.68109581 19.41789755 -3.68109581 19.41789755 -1.75 19.375 C-2.08 18.385 -2.41 17.395 -2.75 16.375 C-3.41 16.045 -4.07 15.715 -4.75 15.375 C-5.875 13.3125 -5.875 13.3125 -6.75 11.375 C-7.41 11.375 -8.07 11.375 -8.75 11.375 Z M5.25 15.375 C4.92 16.365 4.59 17.355 4.25 18.375 C5.24 18.045 6.23 17.715 7.25 17.375 C7.25 16.715 7.25 16.055 7.25 15.375 C6.59 15.375 5.93 15.375 5.25 15.375 Z" fill="currentColor" stroke="none" transform="translate(11.75,0.625)" />
  </svg>
);

export const IconWifi = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M2 8.5a15.4 15.4 0 0 1 20 0" />
    <path d="M5.5 12.3a10.6 10.6 0 0 1 13 0" />
    <path d="M9 16a5.4 5.4 0 0 1 6 0" />
    <circle cx="12" cy="19.2" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconWifiOff = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M2 2l20 20" />
    <path d="M8.5 8.8a15.4 15.4 0 0 1 11 2.2" />
    <path d="M2 8.5a15.4 15.4 0 0 1 4.3-3" />
    <path d="M5.5 12.3a10.6 10.6 0 0 1 3-1.6" />
    <path d="M12.3 12.9a5.4 5.4 0 0 1 2.7 1.1" />
    <path d="M9 16a5.4 5.4 0 0 1 3-1" />
    <circle cx="12" cy="19.2" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconClose = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconAlertTriangle = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M10.6 3.5a1.6 1.6 0 0 1 2.8 0l8.4 14.6a1.6 1.6 0 0 1-1.4 2.4H3.6a1.6 1.6 0 0 1-1.4-2.4z" />
    <path d="M12 9.5v4.2" />
    <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconWaves = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M2 8c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
    <path d="M2 13.5c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
    <path d="M2 19c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
  </svg>
);

export const IconMapPin = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 21s7-6.8 7-12a7 7 0 1 0-14 0c0 5.2 7 12 7 12z" />
    <circle cx="12" cy="9" r="2.4" />
  </svg>
);

export const IconSun = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </svg>
);

export const IconMoon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
  </svg>
);

export const IconChevronDown = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const IconInbox = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 12.5l3.2-7.4A1.6 1.6 0 0 1 7.7 4h8.6a1.6 1.6 0 0 1 1.5 1.1l3.2 7.4" />
    <path d="M3 12.5V18a1.6 1.6 0 0 0 1.6 1.6h14.8A1.6 1.6 0 0 0 21 18v-5.5" />
    <path d="M3 12.5h5.2a1 1 0 0 1 .9.6l.6 1.3a1 1 0 0 0 .9.6h2.8a1 1 0 0 0 .9-.6l.6-1.3a1 1 0 0 1 .9-.6H21" />
  </svg>
);

export const IconAlertOffline = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5" />
    <circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);
