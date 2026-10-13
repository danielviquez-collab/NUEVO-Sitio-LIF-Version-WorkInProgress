export type GameId = 'memory_lif' | 'snake';
export type HistoricalGameId = GameId | 'catch';
export const ACTIVE_GAMES: readonly GameId[] = ['memory_lif', 'snake'];
export const isActiveGame = (value: unknown): value is GameId =>
  ACTIVE_GAMES.includes(value as GameId);
export const COMPETITION_RULES = {
  NORMAL_POINTS: 50,
  NEW_POINTS: 300,
  LOGO_POINTS: 150,
  SUPER_ACTIONS: 6,
  SUPER_POINTS: 1000,
  ERROR_RECOVERY_MS: 1600,
  X2_SECONDS: 10,
  DURATION_SECONDS: 180,
} as const;
export const GAME_CONFIG = {
  VERSION: 'lif-games-20261007-unified-v2',
  COMPETITION_SUPER_BONUS_ACTIONS: COMPETITION_RULES.SUPER_ACTIONS,
  COMPETITION_SUPER_BONUS_POINTS: COMPETITION_RULES.SUPER_POINTS,
  COMPETITION_ERROR_RECOVERY_MS: COMPETITION_RULES.ERROR_RECOVERY_MS,
  RANDOMIZATION_MODE: 'seeded_controlled',
  ENABLE_SESSION_SEED: true,
  ENABLE_DEBUG_SEED_REPLAY: true,
  MEMORY_BOARD_ROWS: 4,
  MEMORY_BOARD_COLS: 4,
  MEMORY_MATCH_NORMAL_POINTS: COMPETITION_RULES.NORMAL_POINTS,
  MEMORY_MATCH_NEW_FLAVOR_POINTS: COMPETITION_RULES.NEW_POINTS,
  MEMORY_LOGO_MATCH_POINTS: COMPETITION_RULES.LOGO_POINTS,
  MEMORY_MISMATCH_PENALTY: 0,
  MEMORY_SUPER_BONUS_MATCHES: COMPETITION_RULES.SUPER_ACTIONS,
  MEMORY_SUPER_BONUS_POINTS: COMPETITION_RULES.SUPER_POINTS,
  MEMORY_X2_SUPER_BONUS: false,
  MEMORY_PEEK_DURATION_SECONDS: 1,
  MEMORY_X2_DURATION_SECONDS: COMPETITION_RULES.X2_SECONDS,
  MEMORY_SHUFFLE_MIN_INTERVAL_SECONDS: 35,
  MEMORY_SHUFFLE_MAX_INTERVAL_SECONDS: 55,
  MEMORY_FLIP_MS: 360,
  MEMORY_RADAR_ENABLED: false,
  SNAKE_NORMAL_SPAWN_SECONDS: 12,
  SESSION_PLAN_MAX_RETRIES: 64,
  SNAKE_ITEM_MIN_DISTANCE: 6,
  SNAKE_ITEM_MAX_DISTANCE: 9,
  GAME_DURATION_SECONDS: COMPETITION_RULES.DURATION_SECONDS,
  DAILY_ATTEMPTS: 3,
  TIMEZONE: 'America/Costa_Rica',
  CURTAIN_OPEN_DURATION_MS: 4250,
  COUNTDOWN_STEP_MS: 1000,
  NORMAL_FLAVOR_POINTS: COMPETITION_RULES.NORMAL_POINTS,
  LIF_LOGO_POINTS: COMPETITION_RULES.LOGO_POINTS,
  NEW_FLAVOR_POINTS: COMPETITION_RULES.NEW_POINTS,
  COMPETITOR_PENALTY_POINTS: 0,
  COMPETITOR_SEGMENT_DAMAGE: 2,
  SNAKE_STARTING_LENGTH: 3,
  SNAKE_SUPER_BONUS_LENGTH: 9,
  SNAKE_SUPER_BONUS_POINTS: COMPETITION_RULES.SUPER_POINTS,
  SNAKE_SPEED_INCREASE_PER_SUPER_BONUS: 0.06,
  SNAKE_TICK_MS: 190,
  BOARD_COLS: 30,
  BOARD_ROWS: 20,
  POWERUP_DURATION_SECONDS: COMPETITION_RULES.X2_SECONDS,
  BOOST_DURATION_SECONDS: 7,
  BOOST_SPEED_MULTIPLIER: 1.4,
  BOOST_CLOCK_MULTIPLIER: 1,
  MAGNET_DURATION_SECONDS: 7,
  FLEETING_ITEM_DURATION_SECONDS: 4,
  NEW_FLAVOR_SPOTLIGHT_SECONDS: 1.75,
  LEADERBOARD_SIZE: 20,
  LEADERBOARD_MAX_SIZE: 20,
  STEP_MS: 20,
  SHOW_COLLISION_BOXES: false,
  GAME_OVER_JINGLE_MODE: 'fixed' as 'fixed' | 'random' | 'sequential',
  RANKING_PERIOD: 'campaign' as 'weekly' | 'monthly' | 'campaign' | 'range',
  RANKING_START: '2026-10-01',
  RANKING_END: '2027-12-31',
  PLAY_CTA: 'JUGAR',
} as const;
export const GAME_NAMES: Record<GameId, string> = {
  memory_lif: 'Memoria LIF',
  snake: 'Snake LIF',
};
export const COMPETITOR_HAZARD_ASSETS = [
  '/games/competitor-blue.png',
  '/games/competitor-lemonade.png',
];
export const JINGLE_ASSETS = [
  '/games/audio/lagrimas-oficial.mp3',
  '/games/audio/lagrimas-2.mp3',
  '/games/audio/lagrimas-3.mp3',
];
// Replace these with authorized local audio files when supplied.
export const GAME_SOUND_ASSETS = {
  start: '/games/audio/arranque.mp3',
  boost: '/games/audio/turbo.mp3',
  roulette: '/games/audio/ruleta.mp3',
  curtain: '/games/audio/apertura-telon-original.wav',
  button: '/games/audio/mouse-click.mp3',
};
export const GAME_FLAVORS = [
  {
    name: 'Té verde maracuyá',
    image: '/products/te-verde-maracuya.webp',
    isNew: true,
  },
  {
    name: 'Té blanco fresa',
    image: '/products/te-blanco-fresa.webp',
    isNew: true,
  },
  {
    name: 'Té frío manzana',
    image: '/products/te-frio-manzana.webp',
    isNew: true,
  },
  {
    name: 'Té blanco arándanos',
    image: '/products/arandanos.png',
    isNew: false,
  },
  {
    name: 'Té frío frutos rojos',
    image: '/products/frutos-rojos.png',
    isNew: false,
  },
  {
    name: 'Limonada hierbabuena',
    image: '/products/hierbabuena.png',
    isNew: false,
  },
  { name: 'Limonada pitahaya', image: '/products/pitahaya.png', isNew: false },
  { name: 'Té frío melocotón', image: '/products/melocoton.png', isNew: false },
  {
    name: 'Té verde manzana y canela',
    image: '/products/manzana-canela.png',
    isNew: false,
  },
  { name: 'Té frío limón', image: '/products/limon.png', isNew: false },
  {
    name: 'Naranja mandarina',
    image: '/products/naranja-mandarina.png',
    isNew: false,
  },
  { name: 'Té blanco kiwi', image: '/products/kiwi.png', isNew: false },
  { name: 'Frutas mixtas', image: '/products/frutas-mixtas.png', isNew: false },
];
