import Image from 'next/image';
import '@/app/section-in-progress.css';

export function SectionInProgress() {
  return (
    <section className="section-in-progress" aria-labelledby="section-in-progress-title">
      <h2 className="sr-only" id="section-in-progress-title">Confesiones en proceso</h2>
      <Image src="/brand/work-in-progress.png" alt="Work in progress" width={6000} height={3375} unoptimized />
      <p>Por el momento esta sección se encuentra bajo diseño y construcción. Pura Vida 👍🏻!</p>
    </section>
  );
}
