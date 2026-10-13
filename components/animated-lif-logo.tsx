import { lifLogoVector, lifLogoViewBox } from '@/lib/lif-logo-vector';

export function AnimatedLifLogo({ animate = true }: { animate?: boolean }) {
  return (
    <svg className={`lif-motion-logo${animate ? ' is-playing' : ''}`} viewBox={lifLogoViewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label="LIF, una marca de LAICA">
      {([
        ['leaf', 'logo-leaf'], ['letterL', 'logo-letter logo-letter-l'],
        ['letterI', 'logo-letter logo-letter-i'], ['letterF', 'logo-letter logo-letter-f'],
        ['dot', 'logo-dot'], ['laica', 'logo-laica'],
      ] as const).map(([part, className]) => (
        <g key={part} className={className}>
          {lifLogoVector[part].map((path, index) => <path key={index} {...path} />)}
        </g>
      ))}
    </svg>
  );
}
