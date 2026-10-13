'use client';
import '@/app/memory-game.css';
// These local optimized images use the same URLs as the game's canvas preloader.
/* eslint-disable next/no-img-element, jsx-a11y/prefer-tag-over-role */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SubmitEvent,
  type RefObject,
} from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronLeft,
  Clock3,
  Eye,
  Gamepad2,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import {
  GAME_CONFIG as C,
  GAME_FLAVORS,
  GAME_NAMES,
  type GameId,
} from '@/lib/gaming/config';
import {
  gamesApi,
  type Bootstrap,
  type Leaderboard,
  type Result,
  type Session,
} from '@/lib/gaming/client';
import { loadGameImages } from '@/lib/gaming/render';
import { type Direction, type GameState } from '@/lib/gaming/engine';
import { GameAudio } from '@/lib/gaming/audio';
import {
  limitNickname,
  nicknameValidationMessage,
} from '@/lib/gaming/nickname';
import { track } from '@/lib/analytics';
import { setGameSessionPhase } from '@/lib/game-session';
import { availableRandomGames } from '@/lib/gaming/random-selection';
import { previewLeaderboard } from '@/lib/gaming/leaderboard-preview';
import { GameBoard, type Snapshot, type BoardControl } from './game-board';
import { GamePreview } from './game-preview';
import { GameCurtain } from './curtain';
import { CURTAIN_TEXTURE_ASSET } from '@/lib/gaming/curtain-motion';
import { LeaderboardTable } from './leaderboard';
import { GameLoading } from './game-loading';
import { GameRoulette } from './game-roulette';
import { InstructionsScrollCue } from './instructions-scroll-cue';
import { TouchGestureHint } from './touch-gesture-hint';
import { formatScore } from '@/lib/gaming/format-score';
import { FormSubmissionStatus } from '../form-submission-status';
import { playFormSendSound, stopFormSendSound } from '@/lib/form-submission-audio';
type Phase =
  | 'loading'
  | 'curtain'
  | 'select'
  | 'roulette'
  | 'instructions'
  | 'countdown'
  | 'preparing'
  | 'playing'
  | 'finishing'
  | 'result'
  | 'register'
  | 'rank';
function time(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
function defeatMessage(reason: string | null | undefined) {
  if (reason === 'error_streak')
    return 'Llegaste a 10 errores seguidos sin encontrar pareja.';
  if (reason === 'wall') return 'Chocaste contra el borde del tablero.';
  if (reason === 'self') return 'Chocaste contra el cuerpo del Snake.';
  return '';
}
function updateNicknameField(input: HTMLInputElement) {
  input.value = limitNickname(input.value);
  input.setCustomValidity(nicknameValidationMessage(input.value));
}
function DirectionButton({
  direction,
  onMove,
  disabled,
}: {
  direction: Direction;
  onMove: (direction: Direction) => void;
  disabled: boolean;
}) {
  const repeat = useRef<number | null>(null),
    Icon = { left: ArrowLeft, right: ArrowRight, up: ArrowUp, down: ArrowDown }[
      direction
    ];
  const clear = () => {
    if (repeat.current) clearInterval(repeat.current);
    repeat.current = null;
  };
  useEffect(() => clear, []);
  return (
    <button
      type="button"
      className={`game-direction game-direction-${direction}`}
      aria-label={`Mover ${{ left: 'a la izquierda', right: 'a la derecha', up: 'hacia arriba', down: 'hacia abajo' }[direction]}`}
      disabled={disabled}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onMove(direction);
        clear();
        repeat.current = window.setInterval(() => onMove(direction), 145);
      }}
      onPointerUp={clear}
      onPointerCancel={clear}
      onLostPointerCapture={clear}
      onClick={(event) => {
        if (event.detail === 0) onMove(direction);
      }}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}
export function GameExperience({
  dialogRef: dialog,
  exitRequestRef,
  closing,
  bootstrap,
  rankingPreview = false,
  audio,
  onClose,
  onRanking,
  onAttempts,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  exitRequestRef: RefObject<(() => void) | null>;
  closing: boolean;
  bootstrap: Bootstrap | null;
  rankingPreview?: boolean;
  audio: GameAudio;
  onClose: () => void;
  onRanking: (game: GameId) => void;
  onAttempts: (value: Record<GameId, number>) => void;
}) {
  const [phase, setCurrentPhase] = useState<Phase>('loading');
  const instructionsScroll = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>('loading');
  const registrationSending = useRef(false);
  const [entryFromCurtain, setEntryFromCurtain] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setPhase = useCallback((next: Phase) => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    const commit = () => {
      setEntryFromCurtain(phaseRef.current === 'curtain' && next === 'select');
      phaseRef.current = next;
      setCurrentPhase(next);
      setTransitioning(false);
    };
    const immediate =
      ['loading', 'curtain', 'playing', 'preparing'].includes(
        phaseRef.current,
      ) ||
      next === 'playing' ||
      next === 'finishing' ||
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (immediate) commit();
    else {
      setTransitioning(true);
      transitionTimer.current = setTimeout(commit, 180);
    }
  }, []);
  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (closing && transitionTimer.current)
      clearTimeout(transitionTimer.current);
  }, [closing]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  const errorRef = useRef('');
  const [game, setGame] = useState<GameId>('memory_lif'),
    [count, setCount] = useState(3),
    [session, setSession] = useState<Session | null>(null);
  const [hud, setHud] = useState<GameState | null>(null),
    [paused, setPaused] = useState(false),
    [exit, setExit] = useState(false),
    [muted, setMuted] = useState(audio.muted);
  const [images, setImages] = useState<Map<string, HTMLImageElement> | null>(
      null,
    ),
    [error, setError] = useState(''),
    [result, setResult] = useState<Result | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [touchHint, setTouchHint] = useState(false);
  useEffect(() => {
    errorRef.current = error;
  }, [error]);
  const [ranking, setRanking] = useState<Leaderboard | null>(null),
    [attempts, setAttempts] = useState(
      bootstrap?.attempts ?? { memory_lif: 3, snake: 3 },
    ),
    [busy, setBusy] = useState(false);
  const snapshot = useRef<Snapshot | null>(null),
    control = useRef<BoardControl | null>(null),
    lastEvent = useRef(0),
    endOnce = useRef(false),
    savedPayload = useRef<unknown>(null),
    startRequest = useRef<string | null>(null),
    active = useRef(true);
  const checkpointInFlight = useRef<Promise<boolean> | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  const requestExit = useCallback(() => {
    if (registrationSending.current) return;
    if (phaseRef.current === 'playing') {
      setPaused(true);
      setExit(true);
    } else if (
      !['preparing', 'countdown'].includes(phaseRef.current) &&
      (phaseRef.current !== 'finishing' || !!errorRef.current)
    )
      closeRef.current();
  }, []);
  useEffect(() => {
    exitRequestRef.current = requestExit;
    return () => {
      if (exitRequestRef.current === requestExit) exitRequestRef.current = null;
    };
  }, [exitRequestRef, requestExit]);
  useEffect(() => {
    let canceled = false;
    void audio.ready
      ?.then(() => {
        if (!canceled) setAudioReady(true);
      })
      .catch(() => {
        if (!canceled)
          setError(
            'No se pudieron preparar los audios. Cerrá y volvé a intentar.',
          );
      });
    return () => {
      canceled = true;
    };
  }, [audio]);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      audio.stop();
      stopFormSendSound();
    };
  }, [audio]);
  useEffect(() => {
    if (exit)
      dialog.current
        ?.querySelector<HTMLElement>('.game-exit-confirm button')
        ?.focus();
  }, [exit, dialog]);
  useEffect(() => {
    let canceled = false;
    void loadGameImages()
      .then((value) => {
        if (!canceled) setImages(value);
      })
      .catch((e) => {
        if (!canceled) setError(e.message);
      });
    return () => {
      canceled = true;
    };
  }, []);
  useEffect(() => {
    if (phase !== 'loading' || !images || !audioReady) return;
    let canceled = false;
    queueMicrotask(() => {
      if (!canceled) setPhase('curtain');
    });
    return () => {
      canceled = true;
    };
  }, [phase, images, audioReady, setPhase]);
  useEffect(() => {
    if (phase !== 'curtain') return;
    track('game_curtain_start');
  }, [phase]);
  const spotlightActive = hud?.spotlight != null;
  const turboActive = (hud?.boostMs ?? 0) > 0;
  useEffect(() => {
    setGameSessionPhase(
      'lif-experience',
      phase === 'playing' && !paused ? 'playing' : 'paused',
    );
    audio.music(
      phase === 'playing' && !paused && !spotlightActive && !turboActive,
    );
    if (phase !== 'playing')
      dialog.current
        ?.querySelector<HTMLElement>('[data-step-focus]')
        ?.focus({ preventScroll: true });
  }, [phase, paused, spotlightActive, turboActive, audio, dialog]);
  useEffect(() => {
    audio.syncBoost(
      hud?.boostMs ?? 0,
      phase !== 'playing' || paused || hud?.spotlight != null,
    );
  }, [audio, phase, paused, hud?.boostMs, hud?.spotlight]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden && phaseRef.current === 'playing') setPaused(true);
    };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);
  const payload = useCallback(
    () =>
      snapshot.current && session
        ? {
            id: session.id,
            inputs: snapshot.current.inputs,
            simMs: snapshot.current.state.ms,
            score: snapshot.current.state.score,
          }
        : null,
    [session],
  );
  const saveCheckpoint = useCallback((): Promise<boolean> => {
    if (checkpointInFlight.current) return checkpointInFlight.current;
    const body = payload();
    if (!body) return Promise.resolve(false);
    setReconnecting(true);
    checkpointInFlight.current = gamesApi('checkpoint', body)
      .then(() => {
        if (active.current && phaseRef.current === 'playing') setError('');
        return true;
      })
      .catch((e) => {
        if (active.current && phaseRef.current === 'playing') {
          setError(e.message);
          setPaused(true);
        }
        return false;
      })
      .finally(() => {
        checkpointInFlight.current = null;
        if (active.current) setReconnecting(false);
      });
    return checkpointInFlight.current;
  }, [payload]);
  useEffect(() => {
    if (phase !== 'playing' || !session) return;
    const timer = window.setInterval(() => void saveCheckpoint(), 3000);
    const unload = () => {
      const body = payload();
      if (body)
        navigator.sendBeacon(
          '/api/games/abandon',
          new Blob([JSON.stringify(body)], { type: 'application/json' }),
        );
    };
    window.addEventListener('pagehide', unload);
    return () => {
      clearInterval(timer);
      window.removeEventListener('pagehide', unload);
    };
  }, [phase, session, payload, saveCheckpoint]);
  useEffect(() => {
    if (phase !== 'countdown') return;
    let value = 3;
    audio.start();
    const timer = window.setInterval(() => {
      value--;
      if (value > 0) {
        setCount(value);
      } else {
        clearInterval(timer);
        setPhase('playing');
        track('game_start', { game });
      }
    }, C.COUNTDOWN_STEP_MS);
    return () => clearInterval(timer);
  }, [phase, audio, setPhase, game]);
  useEffect(() => {
    if (phase !== 'preparing') return;
    let canceled = false;
    startRequest.current ??= crypto.randomUUID();
    void gamesApi<Session>('start', { game, request: startRequest.current })
      .then((value) => {
        if (canceled) return;
        setSession(value);
        setHud(null);
        setPaused(false);
        setTouchHint(
          game === 'snake' && matchMedia('(any-pointer: coarse)').matches,
        );
        snapshot.current = null;
        lastEvent.current = 0;
        endOnce.current = false;
        setResult(null);
        setRanking(null);
        setError('');
        setAttempts((current) => ({
          ...current,
          [game]: bootstrap?.localTesting
            ? C.DAILY_ATTEMPTS
            : Math.max(0, C.DAILY_ATTEMPTS - value.attempt),
        }));
        setCount(3);
        setPhase('countdown');
      })
      .catch((e) => {
        if (!canceled) {
          setError(e.message);
          setPhase('instructions');
        }
      });
    return () => {
      canceled = true;
    };
  }, [phase, game, onAttempts, setPhase, bootstrap?.localTesting]);
  useEffect(() => {
    if (phase !== 'playing' || paused || !touchHint) return;
    const timer = setTimeout(() => setTouchHint(false), 3500);
    return () => clearTimeout(timer);
  }, [phase, paused, touchHint]);
  useEffect(() => {
    onAttempts(attempts);
  }, [attempts, onAttempts]);
  const select = (value: GameId) => {
    if (closing || transitioning) return;
    audio.stop();
    audio.play('button');
    setGame(value);
    startRequest.current = null;
    setPhase('instructions');
    setError('');
    track('game_select', { game: value });
    track('game_rules_view', { game: value });
  };
  const playAgain = () => {
    audio.stop();
    startRequest.current = null;
    setError('');
    setPhase('instructions');
  };
  const update = useCallback(
    (state: GameState) => {
      setHud(state);
      for (const event of state.events) {
        if (event.id <= lastEvent.current) continue;
        lastEvent.current = event.id;
        if (event.type === 'death' || event.type === 'complete') continue;
        audio.play(
          state.game === 'memory_lif' &&
            ['normal', 'new', 'logo'].includes(event.type)
            ? 'match'
            : event.type,
        );
        const names: Record<string, string> =
          state.game === 'memory_lif'
            ? {
                flip: 'memory_card_flip',
                normal: 'memory_match',
                logo: 'memory_match',
                new: 'memory_new_flavor_match',
                mismatch: 'memory_mismatch',
                super: 'memory_super_bonus',
                shuffle: 'memory_shuffle',
                powerup: 'memory_powerup',
                peek: 'memory_peek',
                radar: 'memory_radar',
              }
            : {
                normal: 'normal_flavor_collected',
                new: 'new_flavor_collected',
                logo: 'lif_logo_collected',
                penalty: 'competitor_hit',
                powerup: 'powerup_collected',
                boost: 'speed_bonus_collected',
                super: 'super_bonus',
              };
        if (names[event.type])
          track(names[event.type], {
            game,
            ...(event.flavor >= 0
              ? { flavor: GAME_FLAVORS[event.flavor].name }
              : {}),
          });
        if (state.game === 'memory_lif' && event.type === 'new')
          track('memory_match', { game });
      }
    },
    [game, audio],
  );
  const loadRanking = useCallback(async () => {
    const value = await gamesApi<Leaderboard>(
      `leaderboard?game=all&limit=${C.LEADERBOARD_SIZE}`,
    );
    return rankingPreview ? previewLeaderboard(value, 'all') : value;
  }, [rankingPreview]);
  const finish = useCallback(async () => {
    const body = payload();
    if (!body) return;
    if (!endOnce.current) {
      endOnce.current = true;
      setPhase('finishing');
      savedPayload.current = body;
      if (snapshot.current?.state.ended === 'time') {
        audio.play('complete');
        track('game_complete', { game });
      } else {
        audio.defeat();
        track('game_over', {
          game,
          reason: snapshot.current?.state.ended ?? '',
        });
      }
    }
    try {
      const [response] = await Promise.all([
        gamesApi<Result>('finish', savedPayload.current),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ]);
      if (!active.current) return;
      setResult(response);
      if (rankingPreview && response.position) {
        const value = await loadRanking().catch(() => null);
        if (!active.current) return;
        setRanking(value);
      }
      setAttempts(response.attempts);
      onAttempts(response.attempts);
      setError('');
      setPhase('result');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo guardar la partida.',
      );
    }
  }, [payload, audio, game, onAttempts, setPhase, rankingPreview, loadRanking]);
  const abandon = async () => {
    setBusy(true);
    audio.stop();
    const body = payload();
    try {
      if (body) await gamesApi('abandon', body);
      track('game_abandon', { game });
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo guardar la salida.',
      );
    } finally {
      setBusy(false);
    }
  };
  const showRank = async () => {
    setBusy(true);
    try {
      setRanking(await loadRanking());
      setPhase('rank');
      track('leaderboard_view', { game });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo cargar el ranking.',
      );
    } finally {
      setBusy(false);
    }
  };
  const register = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (registrationSending.current) return;
    const data = new FormData(event.currentTarget);
    const nicknameValue = data.get('nickname');
    const nickname = typeof nicknameValue === 'string' ? nicknameValue : '';
    const nicknameInput = event.currentTarget.elements.namedItem('nickname');
    if (nicknameInput instanceof HTMLInputElement) {
      nicknameInput.setCustomValidity(nicknameValidationMessage(nickname));
      if (!nicknameInput.reportValidity()) return;
    }
    registrationSending.current = true;
    playFormSendSound();
    setBusy(true);
    setError('');
    try {
      const response = await gamesApi<Result>('register', {
        id: result?.id,
        name: data.get('name'),
        email: data.get('email'),
        phone: data.get('phone'),
        nickname,
        terms: data.get('terms') === 'on',
      });
      setResult(response);
      track('registration_complete', { game });
      await showRank();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo registrar tu participación.',
      );
    } finally {
      registrationSending.current = false;
      setBusy(false);
    }
  };
  const retryAssets = async () => {
    setError('');
    setBusy(true);
    try {
      setImages(await loadGameImages());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudieron cargar los empaques.',
      );
    } finally {
      setBusy(false);
    }
  };
  const seconds = Math.max(
    0,
    Math.ceil(C.GAME_DURATION_SECONDS - (hud?.activeMs ?? 0) / 1000),
  );
  return (
    <div
      ref={shell}
      className={`game-experience game-phase-${phase}`}
      data-transitioning={transitioning}
      data-curtain-settled={entryFromCurtain}
    >
      <header
        className="game-shell-header"
        inert={
          exit ||
          transitioning ||
          closing ||
          phase === 'loading' ||
          phase === 'curtain'
        }
      >
        <img src="/brand/lif-official.svg" alt="LIF" width="78" height="49" />
        <div className="game-shell-title">
          <h2 id="game-experience-title">
            {['loading', 'select', 'curtain', 'roulette'].includes(phase)
              ? phase === 'roulette'
                ? 'Elegí tu juego'
                : 'Elegí tu juego o'
              : GAME_NAMES[game]}
          </h2>
          {['loading', 'curtain', 'select'].includes(phase) && (
            <div className="game-random-choice">
              <button
                type="button"
                className="game-random-button"
                title="Girar la ruleta para elegir un juego"
                disabled={!bootstrap || !availableRandomGames(attempts).length}
                onClick={() => {
                  audio.play('button');
                  setPhase('roulette');
                  track('game_random_selector_view');
                }}
              >
                <span className="game-random-wheel" aria-hidden="true">
                  <span />
                </span>
                <span className="game-random-label">Seleccionar al azar</span>
              </button>
            </div>
          )}
        </div>
        <div className="game-shell-tools">
          <button
            className="game-icon-control"
            type="button"
            aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
            title={muted ? 'Activar sonido' : 'Silenciar sonido'}
            onClick={() => {
              audio.unlock();
              audio.setMuted(!muted);
              setMuted(!muted);
            }}
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </button>
          <button
            className="game-icon-control"
            type="button"
            aria-label="Cerrar experiencia de juegos"
            title="Cerrar"
            disabled={
              ['preparing', 'countdown'].includes(phase) ||
              (phase === 'finishing' && !error) ||
              (phase === 'register' && busy)
            }
            onClick={requestExit}
          >
            <X />
          </button>
        </div>
      </header>
      {error && phase !== 'loading' && (
        <div className="game-error" role="alert" inert={exit}>
          {error}
          {!images && (
            <button
              type="button"
              onClick={() => void retryAssets()}
              disabled={busy}
            >
              Reintentar carga
            </button>
          )}
        </div>
      )}
      <div
        key={phase === 'curtain' || phase === 'select' ? 'selector' : phase}
        className="game-view"
        inert={exit || transitioning || closing}
      >
        {(phase === 'curtain' || phase === 'select') && (
          <section
            className="game-selection"
            aria-label="Selector de juegos"
            inert={phase === 'curtain'}
          >
            <div className="game-selection-grid">
              {(['memory_lif', 'snake'] as const).map((value) => (
                <article
                  className={`game-choice game-choice-${value}`}
                  key={value}
                >
                  <GamePreview game={value} />
                  <div className="game-choice-copy">
                    <h3>{GAME_NAMES[value]}</h3>
                    <p>
                      {value === 'memory_lif'
                        ? 'Encontrá las parejas, sumá puntos y descubrí nuevos sabores.'
                        : 'Comé sabores, crecé y evitá chocar.'}
                    </p>
                    <div className="game-choice-meta">
                      <span>
                        <Clock3 />3 minutos
                      </span>
                    </div>
                    <span className="game-attempts-label">
                      {bootstrap?.localTesting
                        ? 'Intentos ilimitados en local'
                        : `${attempts[value]} / 3 intentos disponibles`}
                    </span>
                    <button
                      data-step-focus={
                        value === 'memory_lif' ? true : undefined
                      }
                      type="button"
                      className="game-play-button game-play-small"
                      disabled={!attempts[value] || !bootstrap}
                      onClick={() => select(value)}
                    >
                      <Play fill="currentColor" />
                      {attempts[value] ? 'JUGAR' : 'Volvé mañana'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {phase === 'roulette' && (
          <GameRoulette
            attempts={attempts}
            audio={audio}
            disabled={transitioning || closing || !audioReady}
            onSelect={select}
            onBack={() => setPhase('select')}
            onSpin={() => {
              track('game_random_spin');
            }}
          />
        )}
        {phase === 'instructions' && (
          <section className="game-instructions">
            <div className="game-instructions-content">
              <div
                className="game-instructions-scroll"
                ref={instructionsScroll}
                id="lif-game-instructions"
              >
                <button
                  className="game-back"
                  type="button"
                  onClick={() => setPhase('select')}
                >
                  <ChevronLeft />
                  Cambiar de juego
                </button>
                <div className="game-instructions-layout">
                  <div>
                    <p className="game-kicker">CÓMO SE JUEGA</p>
                    <h3 data-step-focus tabIndex={-1}>
                      {game === 'memory_lif'
                        ? 'Encontrá las parejas.'
                        : 'Comé. Crecé. Repetí.'}
                    </h3>
                    <GamePreview game={game} />
                    <div
                      className="game-key-guide"
                      aria-label="Controles de teclado"
                    >
                      {game === 'snake' && <kbd>↑</kbd>}
                      <div>
                        {game === 'snake' && <kbd>←</kbd>}
                        {game === 'snake' && <kbd>↓</kbd>}
                        {game === 'snake' && <kbd>→</kbd>}
                      </div>
                      <span>
                        {game === 'snake'
                          ? 'Flechas · WASD · swipe · mando táctil'
                          : 'Tocá dos cartas y buscá dos empaques iguales.'}
                      </span>
                    </div>
                  </div>
                  <div className="game-rules-visual">
                    <div>
                      <Gamepad2 />
                      <p>
                        {game === 'memory_lif'
                          ? 'Destapá dos cartas y buscá dos empaques iguales.'
                          : 'Guiá al Snake y encontrá los sobres. Chocar contra el borde o tu propio cuerpo termina la partida.'}
                      </p>
                    </div>
                    {game === 'memory_lif' && (
                      <p className="game-rule-warning">
                        Las parejas encontradas quedan visibles. Completá las
                        ocho parejas para descubrir un tablero nuevo: primero
                        muestra los sabores y después los cubre. Las cartas no
                        cambian de lugar mientras resolvés el panel. El primer
                        fallo de cada racha es gratis. Desde el segundo, perdés{' '}
                        <b>20 puntos por fallo</b>. Una pareja reinicia la
                        racha. <b>10 errores seguidos terminan la partida</b>,
                        aunque tengas puntos. El puntaje no baja de cero.
                        Destapar una sola carta no cuenta como fallo.
                      </p>
                    )}
                    <div className="game-new-flavors">
                      {GAME_FLAVORS.slice(0, 3).map((f) => (
                        <img key={f.name} src={f.image} alt={f.name} />
                      ))}
                      <strong>
                        ¡Nuevos sabores! +
                        {game === 'memory_lif'
                          ? C.MEMORY_MATCH_NEW_FLAVOR_POINTS
                          : C.NEW_FLAVOR_POINTS}
                      </strong>
                    </div>
                    <div className="game-score-guide">
                      <span>
                        {game === 'memory_lif'
                          ? 'Pareja de sabor'
                          : 'Sabor correcto'}{' '}
                        <b>
                          +
                          {game === 'memory_lif'
                            ? C.MEMORY_MATCH_NORMAL_POINTS
                            : C.NORMAL_FLAVOR_POINTS}
                        </b>
                      </span>
                      <span>
                        Logo LIF{' '}
                        <b>
                          +
                          {game === 'memory_lif'
                            ? C.MEMORY_LOGO_MATCH_POINTS
                            : C.LIF_LOGO_POINTS}
                        </b>
                      </span>
                      <span>
                        {game === 'memory_lif' ? (
                          <>
                            Sin pareja <b>−20 desde el segundo fallo seguido</b>
                          </>
                        ) : (
                          <>
                            Sobre rival <b>−100 y −2 segmentos</b>
                          </>
                        )}
                      </span>
                      {game === 'snake' && (
                        <span>
                          Super Bonus · 15 segmentos <b>+1.000</b>
                        </span>
                      )}
                      {game === 'memory_lif' && (
                        <span>
                          Super Bonus · 6 parejas{' '}
                          <b>+{C.MEMORY_SUPER_BONUS_POINTS}</b>
                        </span>
                      )}
                    </div>
                    {game === 'snake' && (
                      <p className="game-rule-warning">
                        Cada sobre LIF agrega un segmento; el logo suma sin
                        hacerte crecer. El Super Bonus te devuelve a 3 segmentos
                        y aumenta la velocidad un <b>6 %</b> por bonus. El rival
                        no reduce el puntaje bajo cero ni el cuerpo bajo 3
                        segmentos. El escudo bloquea un rival, no los choques.
                      </p>
                    )}
                    <div className="game-power-guide">
                      <Zap />
                      <span>
                        {game === 'memory_lif'
                          ? '×2 por 10 segundos · Vista LIF revela las cartas por 1 segundo'
                          : 'Recogé ×2: 10 segundos · Escudo: un rival · Turbo: 7 segundos con puntos ×2, velocidad y reloj ×1,4'}
                      </span>
                      {game === 'memory_lif' ? <Eye /> : <Shield />}
                    </div>
                    <p className="game-rule-warning">
                      Los poderes no multiplican el Super Bonus ni las
                      penalizaciones.{' '}
                      {game === 'snake' && 'Turbo y ×2 no se acumulan en ×4. '}
                      La partida termina al agotarse el reloj de 3 minutos.
                    </p>
                  </div>
                </div>
              </div>
              <InstructionsScrollCue scrollRef={instructionsScroll} />
            </div>
            <footer className="game-instructions-actions">
              <button
                className="game-play-button"
                type="button"
                disabled={!images || !audioReady || !attempts[game] || busy}
                onClick={() => {
                  audio.unlock();
                  audio.play('button');
                  setError('');
                  setPhase('preparing');
                }}
              >
                <Play fill="currentColor" />
                {images && audioReady ? 'INICIAR JUEGO' : 'CARGANDO JUEGOS LIF'}
              </button>
              <p className="game-attempt-note">
                Hasta 3 minutos ·{' '}
                {bootstrap?.localTesting
                  ? 'Intentos ilimitados en local'
                  : `${attempts[game]} intentos disponibles hoy`}
              </p>
            </footer>
          </section>
        )}
        {(phase === 'countdown' || phase === 'preparing') && (
          <div
            className={`game-countdown ${phase === 'preparing' ? 'is-preparing' : ''}`}
            aria-live="polite"
          >
            <GamePreview game={game} />
            <div>
              {phase === 'countdown' ? (
                <strong key={count}>{count}</strong>
              ) : (
                <div className="game-start-preparation" role="status">
                  <span>Preparando partida</span>
                  <span className="game-loading-track" aria-hidden="true">
                    {Array.from({ length: 8 }, (_, i) => (
                      <i key={i} style={{ animationDelay: `${i * 100}ms` }} />
                    ))}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        {phase === 'playing' && session && images && (
          <section className={`game-live game-live-${game}`} inert={exit}>
            <div className="game-hud">
              <div>
                <small>PUNTOS</small>
                <strong>{formatScore(hud?.score ?? 0)}</strong>
              </div>
              <div className="game-target">
                {game === 'memory_lif' ? (
                  <span>
                    <small>SUPER BONUS</small>
                    <b>
                      {hud?.memory?.superProgress ?? 0} /{' '}
                      {C.MEMORY_SUPER_BONUS_MATCHES} PARES
                    </b>
                    <progress
                      value={hud?.memory?.superProgress ?? 0}
                      max={C.MEMORY_SUPER_BONUS_MATCHES}
                    />
                  </span>
                ) : (
                  <span>
                    <small>SUPER BONUS</small>
                    <b>
                      {hud?.snake.length ?? C.SNAKE_STARTING_LENGTH} /{' '}
                      {C.SNAKE_SUPER_BONUS_LENGTH} SEGMENTOS
                    </b>
                    <progress
                      value={hud?.snake.length ?? C.SNAKE_STARTING_LENGTH}
                      max={C.SNAKE_SUPER_BONUS_LENGTH}
                    />
                  </span>
                )}
              </div>
              <div
                className={
                  seconds <= 20 ? 'game-clock is-urgent' : 'game-clock'
                }
              >
                <Clock3 />
                <strong>{time(seconds)}</strong>
              </div>
              <button
                className="game-icon-control"
                type="button"
                aria-label={paused ? 'Continuar partida' : 'Pausar partida'}
                title={paused ? 'Continuar' : 'Pausa'}
                disabled={paused && !!error}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play /> : <Pause />}
              </button>
            </div>
            <div
              className="game-board-wrap"
              onPointerDownCapture={() => setTouchHint(false)}
            >
              <GameBoard
                session={session}
                images={images}
                paused={paused}
                snapshot={snapshot}
                control={control}
                onUpdate={update}
                onDirectionSound={(sound) => audio.play(sound)}
                onEnd={() => void finish()}
              />
              {touchHint && !paused && <TouchGestureHint game={game} />}
              {hud?.spotlight !== null && hud?.spotlight !== undefined && (
                <output className="game-spotlight">
                  {game === 'memory_lif' && (
                    <span className="memory-hero-particles" aria-hidden="true">
                      {Array.from({ length: 8 }, (_, i) => (
                        <i key={i} />
                      ))}
                    </span>
                  )}
                  {hud.spotlight === 'super' ? (
                    <>
                      <Trophy />
                      <h3>SUPER BONUS</h3>
                      <strong>
                        +
                        {game === 'memory_lif'
                          ? C.MEMORY_SUPER_BONUS_POINTS
                          : '1.000'}
                      </strong>
                    </>
                  ) : (
                    <>
                      <span>¡NUEVO SABOR LIF!</span>
                      <img src={GAME_FLAVORS[hud.spotlight].image} alt="" />
                      <h3>{GAME_FLAVORS[hud.spotlight].name}</h3>
                      <strong>
                        +
                        {(game === 'memory_lif'
                          ? C.MEMORY_MATCH_NEW_FLAVOR_POINTS
                          : C.NEW_FLAVOR_POINTS) *
                          (hud.activeMs < hud.doubleUntil || hud.boostMs > 0
                            ? 2
                            : 1)}
                      </strong>
                    </>
                  )}
                </output>
              )}
              {paused && !exit && (
                <div className="game-pause">
                  <Pause />
                  <h3>EN PAUSA</h3>
                  <button
                    className="game-play-button game-play-small"
                    type="button"
                    disabled={!!error}
                    onClick={() => setPaused(false)}
                  >
                    <Play />
                    SEGUIR JUGANDO
                  </button>
                  {error && (
                    <button
                      className="game-secondary"
                      type="button"
                      disabled={reconnecting}
                      onClick={() => {
                        void saveCheckpoint().then((saved) => {
                          if (
                            saved &&
                            active.current &&
                            phaseRef.current === 'playing'
                          )
                            setPaused(false);
                        });
                      }}
                    >
                      {reconnecting ? 'Reconectando…' : 'Reintentar conexión'}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="game-control-deck">
              {game === 'memory_lif' ? (
                <div className="game-memory-controls">
                  <button
                    type="button"
                    className="memory-peek-button"
                    disabled={
                      paused ||
                      hud?.spotlight != null ||
                      !hud?.memory?.peekCharges ||
                      hud?.memory?.cycle !== 'idle' ||
                      !!hud?.memory?.selected.length
                    }
                    onClick={() =>
                      control.current?.(undefined, undefined, 'peek')
                    }
                    title="Mostrar brevemente las cartas cerradas"
                  >
                    <Eye /> Vista LIF <b>{hud?.memory?.peekCharges ?? 1}</b>
                  </button>
                  {C.MEMORY_RADAR_ENABLED && (
                    <button
                      type="button"
                      className="memory-peek-button"
                      disabled={!hud?.memory?.radarCharges || paused}
                      onClick={() =>
                        control.current?.(undefined, undefined, 'radar')
                      }
                    >
                      <Zap /> Radar LIF
                    </button>
                  )}
                  {hud && hud.doubleUntil > hud.activeMs && (
                    <span className="memory-x2">
                      <Zap /> ×2 ·{' '}
                      {Math.ceil((hud.doubleUntil - hud.activeMs) / 1000)}s
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <div className="game-active-bonuses">
                    <span
                      className={
                        hud && hud.activeMs < hud.doubleUntil
                          ? 'is-powered'
                          : ''
                      }
                    >
                      <Zap />
                      ×2
                    </span>
                    <span
                      className={
                        hud &&
                        (game === 'snake'
                          ? hud.shield
                          : hud.activeMs < hud.magnetUntil)
                          ? 'is-powered'
                          : ''
                      }
                    >
                      <Shield />
                      {game === 'snake' ? 'Escudo' : 'Imán'}
                    </span>
                  </div>
                  <div className="game-dpad">
                    {['up', 'left', 'down', 'right'].map((direction) => (
                      <DirectionButton
                        key={direction}
                        direction={direction as Direction}
                        onMove={(value) => control.current?.(value)}
                        disabled={paused || hud?.spotlight != null}
                      />
                    ))}
                  </div>
                  <div className="game-controls-caption">
                    {game === 'snake' ? (
                      <>
                        <span className="game-rotate-hint">
                          Girá tu dispositivo para jugar mejor.
                        </span>
                        <kbd>W A S D</kbd>
                      </>
                    ) : (
                      <kbd>← → · A D</kbd>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        )}
        {phase === 'finishing' && (
          <section className="game-ending" aria-live="polite">
            {hud?.ended === 'time' ? (
              <>
                <Trophy />
                <h3>¡TIEMPO COMPLETADO!</h3>
              </>
            ) : (
              <>
                <img
                  src="/campaign/actor-lego.webp"
                  alt="Lágrimas de adultez"
                />
                <h3>GAME OVER</h3>
                <p>{defeatMessage(hud?.ended)}</p>
              </>
            )}
          </section>
        )}
        {(phase === 'result' || phase === 'register') && result && (
          <section className="game-result">
            <div className="game-result-summary">
              <p className="game-kicker">
                {result.reason === 'time' ? '¡TIEMPO COMPLETADO!' : 'GAME OVER'}
              </p>
              {defeatMessage(result.reason) && (
                <p>{defeatMessage(result.reason)}</p>
              )}
              {result.newBest && (
                <span className="game-record">
                  <Trophy />
                  NUEVO RÉCORD
                </span>
              )}
              <h3 data-step-focus tabIndex={-1}>
                {formatScore(result.score)}
                <small>PUNTOS</small>
              </h3>
              <p>
                Tu mejor puntaje: <b>{formatScore(result.best)}</b>
              </p>
              {(rankingPreview ? ranking?.position : result.position) && (
                <p>
                  Tu posición:{' '}
                  <b>#{rankingPreview ? ranking?.position : result.position}</b>
                </p>
              )}
            </div>
            {phase === 'result' ? (
              <div className="game-result-actions">
                <button
                  className="game-play-button game-play-small"
                  type="button"
                  onClick={() => setPhase('register')}
                >
                  <Check />
                  GUARDAR EN EL RANKING
                </button>
                <button
                  className="game-secondary"
                  type="button"
                  disabled={!attempts[game]}
                  onClick={playAgain}
                >
                  <RotateCcw />
                  {attempts[game] ? 'Jugar de nuevo' : 'Volvé mañana'}
                </button>
                <button
                  className="game-secondary"
                  type="button"
                  onClick={() => {
                    audio.stop();
                    setPhase('select');
                  }}
                >
                  <Gamepad2 />
                  Cambiar de juego
                </button>
                <button
                  className="game-secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => void showRank()}
                >
                  <Trophy />
                  Ver ranking
                </button>
              </div>
            ) : (
              <form
                className="game-registration form-with-status"
                onSubmit={register}
                aria-busy={busy}
              >
                <FormSubmissionStatus
                  busy={busy}
                  message="Registrando tu participación…"
                  detail="Estamos guardando tus datos y actualizando el ranking."
                />
                <h4>Tu lugar en el ranking.</h4>
                <label>
                  Nombre
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    disabled={busy}
                  />
                </label>
                <label>
                  Correo electrónico
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={150}
                    disabled={busy}
                  />
                </label>
                <label>
                  Teléfono
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    minLength={8}
                    maxLength={25}
                    disabled={busy}
                  />
                </label>
                <label>
                  Nickname
                  <input
                    name="nickname"
                    required
                    autoComplete="username"
                    disabled={busy}
                    onChange={(event) => {
                      if (!(event.nativeEvent as InputEvent).isComposing)
                        updateNicknameField(event.currentTarget);
                    }}
                    onCompositionEnd={(event) =>
                      updateNicknameField(event.currentTarget)
                    }
                  />
                </label>
                <label className="game-terms">
                  <input
                    type="checkbox"
                    name="terms"
                    required
                    disabled={busy}
                  />
                  <span>
                    Acepto las reglas de participación y el uso de mis datos
                    para registrar mis partidas. Solo mi nickname y puntaje
                    serán públicos.
                  </span>
                </label>
                <button
                  className="game-play-button game-play-small"
                  type="submit"
                  disabled={busy}
                >
                  <Check />
                  {busy ? 'GUARDANDO' : 'REGISTRAR PARTICIPACIÓN'}
                </button>
                <button
                  className="game-back"
                  type="button"
                  onClick={() => setPhase('result')}
                  disabled={busy}
                >
                  <ChevronLeft />
                  Volver al resultado
                </button>
              </form>
            )}
          </section>
        )}
        {phase === 'rank' && (
          <section className="game-rank-result">
            <p className="game-kicker">{GAME_NAMES[game]}</p>
            <h3 data-step-focus tabIndex={-1}>
              {ranking?.position
                ? `Tu posición: #${ranking.position}`
                : 'El próximo lugar puede ser tuyo.'}
            </h3>
            <LeaderboardTable ranking={ranking} />
            <div className="game-post-actions">
              <button
                className="game-play-button game-play-small"
                type="button"
                disabled={!attempts[game]}
                onClick={playAgain}
              >
                <RotateCcw />
                {attempts[game] ? 'JUGAR DE NUEVO' : 'VOLVÉ MAÑANA'}
              </button>
              <button
                className="game-secondary"
                type="button"
                onClick={() => setPhase('select')}
              >
                <Gamepad2 />
                Cambiar de juego
              </button>
              <button
                className="game-secondary"
                type="button"
                onClick={() => onRanking(game)}
              >
                <Trophy />
                Volver al ranking
              </button>
            </div>
          </section>
        )}
      </div>
      {phase === 'curtain' && (
        <GameCurtain
          audio={audio}
          shellRef={shell}
          texture={images!.get(CURTAIN_TEXTURE_ASSET)!}
          onComplete={() => {
            setPhase('select');
            track('game_curtain_complete');
            track('game_selector_view');
          }}
        />
      )}
      {phase === 'loading' && (
        <GameLoading className="game-entry-loading" onClose={requestExit} />
      )}
      {phase === 'loading' && error && (
        <div className="game-loading-error game-error" role="alert">
          {error}
          {!images && (
            <button
              type="button"
              onClick={() => void retryAssets()}
              disabled={busy}
            >
              Reintentar carga
            </button>
          )}
        </div>
      )}
      {exit && (
        <div
          className="game-exit-confirm"
          role="alertdialog"
          aria-labelledby="game-exit-title"
        >
          <div>
            <h3 id="game-exit-title">¿Querés salir de la partida?</h3>
            <p>Si salís ahora, este intento contará como utilizado.</p>
            <button
              className="game-play-button game-play-small"
              type="button"
              onClick={() => {
                setExit(false);
                setPaused(false);
              }}
            >
              <Play />
              SEGUIR JUGANDO
            </button>
            <button
              className="game-secondary"
              type="button"
              onClick={() => void abandon()}
              disabled={busy}
            >
              {busy ? 'Guardando salida…' : 'Salir de la partida'}
            </button>
          </div>
        </div>
      )}
      {phase === 'finishing' && error && (
        <button
          className="game-save-retry"
          type="button"
          onClick={() => void finish()}
        >
          Reintentar guardar resultado
        </button>
      )}
    </div>
  );
}
