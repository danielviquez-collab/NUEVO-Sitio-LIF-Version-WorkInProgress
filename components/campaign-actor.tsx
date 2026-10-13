import Image from 'next/image';
import { Droplet } from 'lucide-react';

export function CampaignActor({ actor }: { actor: 'lego' | 'plantas' }) {
  const isLego = actor === 'lego';
  return (
    <div className={`campaign-actor actor-${actor}`} aria-hidden="true">
      <div className="campaign-actor-motion">
        <Image src={`/campaign/${isLego ? 'actor-lego' : 'actriz-plantas'}.webp`} alt="" width={isLego ? 1614 : 1450} height={isLego ? 974 : 1085} loading="lazy" unoptimized />
        {[0, 1, 2, 3].map((index) => <Droplet key={index} className={`actor-tear actor-tear-${index}`} aria-hidden="true" />)}
      </div>
    </div>
  );
}
