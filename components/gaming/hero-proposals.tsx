'use client';
/* eslint-disable next/no-img-element */
import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { GAME_FLAVORS } from '@/lib/gaming/config';
import { HeroSnake } from './hero-snake';
import { GameHeroMeta, type HeroActionProps } from './hero-legacy';
import { useHeroMotion } from './hero-motion';
import { GameHeroChallenge } from './hero-challenge';

export type HeroProposal = 'arcade' | 'arena' | 'power';
const flavors = GAME_FLAVORS.filter((flavor) => flavor.isNew);
const loopFlavors = [...flavors, ...flavors];

function NewSticker() {
  return (
    <span className="proposal-new-sticker">
      NUEVO
      <br />
      SABOR
    </span>
  );
}

function FlavorDisplay({
  mode,
  playing,
  reduced,
}: {
  mode: HeroProposal;
  playing: boolean;
  reduced: boolean;
}) {
  const [viewport, api] = useEmblaCarousel({
    loop: true,
    align: 'center',
    duration: 32,
  });
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    if (!api || mode !== 'power') return;
    const select = () => setActive(api.selectedScrollSnap());
    const down = () => setDragging(true);
    const up = () => setDragging(false);
    select();
    api
      .on('select', select)
      .on('reInit', select)
      .on('pointerDown', down)
      .on('pointerUp', up);
    return () => {
      api
        .off('select', select)
        .off('reInit', select)
        .off('pointerDown', down)
        .off('pointerUp', up);
    };
  }, [api, mode]);
  useEffect(() => {
    if (!playing || engaged || dragging) return;
    const timer = window.setInterval(() => {
      if (mode === 'power') api?.scrollNext();
      else setActive((value) => (value + 1) % flavors.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [api, mode, playing, engaged, dragging]);
  const choose = (index: number) => {
    if (mode !== 'power') {
      setActive(index);
      return;
    }
    if (!api) return;
    const current = api.selectedScrollSnap();
    // Choose the nearest duplicate so manual navigation never jumps across the loop.
    const distance = (value: number) =>
      Math.min(
        Math.abs(value - current),
        loopFlavors.length - Math.abs(value - current),
      );
    api.scrollTo(
      distance(index) <= distance(index + flavors.length)
        ? index
        : index + flavors.length,
      reduced,
    );
  };
  return (
    <div
      className={`proposal-flavors proposal-flavors-${mode}`}
      data-active={active % flavors.length}
      data-playing={playing && !engaged && !dragging}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setEngaged(true);
      }}
      onPointerLeave={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setEngaged(false);
      }}
    >
      <NewSticker />
      {mode === 'power' ? (
        <div
          className="proposal-sequence-viewport"
          ref={viewport}
          aria-label="Nuevos sabores LIF"
        >
          <div className="proposal-sequence-track">
            {loopFlavors.map((flavor, index) => (
              <div
                className="proposal-sequence-slide"
                key={`${flavor.name}-${index}`}
                aria-hidden={active !== index}
              >
                <img
                  className="proposal-sequence-pack"
                  data-active={active === index}
                  src={flavor.image}
                  alt={active === index ? flavor.name : ''}
                  width={992}
                  height={1113}
                  loading="eager"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="proposal-pack-stage">
          {flavors.map((flavor, index) => (
            <div
              key={flavor.name}
              className="proposal-pack-position"
              data-active={active === index}
            >
              <img
                src={flavor.image}
                alt={active === index ? flavor.name : ''}
                aria-hidden={active !== index}
                width={992}
                height={1113}
                loading="eager"
              />
            </div>
          ))}
        </div>
      )}
      <div className="proposal-flavor-controls">
        {mode === 'power' && (
          <button
            type="button"
            className="proposal-arrow"
            title="Sabor anterior"
            aria-label="Sabor anterior"
            onClick={() => api?.scrollPrev(reduced)}
          >
            <ChevronLeft />
          </button>
        )}
        <div>
          <p className="proposal-active-name">
            {flavors[active % flavors.length].name}
          </p>
          <div className="proposal-dots" aria-label="Elegir sabor">
            {flavors.map((flavor, index) => (
              <button
                key={flavor.name}
                type="button"
                title={flavor.name}
                aria-label={flavor.name}
                aria-current={
                  active % flavors.length === index ? 'true' : undefined
                }
                onClick={() => choose(index)}
              />
            ))}
          </div>
        </div>
        {mode === 'power' && (
          <button
            type="button"
            className="proposal-arrow"
            title="Sabor siguiente"
            aria-label="Sabor siguiente"
            onClick={() => api?.scrollNext(reduced)}
          >
            <ChevronRight />
          </button>
        )}
      </div>
    </div>
  );
}

export function GameHeroProposal({
  variant,
  ready,
  onPlay,
  buttonRef,
}: HeroActionProps & { variant: HeroProposal }) {
  const { element, playing, reduced } = useHeroMotion();
  const action = (
    <div className="proposal-action">
      <button
        ref={buttonRef}
        className="proposal-play"
        type="button"
        disabled={!ready}
        onClick={onPlay}
      >
        <Play aria-hidden="true" fill="currentColor" />
        <span>JUGAR</span>
      </button>
      <GameHeroMeta />
    </div>
  );
  return (
    <section
      className={`lif-games-hero game-hero-proposal proposal-${variant}`}
      aria-labelledby="lif-games-title"
    >
      <HeroSnake />
      <div
        ref={element}
        className="proposal-composition"
        data-playing={playing}
        data-reduced={reduced}
      >
        <div className="proposal-heading">
          <h1 id="lif-games-title">
            <span className="game-title-line">Jugá</span>
            <span className="game-title-line">
              con <span className="game-title-brand">LIF.</span>
            </span>
          </h1>
          <GameHeroChallenge />
          {variant === 'arcade' && action}
        </div>
        {variant !== 'arcade' && action}
        <FlavorDisplay mode={variant} playing={playing} reduced={reduced} />
      </div>
    </section>
  );
}
