import type { Flavor } from '@/lib/lif-content';
import Image from 'next/image';

export function FlavorPack({ flavor, className = '', eager = false }: { flavor: Flavor; className?: string; eager?: boolean }) {
  return (
    <div className={`pack-stage ${className}`}>
      {flavor.isNew && <span className="new-sticker">Nuevo sabor</span>}
      {flavor.image ? (
        <Image
          className="pack-image"
          src={flavor.image}
          alt={`Empaque LIF ${flavor.name}`}
          width={flavor.isNew ? 992 : 480}
          height={flavor.isNew ? 1113 : 600}
          priority={Boolean(flavor.isNew && flavor.image)}
          loading={eager ? 'eager' : undefined}
          unoptimized
        />
      ) : (
        <div className="pack-pending" aria-label={`Empaque oficial pendiente: ${flavor.name}`}>
          <span className="pending-brand">LIF</span>
          <span className="pending-flavor">{flavor.name}</span>
          <span className="pending-note">Arte oficial pendiente</span>
        </div>
      )}
    </div>
  );
}
