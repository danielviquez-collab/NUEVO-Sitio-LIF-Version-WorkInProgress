import Image from 'next/image';
import { officialLinks } from '@/lib/lif-content';

const networks = [
  { name: 'Facebook', icon: 'facebook', href: officialLinks.facebook },
  { name: 'Instagram', icon: 'instagram', href: officialLinks.instagram },
  { name: 'TikTok', icon: 'tiktok', href: officialLinks.tiktok },
  { name: 'YouTube', icon: 'youtube', href: officialLinks.youtube },
];

export function SocialLinks() {
  return (
    <div className="brand-social-links" aria-label="Redes sociales de LIF">
      {networks.map((network) => {
        const icon = (
          <Image
            src={`/brand/${network.icon}.svg`}
            alt=""
            width={21}
            height={21}
            unoptimized
          />
        );
        return (
          <a
            key={network.icon}
            href={network.href}
            target="_blank"
            rel="noreferrer"
            title={network.name}
            aria-label={`${network.name} LIF`}
          >
            {icon}
          </a>
        );
      })}
    </div>
  );
}
