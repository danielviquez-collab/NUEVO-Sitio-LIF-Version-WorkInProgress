'use client';
import '@/app/gaming.css';
import '@/app/memory-game.css';
import '@/app/gaming-legacy.css';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  GAME_CONFIG,
  GAME_SOUND_ASSETS,
  type GameId,
} from '@/lib/gaming/config';
import {
  bootstrapGames,
  gamesApi,
  type Bootstrap,
  type Leaderboard,
} from '@/lib/gaming/client';
import { GameAudio } from '@/lib/gaming/audio';
import type { InitialRanking } from '@/lib/gaming/initial-ranking';
import { track } from '@/lib/analytics';
import { RankingList, RankingPodium } from './gaming/ranking-showcase';
import { LegacyGameHero, type LegacyHero } from './gaming/hero-legacy';
import { GameHeroProposal, type HeroProposal } from './gaming/hero-proposals';
import { GameLoading } from './gaming/game-loading';
import { GameModal } from './gaming/game-modal';
let experienceModule: ReturnType<typeof importExperience> | null = null;
function importExperience() {
  return import('./gaming/game-experience');
}
function loadExperience() {
  experienceModule ??= importExperience().catch((error) => {
    experienceModule = null;
    throw error;
  });
  return experienceModule;
}
const Experience = lazy(() =>
  loadExperience().then((m) => ({
    default: m.GameExperience,
  })),
);
export function GamesHub({
  proposal,
  legacy,
  rankingPreview = false,
  initialRanking = null,
  buttonSound = GAME_SOUND_ASSETS.button,
}: {
  proposal?: HeroProposal;
  legacy?: LegacyHero;
  rankingPreview?: boolean;
  initialRanking?: InitialRanking;
  buttonSound?: string;
} = {}) {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null),
    [error, setError] = useState(''),
    [rankingError, setRankingError] = useState(''),
    [open, setOpen] = useState(false),
    [closing, setClosing] = useState(false),
    [ranking, setRanking] = useState<Leaderboard | null>(
      typeof initialRanking === 'object' ? initialRanking : null,
    ),
    [currentAudio, setCurrentAudio] = useState<GameAudio | null>(null);
  const button = useRef<HTMLButtonElement>(null),
    rank = useRef<HTMLElement>(null),
    audio = useRef<GameAudio | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const exitRequest = useRef<(() => void) | null>(null);
  const returningToRank = useRef(false);
  const entrySound = useRef(0);
  useEffect(() => {
    const timer = window.setTimeout(
      () => void loadExperience().catch(() => {}),
      400,
    );
    return () => clearTimeout(timer);
  }, []);
  const refreshRanking = useCallback(
    async (isCurrent: () => boolean = () => true) => {
      try {
        const value = await gamesApi<Leaderboard>(
          `leaderboard?game=all&limit=${GAME_CONFIG.LEADERBOARD_SIZE}`,
        );
        if (isCurrent()) {
          setRanking(value);
          setRankingError('');
        }
      } catch (e) {
        if (isCurrent())
          setRankingError(
            e instanceof Error
              ? e.message
              : 'No pudimos actualizar el ranking. Intentá de nuevo.',
          );
      }
    },
    [],
  );
  const refresh = useCallback(async () => {
    try {
      const value = await bootstrapGames();
      setBootstrap(value);
      setError('');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo cargar la competencia.',
      );
    }
  }, []);
  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    track('game_hub_view');
    const timer = window.setInterval(() => {
      if (!document.hidden && !open) void refresh();
    }, 30000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [refresh, open]);
  useEffect(() => {
    if (!bootstrap?.deviceId) return;
    let canceled = false;
    const update = () => {
      if (!canceled) void refreshRanking(() => !canceled);
    };
    update();
    const timer = window.setInterval(() => {
      if (!document.hidden && !open) update();
    }, 30000);
    track('leaderboard_view', { game: 'all' });
    return () => {
      canceled = true;
      clearInterval(timer);
    };
  }, [open, bootstrap?.deviceId, refreshRanking]);
  useEffect(() => () => audio.current?.dispose(), []);
  const close = useCallback(() => {
    entrySound.current++;
    setClosing(true);
  }, []);
  const finishClose = useCallback(() => {
    setOpen(false);
    setClosing(false);
    exitRequest.current = null;
    void refresh();
    requestAnimationFrame(() => {
      if (returningToRank.current) {
        returningToRank.current = false;
        rank.current?.scrollIntoView({
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
          block: 'start',
        });
        rank.current?.focus({ preventScroll: true });
      } else button.current?.focus({ preventScroll: true });
    });
  }, [refresh]);
  const updateAttempts = useCallback(
    (attempts: Record<GameId, number>) =>
      setBootstrap((previous) =>
        previous ? { ...previous, attempts } : previous,
      ),
    [],
  );
  const returnRank = useCallback(
    (_game: GameId) => {
      returningToRank.current = true;
      close();
    },
    [close],
  );
  const play = () => {
    if (open) return;
    audio.current ??= new GameAudio(buttonSound);
    audio.current.unlock();
    const player = audio.current;
    const entry = ++entrySound.current;
    if (player.buffers.has(player.buttonSound)) player.play('button');
    else
      void player.ready
        ?.then(() => {
          if (entrySound.current === entry) player.play('button');
        })
        .catch(() => {});
    setCurrentAudio(audio.current);
    setOpen(true);
    track('game_play_cta');
  };
  return (
    <>
      {proposal ? (
        <GameHeroProposal
          variant={proposal}
          ready={!!bootstrap}
          onPlay={play}
          buttonRef={button}
        />
      ) : (
        <LegacyGameHero
          variant={legacy ?? 'rectangle'}
          ready={!!bootstrap}
          onPlay={play}
          buttonRef={button}
        />
      )}
      {(error || rankingError) && (
        <div className="game-hub-error" role="alert">
          {error || rankingError}
          <button
            type="button"
            onClick={() => {
              void refresh();
              if (bootstrap?.deviceId) void refreshRanking();
            }}
          >
            Reintentar
          </button>
        </div>
      )}
      <section
        ref={rank}
        className="game-hub-ranking"
        id="ranking"
        tabIndex={-1}
        aria-labelledby="lif-ranking-title"
      >
        <div className="game-ranking-heading">
          <div>
            <p className="eyebrow">EL RETO ESTÁ PUESTO</p>
            <h2 id="lif-ranking-title">
              ¿Hasta dónde
              <br />
              llegás vos?
            </h2>
          </div>
          <p className="game-ranking-caption game-ranking-list-caption">
            Top {GAME_CONFIG.LEADERBOARD_SIZE} LIF
          </p>
          <RankingList ranking={ranking} />
        </div>
        <div className="game-ranking-content">
          <div id="lif-ranking-panel">
            <RankingPodium ranking={ranking} />
          </div>
        </div>
      </section>
      <section
        className="game-hub-rules"
        id="reglamento"
        aria-labelledby="lif-rules-title"
      >
        <p className="eyebrow">ANTES DE PARTICIPAR</p>
        <h2 id="lif-rules-title">Reglas del juego.</h2>
        <div>
          <details>
            <summary>Partidas e intentos</summary>
            <p>
              {bootstrap?.localTesting
                ? 'Cada juego dura hasta tres minutos. Los intentos son ilimitados en esta prueba local. Cada partida se guarda por separado.'
                : 'Cada juego dura hasta tres minutos. Tenés tres intentos por juego al día, que se renuevan a medianoche, hora de Costa Rica. El intento se utiliza cuando confirmás INICIAR JUEGO. Salir o recargar no lo devuelve.'}
            </p>
          </details>
          <details>
            <summary>Puntajes y ranking</summary>
            <p>
              Memoria LIF y Snake LIF compiten en un solo Top 20. Cada nickname
              aparece una sola vez, con su mejor partida entre ambos juegos. En
              caso de empate, queda arriba quien alcanzó ese puntaje primero.
              Cada partida se registra por separado con los datos que ingresás
              al terminar; cambiar los datos en otra partida no modifica las
              anteriores. El ranking actual incluye únicamente partidas de las
              reglas actuales; el historial anterior se conserva.
            </p>
          </details>
          <details>
            <summary>Snake LIF</summary>
            <p>
              Sabor normal: +50; nuevo: +300; logo: +150. Cada sobre LIF agrega
              un segmento; el logo no hace crecer el cuerpo. Al llegar a 15
              segmentos ganás +1.000, volvés a tres segmentos y la velocidad
              aumenta un 6 % por bonus. Un rival resta 100 puntos y dos
              segmentos, con mínimos de cero puntos y tres segmentos. El escudo
              bloquea un rival; chocar contra el borde o el cuerpo termina la
              partida, incluso con escudo.
            </p>
            <p>
              Recogé los poderes: ×2 dura diez segundos; Turbo dura siete y
              duplica los puntos mientras acelera el movimiento y el reloj ×1,4.
              Turbo y ×2 no se acumulan en ×4 ni multiplican el Super Bonus o
              las penalizaciones.
            </p>
          </details>
          <details>
            <summary>Memoria LIF</summary>
            <p>
              Las parejas encontradas quedan visibles. Completá las ocho para
              renovar todo el tablero: las cartas se muestran brevemente y
              vuelven a quedar boca abajo, en un orden nuevo.
            </p>
            <p>
              Pareja normal: +{GAME_CONFIG.MEMORY_MATCH_NORMAL_POINTS}; nuevo
              sabor: +{GAME_CONFIG.MEMORY_MATCH_NEW_FLAVOR_POINTS}; logo: +
              {GAME_CONFIG.MEMORY_LOGO_MATCH_POINTS}. Cada seis parejas ganás +
              {GAME_CONFIG.MEMORY_SUPER_BONUS_POINTS}. Un fallo es destapar dos
              cartas distintas sin pareja: el primero de cada racha es gratis y
              desde el segundo resta 20 puntos, sin bajar de cero. Encontrar una
              pareja reinicia la Racha de errores. Diez fallos seguidos terminan
              la partida, independientemente del puntaje. También termina al
              agotarse los tres minutos. ×2 dura diez segundos y no multiplica
              el Super Bonus ni las penalizaciones.
            </p>
          </details>
          <details>
            <summary>Participación y datos</summary>
            <p>
              Al terminar podés registrar nombre, correo, teléfono y nickname,
              sin crear una cuenta. Solo el nickname y el puntaje se muestran en
              el ranking. Esta validación local no ofrece premios; las bases de
              una promoción deberán aprobarse antes de su publicación.
            </p>
          </details>
          <details>
            <summary>Reglamentos</summary>
            <p>
              Consultá las condiciones de participación, puntajes e intentos
              indicadas arriba. No hay una promoción con premios activa ni un
              reglamento promocional aprobado para esta etapa de validación.
            </p>
          </details>
        </div>
      </section>
      {open && currentAudio && (
        <GameModal
          dialogRef={dialog}
          closing={closing}
          onCancel={() => (exitRequest.current ?? close)()}
          onClosed={finishClose}
        >
          <Suspense fallback={<GameLoading onClose={close} />}>
            <Experience
              dialogRef={dialog}
              exitRequestRef={exitRequest}
              closing={closing}
              bootstrap={bootstrap}
              rankingPreview={rankingPreview}
              audio={currentAudio}
              onClose={close}
              onRanking={returnRank}
              onAttempts={updateAttempts}
            />
          </Suspense>
        </GameModal>
      )}
    </>
  );
}
