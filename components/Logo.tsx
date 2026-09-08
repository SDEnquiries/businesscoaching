// Business Coaching Accelerator mark (the swoosh used on
// businesscoachingaccelerator.co.uk) — gold + platinum, matching the live
// site's palette. Kept as inline SVG rather than a raster file so it stays
// crisp at any size and is easy to recolor later if the brand changes again.
function Swoosh({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M40 12 C40 12 52 18 56 30 C60 42 52 50 52 50" stroke="#C9A84C" strokeWidth={5} strokeLinecap="round" fill="none" />
      <polygon points="54,46 58,56 48,54" fill="#C9A84C" />
      <path d="M40 68 C40 68 28 62 24 50 C20 38 28 30 28 30" stroke="#9BA8A0" strokeWidth={5} strokeLinecap="round" fill="none" />
      <polygon points="26,34 22,24 32,26" fill="#9BA8A0" />
      <path d="M12 40 C12 40 18 28 30 24 C42 20 50 28 50 28" stroke="#C9A84C" strokeWidth={5} strokeLinecap="round" fill="none" />
      <polygon points="46,26 56,22 54,32" fill="#C9A84C" />
      <path d="M68 40 C68 40 62 52 50 56 C38 60 30 52 30 52" stroke="#9BA8A0" strokeWidth={5} strokeLinecap="round" fill="none" />
      <polygon points="34,54 24,58 26,48" fill="#9BA8A0" />
    </svg>
  );
}

export default function Logo({
  size = 40,
  showText = true,
  textSize = 'base',
  align = 'left',
  light = false,
}: {
  size?: number;
  showText?: boolean;
  textSize?: 'sm' | 'base' | 'lg' | 'xl';
  align?: 'left' | 'center';
  light?: boolean;
}) {
  const nameSizeClass = { sm: 'text-sm', base: 'text-base', lg: 'text-xl', xl: 'text-2xl' }[textSize];

  return (
    <span className={`inline-flex items-center gap-3 ${align === 'center' ? 'flex-col text-center gap-2' : ''}`}>
      <Swoosh size={size} />
      {showText && (
        <span className="leading-tight">
          <span className={`block font-semibold ${nameSizeClass} ${light ? 'text-white' : 'text-brand-700'}`}>
            Business Coaching Accelerator
          </span>
          <span className={`block text-xs ${light ? 'text-white/70' : 'text-gray-400'}`}>
            powered by Switch Direction
          </span>
        </span>
      )}
    </span>
  );
}
