// Lucide ya no incluye íconos de marcas, así que se dibujan aquí
const PATHS = {
  facebook: 'M14 8h3V4h-3c-2.8 0-4.5 1.9-4.5 4.6V11H7v4h2.5v9h4v-9H17l.5-4h-4V8.8c0-.5.3-.8.5-.8Z',
  instagram:
    'M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.3-3.3a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z',
  tiktok:
    'M16.6 2c.4 2.3 1.9 3.8 4.4 4v3.3c-1.6 0-3-.5-4.3-1.3v6.6c0 3.8-2.7 6.4-6.2 6.4A6.1 6.1 0 0 1 4.3 15c0-3.6 3-6.3 6.8-5.9v3.5c-1.7-.4-3.3.7-3.3 2.4 0 1.4 1.1 2.5 2.6 2.5 1.6 0 2.7-1.1 2.7-3.1V2h3.5Z',
};

export function SocialIcon({name, size = 22, className}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className={className} fill="currentColor">
      <path d={PATHS[name]} />
    </svg>
  );
}
