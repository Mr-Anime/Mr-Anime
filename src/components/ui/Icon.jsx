const PATHS = {
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 3-4.35-4.35',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6 6 18',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  chevronDown: 'M6 9l6 6 6-6',
  play: 'M6 4l14 8-14 8V4Z',
  star: 'M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3 1.1-6.5L2.6 9.3l6.5-.9L12 2.5Z',
  heart: 'M12 20.5s-7.5-4.7-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3.5c0 5.3-7.5 10-7.5 10Z',
  bookmark: 'M6 3h12v18l-6-4-6 4V3Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3.5 2',
  calendar: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3V10.5Z',
  grid: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  user: 'M20 21a8 8 0 1 0-16 0M12 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z',
  settings:
    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5a8 8 0 0 0-.13-1.4l2.1-1.62-2-3.46-2.47 1a8 8 0 0 0-2.42-1.4L14.7 2h-4l-.38 2.62a8 8 0 0 0-2.42 1.4l-2.47-1-2 3.46L5.53 10.6a8 8 0 0 0 0 2.8l-2.1 1.62 2 3.46 2.47-1a8 8 0 0 0 2.42 1.4l.38 2.62h4l.38-2.62a8 8 0 0 0 2.42-1.4l2.47 1 2-3.46-2.1-1.62c.08-.46.13-.92.13-1.4Z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3',
  check: 'M5 13l4 4L19 7',
  plus: 'M12 5v14M5 12h14',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13h.01M11 12h1v4h1',
  refresh: 'M21 12a9 9 0 1 1-3-6.7M21 3v6h-6',
  filter: 'M3 5h18M6 12h12M10 19h4',
  film: 'M3 4h18v16H3V4Zm6 0v16M15 4v16M3 9h6M3 15h6M15 9h6M15 15h6',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  external: 'M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5',
  google: 'M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.74 2.99-4.3 2.99-7.35Z M12 22c2.7 0 4.96-.9 6.61-2.42l-3.23-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.08v2.58A10 10 0 0 0 12 22Z M6.41 13.92A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.92V7.5H3.08A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.5l3.33-2.58Z M12 6.04c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.92 5.5l3.33 2.58C7.2 7.8 9.4 6.04 12 6.04Z',
  pause: 'M9 5v14M15 5v14',
  volume: 'M4 9v6h4l5 4V5L8 9H4Z M19 8.5a5 5 0 0 1 0 7',
  volumeOff: 'M4 9v6h4l5 4V5L8 9H4Z M22 9l-5 6M17 9l5 6',
  share: 'M12 3v12M8 7l4-4 4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6',
  mail: 'M3 6h18v12H3V6Zm0 0 9 7 9-7',
  lock: 'M6 11h12v10H6V11Zm3 0V7a3 3 0 0 1 6 0v4',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'M3 3l18 18M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.4 7.9C3.6 9.6 2 12 2 12s3.5 6 10 6c1.2 0 2.3-.2 3.3-.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  edit: 'M4 20h4L20 8l-4-4L4 16v4Zm10-14 4 4',
  checkCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-4-9 3 3 5-6',
  xCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3-12 6 6m0-6-6 6',
  skipBack: 'M18 5v14L7 12l11-7ZM5 5v14',
  skipForward: 'M6 5v14l11-7L6 5Zm13 0v14',
  fastForward: 'M4 5l9 7-9 7V5Zm9 0l9 7-9 7V5Z',
  users: 'M16 20a4 4 0 0 0-8 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 8a3 3 0 0 0-3-3M20 6a3 3 0 1 1-2 5',
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3Zm-3.5 9 2.5 2.5 4.5-5',
  logIn: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
};

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.8, fill = false, ...rest }) {
  const d = PATHS[name];
  if (!d) return null;
  const multi = d.includes(' M ');
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      <path d={multi ? undefined : d} />
      {multi ? d.split(' M ').map((p, i) => <path key={i} d={i === 0 ? p : `M ${p}`} />) : null}
    </svg>
  );
}
