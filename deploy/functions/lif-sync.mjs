import { createRequire } from "node:module";
import { DatabaseSync } from "node:sqlite";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esmMin = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __toCommonJS = (mod) => __hasOwnProp.call(mod, "module.exports") ? mod["module.exports"] : __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __require = /* @__PURE__ */ createRequire(import.meta.url);
//#endregion
//#region lib/gaming/legacy-config.ts
var LEGACY_CONFIG = {
	VERSION: "lif-games-20261002-v2",
	GAME_DURATION_SECONDS: 180,
	DAILY_ATTEMPTS: 3,
	TIMEZONE: "America/Costa_Rica",
	CURTAIN_OPEN_DURATION_MS: 4250,
	COUNTDOWN_STEP_MS: 1e3,
	NORMAL_FLAVOR_POINTS: 50,
	LIF_LOGO_POINTS: 150,
	NEW_FLAVOR_POINTS: 300,
	WRONG_FLAVOR_PENALTY_POINTS: 100,
	COMPETITOR_PENALTY_POINTS: 100,
	COMPETITOR_SEGMENT_DAMAGE: 2,
	SNAKE_STARTING_LENGTH: 3,
	SNAKE_SUPER_BONUS_LENGTH: 15,
	SNAKE_SUPER_BONUS_POINTS: 1e3,
	SNAKE_SPEED_INCREASE_PER_SUPER_BONUS: .06,
	SNAKE_TICK_MS: 190,
	BOARD_COLS: 30,
	BOARD_ROWS: 20,
	POWERUP_DURATION_SECONDS: 10,
	BOOST_DURATION_SECONDS: 7,
	BOOST_SPEED_MULTIPLIER: 1.4,
	BOOST_CLOCK_MULTIPLIER: 1.4,
	MAGNET_DURATION_SECONDS: 7,
	FLEETING_ITEM_DURATION_SECONDS: 4,
	NEW_FLAVOR_SPOTLIGHT_SECONDS: 1.75,
	TARGET_FLAVOR_DURATION: 12,
	LEADERBOARD_SIZE: 10,
	LEADERBOARD_MAX_SIZE: 20,
	STEP_MS: 20,
	SHOW_COLLISION_BOXES: false,
	GAME_OVER_JINGLE_MODE: "fixed",
	RANKING_PERIOD: "campaign",
	RANKING_START: "2026-10-01",
	RANKING_END: "2027-12-31",
	PLAY_CTA: "JUGAR"
};
//#endregion
//#region lib/gaming/config.ts
var ACTIVE_GAMES = ["memory_lif", "snake"];
var isActiveGame = (value) => ACTIVE_GAMES.includes(value);
var COMPETITION_RULES$3 = {
	NORMAL_POINTS: 50,
	NEW_POINTS: 300,
	LOGO_POINTS: 150,
	SUPER_ACTIONS: 6,
	SUPER_POINTS: 1e3,
	X2_SECONDS: 10,
	DURATION_SECONDS: 180
};
var GAME_CONFIG$4 = {
	VERSION: "lif-games-20261008-panels-v5",
	RANDOMIZATION_MODE: "seeded_controlled",
	ENABLE_SESSION_SEED: true,
	ENABLE_DEBUG_SEED_REPLAY: true,
	MEMORY_BOARD_ROWS: 4,
	MEMORY_BOARD_COLS: 4,
	MEMORY_MATCH_NORMAL_POINTS: 10,
	MEMORY_MATCH_NEW_FLAVOR_POINTS: 60,
	MEMORY_LOGO_MATCH_POINTS: 30,
	MEMORY_MISMATCH_PENALTY: 20,
	MEMORY_FREE_MISMATCHES_PER_STREAK: 1,
	MEMORY_MAX_ERROR_STREAK: 10,
	MEMORY_SUPER_BONUS_MATCHES: COMPETITION_RULES$3.SUPER_ACTIONS,
	MEMORY_SUPER_BONUS_POINTS: 250,
	MEMORY_X2_SUPER_BONUS: false,
	MEMORY_PEEK_DURATION_SECONDS: 1,
	MEMORY_X2_DURATION_SECONDS: COMPETITION_RULES$3.X2_SECONDS,
	MEMORY_SHUFFLE_MIN_INTERVAL_SECONDS: 35,
	MEMORY_SHUFFLE_MAX_INTERVAL_SECONDS: 55,
	MEMORY_FLIP_MS: 360,
	MEMORY_BOARD_PREVIEW_MS: 1600,
	MEMORY_RADAR_ENABLED: false,
	SESSION_PLAN_MAX_RETRIES: 64,
	GAME_DURATION_SECONDS: COMPETITION_RULES$3.DURATION_SECONDS,
	DAILY_ATTEMPTS: 3,
	TIMEZONE: "America/Costa_Rica",
	CURTAIN_OPEN_DURATION_MS: 5470,
	COUNTDOWN_STEP_MS: 1e3,
	NORMAL_FLAVOR_POINTS: COMPETITION_RULES$3.NORMAL_POINTS,
	LIF_LOGO_POINTS: COMPETITION_RULES$3.LOGO_POINTS,
	NEW_FLAVOR_POINTS: COMPETITION_RULES$3.NEW_POINTS,
	COMPETITOR_PENALTY_POINTS: LEGACY_CONFIG.COMPETITOR_PENALTY_POINTS,
	COMPETITOR_SEGMENT_DAMAGE: 2,
	SNAKE_STARTING_LENGTH: 3,
	SNAKE_SUPER_BONUS_LENGTH: LEGACY_CONFIG.SNAKE_SUPER_BONUS_LENGTH,
	SNAKE_SUPER_BONUS_POINTS: COMPETITION_RULES$3.SUPER_POINTS,
	SNAKE_SPEED_INCREASE_PER_SUPER_BONUS: .06,
	SNAKE_TICK_MS: 190,
	BOARD_COLS: 30,
	BOARD_ROWS: 20,
	POWERUP_DURATION_SECONDS: COMPETITION_RULES$3.X2_SECONDS,
	BOOST_DURATION_SECONDS: 7,
	BOOST_SPEED_MULTIPLIER: 1.4,
	BOOST_CLOCK_MULTIPLIER: LEGACY_CONFIG.BOOST_CLOCK_MULTIPLIER,
	MAGNET_DURATION_SECONDS: 7,
	FLEETING_ITEM_DURATION_SECONDS: 4,
	NEW_FLAVOR_SPOTLIGHT_SECONDS: 1.75,
	LEADERBOARD_SIZE: 20,
	LEADERBOARD_MAX_SIZE: 20,
	STEP_MS: 20,
	SHOW_COLLISION_BOXES: false,
	GAME_OVER_JINGLE_MODE: "fixed",
	RANKING_PERIOD: "campaign",
	RANKING_START: "2026-10-01",
	RANKING_END: "2027-12-31",
	PLAY_CTA: "JUGAR"
};
var RANKING_VERSIONS = ["lif-games-20261007-calibrated-v4", GAME_CONFIG$4.VERSION];
//#endregion
//#region lib/gaming/session-random.ts
function random$5(state) {
	state.rng = state.rng + 1831565813 | 0;
	let t = Math.imul(state.rng ^ state.rng >>> 15, 1 | state.rng);
	t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
	return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function stream$4(seed, label) {
	let hash = seed >>> 0;
	for (const character of label) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
	return { rng: hash >>> 0 };
}
function between$4(state, min, max) {
	return min + Math.floor(random$5(state) * (max - min + 1));
}
function shuffled$4(state, values) {
	const result = [...values];
	for (let i = result.length - 1; i > 0; i--) {
		const j = between$4(state, 0, i);
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}
function makePlan$4(game, seed) {
	const rng = stream$4(seed, `${GAME_CONFIG$4.VERSION}:schedule:${game}`);
	const events = [];
	const shuffles = [];
	if (game === "snake") {
		const hazards = shuffled$4(rng, [
			0,
			0,
			0,
			1,
			1,
			1
		]);
		for (let window = 0; window < 6; window++) events.push({
			at: window * 3e4 + between$4(rng, 14e3, 22e3),
			kind: "hazard",
			flavor: hazards[window]
		});
	}
	for (let window = 0; window < 3; window++) {
		shuffled$4(rng, ["double", game === "snake" ? "shield" : "peek"]).forEach((kind, i) => events.push({
			at: window * 6e4 + 12e3 + i * 22e3 + between$4(rng, -3500, 3500),
			kind,
			flavor: -1
		}));
		if (game === "memory_lif" && GAME_CONFIG$4.MEMORY_RADAR_ENABLED) events.push({
			at: window * 6e4 + 46e3 + between$4(rng, -3e3, 3e3),
			kind: "radar",
			flavor: -1
		});
	}
	events.sort((a, b) => a.at - b.at);
	return {
		game,
		events,
		shuffles
	};
}
function inspectPlan$4(plan) {
	const counts = {};
	for (const event of plan.events) counts[event.kind] = (counts[event.kind] ?? 0) + 1;
	return {
		counts,
		normal: plan.events.filter((e) => e.kind === "flavor" && e.flavor >= 3).length,
		newFlavors: plan.events.filter((e) => e.kind === "flavor" && e.flavor < 3).map((e) => e.flavor),
		basePotential: plan.events.reduce((sum, e) => sum + (e.kind === "logo" ? GAME_CONFIG$4.LIF_LOGO_POINTS : e.kind === "flavor" ? e.flavor < 3 ? GAME_CONFIG$4.NEW_FLAVOR_POINTS : GAME_CONFIG$4.NORMAL_FLAVOR_POINTS : 0), 0),
		timedPotential: plan.events.reduce((sum, e) => {
			return sum + (e.kind === "logo" ? GAME_CONFIG$4.LIF_LOGO_POINTS : e.kind === "flavor" ? e.flavor < 3 ? GAME_CONFIG$4.NEW_FLAVOR_POINTS : GAME_CONFIG$4.NORMAL_FLAVOR_POINTS : 0) * (plan.events.some((b) => (b.kind === "double" || b.kind === "boost") && b.at <= e.at && b.at + (b.kind === "double" ? GAME_CONFIG$4.POWERUP_DURATION_SECONDS : GAME_CONFIG$4.BOOST_DURATION_SECONDS) * 1e3 > e.at) ? 2 : 1);
		}, 0)
	};
}
function validPlan$4(plan) {
	const stats = inspectPlan$4(plan);
	if (plan.events.some((e) => e.at < 0 || e.at >= 18e4)) return false;
	if (plan.game === "snake") return stats.counts.double === 3 && stats.counts.shield === 3 && stats.counts.hazard === 6 && stats.basePotential === 0;
	return stats.counts.double === 3 && stats.counts.peek === 3 && plan.shuffles.every((at, i) => {
		const gap = at - (plan.shuffles[i - 1] ?? 0);
		return gap >= 35e3 && gap <= 55e3 && at < 17e4;
	});
}
function createSessionPlan$4(game, seed) {
	for (let retry = 0; retry < GAME_CONFIG$4.SESSION_PLAN_MAX_RETRIES; retry++) {
		const plan = makePlan$4(game, seed + retry * 2654435769 >>> 0);
		if (validPlan$4(plan)) return plan;
	}
	throw new Error("Session plan failed fairness constraints");
}
function memoryPairBag$4(rng, stage, initial = false, previous = -2) {
	const normal = shuffled$4(rng, Array.from({ length: stage === 0 ? 6 : stage === 1 ? 8 : 10 }, (_, i) => i + 3)).slice(0, 4);
	const fresh = initial ? [
		0,
		1,
		2
	] : [
		between$4(rng, 0, 2),
		between$4(rng, 0, 2),
		between$4(rng, 0, 2)
	];
	for (let retry = 0; retry < 64; retry++) {
		const bag = shuffled$4(rng, [
			...normal,
			...fresh,
			-1
		]);
		if (bag[0] === previous || bag.some((f, i) => i > 0 && f === bag[i - 1]) || bag.some((f, i) => i >= 2 && f >= 0 && f < 3 && bag[i - 1] >= 0 && bag[i - 1] < 3 && bag[i - 2] >= 0 && bag[i - 2] < 3)) continue;
		return bag;
	}
	const freshOrder = shuffled$4(rng, fresh);
	const rest = shuffled$4(rng, [...normal, -1]);
	const bag = [
		rest[0],
		freshOrder[0],
		rest[1],
		freshOrder[1],
		rest[2],
		freshOrder[2],
		rest[3],
		rest[4]
	];
	if (bag[0] === previous) [bag[0], bag[7]] = [bag[7], bag[0]];
	return bag;
}
//#endregion
//#region lib/gaming/memory-engine.ts
function card$4(s, flavor, phase = "idle") {
	return {
		id: s.nextId++,
		flavor,
		phase,
		until: s.activeMs
	};
}
function createMemory$4(s) {
	return {
		cards: shuffled$4(s, memoryPairBag$4(s, 0, true).flatMap((flavor) => [card$4(s, flavor, "preview"), card$4(s, flavor, "preview")])),
		selected: [],
		evaluationAt: 0,
		transitionAt: GAME_CONFIG$4.MEMORY_BOARD_PREVIEW_MS,
		cycle: "preview",
		matches: 0,
		errorStreak: 0,
		superProgress: 0,
		pendingSuper: false,
		peekCharges: 1,
		radarCharges: 0,
		peekUntil: 0,
		radarUntil: 0,
		radarSlots: [],
		boardIndex: 0,
		notice: "Memorizá los sabores",
		noticeUntil: GAME_CONFIG$4.MEMORY_BOARD_PREVIEW_MS,
		stage: 0
	};
}
var safe$4 = (m) => m.cycle === "idle" && m.selected.length === 0 && m.cards.every((c) => c.phase === "idle" || c.phase === "matched");
function memoryInput$4(s, input) {
	const m = s.memory;
	if (m.cycle !== "idle" || m.peekUntil > s.activeMs) return false;
	if (input.action === "peek") {
		if (!safe$4(m) || m.peekCharges < 1) return false;
		m.peekCharges--;
		m.peekUntil = s.activeMs + GAME_CONFIG$4.MEMORY_PEEK_DURATION_SECONDS * 1e3;
		emit(s, "peek");
		return true;
	}
	if (input.action === "radar") {
		if (!GAME_CONFIG$4.MEMORY_RADAR_ENABLED || !safe$4(m) || m.radarCharges < 1) return false;
		m.radarCharges--;
		m.radarUntil = s.activeMs + 3e3;
		m.radarSlots = shuffled$4(s, [...new Set(m.cards.map((c) => c.flavor))]).slice(0, 3).map((flavor) => shuffled$4(s, m.cards.map((c, i) => c.flavor === flavor ? i : -1).filter((i) => i >= 0))[0]);
		emit(s, "radar");
		return true;
	}
	const slot = input.slot;
	if (!Number.isInteger(slot) || slot < 0 || slot >= m.cards.length || m.selected.length >= 2) return false;
	const selected = m.cards[slot];
	if (selected.phase !== "idle" || m.selected.includes(slot)) return false;
	selected.phase = "flipping";
	selected.until = s.activeMs + GAME_CONFIG$4.MEMORY_FLIP_MS;
	m.selected.push(slot);
	emit(s, "flip", 0, -1, {
		x: slot % 4,
		y: Math.floor(slot / 4)
	});
	if (m.selected.length === 2) {
		m.cycle = "evaluating";
		m.evaluationAt = selected.until + 80;
	}
	return true;
}
function startSuper$4(s) {
	const m = s.memory;
	m.pendingSuper = false;
	m.superProgress = 0;
	s.bonusCount++;
	const points = GAME_CONFIG$4.MEMORY_SUPER_BONUS_POINTS * (GAME_CONFIG$4.MEMORY_X2_SUPER_BONUS && s.doubleUntil > s.activeMs ? 2 : 1);
	s.score += points;
	s.spotlight = "super";
	s.freezeMs = GAME_CONFIG$4.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
	emit(s, "super", points);
}
function evaluate$4(s) {
	const m = s.memory, [a, b] = m.selected.map((i) => m.cards[i]);
	if (a.flavor !== b.flavor) {
		m.errorStreak++;
		const penalty = m.errorStreak > GAME_CONFIG$4.MEMORY_FREE_MISMATCHES_PER_STREAK ? GAME_CONFIG$4.MEMORY_MISMATCH_PENALTY : 0;
		s.score = Math.max(0, s.score - penalty);
		a.phase = b.phase = "mismatch";
		m.cycle = "mismatch";
		m.transitionAt = s.activeMs + [
			800,
			700,
			600
		][m.stage];
		m.notice = penalty ? `Sin pareja: −${penalty} puntos` : "Primer fallo: sin penalización";
		m.noticeUntil = s.activeMs + 1600;
		emit(s, "mismatch", -penalty, -1, {
			x: m.selected[0] % 4,
			y: Math.floor(m.selected[0] / 4)
		});
		if (m.errorStreak >= GAME_CONFIG$4.MEMORY_MAX_ERROR_STREAK) {
			s.ended = "error_streak";
			emit(s, "death");
		}
		return;
	}
	m.errorStreak = 0;
	a.phase = b.phase = "matched";
	m.cycle = "matched";
	m.transitionAt = s.activeMs + 320;
	m.notice = "¡Pareja encontrada!";
	m.noticeUntil = s.activeMs + 1600;
	m.matches++;
	m.superProgress++;
	const flavor = a.flavor, isNew = flavor >= 0 && flavor < 3;
	const points = (flavor === -1 ? GAME_CONFIG$4.MEMORY_LOGO_MATCH_POINTS : isNew ? GAME_CONFIG$4.MEMORY_MATCH_NEW_FLAVOR_POINTS : GAME_CONFIG$4.MEMORY_MATCH_NORMAL_POINTS) * (s.doubleUntil > s.activeMs ? 2 : 1);
	s.score += points;
	emit(s, flavor === -1 ? "logo" : isNew ? "new" : "normal", points, flavor, {
		x: m.selected[0] % 4,
		y: Math.floor(m.selected[0] / 4)
	});
	if (isNew) {
		if (!s.newSeen.includes(flavor)) s.newSeen.push(flavor);
		s.spotlight = flavor;
		s.freezeMs = GAME_CONFIG$4.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
	}
	if (m.superProgress >= GAME_CONFIG$4.MEMORY_SUPER_BONUS_MATCHES) {
		m.pendingSuper = true;
		if (!s.freezeMs) startSuper$4(s);
	}
}
function replaceBoard(s) {
	const m = s.memory;
	const previous = m.cards.map((c) => c.flavor);
	m.cards = shuffled$4(s, memoryPairBag$4(s, m.stage, true).flatMap((flavor) => [card$4(s, flavor, "preview"), card$4(s, flavor, "preview")]));
	if (m.cards.every((c, i) => c.flavor === previous[i])) m.cards.push(m.cards.shift());
	m.boardIndex++;
	m.selected = [];
	m.cycle = "preview";
	m.transitionAt = s.activeMs + GAME_CONFIG$4.MEMORY_BOARD_PREVIEW_MS;
	m.notice = "Nuevo tablero: memorizá los sabores";
	m.noticeUntil = m.transitionAt;
}
function stepMemory$4(s) {
	const m = s.memory;
	m.stage = Math.min(2, Math.floor(s.activeMs / 6e4));
	if (m.pendingSuper) {
		startSuper$4(s);
		return;
	}
	for (const card of m.cards) if (card.phase === "flipping" && s.activeMs >= card.until) card.phase = "revealed";
	if (m.cycle === "evaluating" && s.activeMs >= m.evaluationAt) evaluate$4(s);
	else if (s.activeMs >= m.transitionAt) {
		if (m.cycle === "mismatch") {
			for (const slot of m.selected) m.cards[slot].phase = "closing";
			m.cycle = "closing";
			m.transitionAt = s.activeMs + GAME_CONFIG$4.MEMORY_FLIP_MS;
		} else if (m.cycle === "closing") {
			for (const slot of m.selected) m.cards[slot].phase = "idle";
			m.selected = [];
			m.cycle = "idle";
		} else if (m.cycle === "matched") {
			m.selected = [];
			if (m.cards.every((c) => c.phase === "matched")) {
				for (const card of m.cards) card.phase = "exiting";
				m.cycle = "exiting";
				m.transitionAt = s.activeMs + 420;
				m.notice = "¡Tablero completo!";
				m.noticeUntil = m.transitionAt;
			} else m.cycle = "idle";
		} else if (m.cycle === "exiting") replaceBoard(s);
		else if (m.cycle === "preview") {
			for (const card of m.cards) card.phase = "closing";
			m.cycle = "board-closing";
			m.transitionAt = s.activeMs + GAME_CONFIG$4.MEMORY_FLIP_MS;
		} else if (m.cycle === "board-closing") {
			for (const card of m.cards) card.phase = "idle";
			m.cycle = "idle";
		}
	}
	if (!safe$4(m) || m.peekUntil > s.activeMs || s.freezeMs > 0) return;
	while (s.scheduleIndex < s.plan.events.length && s.plan.events[s.scheduleIndex].at <= s.activeMs) {
		const event = s.plan.events[s.scheduleIndex++];
		if (event.kind === "double") {
			s.doubleUntil = s.activeMs + GAME_CONFIG$4.MEMORY_X2_DURATION_SECONDS * 1e3;
			emit(s, "powerup");
		}
		if (event.kind === "peek") {
			m.peekCharges++;
			emit(s, "powerup");
		}
		if (event.kind === "radar") {
			m.radarCharges++;
			emit(s, "powerup");
		}
	}
}
//#endregion
//#region lib/gaming/legacy-engine.ts
var vectors$2 = {
	up: {
		x: 0,
		y: -1
	},
	down: {
		x: 0,
		y: 1
	},
	left: {
		x: -1,
		y: 0
	},
	right: {
		x: 1,
		y: 0
	}
};
var opposites$2 = {
	up: "down",
	down: "up",
	left: "right",
	right: "left"
};
function random$4(s) {
	s.rng = s.rng + 1831565813 | 0;
	let t = Math.imul(s.rng ^ s.rng >>> 15, 1 | s.rng);
	t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
	return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
var same$2 = (a, b) => a.x === b.x && a.y === b.y;
function createGame$5(game, seed) {
	const snake = [
		{
			x: 8,
			y: 10
		},
		{
			x: 7,
			y: 10
		},
		{
			x: 6,
			y: 10
		}
	];
	const state = {
		game,
		rng: seed,
		ms: 0,
		activeMs: 0,
		score: 0,
		nextId: 1,
		lane: 2,
		catcherX: 2,
		target: 0,
		items: [],
		snake,
		previousSnake: snake.map((c) => ({ ...c })),
		direction: "right",
		queued: null,
		tickMs: 0,
		spawnAt: 0,
		newIndex: 0,
		newSeen: [],
		bonusCount: 0,
		doubleUntil: 0,
		magnetUntil: 0,
		shield: false,
		boostMs: 0,
		freezeMs: 0,
		spotlight: null,
		ended: null,
		events: []
	};
	if (game === "snake") {
		spawn$2(state, "flavor", 0);
		state.newIndex = 1;
		spawn$2(state, "hazard", 0);
	}
	return state;
}
function emit$5(s, type, value = 0, flavor = -1, p = {
	x: 0,
	y: 0
}) {
	s.events.push({
		id: s.nextId++,
		type,
		value,
		flavor,
		at: s.activeMs,
		...p
	});
}
function freeCell$2(s) {
	const free = [];
	for (let y = 2; y < LEGACY_CONFIG.BOARD_ROWS - 2; y++) for (let x = 2; x < LEGACY_CONFIG.BOARD_COLS - 2; x++) {
		const p = {
			x,
			y
		};
		if (!s.snake.some((c) => same$2(c, p)) && !s.items.some((i) => Math.abs(i.x - x) <= 1 && Math.abs(i.y - y) <= 1) && Math.abs(s.snake[0].x - x) + Math.abs(s.snake[0].y - y) > 3) free.push(p);
	}
	return free.length ? free[Math.floor(random$4(s) * free.length)] : null;
}
function spawn$2(s, kind, flavor = -1, lane) {
	const nextLane = lane ?? Math.floor(random$4(s) * 5);
	const cell = s.game === "snake" ? freeCell$2(s) : {
		x: nextLane,
		y: -.1
	};
	if (!cell) return;
	const fleeting = kind !== "flavor" && kind !== "hazard";
	s.items.push({
		...cell,
		id: s.nextId++,
		kind,
		flavor,
		born: s.activeMs,
		ttl: fleeting ? LEGACY_CONFIG.FLEETING_ITEM_DURATION_SECONDS * 1e3 : s.game === "snake" && kind === "hazard" ? 12e3 : 3e4,
		lane: nextLane,
		speed: (.21 + Math.floor(s.activeMs / 6e4) * .05) * (.9 + random$4(s) * .2)
	});
}
function applyInput$5(s, input) {
	if (s.ended || s.freezeMs) return;
	if (s.game === "catch") {
		if (input.lane !== void 0) s.lane = Math.max(0, Math.min(4, Math.round(input.lane)));
		else if (input.direction === "left") s.lane = Math.max(0, s.lane - 1);
		else if (input.direction === "right") s.lane = Math.min(4, s.lane + 1);
	} else if (input.direction && input.direction !== opposites$2[s.direction] && !s.queued) s.queued = input.direction;
}
function collect$2(s, item) {
	const multiplier = s.activeMs < s.doubleUntil || s.boostMs > 0 ? 2 : 1;
	if (item.kind === "boost") {
		s.boostMs = LEGACY_CONFIG.BOOST_DURATION_SECONDS * 1e3;
		emit$5(s, "boost", 0, -1, item);
		return;
	}
	if (item.kind === "hazard") {
		if (s.shield) {
			s.shield = false;
			emit$5(s, "powerup", 0, -1, item);
			return;
		}
		s.score = Math.max(0, s.score - LEGACY_CONFIG.COMPETITOR_PENALTY_POINTS);
		s.snake = s.snake.slice(0, Math.max(LEGACY_CONFIG.SNAKE_STARTING_LENGTH, s.snake.length - LEGACY_CONFIG.COMPETITOR_SEGMENT_DAMAGE));
		emit$5(s, "penalty", -LEGACY_CONFIG.COMPETITOR_PENALTY_POINTS, -1, item);
		return;
	}
	if (item.kind === "double" || item.kind === "magnet" || item.kind === "shield") {
		if (item.kind === "double") s.doubleUntil = s.activeMs + LEGACY_CONFIG.POWERUP_DURATION_SECONDS * 1e3;
		if (item.kind === "magnet") s.magnetUntil = s.activeMs + LEGACY_CONFIG.MAGNET_DURATION_SECONDS * 1e3;
		if (item.kind === "shield") s.shield = true;
		emit$5(s, "powerup", 0, -1, item);
		return;
	}
	if (item.kind === "logo") {
		const value = LEGACY_CONFIG.LIF_LOGO_POINTS * multiplier;
		s.score += value;
		emit$5(s, "logo", value, -1, item);
		return;
	}
	if (s.game === "catch" && item.flavor !== s.target) {
		s.score = Math.max(0, s.score - LEGACY_CONFIG.WRONG_FLAVOR_PENALTY_POINTS);
		emit$5(s, "penalty", -LEGACY_CONFIG.WRONG_FLAVOR_PENALTY_POINTS, item.flavor, item);
		if (!s.score) {
			s.ended = "points";
			emit$5(s, "death");
		}
		return;
	}
	const isNew = item.flavor < 3;
	const value = (isNew ? LEGACY_CONFIG.NEW_FLAVOR_POINTS : LEGACY_CONFIG.NORMAL_FLAVOR_POINTS) * multiplier;
	s.score += value;
	emit$5(s, isNew ? "new" : "normal", value, item.flavor, item);
	if (isNew && !s.newSeen.includes(item.flavor)) {
		s.newSeen.push(item.flavor);
		s.spotlight = item.flavor;
		s.freezeMs = LEGACY_CONFIG.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
	}
	if (s.game === "snake") s.snake.push({ ...s.snake[s.snake.length - 1] });
	if (s.game === "snake" && s.snake.length >= LEGACY_CONFIG.SNAKE_SUPER_BONUS_LENGTH) {
		s.score += LEGACY_CONFIG.SNAKE_SUPER_BONUS_POINTS;
		s.bonusCount++;
		s.snake = s.snake.slice(0, LEGACY_CONFIG.SNAKE_STARTING_LENGTH);
		s.freezeMs = LEGACY_CONFIG.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
		s.spotlight = "super";
		emit$5(s, "super", LEGACY_CONFIG.SNAKE_SUPER_BONUS_POINTS, -1, item);
	}
}
function stepGame$5(s) {
	if (s.ended) return;
	s.ms += LEGACY_CONFIG.STEP_MS;
	if (s.freezeMs > 0) {
		s.freezeMs = Math.max(0, s.freezeMs - LEGACY_CONFIG.STEP_MS);
		if (!s.freezeMs) s.spotlight = null;
		return;
	}
	const speed = s.boostMs > 0 ? LEGACY_CONFIG.BOOST_SPEED_MULTIPLIER : 1;
	const previousActiveMs = s.activeMs;
	s.activeMs += LEGACY_CONFIG.STEP_MS * (s.boostMs > 0 ? LEGACY_CONFIG.BOOST_CLOCK_MULTIPLIER : 1);
	s.boostMs = Math.max(0, s.boostMs - LEGACY_CONFIG.STEP_MS);
	if (s.activeMs >= LEGACY_CONFIG.GAME_DURATION_SECONDS * 1e3) {
		s.activeMs = LEGACY_CONFIG.GAME_DURATION_SECONDS * 1e3;
		s.ended = "time";
		emit$5(s, "complete");
		return;
	}
	s.items = s.items.filter((i) => s.activeMs - i.born < i.ttl);
	if (s.game === "catch") {
		s.target = Math.floor(s.activeMs / (LEGACY_CONFIG.TARGET_FLAVOR_DURATION * 1e3)) % 13;
		s.catcherX += Math.max(-.14, Math.min(.14, s.lane - s.catcherX));
		if (s.activeMs >= s.spawnAt) {
			const difficulty = Math.floor(s.activeMs / 6e4);
			const roll = random$4(s);
			if (roll < .1) spawn$2(s, "logo");
			else if (roll < .16) spawn$2(s, "double");
			else if (roll < .21) spawn$2(s, "magnet");
			else if (roll < .27) spawn$2(s, "boost");
			else spawn$2(s, "flavor", random$4(s) < .6 ? s.target : Math.floor(random$4(s) * 13));
			s.spawnAt = s.activeMs + [
				800,
				660,
				520
			][difficulty] / speed;
		}
		if (previousActiveMs === 0 || Math.floor(previousActiveMs / (LEGACY_CONFIG.TARGET_FLAVOR_DURATION * 1e3)) !== Math.floor(s.activeMs / (LEGACY_CONFIG.TARGET_FLAVOR_DURATION * 1e3))) spawn$2(s, "flavor", s.target, s.lane);
		for (const i of s.items) {
			i.y += i.speed * LEGACY_CONFIG.STEP_MS * speed / 1e3;
			if (i.y >= .87) {
				const radius = s.activeMs < s.magnetUntil ? .85 : .48;
				if (Math.abs(i.lane - s.catcherX) <= radius) collect$2(s, i);
				s.items = s.items.filter((c) => c.id !== i.id);
				if (s.freezeMs || s.ended) break;
			}
		}
	} else {
		const interval = LEGACY_CONFIG.SNAKE_TICK_MS / Math.pow(1 + LEGACY_CONFIG.SNAKE_SPEED_INCREASE_PER_SUPER_BONUS, s.bonusCount) / speed;
		s.tickMs += LEGACY_CONFIG.STEP_MS;
		if (s.tickMs >= interval) {
			s.tickMs -= interval;
			if (s.queued) {
				s.direction = s.queued;
				s.queued = null;
			}
			const vector = vectors$2[s.direction], head = {
				x: s.snake[0].x + vector.x,
				y: s.snake[0].y + vector.y
			};
			if (head.x < 0 || head.y < 0 || head.x >= LEGACY_CONFIG.BOARD_COLS || head.y >= LEGACY_CONFIG.BOARD_ROWS) s.ended = "wall";
			else if (s.snake.slice(0, -1).some((c) => same$2(c, head))) s.ended = "self";
			if (s.ended) {
				emit$5(s, "death");
				return;
			}
			s.previousSnake = s.snake.map((c) => ({ ...c }));
			s.snake = [head, ...s.snake.slice(0, -1)];
			const item = s.items.find((i) => same$2(i, head));
			if (item) {
				s.items = s.items.filter((i) => i.id !== item.id);
				collect$2(s, item);
			}
		}
		if (!s.items.some((i) => i.kind === "flavor")) spawn$2(s, "flavor", s.newIndex < 3 ? s.newIndex++ : 3 + Math.floor(random$4(s) * 10));
		if (s.activeMs >= 2e4 && s.newIndex < 2) {
			spawn$2(s, "flavor", 1);
			s.newIndex = 2;
		}
		if (s.activeMs >= 4e4 && s.newIndex < 3) {
			spawn$2(s, "flavor", 2);
			s.newIndex = 3;
		}
		if (s.activeMs >= s.spawnAt) {
			const kind = [
				"logo",
				"double",
				"shield",
				"hazard",
				"boost"
			][Math.floor(random$4(s) * 5)];
			if (s.items.filter((i) => i.kind === kind).length < 2) spawn$2(s, kind, Math.floor(random$4(s) * 2));
			s.spawnAt = s.activeMs + 5500;
		}
	}
}
function replayGame$5(game, seed, inputs, untilMs) {
	const state = createGame$5(game, seed);
	let index = 0;
	for (let t = 0; t < untilMs && !state.ended; t += LEGACY_CONFIG.STEP_MS) {
		while (index < inputs.length && inputs[index].at <= state.ms) applyInput$5(state, inputs[index++]);
		stepGame$5(state);
	}
	return state;
}
//#endregion
//#region lib/gaming/versions/memory-v1/config.ts
var GAME_CONFIG$3 = {
	VERSION: "lif-games-20261007-memory-v1",
	RANDOMIZATION_MODE: "seeded_controlled",
	ENABLE_SESSION_SEED: true,
	ENABLE_DEBUG_SEED_REPLAY: true,
	MEMORY_BOARD_ROWS: 4,
	MEMORY_BOARD_COLS: 4,
	MEMORY_MATCH_NORMAL_POINTS: 50,
	MEMORY_MATCH_NEW_FLAVOR_POINTS: 300,
	MEMORY_LOGO_MATCH_POINTS: 150,
	MEMORY_MISMATCH_PENALTY: 0,
	MEMORY_SUPER_BONUS_MATCHES: 6,
	MEMORY_SUPER_BONUS_POINTS: 1e3,
	MEMORY_X2_SUPER_BONUS: false,
	MEMORY_PEEK_DURATION_SECONDS: 1,
	MEMORY_X2_DURATION_SECONDS: 10,
	MEMORY_SHUFFLE_MIN_INTERVAL_SECONDS: 35,
	MEMORY_SHUFFLE_MAX_INTERVAL_SECONDS: 55,
	MEMORY_FLIP_MS: 360,
	MEMORY_RADAR_ENABLED: false,
	SNAKE_NORMAL_SPAWN_SECONDS: 12,
	SNAKE_FAIRNESS_TIMED_POTENTIAL_MIN: 3450,
	SNAKE_FAIRNESS_TIMED_POTENTIAL_MAX: 4050,
	SESSION_PLAN_MAX_RETRIES: 64,
	SNAKE_ITEM_MIN_DISTANCE: 5,
	SNAKE_ITEM_MAX_DISTANCE: 13,
	GAME_DURATION_SECONDS: 180,
	DAILY_ATTEMPTS: 3,
	TIMEZONE: "America/Costa_Rica",
	CURTAIN_OPEN_DURATION_MS: 4250,
	COUNTDOWN_STEP_MS: 1e3,
	NORMAL_FLAVOR_POINTS: 50,
	LIF_LOGO_POINTS: 150,
	NEW_FLAVOR_POINTS: 300,
	COMPETITOR_PENALTY_POINTS: 100,
	COMPETITOR_SEGMENT_DAMAGE: 2,
	SNAKE_STARTING_LENGTH: 3,
	SNAKE_SUPER_BONUS_LENGTH: 15,
	SNAKE_SUPER_BONUS_POINTS: 1e3,
	SNAKE_SPEED_INCREASE_PER_SUPER_BONUS: .06,
	SNAKE_TICK_MS: 190,
	BOARD_COLS: 30,
	BOARD_ROWS: 20,
	POWERUP_DURATION_SECONDS: 10,
	BOOST_DURATION_SECONDS: 7,
	BOOST_SPEED_MULTIPLIER: 1.4,
	BOOST_CLOCK_MULTIPLIER: 1.4,
	MAGNET_DURATION_SECONDS: 7,
	FLEETING_ITEM_DURATION_SECONDS: 4,
	NEW_FLAVOR_SPOTLIGHT_SECONDS: 1.75,
	LEADERBOARD_SIZE: 10,
	LEADERBOARD_MAX_SIZE: 10,
	STEP_MS: 20,
	SHOW_COLLISION_BOXES: false,
	GAME_OVER_JINGLE_MODE: "fixed",
	RANKING_PERIOD: "campaign",
	RANKING_START: "2026-10-01",
	RANKING_END: "2027-12-31",
	PLAY_CTA: "JUGAR"
};
//#endregion
//#region lib/gaming/versions/memory-v1/session-random.ts
function random$3(state) {
	state.rng = state.rng + 1831565813 | 0;
	let t = Math.imul(state.rng ^ state.rng >>> 15, 1 | state.rng);
	t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
	return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function stream$3(seed, label) {
	let hash = seed >>> 0;
	for (const character of label) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
	return { rng: hash >>> 0 };
}
function between$3(state, min, max) {
	return min + Math.floor(random$3(state) * (max - min + 1));
}
function shuffled$3(state, values) {
	const result = [...values];
	for (let i = result.length - 1; i > 0; i--) {
		const j = between$3(state, 0, i);
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}
function makePlan$3(game, seed) {
	const rng = stream$3(seed, `${GAME_CONFIG$3.VERSION}:schedule:${game}`);
	const events = [];
	const shuffles = [];
	if (game === "snake") {
		const flavors = shuffled$3(rng, [
			0,
			1,
			2
		]);
		const hazards = shuffled$3(rng, [
			0,
			0,
			0,
			1,
			1,
			1
		]);
		[
			[2e3, 9e3],
			[19e3, 28e3],
			[37e3, 48e3]
		].forEach(([min, max], i) => {
			events.push({
				at: between$3(rng, min, max),
				kind: "flavor",
				flavor: flavors[i]
			});
		});
		for (let window = 0; window < 6; window++) shuffled$3(rng, [
			"logo",
			"double",
			"shield",
			"boost",
			"hazard"
		]).forEach((kind, i) => events.push({
			at: window * 3e4 + i * 5500 + between$3(rng, 1e3, 3500),
			kind,
			flavor: kind === "hazard" ? hazards[window] : -1
		}));
		const flavorsBag = shuffled$3(rng, Array.from({ length: 10 }, (_, i) => i + 3));
		for (let i = 0; i < 15; i++) events.push({
			at: i === 0 ? 0 : i * GAME_CONFIG$3.SNAKE_NORMAL_SPAWN_SECONDS * 1e3 + between$3(rng, -1600, 1600),
			kind: "flavor",
			flavor: flavorsBag[i % 10]
		});
	} else {
		for (let window = 0; window < 3; window++) {
			shuffled$3(rng, ["double", "peek"]).forEach((kind, i) => events.push({
				at: window * 6e4 + 12e3 + i * 22e3 + between$3(rng, -3500, 3500),
				kind,
				flavor: -1
			}));
			if (GAME_CONFIG$3.MEMORY_RADAR_ENABLED) events.push({
				at: window * 6e4 + 46e3 + between$3(rng, -3e3, 3e3),
				kind: "radar",
				flavor: -1
			});
		}
		let at = 0;
		while (true) {
			at += between$3(rng, GAME_CONFIG$3.MEMORY_SHUFFLE_MIN_INTERVAL_SECONDS * 1e3, GAME_CONFIG$3.MEMORY_SHUFFLE_MAX_INTERVAL_SECONDS * 1e3);
			if (at >= 17e4) break;
			shuffles.push(at);
		}
	}
	events.sort((a, b) => a.at - b.at);
	return {
		game,
		events,
		shuffles
	};
}
function inspectPlan$3(plan) {
	const counts = {};
	for (const event of plan.events) counts[event.kind] = (counts[event.kind] ?? 0) + 1;
	return {
		counts,
		normal: plan.events.filter((e) => e.kind === "flavor" && e.flavor >= 3).length,
		newFlavors: plan.events.filter((e) => e.kind === "flavor" && e.flavor < 3).map((e) => e.flavor),
		basePotential: plan.events.reduce((sum, e) => sum + (e.kind === "logo" ? GAME_CONFIG$3.LIF_LOGO_POINTS : e.kind === "flavor" ? e.flavor < 3 ? GAME_CONFIG$3.NEW_FLAVOR_POINTS : GAME_CONFIG$3.NORMAL_FLAVOR_POINTS : 0), 0),
		timedPotential: plan.events.reduce((sum, e) => {
			return sum + (e.kind === "logo" ? GAME_CONFIG$3.LIF_LOGO_POINTS : e.kind === "flavor" ? e.flavor < 3 ? GAME_CONFIG$3.NEW_FLAVOR_POINTS : GAME_CONFIG$3.NORMAL_FLAVOR_POINTS : 0) * (plan.events.some((b) => (b.kind === "double" || b.kind === "boost") && b.at <= e.at && b.at + (b.kind === "double" ? GAME_CONFIG$3.POWERUP_DURATION_SECONDS : GAME_CONFIG$3.BOOST_DURATION_SECONDS) * 1e3 > e.at) ? 2 : 1);
		}, 0)
	};
}
function validPlan$3(plan) {
	const stats = inspectPlan$3(plan);
	if (plan.events.some((e) => e.at < 0 || e.at >= 18e4)) return false;
	if (plan.game === "snake") return stats.normal === 15 && new Set(stats.newFlavors).size === 3 && [
		"logo",
		"double",
		"shield",
		"boost",
		"hazard"
	].every((kind) => stats.counts[kind] === 6) && stats.basePotential === 2550 && stats.timedPotential >= GAME_CONFIG$3.SNAKE_FAIRNESS_TIMED_POTENTIAL_MIN && stats.timedPotential <= GAME_CONFIG$3.SNAKE_FAIRNESS_TIMED_POTENTIAL_MAX;
	return stats.counts.double === 3 && stats.counts.peek === 3 && plan.shuffles.every((at, i) => {
		const gap = at - (plan.shuffles[i - 1] ?? 0);
		return gap >= 35e3 && gap <= 55e3 && at < 17e4;
	});
}
function createSessionPlan$3(game, seed) {
	for (let retry = 0; retry < GAME_CONFIG$3.SESSION_PLAN_MAX_RETRIES; retry++) {
		const plan = makePlan$3(game, seed + retry * 2654435769 >>> 0);
		if (validPlan$3(plan)) return plan;
	}
	throw new Error("Session plan failed fairness constraints");
}
function memoryPairBag$3(rng, stage, initial = false, previous = -2) {
	const normal = shuffled$3(rng, Array.from({ length: stage === 0 ? 6 : stage === 1 ? 8 : 10 }, (_, i) => i + 3)).slice(0, 4);
	const fresh = initial ? [
		0,
		1,
		2
	] : [
		between$3(rng, 0, 2),
		between$3(rng, 0, 2),
		between$3(rng, 0, 2)
	];
	for (let retry = 0; retry < 64; retry++) {
		const bag = shuffled$3(rng, [
			...normal,
			...fresh,
			-1
		]);
		if (bag[0] === previous || bag.some((f, i) => i > 0 && f === bag[i - 1]) || bag.some((f, i) => i >= 2 && f >= 0 && f < 3 && bag[i - 1] >= 0 && bag[i - 1] < 3 && bag[i - 2] >= 0 && bag[i - 2] < 3)) continue;
		return bag;
	}
	const freshOrder = shuffled$3(rng, fresh);
	const rest = shuffled$3(rng, [...normal, -1]);
	const bag = [
		rest[0],
		freshOrder[0],
		rest[1],
		freshOrder[1],
		rest[2],
		freshOrder[2],
		rest[3],
		rest[4]
	];
	if (bag[0] === previous) [bag[0], bag[7]] = [bag[7], bag[0]];
	return bag;
}
//#endregion
//#region lib/gaming/versions/memory-v1/memory-engine.ts
function card$3(s, flavor, phase = "idle") {
	return {
		id: s.nextId++,
		flavor,
		phase,
		until: s.activeMs + (phase === "replacing" ? 320 : 0)
	};
}
function createMemory$3(s) {
	return {
		cards: shuffled$3(s, memoryPairBag$3(s, 0, true).flatMap((flavor) => [card$3(s, flavor), card$3(s, flavor)])),
		selected: [],
		evaluationAt: 0,
		transitionAt: 0,
		cycle: "idle",
		bag: [],
		lastFlavor: -2,
		matches: 0,
		superProgress: 0,
		pendingSuper: false,
		peekCharges: 1,
		radarCharges: 0,
		peekUntil: 0,
		radarUntil: 0,
		radarSlots: [],
		shuffleIndex: 0,
		notice: "",
		noticeUntil: 0,
		stage: 0
	};
}
var safe$3 = (m) => m.cycle === "idle" && m.selected.length === 0 && m.cards.every((c) => c.phase === "idle");
function memoryInput$3(s, input) {
	const m = s.memory;
	if (m.cycle !== "idle" || m.peekUntil > s.activeMs) return false;
	if (input.action === "peek") {
		if (!safe$3(m) || m.peekCharges < 1) return false;
		m.peekCharges--;
		m.peekUntil = s.activeMs + GAME_CONFIG$3.MEMORY_PEEK_DURATION_SECONDS * 1e3;
		emit$4(s, "peek");
		return true;
	}
	if (input.action === "radar") {
		if (!GAME_CONFIG$3.MEMORY_RADAR_ENABLED || !safe$3(m) || m.radarCharges < 1) return false;
		m.radarCharges--;
		m.radarUntil = s.activeMs + 3e3;
		m.radarSlots = shuffled$3(s, [...new Set(m.cards.map((c) => c.flavor))]).slice(0, 3).map((flavor) => shuffled$3(s, m.cards.map((c, i) => c.flavor === flavor ? i : -1).filter((i) => i >= 0))[0]);
		emit$4(s, "radar");
		return true;
	}
	const slot = input.slot;
	if (!Number.isInteger(slot) || slot < 0 || slot >= m.cards.length || m.selected.length >= 2) return false;
	const selected = m.cards[slot];
	if (selected.phase !== "idle" || m.selected.includes(slot)) return false;
	selected.phase = "flipping";
	selected.until = s.activeMs + GAME_CONFIG$3.MEMORY_FLIP_MS;
	m.selected.push(slot);
	emit$4(s, "flip", 0, -1, {
		x: slot % 4,
		y: Math.floor(slot / 4)
	});
	if (m.selected.length === 2) {
		m.cycle = "evaluating";
		m.evaluationAt = selected.until + 80;
	}
	return true;
}
function startSuper$3(s) {
	const m = s.memory;
	m.pendingSuper = false;
	m.superProgress = 0;
	s.bonusCount++;
	const points = GAME_CONFIG$3.MEMORY_SUPER_BONUS_POINTS * (GAME_CONFIG$3.MEMORY_X2_SUPER_BONUS && s.doubleUntil > s.activeMs ? 2 : 1);
	s.score += points;
	s.spotlight = "super";
	s.freezeMs = GAME_CONFIG$3.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
	emit$4(s, "super", points);
}
function evaluate$3(s) {
	const m = s.memory, [a, b] = m.selected.map((i) => m.cards[i]);
	if (a.flavor !== b.flavor) {
		a.phase = b.phase = "mismatch";
		m.cycle = "mismatch";
		m.transitionAt = s.activeMs + [
			800,
			700,
			600
		][m.stage];
		emit$4(s, "mismatch");
		return;
	}
	a.phase = b.phase = "matched";
	m.cycle = "matched";
	m.transitionAt = s.activeMs + 320;
	m.notice = "Nueva pareja: mezcla breve";
	m.noticeUntil = s.activeMs + 1600;
	m.matches++;
	m.superProgress++;
	const flavor = a.flavor, isNew = flavor >= 0 && flavor < 3;
	const points = (flavor === -1 ? GAME_CONFIG$3.MEMORY_LOGO_MATCH_POINTS : isNew ? GAME_CONFIG$3.MEMORY_MATCH_NEW_FLAVOR_POINTS : GAME_CONFIG$3.MEMORY_MATCH_NORMAL_POINTS) * (s.doubleUntil > s.activeMs ? 2 : 1);
	s.score += points;
	emit$4(s, flavor === -1 ? "logo" : isNew ? "new" : "normal", points, flavor, {
		x: m.selected[0] % 4,
		y: Math.floor(m.selected[0] / 4)
	});
	if (isNew) {
		if (!s.newSeen.includes(flavor)) s.newSeen.push(flavor);
		s.spotlight = flavor;
		s.freezeMs = GAME_CONFIG$3.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
	}
	if (m.superProgress >= GAME_CONFIG$3.MEMORY_SUPER_BONUS_MATCHES) {
		m.pendingSuper = true;
		if (!s.freezeMs) startSuper$3(s);
	}
}
function replacePair$3(s) {
	const m = s.memory;
	if (!m.bag.length) m.bag = memoryPairBag$3(s, m.stage, false, m.lastFlavor);
	let flavor = m.bag.shift();
	const justMatched = m.cards[m.selected[0]].flavor;
	if (flavor === justMatched) {
		const alternative = m.bag.findIndex((f) => f !== justMatched && f !== m.lastFlavor);
		if (alternative >= 0) [flavor, m.bag[alternative]] = [m.bag[alternative], flavor];
	}
	m.lastFlavor = flavor;
	for (const slot of m.selected) m.cards[slot] = card$3(s, flavor, "replacing");
	const closed = shuffled$3(s, m.cards.map((c, i) => c.phase === "idle" ? i : -1).filter((i) => i >= 0)).slice(0, 4);
	const slots = [...m.selected, ...closed];
	const values = shuffled$3(s, slots.map((i) => m.cards[i]));
	slots.forEach((slot, i) => {
		m.cards[slot] = values[i];
		m.cards[slot].phase = "replacing";
		m.cards[slot].until = s.activeMs + 360;
	});
	m.noticeUntil = s.activeMs + 700;
	m.selected = [];
	m.cycle = "replacing";
	m.transitionAt = s.activeMs + 360;
}
function shuffleClosed$3(s) {
	const m = s.memory;
	const slots = m.cards.map((c, i) => c.phase === "idle" ? i : -1).filter((i) => i >= 0);
	const values = slots.map((i) => m.cards[i]);
	const traversal = shuffled$3(s, slots), shift = 1 + Math.floor(shuffled$3(s, slots)[0] / slots.length * (slots.length - 1));
	traversal.forEach((slot, i) => {
		m.cards[slot] = values[slots.indexOf(traversal[(i + shift) % slots.length])];
		m.cards[slot].phase = "replacing";
	});
	m.cycle = "shuffling";
	m.transitionAt = s.activeMs + 520;
	m.shuffleIndex++;
	emit$4(s, "shuffle");
}
function stepMemory$3(s) {
	const m = s.memory;
	m.stage = Math.min(2, Math.floor(s.activeMs / 6e4));
	if (m.pendingSuper) {
		startSuper$3(s);
		return;
	}
	for (const card of m.cards) if (card.phase === "flipping" && s.activeMs >= card.until) card.phase = "revealed";
	if (m.cycle === "evaluating" && s.activeMs >= m.evaluationAt) evaluate$3(s);
	else if (s.activeMs >= m.transitionAt) {
		if (m.cycle === "mismatch") {
			for (const slot of m.selected) m.cards[slot].phase = "closing";
			m.cycle = "closing";
			m.transitionAt = s.activeMs + GAME_CONFIG$3.MEMORY_FLIP_MS;
		} else if (m.cycle === "closing") {
			for (const slot of m.selected) m.cards[slot].phase = "idle";
			m.selected = [];
			m.cycle = "idle";
		} else if (m.cycle === "matched") {
			for (const slot of m.selected) m.cards[slot].phase = "exiting";
			m.cycle = "exiting";
			m.transitionAt = s.activeMs + 260;
		} else if (m.cycle === "exiting") replacePair$3(s);
		else if (m.cycle === "replacing" || m.cycle === "shuffling") {
			for (const card of m.cards) if (card.phase === "replacing") card.phase = "idle";
			m.cycle = "idle";
		} else if (m.cycle === "shuffle-warning") shuffleClosed$3(s);
	}
	if (!safe$3(m) || m.peekUntil > s.activeMs || s.freezeMs > 0) return;
	while (s.scheduleIndex < s.plan.events.length && s.plan.events[s.scheduleIndex].at <= s.activeMs) {
		const event = s.plan.events[s.scheduleIndex++];
		if (event.kind === "double") {
			s.doubleUntil = s.activeMs + GAME_CONFIG$3.MEMORY_X2_DURATION_SECONDS * 1e3;
			emit$4(s, "powerup");
		}
		if (event.kind === "peek") {
			m.peekCharges++;
			emit$4(s, "powerup");
		}
		if (event.kind === "radar") {
			m.radarCharges++;
			emit$4(s, "powerup");
		}
	}
	if (m.shuffleIndex < s.plan.shuffles.length && s.activeMs >= s.plan.shuffles[m.shuffleIndex] && s.activeMs < 17e4 && s.doubleUntil <= s.activeMs) {
		m.cycle = "shuffle-warning";
		m.transitionAt = s.activeMs + 850;
		m.notice = "LIF SHUFFLE";
		m.noticeUntil = s.activeMs + 1450;
	}
}
//#endregion
//#region lib/gaming/versions/memory-v1/engine.ts
var vectors$1 = {
	up: {
		x: 0,
		y: -1
	},
	down: {
		x: 0,
		y: 1
	},
	left: {
		x: -1,
		y: 0
	},
	right: {
		x: 1,
		y: 0
	}
};
var opposites$1 = {
	up: "down",
	down: "up",
	left: "right",
	right: "left"
};
var same$1 = (a, b) => a.x === b.x && a.y === b.y;
function emit$4(s, type, value = 0, flavor = -1, p = {
	x: 0,
	y: 0
}) {
	s.events.push({
		id: s.nextId++,
		type,
		value,
		flavor,
		at: s.activeMs,
		...p
	});
	if (s.events.length > 128) s.events.splice(0, s.events.length - 128);
}
function createGame$4(game, seed) {
	const snake = [
		{
			x: 8,
			y: 10
		},
		{
			x: 7,
			y: 10
		},
		{
			x: 6,
			y: 10
		}
	];
	const s = {
		game,
		rng: seed,
		ms: 0,
		activeMs: 0,
		score: 0,
		nextId: 1,
		lane: 2,
		catcherX: 2,
		target: 0,
		items: [],
		snake,
		previousSnake: snake.map((c) => ({ ...c })),
		direction: "right",
		queued: null,
		tickMs: 0,
		spawnAt: 0,
		newIndex: 0,
		newSeen: [],
		bonusCount: 0,
		doubleUntil: 0,
		magnetUntil: 0,
		shield: false,
		boostMs: 0,
		freezeMs: 0,
		spotlight: null,
		ended: null,
		events: [],
		plan: createSessionPlan$3(game, seed),
		scheduleIndex: 0,
		pendingSpawns: [],
		memory: null,
		normalBag: [],
		normalPrevious: -1
	};
	if (game === "memory_lif") s.memory = createMemory$3(s);
	else runSchedule$1(s);
	return s;
}
function freeCell$1(s, kind) {
	const free = [];
	const reachable = /* @__PURE__ */ new Set();
	const enqueued = /* @__PURE__ */ new Set();
	const queue = [s.snake[0]];
	for (let cursor = 0; cursor < queue.length; cursor++) {
		const p = queue[cursor], key = `${p.x},${p.y}`;
		reachable.add(key);
		for (const vector of Object.values(vectors$1)) {
			const next = {
				x: p.x + vector.x,
				y: p.y + vector.y
			}, nextKey = `${next.x},${next.y}`;
			if (next.x < 0 || next.y < 0 || next.x >= GAME_CONFIG$3.BOARD_COLS || next.y >= GAME_CONFIG$3.BOARD_ROWS || enqueued.has(nextKey) || s.snake.slice(1).some((c) => same$1(c, next)) || s.items.some((i) => i.kind === "hazard" && same$1(i, next))) continue;
			enqueued.add(nextKey);
			queue.push(next);
		}
	}
	for (let y = 2; y < GAME_CONFIG$3.BOARD_ROWS - 2; y++) for (let x = 2; x < GAME_CONFIG$3.BOARD_COLS - 2; x++) {
		const p = {
			x,
			y
		}, distance = Math.abs(s.snake[0].x - x) + Math.abs(s.snake[0].y - y);
		if (!reachable.has(`${x},${y}`) || s.snake.some((c) => same$1(c, p)) || s.items.some((i) => Math.abs(i.x - x) <= 1 && Math.abs(i.y - y) <= 1) || distance < GAME_CONFIG$3.SNAKE_ITEM_MIN_DISTANCE || kind !== "hazard" && distance > GAME_CONFIG$3.SNAKE_ITEM_MAX_DISTANCE) continue;
		free.push(p);
	}
	return free.length ? free[Math.floor(random$3(s) * free.length)] : null;
}
function spawn$1(s, kind, flavor) {
	const cell = freeCell$1(s, kind);
	if (!cell) return false;
	s.items.push({
		...cell,
		id: s.nextId++,
		kind,
		flavor,
		born: s.activeMs,
		ttl: kind === "flavor" ? 3e4 : kind === "hazard" ? 12e3 : GAME_CONFIG$3.FLEETING_ITEM_DURATION_SECONDS * 1e3,
		lane: 0,
		speed: 0
	});
	return true;
}
function runSchedule$1(s) {
	while (s.scheduleIndex < s.plan.events.length && s.plan.events[s.scheduleIndex].at <= s.activeMs) s.pendingSpawns.push(s.plan.events[s.scheduleIndex++]);
	s.pendingSpawns = s.pendingSpawns.filter((event) => !spawn$1(s, event.kind, event.flavor));
}
function applyInput$4(s, input) {
	if (s.ended || s.freezeMs > 0) return false;
	if (s.game === "memory_lif") return memoryInput$3(s, input);
	if (input.direction && input.direction !== opposites$1[s.direction] && !s.queued) {
		s.queued = input.direction;
		return true;
	}
	return false;
}
function collect$1(s, item) {
	const multiplier = s.activeMs < s.doubleUntil || s.boostMs > 0 ? 2 : 1;
	if (item.kind === "boost") {
		s.boostMs = GAME_CONFIG$3.BOOST_DURATION_SECONDS * 1e3;
		emit$4(s, "boost", 0, -1, item);
		return;
	}
	if (item.kind === "hazard") {
		if (s.shield) {
			s.shield = false;
			emit$4(s, "powerup", 0, -1, item);
			return;
		}
		s.score = Math.max(0, s.score - GAME_CONFIG$3.COMPETITOR_PENALTY_POINTS);
		s.snake = s.snake.slice(0, Math.max(GAME_CONFIG$3.SNAKE_STARTING_LENGTH, s.snake.length - GAME_CONFIG$3.COMPETITOR_SEGMENT_DAMAGE));
		emit$4(s, "penalty", -GAME_CONFIG$3.COMPETITOR_PENALTY_POINTS, -1, item);
		return;
	}
	if (item.kind === "double" || item.kind === "magnet" || item.kind === "shield") {
		if (item.kind === "double") s.doubleUntil = s.activeMs + GAME_CONFIG$3.POWERUP_DURATION_SECONDS * 1e3;
		if (item.kind === "magnet") s.magnetUntil = s.activeMs + GAME_CONFIG$3.MAGNET_DURATION_SECONDS * 1e3;
		if (item.kind === "shield") s.shield = true;
		emit$4(s, "powerup", 0, -1, item);
		return;
	}
	if (item.kind === "logo") {
		const value = GAME_CONFIG$3.LIF_LOGO_POINTS * multiplier;
		s.score += value;
		emit$4(s, "logo", value, -1, item);
		return;
	}
	const isNew = item.flavor < 3, value = (isNew ? GAME_CONFIG$3.NEW_FLAVOR_POINTS : GAME_CONFIG$3.NORMAL_FLAVOR_POINTS) * multiplier;
	s.score += value;
	emit$4(s, isNew ? "new" : "normal", value, item.flavor, item);
	if (isNew && !s.newSeen.includes(item.flavor)) {
		s.newSeen.push(item.flavor);
		s.spotlight = item.flavor;
		s.freezeMs = GAME_CONFIG$3.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
	}
	s.snake.push({ ...s.snake[s.snake.length - 1] });
	if (s.snake.length >= GAME_CONFIG$3.SNAKE_SUPER_BONUS_LENGTH) {
		s.score += GAME_CONFIG$3.SNAKE_SUPER_BONUS_POINTS;
		s.bonusCount++;
		s.snake = s.snake.slice(0, GAME_CONFIG$3.SNAKE_STARTING_LENGTH);
		s.freezeMs = GAME_CONFIG$3.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
		s.spotlight = "super";
		emit$4(s, "super", GAME_CONFIG$3.SNAKE_SUPER_BONUS_POINTS, -1, item);
	}
}
function stepGame$4(s) {
	if (s.ended) return;
	s.ms += GAME_CONFIG$3.STEP_MS;
	if (s.freezeMs > 0) {
		s.freezeMs = Math.max(0, s.freezeMs - GAME_CONFIG$3.STEP_MS);
		if (!s.freezeMs) s.spotlight = null;
		return;
	}
	const speed = s.boostMs > 0 ? GAME_CONFIG$3.BOOST_SPEED_MULTIPLIER : 1;
	s.activeMs = Math.min(GAME_CONFIG$3.GAME_DURATION_SECONDS * 1e3, s.activeMs + GAME_CONFIG$3.STEP_MS * (s.boostMs > 0 ? GAME_CONFIG$3.BOOST_CLOCK_MULTIPLIER : 1));
	s.boostMs = Math.max(0, s.boostMs - GAME_CONFIG$3.STEP_MS);
	if (s.activeMs >= GAME_CONFIG$3.GAME_DURATION_SECONDS * 1e3) {
		s.ended = "time";
		emit$4(s, "complete");
		return;
	}
	if (s.game === "memory_lif") {
		stepMemory$3(s);
		return;
	}
	s.items = s.items.filter((i) => s.activeMs - i.born < i.ttl);
	const interval = GAME_CONFIG$3.SNAKE_TICK_MS / Math.pow(1 + GAME_CONFIG$3.SNAKE_SPEED_INCREASE_PER_SUPER_BONUS, s.bonusCount) / speed;
	s.tickMs += GAME_CONFIG$3.STEP_MS;
	if (s.tickMs >= interval) {
		s.tickMs -= interval;
		if (s.queued) {
			s.direction = s.queued;
			s.queued = null;
		}
		const vector = vectors$1[s.direction], head = {
			x: s.snake[0].x + vector.x,
			y: s.snake[0].y + vector.y
		};
		if (head.x < 0 || head.y < 0 || head.x >= GAME_CONFIG$3.BOARD_COLS || head.y >= GAME_CONFIG$3.BOARD_ROWS) s.ended = "wall";
		else if (s.snake.slice(0, -1).some((c) => same$1(c, head))) s.ended = "self";
		if (s.ended) {
			emit$4(s, "death");
			return;
		}
		s.previousSnake = s.snake.map((c) => ({ ...c }));
		s.snake = [head, ...s.snake.slice(0, -1)];
		const item = s.items.find((i) => same$1(i, head));
		if (item) {
			s.items = s.items.filter((i) => i.id !== item.id);
			collect$1(s, item);
		}
	}
	runSchedule$1(s);
	if (!s.items.some((item) => item.kind === "flavor")) {
		if (!s.normalBag.length) {
			s.normalBag = shuffled$3(s, Array.from({ length: 10 }, (_, i) => i + 3));
			if (s.normalBag[0] === s.normalPrevious) [s.normalBag[0], s.normalBag[1]] = [s.normalBag[1], s.normalBag[0]];
		}
		if (spawn$1(s, "flavor", s.normalBag[0])) s.normalPrevious = s.normalBag.shift();
	}
}
function replayGame$4(game, seed, inputs, untilMs, version = GAME_CONFIG$3.VERSION) {
	if (game === "catch" || version === "lif-games-20261002-v2") return replayGame$5(game === "catch" ? "catch" : "snake", seed, inputs, untilMs);
	const state = createGame$4(game, seed);
	let index = 0;
	for (let t = 0; t < untilMs && !state.ended; t += GAME_CONFIG$3.STEP_MS) {
		while (index < inputs.length && inputs[index].at <= state.ms) applyInput$4(state, inputs[index++]);
		stepGame$4(state);
	}
	return state;
}
//#endregion
//#region lib/gaming/versions/unified-v2/config.ts
var COMPETITION_RULES$2 = {
	NORMAL_POINTS: 50,
	NEW_POINTS: 300,
	LOGO_POINTS: 150,
	SUPER_ACTIONS: 6,
	SUPER_POINTS: 1e3,
	ERROR_RECOVERY_MS: 1600,
	X2_SECONDS: 10,
	DURATION_SECONDS: 180
};
var GAME_CONFIG$2 = {
	VERSION: "lif-games-20261007-unified-v2",
	COMPETITION_SUPER_BONUS_ACTIONS: COMPETITION_RULES$2.SUPER_ACTIONS,
	COMPETITION_SUPER_BONUS_POINTS: COMPETITION_RULES$2.SUPER_POINTS,
	COMPETITION_ERROR_RECOVERY_MS: COMPETITION_RULES$2.ERROR_RECOVERY_MS,
	RANDOMIZATION_MODE: "seeded_controlled",
	ENABLE_SESSION_SEED: true,
	ENABLE_DEBUG_SEED_REPLAY: true,
	MEMORY_BOARD_ROWS: 4,
	MEMORY_BOARD_COLS: 4,
	MEMORY_MATCH_NORMAL_POINTS: COMPETITION_RULES$2.NORMAL_POINTS,
	MEMORY_MATCH_NEW_FLAVOR_POINTS: COMPETITION_RULES$2.NEW_POINTS,
	MEMORY_LOGO_MATCH_POINTS: COMPETITION_RULES$2.LOGO_POINTS,
	MEMORY_MISMATCH_PENALTY: 0,
	MEMORY_SUPER_BONUS_MATCHES: COMPETITION_RULES$2.SUPER_ACTIONS,
	MEMORY_SUPER_BONUS_POINTS: COMPETITION_RULES$2.SUPER_POINTS,
	MEMORY_X2_SUPER_BONUS: false,
	MEMORY_PEEK_DURATION_SECONDS: 1,
	MEMORY_X2_DURATION_SECONDS: COMPETITION_RULES$2.X2_SECONDS,
	MEMORY_SHUFFLE_MIN_INTERVAL_SECONDS: 35,
	MEMORY_SHUFFLE_MAX_INTERVAL_SECONDS: 55,
	MEMORY_FLIP_MS: 360,
	MEMORY_RADAR_ENABLED: false,
	SNAKE_NORMAL_SPAWN_SECONDS: 12,
	SESSION_PLAN_MAX_RETRIES: 64,
	SNAKE_ITEM_MIN_DISTANCE: 6,
	SNAKE_ITEM_MAX_DISTANCE: 9,
	GAME_DURATION_SECONDS: COMPETITION_RULES$2.DURATION_SECONDS,
	DAILY_ATTEMPTS: 3,
	TIMEZONE: "America/Costa_Rica",
	CURTAIN_OPEN_DURATION_MS: 4250,
	COUNTDOWN_STEP_MS: 1e3,
	NORMAL_FLAVOR_POINTS: COMPETITION_RULES$2.NORMAL_POINTS,
	LIF_LOGO_POINTS: COMPETITION_RULES$2.LOGO_POINTS,
	NEW_FLAVOR_POINTS: COMPETITION_RULES$2.NEW_POINTS,
	COMPETITOR_PENALTY_POINTS: 0,
	COMPETITOR_SEGMENT_DAMAGE: 2,
	SNAKE_STARTING_LENGTH: 3,
	SNAKE_SUPER_BONUS_LENGTH: 9,
	SNAKE_SUPER_BONUS_POINTS: COMPETITION_RULES$2.SUPER_POINTS,
	SNAKE_SPEED_INCREASE_PER_SUPER_BONUS: .06,
	SNAKE_TICK_MS: 190,
	BOARD_COLS: 30,
	BOARD_ROWS: 20,
	POWERUP_DURATION_SECONDS: COMPETITION_RULES$2.X2_SECONDS,
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
	GAME_OVER_JINGLE_MODE: "fixed",
	RANKING_PERIOD: "campaign",
	RANKING_START: "2026-10-01",
	RANKING_END: "2027-12-31",
	PLAY_CTA: "JUGAR"
};
//#endregion
//#region lib/gaming/versions/unified-v2/session-random.ts
function random$2(state) {
	state.rng = state.rng + 1831565813 | 0;
	let t = Math.imul(state.rng ^ state.rng >>> 15, 1 | state.rng);
	t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
	return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function stream$2(seed, label) {
	let hash = seed >>> 0;
	for (const character of label) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
	return { rng: hash >>> 0 };
}
function between$2(state, min, max) {
	return min + Math.floor(random$2(state) * (max - min + 1));
}
function shuffled$2(state, values) {
	const result = [...values];
	for (let i = result.length - 1; i > 0; i--) {
		const j = between$2(state, 0, i);
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}
function makePlan$2(game, seed) {
	const rng = stream$2(seed, `${GAME_CONFIG$2.VERSION}:schedule:${game}`);
	const events = [];
	const shuffles = [];
	if (game === "snake") {
		const hazards = shuffled$2(rng, [
			0,
			0,
			0,
			1,
			1,
			1
		]);
		for (let window = 0; window < 6; window++) events.push({
			at: window * 3e4 + between$2(rng, 14e3, 22e3),
			kind: "hazard",
			flavor: hazards[window]
		});
	}
	for (let window = 0; window < 3; window++) {
		shuffled$2(rng, ["double", game === "snake" ? "shield" : "peek"]).forEach((kind, i) => events.push({
			at: window * 6e4 + 12e3 + i * 22e3 + between$2(rng, -3500, 3500),
			kind,
			flavor: -1
		}));
		if (game === "memory_lif" && GAME_CONFIG$2.MEMORY_RADAR_ENABLED) events.push({
			at: window * 6e4 + 46e3 + between$2(rng, -3e3, 3e3),
			kind: "radar",
			flavor: -1
		});
	}
	if (game === "memory_lif") {
		let at = 0;
		while (true) {
			at += between$2(rng, GAME_CONFIG$2.MEMORY_SHUFFLE_MIN_INTERVAL_SECONDS * 1e3, GAME_CONFIG$2.MEMORY_SHUFFLE_MAX_INTERVAL_SECONDS * 1e3);
			if (at >= 17e4) break;
			shuffles.push(at);
		}
	}
	events.sort((a, b) => a.at - b.at);
	return {
		game,
		events,
		shuffles
	};
}
function inspectPlan$2(plan) {
	const counts = {};
	for (const event of plan.events) counts[event.kind] = (counts[event.kind] ?? 0) + 1;
	return {
		counts,
		normal: plan.events.filter((e) => e.kind === "flavor" && e.flavor >= 3).length,
		newFlavors: plan.events.filter((e) => e.kind === "flavor" && e.flavor < 3).map((e) => e.flavor),
		basePotential: plan.events.reduce((sum, e) => sum + (e.kind === "logo" ? GAME_CONFIG$2.LIF_LOGO_POINTS : e.kind === "flavor" ? e.flavor < 3 ? GAME_CONFIG$2.NEW_FLAVOR_POINTS : GAME_CONFIG$2.NORMAL_FLAVOR_POINTS : 0), 0),
		timedPotential: plan.events.reduce((sum, e) => {
			return sum + (e.kind === "logo" ? GAME_CONFIG$2.LIF_LOGO_POINTS : e.kind === "flavor" ? e.flavor < 3 ? GAME_CONFIG$2.NEW_FLAVOR_POINTS : GAME_CONFIG$2.NORMAL_FLAVOR_POINTS : 0) * (plan.events.some((b) => (b.kind === "double" || b.kind === "boost") && b.at <= e.at && b.at + (b.kind === "double" ? GAME_CONFIG$2.POWERUP_DURATION_SECONDS : GAME_CONFIG$2.BOOST_DURATION_SECONDS) * 1e3 > e.at) ? 2 : 1);
		}, 0)
	};
}
function validPlan$2(plan) {
	const stats = inspectPlan$2(plan);
	if (plan.events.some((e) => e.at < 0 || e.at >= 18e4)) return false;
	if (plan.game === "snake") return stats.counts.double === 3 && stats.counts.shield === 3 && stats.counts.hazard === 6 && stats.basePotential === 0;
	return stats.counts.double === 3 && stats.counts.peek === 3 && plan.shuffles.every((at, i) => {
		const gap = at - (plan.shuffles[i - 1] ?? 0);
		return gap >= 35e3 && gap <= 55e3 && at < 17e4;
	});
}
function createSessionPlan$2(game, seed) {
	for (let retry = 0; retry < GAME_CONFIG$2.SESSION_PLAN_MAX_RETRIES; retry++) {
		const plan = makePlan$2(game, seed + retry * 2654435769 >>> 0);
		if (validPlan$2(plan)) return plan;
	}
	throw new Error("Session plan failed fairness constraints");
}
function memoryPairBag$2(rng, stage, initial = false, previous = -2) {
	const normal = shuffled$2(rng, Array.from({ length: stage === 0 ? 6 : stage === 1 ? 8 : 10 }, (_, i) => i + 3)).slice(0, 4);
	const fresh = initial ? [
		0,
		1,
		2
	] : [
		between$2(rng, 0, 2),
		between$2(rng, 0, 2),
		between$2(rng, 0, 2)
	];
	for (let retry = 0; retry < 64; retry++) {
		const bag = shuffled$2(rng, [
			...normal,
			...fresh,
			-1
		]);
		if (bag[0] === previous || bag.some((f, i) => i > 0 && f === bag[i - 1]) || bag.some((f, i) => i >= 2 && f >= 0 && f < 3 && bag[i - 1] >= 0 && bag[i - 1] < 3 && bag[i - 2] >= 0 && bag[i - 2] < 3)) continue;
		return bag;
	}
	const freshOrder = shuffled$2(rng, fresh);
	const rest = shuffled$2(rng, [...normal, -1]);
	const bag = [
		rest[0],
		freshOrder[0],
		rest[1],
		freshOrder[1],
		rest[2],
		freshOrder[2],
		rest[3],
		rest[4]
	];
	if (bag[0] === previous) [bag[0], bag[7]] = [bag[7], bag[0]];
	return bag;
}
//#endregion
//#region lib/gaming/versions/unified-v2/memory-engine.ts
function card$2(s, flavor, phase = "idle") {
	return {
		id: s.nextId++,
		flavor,
		phase,
		until: s.activeMs + (phase === "replacing" ? 320 : 0)
	};
}
function createMemory$2(s) {
	return {
		cards: shuffled$2(s, memoryPairBag$2(s, 0, true).flatMap((flavor) => [card$2(s, flavor), card$2(s, flavor)])),
		selected: [],
		evaluationAt: 0,
		transitionAt: 0,
		cycle: "idle",
		bag: [],
		lastFlavor: -2,
		matches: 0,
		superProgress: 0,
		pendingSuper: false,
		peekCharges: 1,
		radarCharges: 0,
		peekUntil: 0,
		radarUntil: 0,
		radarSlots: [],
		shuffleIndex: 0,
		notice: "",
		noticeUntil: 0,
		stage: 0
	};
}
var safe$2 = (m) => m.cycle === "idle" && m.selected.length === 0 && m.cards.every((c) => c.phase === "idle");
function memoryInput$2(s, input) {
	const m = s.memory;
	if (m.cycle !== "idle" || m.peekUntil > s.activeMs) return false;
	if (input.action === "peek") {
		if (!safe$2(m) || m.peekCharges < 1) return false;
		m.peekCharges--;
		m.peekUntil = s.activeMs + GAME_CONFIG$2.MEMORY_PEEK_DURATION_SECONDS * 1e3;
		emit$3(s, "peek");
		return true;
	}
	if (input.action === "radar") {
		if (!GAME_CONFIG$2.MEMORY_RADAR_ENABLED || !safe$2(m) || m.radarCharges < 1) return false;
		m.radarCharges--;
		m.radarUntil = s.activeMs + 3e3;
		m.radarSlots = shuffled$2(s, [...new Set(m.cards.map((c) => c.flavor))]).slice(0, 3).map((flavor) => shuffled$2(s, m.cards.map((c, i) => c.flavor === flavor ? i : -1).filter((i) => i >= 0))[0]);
		emit$3(s, "radar");
		return true;
	}
	const slot = input.slot;
	if (!Number.isInteger(slot) || slot < 0 || slot >= m.cards.length || m.selected.length >= 2) return false;
	const selected = m.cards[slot];
	if (selected.phase !== "idle" || m.selected.includes(slot)) return false;
	selected.phase = "flipping";
	selected.until = s.activeMs + GAME_CONFIG$2.MEMORY_FLIP_MS;
	m.selected.push(slot);
	emit$3(s, "flip", 0, -1, {
		x: slot % 4,
		y: Math.floor(slot / 4)
	});
	if (m.selected.length === 2) {
		m.cycle = "evaluating";
		m.evaluationAt = selected.until + 80;
	}
	return true;
}
function startSuper$2(s) {
	const m = s.memory;
	m.pendingSuper = false;
	m.superProgress = 0;
	s.bonusCount++;
	const points = GAME_CONFIG$2.COMPETITION_SUPER_BONUS_POINTS * (GAME_CONFIG$2.MEMORY_X2_SUPER_BONUS && s.doubleUntil > s.activeMs ? 2 : 1);
	s.score += points;
	s.spotlight = "super";
	s.freezeMs = GAME_CONFIG$2.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
	emit$3(s, "super", points);
}
function evaluate$2(s) {
	const m = s.memory, [a, b] = m.selected.map((i) => m.cards[i]);
	if (a.flavor !== b.flavor) {
		a.phase = b.phase = "mismatch";
		m.cycle = "mismatch";
		m.transitionAt = s.activeMs + [
			800,
			700,
			600
		][m.stage];
		emit$3(s, "mismatch");
		return;
	}
	a.phase = b.phase = "matched";
	m.cycle = "matched";
	m.transitionAt = s.activeMs + 320;
	m.notice = "Nueva pareja: mezcla breve";
	m.noticeUntil = s.activeMs + 1600;
	m.matches++;
	m.superProgress++;
	const flavor = a.flavor, isNew = flavor >= 0 && flavor < 3;
	const points = (flavor === -1 ? GAME_CONFIG$2.MEMORY_LOGO_MATCH_POINTS : isNew ? GAME_CONFIG$2.MEMORY_MATCH_NEW_FLAVOR_POINTS : GAME_CONFIG$2.MEMORY_MATCH_NORMAL_POINTS) * (s.doubleUntil > s.activeMs ? 2 : 1);
	s.score += points;
	emit$3(s, flavor === -1 ? "logo" : isNew ? "new" : "normal", points, flavor, {
		x: m.selected[0] % 4,
		y: Math.floor(m.selected[0] / 4)
	});
	if (isNew) {
		if (!s.newSeen.includes(flavor)) s.newSeen.push(flavor);
		s.spotlight = flavor;
		s.freezeMs = GAME_CONFIG$2.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
	}
	if (m.superProgress >= GAME_CONFIG$2.COMPETITION_SUPER_BONUS_ACTIONS) {
		m.pendingSuper = true;
		if (!s.freezeMs) startSuper$2(s);
	}
}
function replacePair$2(s) {
	const m = s.memory;
	if (!m.bag.length) m.bag = memoryPairBag$2(s, m.stage, false, m.lastFlavor);
	let flavor = m.bag.shift();
	const justMatched = m.cards[m.selected[0]].flavor;
	if (flavor === justMatched) {
		const alternative = m.bag.findIndex((f) => f !== justMatched && f !== m.lastFlavor);
		if (alternative >= 0) [flavor, m.bag[alternative]] = [m.bag[alternative], flavor];
	}
	m.lastFlavor = flavor;
	for (const slot of m.selected) m.cards[slot] = card$2(s, flavor, "replacing");
	const closed = shuffled$2(s, m.cards.map((c, i) => c.phase === "idle" ? i : -1).filter((i) => i >= 0)).slice(0, 4);
	const slots = [...m.selected, ...closed];
	const values = shuffled$2(s, slots.map((i) => m.cards[i]));
	slots.forEach((slot, i) => {
		m.cards[slot] = values[i];
		m.cards[slot].phase = "replacing";
		m.cards[slot].until = s.activeMs + 360;
	});
	m.noticeUntil = s.activeMs + 700;
	m.selected = [];
	m.cycle = "replacing";
	m.transitionAt = s.activeMs + 360;
}
function shuffleClosed$2(s) {
	const m = s.memory;
	const slots = m.cards.map((c, i) => c.phase === "idle" ? i : -1).filter((i) => i >= 0);
	const values = slots.map((i) => m.cards[i]);
	const traversal = shuffled$2(s, slots), shift = 1 + Math.floor(shuffled$2(s, slots)[0] / slots.length * (slots.length - 1));
	traversal.forEach((slot, i) => {
		m.cards[slot] = values[slots.indexOf(traversal[(i + shift) % slots.length])];
		m.cards[slot].phase = "replacing";
	});
	m.cycle = "shuffling";
	m.transitionAt = s.activeMs + 520;
	m.shuffleIndex++;
	emit$3(s, "shuffle");
}
function stepMemory$2(s) {
	const m = s.memory;
	m.stage = Math.min(2, Math.floor(s.activeMs / 6e4));
	if (m.pendingSuper) {
		startSuper$2(s);
		return;
	}
	for (const card of m.cards) if (card.phase === "flipping" && s.activeMs >= card.until) card.phase = "revealed";
	if (m.cycle === "evaluating" && s.activeMs >= m.evaluationAt) evaluate$2(s);
	else if (s.activeMs >= m.transitionAt) {
		if (m.cycle === "mismatch") {
			for (const slot of m.selected) m.cards[slot].phase = "closing";
			m.cycle = "closing";
			m.transitionAt = s.activeMs + GAME_CONFIG$2.MEMORY_FLIP_MS;
		} else if (m.cycle === "closing") {
			for (const slot of m.selected) m.cards[slot].phase = "idle";
			m.selected = [];
			m.cycle = "idle";
		} else if (m.cycle === "matched") {
			for (const slot of m.selected) m.cards[slot].phase = "exiting";
			m.cycle = "exiting";
			m.transitionAt = s.activeMs + 260;
		} else if (m.cycle === "exiting") replacePair$2(s);
		else if (m.cycle === "replacing" || m.cycle === "shuffling") {
			for (const card of m.cards) if (card.phase === "replacing") card.phase = "idle";
			m.cycle = "idle";
		} else if (m.cycle === "shuffle-warning") shuffleClosed$2(s);
	}
	if (!safe$2(m) || m.peekUntil > s.activeMs || s.freezeMs > 0) return;
	while (s.scheduleIndex < s.plan.events.length && s.plan.events[s.scheduleIndex].at <= s.activeMs) {
		const event = s.plan.events[s.scheduleIndex++];
		if (event.kind === "double") {
			s.doubleUntil = s.activeMs + GAME_CONFIG$2.MEMORY_X2_DURATION_SECONDS * 1e3;
			emit$3(s, "powerup");
		}
		if (event.kind === "peek") {
			m.peekCharges++;
			emit$3(s, "powerup");
		}
		if (event.kind === "radar") {
			m.radarCharges++;
			emit$3(s, "powerup");
		}
	}
	if (m.shuffleIndex < s.plan.shuffles.length && s.activeMs >= s.plan.shuffles[m.shuffleIndex] && s.activeMs < 17e4 && s.doubleUntil <= s.activeMs) {
		m.cycle = "shuffle-warning";
		m.transitionAt = s.activeMs + 850;
		m.notice = "LIF SHUFFLE";
		m.noticeUntil = s.activeMs + 1450;
	}
}
//#endregion
//#region lib/gaming/versions/unified-v2/engine.ts
var vectors = {
	up: {
		x: 0,
		y: -1
	},
	down: {
		x: 0,
		y: 1
	},
	left: {
		x: -1,
		y: 0
	},
	right: {
		x: 1,
		y: 0
	}
};
var opposites = {
	up: "down",
	down: "up",
	left: "right",
	right: "left"
};
var same = (a, b) => a.x === b.x && a.y === b.y;
function emit$3(s, type, value = 0, flavor = -1, p = {
	x: 0,
	y: 0
}) {
	s.events.push({
		id: s.nextId++,
		type,
		value,
		flavor,
		at: s.activeMs,
		...p
	});
	if (s.events.length > 128) s.events.splice(0, s.events.length - 128);
}
function createGame$3(game, seed) {
	const snake = [
		{
			x: 8,
			y: 10
		},
		{
			x: 7,
			y: 10
		},
		{
			x: 6,
			y: 10
		}
	];
	const s = {
		game,
		rng: seed,
		ms: 0,
		activeMs: 0,
		score: 0,
		nextId: 1,
		lane: 2,
		catcherX: 2,
		target: 0,
		items: [],
		snake,
		previousSnake: snake.map((c) => ({ ...c })),
		direction: "right",
		queued: null,
		tickMs: 0,
		spawnAt: 0,
		newIndex: 0,
		newSeen: [],
		bonusCount: 0,
		doubleUntil: 0,
		magnetUntil: 0,
		shield: false,
		boostMs: 0,
		freezeMs: 0,
		spotlight: null,
		ended: null,
		events: [],
		plan: createSessionPlan$2(game, seed),
		scheduleIndex: 0,
		pendingSpawns: [],
		memory: null,
		normalBag: [],
		normalPrevious: -1,
		competitionProgress: 0,
		recoveryMs: 0,
		pendingSuper: false
	};
	if (game === "memory_lif") s.memory = createMemory$2(s);
	else {
		s.shield = true;
		replenishSnake(s, true);
		runSchedule(s);
	}
	return s;
}
function freeCell(s, kind) {
	const free = [];
	const reachable = /* @__PURE__ */ new Set();
	const enqueued = /* @__PURE__ */ new Set();
	const queue = [s.snake[0]];
	for (let cursor = 0; cursor < queue.length; cursor++) {
		const p = queue[cursor], key = `${p.x},${p.y}`;
		reachable.add(key);
		for (const vector of Object.values(vectors)) {
			const next = {
				x: p.x + vector.x,
				y: p.y + vector.y
			}, nextKey = `${next.x},${next.y}`;
			if (next.x < 0 || next.y < 0 || next.x >= GAME_CONFIG$2.BOARD_COLS || next.y >= GAME_CONFIG$2.BOARD_ROWS || enqueued.has(nextKey) || s.snake.slice(1).some((c) => same(c, next)) || s.items.some((i) => i.kind === "hazard" && same(i, next))) continue;
			enqueued.add(nextKey);
			queue.push(next);
		}
	}
	for (let y = 2; y < GAME_CONFIG$2.BOARD_ROWS - 2; y++) for (let x = 2; x < GAME_CONFIG$2.BOARD_COLS - 2; x++) {
		const p = {
			x,
			y
		}, distance = Math.abs(s.snake[0].x - x) + Math.abs(s.snake[0].y - y);
		if (!reachable.has(`${x},${y}`) || s.snake.some((c) => same(c, p)) || s.items.some((i) => Math.abs(i.x - x) <= 1 && Math.abs(i.y - y) <= 1) || distance < GAME_CONFIG$2.SNAKE_ITEM_MIN_DISTANCE || kind !== "hazard" && distance > GAME_CONFIG$2.SNAKE_ITEM_MAX_DISTANCE) continue;
		free.push(p);
	}
	return free.length ? free[Math.floor(random$2(s) * free.length)] : null;
}
function spawn(s, kind, flavor) {
	const cell = freeCell(s, kind);
	if (!cell) return false;
	s.items.push({
		...cell,
		id: s.nextId++,
		kind,
		flavor,
		born: s.activeMs,
		ttl: kind === "flavor" || kind === "logo" ? GAME_CONFIG$2.GAME_DURATION_SECONDS * 1e3 : kind === "hazard" ? 12e3 : GAME_CONFIG$2.FLEETING_ITEM_DURATION_SECONDS * 1e3,
		lane: 0,
		speed: 0
	});
	return true;
}
function runSchedule(s) {
	while (s.scheduleIndex < s.plan.events.length && s.plan.events[s.scheduleIndex].at <= s.activeMs) s.pendingSpawns.push(s.plan.events[s.scheduleIndex++]);
	s.pendingSpawns = s.pendingSpawns.filter((event) => {
		if (event.kind === "double") {
			s.doubleUntil = s.activeMs + GAME_CONFIG$2.MEMORY_X2_DURATION_SECONDS * 1e3;
			emit$3(s, "powerup");
			return false;
		}
		if (event.kind === "shield") {
			s.shield = true;
			emit$3(s, "powerup");
			return false;
		}
		return !spawn(s, event.kind, event.flavor);
	});
}
function applyInput$3(s, input) {
	if (s.ended || s.freezeMs > 0 || s.recoveryMs > 0) return false;
	if (s.game === "memory_lif") return memoryInput$2(s, input);
	if (input.direction && input.direction !== opposites[s.direction] && !s.queued) {
		s.queued = input.direction;
		return true;
	}
	return false;
}
function collect(s, item) {
	const multiplier = s.activeMs < s.doubleUntil || s.boostMs > 0 ? 2 : 1;
	if (item.kind === "boost") {
		s.boostMs = GAME_CONFIG$2.BOOST_DURATION_SECONDS * 1e3;
		emit$3(s, "boost", 0, -1, item);
		return;
	}
	if (item.kind === "hazard") {
		if (s.shield) {
			s.shield = false;
			emit$3(s, "powerup", 0, -1, item);
			return;
		}
		s.snake = s.snake.slice(0, Math.max(GAME_CONFIG$2.SNAKE_STARTING_LENGTH, s.snake.length - GAME_CONFIG$2.COMPETITOR_SEGMENT_DAMAGE));
		s.recoveryMs = GAME_CONFIG$2.COMPETITION_ERROR_RECOVERY_MS;
		emit$3(s, "penalty", 0, -1, item);
		return;
	}
	if (item.kind === "double" || item.kind === "magnet" || item.kind === "shield") {
		if (item.kind === "double") s.doubleUntil = s.activeMs + GAME_CONFIG$2.POWERUP_DURATION_SECONDS * 1e3;
		if (item.kind === "magnet") s.magnetUntil = s.activeMs + GAME_CONFIG$2.MAGNET_DURATION_SECONDS * 1e3;
		if (item.kind === "shield") s.shield = true;
		emit$3(s, "powerup", 0, -1, item);
		return;
	}
	if (item.kind === "logo") {
		const value = GAME_CONFIG$2.LIF_LOGO_POINTS * multiplier;
		s.score += value;
		emit$3(s, "logo", value, -1, item);
		advanceSnakeBonus(s, item);
		return;
	}
	const isNew = item.flavor < 3, value = (isNew ? GAME_CONFIG$2.NEW_FLAVOR_POINTS : GAME_CONFIG$2.NORMAL_FLAVOR_POINTS) * multiplier;
	s.score += value;
	emit$3(s, isNew ? "new" : "normal", value, item.flavor, item);
	if (isNew) {
		if (!s.newSeen.includes(item.flavor)) s.newSeen.push(item.flavor);
		s.spotlight = item.flavor;
		s.freezeMs = GAME_CONFIG$2.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
	}
	s.snake.push({ ...s.snake[s.snake.length - 1] });
	advanceSnakeBonus(s, item);
}
function advanceSnakeBonus(s, item) {
	s.competitionProgress++;
	if (s.competitionProgress >= GAME_CONFIG$2.COMPETITION_SUPER_BONUS_ACTIONS) {
		s.pendingSuper = true;
		if (!s.freezeMs) startSnakeSuper(s, item);
	}
}
function startSnakeSuper(s, item = s.snake[0]) {
	s.pendingSuper = false;
	s.competitionProgress = 0;
	s.score += GAME_CONFIG$2.COMPETITION_SUPER_BONUS_POINTS;
	s.bonusCount++;
	s.snake = s.snake.slice(0, GAME_CONFIG$2.SNAKE_STARTING_LENGTH);
	s.freezeMs = GAME_CONFIG$2.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
	s.spotlight = "super";
	emit$3(s, "super", GAME_CONFIG$2.COMPETITION_SUPER_BONUS_POINTS, -1, item);
}
function replenishSnake(s, initial = false) {
	if (s.items.some((item) => item.kind === "flavor" || item.kind === "logo")) return;
	if (!s.normalBag.length) s.normalBag = memoryPairBag$2(s, Math.min(2, Math.floor(s.activeMs / 6e4)), initial, s.normalPrevious);
	const flavor = s.normalBag[0];
	if (spawn(s, flavor < 0 ? "logo" : "flavor", flavor)) s.normalPrevious = s.normalBag.shift();
}
function recoverSnake(s) {
	if (s.shield) {
		s.shield = false;
		emit$3(s, "powerup");
	} else {
		s.recoveryMs = GAME_CONFIG$2.COMPETITION_ERROR_RECOVERY_MS;
		emit$3(s, "penalty");
	}
	s.snake = [
		{
			x: 8,
			y: 10
		},
		{
			x: 7,
			y: 10
		},
		{
			x: 6,
			y: 10
		}
	];
	s.previousSnake = s.snake.map((cell) => ({ ...cell }));
	s.direction = "right";
	s.queued = null;
	s.tickMs = 0;
	s.items = s.items.filter((item) => {
		const nearby = s.snake.some((cell) => Math.abs(cell.x - item.x) + Math.abs(cell.y - item.y) < 3);
		if (nearby && (item.kind === "flavor" || item.kind === "logo")) s.normalBag.unshift(item.flavor);
		return !nearby;
	});
}
function stepGame$3(s) {
	if (s.ended) return;
	s.ms += GAME_CONFIG$2.STEP_MS;
	if (s.freezeMs > 0) {
		s.freezeMs = Math.max(0, s.freezeMs - GAME_CONFIG$2.STEP_MS);
		if (!s.freezeMs) s.spotlight = null;
		return;
	}
	if (s.game === "snake" && s.pendingSuper) {
		startSnakeSuper(s);
		return;
	}
	const speed = s.boostMs > 0 ? GAME_CONFIG$2.BOOST_SPEED_MULTIPLIER : 1;
	s.activeMs = Math.min(GAME_CONFIG$2.GAME_DURATION_SECONDS * 1e3, s.activeMs + GAME_CONFIG$2.STEP_MS * (s.boostMs > 0 ? GAME_CONFIG$2.BOOST_CLOCK_MULTIPLIER : 1));
	s.boostMs = Math.max(0, s.boostMs - GAME_CONFIG$2.STEP_MS);
	if (s.activeMs >= GAME_CONFIG$2.GAME_DURATION_SECONDS * 1e3) {
		s.ended = "time";
		emit$3(s, "complete");
		return;
	}
	if (s.game === "memory_lif") {
		stepMemory$2(s);
		return;
	}
	if (s.recoveryMs > 0) {
		s.recoveryMs = Math.max(0, s.recoveryMs - GAME_CONFIG$2.STEP_MS);
		return;
	}
	s.items = s.items.filter((i) => s.activeMs - i.born < i.ttl);
	const interval = GAME_CONFIG$2.SNAKE_TICK_MS / (1 + Math.min(2, Math.floor(s.activeMs / 6e4)) * .06) / speed;
	s.tickMs += GAME_CONFIG$2.STEP_MS;
	if (s.tickMs >= interval) {
		s.tickMs -= interval;
		if (s.queued) {
			s.direction = s.queued;
			s.queued = null;
		}
		const vector = vectors[s.direction], head = {
			x: s.snake[0].x + vector.x,
			y: s.snake[0].y + vector.y
		};
		if (head.x < 0 || head.y < 0 || head.x >= GAME_CONFIG$2.BOARD_COLS || head.y >= GAME_CONFIG$2.BOARD_ROWS || s.snake.slice(0, -1).some((c) => same(c, head))) {
			recoverSnake(s);
			return;
		}
		s.previousSnake = s.snake.map((c) => ({ ...c }));
		s.snake = [head, ...s.snake.slice(0, -1)];
		const item = s.items.find((i) => same(i, head));
		if (item) {
			s.items = s.items.filter((i) => i.id !== item.id);
			collect(s, item);
		}
	}
	runSchedule(s);
	replenishSnake(s);
}
function replayGame$3(game, seed, inputs, untilMs, version = GAME_CONFIG$2.VERSION) {
	if (version === "lif-games-20261007-memory-v1" && game !== "catch") return replayGame$4(game, seed, inputs, untilMs);
	if (game === "catch" || version === "lif-games-20261002-v2") return replayGame$5(game === "catch" ? "catch" : "snake", seed, inputs, untilMs);
	const state = createGame$3(game, seed);
	let index = 0;
	for (let t = 0; t < untilMs && !state.ended; t += GAME_CONFIG$2.STEP_MS) {
		while (index < inputs.length && inputs[index].at <= state.ms) applyInput$3(state, inputs[index++]);
		stepGame$3(state);
	}
	return state;
}
//#endregion
//#region lib/gaming/versions/restored-v3/config.ts
var COMPETITION_RULES$1 = {
	NORMAL_POINTS: 50,
	NEW_POINTS: 300,
	LOGO_POINTS: 150,
	SUPER_ACTIONS: 6,
	SUPER_POINTS: 1e3,
	X2_SECONDS: 10,
	DURATION_SECONDS: 180
};
var GAME_CONFIG$1 = {
	VERSION: "lif-games-20261007-restored-v3",
	RANDOMIZATION_MODE: "seeded_controlled",
	ENABLE_SESSION_SEED: true,
	ENABLE_DEBUG_SEED_REPLAY: true,
	MEMORY_BOARD_ROWS: 4,
	MEMORY_BOARD_COLS: 4,
	MEMORY_MATCH_NORMAL_POINTS: COMPETITION_RULES$1.NORMAL_POINTS,
	MEMORY_MATCH_NEW_FLAVOR_POINTS: COMPETITION_RULES$1.NEW_POINTS,
	MEMORY_LOGO_MATCH_POINTS: COMPETITION_RULES$1.LOGO_POINTS,
	MEMORY_MISMATCH_PENALTY: 20,
	MEMORY_FREE_MISMATCHES_PER_STREAK: 1,
	MEMORY_MAX_ERROR_STREAK: 10,
	MEMORY_SUPER_BONUS_MATCHES: COMPETITION_RULES$1.SUPER_ACTIONS,
	MEMORY_SUPER_BONUS_POINTS: COMPETITION_RULES$1.SUPER_POINTS,
	MEMORY_X2_SUPER_BONUS: false,
	MEMORY_PEEK_DURATION_SECONDS: 1,
	MEMORY_X2_DURATION_SECONDS: COMPETITION_RULES$1.X2_SECONDS,
	MEMORY_SHUFFLE_MIN_INTERVAL_SECONDS: 35,
	MEMORY_SHUFFLE_MAX_INTERVAL_SECONDS: 55,
	MEMORY_FLIP_MS: 360,
	MEMORY_RADAR_ENABLED: false,
	SESSION_PLAN_MAX_RETRIES: 64,
	GAME_DURATION_SECONDS: COMPETITION_RULES$1.DURATION_SECONDS,
	DAILY_ATTEMPTS: 3,
	TIMEZONE: "America/Costa_Rica",
	CURTAIN_OPEN_DURATION_MS: 4250,
	COUNTDOWN_STEP_MS: 1e3,
	NORMAL_FLAVOR_POINTS: COMPETITION_RULES$1.NORMAL_POINTS,
	LIF_LOGO_POINTS: COMPETITION_RULES$1.LOGO_POINTS,
	NEW_FLAVOR_POINTS: COMPETITION_RULES$1.NEW_POINTS,
	COMPETITOR_PENALTY_POINTS: LEGACY_CONFIG.COMPETITOR_PENALTY_POINTS,
	COMPETITOR_SEGMENT_DAMAGE: 2,
	SNAKE_STARTING_LENGTH: 3,
	SNAKE_SUPER_BONUS_LENGTH: LEGACY_CONFIG.SNAKE_SUPER_BONUS_LENGTH,
	SNAKE_SUPER_BONUS_POINTS: COMPETITION_RULES$1.SUPER_POINTS,
	SNAKE_SPEED_INCREASE_PER_SUPER_BONUS: .06,
	SNAKE_TICK_MS: 190,
	BOARD_COLS: 30,
	BOARD_ROWS: 20,
	POWERUP_DURATION_SECONDS: COMPETITION_RULES$1.X2_SECONDS,
	BOOST_DURATION_SECONDS: 7,
	BOOST_SPEED_MULTIPLIER: 1.4,
	BOOST_CLOCK_MULTIPLIER: LEGACY_CONFIG.BOOST_CLOCK_MULTIPLIER,
	MAGNET_DURATION_SECONDS: 7,
	FLEETING_ITEM_DURATION_SECONDS: 4,
	NEW_FLAVOR_SPOTLIGHT_SECONDS: 1.75,
	LEADERBOARD_SIZE: 20,
	LEADERBOARD_MAX_SIZE: 20,
	STEP_MS: 20,
	SHOW_COLLISION_BOXES: false,
	GAME_OVER_JINGLE_MODE: "fixed",
	RANKING_PERIOD: "campaign",
	RANKING_START: "2026-10-01",
	RANKING_END: "2027-12-31",
	PLAY_CTA: "JUGAR"
};
//#endregion
//#region lib/gaming/versions/restored-v3/session-random.ts
function random$1(state) {
	state.rng = state.rng + 1831565813 | 0;
	let t = Math.imul(state.rng ^ state.rng >>> 15, 1 | state.rng);
	t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
	return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function stream$1(seed, label) {
	let hash = seed >>> 0;
	for (const character of label) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
	return { rng: hash >>> 0 };
}
function between$1(state, min, max) {
	return min + Math.floor(random$1(state) * (max - min + 1));
}
function shuffled$1(state, values) {
	const result = [...values];
	for (let i = result.length - 1; i > 0; i--) {
		const j = between$1(state, 0, i);
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}
function makePlan$1(game, seed) {
	const rng = stream$1(seed, `${GAME_CONFIG$1.VERSION}:schedule:${game}`);
	const events = [];
	const shuffles = [];
	if (game === "snake") {
		const hazards = shuffled$1(rng, [
			0,
			0,
			0,
			1,
			1,
			1
		]);
		for (let window = 0; window < 6; window++) events.push({
			at: window * 3e4 + between$1(rng, 14e3, 22e3),
			kind: "hazard",
			flavor: hazards[window]
		});
	}
	for (let window = 0; window < 3; window++) {
		shuffled$1(rng, ["double", game === "snake" ? "shield" : "peek"]).forEach((kind, i) => events.push({
			at: window * 6e4 + 12e3 + i * 22e3 + between$1(rng, -3500, 3500),
			kind,
			flavor: -1
		}));
		if (game === "memory_lif" && GAME_CONFIG$1.MEMORY_RADAR_ENABLED) events.push({
			at: window * 6e4 + 46e3 + between$1(rng, -3e3, 3e3),
			kind: "radar",
			flavor: -1
		});
	}
	if (game === "memory_lif") {
		let at = 0;
		while (true) {
			at += between$1(rng, GAME_CONFIG$1.MEMORY_SHUFFLE_MIN_INTERVAL_SECONDS * 1e3, GAME_CONFIG$1.MEMORY_SHUFFLE_MAX_INTERVAL_SECONDS * 1e3);
			if (at >= 17e4) break;
			shuffles.push(at);
		}
	}
	events.sort((a, b) => a.at - b.at);
	return {
		game,
		events,
		shuffles
	};
}
function inspectPlan$1(plan) {
	const counts = {};
	for (const event of plan.events) counts[event.kind] = (counts[event.kind] ?? 0) + 1;
	return {
		counts,
		normal: plan.events.filter((e) => e.kind === "flavor" && e.flavor >= 3).length,
		newFlavors: plan.events.filter((e) => e.kind === "flavor" && e.flavor < 3).map((e) => e.flavor),
		basePotential: plan.events.reduce((sum, e) => sum + (e.kind === "logo" ? GAME_CONFIG$1.LIF_LOGO_POINTS : e.kind === "flavor" ? e.flavor < 3 ? GAME_CONFIG$1.NEW_FLAVOR_POINTS : GAME_CONFIG$1.NORMAL_FLAVOR_POINTS : 0), 0),
		timedPotential: plan.events.reduce((sum, e) => {
			return sum + (e.kind === "logo" ? GAME_CONFIG$1.LIF_LOGO_POINTS : e.kind === "flavor" ? e.flavor < 3 ? GAME_CONFIG$1.NEW_FLAVOR_POINTS : GAME_CONFIG$1.NORMAL_FLAVOR_POINTS : 0) * (plan.events.some((b) => (b.kind === "double" || b.kind === "boost") && b.at <= e.at && b.at + (b.kind === "double" ? GAME_CONFIG$1.POWERUP_DURATION_SECONDS : GAME_CONFIG$1.BOOST_DURATION_SECONDS) * 1e3 > e.at) ? 2 : 1);
		}, 0)
	};
}
function validPlan$1(plan) {
	const stats = inspectPlan$1(plan);
	if (plan.events.some((e) => e.at < 0 || e.at >= 18e4)) return false;
	if (plan.game === "snake") return stats.counts.double === 3 && stats.counts.shield === 3 && stats.counts.hazard === 6 && stats.basePotential === 0;
	return stats.counts.double === 3 && stats.counts.peek === 3 && plan.shuffles.every((at, i) => {
		const gap = at - (plan.shuffles[i - 1] ?? 0);
		return gap >= 35e3 && gap <= 55e3 && at < 17e4;
	});
}
function createSessionPlan$1(game, seed) {
	for (let retry = 0; retry < GAME_CONFIG$1.SESSION_PLAN_MAX_RETRIES; retry++) {
		const plan = makePlan$1(game, seed + retry * 2654435769 >>> 0);
		if (validPlan$1(plan)) return plan;
	}
	throw new Error("Session plan failed fairness constraints");
}
function memoryPairBag$1(rng, stage, initial = false, previous = -2) {
	const normal = shuffled$1(rng, Array.from({ length: stage === 0 ? 6 : stage === 1 ? 8 : 10 }, (_, i) => i + 3)).slice(0, 4);
	const fresh = initial ? [
		0,
		1,
		2
	] : [
		between$1(rng, 0, 2),
		between$1(rng, 0, 2),
		between$1(rng, 0, 2)
	];
	for (let retry = 0; retry < 64; retry++) {
		const bag = shuffled$1(rng, [
			...normal,
			...fresh,
			-1
		]);
		if (bag[0] === previous || bag.some((f, i) => i > 0 && f === bag[i - 1]) || bag.some((f, i) => i >= 2 && f >= 0 && f < 3 && bag[i - 1] >= 0 && bag[i - 1] < 3 && bag[i - 2] >= 0 && bag[i - 2] < 3)) continue;
		return bag;
	}
	const freshOrder = shuffled$1(rng, fresh);
	const rest = shuffled$1(rng, [...normal, -1]);
	const bag = [
		rest[0],
		freshOrder[0],
		rest[1],
		freshOrder[1],
		rest[2],
		freshOrder[2],
		rest[3],
		rest[4]
	];
	if (bag[0] === previous) [bag[0], bag[7]] = [bag[7], bag[0]];
	return bag;
}
//#endregion
//#region lib/gaming/versions/restored-v3/memory-engine.ts
function card$1(s, flavor, phase = "idle") {
	return {
		id: s.nextId++,
		flavor,
		phase,
		until: s.activeMs + (phase === "replacing" ? 320 : 0)
	};
}
function createMemory$1(s) {
	return {
		cards: shuffled$1(s, memoryPairBag$1(s, 0, true).flatMap((flavor) => [card$1(s, flavor), card$1(s, flavor)])),
		selected: [],
		evaluationAt: 0,
		transitionAt: 0,
		cycle: "idle",
		bag: [],
		lastFlavor: -2,
		matches: 0,
		errorStreak: 0,
		superProgress: 0,
		pendingSuper: false,
		peekCharges: 1,
		radarCharges: 0,
		peekUntil: 0,
		radarUntil: 0,
		radarSlots: [],
		shuffleIndex: 0,
		notice: "",
		noticeUntil: 0,
		stage: 0
	};
}
var safe$1 = (m) => m.cycle === "idle" && m.selected.length === 0 && m.cards.every((c) => c.phase === "idle");
function memoryInput$1(s, input) {
	const m = s.memory;
	if (m.cycle !== "idle" || m.peekUntil > s.activeMs) return false;
	if (input.action === "peek") {
		if (!safe$1(m) || m.peekCharges < 1) return false;
		m.peekCharges--;
		m.peekUntil = s.activeMs + GAME_CONFIG$1.MEMORY_PEEK_DURATION_SECONDS * 1e3;
		emit$2(s, "peek");
		return true;
	}
	if (input.action === "radar") {
		if (!GAME_CONFIG$1.MEMORY_RADAR_ENABLED || !safe$1(m) || m.radarCharges < 1) return false;
		m.radarCharges--;
		m.radarUntil = s.activeMs + 3e3;
		m.radarSlots = shuffled$1(s, [...new Set(m.cards.map((c) => c.flavor))]).slice(0, 3).map((flavor) => shuffled$1(s, m.cards.map((c, i) => c.flavor === flavor ? i : -1).filter((i) => i >= 0))[0]);
		emit$2(s, "radar");
		return true;
	}
	const slot = input.slot;
	if (!Number.isInteger(slot) || slot < 0 || slot >= m.cards.length || m.selected.length >= 2) return false;
	const selected = m.cards[slot];
	if (selected.phase !== "idle" || m.selected.includes(slot)) return false;
	selected.phase = "flipping";
	selected.until = s.activeMs + GAME_CONFIG$1.MEMORY_FLIP_MS;
	m.selected.push(slot);
	emit$2(s, "flip", 0, -1, {
		x: slot % 4,
		y: Math.floor(slot / 4)
	});
	if (m.selected.length === 2) {
		m.cycle = "evaluating";
		m.evaluationAt = selected.until + 80;
	}
	return true;
}
function startSuper$1(s) {
	const m = s.memory;
	m.pendingSuper = false;
	m.superProgress = 0;
	s.bonusCount++;
	const points = GAME_CONFIG$1.MEMORY_SUPER_BONUS_POINTS * (GAME_CONFIG$1.MEMORY_X2_SUPER_BONUS && s.doubleUntil > s.activeMs ? 2 : 1);
	s.score += points;
	s.spotlight = "super";
	s.freezeMs = GAME_CONFIG$1.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
	emit$2(s, "super", points);
}
function evaluate$1(s) {
	const m = s.memory, [a, b] = m.selected.map((i) => m.cards[i]);
	if (a.flavor !== b.flavor) {
		m.errorStreak++;
		const penalty = m.errorStreak > GAME_CONFIG$1.MEMORY_FREE_MISMATCHES_PER_STREAK ? GAME_CONFIG$1.MEMORY_MISMATCH_PENALTY : 0;
		s.score = Math.max(0, s.score - penalty);
		a.phase = b.phase = "mismatch";
		m.cycle = "mismatch";
		m.transitionAt = s.activeMs + [
			800,
			700,
			600
		][m.stage];
		m.notice = penalty ? `Sin pareja: −${penalty} puntos` : "Primer fallo: sin penalización";
		m.noticeUntil = s.activeMs + 1600;
		emit$2(s, "mismatch", -penalty, -1, {
			x: m.selected[0] % 4,
			y: Math.floor(m.selected[0] / 4)
		});
		if (m.errorStreak >= GAME_CONFIG$1.MEMORY_MAX_ERROR_STREAK) {
			s.ended = "error_streak";
			emit$2(s, "death");
		}
		return;
	}
	m.errorStreak = 0;
	a.phase = b.phase = "matched";
	m.cycle = "matched";
	m.transitionAt = s.activeMs + 320;
	m.notice = "Nueva pareja: mezcla breve";
	m.noticeUntil = s.activeMs + 1600;
	m.matches++;
	m.superProgress++;
	const flavor = a.flavor, isNew = flavor >= 0 && flavor < 3;
	const points = (flavor === -1 ? GAME_CONFIG$1.MEMORY_LOGO_MATCH_POINTS : isNew ? GAME_CONFIG$1.MEMORY_MATCH_NEW_FLAVOR_POINTS : GAME_CONFIG$1.MEMORY_MATCH_NORMAL_POINTS) * (s.doubleUntil > s.activeMs ? 2 : 1);
	s.score += points;
	emit$2(s, flavor === -1 ? "logo" : isNew ? "new" : "normal", points, flavor, {
		x: m.selected[0] % 4,
		y: Math.floor(m.selected[0] / 4)
	});
	if (isNew) {
		if (!s.newSeen.includes(flavor)) s.newSeen.push(flavor);
		s.spotlight = flavor;
		s.freezeMs = GAME_CONFIG$1.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
	}
	if (m.superProgress >= GAME_CONFIG$1.MEMORY_SUPER_BONUS_MATCHES) {
		m.pendingSuper = true;
		if (!s.freezeMs) startSuper$1(s);
	}
}
function replacePair$1(s) {
	const m = s.memory;
	if (!m.bag.length) m.bag = memoryPairBag$1(s, m.stage, false, m.lastFlavor);
	let flavor = m.bag.shift();
	const justMatched = m.cards[m.selected[0]].flavor;
	if (flavor === justMatched) {
		const alternative = m.bag.findIndex((f) => f !== justMatched && f !== m.lastFlavor);
		if (alternative >= 0) [flavor, m.bag[alternative]] = [m.bag[alternative], flavor];
	}
	m.lastFlavor = flavor;
	for (const slot of m.selected) m.cards[slot] = card$1(s, flavor, "replacing");
	const closed = shuffled$1(s, m.cards.map((c, i) => c.phase === "idle" ? i : -1).filter((i) => i >= 0)).slice(0, 4);
	const slots = [...m.selected, ...closed];
	const values = shuffled$1(s, slots.map((i) => m.cards[i]));
	slots.forEach((slot, i) => {
		m.cards[slot] = values[i];
		m.cards[slot].phase = "replacing";
		m.cards[slot].until = s.activeMs + 360;
	});
	m.noticeUntil = s.activeMs + 700;
	m.selected = [];
	m.cycle = "replacing";
	m.transitionAt = s.activeMs + 360;
}
function shuffleClosed$1(s) {
	const m = s.memory;
	const slots = m.cards.map((c, i) => c.phase === "idle" ? i : -1).filter((i) => i >= 0);
	const values = slots.map((i) => m.cards[i]);
	const traversal = shuffled$1(s, slots), shift = 1 + Math.floor(shuffled$1(s, slots)[0] / slots.length * (slots.length - 1));
	traversal.forEach((slot, i) => {
		m.cards[slot] = values[slots.indexOf(traversal[(i + shift) % slots.length])];
		m.cards[slot].phase = "replacing";
	});
	m.cycle = "shuffling";
	m.transitionAt = s.activeMs + 520;
	m.shuffleIndex++;
	emit$2(s, "shuffle");
}
function stepMemory$1(s) {
	const m = s.memory;
	m.stage = Math.min(2, Math.floor(s.activeMs / 6e4));
	if (m.pendingSuper) {
		startSuper$1(s);
		return;
	}
	for (const card of m.cards) if (card.phase === "flipping" && s.activeMs >= card.until) card.phase = "revealed";
	if (m.cycle === "evaluating" && s.activeMs >= m.evaluationAt) evaluate$1(s);
	else if (s.activeMs >= m.transitionAt) {
		if (m.cycle === "mismatch") {
			for (const slot of m.selected) m.cards[slot].phase = "closing";
			m.cycle = "closing";
			m.transitionAt = s.activeMs + GAME_CONFIG$1.MEMORY_FLIP_MS;
		} else if (m.cycle === "closing") {
			for (const slot of m.selected) m.cards[slot].phase = "idle";
			m.selected = [];
			m.cycle = "idle";
		} else if (m.cycle === "matched") {
			for (const slot of m.selected) m.cards[slot].phase = "exiting";
			m.cycle = "exiting";
			m.transitionAt = s.activeMs + 260;
		} else if (m.cycle === "exiting") replacePair$1(s);
		else if (m.cycle === "replacing" || m.cycle === "shuffling") {
			for (const card of m.cards) if (card.phase === "replacing") card.phase = "idle";
			m.cycle = "idle";
		} else if (m.cycle === "shuffle-warning") shuffleClosed$1(s);
	}
	if (!safe$1(m) || m.peekUntil > s.activeMs || s.freezeMs > 0) return;
	while (s.scheduleIndex < s.plan.events.length && s.plan.events[s.scheduleIndex].at <= s.activeMs) {
		const event = s.plan.events[s.scheduleIndex++];
		if (event.kind === "double") {
			s.doubleUntil = s.activeMs + GAME_CONFIG$1.MEMORY_X2_DURATION_SECONDS * 1e3;
			emit$2(s, "powerup");
		}
		if (event.kind === "peek") {
			m.peekCharges++;
			emit$2(s, "powerup");
		}
		if (event.kind === "radar") {
			m.radarCharges++;
			emit$2(s, "powerup");
		}
	}
	if (m.shuffleIndex < s.plan.shuffles.length && s.activeMs >= s.plan.shuffles[m.shuffleIndex] && s.activeMs < 17e4 && s.doubleUntil <= s.activeMs) {
		m.cycle = "shuffle-warning";
		m.transitionAt = s.activeMs + 850;
		m.notice = "LIF SHUFFLE";
		m.noticeUntil = s.activeMs + 1450;
	}
}
//#endregion
//#region lib/gaming/versions/restored-v3/engine.ts
function emit$2(s, type, value = 0, flavor = -1, p = {
	x: 0,
	y: 0
}) {
	s.events.push({
		id: s.nextId++,
		type,
		value,
		flavor,
		at: s.activeMs,
		...p
	});
	if (s.events.length > 128) s.events.splice(0, s.events.length - 128);
}
function createGame$2(game, seed) {
	const state = {
		...createGame$5(game === "snake" ? "snake" : "catch", seed),
		game,
		plan: {
			game,
			events: [],
			shuffles: []
		},
		scheduleIndex: 0,
		pendingSpawns: [],
		memory: null,
		normalBag: [],
		normalPrevious: -1,
		competitionProgress: 0,
		recoveryMs: 0,
		pendingSuper: false
	};
	if (game === "memory_lif") {
		state.plan = createSessionPlan$1(game, seed);
		state.memory = createMemory$1(state);
	}
	return state;
}
function applyInput$2(s, input) {
	if (s.ended || s.freezeMs > 0) return false;
	if (s.game === "memory_lif") return memoryInput$1(s, input);
	const queued = s.queued;
	applyInput$5(s, input);
	return s.queued !== queued;
}
function stepGame$2(s) {
	if (s.ended) return;
	if (s.game === "snake") {
		stepGame$5(s);
		return;
	}
	s.ms += GAME_CONFIG$1.STEP_MS;
	if (s.freezeMs > 0) {
		s.freezeMs = Math.max(0, s.freezeMs - GAME_CONFIG$1.STEP_MS);
		if (!s.freezeMs) s.spotlight = null;
		return;
	}
	s.activeMs = Math.min(GAME_CONFIG$1.GAME_DURATION_SECONDS * 1e3, s.activeMs + GAME_CONFIG$1.STEP_MS);
	if (s.activeMs >= GAME_CONFIG$1.GAME_DURATION_SECONDS * 1e3) {
		s.ended = "time";
		emit$2(s, "complete");
		return;
	}
	stepMemory$1(s);
}
function replayGame$2(game, seed, inputs, untilMs, version = GAME_CONFIG$1.VERSION) {
	if (version === "lif-games-20261007-unified-v2" && game !== "catch") return replayGame$3(game, seed, inputs, untilMs);
	if (version === "lif-games-20261007-memory-v1" && game !== "catch") return replayGame$4(game, seed, inputs, untilMs);
	if (game === "catch" || version === "lif-games-20261002-v2") return replayGame$5(game === "catch" ? "catch" : "snake", seed, inputs, untilMs);
	const state = createGame$2(game, seed);
	let index = 0;
	for (let t = 0; t < untilMs && !state.ended; t += GAME_CONFIG$1.STEP_MS) {
		while (index < inputs.length && inputs[index].at <= state.ms) applyInput$2(state, inputs[index++]);
		stepGame$2(state);
	}
	return state;
}
//#endregion
//#region lib/gaming/versions/calibrated-v4/config.ts
var COMPETITION_RULES = {
	NORMAL_POINTS: 50,
	NEW_POINTS: 300,
	LOGO_POINTS: 150,
	SUPER_ACTIONS: 6,
	SUPER_POINTS: 1e3,
	X2_SECONDS: 10,
	DURATION_SECONDS: 180
};
var GAME_CONFIG = {
	VERSION: "lif-games-20261007-calibrated-v4",
	RANDOMIZATION_MODE: "seeded_controlled",
	ENABLE_SESSION_SEED: true,
	ENABLE_DEBUG_SEED_REPLAY: true,
	MEMORY_BOARD_ROWS: 4,
	MEMORY_BOARD_COLS: 4,
	MEMORY_MATCH_NORMAL_POINTS: 10,
	MEMORY_MATCH_NEW_FLAVOR_POINTS: 60,
	MEMORY_LOGO_MATCH_POINTS: 30,
	MEMORY_MISMATCH_PENALTY: 20,
	MEMORY_FREE_MISMATCHES_PER_STREAK: 1,
	MEMORY_MAX_ERROR_STREAK: 10,
	MEMORY_SUPER_BONUS_MATCHES: COMPETITION_RULES.SUPER_ACTIONS,
	MEMORY_SUPER_BONUS_POINTS: 250,
	MEMORY_X2_SUPER_BONUS: false,
	MEMORY_PEEK_DURATION_SECONDS: 1,
	MEMORY_X2_DURATION_SECONDS: COMPETITION_RULES.X2_SECONDS,
	MEMORY_SHUFFLE_MIN_INTERVAL_SECONDS: 35,
	MEMORY_SHUFFLE_MAX_INTERVAL_SECONDS: 55,
	MEMORY_FLIP_MS: 360,
	MEMORY_RADAR_ENABLED: false,
	SESSION_PLAN_MAX_RETRIES: 64,
	GAME_DURATION_SECONDS: COMPETITION_RULES.DURATION_SECONDS,
	DAILY_ATTEMPTS: 3,
	TIMEZONE: "America/Costa_Rica",
	CURTAIN_OPEN_DURATION_MS: 5470,
	COUNTDOWN_STEP_MS: 1e3,
	NORMAL_FLAVOR_POINTS: COMPETITION_RULES.NORMAL_POINTS,
	LIF_LOGO_POINTS: COMPETITION_RULES.LOGO_POINTS,
	NEW_FLAVOR_POINTS: COMPETITION_RULES.NEW_POINTS,
	COMPETITOR_PENALTY_POINTS: LEGACY_CONFIG.COMPETITOR_PENALTY_POINTS,
	COMPETITOR_SEGMENT_DAMAGE: 2,
	SNAKE_STARTING_LENGTH: 3,
	SNAKE_SUPER_BONUS_LENGTH: LEGACY_CONFIG.SNAKE_SUPER_BONUS_LENGTH,
	SNAKE_SUPER_BONUS_POINTS: COMPETITION_RULES.SUPER_POINTS,
	SNAKE_SPEED_INCREASE_PER_SUPER_BONUS: .06,
	SNAKE_TICK_MS: 190,
	BOARD_COLS: 30,
	BOARD_ROWS: 20,
	POWERUP_DURATION_SECONDS: COMPETITION_RULES.X2_SECONDS,
	BOOST_DURATION_SECONDS: 7,
	BOOST_SPEED_MULTIPLIER: 1.4,
	BOOST_CLOCK_MULTIPLIER: LEGACY_CONFIG.BOOST_CLOCK_MULTIPLIER,
	MAGNET_DURATION_SECONDS: 7,
	FLEETING_ITEM_DURATION_SECONDS: 4,
	NEW_FLAVOR_SPOTLIGHT_SECONDS: 1.75,
	LEADERBOARD_SIZE: 20,
	LEADERBOARD_MAX_SIZE: 20,
	STEP_MS: 20,
	SHOW_COLLISION_BOXES: false,
	GAME_OVER_JINGLE_MODE: "fixed",
	RANKING_PERIOD: "campaign",
	RANKING_START: "2026-10-01",
	RANKING_END: "2027-12-31",
	PLAY_CTA: "JUGAR"
};
//#endregion
//#region lib/gaming/versions/calibrated-v4/session-random.ts
function random(state) {
	state.rng = state.rng + 1831565813 | 0;
	let t = Math.imul(state.rng ^ state.rng >>> 15, 1 | state.rng);
	t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
	return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function stream(seed, label) {
	let hash = seed >>> 0;
	for (const character of label) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
	return { rng: hash >>> 0 };
}
function between(state, min, max) {
	return min + Math.floor(random(state) * (max - min + 1));
}
function shuffled(state, values) {
	const result = [...values];
	for (let i = result.length - 1; i > 0; i--) {
		const j = between(state, 0, i);
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}
function makePlan(game, seed) {
	const rng = stream(seed, `${GAME_CONFIG.VERSION}:schedule:${game}`);
	const events = [];
	const shuffles = [];
	if (game === "snake") {
		const hazards = shuffled(rng, [
			0,
			0,
			0,
			1,
			1,
			1
		]);
		for (let window = 0; window < 6; window++) events.push({
			at: window * 3e4 + between(rng, 14e3, 22e3),
			kind: "hazard",
			flavor: hazards[window]
		});
	}
	for (let window = 0; window < 3; window++) {
		shuffled(rng, ["double", game === "snake" ? "shield" : "peek"]).forEach((kind, i) => events.push({
			at: window * 6e4 + 12e3 + i * 22e3 + between(rng, -3500, 3500),
			kind,
			flavor: -1
		}));
		if (game === "memory_lif" && GAME_CONFIG.MEMORY_RADAR_ENABLED) events.push({
			at: window * 6e4 + 46e3 + between(rng, -3e3, 3e3),
			kind: "radar",
			flavor: -1
		});
	}
	if (game === "memory_lif") {
		let at = 0;
		while (true) {
			at += between(rng, GAME_CONFIG.MEMORY_SHUFFLE_MIN_INTERVAL_SECONDS * 1e3, GAME_CONFIG.MEMORY_SHUFFLE_MAX_INTERVAL_SECONDS * 1e3);
			if (at >= 17e4) break;
			shuffles.push(at);
		}
	}
	events.sort((a, b) => a.at - b.at);
	return {
		game,
		events,
		shuffles
	};
}
function inspectPlan(plan) {
	const counts = {};
	for (const event of plan.events) counts[event.kind] = (counts[event.kind] ?? 0) + 1;
	return {
		counts,
		normal: plan.events.filter((e) => e.kind === "flavor" && e.flavor >= 3).length,
		newFlavors: plan.events.filter((e) => e.kind === "flavor" && e.flavor < 3).map((e) => e.flavor),
		basePotential: plan.events.reduce((sum, e) => sum + (e.kind === "logo" ? GAME_CONFIG.LIF_LOGO_POINTS : e.kind === "flavor" ? e.flavor < 3 ? GAME_CONFIG.NEW_FLAVOR_POINTS : GAME_CONFIG.NORMAL_FLAVOR_POINTS : 0), 0),
		timedPotential: plan.events.reduce((sum, e) => {
			return sum + (e.kind === "logo" ? GAME_CONFIG.LIF_LOGO_POINTS : e.kind === "flavor" ? e.flavor < 3 ? GAME_CONFIG.NEW_FLAVOR_POINTS : GAME_CONFIG.NORMAL_FLAVOR_POINTS : 0) * (plan.events.some((b) => (b.kind === "double" || b.kind === "boost") && b.at <= e.at && b.at + (b.kind === "double" ? GAME_CONFIG.POWERUP_DURATION_SECONDS : GAME_CONFIG.BOOST_DURATION_SECONDS) * 1e3 > e.at) ? 2 : 1);
		}, 0)
	};
}
function validPlan(plan) {
	const stats = inspectPlan(plan);
	if (plan.events.some((e) => e.at < 0 || e.at >= 18e4)) return false;
	if (plan.game === "snake") return stats.counts.double === 3 && stats.counts.shield === 3 && stats.counts.hazard === 6 && stats.basePotential === 0;
	return stats.counts.double === 3 && stats.counts.peek === 3 && plan.shuffles.every((at, i) => {
		const gap = at - (plan.shuffles[i - 1] ?? 0);
		return gap >= 35e3 && gap <= 55e3 && at < 17e4;
	});
}
function createSessionPlan(game, seed) {
	for (let retry = 0; retry < GAME_CONFIG.SESSION_PLAN_MAX_RETRIES; retry++) {
		const plan = makePlan(game, seed + retry * 2654435769 >>> 0);
		if (validPlan(plan)) return plan;
	}
	throw new Error("Session plan failed fairness constraints");
}
function memoryPairBag(rng, stage, initial = false, previous = -2) {
	const normal = shuffled(rng, Array.from({ length: stage === 0 ? 6 : stage === 1 ? 8 : 10 }, (_, i) => i + 3)).slice(0, 4);
	const fresh = initial ? [
		0,
		1,
		2
	] : [
		between(rng, 0, 2),
		between(rng, 0, 2),
		between(rng, 0, 2)
	];
	for (let retry = 0; retry < 64; retry++) {
		const bag = shuffled(rng, [
			...normal,
			...fresh,
			-1
		]);
		if (bag[0] === previous || bag.some((f, i) => i > 0 && f === bag[i - 1]) || bag.some((f, i) => i >= 2 && f >= 0 && f < 3 && bag[i - 1] >= 0 && bag[i - 1] < 3 && bag[i - 2] >= 0 && bag[i - 2] < 3)) continue;
		return bag;
	}
	const freshOrder = shuffled(rng, fresh);
	const rest = shuffled(rng, [...normal, -1]);
	const bag = [
		rest[0],
		freshOrder[0],
		rest[1],
		freshOrder[1],
		rest[2],
		freshOrder[2],
		rest[3],
		rest[4]
	];
	if (bag[0] === previous) [bag[0], bag[7]] = [bag[7], bag[0]];
	return bag;
}
//#endregion
//#region lib/gaming/versions/calibrated-v4/memory-engine.ts
function card(s, flavor, phase = "idle") {
	return {
		id: s.nextId++,
		flavor,
		phase,
		until: s.activeMs + (phase === "replacing" ? 320 : 0)
	};
}
function createMemory(s) {
	return {
		cards: shuffled(s, memoryPairBag(s, 0, true).flatMap((flavor) => [card(s, flavor), card(s, flavor)])),
		selected: [],
		evaluationAt: 0,
		transitionAt: 0,
		cycle: "idle",
		bag: [],
		lastFlavor: -2,
		matches: 0,
		errorStreak: 0,
		superProgress: 0,
		pendingSuper: false,
		peekCharges: 1,
		radarCharges: 0,
		peekUntil: 0,
		radarUntil: 0,
		radarSlots: [],
		shuffleIndex: 0,
		notice: "",
		noticeUntil: 0,
		stage: 0
	};
}
var safe = (m) => m.cycle === "idle" && m.selected.length === 0 && m.cards.every((c) => c.phase === "idle");
function memoryInput(s, input) {
	const m = s.memory;
	if (m.cycle !== "idle" || m.peekUntil > s.activeMs) return false;
	if (input.action === "peek") {
		if (!safe(m) || m.peekCharges < 1) return false;
		m.peekCharges--;
		m.peekUntil = s.activeMs + GAME_CONFIG.MEMORY_PEEK_DURATION_SECONDS * 1e3;
		emit$1(s, "peek");
		return true;
	}
	if (input.action === "radar") {
		if (!GAME_CONFIG.MEMORY_RADAR_ENABLED || !safe(m) || m.radarCharges < 1) return false;
		m.radarCharges--;
		m.radarUntil = s.activeMs + 3e3;
		m.radarSlots = shuffled(s, [...new Set(m.cards.map((c) => c.flavor))]).slice(0, 3).map((flavor) => shuffled(s, m.cards.map((c, i) => c.flavor === flavor ? i : -1).filter((i) => i >= 0))[0]);
		emit$1(s, "radar");
		return true;
	}
	const slot = input.slot;
	if (!Number.isInteger(slot) || slot < 0 || slot >= m.cards.length || m.selected.length >= 2) return false;
	const selected = m.cards[slot];
	if (selected.phase !== "idle" || m.selected.includes(slot)) return false;
	selected.phase = "flipping";
	selected.until = s.activeMs + GAME_CONFIG.MEMORY_FLIP_MS;
	m.selected.push(slot);
	emit$1(s, "flip", 0, -1, {
		x: slot % 4,
		y: Math.floor(slot / 4)
	});
	if (m.selected.length === 2) {
		m.cycle = "evaluating";
		m.evaluationAt = selected.until + 80;
	}
	return true;
}
function startSuper(s) {
	const m = s.memory;
	m.pendingSuper = false;
	m.superProgress = 0;
	s.bonusCount++;
	const points = GAME_CONFIG.MEMORY_SUPER_BONUS_POINTS * (GAME_CONFIG.MEMORY_X2_SUPER_BONUS && s.doubleUntil > s.activeMs ? 2 : 1);
	s.score += points;
	s.spotlight = "super";
	s.freezeMs = GAME_CONFIG.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
	emit$1(s, "super", points);
}
function evaluate(s) {
	const m = s.memory, [a, b] = m.selected.map((i) => m.cards[i]);
	if (a.flavor !== b.flavor) {
		m.errorStreak++;
		const penalty = m.errorStreak > GAME_CONFIG.MEMORY_FREE_MISMATCHES_PER_STREAK ? GAME_CONFIG.MEMORY_MISMATCH_PENALTY : 0;
		s.score = Math.max(0, s.score - penalty);
		a.phase = b.phase = "mismatch";
		m.cycle = "mismatch";
		m.transitionAt = s.activeMs + [
			800,
			700,
			600
		][m.stage];
		m.notice = penalty ? `Sin pareja: −${penalty} puntos` : "Primer fallo: sin penalización";
		m.noticeUntil = s.activeMs + 1600;
		emit$1(s, "mismatch", -penalty, -1, {
			x: m.selected[0] % 4,
			y: Math.floor(m.selected[0] / 4)
		});
		if (m.errorStreak >= GAME_CONFIG.MEMORY_MAX_ERROR_STREAK) {
			s.ended = "error_streak";
			emit$1(s, "death");
		}
		return;
	}
	m.errorStreak = 0;
	a.phase = b.phase = "matched";
	m.cycle = "matched";
	m.transitionAt = s.activeMs + 320;
	m.notice = "Nueva pareja: mezcla breve";
	m.noticeUntil = s.activeMs + 1600;
	m.matches++;
	m.superProgress++;
	const flavor = a.flavor, isNew = flavor >= 0 && flavor < 3;
	const points = (flavor === -1 ? GAME_CONFIG.MEMORY_LOGO_MATCH_POINTS : isNew ? GAME_CONFIG.MEMORY_MATCH_NEW_FLAVOR_POINTS : GAME_CONFIG.MEMORY_MATCH_NORMAL_POINTS) * (s.doubleUntil > s.activeMs ? 2 : 1);
	s.score += points;
	emit$1(s, flavor === -1 ? "logo" : isNew ? "new" : "normal", points, flavor, {
		x: m.selected[0] % 4,
		y: Math.floor(m.selected[0] / 4)
	});
	if (isNew) {
		if (!s.newSeen.includes(flavor)) s.newSeen.push(flavor);
		s.spotlight = flavor;
		s.freezeMs = GAME_CONFIG.NEW_FLAVOR_SPOTLIGHT_SECONDS * 1e3;
	}
	if (m.superProgress >= GAME_CONFIG.MEMORY_SUPER_BONUS_MATCHES) {
		m.pendingSuper = true;
		if (!s.freezeMs) startSuper(s);
	}
}
function replacePair(s) {
	const m = s.memory;
	if (!m.bag.length) m.bag = memoryPairBag(s, m.stage, false, m.lastFlavor);
	let flavor = m.bag.shift();
	const justMatched = m.cards[m.selected[0]].flavor;
	if (flavor === justMatched) {
		const alternative = m.bag.findIndex((f) => f !== justMatched && f !== m.lastFlavor);
		if (alternative >= 0) [flavor, m.bag[alternative]] = [m.bag[alternative], flavor];
	}
	m.lastFlavor = flavor;
	for (const slot of m.selected) m.cards[slot] = card(s, flavor, "replacing");
	const closed = shuffled(s, m.cards.map((c, i) => c.phase === "idle" ? i : -1).filter((i) => i >= 0)).slice(0, 4);
	const slots = [...m.selected, ...closed];
	const values = shuffled(s, slots.map((i) => m.cards[i]));
	slots.forEach((slot, i) => {
		m.cards[slot] = values[i];
		m.cards[slot].phase = "replacing";
		m.cards[slot].until = s.activeMs + 360;
	});
	m.noticeUntil = s.activeMs + 700;
	m.selected = [];
	m.cycle = "replacing";
	m.transitionAt = s.activeMs + 360;
}
function shuffleClosed(s) {
	const m = s.memory;
	const slots = m.cards.map((c, i) => c.phase === "idle" ? i : -1).filter((i) => i >= 0);
	const values = slots.map((i) => m.cards[i]);
	const traversal = shuffled(s, slots), shift = 1 + Math.floor(shuffled(s, slots)[0] / slots.length * (slots.length - 1));
	traversal.forEach((slot, i) => {
		m.cards[slot] = values[slots.indexOf(traversal[(i + shift) % slots.length])];
		m.cards[slot].phase = "replacing";
	});
	m.cycle = "shuffling";
	m.transitionAt = s.activeMs + 520;
	m.shuffleIndex++;
	emit$1(s, "shuffle");
}
function stepMemory(s) {
	const m = s.memory;
	m.stage = Math.min(2, Math.floor(s.activeMs / 6e4));
	if (m.pendingSuper) {
		startSuper(s);
		return;
	}
	for (const card of m.cards) if (card.phase === "flipping" && s.activeMs >= card.until) card.phase = "revealed";
	if (m.cycle === "evaluating" && s.activeMs >= m.evaluationAt) evaluate(s);
	else if (s.activeMs >= m.transitionAt) {
		if (m.cycle === "mismatch") {
			for (const slot of m.selected) m.cards[slot].phase = "closing";
			m.cycle = "closing";
			m.transitionAt = s.activeMs + GAME_CONFIG.MEMORY_FLIP_MS;
		} else if (m.cycle === "closing") {
			for (const slot of m.selected) m.cards[slot].phase = "idle";
			m.selected = [];
			m.cycle = "idle";
		} else if (m.cycle === "matched") {
			for (const slot of m.selected) m.cards[slot].phase = "exiting";
			m.cycle = "exiting";
			m.transitionAt = s.activeMs + 260;
		} else if (m.cycle === "exiting") replacePair(s);
		else if (m.cycle === "replacing" || m.cycle === "shuffling") {
			for (const card of m.cards) if (card.phase === "replacing") card.phase = "idle";
			m.cycle = "idle";
		} else if (m.cycle === "shuffle-warning") shuffleClosed(s);
	}
	if (!safe(m) || m.peekUntil > s.activeMs || s.freezeMs > 0) return;
	while (s.scheduleIndex < s.plan.events.length && s.plan.events[s.scheduleIndex].at <= s.activeMs) {
		const event = s.plan.events[s.scheduleIndex++];
		if (event.kind === "double") {
			s.doubleUntil = s.activeMs + GAME_CONFIG.MEMORY_X2_DURATION_SECONDS * 1e3;
			emit$1(s, "powerup");
		}
		if (event.kind === "peek") {
			m.peekCharges++;
			emit$1(s, "powerup");
		}
		if (event.kind === "radar") {
			m.radarCharges++;
			emit$1(s, "powerup");
		}
	}
	if (m.shuffleIndex < s.plan.shuffles.length && s.activeMs >= s.plan.shuffles[m.shuffleIndex] && s.activeMs < 17e4 && s.doubleUntil <= s.activeMs) {
		m.cycle = "shuffle-warning";
		m.transitionAt = s.activeMs + 850;
		m.notice = "LIF SHUFFLE";
		m.noticeUntil = s.activeMs + 1450;
	}
}
//#endregion
//#region lib/gaming/versions/calibrated-v4/engine.ts
function emit$1(s, type, value = 0, flavor = -1, p = {
	x: 0,
	y: 0
}) {
	s.events.push({
		id: s.nextId++,
		type,
		value,
		flavor,
		at: s.activeMs,
		...p
	});
	if (s.events.length > 128) s.events.splice(0, s.events.length - 128);
}
function createGame$1(game, seed) {
	const state = {
		...createGame$5(game === "snake" ? "snake" : "catch", seed),
		game,
		plan: {
			game,
			events: [],
			shuffles: []
		},
		scheduleIndex: 0,
		pendingSpawns: [],
		memory: null,
		normalBag: [],
		normalPrevious: -1,
		competitionProgress: 0,
		recoveryMs: 0,
		pendingSuper: false
	};
	if (game === "memory_lif") {
		state.plan = createSessionPlan(game, seed);
		state.memory = createMemory(state);
	}
	return state;
}
function applyInput$1(s, input) {
	if (s.ended || s.freezeMs > 0) return false;
	if (s.game === "memory_lif") return memoryInput(s, input);
	const queued = s.queued;
	applyInput$5(s, input);
	return s.queued !== queued;
}
function stepGame$1(s) {
	if (s.ended) return;
	if (s.game === "snake") {
		stepGame$5(s);
		return;
	}
	s.ms += GAME_CONFIG.STEP_MS;
	if (s.freezeMs > 0) {
		s.freezeMs = Math.max(0, s.freezeMs - GAME_CONFIG.STEP_MS);
		if (!s.freezeMs) s.spotlight = null;
		return;
	}
	s.activeMs = Math.min(GAME_CONFIG.GAME_DURATION_SECONDS * 1e3, s.activeMs + GAME_CONFIG.STEP_MS);
	if (s.activeMs >= GAME_CONFIG.GAME_DURATION_SECONDS * 1e3) {
		s.ended = "time";
		emit$1(s, "complete");
		return;
	}
	stepMemory(s);
}
function replayGame$1(game, seed, inputs, untilMs, version = GAME_CONFIG.VERSION) {
	if (version === "lif-games-20261007-restored-v3" && game !== "catch") return replayGame$2(game, seed, inputs, untilMs);
	if (version === "lif-games-20261007-unified-v2" && game !== "catch") return replayGame$3(game, seed, inputs, untilMs);
	if (version === "lif-games-20261007-memory-v1" && game !== "catch") return replayGame$4(game, seed, inputs, untilMs);
	if (game === "catch" || version === "lif-games-20261002-v2") return replayGame$5(game === "catch" ? "catch" : "snake", seed, inputs, untilMs);
	const state = createGame$1(game, seed);
	let index = 0;
	for (let t = 0; t < untilMs && !state.ended; t += GAME_CONFIG.STEP_MS) {
		while (index < inputs.length && inputs[index].at <= state.ms) applyInput$1(state, inputs[index++]);
		stepGame$1(state);
	}
	return state;
}
//#endregion
//#region lib/gaming/engine.ts
function emit(s, type, value = 0, flavor = -1, p = {
	x: 0,
	y: 0
}) {
	s.events.push({
		id: s.nextId++,
		type,
		value,
		flavor,
		at: s.activeMs,
		...p
	});
	if (s.events.length > 128) s.events.splice(0, s.events.length - 128);
}
function createGame(game, seed) {
	const state = {
		...createGame$5(game === "snake" ? "snake" : "catch", seed),
		game,
		plan: {
			game,
			events: [],
			shuffles: []
		},
		scheduleIndex: 0,
		pendingSpawns: [],
		memory: null,
		normalBag: [],
		normalPrevious: -1,
		competitionProgress: 0,
		recoveryMs: 0,
		pendingSuper: false
	};
	if (game === "memory_lif") {
		state.plan = createSessionPlan$4(game, seed);
		state.memory = createMemory$4(state);
	}
	return state;
}
function applyInput(s, input) {
	if (s.ended || s.freezeMs > 0) return false;
	if (s.game === "memory_lif") return memoryInput$4(s, input);
	const queued = s.queued;
	applyInput$5(s, input);
	return s.queued !== queued;
}
function stepGame(s) {
	if (s.ended) return;
	if (s.game === "snake") {
		stepGame$5(s);
		return;
	}
	s.ms += GAME_CONFIG$4.STEP_MS;
	if (s.freezeMs > 0) {
		s.freezeMs = Math.max(0, s.freezeMs - GAME_CONFIG$4.STEP_MS);
		if (!s.freezeMs) s.spotlight = null;
		return;
	}
	s.activeMs = Math.min(GAME_CONFIG$4.GAME_DURATION_SECONDS * 1e3, s.activeMs + GAME_CONFIG$4.STEP_MS);
	if (s.activeMs >= GAME_CONFIG$4.GAME_DURATION_SECONDS * 1e3) {
		s.ended = "time";
		emit(s, "complete");
		return;
	}
	stepMemory$4(s);
}
function replayGame(game, seed, inputs, untilMs, version = GAME_CONFIG$4.VERSION) {
	if (version === "lif-games-20261007-calibrated-v4" && game !== "catch") return replayGame$1(game, seed, inputs, untilMs);
	if (version === "lif-games-20261007-restored-v3" && game !== "catch") return replayGame$2(game, seed, inputs, untilMs);
	if (version === "lif-games-20261007-unified-v2" && game !== "catch") return replayGame$3(game, seed, inputs, untilMs);
	if (version === "lif-games-20261007-memory-v1" && game !== "catch") return replayGame$4(game, seed, inputs, untilMs);
	if (game === "catch" || version === "lif-games-20261002-v2") return replayGame$5(game === "catch" ? "catch" : "snake", seed, inputs, untilMs);
	const state = createGame(game, seed);
	let index = 0;
	for (let t = 0; t < untilMs && !state.ended; t += GAME_CONFIG$4.STEP_MS) {
		while (index < inputs.length && inputs[index].at <= state.ms) applyInput(state, inputs[index++]);
		stepGame(state);
	}
	return state;
}
//#endregion
//#region ../../node_modules/emoji-regex/index.mjs
var emoji_regex_default = () => {
	return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
};
var segmenter = new Intl.Segmenter("es-CR", { granularity: "grapheme" });
var emoji = new RegExp(`^(?:${emoji_regex_default().source})$`);
var text = /^(?:[\p{L}\p{N}][\p{L}\p{N}\p{M}]*|[_ .-])$/u;
function normalizeNickname(value) {
	return value.trim().normalize("NFC");
}
function nicknameCharacters(value) {
	return Array.from(segmenter.segment(value), ({ segment }) => segment);
}
function nicknameValidationMessage(value) {
	const characters = nicknameCharacters(normalizeNickname(value));
	if (characters.length < 2 || characters.length > 12) return "El nickname debe tener entre 2 y 12 caracteres, incluyendo emojis.";
	if (!characters.every((character) => text.test(character) || emoji.test(character))) return "Usá letras, números, espacios, guiones, puntos o emojis en tu nickname.";
	return "";
}
var costa_rica_locations_default = {
	source: "Instituto Geografico Nacional / SNIT, Aplicativo DTA",
	sourceUrl: "https://www.snitcr.go.cr/ico_herramientas",
	serviceUrl: "https://services8.arcgis.com/ZBOPqyeRLt7yJb3h/arcgis/rest/services/DTA/FeatureServer",
	retrievedOn: "2026-10-07",
	provinces: [
		{
			"id": "1",
			"label": "San José"
		},
		{
			"id": "2",
			"label": "Alajuela"
		},
		{
			"id": "3",
			"label": "Cartago"
		},
		{
			"id": "4",
			"label": "Heredia"
		},
		{
			"id": "5",
			"label": "Guanacaste"
		},
		{
			"id": "6",
			"label": "Puntarenas"
		},
		{
			"id": "7",
			"label": "Limón"
		}
	],
	cantons: [
		{
			"id": "101",
			"label": "San José",
			"province": "1"
		},
		{
			"id": "102",
			"label": "Escazú",
			"province": "1"
		},
		{
			"id": "103",
			"label": "Desamparados",
			"province": "1"
		},
		{
			"id": "104",
			"label": "Puriscal",
			"province": "1"
		},
		{
			"id": "105",
			"label": "Tarrazú",
			"province": "1"
		},
		{
			"id": "106",
			"label": "Aserrí",
			"province": "1"
		},
		{
			"id": "107",
			"label": "Mora",
			"province": "1"
		},
		{
			"id": "108",
			"label": "Goicoechea",
			"province": "1"
		},
		{
			"id": "109",
			"label": "Santa Ana",
			"province": "1"
		},
		{
			"id": "110",
			"label": "Alajuelita",
			"province": "1"
		},
		{
			"id": "111",
			"label": "Vázquez de Coronado",
			"province": "1"
		},
		{
			"id": "112",
			"label": "Acosta",
			"province": "1"
		},
		{
			"id": "113",
			"label": "Tibás",
			"province": "1"
		},
		{
			"id": "114",
			"label": "Moravia",
			"province": "1"
		},
		{
			"id": "115",
			"label": "Montes de Oca",
			"province": "1"
		},
		{
			"id": "116",
			"label": "Turrubares",
			"province": "1"
		},
		{
			"id": "117",
			"label": "Dota",
			"province": "1"
		},
		{
			"id": "118",
			"label": "Curridabat",
			"province": "1"
		},
		{
			"id": "119",
			"label": "Pérez Zeledón",
			"province": "1"
		},
		{
			"id": "120",
			"label": "León Cortés Castro",
			"province": "1"
		},
		{
			"id": "201",
			"label": "Alajuela",
			"province": "2"
		},
		{
			"id": "202",
			"label": "San Ramón",
			"province": "2"
		},
		{
			"id": "203",
			"label": "Grecia",
			"province": "2"
		},
		{
			"id": "204",
			"label": "San Mateo",
			"province": "2"
		},
		{
			"id": "205",
			"label": "Atenas",
			"province": "2"
		},
		{
			"id": "206",
			"label": "Naranjo",
			"province": "2"
		},
		{
			"id": "207",
			"label": "Palmares",
			"province": "2"
		},
		{
			"id": "208",
			"label": "Poás",
			"province": "2"
		},
		{
			"id": "209",
			"label": "Orotina",
			"province": "2"
		},
		{
			"id": "210",
			"label": "San Carlos",
			"province": "2"
		},
		{
			"id": "211",
			"label": "Zarcero",
			"province": "2"
		},
		{
			"id": "212",
			"label": "Sarchí",
			"province": "2"
		},
		{
			"id": "213",
			"label": "Upala",
			"province": "2"
		},
		{
			"id": "214",
			"label": "Los Chiles",
			"province": "2"
		},
		{
			"id": "215",
			"label": "Guatuso",
			"province": "2"
		},
		{
			"id": "216",
			"label": "Río Cuarto",
			"province": "2"
		},
		{
			"id": "301",
			"label": "Cartago",
			"province": "3"
		},
		{
			"id": "302",
			"label": "Paraíso",
			"province": "3"
		},
		{
			"id": "303",
			"label": "La Unión",
			"province": "3"
		},
		{
			"id": "304",
			"label": "Jiménez",
			"province": "3"
		},
		{
			"id": "305",
			"label": "Turrialba",
			"province": "3"
		},
		{
			"id": "306",
			"label": "Alvarado",
			"province": "3"
		},
		{
			"id": "307",
			"label": "Oreamuno",
			"province": "3"
		},
		{
			"id": "308",
			"label": "El Guarco",
			"province": "3"
		},
		{
			"id": "401",
			"label": "Heredia",
			"province": "4"
		},
		{
			"id": "402",
			"label": "Barva",
			"province": "4"
		},
		{
			"id": "403",
			"label": "Santo Domingo",
			"province": "4"
		},
		{
			"id": "404",
			"label": "Santa Bárbara",
			"province": "4"
		},
		{
			"id": "405",
			"label": "San Rafael",
			"province": "4"
		},
		{
			"id": "406",
			"label": "San Isidro",
			"province": "4"
		},
		{
			"id": "407",
			"label": "Belén",
			"province": "4"
		},
		{
			"id": "408",
			"label": "Flores",
			"province": "4"
		},
		{
			"id": "409",
			"label": "San Pablo",
			"province": "4"
		},
		{
			"id": "410",
			"label": "Sarapiquí",
			"province": "4"
		},
		{
			"id": "501",
			"label": "Liberia",
			"province": "5"
		},
		{
			"id": "502",
			"label": "Nicoya",
			"province": "5"
		},
		{
			"id": "503",
			"label": "Santa Cruz",
			"province": "5"
		},
		{
			"id": "504",
			"label": "Bagaces",
			"province": "5"
		},
		{
			"id": "505",
			"label": "Carrillo",
			"province": "5"
		},
		{
			"id": "506",
			"label": "Cañas",
			"province": "5"
		},
		{
			"id": "507",
			"label": "Abangares",
			"province": "5"
		},
		{
			"id": "508",
			"label": "Tilarán",
			"province": "5"
		},
		{
			"id": "509",
			"label": "Nandayure",
			"province": "5"
		},
		{
			"id": "510",
			"label": "La Cruz",
			"province": "5"
		},
		{
			"id": "511",
			"label": "Hojancha",
			"province": "5"
		},
		{
			"id": "601",
			"label": "Puntarenas",
			"province": "6"
		},
		{
			"id": "602",
			"label": "Esparza",
			"province": "6"
		},
		{
			"id": "603",
			"label": "Buenos Aires",
			"province": "6"
		},
		{
			"id": "604",
			"label": "Montes de Oro",
			"province": "6"
		},
		{
			"id": "605",
			"label": "Osa",
			"province": "6"
		},
		{
			"id": "606",
			"label": "Quepos",
			"province": "6"
		},
		{
			"id": "607",
			"label": "Golfito",
			"province": "6"
		},
		{
			"id": "608",
			"label": "Coto Brus",
			"province": "6"
		},
		{
			"id": "609",
			"label": "Parrita",
			"province": "6"
		},
		{
			"id": "610",
			"label": "Corredores",
			"province": "6"
		},
		{
			"id": "611",
			"label": "Garabito",
			"province": "6"
		},
		{
			"id": "612",
			"label": "Monteverde",
			"province": "6"
		},
		{
			"id": "613",
			"label": "Puerto Jiménez",
			"province": "6"
		},
		{
			"id": "701",
			"label": "Limón",
			"province": "7"
		},
		{
			"id": "702",
			"label": "Pococí",
			"province": "7"
		},
		{
			"id": "703",
			"label": "Siquirres",
			"province": "7"
		},
		{
			"id": "704",
			"label": "Talamanca",
			"province": "7"
		},
		{
			"id": "705",
			"label": "Matina",
			"province": "7"
		},
		{
			"id": "706",
			"label": "Guácimo",
			"province": "7"
		}
	],
	districts: [
		{
			"id": "10101",
			"label": "Carmen",
			"canton": "101"
		},
		{
			"id": "10102",
			"label": "Merced",
			"canton": "101"
		},
		{
			"id": "10103",
			"label": "Hospital",
			"canton": "101"
		},
		{
			"id": "10104",
			"label": "Catedral",
			"canton": "101"
		},
		{
			"id": "10105",
			"label": "Zapote",
			"canton": "101"
		},
		{
			"id": "10106",
			"label": "San Francisco de Dos Ríos",
			"canton": "101"
		},
		{
			"id": "10107",
			"label": "Uruca",
			"canton": "101"
		},
		{
			"id": "10108",
			"label": "Mata Redonda",
			"canton": "101"
		},
		{
			"id": "10109",
			"label": "Pavas",
			"canton": "101"
		},
		{
			"id": "10110",
			"label": "Hatillo",
			"canton": "101"
		},
		{
			"id": "10111",
			"label": "San Sebastián",
			"canton": "101"
		},
		{
			"id": "10201",
			"label": "Escazú",
			"canton": "102"
		},
		{
			"id": "10202",
			"label": "San Antonio",
			"canton": "102"
		},
		{
			"id": "10203",
			"label": "San Rafael",
			"canton": "102"
		},
		{
			"id": "10301",
			"label": "Desamparados",
			"canton": "103"
		},
		{
			"id": "10302",
			"label": "San Miguel",
			"canton": "103"
		},
		{
			"id": "10303",
			"label": "San Juan de Dios",
			"canton": "103"
		},
		{
			"id": "10304",
			"label": "San Rafael Arriba",
			"canton": "103"
		},
		{
			"id": "10305",
			"label": "San Antonio",
			"canton": "103"
		},
		{
			"id": "10306",
			"label": "Frailes",
			"canton": "103"
		},
		{
			"id": "10307",
			"label": "Patarrá",
			"canton": "103"
		},
		{
			"id": "10308",
			"label": "San Cristobal",
			"canton": "103"
		},
		{
			"id": "10309",
			"label": "Rosario",
			"canton": "103"
		},
		{
			"id": "10310",
			"label": "Damas",
			"canton": "103"
		},
		{
			"id": "10311",
			"label": "San Rafael Abajo",
			"canton": "103"
		},
		{
			"id": "10312",
			"label": "Gravilias",
			"canton": "103"
		},
		{
			"id": "10313",
			"label": "Los Guido",
			"canton": "103"
		},
		{
			"id": "10401",
			"label": "Santiago",
			"canton": "104"
		},
		{
			"id": "10402",
			"label": "Mercedes Sur",
			"canton": "104"
		},
		{
			"id": "10403",
			"label": "Barbacoas",
			"canton": "104"
		},
		{
			"id": "10404",
			"label": "Grifo Alto",
			"canton": "104"
		},
		{
			"id": "10405",
			"label": "San Rafael",
			"canton": "104"
		},
		{
			"id": "10406",
			"label": "Candelarita",
			"canton": "104"
		},
		{
			"id": "10407",
			"label": "Desamparaditos",
			"canton": "104"
		},
		{
			"id": "10408",
			"label": "San Antonio",
			"canton": "104"
		},
		{
			"id": "10409",
			"label": "Chires",
			"canton": "104"
		},
		{
			"id": "10501",
			"label": "San Marcos",
			"canton": "105"
		},
		{
			"id": "10502",
			"label": "San Lorenzo",
			"canton": "105"
		},
		{
			"id": "10503",
			"label": "San Carlos",
			"canton": "105"
		},
		{
			"id": "10601",
			"label": "Aserrí",
			"canton": "106"
		},
		{
			"id": "10602",
			"label": "Tarbaca",
			"canton": "106"
		},
		{
			"id": "10603",
			"label": "Vuelta de Jorco",
			"canton": "106"
		},
		{
			"id": "10604",
			"label": "San Gabriel",
			"canton": "106"
		},
		{
			"id": "10605",
			"label": "Legua",
			"canton": "106"
		},
		{
			"id": "10606",
			"label": "Monterrey",
			"canton": "106"
		},
		{
			"id": "10607",
			"label": "Salitrillos",
			"canton": "106"
		},
		{
			"id": "10701",
			"label": "Colón",
			"canton": "107"
		},
		{
			"id": "10702",
			"label": "Guayabo",
			"canton": "107"
		},
		{
			"id": "10703",
			"label": "Tabarcia",
			"canton": "107"
		},
		{
			"id": "10704",
			"label": "Piedras Negras",
			"canton": "107"
		},
		{
			"id": "10705",
			"label": "Picagres",
			"canton": "107"
		},
		{
			"id": "10706",
			"label": "Jaris",
			"canton": "107"
		},
		{
			"id": "10707",
			"label": "Quitirrisí",
			"canton": "107"
		},
		{
			"id": "10801",
			"label": "Guadalupe",
			"canton": "108"
		},
		{
			"id": "10802",
			"label": "San Francisco",
			"canton": "108"
		},
		{
			"id": "10803",
			"label": "Calle Blancos",
			"canton": "108"
		},
		{
			"id": "10804",
			"label": "Mata de Plátano",
			"canton": "108"
		},
		{
			"id": "10805",
			"label": "Ipís",
			"canton": "108"
		},
		{
			"id": "10806",
			"label": "Rancho Redondo",
			"canton": "108"
		},
		{
			"id": "10807",
			"label": "Purral",
			"canton": "108"
		},
		{
			"id": "10901",
			"label": "Santa Ana",
			"canton": "109"
		},
		{
			"id": "10902",
			"label": "Salitral",
			"canton": "109"
		},
		{
			"id": "10903",
			"label": "Pozos",
			"canton": "109"
		},
		{
			"id": "10904",
			"label": "Uruca",
			"canton": "109"
		},
		{
			"id": "10905",
			"label": "Piedades",
			"canton": "109"
		},
		{
			"id": "10906",
			"label": "Brasil",
			"canton": "109"
		},
		{
			"id": "11001",
			"label": "Alajuelita",
			"canton": "110"
		},
		{
			"id": "11002",
			"label": "San Josecito",
			"canton": "110"
		},
		{
			"id": "11003",
			"label": "San Antonio",
			"canton": "110"
		},
		{
			"id": "11004",
			"label": "Concepción",
			"canton": "110"
		},
		{
			"id": "11005",
			"label": "San Felipe",
			"canton": "110"
		},
		{
			"id": "11101",
			"label": "San Isidro",
			"canton": "111"
		},
		{
			"id": "11102",
			"label": "San Rafael",
			"canton": "111"
		},
		{
			"id": "11103",
			"label": "Dulce Nombre de Jesús",
			"canton": "111"
		},
		{
			"id": "11104",
			"label": "Patalillo",
			"canton": "111"
		},
		{
			"id": "11105",
			"label": "Cascajal",
			"canton": "111"
		},
		{
			"id": "11201",
			"label": "San Ignacio",
			"canton": "112"
		},
		{
			"id": "11202",
			"label": "Guaitil",
			"canton": "112"
		},
		{
			"id": "11203",
			"label": "Palmichal",
			"canton": "112"
		},
		{
			"id": "11204",
			"label": "Cangrejal",
			"canton": "112"
		},
		{
			"id": "11205",
			"label": "Sabanillas",
			"canton": "112"
		},
		{
			"id": "11301",
			"label": "San Juan",
			"canton": "113"
		},
		{
			"id": "11302",
			"label": "Cinco Esquinas",
			"canton": "113"
		},
		{
			"id": "11303",
			"label": "Anselmo Llorente",
			"canton": "113"
		},
		{
			"id": "11304",
			"label": "León XIII",
			"canton": "113"
		},
		{
			"id": "11305",
			"label": "Colima",
			"canton": "113"
		},
		{
			"id": "11401",
			"label": "San Vicente",
			"canton": "114"
		},
		{
			"id": "11402",
			"label": "San Jerónimo",
			"canton": "114"
		},
		{
			"id": "11403",
			"label": "La Trinidad",
			"canton": "114"
		},
		{
			"id": "11501",
			"label": "San Pedro",
			"canton": "115"
		},
		{
			"id": "11502",
			"label": "Sabanilla",
			"canton": "115"
		},
		{
			"id": "11503",
			"label": "Mercedes",
			"canton": "115"
		},
		{
			"id": "11504",
			"label": "San Rafael",
			"canton": "115"
		},
		{
			"id": "11601",
			"label": "San Pablo",
			"canton": "116"
		},
		{
			"id": "11602",
			"label": "San Pedro",
			"canton": "116"
		},
		{
			"id": "11603",
			"label": "San Juan de Mata",
			"canton": "116"
		},
		{
			"id": "11604",
			"label": "San Luis",
			"canton": "116"
		},
		{
			"id": "11605",
			"label": "Carara",
			"canton": "116"
		},
		{
			"id": "11701",
			"label": "Santa María",
			"canton": "117"
		},
		{
			"id": "11702",
			"label": "Jardín",
			"canton": "117"
		},
		{
			"id": "11703",
			"label": "Copey",
			"canton": "117"
		},
		{
			"id": "11801",
			"label": "Curridabat",
			"canton": "118"
		},
		{
			"id": "11802",
			"label": "Granadilla",
			"canton": "118"
		},
		{
			"id": "11803",
			"label": "Sánchez",
			"canton": "118"
		},
		{
			"id": "11804",
			"label": "Tirrases",
			"canton": "118"
		},
		{
			"id": "11901",
			"label": "San Isidro de El General",
			"canton": "119"
		},
		{
			"id": "11902",
			"label": "El General",
			"canton": "119"
		},
		{
			"id": "11903",
			"label": "Daniel Flores",
			"canton": "119"
		},
		{
			"id": "11904",
			"label": "Rivas",
			"canton": "119"
		},
		{
			"id": "11905",
			"label": "San Pedro",
			"canton": "119"
		},
		{
			"id": "11906",
			"label": "Platanares",
			"canton": "119"
		},
		{
			"id": "11907",
			"label": "Pejibaye",
			"canton": "119"
		},
		{
			"id": "11908",
			"label": "Cajón",
			"canton": "119"
		},
		{
			"id": "11909",
			"label": "Barú",
			"canton": "119"
		},
		{
			"id": "11910",
			"label": "Río Nuevo",
			"canton": "119"
		},
		{
			"id": "11911",
			"label": "Páramo",
			"canton": "119"
		},
		{
			"id": "11912",
			"label": "La  Amistad",
			"canton": "119"
		},
		{
			"id": "12001",
			"label": "San Pablo",
			"canton": "120"
		},
		{
			"id": "12002",
			"label": "San Andrés",
			"canton": "120"
		},
		{
			"id": "12003",
			"label": "Llano Bonito",
			"canton": "120"
		},
		{
			"id": "12004",
			"label": "San Isidro",
			"canton": "120"
		},
		{
			"id": "12005",
			"label": "Santa Cruz",
			"canton": "120"
		},
		{
			"id": "12006",
			"label": "San Antonio",
			"canton": "120"
		},
		{
			"id": "20101",
			"label": "Alajuela",
			"canton": "201"
		},
		{
			"id": "20102",
			"label": "San José",
			"canton": "201"
		},
		{
			"id": "20103",
			"label": "Carrizal",
			"canton": "201"
		},
		{
			"id": "20104",
			"label": "San Antonio",
			"canton": "201"
		},
		{
			"id": "20105",
			"label": "Guácima",
			"canton": "201"
		},
		{
			"id": "20106",
			"label": "San Isidro",
			"canton": "201"
		},
		{
			"id": "20107",
			"label": "Sabanilla",
			"canton": "201"
		},
		{
			"id": "20108",
			"label": "San Rafael",
			"canton": "201"
		},
		{
			"id": "20109",
			"label": "Río Segundo",
			"canton": "201"
		},
		{
			"id": "20110",
			"label": "Desamparados",
			"canton": "201"
		},
		{
			"id": "20111",
			"label": "Turrúcares",
			"canton": "201"
		},
		{
			"id": "20112",
			"label": "Tambor",
			"canton": "201"
		},
		{
			"id": "20113",
			"label": "Garita",
			"canton": "201"
		},
		{
			"id": "20114",
			"label": "Sarapiquí",
			"canton": "201"
		},
		{
			"id": "20201",
			"label": "San Ramón",
			"canton": "202"
		},
		{
			"id": "20202",
			"label": "Santiago",
			"canton": "202"
		},
		{
			"id": "20203",
			"label": "San Juan",
			"canton": "202"
		},
		{
			"id": "20204",
			"label": "Piedades Norte",
			"canton": "202"
		},
		{
			"id": "20205",
			"label": "Piedades Sur",
			"canton": "202"
		},
		{
			"id": "20206",
			"label": "San Rafael",
			"canton": "202"
		},
		{
			"id": "20207",
			"label": "San Isidro",
			"canton": "202"
		},
		{
			"id": "20208",
			"label": "Ángeles",
			"canton": "202"
		},
		{
			"id": "20209",
			"label": "Alfaro",
			"canton": "202"
		},
		{
			"id": "20210",
			"label": "Volio",
			"canton": "202"
		},
		{
			"id": "20211",
			"label": "Concepción",
			"canton": "202"
		},
		{
			"id": "20212",
			"label": "Zapotal",
			"canton": "202"
		},
		{
			"id": "20213",
			"label": "Peñas Blancas",
			"canton": "202"
		},
		{
			"id": "20214",
			"label": "San Lorenzo",
			"canton": "202"
		},
		{
			"id": "20301",
			"label": "Grecia",
			"canton": "203"
		},
		{
			"id": "20302",
			"label": "San Isidro",
			"canton": "203"
		},
		{
			"id": "20303",
			"label": "San José",
			"canton": "203"
		},
		{
			"id": "20304",
			"label": "San Roque",
			"canton": "203"
		},
		{
			"id": "20305",
			"label": "Tacares",
			"canton": "203"
		},
		{
			"id": "20307",
			"label": "Puente de Piedra",
			"canton": "203"
		},
		{
			"id": "20308",
			"label": "Bolivar",
			"canton": "203"
		},
		{
			"id": "20401",
			"label": "San Mateo",
			"canton": "204"
		},
		{
			"id": "20402",
			"label": "Desmonte",
			"canton": "204"
		},
		{
			"id": "20403",
			"label": "Jesús María",
			"canton": "204"
		},
		{
			"id": "20404",
			"label": "Labrador",
			"canton": "204"
		},
		{
			"id": "20501",
			"label": "Atenas",
			"canton": "205"
		},
		{
			"id": "20502",
			"label": "Jesús",
			"canton": "205"
		},
		{
			"id": "20503",
			"label": "Mercedes",
			"canton": "205"
		},
		{
			"id": "20504",
			"label": "San Isidro",
			"canton": "205"
		},
		{
			"id": "20505",
			"label": "Concepción",
			"canton": "205"
		},
		{
			"id": "20506",
			"label": "San José",
			"canton": "205"
		},
		{
			"id": "20507",
			"label": "Santa Eulalia",
			"canton": "205"
		},
		{
			"id": "20508",
			"label": "Escobal",
			"canton": "205"
		},
		{
			"id": "20601",
			"label": "Naranjo",
			"canton": "206"
		},
		{
			"id": "20602",
			"label": "San Miguel",
			"canton": "206"
		},
		{
			"id": "20603",
			"label": "San José",
			"canton": "206"
		},
		{
			"id": "20604",
			"label": "Cirrí Sur",
			"canton": "206"
		},
		{
			"id": "20605",
			"label": "San Jerónimo",
			"canton": "206"
		},
		{
			"id": "20606",
			"label": "San Juan",
			"canton": "206"
		},
		{
			"id": "20607",
			"label": "El Rosario",
			"canton": "206"
		},
		{
			"id": "20608",
			"label": "Palmitos",
			"canton": "206"
		},
		{
			"id": "20701",
			"label": "Palmares",
			"canton": "207"
		},
		{
			"id": "20702",
			"label": "Zaragoza",
			"canton": "207"
		},
		{
			"id": "20703",
			"label": "Buenos Aires",
			"canton": "207"
		},
		{
			"id": "20704",
			"label": "Santiago",
			"canton": "207"
		},
		{
			"id": "20705",
			"label": "Candelaria",
			"canton": "207"
		},
		{
			"id": "20706",
			"label": "Esquipulas",
			"canton": "207"
		},
		{
			"id": "20707",
			"label": "La Granja",
			"canton": "207"
		},
		{
			"id": "20801",
			"label": "San Pedro",
			"canton": "208"
		},
		{
			"id": "20802",
			"label": "San Juan",
			"canton": "208"
		},
		{
			"id": "20803",
			"label": "San Rafael",
			"canton": "208"
		},
		{
			"id": "20804",
			"label": "Carrillos",
			"canton": "208"
		},
		{
			"id": "20805",
			"label": "Sabana Redonda",
			"canton": "208"
		},
		{
			"id": "20901",
			"label": "Orotina",
			"canton": "209"
		},
		{
			"id": "20902",
			"label": "El Mastate",
			"canton": "209"
		},
		{
			"id": "20903",
			"label": "Hacienda Vieja",
			"canton": "209"
		},
		{
			"id": "20904",
			"label": "Coyolar",
			"canton": "209"
		},
		{
			"id": "20905",
			"label": "La Ceiba",
			"canton": "209"
		},
		{
			"id": "21001",
			"label": "Quesada",
			"canton": "210"
		},
		{
			"id": "21002",
			"label": "Florencia",
			"canton": "210"
		},
		{
			"id": "21003",
			"label": "Buenavista",
			"canton": "210"
		},
		{
			"id": "21004",
			"label": "Aguas Zarcas",
			"canton": "210"
		},
		{
			"id": "21005",
			"label": "Venecia",
			"canton": "210"
		},
		{
			"id": "21006",
			"label": "Pital",
			"canton": "210"
		},
		{
			"id": "21007",
			"label": "La Fortuna",
			"canton": "210"
		},
		{
			"id": "21008",
			"label": "La Tigra",
			"canton": "210"
		},
		{
			"id": "21009",
			"label": "La Palmera",
			"canton": "210"
		},
		{
			"id": "21010",
			"label": "Venado",
			"canton": "210"
		},
		{
			"id": "21011",
			"label": "Cutris",
			"canton": "210"
		},
		{
			"id": "21012",
			"label": "Monterrey",
			"canton": "210"
		},
		{
			"id": "21013",
			"label": "Pocosol",
			"canton": "210"
		},
		{
			"id": "21101",
			"label": "Zarcero",
			"canton": "211"
		},
		{
			"id": "21102",
			"label": "Laguna",
			"canton": "211"
		},
		{
			"id": "21103",
			"label": "Tapesco",
			"canton": "211"
		},
		{
			"id": "21104",
			"label": "Guadalupe",
			"canton": "211"
		},
		{
			"id": "21105",
			"label": "Palmira",
			"canton": "211"
		},
		{
			"id": "21106",
			"label": "Zapote",
			"canton": "211"
		},
		{
			"id": "21107",
			"label": "Brisas",
			"canton": "211"
		},
		{
			"id": "21201",
			"label": "Sarchí Norte",
			"canton": "212"
		},
		{
			"id": "21202",
			"label": "Sarchí Sur",
			"canton": "212"
		},
		{
			"id": "21203",
			"label": "Toro Amarillo",
			"canton": "212"
		},
		{
			"id": "21204",
			"label": "San Pedro",
			"canton": "212"
		},
		{
			"id": "21205",
			"label": "Rodríguez",
			"canton": "212"
		},
		{
			"id": "21301",
			"label": "Upala",
			"canton": "213"
		},
		{
			"id": "21302",
			"label": "Aguas Claras",
			"canton": "213"
		},
		{
			"id": "21303",
			"label": "San José O Pizote",
			"canton": "213"
		},
		{
			"id": "21304",
			"label": "Bijagua",
			"canton": "213"
		},
		{
			"id": "21305",
			"label": "Delicias",
			"canton": "213"
		},
		{
			"id": "21306",
			"label": "Dos Ríos",
			"canton": "213"
		},
		{
			"id": "21307",
			"label": "Yolillal",
			"canton": "213"
		},
		{
			"id": "21308",
			"label": "Canalete",
			"canton": "213"
		},
		{
			"id": "21401",
			"label": "Los Chiles",
			"canton": "214"
		},
		{
			"id": "21402",
			"label": "Caño Negro",
			"canton": "214"
		},
		{
			"id": "21403",
			"label": "El Amparo",
			"canton": "214"
		},
		{
			"id": "21404",
			"label": "San Jorge",
			"canton": "214"
		},
		{
			"id": "21501",
			"label": "San Rafael",
			"canton": "215"
		},
		{
			"id": "21502",
			"label": "Buenavista",
			"canton": "215"
		},
		{
			"id": "21503",
			"label": "Cote",
			"canton": "215"
		},
		{
			"id": "21504",
			"label": "Katira",
			"canton": "215"
		},
		{
			"id": "21601",
			"label": "Río Cuarto",
			"canton": "216"
		},
		{
			"id": "21602",
			"label": "Santa Rita",
			"canton": "216"
		},
		{
			"id": "21603",
			"label": "Santa Isabel",
			"canton": "216"
		},
		{
			"id": "30101",
			"label": "Oriental",
			"canton": "301"
		},
		{
			"id": "30102",
			"label": "Occidental",
			"canton": "301"
		},
		{
			"id": "30103",
			"label": "Carmen",
			"canton": "301"
		},
		{
			"id": "30104",
			"label": "San Nicolás",
			"canton": "301"
		},
		{
			"id": "30105",
			"label": "Aguacaliente o San Francisco",
			"canton": "301"
		},
		{
			"id": "30106",
			"label": "Guadalupe o Arenilla",
			"canton": "301"
		},
		{
			"id": "30107",
			"label": "Corralillo",
			"canton": "301"
		},
		{
			"id": "30108",
			"label": "Tierra Blanca",
			"canton": "301"
		},
		{
			"id": "30109",
			"label": "Dulce Nombre",
			"canton": "301"
		},
		{
			"id": "30110",
			"label": "Llano Grande",
			"canton": "301"
		},
		{
			"id": "30111",
			"label": "Quebradilla",
			"canton": "301"
		},
		{
			"id": "30201",
			"label": "Paraíso",
			"canton": "302"
		},
		{
			"id": "30202",
			"label": "Santiago",
			"canton": "302"
		},
		{
			"id": "30203",
			"label": "Orosi",
			"canton": "302"
		},
		{
			"id": "30204",
			"label": "Cachí",
			"canton": "302"
		},
		{
			"id": "30205",
			"label": "Llanos de Santa Lucía",
			"canton": "302"
		},
		{
			"id": "30206",
			"label": "Birrisito",
			"canton": "302"
		},
		{
			"id": "30301",
			"label": "Tres Ríos",
			"canton": "303"
		},
		{
			"id": "30302",
			"label": "San Diego",
			"canton": "303"
		},
		{
			"id": "30303",
			"label": "San Juan",
			"canton": "303"
		},
		{
			"id": "30304",
			"label": "San Rafael",
			"canton": "303"
		},
		{
			"id": "30305",
			"label": "Concepción",
			"canton": "303"
		},
		{
			"id": "30306",
			"label": "Dulce Nombre",
			"canton": "303"
		},
		{
			"id": "30307",
			"label": "San Ramón",
			"canton": "303"
		},
		{
			"id": "30308",
			"label": "Río Azul",
			"canton": "303"
		},
		{
			"id": "30401",
			"label": "Juan Viñas",
			"canton": "304"
		},
		{
			"id": "30402",
			"label": "Tucurrique",
			"canton": "304"
		},
		{
			"id": "30403",
			"label": "Pejivalle",
			"canton": "304"
		},
		{
			"id": "30404",
			"label": "La Victoria",
			"canton": "304"
		},
		{
			"id": "30501",
			"label": "Turrialba",
			"canton": "305"
		},
		{
			"id": "30502",
			"label": "La Suiza",
			"canton": "305"
		},
		{
			"id": "30503",
			"label": "Peralta",
			"canton": "305"
		},
		{
			"id": "30504",
			"label": "Santa Cruz",
			"canton": "305"
		},
		{
			"id": "30505",
			"label": "Santa Teresita",
			"canton": "305"
		},
		{
			"id": "30506",
			"label": "Pavones",
			"canton": "305"
		},
		{
			"id": "30507",
			"label": "Tuis",
			"canton": "305"
		},
		{
			"id": "30508",
			"label": "Tayutic",
			"canton": "305"
		},
		{
			"id": "30509",
			"label": "Santa Rosa",
			"canton": "305"
		},
		{
			"id": "30510",
			"label": "Tres Equis",
			"canton": "305"
		},
		{
			"id": "30511",
			"label": "La Isabel",
			"canton": "305"
		},
		{
			"id": "30512",
			"label": "Chirripó",
			"canton": "305"
		},
		{
			"id": "30601",
			"label": "Pacayas",
			"canton": "306"
		},
		{
			"id": "30602",
			"label": "Cervantes",
			"canton": "306"
		},
		{
			"id": "30603",
			"label": "Capellades",
			"canton": "306"
		},
		{
			"id": "30701",
			"label": "San Rafael",
			"canton": "307"
		},
		{
			"id": "30702",
			"label": "Cot",
			"canton": "307"
		},
		{
			"id": "30703",
			"label": "Potrero Cerrado",
			"canton": "307"
		},
		{
			"id": "30704",
			"label": "Cipreses",
			"canton": "307"
		},
		{
			"id": "30705",
			"label": "Santa Rosa",
			"canton": "307"
		},
		{
			"id": "30801",
			"label": "El Tejar",
			"canton": "308"
		},
		{
			"id": "30802",
			"label": "San Isidro",
			"canton": "308"
		},
		{
			"id": "30803",
			"label": "Tobosi",
			"canton": "308"
		},
		{
			"id": "30804",
			"label": "Patio de Agua",
			"canton": "308"
		},
		{
			"id": "40101",
			"label": "Heredia",
			"canton": "401"
		},
		{
			"id": "40102",
			"label": "Mercedes",
			"canton": "401"
		},
		{
			"id": "40103",
			"label": "San Francisco",
			"canton": "401"
		},
		{
			"id": "40104",
			"label": "Ulloa",
			"canton": "401"
		},
		{
			"id": "40105",
			"label": "Varablanca",
			"canton": "401"
		},
		{
			"id": "40201",
			"label": "Barva",
			"canton": "402"
		},
		{
			"id": "40202",
			"label": "San Pedro",
			"canton": "402"
		},
		{
			"id": "40203",
			"label": "San Pablo",
			"canton": "402"
		},
		{
			"id": "40204",
			"label": "San Roque",
			"canton": "402"
		},
		{
			"id": "40205",
			"label": "Santa Lucía",
			"canton": "402"
		},
		{
			"id": "40206",
			"label": "San José de la Montaña",
			"canton": "402"
		},
		{
			"id": "40207",
			"label": "Puente Salas",
			"canton": "402"
		},
		{
			"id": "40301",
			"label": "Santo Domingo",
			"canton": "403"
		},
		{
			"id": "40302",
			"label": "San Vicente",
			"canton": "403"
		},
		{
			"id": "40303",
			"label": "San Miguel",
			"canton": "403"
		},
		{
			"id": "40304",
			"label": "Paracito",
			"canton": "403"
		},
		{
			"id": "40305",
			"label": "Santo Tomás",
			"canton": "403"
		},
		{
			"id": "40306",
			"label": "Santa Rosa",
			"canton": "403"
		},
		{
			"id": "40307",
			"label": "Tures",
			"canton": "403"
		},
		{
			"id": "40308",
			"label": "Pará",
			"canton": "403"
		},
		{
			"id": "40401",
			"label": "Santa Bárbara",
			"canton": "404"
		},
		{
			"id": "40402",
			"label": "San Pedro",
			"canton": "404"
		},
		{
			"id": "40403",
			"label": "San Juan",
			"canton": "404"
		},
		{
			"id": "40404",
			"label": "Jesús",
			"canton": "404"
		},
		{
			"id": "40405",
			"label": "Santo Domingo",
			"canton": "404"
		},
		{
			"id": "40406",
			"label": "Purabá",
			"canton": "404"
		},
		{
			"id": "40501",
			"label": "San Rafael",
			"canton": "405"
		},
		{
			"id": "40502",
			"label": "San Josecito",
			"canton": "405"
		},
		{
			"id": "40503",
			"label": "Santiago",
			"canton": "405"
		},
		{
			"id": "40504",
			"label": "Ángeles",
			"canton": "405"
		},
		{
			"id": "40505",
			"label": "Concepción",
			"canton": "405"
		},
		{
			"id": "40601",
			"label": "San Isidro",
			"canton": "406"
		},
		{
			"id": "40602",
			"label": "San José",
			"canton": "406"
		},
		{
			"id": "40603",
			"label": "Concepción",
			"canton": "406"
		},
		{
			"id": "40604",
			"label": "San Francisco",
			"canton": "406"
		},
		{
			"id": "40701",
			"label": "San Antonio",
			"canton": "407"
		},
		{
			"id": "40702",
			"label": "La Ribera",
			"canton": "407"
		},
		{
			"id": "40703",
			"label": "La Asunción",
			"canton": "407"
		},
		{
			"id": "40801",
			"label": "San Joaquín",
			"canton": "408"
		},
		{
			"id": "40802",
			"label": "Barrantes",
			"canton": "408"
		},
		{
			"id": "40803",
			"label": "Llorente",
			"canton": "408"
		},
		{
			"id": "40901",
			"label": "San Pablo",
			"canton": "409"
		},
		{
			"id": "40902",
			"label": "Rincón de Sabanilla",
			"canton": "409"
		},
		{
			"id": "41001",
			"label": "Puerto Viejo",
			"canton": "410"
		},
		{
			"id": "41002",
			"label": "La Virgen",
			"canton": "410"
		},
		{
			"id": "41003",
			"label": "Las Horquetas",
			"canton": "410"
		},
		{
			"id": "41004",
			"label": "Llanuras del Gaspar",
			"canton": "410"
		},
		{
			"id": "41005",
			"label": "Cureña",
			"canton": "410"
		},
		{
			"id": "50101",
			"label": "Liberia",
			"canton": "501"
		},
		{
			"id": "50102",
			"label": "Cañas Dulces",
			"canton": "501"
		},
		{
			"id": "50103",
			"label": "Mayorga",
			"canton": "501"
		},
		{
			"id": "50104",
			"label": "Nacascolo",
			"canton": "501"
		},
		{
			"id": "50105",
			"label": "Curubandé",
			"canton": "501"
		},
		{
			"id": "50201",
			"label": "Nicoya",
			"canton": "502"
		},
		{
			"id": "50202",
			"label": "Mansión",
			"canton": "502"
		},
		{
			"id": "50203",
			"label": "San Antonio",
			"canton": "502"
		},
		{
			"id": "50204",
			"label": "Quebrada Honda",
			"canton": "502"
		},
		{
			"id": "50205",
			"label": "Sámara",
			"canton": "502"
		},
		{
			"id": "50206",
			"label": "Nosara",
			"canton": "502"
		},
		{
			"id": "50207",
			"label": "Belén de Nosarita",
			"canton": "502"
		},
		{
			"id": "50301",
			"label": "Santa Cruz",
			"canton": "503"
		},
		{
			"id": "50302",
			"label": "Bolsón",
			"canton": "503"
		},
		{
			"id": "50303",
			"label": "Veintisiete de Abril",
			"canton": "503"
		},
		{
			"id": "50304",
			"label": "Tempate",
			"canton": "503"
		},
		{
			"id": "50305",
			"label": "Cartagena",
			"canton": "503"
		},
		{
			"id": "50306",
			"label": "Cuajiniquil",
			"canton": "503"
		},
		{
			"id": "50307",
			"label": "Diriá",
			"canton": "503"
		},
		{
			"id": "50308",
			"label": "Cabo Velas",
			"canton": "503"
		},
		{
			"id": "50309",
			"label": "Tamarindo",
			"canton": "503"
		},
		{
			"id": "50401",
			"label": "Bagaces",
			"canton": "504"
		},
		{
			"id": "50402",
			"label": "La Fortuna",
			"canton": "504"
		},
		{
			"id": "50403",
			"label": "Mogote",
			"canton": "504"
		},
		{
			"id": "50404",
			"label": "Río Naranjo",
			"canton": "504"
		},
		{
			"id": "50405",
			"label": "Pijije",
			"canton": "504"
		},
		{
			"id": "50501",
			"label": "Filadelfia",
			"canton": "505"
		},
		{
			"id": "50502",
			"label": "Palmira",
			"canton": "505"
		},
		{
			"id": "50503",
			"label": "Sardinal",
			"canton": "505"
		},
		{
			"id": "50504",
			"label": "Belén",
			"canton": "505"
		},
		{
			"id": "50601",
			"label": "Cañas",
			"canton": "506"
		},
		{
			"id": "50602",
			"label": "Palmira",
			"canton": "506"
		},
		{
			"id": "50603",
			"label": "San Miguel",
			"canton": "506"
		},
		{
			"id": "50604",
			"label": "Bebedero",
			"canton": "506"
		},
		{
			"id": "50605",
			"label": "Porozal",
			"canton": "506"
		},
		{
			"id": "50701",
			"label": "Las Juntas",
			"canton": "507"
		},
		{
			"id": "50702",
			"label": "Sierra",
			"canton": "507"
		},
		{
			"id": "50703",
			"label": "San Juan",
			"canton": "507"
		},
		{
			"id": "50704",
			"label": "Colorado",
			"canton": "507"
		},
		{
			"id": "50801",
			"label": "Tilarán",
			"canton": "508"
		},
		{
			"id": "50802",
			"label": "Quebrada Grande",
			"canton": "508"
		},
		{
			"id": "50803",
			"label": "Tronadora",
			"canton": "508"
		},
		{
			"id": "50804",
			"label": "Santa Rosa",
			"canton": "508"
		},
		{
			"id": "50805",
			"label": "Líbano",
			"canton": "508"
		},
		{
			"id": "50806",
			"label": "Tierras Morenas",
			"canton": "508"
		},
		{
			"id": "50807",
			"label": "Arenal",
			"canton": "508"
		},
		{
			"id": "50808",
			"label": "Cabeceras",
			"canton": "508"
		},
		{
			"id": "50901",
			"label": "Carmona",
			"canton": "509"
		},
		{
			"id": "50902",
			"label": "Santa Rita",
			"canton": "509"
		},
		{
			"id": "50903",
			"label": "Zapotal",
			"canton": "509"
		},
		{
			"id": "50904",
			"label": "San Pablo",
			"canton": "509"
		},
		{
			"id": "50905",
			"label": "Porvenir",
			"canton": "509"
		},
		{
			"id": "50906",
			"label": "Bejuco",
			"canton": "509"
		},
		{
			"id": "51001",
			"label": "La Cruz",
			"canton": "510"
		},
		{
			"id": "51002",
			"label": "Santa Cecilia",
			"canton": "510"
		},
		{
			"id": "51003",
			"label": "La Garita",
			"canton": "510"
		},
		{
			"id": "51004",
			"label": "Santa Elena",
			"canton": "510"
		},
		{
			"id": "51101",
			"label": "Hojancha",
			"canton": "511"
		},
		{
			"id": "51102",
			"label": "Monte Romo",
			"canton": "511"
		},
		{
			"id": "51103",
			"label": "Puerto Carrillo",
			"canton": "511"
		},
		{
			"id": "51104",
			"label": "Huacas",
			"canton": "511"
		},
		{
			"id": "51105",
			"label": "Matambú",
			"canton": "511"
		},
		{
			"id": "60101",
			"label": "Puntarenas",
			"canton": "601"
		},
		{
			"id": "60102",
			"label": "Pitahaya",
			"canton": "601"
		},
		{
			"id": "60103",
			"label": "Chomes",
			"canton": "601"
		},
		{
			"id": "60104",
			"label": "Lepanto",
			"canton": "601"
		},
		{
			"id": "60105",
			"label": "Paquera",
			"canton": "601"
		},
		{
			"id": "60106",
			"label": "Manzanillo",
			"canton": "601"
		},
		{
			"id": "60107",
			"label": "Guacimal",
			"canton": "601"
		},
		{
			"id": "60108",
			"label": "Barranca",
			"canton": "601"
		},
		{
			"id": "60110",
			"label": "Isla del Coco",
			"canton": "601"
		},
		{
			"id": "60111",
			"label": "Cóbano",
			"canton": "601"
		},
		{
			"id": "60112",
			"label": "Chacarita",
			"canton": "601"
		},
		{
			"id": "60113",
			"label": "Chira",
			"canton": "601"
		},
		{
			"id": "60114",
			"label": "Acapulco",
			"canton": "601"
		},
		{
			"id": "60115",
			"label": "El Roble",
			"canton": "601"
		},
		{
			"id": "60116",
			"label": "Arancibia",
			"canton": "601"
		},
		{
			"id": "60201",
			"label": "Espíritu Santo",
			"canton": "602"
		},
		{
			"id": "60202",
			"label": "San Juan Grande",
			"canton": "602"
		},
		{
			"id": "60203",
			"label": "Macacona",
			"canton": "602"
		},
		{
			"id": "60204",
			"label": "San Rafael",
			"canton": "602"
		},
		{
			"id": "60205",
			"label": "San Jerónimo",
			"canton": "602"
		},
		{
			"id": "60206",
			"label": "Caldera",
			"canton": "602"
		},
		{
			"id": "60301",
			"label": "Buenos Aires",
			"canton": "603"
		},
		{
			"id": "60302",
			"label": "Volcán",
			"canton": "603"
		},
		{
			"id": "60303",
			"label": "Potrero Grande",
			"canton": "603"
		},
		{
			"id": "60304",
			"label": "Boruca",
			"canton": "603"
		},
		{
			"id": "60305",
			"label": "Pilas",
			"canton": "603"
		},
		{
			"id": "60306",
			"label": "Colinas",
			"canton": "603"
		},
		{
			"id": "60307",
			"label": "Chánguena",
			"canton": "603"
		},
		{
			"id": "60308",
			"label": "Biolley",
			"canton": "603"
		},
		{
			"id": "60309",
			"label": "Brunka",
			"canton": "603"
		},
		{
			"id": "60310",
			"label": "Cabagra",
			"canton": "603"
		},
		{
			"id": "60401",
			"label": "Miramar",
			"canton": "604"
		},
		{
			"id": "60402",
			"label": "La Unión",
			"canton": "604"
		},
		{
			"id": "60403",
			"label": "San Isidro",
			"canton": "604"
		},
		{
			"id": "60501",
			"label": "Puerto Cortés",
			"canton": "605"
		},
		{
			"id": "60502",
			"label": "Palmar",
			"canton": "605"
		},
		{
			"id": "60503",
			"label": "Sierpe",
			"canton": "605"
		},
		{
			"id": "60504",
			"label": "Bahía Ballena",
			"canton": "605"
		},
		{
			"id": "60505",
			"label": "Piedras Blancas",
			"canton": "605"
		},
		{
			"id": "60506",
			"label": "Bahía Drake",
			"canton": "605"
		},
		{
			"id": "60601",
			"label": "Quepos",
			"canton": "606"
		},
		{
			"id": "60602",
			"label": "Savegre",
			"canton": "606"
		},
		{
			"id": "60603",
			"label": "Naranjito",
			"canton": "606"
		},
		{
			"id": "60701",
			"label": "Golfito",
			"canton": "607"
		},
		{
			"id": "60703",
			"label": "Guaycará",
			"canton": "607"
		},
		{
			"id": "60704",
			"label": "Pavón",
			"canton": "607"
		},
		{
			"id": "60801",
			"label": "San Vito",
			"canton": "608"
		},
		{
			"id": "60802",
			"label": "Sabalito",
			"canton": "608"
		},
		{
			"id": "60803",
			"label": "Aguabuena",
			"canton": "608"
		},
		{
			"id": "60804",
			"label": "Limoncito",
			"canton": "608"
		},
		{
			"id": "60805",
			"label": "Pittier",
			"canton": "608"
		},
		{
			"id": "60806",
			"label": "Gutiérrez Braun",
			"canton": "608"
		},
		{
			"id": "60901",
			"label": "Parrita",
			"canton": "609"
		},
		{
			"id": "61001",
			"label": "Corredor",
			"canton": "610"
		},
		{
			"id": "61002",
			"label": "La Cuesta",
			"canton": "610"
		},
		{
			"id": "61003",
			"label": "Canoas",
			"canton": "610"
		},
		{
			"id": "61004",
			"label": "Laurel",
			"canton": "610"
		},
		{
			"id": "61101",
			"label": "Jacó",
			"canton": "611"
		},
		{
			"id": "61102",
			"label": "Tárcoles",
			"canton": "611"
		},
		{
			"id": "61103",
			"label": "Lagunillas",
			"canton": "611"
		},
		{
			"id": "61201",
			"label": "Monteverde",
			"canton": "612"
		},
		{
			"id": "61301",
			"label": "Puerto Jiménez",
			"canton": "613"
		},
		{
			"id": "70101",
			"label": "Limón",
			"canton": "701"
		},
		{
			"id": "70102",
			"label": "Valle La Estrella",
			"canton": "701"
		},
		{
			"id": "70103",
			"label": "Río Blanco",
			"canton": "701"
		},
		{
			"id": "70104",
			"label": "Matama",
			"canton": "701"
		},
		{
			"id": "70201",
			"label": "Guápiles",
			"canton": "702"
		},
		{
			"id": "70202",
			"label": "Jiménez",
			"canton": "702"
		},
		{
			"id": "70203",
			"label": "Rita",
			"canton": "702"
		},
		{
			"id": "70204",
			"label": "Roxana",
			"canton": "702"
		},
		{
			"id": "70205",
			"label": "Cariari",
			"canton": "702"
		},
		{
			"id": "70206",
			"label": "Colorado",
			"canton": "702"
		},
		{
			"id": "70207",
			"label": "La Colonia",
			"canton": "702"
		},
		{
			"id": "70301",
			"label": "Siquirres",
			"canton": "703"
		},
		{
			"id": "70302",
			"label": "Pacuarito",
			"canton": "703"
		},
		{
			"id": "70303",
			"label": "Florida",
			"canton": "703"
		},
		{
			"id": "70304",
			"label": "Germania",
			"canton": "703"
		},
		{
			"id": "70305",
			"label": "El Cairo",
			"canton": "703"
		},
		{
			"id": "70306",
			"label": "Alegría",
			"canton": "703"
		},
		{
			"id": "70307",
			"label": "Reventazón",
			"canton": "703"
		},
		{
			"id": "70401",
			"label": "Bratsi",
			"canton": "704"
		},
		{
			"id": "70402",
			"label": "Sixaola",
			"canton": "704"
		},
		{
			"id": "70403",
			"label": "Cahuita",
			"canton": "704"
		},
		{
			"id": "70404",
			"label": "Telire",
			"canton": "704"
		},
		{
			"id": "70501",
			"label": "Matina",
			"canton": "705"
		},
		{
			"id": "70502",
			"label": "Batán",
			"canton": "705"
		},
		{
			"id": "70503",
			"label": "Carrandí",
			"canton": "705"
		},
		{
			"id": "70601",
			"label": "Guácimo",
			"canton": "706"
		},
		{
			"id": "70602",
			"label": "Mercedes",
			"canton": "706"
		},
		{
			"id": "70603",
			"label": "Pocora",
			"canton": "706"
		},
		{
			"id": "70604",
			"label": "Río Jiménez",
			"canton": "706"
		},
		{
			"id": "70605",
			"label": "Duacarí",
			"canton": "706"
		}
	]
};
costa_rica_locations_default.provinces;
var provinceById = new Map(costa_rica_locations_default.provinces.map((item) => [item.id, item]));
var cantonById = new Map(costa_rica_locations_default.cantons.map((item) => [item.id, item]));
var districtById = new Map(costa_rica_locations_default.districts.map((item) => [item.id, item]));
function validateContactLocation(data) {
	const code = (key) => {
		if (data[key] === void 0) return "";
		if (typeof data[key] !== "string") throw new Error("INPUT_INVALID");
		return data[key].trim();
	};
	const province = code("province"), canton = code("canton"), district = code("district");
	if (province && !provinceById.has(province) || canton && (!province || cantonById.get(canton)?.province !== province) || district && (!canton || districtById.get(district)?.canton !== canton)) throw new Error("INPUT_INVALID");
	return {
		province,
		canton,
		district
	};
}
function contactLocationLabels(data) {
	const location = validateContactLocation(data);
	return {
		province: provinceById.get(location.province)?.label ?? "",
		canton: cantonById.get(location.canton)?.label ?? "",
		district: districtById.get(location.district)?.label ?? ""
	};
}
//#endregion
//#region lib/gaming/server.ts
var REGISTERED_GAMES_SQL = `SELECT s.id,s.device,s.game,s.validated_score score,s.started,s.ended achieved,s.version,
  COALESCE(r.participant,p.id) participant,COALESCE(r.name,p.name) name,COALESCE(r.email,p.email) email,
  COALESCE(r.phone,p.phone) phone,COALESCE(r.nickname,p.nickname) nickname,
  COALESCE(r.terms,p.terms) consent,COALESCE(r.updated,p.updated) updated
  FROM sessions s LEFT JOIN registrations r ON r.id=s.id LEFT JOIN participants p ON p.id=s.participant
  WHERE s.status='completed' AND (r.id IS NOT NULL OR p.id IS NOT NULL)`;
function costaRicaDay(now = Date.now()) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: GAME_CONFIG$4.TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(now);
}
function periodBounds(now = Date.now()) {
	const day = costaRicaDay(now), date = /* @__PURE__ */ new Date(`${day}T00:00:00-06:00`);
	if (GAME_CONFIG$4.RANKING_PERIOD === "weekly") {
		const weekday = date.getUTCDay();
		const start = date.getTime() - (weekday + 6) % 7 * 864e5;
		return [start, start + 7 * 864e5];
	}
	if (GAME_CONFIG$4.RANKING_PERIOD === "monthly") {
		const [year, month] = day.split("-").map(Number);
		return [Date.UTC(year, month - 1, 1, 6), Date.UTC(year, month, 1, 6)];
	}
	return [(/* @__PURE__ */ new Date(`${GAME_CONFIG$4.RANKING_START}T00:00:00-06:00`)).getTime(), (/* @__PURE__ */ new Date(`${GAME_CONFIG$4.RANKING_END}T23:59:59-06:00`)).getTime()];
}
var CompetitionStore = class {
	constructor(path) {
		if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
		this.db = new DatabaseSync(path);
		this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL, created INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS participants(id TEXT PRIMARY KEY, device TEXT UNIQUE NOT NULL REFERENCES devices(id), name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, nickname TEXT NOT NULL, nickname_key TEXT UNIQUE NOT NULL, terms INTEGER NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, device TEXT NOT NULL REFERENCES devices(id), participant TEXT REFERENCES participants(id), game TEXT NOT NULL, seed INTEGER NOT NULL, started INTEGER NOT NULL, ended INTEGER, status TEXT NOT NULL, attempt INTEGER NOT NULL, day TEXT NOT NULL, raw_score INTEGER NOT NULL DEFAULT 0, validated_score INTEGER NOT NULL DEFAULT 0, reason TEXT, inputs TEXT NOT NULL DEFAULT '[]', sim_ms INTEGER NOT NULL DEFAULT 0, version TEXT NOT NULL, heartbeat INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS session_attempts ON sessions(device, game, day);
      CREATE INDEX IF NOT EXISTS session_ranking ON sessions(game, status, started, participant);
      CREATE UNIQUE INDEX IF NOT EXISTS one_active_game ON sessions(device) WHERE status='playing';
      CREATE TABLE IF NOT EXISTS start_requests(device TEXT NOT NULL REFERENCES devices(id), request TEXT NOT NULL, session TEXT NOT NULL REFERENCES sessions(id), PRIMARY KEY(device,request));`);
		this.db.exec(`CREATE TABLE IF NOT EXISTS registrations(id TEXT PRIMARY KEY REFERENCES sessions(id),participant TEXT NOT NULL,device TEXT NOT NULL REFERENCES devices(id),name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,nickname TEXT NOT NULL,nickname_key TEXT NOT NULL,terms INTEGER NOT NULL,created INTEGER NOT NULL,updated INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS registration_nicknames ON registrations(nickname_key,device);`);
		this.db.exec(`CREATE TABLE IF NOT EXISTS contact_messages(id TEXT PRIMARY KEY,request TEXT UNIQUE NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,message TEXT NOT NULL,consent INTEGER NOT NULL,created INTEGER NOT NULL);`);
		this.db.exec("CREATE TABLE IF NOT EXISTS sheet_sync(kind TEXT NOT NULL,id TEXT NOT NULL,hash TEXT NOT NULL,PRIMARY KEY(kind,id));");
		const contactColumns = this.db.prepare("PRAGMA table_info(contact_messages)").all();
		for (const column of [
			"province",
			"canton",
			"district"
		]) if (!contactColumns.some((item) => item.name === column)) this.db.exec(`ALTER TABLE contact_messages ADD COLUMN ${column} TEXT NOT NULL DEFAULT '';`);
	}
	device(token) {
		if (token) {
			const row = this.db.prepare("SELECT id, token FROM devices WHERE token=?").get(token);
			if (row) return row;
		}
		const row = {
			id: randomUUID(),
			token: randomBytes(32).toString("hex")
		};
		this.db.prepare("INSERT INTO devices VALUES(?,?,?)").run(row.id, row.token, Date.now());
		return row;
	}
	contact(data) {
		const value = (key, max) => typeof data[key] === "string" ? data[key].trim().slice(0, max) : "";
		const request = value("request", 36), name = value("name", 100), email = value("email", 150), phone = value("phone", 25), message = value("message", 3e3);
		if (!/^[a-f0-9-]{36}$/.test(request) || name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || message.length < 10 || data.consent !== true || data.website) throw new Error("INPUT_INVALID");
		const location = validateContactLocation(data);
		const previous = this.db.prepare("SELECT id FROM contact_messages WHERE request=?").get(request);
		if (previous) return {
			saved: true,
			id: previous.id
		};
		const id = randomUUID();
		this.db.prepare("INSERT INTO contact_messages(id,request,name,email,phone,message,consent,created,province,canton,district) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(id, request, name, email, phone, message, 1, Date.now(), location.province, location.canton, location.district);
		return {
			saved: true,
			id
		};
	}
	usedAttempts(device, game) {
		return this.db.prepare("SELECT COUNT(*) AS n FROM sessions WHERE device=? AND game=? AND day=?").get(device, game, costaRicaDay()).n;
	}
	attempts(device, localTesting = false) {
		return Object.fromEntries(ACTIVE_GAMES.map((game) => {
			const used = localTesting ? 0 : this.usedAttempts(device, game);
			return [game, Math.max(0, GAME_CONFIG$4.DAILY_ATTEMPTS - used)];
		}));
	}
	participant(device) {
		return this.db.prepare("SELECT participant id,nickname FROM registrations WHERE device=? ORDER BY created DESC,rowid DESC LIMIT 1").get(device) ?? this.db.prepare("SELECT id,nickname FROM participants WHERE device=?").get(device);
	}
	start(device, game, request = randomUUID(), localTesting = false) {
		if (!isActiveGame(game)) throw new Error("GAME_INVALID");
		if (!/^[a-f0-9-]{36}$/.test(request)) throw new Error("INPUT_INVALID");
		this.db.exec("BEGIN IMMEDIATE");
		try {
			const existing = this.db.prepare("SELECT session FROM start_requests WHERE device=? AND request=?").get(device, request);
			if (existing) {
				const row = this.session(device, existing.session);
				if (row.game !== game) throw new Error("GAME_INVALID");
				this.db.exec("COMMIT");
				return {
					id: row.id,
					seed: row.seed,
					game,
					attempt: row.attempt,
					configVersion: row.version
				};
			}
			this.db.prepare("UPDATE sessions SET status='abandoned', reason='reload', ended=? WHERE device=? AND status='playing'").run(Date.now(), device);
			if (!this.attempts(device, localTesting)[game]) throw new Error("NO_ATTEMPTS");
			const id = randomUUID(), seed = this.sessionSeed(game), now = Date.now(), attempt = this.usedAttempts(device, game) + 1;
			this.db.prepare("INSERT INTO sessions(id,device,participant,game,seed,started,status,attempt,day,version,heartbeat) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(id, device, null, game, seed, now, "playing", attempt, costaRicaDay(), GAME_CONFIG$4.VERSION, now);
			this.db.prepare("INSERT INTO start_requests VALUES(?,?,?)").run(device, request, id);
			this.db.exec("COMMIT");
			return {
				id,
				seed,
				game,
				attempt,
				configVersion: GAME_CONFIG$4.VERSION
			};
		} catch (error) {
			this.db.exec("ROLLBACK");
			throw error;
		}
	}
	sessionSeed(game) {
		const debug = process.env.REPLAY_SESSION_SEED;
		if (process.env.NODE_ENV === "development" && GAME_CONFIG$4.ENABLE_DEBUG_SEED_REPLAY && debug !== void 0) {
			if (!/^[0-9]+$/.test(debug) || Number(debug) > 4294967295) throw new Error("INPUT_INVALID");
			return Number(debug);
		}
		let seed = randomBytes(4).readUInt32LE();
		while (this.db.prepare("SELECT id FROM sessions WHERE game=? AND seed=? AND version=?").get(game, seed, GAME_CONFIG$4.VERSION)) seed = randomBytes(4).readUInt32LE();
		return seed;
	}
	session(device, id) {
		const row = this.db.prepare("SELECT * FROM sessions WHERE id=? AND device=?").get(id, device);
		if (!row) throw new Error("SESSION_INVALID");
		return row;
	}
	validate(device, id, inputs, simMs, rawScore, mode) {
		const row = this.session(device, id);
		if (row.status !== "playing") {
			if (mode === "checkpoint" && row.ended) return { saved: true };
			if (mode !== "checkpoint" && row.ended) return this.result(device, id);
			throw new Error("SESSION_INVALID");
		}
		if (mode === "checkpoint" && simMs < row.sim_ms) return { saved: true };
		if (![
			GAME_CONFIG$4.VERSION,
			"lif-games-20261007-calibrated-v4",
			"lif-games-20261007-restored-v3",
			"lif-games-20261007-unified-v2",
			"lif-games-20261007-memory-v1",
			"lif-games-20261002-v2"
		].includes(row.version)) throw new Error("SESSION_VERSION");
		if (!Number.isInteger(simMs) || simMs < row.sim_ms || simMs > 36e5 || simMs % GAME_CONFIG$4.STEP_MS !== 0 || !Number.isSafeInteger(rawScore) || rawScore < 0 || !Array.isArray(inputs) || inputs.length > 12e3) throw new Error("SCORE_INVALID");
		if (simMs > Date.now() - row.started + 2e3) throw new Error("TIME_INVALID");
		let previous = -1;
		for (const input of inputs) {
			if (!Number.isInteger(input.at) || input.at < previous || input.at > simMs || input.at % GAME_CONFIG$4.STEP_MS !== 0 || (row.game === "memory_lif" ? input.direction !== void 0 || input.lane !== void 0 || !(Number.isInteger(input.slot) && input.slot >= 0 && input.slot < 16 && input.action === void 0 || input.slot === void 0 && ["peek", "radar"].includes(input.action ?? "")) : input.slot !== void 0 || input.action !== void 0 || (row.game === "catch" ? !(input.lane !== void 0 && Number.isInteger(input.lane) && input.lane >= 0 && input.lane <= 4 || ["left", "right"].includes(input.direction ?? "")) : ![
				"up",
				"down",
				"left",
				"right"
			].includes(input.direction ?? "") || input.lane !== void 0))) throw new Error("INPUT_INVALID");
			previous = input.at;
		}
		const saved = JSON.parse(row.inputs);
		if (JSON.stringify(inputs.slice(0, saved.length)) !== JSON.stringify(saved)) throw new Error("INPUT_REWRITTEN");
		const state = replayGame(row.game, row.seed, inputs, simMs, row.version);
		if (state.ms !== simMs) throw new Error("TIME_INVALID");
		if (rawScore !== state.score) throw new Error("SCORE_INVALID");
		if (mode === "finish" && !state.ended) throw new Error("GAME_NOT_FINISHED");
		const status = mode === "abandon" ? "abandoned" : mode === "finish" ? "completed" : "playing";
		this.db.prepare("UPDATE sessions SET inputs=?,sim_ms=?,raw_score=?,validated_score=?,heartbeat=?,status=?,ended=?,reason=? WHERE id=?").run(JSON.stringify(inputs), simMs, rawScore, state.score, Date.now(), status, status === "playing" ? null : Date.now(), status === "abandoned" ? "exit" : state.ended, id);
		return mode === "checkpoint" ? { saved: true } : this.result(device, id);
	}
	leaderboard(game = "all", device, limit = GAME_CONFIG$4.LEADERBOARD_SIZE, participant) {
		const [start, end] = periodBounds();
		if (game !== "all" && !isActiveGame(game)) throw new Error("GAME_INVALID");
		const rows = this.db.prepare(`WITH registered AS (${REGISTERED_GAMES_SQL}), personal AS (
        SELECT participant,nickname,game,score,achieved,
          ROW_NUMBER() OVER (PARTITION BY participant ORDER BY score DESC,achieved ASC,id ASC) choice
        FROM registered WHERE (?='all' OR game=?) AND game IN ('memory_lif','snake') AND version IN (${RANKING_VERSIONS.map(() => "?").join(",")}) AND started BETWEEN ? AND ?
      ) SELECT nickname,game,score,participant,ROW_NUMBER() OVER (ORDER BY score DESC,achieved ASC,participant ASC) position FROM personal WHERE choice=1 ORDER BY position`).all(game, game, ...RANKING_VERSIONS, start, end);
		const own = participant ?? (device ? this.participant(device)?.id : void 0);
		const publicRow = ({ nickname, score, position, game }) => ({
			nickname,
			score,
			position,
			game
		});
		return {
			top: rows.slice(0, Math.max(1, Math.min(GAME_CONFIG$4.LEADERBOARD_MAX_SIZE, Number.isFinite(limit) ? Math.floor(limit) : GAME_CONFIG$4.LEADERBOARD_SIZE))).map(publicRow),
			position: rows.find((r) => r.participant === own)?.position ?? null,
			best: rows.find((r) => r.participant === own)?.score ?? 0,
			total: rows.length,
			period: GAME_CONFIG$4.RANKING_PERIOD
		};
	}
	result(device, id) {
		const session = this.session(device, id);
		const participant = this.db.prepare("SELECT participant FROM registrations WHERE id=?").get(id)?.participant ?? session.participant;
		const ranking = participant ? this.leaderboard("all", void 0, GAME_CONFIG$4.LEADERBOARD_SIZE, participant) : null;
		const best = this.db.prepare(`WITH registered AS (${REGISTERED_GAMES_SQL}) SELECT MAX(score) n FROM registered WHERE participant=? AND game IN ('memory_lif','snake') AND version IN (${RANKING_VERSIONS.map(() => "?").join(",")})`).get(participant, ...RANKING_VERSIONS);
		const previous = this.db.prepare(`WITH registered AS (${REGISTERED_GAMES_SQL}) SELECT MAX(score) n FROM registered WHERE participant=? AND game IN ('memory_lif','snake') AND version IN (${RANKING_VERSIONS.map(() => "?").join(",")}) AND id<>? AND achieved<=?`).get(participant, ...RANKING_VERSIONS, id, session.ended ?? Date.now());
		return {
			id,
			score: session.validated_score,
			reason: session.reason,
			best: best.n ?? session.validated_score,
			newBest: !!participant && session.validated_score > (previous.n ?? 0),
			position: ranking?.position ?? null,
			attempts: this.attempts(device)
		};
	}
	register(device, id, data) {
		const session = this.session(device, id);
		if (session.status !== "completed") throw new Error("SESSION_INVALID");
		const field = (name, max) => typeof data[name] === "string" ? data[name].trim().slice(0, max) : "";
		const name = field("name", 100), email = field("email", 150).toLowerCase(), phone = field("phone", 25), nickname = normalizeNickname(typeof data.nickname === "string" ? data.nickname : "");
		if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[+\d ()-]{8,25}$/.test(phone) || nicknameValidationMessage(nickname) || data.terms !== true) throw new Error("REGISTRATION_INVALID");
		const nicknameKey = nickname.toLocaleLowerCase("es-CR"), now = Date.now();
		try {
			this.db.exec("BEGIN IMMEDIATE");
			const saved = this.db.prepare("SELECT name,email,phone,nickname FROM registrations WHERE id=?").get(id) ?? (session.participant ? this.db.prepare("SELECT name,email,phone,nickname FROM participants WHERE id=?").get(session.participant) : void 0);
			if (saved) {
				if (saved.name !== name || saved.email !== email || saved.phone !== phone || saved.nickname !== nickname) throw new Error("REGISTRATION_LOCKED");
				this.db.exec("COMMIT");
				return this.result(device, id);
			}
			const owners = this.db.prepare(`SELECT id participant,device FROM participants WHERE nickname_key=?
        UNION ALL SELECT participant,device FROM registrations WHERE nickname_key=?`).all(nicknameKey, nicknameKey);
			if (owners.some((owner) => owner.device !== device)) throw new Error("NICKNAME_TAKEN");
			const participant = owners[0]?.participant ?? randomUUID();
			this.db.prepare("INSERT INTO registrations VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(id, participant, device, name, email, phone, nickname, nicknameKey, now, now, now);
			this.db.exec("COMMIT");
		} catch (error) {
			this.db.exec("ROLLBACK");
			throw error;
		}
		return this.result(device, id);
	}
};
//#endregion
//#region lib/gaming/competition-state.ts
var tables = [
	"devices",
	"participants",
	"sessions",
	"start_requests",
	"contact_messages",
	"sheet_sync",
	"registrations"
];
function exportCompetitionState(store) {
	const snapshot = JSON.stringify({
		version: 1,
		tables: Object.fromEntries(tables.map((table) => [table, store.db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]))
	});
	if (snapshot.length > 6e6) throw new Error("STATE_CAPACITY");
	return snapshot;
}
function importCompetitionState(store, snapshot) {
	if (snapshot === null) return;
	try {
		if (!snapshot || snapshot.length > 6e6) throw new Error("size");
		const data = JSON.parse(snapshot);
		if (data?.version === 1 && data.tables && !("registrations" in data.tables)) data.tables.registrations = [];
		if (data?.version !== 1 || !data.tables || Object.keys(data.tables).sort().join("|") !== [...tables].sort().join("|")) throw new Error("schema");
		store.db.exec("BEGIN IMMEDIATE");
		for (const table of tables) {
			const columns = store.db.prepare(`PRAGMA table_info(${table})`).all().map((column) => column.name);
			const rows = data.tables[table];
			if (!Array.isArray(rows)) throw new Error("rows");
			const insert = store.db.prepare(`INSERT INTO ${table}(${columns.join(",")}) VALUES(${columns.map(() => "?").join(",")})`);
			for (const row of rows) {
				const restored = table === "contact_messages" && row ? {
					province: "",
					canton: "",
					district: "",
					...row
				} : row;
				if (!restored || Object.keys(restored).sort().join("|") !== [...columns].sort().join("|")) throw new Error("columns");
				const values = columns.map((column) => restored[column]);
				if (values.some((value) => value !== null && typeof value !== "string" && !(typeof value === "number" && Number.isSafeInteger(value)))) throw new Error("value");
				insert.run(...values);
			}
		}
		store.db.exec("COMMIT");
	} catch {
		if (store.db.isTransaction) store.db.exec("ROLLBACK");
		throw new Error("STATE_CORRUPT");
	}
}
var GoogleCompetitionState = class {
	constructor(connection) {
		this.connection = connection;
	}
	async load() {
		const data = await this.connection.call("state-load", {});
		if (!Number.isSafeInteger(data.revision) || data.revision < 0 || !(data.snapshot === null || typeof data.snapshot === "string" && data.snapshot.length <= 6e6) || data.revision === 0 !== (data.snapshot === null)) throw new Error("STATE_CORRUPT");
		return {
			revision: data.revision,
			snapshot: data.snapshot
		};
	}
	async save(revision, snapshot) {
		const data = await this.connection.call("state-save", {
			revision,
			snapshot
		});
		if (typeof data.saved !== "boolean" || !Number.isSafeInteger(data.revision) || (data.saved ? data.revision !== revision + 1 : data.revision <= revision)) throw new Error("STATE_CORRUPT");
		return {
			saved: data.saved,
			revision: data.revision
		};
	}
};
//#endregion
//#region lib/gaming/netlify-api.ts
async function syncNetlifyRecords({ state, sheets, database, maintenance }) {
	if (maintenance) return;
	if (database) {
		const store = new CompetitionStore(":memory:");
		try {
			importCompetitionState(store, await database.snapshot());
			const before = new Map(store.db.prepare("SELECT * FROM sheet_sync").all().map((row) => [`${row.kind}:${row.id}`, row.hash]));
			try {
				await sheets(store).flush();
			} finally {
				const changed = store.db.prepare("SELECT * FROM sheet_sync").all().filter((row) => before.get(`${row.kind}:${row.id}`) !== row.hash);
				await database.acknowledge(changed);
			}
		} finally {
			store.db.close();
		}
		return;
	}
	const saved = await state.load();
	const store = new CompetitionStore(":memory:");
	try {
		importCompetitionState(store, saved.snapshot);
		const before = exportCompetitionState(store);
		await sheets(store).flush();
		const after = exportCompetitionState(store);
		if (after !== before) await state.save(saved.revision, after);
	} finally {
		store.db.close();
	}
}
//#endregion
//#region lib/gaming/sheet-connection.ts
var SheetsConnection = class {
	constructor(endpoint, secret, request = fetch, deadline = Infinity) {
		this.endpoint = endpoint;
		this.secret = secret;
		this.request = request;
		this.deadline = deadline;
		const url = new URL(endpoint);
		if (url.protocol !== "https:" || url.hostname !== "script.google.com" || !url.pathname.endsWith("/exec") || secret.length < 32) throw new Error("SHEETS_CONFIG_INVALID");
	}
	async call(action, body) {
		const issuedAt = Date.now();
		const serialized = JSON.stringify(body);
		const signature = createHmac("sha256", this.secret).update(`${action}\n${issuedAt}\n${serialized}`).digest("hex");
		try {
			const remaining = Math.min(2e4, this.deadline - Date.now());
			if (remaining <= 0) throw new Error("deadline");
			const response = await this.request(this.endpoint, {
				method: "POST",
				redirect: "follow",
				headers: { "Content-Type": "text/plain;charset=utf-8" },
				body: JSON.stringify({
					source: "lif-client-tests",
					action,
					issuedAt,
					body: serialized,
					signature
				}),
				signal: AbortSignal.timeout(Math.ceil(remaining))
			});
			const data = await response.json();
			if (!response.ok || !data || data.ok !== true) throw new Error("response");
			return data;
		} catch {
			throw new Error("SHEETS_UNAVAILABLE");
		}
	}
};
//#endregion
//#region lib/gaming/sheets.ts
var CompetitionSheets = class {
	constructor(store, endpoint, secret, request = fetch, connection) {
		this.inFlight = null;
		this.cache = /* @__PURE__ */ new Map();
		this.store = store;
		this.connection = connection ?? new SheetsConnection(endpoint, secret, request);
	}
	async call(action, body) {
		return this.connection.call(action, body);
	}
	pending() {
		const games = this.store.db.prepare(`SELECT id,participant,game,score,started,achieved,version,name,email,phone,nickname,consent,updated FROM (${REGISTERED_GAMES_SQL}) ORDER BY achieved,id`).all();
		const contacts = this.store.db.prepare("SELECT id,name,email,phone,message,consent,created,province,canton,district FROM contact_messages ORDER BY created,id").all();
		return [...games.map((row) => ({
			kind: "games",
			record: {
				...row,
				consent: !!row.consent
			}
		})), ...contacts.map((row) => {
			const { province, canton, district, ...record } = row;
			const location = contactLocationLabels({
				province,
				canton,
				district
			});
			return {
				kind: "contacts",
				record: {
					...record,
					...province || canton || district ? location : {},
					consent: !!row.consent
				}
			};
		})].flatMap(({ kind, record }) => {
			const hash = createHash("sha256").update(JSON.stringify(record)).digest("hex");
			return this.store.db.prepare("SELECT hash FROM sheet_sync WHERE kind=? AND id=?").get(kind, record.id)?.hash === hash ? [] : [{
				kind,
				record,
				hash
			}];
		});
	}
	flush() {
		if (this.inFlight) return this.inFlight.then(() => this.flush());
		this.inFlight = this.save().finally(() => {
			this.inFlight = null;
		});
		return this.inFlight;
	}
	async save() {
		const pending = this.pending();
		for (const kind of ["games", "contacts"]) {
			const records = pending.filter((row) => row.kind === kind);
			for (let index = 0; index < records.length; index += 20) {
				const batch = records.slice(index, index + 20);
				const response = await this.call("sync", {
					kind,
					records: batch.map((row) => row.record)
				});
				const ids = response.ids;
				if (kind === "contacts" && batch.some((row) => row.record.province) && response.contactLocationSaved !== true || !Array.isArray(ids) || ids.length !== batch.length || !batch.every((row, i) => ids[i] === row.record.id)) throw new Error("SHEETS_UNAVAILABLE");
				this.store.db.exec("BEGIN IMMEDIATE");
				try {
					for (const row of batch) this.store.db.prepare("INSERT INTO sheet_sync VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET hash=excluded.hash").run(row.kind, row.record.id, row.hash);
					this.store.db.exec("COMMIT");
				} catch (error) {
					this.store.db.exec("ROLLBACK");
					throw error;
				}
				this.cache.clear();
			}
		}
	}
	async leaderboard(game, device, limit) {
		const [start, end] = periodBounds();
		const own = this.store.participant(device);
		const size = Math.max(1, Math.min(GAME_CONFIG$4.LEADERBOARD_MAX_SIZE, Number.isFinite(limit) ? Math.floor(limit) : GAME_CONFIG$4.LEADERBOARD_SIZE));
		const key = `${game}:${own?.id ?? ""}:${size}:${start}:${end}`;
		const cached = this.cache.get(key);
		if (cached && cached.until > Date.now()) return cached.ranking;
		const raw = (await this.call("ranking", {
			game: game === "all" ? "unified" : game,
			version: GAME_CONFIG$4.VERSION,
			participant: own?.id ?? null,
			limit: size,
			start,
			end
		})).ranking;
		if (!raw || !Array.isArray(raw.top) || raw.top.length > size || !Number.isInteger(raw.total) || raw.total < raw.top.length || raw.position !== null && (!Number.isInteger(raw.position) || raw.position < 1 || raw.position > raw.total) || !Number.isSafeInteger(raw.best) || raw.best < 0) throw new Error("SHEETS_UNAVAILABLE");
		const ranking = {
			top: raw.top.map((row, i) => {
				if (!row || row.position !== i + 1 || typeof row.nickname !== "string" || nicknameValidationMessage(row.nickname) || !["memory_lif", "snake"].includes(row.game) || game !== "all" && row.game !== game || !Number.isSafeInteger(row.score) || row.score < 0) throw new Error("SHEETS_UNAVAILABLE");
				return {
					nickname: row.nickname,
					game: row.game,
					score: row.score,
					position: row.position
				};
			}),
			position: raw.position,
			best: raw.best,
			total: raw.total,
			period: GAME_CONFIG$4.RANKING_PERIOD
		};
		this.cache.set(key, {
			until: Date.now() + 3e4,
			ranking
		});
		return ranking;
	}
};
//#endregion
//#region ../../node_modules/postgres-array/index.js
var require_postgres_array = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.parse = function(source, transform) {
		return new ArrayParser(source, transform).parse();
	};
	var ArrayParser = class ArrayParser {
		constructor(source, transform) {
			this.source = source;
			this.transform = transform || identity;
			this.position = 0;
			this.entries = [];
			this.recorded = [];
			this.dimension = 0;
		}
		isEof() {
			return this.position >= this.source.length;
		}
		nextCharacter() {
			var character = this.source[this.position++];
			if (character === "\\") return {
				value: this.source[this.position++],
				escaped: true
			};
			return {
				value: character,
				escaped: false
			};
		}
		record(character) {
			this.recorded.push(character);
		}
		newEntry(includeEmpty) {
			var entry;
			if (this.recorded.length > 0 || includeEmpty) {
				entry = this.recorded.join("");
				if (entry === "NULL" && !includeEmpty) entry = null;
				if (entry !== null) entry = this.transform(entry);
				this.entries.push(entry);
				this.recorded = [];
			}
		}
		consumeDimensions() {
			if (this.source[0] === "[") {
				while (!this.isEof()) if (this.nextCharacter().value === "=") break;
			}
		}
		parse(nested) {
			var character, parser, quote;
			this.consumeDimensions();
			while (!this.isEof()) {
				character = this.nextCharacter();
				if (character.value === "{" && !quote) {
					this.dimension++;
					if (this.dimension > 1) {
						parser = new ArrayParser(this.source.substr(this.position - 1), this.transform);
						this.entries.push(parser.parse(true));
						this.position += parser.position - 2;
					}
				} else if (character.value === "}" && !quote) {
					this.dimension--;
					if (!this.dimension) {
						this.newEntry();
						if (nested) return this.entries;
					}
				} else if (character.value === "\"" && !character.escaped) {
					if (quote) this.newEntry(true);
					quote = !quote;
				} else if (character.value === "," && !quote) this.newEntry();
				else this.record(character.value);
			}
			if (this.dimension !== 0) throw new Error("array dimension not balanced");
			return this.entries;
		}
	};
	function identity(value) {
		return value;
	}
}));
//#endregion
//#region ../../node_modules/pg-types/lib/arrayParser.js
var require_arrayParser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var array = require_postgres_array();
	module.exports = { create: function(source, transform) {
		return { parse: function() {
			return array.parse(source, transform);
		} };
	} };
}));
//#endregion
//#region ../../node_modules/postgres-date/index.js
var require_postgres_date = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/;
	var DATE = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/;
	var TIME_ZONE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/;
	var INFINITY = /^-?infinity$/;
	module.exports = function parseDate(isoDate) {
		if (INFINITY.test(isoDate)) return Number(isoDate.replace("i", "I"));
		var matches = DATE_TIME.exec(isoDate);
		if (!matches) return getDate(isoDate) || null;
		var isBC = !!matches[8];
		var year = parseInt(matches[1], 10);
		if (isBC) year = bcYearToNegativeYear(year);
		var month = parseInt(matches[2], 10) - 1;
		var day = matches[3];
		var hour = parseInt(matches[4], 10);
		var minute = parseInt(matches[5], 10);
		var second = parseInt(matches[6], 10);
		var ms = matches[7];
		ms = ms ? 1e3 * parseFloat(ms) : 0;
		var date;
		var offset = timeZoneOffset(isoDate);
		if (offset != null) {
			date = new Date(Date.UTC(year, month, day, hour, minute, second, ms));
			if (is0To99(year)) date.setUTCFullYear(year);
			if (offset !== 0) date.setTime(date.getTime() - offset);
		} else {
			date = new Date(year, month, day, hour, minute, second, ms);
			if (is0To99(year)) date.setFullYear(year);
		}
		return date;
	};
	function getDate(isoDate) {
		var matches = DATE.exec(isoDate);
		if (!matches) return;
		var year = parseInt(matches[1], 10);
		if (!!matches[4]) year = bcYearToNegativeYear(year);
		var month = parseInt(matches[2], 10) - 1;
		var day = matches[3];
		var date = new Date(year, month, day);
		if (is0To99(year)) date.setFullYear(year);
		return date;
	}
	function timeZoneOffset(isoDate) {
		if (isoDate.endsWith("+00")) return 0;
		var zone = TIME_ZONE.exec(isoDate.split(" ")[1]);
		if (!zone) return;
		var type = zone[1];
		if (type === "Z") return 0;
		var sign = type === "-" ? -1 : 1;
		return (parseInt(zone[2], 10) * 3600 + parseInt(zone[3] || 0, 10) * 60 + parseInt(zone[4] || 0, 10)) * sign * 1e3;
	}
	function bcYearToNegativeYear(year) {
		return -(year - 1);
	}
	function is0To99(num) {
		return num >= 0 && num < 100;
	}
}));
//#endregion
//#region ../../node_modules/xtend/mutable.js
var require_mutable = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = extend;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	function extend(target) {
		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			for (var key in source) if (hasOwnProperty.call(source, key)) target[key] = source[key];
		}
		return target;
	}
}));
//#endregion
//#region ../../node_modules/postgres-interval/index.js
var require_postgres_interval = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var extend = require_mutable();
	module.exports = PostgresInterval;
	function PostgresInterval(raw) {
		if (!(this instanceof PostgresInterval)) return new PostgresInterval(raw);
		extend(this, parse(raw));
	}
	var properties = [
		"seconds",
		"minutes",
		"hours",
		"days",
		"months",
		"years"
	];
	PostgresInterval.prototype.toPostgres = function() {
		var filtered = properties.filter(this.hasOwnProperty, this);
		if (this.milliseconds && filtered.indexOf("seconds") < 0) filtered.push("seconds");
		if (filtered.length === 0) return "0";
		return filtered.map(function(property) {
			var value = this[property] || 0;
			if (property === "seconds" && this.milliseconds) value = (value + this.milliseconds / 1e3).toFixed(6).replace(/\.?0+$/, "");
			return value + " " + property;
		}, this).join(" ");
	};
	var propertiesISOEquivalent = {
		years: "Y",
		months: "M",
		days: "D",
		hours: "H",
		minutes: "M",
		seconds: "S"
	};
	var dateProperties = [
		"years",
		"months",
		"days"
	];
	var timeProperties = [
		"hours",
		"minutes",
		"seconds"
	];
	PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function() {
		var datePart = dateProperties.map(buildProperty, this).join("");
		var timePart = timeProperties.map(buildProperty, this).join("");
		return "P" + datePart + "T" + timePart;
		function buildProperty(property) {
			var value = this[property] || 0;
			if (property === "seconds" && this.milliseconds) value = (value + this.milliseconds / 1e3).toFixed(6).replace(/0+$/, "");
			return value + propertiesISOEquivalent[property];
		}
	};
	var NUMBER = "([+-]?\\d+)";
	var YEAR = NUMBER + "\\s+years?";
	var MONTH = NUMBER + "\\s+mons?";
	var DAY = NUMBER + "\\s+days?";
	var INTERVAL = new RegExp([
		YEAR,
		MONTH,
		DAY,
		"([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?"
	].map(function(regexString) {
		return "(" + regexString + ")?";
	}).join("\\s*"));
	var positions = {
		years: 2,
		months: 4,
		days: 6,
		hours: 9,
		minutes: 10,
		seconds: 11,
		milliseconds: 12
	};
	var negatives = [
		"hours",
		"minutes",
		"seconds",
		"milliseconds"
	];
	function parseMilliseconds(fraction) {
		var microseconds = fraction + "000000".slice(fraction.length);
		return parseInt(microseconds, 10) / 1e3;
	}
	function parse(interval) {
		if (!interval) return {};
		var matches = INTERVAL.exec(interval);
		var isNegative = matches[8] === "-";
		return Object.keys(positions).reduce(function(parsed, property) {
			var value = matches[positions[property]];
			if (!value) return parsed;
			value = property === "milliseconds" ? parseMilliseconds(value) : parseInt(value, 10);
			if (!value) return parsed;
			if (isNegative && ~negatives.indexOf(property)) value *= -1;
			parsed[property] = value;
			return parsed;
		}, {});
	}
}));
//#endregion
//#region ../../node_modules/postgres-bytea/index.js
var require_postgres_bytea = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var bufferFrom = Buffer.from || Buffer;
	module.exports = function parseBytea(input) {
		if (/^\\x/.test(input)) return bufferFrom(input.substr(2), "hex");
		var output = "";
		var i = 0;
		while (i < input.length) if (input[i] !== "\\") {
			output += input[i];
			++i;
		} else if (/[0-7]{3}/.test(input.substr(i + 1, 3))) {
			output += String.fromCharCode(parseInt(input.substr(i + 1, 3), 8));
			i += 4;
		} else {
			var backslashes = 1;
			while (i + backslashes < input.length && input[i + backslashes] === "\\") backslashes++;
			for (var k = 0; k < Math.floor(backslashes / 2); ++k) output += "\\";
			i += Math.floor(backslashes / 2) * 2;
		}
		return bufferFrom(output, "binary");
	};
}));
//#endregion
//#region ../../node_modules/pg-types/lib/textParsers.js
var require_textParsers = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var array = require_postgres_array();
	var arrayParser = require_arrayParser();
	var parseDate = require_postgres_date();
	var parseInterval = require_postgres_interval();
	var parseByteA = require_postgres_bytea();
	function allowNull(fn) {
		return function nullAllowed(value) {
			if (value === null) return value;
			return fn(value);
		};
	}
	function parseBool(value) {
		if (value === null) return value;
		return value === "TRUE" || value === "t" || value === "true" || value === "y" || value === "yes" || value === "on" || value === "1";
	}
	function parseBoolArray(value) {
		if (!value) return null;
		return array.parse(value, parseBool);
	}
	function parseBaseTenInt(string) {
		return parseInt(string, 10);
	}
	function parseIntegerArray(value) {
		if (!value) return null;
		return array.parse(value, allowNull(parseBaseTenInt));
	}
	function parseBigIntegerArray(value) {
		if (!value) return null;
		return array.parse(value, allowNull(function(entry) {
			return parseBigInteger(entry).trim();
		}));
	}
	var parsePointArray = function(value) {
		if (!value) return null;
		return arrayParser.create(value, function(entry) {
			if (entry !== null) entry = parsePoint(entry);
			return entry;
		}).parse();
	};
	var parseFloatArray = function(value) {
		if (!value) return null;
		return arrayParser.create(value, function(entry) {
			if (entry !== null) entry = parseFloat(entry);
			return entry;
		}).parse();
	};
	var parseStringArray = function(value) {
		if (!value) return null;
		return arrayParser.create(value).parse();
	};
	var parseDateArray = function(value) {
		if (!value) return null;
		return arrayParser.create(value, function(entry) {
			if (entry !== null) entry = parseDate(entry);
			return entry;
		}).parse();
	};
	var parseIntervalArray = function(value) {
		if (!value) return null;
		return arrayParser.create(value, function(entry) {
			if (entry !== null) entry = parseInterval(entry);
			return entry;
		}).parse();
	};
	var parseByteAArray = function(value) {
		if (!value) return null;
		return array.parse(value, allowNull(parseByteA));
	};
	var parseInteger = function(value) {
		return parseInt(value, 10);
	};
	var parseBigInteger = function(value) {
		var valStr = String(value);
		if (/^\d+$/.test(valStr)) return valStr;
		return value;
	};
	var parseJsonArray = function(value) {
		if (!value) return null;
		return array.parse(value, allowNull(JSON.parse));
	};
	var parsePoint = function(value) {
		if (value[0] !== "(") return null;
		value = value.substring(1, value.length - 1).split(",");
		return {
			x: parseFloat(value[0]),
			y: parseFloat(value[1])
		};
	};
	var parseCircle = function(value) {
		if (value[0] !== "<" && value[1] !== "(") return null;
		var point = "(";
		var radius = "";
		var pointParsed = false;
		for (var i = 2; i < value.length - 1; i++) {
			if (!pointParsed) point += value[i];
			if (value[i] === ")") {
				pointParsed = true;
				continue;
			} else if (!pointParsed) continue;
			if (value[i] === ",") continue;
			radius += value[i];
		}
		var result = parsePoint(point);
		result.radius = parseFloat(radius);
		return result;
	};
	var init = function(register) {
		register(20, parseBigInteger);
		register(21, parseInteger);
		register(23, parseInteger);
		register(26, parseInteger);
		register(700, parseFloat);
		register(701, parseFloat);
		register(16, parseBool);
		register(1082, parseDate);
		register(1114, parseDate);
		register(1184, parseDate);
		register(600, parsePoint);
		register(651, parseStringArray);
		register(718, parseCircle);
		register(1e3, parseBoolArray);
		register(1001, parseByteAArray);
		register(1005, parseIntegerArray);
		register(1007, parseIntegerArray);
		register(1028, parseIntegerArray);
		register(1016, parseBigIntegerArray);
		register(1017, parsePointArray);
		register(1021, parseFloatArray);
		register(1022, parseFloatArray);
		register(1231, parseFloatArray);
		register(1014, parseStringArray);
		register(1015, parseStringArray);
		register(1008, parseStringArray);
		register(1009, parseStringArray);
		register(1040, parseStringArray);
		register(1041, parseStringArray);
		register(1115, parseDateArray);
		register(1182, parseDateArray);
		register(1185, parseDateArray);
		register(1186, parseInterval);
		register(1187, parseIntervalArray);
		register(17, parseByteA);
		register(114, JSON.parse.bind(JSON));
		register(3802, JSON.parse.bind(JSON));
		register(199, parseJsonArray);
		register(3807, parseJsonArray);
		register(3907, parseStringArray);
		register(2951, parseStringArray);
		register(791, parseStringArray);
		register(1183, parseStringArray);
		register(1270, parseStringArray);
	};
	module.exports = { init };
}));
//#endregion
//#region ../../node_modules/pg-int8/index.js
var require_pg_int8 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var BASE = 1e6;
	function readInt8(buffer) {
		var high = buffer.readInt32BE(0);
		var low = buffer.readUInt32BE(4);
		var sign = "";
		if (high < 0) {
			high = ~high + (low === 0);
			low = ~low + 1 >>> 0;
			sign = "-";
		}
		var result = "";
		var carry;
		var t;
		var digits;
		var pad;
		var l;
		var i;
		carry = high % BASE;
		high = high / BASE >>> 0;
		t = 4294967296 * carry + low;
		low = t / BASE >>> 0;
		digits = "" + (t - BASE * low);
		if (low === 0 && high === 0) return sign + digits + result;
		pad = "";
		l = 6 - digits.length;
		for (i = 0; i < l; i++) pad += "0";
		result = pad + digits + result;
		carry = high % BASE;
		high = high / BASE >>> 0;
		t = 4294967296 * carry + low;
		low = t / BASE >>> 0;
		digits = "" + (t - BASE * low);
		if (low === 0 && high === 0) return sign + digits + result;
		pad = "";
		l = 6 - digits.length;
		for (i = 0; i < l; i++) pad += "0";
		result = pad + digits + result;
		carry = high % BASE;
		high = high / BASE >>> 0;
		t = 4294967296 * carry + low;
		low = t / BASE >>> 0;
		digits = "" + (t - BASE * low);
		if (low === 0 && high === 0) return sign + digits + result;
		pad = "";
		l = 6 - digits.length;
		for (i = 0; i < l; i++) pad += "0";
		result = pad + digits + result;
		carry = high % BASE;
		t = 4294967296 * carry + low;
		digits = "" + t % BASE;
		return sign + digits + result;
	}
	module.exports = readInt8;
}));
//#endregion
//#region ../../node_modules/pg-types/lib/binaryParsers.js
var require_binaryParsers = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var parseInt64 = require_pg_int8();
	var parseBits = function(data, bits, offset, invert, callback) {
		offset = offset || 0;
		invert = invert || false;
		callback = callback || function(lastValue, newValue, bits) {
			return lastValue * Math.pow(2, bits) + newValue;
		};
		var offsetBytes = offset >> 3;
		var inv = function(value) {
			if (invert) return ~value & 255;
			return value;
		};
		var mask = 255;
		var firstBits = 8 - offset % 8;
		if (bits < firstBits) {
			mask = 255 << 8 - bits & 255;
			firstBits = bits;
		}
		if (offset) mask = mask >> offset % 8;
		var result = 0;
		if (offset % 8 + bits >= 8) result = callback(0, inv(data[offsetBytes]) & mask, firstBits);
		var bytes = bits + offset >> 3;
		for (var i = offsetBytes + 1; i < bytes; i++) result = callback(result, inv(data[i]), 8);
		var lastBits = (bits + offset) % 8;
		if (lastBits > 0) result = callback(result, inv(data[bytes]) >> 8 - lastBits, lastBits);
		return result;
	};
	var parseFloatFromBits = function(data, precisionBits, exponentBits) {
		var bias = Math.pow(2, exponentBits - 1) - 1;
		var sign = parseBits(data, 1);
		var exponent = parseBits(data, exponentBits, 1);
		if (exponent === 0) return 0;
		var precisionBitsCounter = 1;
		var parsePrecisionBits = function(lastValue, newValue, bits) {
			if (lastValue === 0) lastValue = 1;
			for (var i = 1; i <= bits; i++) {
				precisionBitsCounter /= 2;
				if ((newValue & 1 << bits - i) > 0) lastValue += precisionBitsCounter;
			}
			return lastValue;
		};
		var mantissa = parseBits(data, precisionBits, exponentBits + 1, false, parsePrecisionBits);
		if (exponent == Math.pow(2, exponentBits + 1) - 1) {
			if (mantissa === 0) return sign === 0 ? Infinity : -Infinity;
			return NaN;
		}
		return (sign === 0 ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
	};
	var parseInt16 = function(value) {
		if (parseBits(value, 1) == 1) return -1 * (parseBits(value, 15, 1, true) + 1);
		return parseBits(value, 15, 1);
	};
	var parseInt32 = function(value) {
		if (parseBits(value, 1) == 1) return -1 * (parseBits(value, 31, 1, true) + 1);
		return parseBits(value, 31, 1);
	};
	var parseFloat32 = function(value) {
		return parseFloatFromBits(value, 23, 8);
	};
	var parseFloat64 = function(value) {
		return parseFloatFromBits(value, 52, 11);
	};
	var parseNumeric = function(value) {
		var sign = parseBits(value, 16, 32);
		if (sign == 49152) return NaN;
		var weight = Math.pow(1e4, parseBits(value, 16, 16));
		var result = 0;
		var ndigits = parseBits(value, 16);
		for (var i = 0; i < ndigits; i++) {
			result += parseBits(value, 16, 64 + 16 * i) * weight;
			weight /= 1e4;
		}
		var scale = Math.pow(10, parseBits(value, 16, 48));
		return (sign === 0 ? 1 : -1) * Math.round(result * scale) / scale;
	};
	var parseDate = function(isUTC, value) {
		var sign = parseBits(value, 1);
		var rawValue = parseBits(value, 63, 1);
		var result = /* @__PURE__ */ new Date((sign === 0 ? 1 : -1) * rawValue / 1e3 + 9466848e5);
		if (!isUTC) result.setTime(result.getTime() + result.getTimezoneOffset() * 6e4);
		result.usec = rawValue % 1e3;
		result.getMicroSeconds = function() {
			return this.usec;
		};
		result.setMicroSeconds = function(value) {
			this.usec = value;
		};
		result.getUTCMicroSeconds = function() {
			return this.usec;
		};
		return result;
	};
	var parseArray = function(value) {
		var dim = parseBits(value, 32);
		parseBits(value, 32, 32);
		var elementType = parseBits(value, 32, 64);
		var offset = 96;
		var dims = [];
		for (var i = 0; i < dim; i++) {
			dims[i] = parseBits(value, 32, offset);
			offset += 32;
			offset += 32;
		}
		var parseElement = function(elementType) {
			var length = parseBits(value, 32, offset);
			offset += 32;
			if (length == 4294967295) return null;
			var result;
			if (elementType == 23 || elementType == 20) {
				result = parseBits(value, length * 8, offset);
				offset += length * 8;
				return result;
			} else if (elementType == 25) {
				result = value.toString(this.encoding, offset >> 3, (offset += length << 3) >> 3);
				return result;
			} else console.log("ERROR: ElementType not implemented: " + elementType);
		};
		var parse = function(dimension, elementType) {
			var array = [];
			var i;
			if (dimension.length > 1) {
				var count = dimension.shift();
				for (i = 0; i < count; i++) array[i] = parse(dimension, elementType);
				dimension.unshift(count);
			} else for (i = 0; i < dimension[0]; i++) array[i] = parseElement(elementType);
			return array;
		};
		return parse(dims, elementType);
	};
	var parseText = function(value) {
		return value.toString("utf8");
	};
	var parseBool = function(value) {
		if (value === null) return null;
		return parseBits(value, 8) > 0;
	};
	var init = function(register) {
		register(20, parseInt64);
		register(21, parseInt16);
		register(23, parseInt32);
		register(26, parseInt32);
		register(1700, parseNumeric);
		register(700, parseFloat32);
		register(701, parseFloat64);
		register(16, parseBool);
		register(1114, parseDate.bind(null, false));
		register(1184, parseDate.bind(null, true));
		register(1e3, parseArray);
		register(1007, parseArray);
		register(1016, parseArray);
		register(1008, parseArray);
		register(1009, parseArray);
		register(25, parseText);
	};
	module.exports = { init };
}));
//#endregion
//#region ../../node_modules/pg-types/lib/builtins.js
var require_builtins = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Following query was used to generate this file:
	
	SELECT json_object_agg(UPPER(PT.typname), PT.oid::int4 ORDER BY pt.oid)
	FROM pg_type PT
	WHERE typnamespace = (SELECT pgn.oid FROM pg_namespace pgn WHERE nspname = 'pg_catalog') -- Take only builting Postgres types with stable OID (extension types are not guaranted to be stable)
	AND typtype = 'b' -- Only basic types
	AND typelem = 0 -- Ignore aliases
	AND typisdefined -- Ignore undefined types
	*/
	module.exports = {
		BOOL: 16,
		BYTEA: 17,
		CHAR: 18,
		INT8: 20,
		INT2: 21,
		INT4: 23,
		REGPROC: 24,
		TEXT: 25,
		OID: 26,
		TID: 27,
		XID: 28,
		CID: 29,
		JSON: 114,
		XML: 142,
		PG_NODE_TREE: 194,
		SMGR: 210,
		PATH: 602,
		POLYGON: 604,
		CIDR: 650,
		FLOAT4: 700,
		FLOAT8: 701,
		ABSTIME: 702,
		RELTIME: 703,
		TINTERVAL: 704,
		CIRCLE: 718,
		MACADDR8: 774,
		MONEY: 790,
		MACADDR: 829,
		INET: 869,
		ACLITEM: 1033,
		BPCHAR: 1042,
		VARCHAR: 1043,
		DATE: 1082,
		TIME: 1083,
		TIMESTAMP: 1114,
		TIMESTAMPTZ: 1184,
		INTERVAL: 1186,
		TIMETZ: 1266,
		BIT: 1560,
		VARBIT: 1562,
		NUMERIC: 1700,
		REFCURSOR: 1790,
		REGPROCEDURE: 2202,
		REGOPER: 2203,
		REGOPERATOR: 2204,
		REGCLASS: 2205,
		REGTYPE: 2206,
		UUID: 2950,
		TXID_SNAPSHOT: 2970,
		PG_LSN: 3220,
		PG_NDISTINCT: 3361,
		PG_DEPENDENCIES: 3402,
		TSVECTOR: 3614,
		TSQUERY: 3615,
		GTSVECTOR: 3642,
		REGCONFIG: 3734,
		REGDICTIONARY: 3769,
		JSONB: 3802,
		REGNAMESPACE: 4089,
		REGROLE: 4096
	};
}));
//#endregion
//#region ../../node_modules/pg-types/index.js
var require_pg_types = /* @__PURE__ */ __commonJSMin(((exports) => {
	var textParsers = require_textParsers();
	var binaryParsers = require_binaryParsers();
	var arrayParser = require_arrayParser();
	var builtinTypes = require_builtins();
	exports.getTypeParser = getTypeParser;
	exports.setTypeParser = setTypeParser;
	exports.arrayParser = arrayParser;
	exports.builtins = builtinTypes;
	var typeParsers = {
		text: {},
		binary: {}
	};
	function noParse(val) {
		return String(val);
	}
	function getTypeParser(oid, format) {
		format = format || "text";
		if (!typeParsers[format]) return noParse;
		return typeParsers[format][oid] || noParse;
	}
	function setTypeParser(oid, format, parseFn) {
		if (typeof format == "function") {
			parseFn = format;
			format = "text";
		}
		typeParsers[format][oid] = parseFn;
	}
	textParsers.init(function(oid, converter) {
		typeParsers.text[oid] = converter;
	});
	binaryParsers.init(function(oid, converter) {
		typeParsers.binary[oid] = converter;
	});
}));
//#endregion
//#region ../../node_modules/pg/lib/defaults.js
var require_defaults = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var user;
	try {
		user = process.platform === "win32" ? process.env.USERNAME : process.env.USER;
	} catch {}
	module.exports = {
		host: "localhost",
		user,
		database: void 0,
		password: null,
		connectionString: void 0,
		port: 5432,
		rows: 0,
		binary: false,
		max: 10,
		idleTimeoutMillis: 3e4,
		client_encoding: "",
		ssl: false,
		sslnegotiation: void 0,
		application_name: void 0,
		fallback_application_name: void 0,
		options: void 0,
		parseInputDatesAsUTC: false,
		statement_timeout: false,
		lock_timeout: false,
		idle_in_transaction_session_timeout: false,
		query_timeout: false,
		connect_timeout: 0,
		keepalives: 1,
		keepalives_idle: 0
	};
	var pgTypes = require_pg_types();
	var parseBigInteger = pgTypes.getTypeParser(20, "text");
	var parseBigIntegerArray = pgTypes.getTypeParser(1016, "text");
	module.exports.__defineSetter__("parseInt8", function(val) {
		pgTypes.setTypeParser(20, "text", val ? pgTypes.getTypeParser(23, "text") : parseBigInteger);
		pgTypes.setTypeParser(1016, "text", val ? pgTypes.getTypeParser(1007, "text") : parseBigIntegerArray);
	});
}));
//#endregion
//#region ../../node_modules/pg/lib/utils.js
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var defaults = require_defaults();
	var nodeUtils$2 = __require("util");
	var { isDate } = __require("util/types");
	var invalidDateDeprecationNotice = nodeUtils$2.deprecate(() => {}, "Sending an invalid date to Postgres is deprecated and will throw an error in the next major version of pg. Ensure any Date object passed as a query parameter is valid.", "PG_INVALID_DATE");
	function escapeElement(elementRepresentation) {
		return "\"" + elementRepresentation.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\"";
	}
	function arrayString(val) {
		let result = "{";
		for (let i = 0; i < val.length; i++) {
			if (i > 0) result += ",";
			let item = val[i];
			if (item == null) result += "NULL";
			else if (Array.isArray(item)) result += arrayString(item);
			else if (ArrayBuffer.isView(item)) {
				if (!(item instanceof Buffer)) item = Buffer.from(item.buffer, item.byteOffset, item.byteLength);
				result += "\\\\x" + item.toString("hex");
			} else result += escapeElement(prepareValue(item));
		}
		result += "}";
		return result;
	}
	var prepareValue = function(val, seen) {
		if (val == null) return null;
		if (typeof val === "object") {
			if (val instanceof Buffer) return val;
			if (ArrayBuffer.isView(val)) return Buffer.from(val.buffer, val.byteOffset, val.byteLength);
			if (isDate(val)) {
				if (isNaN(val.getTime())) invalidDateDeprecationNotice();
				if (defaults.parseInputDatesAsUTC) return dateToStringUTC(val);
				else return dateToString(val);
			}
			if (Array.isArray(val)) return arrayString(val);
			return prepareObject(val, seen);
		}
		return val.toString();
	};
	function prepareObject(val, seen) {
		if (val && typeof val.toPostgres === "function") {
			seen = seen || [];
			if (seen.indexOf(val) !== -1) throw new Error("circular reference detected while preparing \"" + val + "\" for query");
			seen.push(val);
			return prepareValue(val.toPostgres(prepareValue), seen);
		}
		return JSON.stringify(val);
	}
	function dateToString(date) {
		let offset = -date.getTimezoneOffset();
		let year = date.getFullYear();
		const isBCYear = year < 1;
		if (isBCYear) year = Math.abs(year) + 1;
		let ret = String(year).padStart(4, "0") + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0") + "T" + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0") + "." + String(date.getMilliseconds()).padStart(3, "0");
		if (offset < 0) {
			ret += "-";
			offset *= -1;
		} else ret += "+";
		ret += String(Math.floor(offset / 60)).padStart(2, "0") + ":" + String(offset % 60).padStart(2, "0");
		if (isBCYear) ret += " BC";
		return ret;
	}
	function dateToStringUTC(date) {
		let year = date.getUTCFullYear();
		const isBCYear = year < 1;
		if (isBCYear) year = Math.abs(year) + 1;
		let ret = String(year).padStart(4, "0") + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0") + "T" + String(date.getUTCHours()).padStart(2, "0") + ":" + String(date.getUTCMinutes()).padStart(2, "0") + ":" + String(date.getUTCSeconds()).padStart(2, "0") + "." + String(date.getUTCMilliseconds()).padStart(3, "0");
		ret += "+00:00";
		if (isBCYear) ret += " BC";
		return ret;
	}
	function normalizeQueryConfig(config, values, callback) {
		config = typeof config === "string" ? { text: config } : cloneQueryConfig(config);
		if (values) if (typeof values === "function") config.callback = values;
		else config.values = values;
		if (callback) config.callback = callback;
		return config;
	}
	function cloneQueryConfig(config) {
		if (config == null) return config;
		return Object.defineProperties(Object.create(Object.getPrototypeOf(config)), Object.getOwnPropertyDescriptors(config));
	}
	var escapeIdentifier = function(str) {
		return "\"" + str.replace(/"/g, "\"\"") + "\"";
	};
	var escapeLiteral = function(str) {
		let hasBackslash = false;
		let escaped = "'";
		if (str == null) return "''";
		if (typeof str !== "string") return "''";
		for (let i = 0; i < str.length; i++) {
			const c = str[i];
			if (c === "'") escaped += c + c;
			else if (c === "\\") {
				escaped += c + c;
				hasBackslash = true;
			} else escaped += c;
		}
		escaped += "'";
		if (hasBackslash === true) escaped = " E" + escaped;
		return escaped;
	};
	module.exports = {
		prepareValue: function prepareValueWrapper(value) {
			return prepareValue(value);
		},
		normalizeQueryConfig,
		escapeIdentifier,
		escapeLiteral
	};
}));
//#endregion
//#region ../../node_modules/pg/lib/crypto/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var nodeCrypto = __require("crypto");
	module.exports = {
		postgresMd5PasswordHash,
		randomBytes,
		deriveKey,
		sha256,
		hashByName,
		hmacSha256,
		md5
	};
	/**
	* The Web Crypto API - grabbed from the Node.js library or the global
	* @type Crypto
	*/
	var webCrypto = nodeCrypto.webcrypto || globalThis.crypto;
	/**
	* The SubtleCrypto API for low level crypto operations.
	* @type SubtleCrypto
	*/
	var subtleCrypto = webCrypto.subtle;
	var textEncoder = new TextEncoder();
	/**
	*
	* @param {*} length
	* @returns
	*/
	function randomBytes(length) {
		return webCrypto.getRandomValues(Buffer.alloc(length));
	}
	async function md5(string) {
		try {
			return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
		} catch (e) {
			const data = typeof string === "string" ? textEncoder.encode(string) : string;
			const hash = await subtleCrypto.digest("MD5", data);
			return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
		}
	}
	async function postgresMd5PasswordHash(user, password, salt) {
		const inner = await md5(password + user);
		return "md5" + await md5(Buffer.concat([Buffer.from(inner), salt]));
	}
	/**
	* Create a SHA-256 digest of the given data
	* @param {Buffer} data
	*/
	async function sha256(text) {
		return await subtleCrypto.digest("SHA-256", text);
	}
	async function hashByName(hashName, text) {
		return await subtleCrypto.digest(hashName, text);
	}
	/**
	* Sign the message with the given key
	* @param {ArrayBuffer} keyBuffer
	* @param {string} msg
	*/
	async function hmacSha256(keyBuffer, msg) {
		const key = await subtleCrypto.importKey("raw", keyBuffer, {
			name: "HMAC",
			hash: "SHA-256"
		}, false, ["sign"]);
		return await subtleCrypto.sign("HMAC", key, textEncoder.encode(msg));
	}
	/**
	* Derive a key from the password and salt
	* @param {string} password
	* @param {Uint8Array} salt
	* @param {number} iterations
	*/
	async function deriveKey(password, salt, iterations) {
		const key = await subtleCrypto.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
		const params = {
			name: "PBKDF2",
			hash: "SHA-256",
			salt,
			iterations
		};
		return await subtleCrypto.deriveBits(params, key, 256, ["deriveBits"]);
	}
}));
//#endregion
//#region ../../node_modules/pg/lib/crypto/cert-signatures.js
var require_cert_signatures = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function x509Error(msg, cert) {
		return /* @__PURE__ */ new Error("SASL channel binding: " + msg + " when parsing public certificate " + cert.toString("base64"));
	}
	function readASN1Length(data, index) {
		let length = data[index++];
		if (length < 128) return {
			length,
			index
		};
		const lengthBytes = length & 127;
		if (lengthBytes > 4) throw x509Error("bad length", data);
		length = 0;
		for (let i = 0; i < lengthBytes; i++) length = length << 8 | data[index++];
		return {
			length,
			index
		};
	}
	function readASN1OID(data, index) {
		if (data[index++] !== 6) throw x509Error("non-OID data", data);
		const { length: OIDLength, index: indexAfterOIDLength } = readASN1Length(data, index);
		index = indexAfterOIDLength;
		const lastIndex = index + OIDLength;
		const byte1 = data[index++];
		let oid = (byte1 / 40 >> 0) + "." + byte1 % 40;
		while (index < lastIndex) {
			let value = 0;
			while (index < lastIndex) {
				const nextByte = data[index++];
				value = value << 7 | nextByte & 127;
				if (nextByte < 128) break;
			}
			oid += "." + value;
		}
		return {
			oid,
			index
		};
	}
	function expectASN1Seq(data, index) {
		if (data[index++] !== 48) throw x509Error("non-sequence data", data);
		return readASN1Length(data, index);
	}
	function signatureAlgorithmHashFromCertificate(data, index) {
		if (index === void 0) index = 0;
		index = expectASN1Seq(data, index).index;
		const { length: certInfoLength, index: indexAfterCertInfoLength } = expectASN1Seq(data, index);
		index = indexAfterCertInfoLength + certInfoLength;
		index = expectASN1Seq(data, index).index;
		const { oid, index: indexAfterOID } = readASN1OID(data, index);
		switch (oid) {
			case "1.2.840.113549.1.1.4": return "MD5";
			case "1.2.840.113549.1.1.5": return "SHA-1";
			case "1.2.840.113549.1.1.11": return "SHA-256";
			case "1.2.840.113549.1.1.12": return "SHA-384";
			case "1.2.840.113549.1.1.13": return "SHA-512";
			case "1.2.840.113549.1.1.14": return "SHA-224";
			case "1.2.840.113549.1.1.15": return "SHA512-224";
			case "1.2.840.113549.1.1.16": return "SHA512-256";
			case "1.2.840.10045.4.1": return "SHA-1";
			case "1.2.840.10045.4.3.1": return "SHA-224";
			case "1.2.840.10045.4.3.2": return "SHA-256";
			case "1.2.840.10045.4.3.3": return "SHA-384";
			case "1.2.840.10045.4.3.4": return "SHA-512";
			case "1.2.840.113549.1.1.10": {
				index = indexAfterOID;
				index = expectASN1Seq(data, index).index;
				if (data[index++] !== 160) throw x509Error("non-tag data", data);
				index = readASN1Length(data, index).index;
				index = expectASN1Seq(data, index).index;
				const { oid: hashOID } = readASN1OID(data, index);
				switch (hashOID) {
					case "1.2.840.113549.2.5": return "MD5";
					case "1.3.14.3.2.26": return "SHA-1";
					case "2.16.840.1.101.3.4.2.1": return "SHA-256";
					case "2.16.840.1.101.3.4.2.2": return "SHA-384";
					case "2.16.840.1.101.3.4.2.3": return "SHA-512";
				}
				throw x509Error("unknown hash OID " + hashOID, data);
			}
			case "1.3.101.110":
			case "1.3.101.112": return "SHA-512";
			case "1.3.101.111":
			case "1.3.101.113": throw x509Error("Ed448 certificate channel binding is not currently supported by Postgres");
		}
		throw x509Error("unknown OID " + oid, data);
	}
	module.exports = { signatureAlgorithmHashFromCertificate };
}));
//#endregion
//#region ../../node_modules/pg/lib/crypto/sasl.js
var require_sasl = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var crypto = require_utils();
	var { signatureAlgorithmHashFromCertificate } = require_cert_signatures();
	function saslprep(password) {
		return password.replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, " ").replace(/[\u00AD\u034F\u1806\u180B\u180C\u180D\u200C\u200D\u2060\uFE00-\uFE0F\uFEFF]/g, "").normalize("NFKC");
	}
	var DEFAULT_MAX_SCRAM_ITERATIONS = 1e5;
	function startSession(mechanisms, stream, scramMaxIterations = DEFAULT_MAX_SCRAM_ITERATIONS) {
		const candidates = ["SCRAM-SHA-256"];
		if (stream) candidates.unshift("SCRAM-SHA-256-PLUS");
		const mechanism = candidates.find((candidate) => mechanisms.includes(candidate));
		if (!mechanism) throw new Error("SASL: Only mechanism(s) " + candidates.join(" and ") + " are supported");
		if (mechanism === "SCRAM-SHA-256-PLUS" && typeof stream.getPeerCertificate !== "function") throw new Error("SASL: Mechanism SCRAM-SHA-256-PLUS requires a certificate");
		const clientNonce = crypto.randomBytes(18).toString("base64");
		return {
			mechanism,
			clientNonce,
			response: (mechanism === "SCRAM-SHA-256-PLUS" ? "p=tls-server-end-point" : stream ? "y" : "n") + ",,n=*,r=" + clientNonce,
			message: "SASLInitialResponse",
			scramMaxIterations
		};
	}
	async function continueSession(session, password, serverData, stream) {
		if (session.message !== "SASLInitialResponse") throw new Error("SASL: Last message was not SASLInitialResponse");
		if (typeof password !== "string") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
		if (password === "") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string");
		if (typeof serverData !== "string") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
		const sv = parseServerFirstMessage(serverData);
		if (!sv.nonce.startsWith(session.clientNonce)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
		else if (sv.nonce.length === session.clientNonce.length) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
		const scramMaxIterations = typeof session.scramMaxIterations === "number" ? session.scramMaxIterations : DEFAULT_MAX_SCRAM_ITERATIONS;
		if (scramMaxIterations !== 0 && sv.iteration > scramMaxIterations) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration count " + sv.iteration + " exceeds scramMaxIterations of " + scramMaxIterations);
		const clientFirstMessageBare = "n=*,r=" + session.clientNonce;
		const serverFirstMessage = "r=" + sv.nonce + ",s=" + sv.salt + ",i=" + sv.iteration;
		let channelBinding = stream ? "eSws" : "biws";
		if (session.mechanism === "SCRAM-SHA-256-PLUS") {
			const peerCert = stream.getPeerCertificate().raw;
			let hashName = signatureAlgorithmHashFromCertificate(peerCert);
			if (hashName === "MD5" || hashName === "SHA-1") hashName = "SHA-256";
			const certHash = await crypto.hashByName(hashName, peerCert);
			channelBinding = Buffer.concat([Buffer.from("p=tls-server-end-point,,"), Buffer.from(certHash)]).toString("base64");
		}
		const clientFinalMessageWithoutProof = "c=" + channelBinding + ",r=" + sv.nonce;
		const authMessage = clientFirstMessageBare + "," + serverFirstMessage + "," + clientFinalMessageWithoutProof;
		const saltBytes = Buffer.from(sv.salt, "base64");
		const saltedPassword = await crypto.deriveKey(saslprep(password), saltBytes, sv.iteration);
		const clientKey = await crypto.hmacSha256(saltedPassword, "Client Key");
		const storedKey = await crypto.sha256(clientKey);
		const clientSignature = await crypto.hmacSha256(storedKey, authMessage);
		const clientProof = xorBuffers(Buffer.from(clientKey), Buffer.from(clientSignature)).toString("base64");
		const serverKey = await crypto.hmacSha256(saltedPassword, "Server Key");
		const serverSignatureBytes = await crypto.hmacSha256(serverKey, authMessage);
		session.message = "SASLResponse";
		session.serverSignature = Buffer.from(serverSignatureBytes).toString("base64");
		session.response = clientFinalMessageWithoutProof + ",p=" + clientProof;
	}
	function finalizeSession(session, serverData) {
		if (session.message !== "SASLResponse") throw new Error("SASL: Last message was not SASLResponse");
		if (typeof serverData !== "string") throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
		const { serverSignature } = parseServerFinalMessage(serverData);
		if (serverSignature !== session.serverSignature) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
	}
	/**
	* printable       = %x21-2B / %x2D-7E
	*                   ;; Printable ASCII except ",".
	*                   ;; Note that any "printable" is also
	*                   ;; a valid "value".
	*/
	function isPrintableChars(text) {
		if (typeof text !== "string") throw new TypeError("SASL: text must be a string");
		return text.split("").map((_, i) => text.charCodeAt(i)).every((c) => c >= 33 && c <= 43 || c >= 45 && c <= 126);
	}
	/**
	* base64-char     = ALPHA / DIGIT / "/" / "+"
	*
	* base64-4        = 4base64-char
	*
	* base64-3        = 3base64-char "="
	*
	* base64-2        = 2base64-char "=="
	*
	* base64          = *base64-4 [base64-3 / base64-2]
	*/
	function isBase64(text) {
		return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text);
	}
	function parseAttributePairs(text) {
		if (typeof text !== "string") throw new TypeError("SASL: attribute pairs text must be a string");
		return new Map(text.split(",").map((attrValue) => {
			if (!/^.=/.test(attrValue)) throw new Error("SASL: Invalid attribute pair entry");
			return [attrValue[0], attrValue.substring(2)];
		}));
	}
	function parseServerFirstMessage(data) {
		const attrPairs = parseAttributePairs(data);
		const nonce = attrPairs.get("r");
		if (!nonce) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
		else if (!isPrintableChars(nonce)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
		const salt = attrPairs.get("s");
		if (!salt) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
		else if (!isBase64(salt)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
		const iterationText = attrPairs.get("i");
		if (!iterationText) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
		else if (!/^[1-9][0-9]*$/.test(iterationText)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
		return {
			nonce,
			salt,
			iteration: parseInt(iterationText, 10)
		};
	}
	function parseServerFinalMessage(serverData) {
		const attrPairs = parseAttributePairs(serverData);
		const error = attrPairs.get("e");
		const serverSignature = attrPairs.get("v");
		if (error) throw new Error(`SASL: SCRAM-SERVER-FINAL-MESSAGE: server returned error: "${error}"`);
		if (!serverSignature) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
		else if (!isBase64(serverSignature)) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
		return { serverSignature };
	}
	function xorBuffers(a, b) {
		if (!Buffer.isBuffer(a)) throw new TypeError("first argument must be a Buffer");
		if (!Buffer.isBuffer(b)) throw new TypeError("second argument must be a Buffer");
		if (a.length !== b.length) throw new Error("Buffer lengths must match");
		if (a.length === 0) throw new Error("Buffers cannot be empty");
		return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
	}
	module.exports = {
		startSession,
		continueSession,
		finalizeSession,
		DEFAULT_MAX_SCRAM_ITERATIONS
	};
}));
//#endregion
//#region ../../node_modules/pg/lib/type-overrides.js
var require_type_overrides = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var types = require_pg_types();
	function TypeOverrides(userTypes) {
		this._types = userTypes || types;
		this.text = {};
		this.binary = {};
	}
	TypeOverrides.prototype.getOverrides = function(format) {
		switch (format) {
			case "text": return this.text;
			case "binary": return this.binary;
			default: return {};
		}
	};
	TypeOverrides.prototype.setTypeParser = function(oid, format, parseFn) {
		if (typeof format === "function") {
			parseFn = format;
			format = "text";
		}
		this.getOverrides(format)[oid] = parseFn;
	};
	TypeOverrides.prototype.getTypeParser = function(oid, format) {
		format = format || "text";
		return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format);
	};
	module.exports = TypeOverrides;
}));
//#endregion
//#region ../../node_modules/pg-connection-string/index.js
var require_pg_connection_string = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function parse(str, options = {}) {
		if (str.charAt(0) === "/") {
			const config = str.split(" ");
			return {
				host: config[0],
				database: config[1]
			};
		}
		const config = Object.create(null);
		let result;
		let dummyHost = false;
		if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) str = encodeURI(str).replace(/%25(\d\d)/g, "%$1");
		try {
			try {
				result = new URL(str, "postgres://base");
			} catch (e) {
				result = new URL(str.replace("@/", "@___DUMMY___/"), "postgres://base");
				dummyHost = true;
			}
		} catch (err) {
			err.input && (err.input = "*****REDACTED*****");
			throw err;
		}
		for (const entry of result.searchParams.entries()) config[entry[0]] = entry[1];
		config.user = config.user || decodeURIComponent(result.username);
		config.password = config.password || decodeURIComponent(result.password);
		if (result.protocol == "socket:") {
			config.host = decodeURI(result.pathname);
			config.database = result.searchParams.get("db");
			config.client_encoding = result.searchParams.get("encoding");
			return config;
		}
		const hostname = (dummyHost ? "" : result.hostname).replace(/^\[(.+)\]$/, "$1");
		if (!config.host) config.host = decodeURIComponent(hostname);
		else if (hostname && /^%2f/i.test(hostname)) result.pathname = hostname + result.pathname;
		if (!config.port) config.port = result.port;
		const pathname = result.pathname.slice(1) || null;
		config.database = pathname ? decodeURI(pathname) : null;
		if (config.ssl === "true" || config.ssl === "1") config.ssl = true;
		if (config.ssl === "0") config.ssl = false;
		if (config.sslcert || config.sslkey || config.sslrootcert || config.sslmode) config.ssl = {};
		if (config.sslnegotiation === "direct" && config.ssl === void 0) config.ssl = true;
		const fs = config.sslcert || config.sslkey || config.sslrootcert ? __require("fs") : null;
		if (config.sslcert) config.ssl.cert = fs.readFileSync(config.sslcert).toString();
		if (config.sslkey) config.ssl.key = fs.readFileSync(config.sslkey).toString();
		if (config.sslrootcert) config.ssl.ca = fs.readFileSync(config.sslrootcert).toString();
		if (options.useLibpqCompat && config.uselibpqcompat) throw new Error("Both useLibpqCompat and uselibpqcompat are set. Please use only one of them.");
		if (config.uselibpqcompat === "true" || options.useLibpqCompat) switch (config.sslmode) {
			case "disable":
				config.ssl = false;
				break;
			case "prefer":
				config.ssl.rejectUnauthorized = false;
				break;
			case "require":
				if (config.sslrootcert) config.ssl.checkServerIdentity = function() {};
				else config.ssl.rejectUnauthorized = false;
				break;
			case "verify-ca":
				if (!config.ssl.ca) throw new Error("SECURITY WARNING: Using sslmode=verify-ca requires specifying a CA with sslrootcert. If a public CA is used, verify-ca allows connections to a server that somebody else may have registered with the CA, making you vulnerable to Man-in-the-Middle attacks. Either specify a custom CA certificate with sslrootcert parameter or use sslmode=verify-full for proper security.");
				config.ssl.checkServerIdentity = function() {};
				break;
			case "verify-full": break;
		}
		else switch (config.sslmode) {
			case "disable":
				config.ssl = false;
				break;
			case "prefer":
			case "require":
			case "verify-ca":
			case "verify-full":
				if (config.sslmode !== "verify-full") deprecatedSslModeWarning(config.sslmode);
				break;
			case "no-verify":
				config.ssl.rejectUnauthorized = false;
				break;
		}
		return config;
	}
	function toConnectionOptions(sslConfig) {
		return Object.entries(sslConfig).reduce((c, [key, value]) => {
			if (value !== void 0 && value !== null) c[key] = value;
			return c;
		}, Object.create(null));
	}
	function toClientConfig(config) {
		return Object.entries(config).reduce((c, [key, value]) => {
			if (key === "ssl") {
				const sslConfig = value;
				if (typeof sslConfig === "boolean") c[key] = sslConfig;
				if (typeof sslConfig === "object") c[key] = toConnectionOptions(sslConfig);
			} else if (value !== void 0 && value !== null) if (key === "port") {
				if (value !== "") {
					const v = parseInt(value, 10);
					if (isNaN(v)) throw new Error(`Invalid ${key}: ${value}`);
					c[key] = v;
				}
			} else c[key] = value;
			return c;
		}, Object.create(null));
	}
	function parseIntoClientConfig(str) {
		return toClientConfig(parse(str));
	}
	function deprecatedSslModeWarning(sslmode) {
		if (!deprecatedSslModeWarning.warned && typeof process !== "undefined" && process.emitWarning) {
			deprecatedSslModeWarning.warned = true;
			process.emitWarning(`SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=${sslmode}'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.`);
		}
	}
	module.exports = parse;
	parse.parse = parse;
	parse.toClientConfig = toClientConfig;
	parse.parseIntoClientConfig = parseIntoClientConfig;
}));
//#endregion
//#region ../../node_modules/pg/lib/connection-parameters.js
var require_connection_parameters = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var dns = __require("dns");
	var defaults = require_defaults();
	var parse = require_pg_connection_string().parse;
	var val = function(key, config, envVar) {
		if (config[key]) return config[key];
		if (envVar === void 0) envVar = process.env["PG" + key.toUpperCase()];
		else if (envVar === false) {} else envVar = process.env[envVar];
		return envVar || defaults[key];
	};
	var readSSLConfigFromEnvironment = function() {
		switch (process.env.PGSSLMODE) {
			case "disable": return false;
			case "prefer":
			case "require":
			case "verify-ca":
			case "verify-full": return true;
			case "no-verify": return { rejectUnauthorized: false };
		}
		return defaults.ssl;
	};
	var quoteParamValue = function(value) {
		return "'" + ("" + value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
	};
	var add = function(params, config, paramName) {
		const value = config[paramName];
		if (value !== void 0 && value !== null) params.push(paramName + "=" + quoteParamValue(value));
	};
	var ConnectionParameters = class {
		constructor(config) {
			config = typeof config === "string" ? parse(config) : config || {};
			if (config.connectionString) config = Object.assign({}, config, parse(config.connectionString));
			this.user = val("user", config);
			this.database = val("database", config);
			if (this.database === void 0) this.database = this.user;
			this.port = parseInt(val("port", config), 10);
			this.host = val("host", config);
			Object.defineProperty(this, "password", {
				configurable: true,
				enumerable: false,
				writable: true,
				value: val("password", config)
			});
			this.binary = val("binary", config);
			this.options = val("options", config);
			this.ssl = typeof config.ssl === "undefined" ? readSSLConfigFromEnvironment() : config.ssl;
			if (typeof this.ssl === "string") {
				if (this.ssl === "true") this.ssl = true;
			}
			if (this.ssl === "no-verify") this.ssl = { rejectUnauthorized: false };
			if (this.ssl && this.ssl.key) Object.defineProperty(this.ssl, "key", { enumerable: false });
			this.sslnegotiation = val("sslnegotiation", config, "PGSSLNEGOTIATION");
			if (this.sslnegotiation !== void 0 && this.sslnegotiation !== "postgres" && this.sslnegotiation !== "direct") throw new Error(`Invalid sslnegotiation value: "${this.sslnegotiation}". Valid values are "postgres" and "direct".`);
			if (this.sslnegotiation === "direct" && !this.ssl) throw new Error("sslnegotiation=direct requires SSL to be enabled");
			this.client_encoding = val("client_encoding", config);
			this.replication = val("replication", config);
			this.isDomainSocket = !(this.host || "").indexOf("/");
			this.application_name = val("application_name", config, "PGAPPNAME");
			this.fallback_application_name = val("fallback_application_name", config, false);
			this.statement_timeout = val("statement_timeout", config, false);
			this.lock_timeout = val("lock_timeout", config, false);
			this.idle_in_transaction_session_timeout = val("idle_in_transaction_session_timeout", config, false);
			this.query_timeout = val("query_timeout", config, false);
			if (config.connectionTimeoutMillis === void 0) this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0;
			else this.connect_timeout = Math.floor(config.connectionTimeoutMillis / 1e3);
			if (config.keepAlive === false) this.keepalives = 0;
			else if (config.keepAlive === true) this.keepalives = 1;
			if (typeof config.keepAliveInitialDelayMillis === "number") this.keepalives_idle = Math.floor(config.keepAliveInitialDelayMillis / 1e3);
		}
		getLibpqConnectionString(cb) {
			const params = [];
			add(params, this, "user");
			add(params, this, "password");
			add(params, this, "port");
			add(params, this, "application_name");
			add(params, this, "fallback_application_name");
			add(params, this, "connect_timeout");
			add(params, this, "options");
			const ssl = typeof this.ssl === "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
			add(params, ssl, "sslmode");
			add(params, ssl, "sslca");
			add(params, ssl, "sslkey");
			add(params, ssl, "sslcert");
			add(params, ssl, "sslrootcert");
			add(params, this, "sslnegotiation");
			if (this.database) params.push("dbname=" + quoteParamValue(this.database));
			if (this.replication) params.push("replication=" + quoteParamValue(this.replication));
			if (this.host) params.push("host=" + quoteParamValue(this.host));
			if (this.isDomainSocket) return cb(null, params.join(" "));
			if (this.client_encoding) params.push("client_encoding=" + quoteParamValue(this.client_encoding));
			dns.lookup(this.host, function(err, address) {
				if (err) return cb(err, null);
				params.push("hostaddr=" + quoteParamValue(address));
				return cb(null, params.join(" "));
			});
		}
	};
	module.exports = ConnectionParameters;
}));
//#endregion
//#region ../../node_modules/pg/lib/result.js
var require_result = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var types = require_pg_types();
	var matchRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;
	var Result = class {
		constructor(rowMode, types) {
			this.command = null;
			this.rowCount = null;
			this.oid = null;
			this.rows = [];
			this.fields = [];
			this._parsers = void 0;
			this._types = types;
			this.RowCtor = null;
			this.rowAsArray = rowMode === "array";
			if (this.rowAsArray) this.parseRow = this._parseRowAsArray;
			this._prebuiltEmptyResultObject = null;
		}
		addCommandComplete(msg) {
			let match;
			if (msg.text) match = matchRegexp.exec(msg.text);
			else match = matchRegexp.exec(msg.command);
			if (match) {
				this.command = match[1];
				if (match[3]) {
					this.oid = parseInt(match[2], 10);
					this.rowCount = parseInt(match[3], 10);
				} else if (match[2]) this.rowCount = parseInt(match[2], 10);
			}
		}
		_parseRowAsArray(rowData) {
			const row = new Array(rowData.length);
			for (let i = 0, len = rowData.length; i < len; i++) {
				const rawValue = rowData[i];
				if (rawValue !== null) row[i] = this._parsers[i](rawValue);
				else row[i] = null;
			}
			return row;
		}
		parseRow(rowData) {
			const row = { ...this._prebuiltEmptyResultObject };
			for (let i = 0, len = rowData.length; i < len; i++) {
				const rawValue = rowData[i];
				const field = this.fields[i].name;
				if (rawValue !== null) {
					const v = this.fields[i].format === "binary" ? Buffer.from(rawValue) : rawValue;
					row[field] = this._parsers[i](v);
				} else row[field] = null;
			}
			return row;
		}
		addRow(row) {
			this.rows.push(row);
		}
		addFields(fieldDescriptions) {
			this.fields = fieldDescriptions;
			if (this.fields.length) this._parsers = new Array(fieldDescriptions.length);
			const row = Object.create(null);
			for (let i = 0; i < fieldDescriptions.length; i++) {
				const desc = fieldDescriptions[i];
				row[desc.name] = null;
				if (this._types) this._parsers[i] = this._types.getTypeParser(desc.dataTypeID, desc.format || "text");
				else this._parsers[i] = types.getTypeParser(desc.dataTypeID, desc.format || "text");
			}
			this._prebuiltEmptyResultObject = { ...row };
		}
	};
	module.exports = Result;
}));
//#endregion
//#region ../../node_modules/pg/lib/query.js
var require_query$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { EventEmitter: EventEmitter$5 } = __require("events");
	var Result = require_result();
	var utils = require_utils$1();
	var Query = class extends EventEmitter$5 {
		constructor(config, values, callback) {
			super();
			config = utils.normalizeQueryConfig(config, values, callback);
			this.text = config.text;
			this.values = config.values;
			this.rows = config.rows;
			this.types = config.types;
			this.name = config.name;
			this.queryMode = config.queryMode;
			this.binary = config.binary;
			this.portal = config.portal || "";
			this.callback = config.callback;
			this._rowMode = config.rowMode;
			if (process.domain && config.callback) this.callback = process.domain.bind(config.callback);
			this._result = new Result(this._rowMode, this.types);
			this._results = this._result;
			this._canceledDueToError = false;
		}
		requiresPreparation() {
			if (this.queryMode === "extended") return true;
			if (this.name) return true;
			if (this.rows) return true;
			if (!this.text) return false;
			if (!this.values) return false;
			return this.values.length > 0;
		}
		_checkForMultirow() {
			if (this._result.command) {
				if (!Array.isArray(this._results)) this._results = [this._result];
				this._result = new Result(this._rowMode, this._result._types);
				this._results.push(this._result);
			}
		}
		handleRowDescription(msg) {
			this._checkForMultirow();
			this._result.addFields(msg.fields);
			this._accumulateRows = this.callback || !this.listeners("row").length;
		}
		handleDataRow(msg) {
			let row;
			if (this._canceledDueToError) return;
			try {
				row = this._result.parseRow(msg.fields);
			} catch (err) {
				this._canceledDueToError = err;
				return;
			}
			this.emit("row", row, this._result);
			if (this._accumulateRows) this._result.addRow(row);
		}
		handleCommandComplete(msg, connection) {
			this._checkForMultirow();
			this._result.addCommandComplete(msg);
			if (this.rows) connection.sync();
		}
		handleEmptyQuery(connection) {
			if (this.rows) connection.sync();
		}
		handleError(err, connection) {
			if (this._canceledDueToError) {
				err = this._canceledDueToError;
				this._canceledDueToError = false;
			}
			if (this.callback) return this.callback(err);
			this.emit("error", err);
		}
		handleReadyForQuery(con) {
			if (this._canceledDueToError) return this.handleError(this._canceledDueToError, con);
			if (this.callback) try {
				this.callback(null, this._results);
			} catch (err) {
				process.nextTick(() => {
					throw err;
				});
			}
			this.emit("end", this._results);
		}
		submit(connection) {
			if (typeof this.text !== "string" && typeof this.name !== "string") return /* @__PURE__ */ new Error("A query must have either text or a name. Supplying neither is unsupported.");
			const previous = connection.parsedStatements[this.name] || connection.submittedNamedStatements[this.name];
			if (this.text && previous && this.text !== previous) return /* @__PURE__ */ new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
			if (this.values && !Array.isArray(this.values)) return /* @__PURE__ */ new Error("Query values must be an array");
			if (this.requiresPreparation()) {
				connection.stream.cork && connection.stream.cork();
				try {
					this.prepare(connection);
				} finally {
					connection.stream.uncork && connection.stream.uncork();
				}
			} else connection.query(this.text);
			return null;
		}
		hasBeenParsed(connection) {
			return this.name && (connection.parsedStatements[this.name] !== void 0 || connection.submittedNamedStatements[this.name] !== void 0);
		}
		handlePortalSuspended(connection) {
			this._getRows(connection, this.rows);
		}
		_getRows(connection, rows) {
			connection.execute({
				portal: this.portal,
				rows
			});
			if (!rows) connection.sync();
			else connection.flush();
		}
		prepare(connection) {
			if (!this.hasBeenParsed(connection)) {
				connection.parse({
					text: this.text,
					name: this.name,
					types: this.types
				});
				if (this.name) connection.submittedNamedStatements[this.name] = this.text;
			}
			try {
				connection.bind({
					portal: this.portal,
					statement: this.name,
					values: this.values,
					binary: this.binary,
					valueMapper: utils.prepareValue
				});
			} catch (err) {
				connection.close({
					type: "S",
					name: this.name
				});
				connection.sync();
				this.handleError(err, connection);
				return;
			}
			connection.describe({
				type: "P",
				name: this.portal || ""
			});
			this._getRows(connection, this.rows);
		}
		handleCopyInResponse(connection) {
			connection.sendCopyFail("No source stream defined");
		}
		handleCopyData(msg, connection) {}
	};
	module.exports = Query;
}));
//#endregion
//#region ../../node_modules/pg-protocol/dist/messages.js
var require_messages = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoticeMessage = exports.DataRowMessage = exports.CommandCompleteMessage = exports.ReadyForQueryMessage = exports.NotificationResponseMessage = exports.BackendKeyDataMessage = exports.AuthenticationMD5Password = exports.ParameterStatusMessage = exports.ParameterDescriptionMessage = exports.RowDescriptionMessage = exports.Field = exports.CopyResponse = exports.CopyDataMessage = exports.DatabaseError = exports.copyDone = exports.emptyQuery = exports.replicationStart = exports.portalSuspended = exports.noData = exports.closeComplete = exports.bindComplete = exports.parseComplete = void 0;
	exports.parseComplete = {
		name: "parseComplete",
		length: 5
	};
	exports.bindComplete = {
		name: "bindComplete",
		length: 5
	};
	exports.closeComplete = {
		name: "closeComplete",
		length: 5
	};
	exports.noData = {
		name: "noData",
		length: 5
	};
	exports.portalSuspended = {
		name: "portalSuspended",
		length: 5
	};
	exports.replicationStart = {
		name: "replicationStart",
		length: 4
	};
	exports.emptyQuery = {
		name: "emptyQuery",
		length: 4
	};
	exports.copyDone = {
		name: "copyDone",
		length: 4
	};
	var DatabaseError = class extends Error {
		constructor(message, length, name) {
			super(message);
			this.length = length;
			this.name = name;
		}
	};
	exports.DatabaseError = DatabaseError;
	var CopyDataMessage = class {
		constructor(length, chunk) {
			this.length = length;
			this.chunk = chunk;
			this.name = "copyData";
		}
	};
	exports.CopyDataMessage = CopyDataMessage;
	var CopyResponse = class {
		constructor(length, name, binary, columnCount) {
			this.length = length;
			this.name = name;
			this.binary = binary;
			this.columnTypes = new Array(columnCount);
		}
	};
	exports.CopyResponse = CopyResponse;
	var Field = class {
		constructor(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format) {
			this.name = name;
			this.tableID = tableID;
			this.columnID = columnID;
			this.dataTypeID = dataTypeID;
			this.dataTypeSize = dataTypeSize;
			this.dataTypeModifier = dataTypeModifier;
			this.format = format;
		}
	};
	exports.Field = Field;
	var RowDescriptionMessage = class {
		constructor(length, fieldCount) {
			this.length = length;
			this.fieldCount = fieldCount;
			this.name = "rowDescription";
			this.fields = new Array(this.fieldCount);
		}
	};
	exports.RowDescriptionMessage = RowDescriptionMessage;
	var ParameterDescriptionMessage = class {
		constructor(length, parameterCount) {
			this.length = length;
			this.parameterCount = parameterCount;
			this.name = "parameterDescription";
			this.dataTypeIDs = new Array(this.parameterCount);
		}
	};
	exports.ParameterDescriptionMessage = ParameterDescriptionMessage;
	var ParameterStatusMessage = class {
		constructor(length, parameterName, parameterValue) {
			this.length = length;
			this.parameterName = parameterName;
			this.parameterValue = parameterValue;
			this.name = "parameterStatus";
		}
	};
	exports.ParameterStatusMessage = ParameterStatusMessage;
	var AuthenticationMD5Password = class {
		constructor(length, salt) {
			this.length = length;
			this.salt = salt;
			this.name = "authenticationMD5Password";
		}
	};
	exports.AuthenticationMD5Password = AuthenticationMD5Password;
	var BackendKeyDataMessage = class {
		constructor(length, processID, secretKey) {
			this.length = length;
			this.processID = processID;
			this.secretKey = secretKey;
			this.name = "backendKeyData";
		}
	};
	exports.BackendKeyDataMessage = BackendKeyDataMessage;
	var NotificationResponseMessage = class {
		constructor(length, processId, channel, payload) {
			this.length = length;
			this.processId = processId;
			this.channel = channel;
			this.payload = payload;
			this.name = "notification";
		}
	};
	exports.NotificationResponseMessage = NotificationResponseMessage;
	var ReadyForQueryMessage = class {
		constructor(length, status) {
			this.length = length;
			this.status = status;
			this.name = "readyForQuery";
		}
	};
	exports.ReadyForQueryMessage = ReadyForQueryMessage;
	var CommandCompleteMessage = class {
		constructor(length, text) {
			this.length = length;
			this.text = text;
			this.name = "commandComplete";
		}
	};
	exports.CommandCompleteMessage = CommandCompleteMessage;
	var DataRowMessage = class {
		constructor(length, fields) {
			this.length = length;
			this.fields = fields;
			this.name = "dataRow";
			this.fieldCount = fields.length;
		}
	};
	exports.DataRowMessage = DataRowMessage;
	var NoticeMessage = class {
		constructor(length, message) {
			this.length = length;
			this.message = message;
			this.name = "notice";
		}
	};
	exports.NoticeMessage = NoticeMessage;
}));
//#endregion
//#region ../../node_modules/pg-protocol/dist/buffer-writer.js
var require_buffer_writer = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Writer = void 0;
	var Writer = class {
		constructor(size = 256) {
			this.size = size;
			this.offset = 5;
			this.headerPosition = 0;
			this.buffer = Buffer.allocUnsafe(size);
		}
		ensure(size) {
			if (this.buffer.length - this.offset < size) {
				const oldBuffer = this.buffer;
				const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
				this.buffer = Buffer.allocUnsafe(newSize);
				oldBuffer.copy(this.buffer, 0, 0, this.offset);
			}
		}
		addInt32(num) {
			this.ensure(4);
			this.buffer[this.offset++] = num >>> 24 & 255;
			this.buffer[this.offset++] = num >>> 16 & 255;
			this.buffer[this.offset++] = num >>> 8 & 255;
			this.buffer[this.offset++] = num >>> 0 & 255;
			return this;
		}
		addInt16(num) {
			this.ensure(2);
			this.buffer[this.offset++] = num >>> 8 & 255;
			this.buffer[this.offset++] = num >>> 0 & 255;
			return this;
		}
		addCString(string) {
			if (!string) this.ensure(1);
			else {
				const len = Buffer.byteLength(string);
				this.ensure(len + 1);
				this.buffer.write(string, this.offset, "utf-8");
				this.offset += len;
			}
			this.buffer[this.offset++] = 0;
			return this;
		}
		addString(string = "") {
			const len = Buffer.byteLength(string);
			this.ensure(len);
			this.buffer.write(string, this.offset);
			this.offset += len;
			return this;
		}
		addInt32PrefixedString(string) {
			const len = Buffer.byteLength(string);
			this.ensure(4 + len);
			const buffer = this.buffer;
			let offset = this.offset;
			buffer[offset++] = len >>> 24 & 255;
			buffer[offset++] = len >>> 16 & 255;
			buffer[offset++] = len >>> 8 & 255;
			buffer[offset++] = len >>> 0 & 255;
			buffer.write(string, offset, "utf-8");
			this.offset = offset + len;
			return this;
		}
		add(otherBuffer) {
			this.ensure(otherBuffer.length);
			otherBuffer.copy(this.buffer, this.offset);
			this.offset += otherBuffer.length;
			return this;
		}
		/**
		* Appends an uninitialized block of {@link size} bytes to the buffer and returns its offset.
		*/
		reserveUnsafe(size) {
			const offset = this.offset;
			this.ensure(size);
			this.offset += size;
			return offset;
		}
		join(code) {
			if (code) {
				this.buffer[this.headerPosition] = code;
				const length = this.offset - (this.headerPosition + 1);
				this.buffer.writeInt32BE(length, this.headerPosition + 1);
			}
			return this.buffer.slice(code ? 0 : 5, this.offset);
		}
		flush(code) {
			const result = this.join(code);
			this.offset = 5;
			this.headerPosition = 0;
			this.buffer = Buffer.allocUnsafe(this.size);
			return result;
		}
		clear() {
			this.offset = 5;
			this.headerPosition = 0;
		}
	};
	exports.Writer = Writer;
}));
//#endregion
//#region ../../node_modules/pg-protocol/dist/serializer.js
var require_serializer = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.serialize = void 0;
	var buffer_writer_1 = require_buffer_writer();
	var writer = new buffer_writer_1.Writer();
	var startup = (opts) => {
		writer.addInt16(3).addInt16(0);
		for (const key of Object.keys(opts)) writer.addCString(key).addCString(opts[key]);
		writer.addCString("client_encoding").addCString("UTF8");
		const bodyBuffer = writer.addCString("").flush();
		const length = bodyBuffer.length + 4;
		return new buffer_writer_1.Writer().addInt32(length).add(bodyBuffer).flush();
	};
	var requestSsl = () => {
		const response = Buffer.allocUnsafe(8);
		response.writeInt32BE(8, 0);
		response.writeInt32BE(80877103, 4);
		return response;
	};
	var password = (password) => {
		return writer.addCString(password).flush(112);
	};
	var sendSASLInitialResponseMessage = function(mechanism, initialResponse) {
		writer.addCString(mechanism).addInt32PrefixedString(initialResponse);
		return writer.flush(112);
	};
	var sendSCRAMClientFinalMessage = function(additionalData) {
		return writer.addString(additionalData).flush(112);
	};
	var query = (text) => {
		return writer.addCString(text).flush(81);
	};
	var emptyArray = [];
	var parse = (query) => {
		const name = query.name || "";
		if (name.length > 63) {
			console.error("Warning! Postgres only supports 63 characters for query names.");
			console.error("You supplied %s (%s)", name, name.length);
			console.error("This can cause conflicts and silent errors executing queries");
		}
		const types = query.types || emptyArray;
		const len = types.length;
		const buffer = writer.addCString(name).addCString(query.text).addInt16(len);
		for (let i = 0; i < len; i++) buffer.addInt32(types[i]);
		return writer.flush(80);
	};
	var writeValues = function(values, valueMapper, formatsOffset) {
		const len = values.length;
		for (let i = 0; i < len; i++) {
			const mappedVal = valueMapper ? valueMapper(values[i], i) : values[i];
			let formatByte = 0;
			if (mappedVal == null) writer.addInt32(-1);
			else if (mappedVal instanceof Buffer) {
				formatByte = 1;
				writer.addInt32(mappedVal.length);
				writer.add(mappedVal);
			} else writer.addInt32PrefixedString(mappedVal);
			const buf = writer.buffer;
			buf[formatsOffset++] = 0;
			buf[formatsOffset++] = formatByte;
		}
	};
	var bind = (config = {}) => {
		const portal = config.portal || "";
		const statement = config.statement || "";
		const binary = config.binary || false;
		const values = config.values || emptyArray;
		const len = values.length;
		writer.addCString(portal).addCString(statement);
		writer.addInt16(len);
		const formatsOffset = writer.reserveUnsafe(len * 2);
		writer.addInt16(len);
		try {
			writeValues(values, config.valueMapper, formatsOffset);
		} catch (err) {
			writer.clear();
			throw err;
		}
		writer.addInt16(1);
		writer.addInt16(binary ? 1 : 0);
		return writer.flush(66);
	};
	var emptyExecute = Buffer.from([
		69,
		0,
		0,
		0,
		9,
		0,
		0,
		0,
		0,
		0
	]);
	var execute = (config) => {
		if (!config || !config.portal && !config.rows) return emptyExecute;
		const portal = config.portal || "";
		const rows = config.rows || 0;
		const portalLength = Buffer.byteLength(portal);
		const len = 4 + portalLength + 1 + 4;
		const buff = Buffer.allocUnsafe(1 + len);
		buff[0] = 69;
		buff.writeInt32BE(len, 1);
		buff.write(portal, 5, "utf-8");
		buff[portalLength + 5] = 0;
		buff.writeUInt32BE(rows, buff.length - 4);
		return buff;
	};
	var cancel = (processID, secretKey) => {
		const buffer = Buffer.allocUnsafe(16);
		buffer.writeInt32BE(16, 0);
		buffer.writeInt16BE(1234, 4);
		buffer.writeInt16BE(5678, 6);
		buffer.writeInt32BE(processID, 8);
		buffer.writeInt32BE(secretKey, 12);
		return buffer;
	};
	var cstringMessage = (code, string) => {
		const len = 4 + Buffer.byteLength(string) + 1;
		const buffer = Buffer.allocUnsafe(1 + len);
		buffer[0] = code;
		buffer.writeInt32BE(len, 1);
		buffer.write(string, 5, "utf-8");
		buffer[len] = 0;
		return buffer;
	};
	var emptyDescribePortal = writer.addCString("P").flush(68);
	var emptyDescribeStatement = writer.addCString("S").flush(68);
	var describe = (msg) => {
		return msg.name ? cstringMessage(68, `${msg.type}${msg.name || ""}`) : msg.type === "P" ? emptyDescribePortal : emptyDescribeStatement;
	};
	var close = (msg) => {
		return cstringMessage(67, `${msg.type}${msg.name || ""}`);
	};
	var copyData = (chunk) => {
		return writer.add(chunk).flush(100);
	};
	var copyFail = (message) => {
		return cstringMessage(102, message);
	};
	var codeOnlyBuffer = (code) => Buffer.from([
		code,
		0,
		0,
		0,
		4
	]);
	var flushBuffer = codeOnlyBuffer(72);
	var syncBuffer = codeOnlyBuffer(83);
	var endBuffer = codeOnlyBuffer(88);
	var copyDoneBuffer = codeOnlyBuffer(99);
	exports.serialize = {
		startup,
		password,
		requestSsl,
		sendSASLInitialResponseMessage,
		sendSCRAMClientFinalMessage,
		query,
		parse,
		bind,
		execute,
		describe,
		close,
		flush: () => flushBuffer,
		sync: () => syncBuffer,
		end: () => endBuffer,
		copyData,
		copyDone: () => copyDoneBuffer,
		copyFail,
		cancel
	};
}));
//#endregion
//#region ../../node_modules/pg-protocol/dist/buffer-reader.js
var require_buffer_reader = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.BufferReader = void 0;
	var BufferReader = class {
		constructor(offset = 0) {
			this.offset = offset;
			this.buffer = Buffer.allocUnsafe(0);
			this.encoding = "utf-8";
		}
		setBuffer(offset, buffer) {
			this.offset = offset;
			this.buffer = buffer;
		}
		int16() {
			const result = this.buffer.readInt16BE(this.offset);
			this.offset += 2;
			return result;
		}
		byte() {
			const result = this.buffer[this.offset];
			this.offset++;
			return result;
		}
		int32() {
			const result = this.buffer.readInt32BE(this.offset);
			this.offset += 4;
			return result;
		}
		uint32() {
			const result = this.buffer.readUInt32BE(this.offset);
			this.offset += 4;
			return result;
		}
		string(length) {
			const result = this.buffer.toString(this.encoding, this.offset, this.offset + length);
			this.offset += length;
			return result;
		}
		cstring() {
			const start = this.offset;
			let end = start;
			while (this.buffer[end++]);
			this.offset = end;
			return this.buffer.toString(this.encoding, start, end - 1);
		}
		bytes(length) {
			const result = this.buffer.slice(this.offset, this.offset + length);
			this.offset += length;
			return result;
		}
	};
	exports.BufferReader = BufferReader;
}));
//#endregion
//#region ../../node_modules/pg-protocol/dist/parser.js
var require_parser = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Parser = void 0;
	var messages_1 = require_messages();
	var buffer_reader_1 = require_buffer_reader();
	var CODE_LENGTH = 1;
	var HEADER_LENGTH = CODE_LENGTH + 4;
	var LATEINIT_LENGTH = -1;
	var emptyBuffer = Buffer.allocUnsafe(0);
	var Parser = class {
		constructor(opts) {
			this.buffer = emptyBuffer;
			this.bufferLength = 0;
			this.bufferOffset = 0;
			this.reader = new buffer_reader_1.BufferReader();
			if ((opts === null || opts === void 0 ? void 0 : opts.mode) === "binary") throw new Error("Binary mode not supported yet");
			this.mode = (opts === null || opts === void 0 ? void 0 : opts.mode) || "text";
		}
		parse(buffer, callback) {
			this.mergeBuffer(buffer);
			const bufferFullLength = this.bufferOffset + this.bufferLength;
			let offset = this.bufferOffset;
			while (offset + HEADER_LENGTH <= bufferFullLength) {
				const code = this.buffer[offset];
				const length = this.buffer.readUInt32BE(offset + CODE_LENGTH);
				const fullMessageLength = CODE_LENGTH + length;
				if (fullMessageLength + offset <= bufferFullLength) {
					callback(this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer));
					offset += fullMessageLength;
				} else break;
			}
			if (offset === bufferFullLength) {
				this.buffer = emptyBuffer;
				this.bufferLength = 0;
				this.bufferOffset = 0;
			} else {
				this.bufferLength = bufferFullLength - offset;
				this.bufferOffset = offset;
			}
		}
		mergeBuffer(buffer) {
			if (this.bufferLength > 0) {
				const newLength = this.bufferLength + buffer.byteLength;
				if (newLength + this.bufferOffset > this.buffer.byteLength) {
					let newBuffer;
					if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) newBuffer = this.buffer;
					else {
						let newBufferLength = this.buffer.byteLength * 2;
						while (newLength >= newBufferLength) newBufferLength *= 2;
						newBuffer = Buffer.allocUnsafe(newBufferLength);
					}
					this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength);
					this.buffer = newBuffer;
					this.bufferOffset = 0;
				}
				buffer.copy(this.buffer, this.bufferOffset + this.bufferLength);
				this.bufferLength = newLength;
			} else {
				this.buffer = buffer;
				this.bufferOffset = 0;
				this.bufferLength = buffer.byteLength;
			}
		}
		handlePacket(offset, code, length, bytes) {
			const { reader } = this;
			reader.setBuffer(offset, bytes);
			let message;
			switch (code) {
				case 50:
					message = messages_1.bindComplete;
					break;
				case 49:
					message = messages_1.parseComplete;
					break;
				case 51:
					message = messages_1.closeComplete;
					break;
				case 110:
					message = messages_1.noData;
					break;
				case 115:
					message = messages_1.portalSuspended;
					break;
				case 99:
					message = messages_1.copyDone;
					break;
				case 87:
					message = messages_1.replicationStart;
					break;
				case 73:
					message = messages_1.emptyQuery;
					break;
				case 68:
					message = parseDataRowMessage(reader);
					break;
				case 67:
					message = parseCommandCompleteMessage(reader);
					break;
				case 90:
					message = parseReadyForQueryMessage(reader);
					break;
				case 65:
					message = parseNotificationMessage(reader);
					break;
				case 82:
					message = parseAuthenticationResponse(reader, length);
					break;
				case 83:
					message = parseParameterStatusMessage(reader);
					break;
				case 75:
					message = parseBackendKeyData(reader);
					break;
				case 69:
					message = parseErrorMessage(reader, "error");
					break;
				case 78:
					message = parseErrorMessage(reader, "notice");
					break;
				case 84:
					message = parseRowDescriptionMessage(reader);
					break;
				case 116:
					message = parseParameterDescriptionMessage(reader);
					break;
				case 71:
					message = parseCopyInMessage(reader);
					break;
				case 72:
					message = parseCopyOutMessage(reader);
					break;
				case 100:
					message = parseCopyData(reader, length);
					break;
				default: return new messages_1.DatabaseError("received invalid response: " + code.toString(16), length, "error");
			}
			reader.setBuffer(0, emptyBuffer);
			message.length = length;
			return message;
		}
	};
	exports.Parser = Parser;
	var parseReadyForQueryMessage = (reader) => {
		const status = reader.string(1);
		return new messages_1.ReadyForQueryMessage(LATEINIT_LENGTH, status);
	};
	var parseCommandCompleteMessage = (reader) => {
		const text = reader.cstring();
		return new messages_1.CommandCompleteMessage(LATEINIT_LENGTH, text);
	};
	var parseCopyData = (reader, length) => {
		const chunk = reader.bytes(length - 4);
		return new messages_1.CopyDataMessage(LATEINIT_LENGTH, chunk);
	};
	var parseCopyInMessage = (reader) => parseCopyMessage(reader, "copyInResponse");
	var parseCopyOutMessage = (reader) => parseCopyMessage(reader, "copyOutResponse");
	var parseCopyMessage = (reader, messageName) => {
		const isBinary = reader.byte() !== 0;
		const columnCount = reader.int16();
		const message = new messages_1.CopyResponse(LATEINIT_LENGTH, messageName, isBinary, columnCount);
		for (let i = 0; i < columnCount; i++) message.columnTypes[i] = reader.int16();
		return message;
	};
	var parseNotificationMessage = (reader) => {
		const processId = reader.int32();
		const channel = reader.cstring();
		const payload = reader.cstring();
		return new messages_1.NotificationResponseMessage(LATEINIT_LENGTH, processId, channel, payload);
	};
	var parseRowDescriptionMessage = (reader) => {
		const fieldCount = reader.int16();
		const message = new messages_1.RowDescriptionMessage(LATEINIT_LENGTH, fieldCount);
		for (let i = 0; i < fieldCount; i++) message.fields[i] = parseField(reader);
		return message;
	};
	var parseField = (reader) => {
		const name = reader.cstring();
		const tableID = reader.uint32();
		const columnID = reader.int16();
		const dataTypeID = reader.uint32();
		const dataTypeSize = reader.int16();
		const dataTypeModifier = reader.int32();
		const mode = reader.int16() === 0 ? "text" : "binary";
		return new messages_1.Field(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, mode);
	};
	var parseParameterDescriptionMessage = (reader) => {
		const parameterCount = reader.int16();
		const message = new messages_1.ParameterDescriptionMessage(LATEINIT_LENGTH, parameterCount);
		for (let i = 0; i < parameterCount; i++) message.dataTypeIDs[i] = reader.uint32();
		return message;
	};
	var parseDataRowMessage = (reader) => {
		const fieldCount = reader.int16();
		const fields = new Array(fieldCount);
		for (let i = 0; i < fieldCount; i++) {
			const len = reader.int32();
			fields[i] = len === -1 ? null : reader.string(len);
		}
		return new messages_1.DataRowMessage(LATEINIT_LENGTH, fields);
	};
	var parseParameterStatusMessage = (reader) => {
		const name = reader.cstring();
		const value = reader.cstring();
		return new messages_1.ParameterStatusMessage(LATEINIT_LENGTH, name, value);
	};
	var parseBackendKeyData = (reader) => {
		const processID = reader.int32();
		const secretKey = reader.int32();
		return new messages_1.BackendKeyDataMessage(LATEINIT_LENGTH, processID, secretKey);
	};
	var parseAuthenticationResponse = (reader, length) => {
		const code = reader.int32();
		const message = {
			name: "authenticationOk",
			length
		};
		switch (code) {
			case 0: break;
			case 3:
				if (message.length === 8) message.name = "authenticationCleartextPassword";
				break;
			case 5:
				if (message.length === 12) {
					message.name = "authenticationMD5Password";
					const salt = reader.bytes(4);
					return new messages_1.AuthenticationMD5Password(LATEINIT_LENGTH, salt);
				}
				break;
			case 10:
				{
					message.name = "authenticationSASL";
					message.mechanisms = [];
					let mechanism;
					do {
						mechanism = reader.cstring();
						if (mechanism) message.mechanisms.push(mechanism);
					} while (mechanism);
				}
				break;
			case 11:
				message.name = "authenticationSASLContinue";
				message.data = reader.string(length - 8);
				break;
			case 12:
				message.name = "authenticationSASLFinal";
				message.data = reader.string(length - 8);
				break;
			default: throw new Error("Unknown authenticationOk message type " + code);
		}
		return message;
	};
	var parseErrorMessage = (reader, name) => {
		const fields = {};
		let fieldType = reader.string(1);
		while (fieldType !== "\0") {
			fields[fieldType] = reader.cstring();
			fieldType = reader.string(1);
		}
		const messageValue = fields.M;
		const message = name === "notice" ? new messages_1.NoticeMessage(LATEINIT_LENGTH, messageValue) : new messages_1.DatabaseError(messageValue, LATEINIT_LENGTH, name);
		message.severity = fields.S;
		message.code = fields.C;
		message.detail = fields.D;
		message.hint = fields.H;
		message.position = fields.P;
		message.internalPosition = fields.p;
		message.internalQuery = fields.q;
		message.where = fields.W;
		message.schema = fields.s;
		message.table = fields.t;
		message.column = fields.c;
		message.dataType = fields.d;
		message.constraint = fields.n;
		message.file = fields.F;
		message.line = fields.L;
		message.routine = fields.R;
		return message;
	};
}));
//#endregion
//#region ../../node_modules/pg-protocol/dist/index.js
var require_dist = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DatabaseError = exports.serialize = void 0;
	exports.parse = parse;
	var messages_1 = require_messages();
	Object.defineProperty(exports, "DatabaseError", {
		enumerable: true,
		get: function() {
			return messages_1.DatabaseError;
		}
	});
	var serializer_1 = require_serializer();
	Object.defineProperty(exports, "serialize", {
		enumerable: true,
		get: function() {
			return serializer_1.serialize;
		}
	});
	var parser_1 = require_parser();
	function parse(stream, callback) {
		const parser = new parser_1.Parser();
		stream.on("data", (buffer) => parser.parse(buffer, callback));
		return new Promise((resolve) => stream.on("end", () => resolve()));
	}
}));
//#endregion
//#region ../../node_modules/pg-cloudflare/dist/empty.js
var require_empty = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = {};
}));
//#endregion
//#region ../../node_modules/pg/lib/stream.js
var require_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { getStream, getSecureStream } = getStreamFuncs();
	module.exports = {
		/**
		* Get a socket stream compatible with the current runtime environment.
		* @returns {Duplex}
		*/
		getStream,
		/**
		* Get a TLS secured socket, compatible with the current environment,
		* using the socket and other settings given in `options`.
		* @returns {Duplex}
		*/
		getSecureStream
	};
	/**
	* The stream functions that work in Node.js
	*/
	function getNodejsStreamFuncs() {
		function getStream(ssl) {
			return new (__require("net")).Socket();
		}
		function getSecureStream(options) {
			return __require("tls").connect(options);
		}
		return {
			getStream,
			getSecureStream
		};
	}
	/**
	* The stream functions that work in Cloudflare Workers
	*/
	function getCloudflareStreamFuncs() {
		function getStream(ssl) {
			const { CloudflareSocket } = require_empty();
			return new CloudflareSocket(ssl);
		}
		function getSecureStream(options) {
			options.socket.startTls(options);
			return options.socket;
		}
		return {
			getStream,
			getSecureStream
		};
	}
	/**
	* Are we running in a Cloudflare Worker?
	*
	* @returns true if the code is currently running inside a Cloudflare Worker.
	*/
	function isCloudflareRuntime() {
		if (typeof navigator === "object" && navigator !== null && typeof navigator.userAgent === "string") return navigator.userAgent === "Cloudflare-Workers";
		if (typeof Response === "function") {
			const resp = new Response(null, { cf: { thing: true } });
			if (typeof resp.cf === "object" && resp.cf !== null && resp.cf.thing) return true;
		}
		return false;
	}
	function getStreamFuncs() {
		if (isCloudflareRuntime()) return getCloudflareStreamFuncs();
		return getNodejsStreamFuncs();
	}
}));
//#endregion
//#region ../../node_modules/pg/lib/connection.js
var require_connection = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var EventEmitter$4 = __require("events").EventEmitter;
	var { parse, serialize } = require_dist();
	var stream = require_stream();
	var { getStream } = stream;
	var flushBuffer = serialize.flush();
	var syncBuffer = serialize.sync();
	var endBuffer = serialize.end();
	var Connection$1 = class extends EventEmitter$4 {
		constructor(config) {
			super();
			config = config || {};
			this.stream = config.stream || getStream(config.ssl);
			if (typeof this.stream === "function") this.stream = this.stream(config);
			this._keepAlive = config.keepAlive;
			this._keepAliveInitialDelayMillis = config.keepAliveInitialDelayMillis;
			this.parsedStatements = {};
			this.submittedNamedStatements = {};
			this.ssl = config.ssl || false;
			this.sslNegotiation = config.sslNegotiation || "postgres";
			this._ending = false;
			this._emitMessage = false;
			const self = this;
			this.on("newListener", function(eventName) {
				if (eventName === "message") self._emitMessage = true;
			});
		}
		connect(port, host) {
			const self = this;
			this._connecting = true;
			this.stream.setNoDelay(true);
			this.stream.connect(port, host);
			this.stream.once("connect", function() {
				if (self._keepAlive) self.stream.setKeepAlive(true, self._keepAliveInitialDelayMillis);
				self.emit("connect");
			});
			const reportStreamError = function(error) {
				if (self._ending && (error.code === "ECONNRESET" || error.code === "EPIPE")) return;
				self.emit("error", error);
			};
			this.stream.on("error", reportStreamError);
			this.stream.on("close", function() {
				self.emit("end");
			});
			if (!this.ssl) return this.attachListeners(this.stream);
			if (this.sslNegotiation === "direct") return this.stream.once("connect", function() {
				self.upgradeToSSL(host, reportStreamError);
			});
			this.stream.once("data", function(buffer) {
				switch (buffer.toString("utf8")) {
					case "S": break;
					case "N":
						self.stream.end();
						return self.emit("error", /* @__PURE__ */ new Error("The server does not support SSL connections"));
					default:
						self.stream.end();
						return self.emit("error", /* @__PURE__ */ new Error("There was an error establishing an SSL connection"));
				}
				self.upgradeToSSL(host, reportStreamError);
			});
		}
		upgradeToSSL(host, reportStreamError) {
			const self = this;
			const options = {
				socket: self.stream,
				host
			};
			if (self.ssl !== true) {
				Object.assign(options, self.ssl);
				if ("key" in self.ssl) options.key = self.ssl.key;
			}
			if (self.sslNegotiation === "direct") options.ALPNProtocols = ["postgresql"];
			const net = __require("net");
			if (net.isIP && net.isIP(host) === 0) options.servername = host;
			try {
				self.stream = stream.getSecureStream(options);
			} catch (err) {
				return self.emit("error", err);
			}
			self.attachListeners(self.stream);
			self.stream.on("error", reportStreamError);
			self.emit("sslconnect");
		}
		attachListeners(stream) {
			parse(stream, (msg) => {
				const eventName = msg.name === "error" ? "errorMessage" : msg.name;
				if (this._emitMessage) this.emit("message", msg);
				this.emit(eventName, msg);
			});
		}
		requestSsl() {
			this.stream.write(serialize.requestSsl());
		}
		startup(config) {
			this.stream.write(serialize.startup(config));
		}
		cancel(processID, secretKey) {
			this._send(serialize.cancel(processID, secretKey));
		}
		password(password) {
			this._send(serialize.password(password));
		}
		sendSASLInitialResponseMessage(mechanism, initialResponse) {
			this._send(serialize.sendSASLInitialResponseMessage(mechanism, initialResponse));
		}
		sendSCRAMClientFinalMessage(additionalData) {
			this._send(serialize.sendSCRAMClientFinalMessage(additionalData));
		}
		_send(buffer) {
			if (!this.stream.writable) return false;
			return this.stream.write(buffer);
		}
		query(text) {
			this._send(serialize.query(text));
		}
		parse(query) {
			this._send(serialize.parse(query));
		}
		bind(config) {
			this._send(serialize.bind(config));
		}
		execute(config) {
			this._send(serialize.execute(config));
		}
		flush() {
			if (this.stream.writable) this.stream.write(flushBuffer);
		}
		sync() {
			this._send(syncBuffer);
		}
		ref() {
			this.stream.ref();
		}
		unref() {
			this.stream.unref();
		}
		end() {
			this._ending = true;
			if (!this._connecting || !this.stream.writable) {
				this.stream.end();
				return;
			}
			return this.stream.write(endBuffer, () => {
				this.stream.end();
			});
		}
		close(msg) {
			this._send(serialize.close(msg));
		}
		describe(msg) {
			this._send(serialize.describe(msg));
		}
		sendCopyFromChunk(chunk) {
			this._send(serialize.copyData(chunk));
		}
		endCopyFrom() {
			this._send(serialize.copyDone());
		}
		sendCopyFail(msg) {
			this._send(serialize.copyFail(msg));
		}
	};
	module.exports = Connection$1;
}));
//#endregion
//#region ../../node_modules/split2/index.js
var require_split2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { Transform } = __require("stream");
	var { StringDecoder } = __require("string_decoder");
	var kLast = Symbol("last");
	var kDecoder = Symbol("decoder");
	function transform(chunk, enc, cb) {
		let list;
		if (this.overflow) {
			list = this[kDecoder].write(chunk).split(this.matcher);
			if (list.length === 1) return cb();
			list.shift();
			this.overflow = false;
		} else {
			this[kLast] += this[kDecoder].write(chunk);
			list = this[kLast].split(this.matcher);
		}
		this[kLast] = list.pop();
		for (let i = 0; i < list.length; i++) try {
			push(this, this.mapper(list[i]));
		} catch (error) {
			return cb(error);
		}
		this.overflow = this[kLast].length > this.maxLength;
		if (this.overflow && !this.skipOverflow) {
			cb(/* @__PURE__ */ new Error("maximum buffer reached"));
			return;
		}
		cb();
	}
	function flush(cb) {
		this[kLast] += this[kDecoder].end();
		if (this[kLast]) try {
			push(this, this.mapper(this[kLast]));
		} catch (error) {
			return cb(error);
		}
		cb();
	}
	function push(self, val) {
		if (val !== void 0) self.push(val);
	}
	function noop(incoming) {
		return incoming;
	}
	function split(matcher, mapper, options) {
		matcher = matcher || /\r?\n/;
		mapper = mapper || noop;
		options = options || {};
		switch (arguments.length) {
			case 1:
				if (typeof matcher === "function") {
					mapper = matcher;
					matcher = /\r?\n/;
				} else if (typeof matcher === "object" && !(matcher instanceof RegExp) && !matcher[Symbol.split]) {
					options = matcher;
					matcher = /\r?\n/;
				}
				break;
			case 2: if (typeof matcher === "function") {
				options = mapper;
				mapper = matcher;
				matcher = /\r?\n/;
			} else if (typeof mapper === "object") {
				options = mapper;
				mapper = noop;
			}
		}
		options = Object.assign({}, options);
		options.autoDestroy = true;
		options.transform = transform;
		options.flush = flush;
		options.readableObjectMode = true;
		const stream = new Transform(options);
		stream[kLast] = "";
		stream[kDecoder] = new StringDecoder("utf8");
		stream.matcher = matcher;
		stream.mapper = mapper;
		stream.maxLength = options.maxLength;
		stream.skipOverflow = options.skipOverflow || false;
		stream.overflow = false;
		stream._destroy = function(err, cb) {
			this._writableState.errorEmitted = false;
			cb(err);
		};
		return stream;
	}
	module.exports = split;
}));
//#endregion
//#region ../../node_modules/pgpass/lib/helper.js
var require_helper = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var path = __require("path"), Stream = __require("stream").Stream, split = require_split2(), util$2 = __require("util"), defaultPort = 5432, isWin = process.platform === "win32", warnStream = process.stderr;
	var S_IRWXG = 56, S_IRWXO = 7, S_IFMT = 61440, S_IFREG = 32768;
	function isRegFile(mode) {
		return (mode & S_IFMT) == S_IFREG;
	}
	var fieldNames = [
		"host",
		"port",
		"database",
		"user",
		"password"
	];
	var nrOfFields = fieldNames.length;
	var passKey = fieldNames[nrOfFields - 1];
	function warn() {
		if (warnStream instanceof Stream && true === warnStream.writable) {
			var args = Array.prototype.slice.call(arguments).concat("\n");
			warnStream.write(util$2.format.apply(util$2, args));
		}
	}
	Object.defineProperty(module.exports, "isWin", {
		get: function() {
			return isWin;
		},
		set: function(val) {
			isWin = val;
		}
	});
	module.exports.warnTo = function(stream) {
		var old = warnStream;
		warnStream = stream;
		return old;
	};
	module.exports.getFileName = function(rawEnv) {
		var env = rawEnv || process.env;
		return env.PGPASSFILE || (isWin ? path.join(env.APPDATA || "./", "postgresql", "pgpass.conf") : path.join(env.HOME || "./", ".pgpass"));
	};
	module.exports.usePgPass = function(stats, fname) {
		if (Object.prototype.hasOwnProperty.call(process.env, "PGPASSWORD")) return false;
		if (isWin) return true;
		fname = fname || "<unkn>";
		if (!isRegFile(stats.mode)) {
			warn("WARNING: password file \"%s\" is not a plain file", fname);
			return false;
		}
		if (stats.mode & (S_IRWXG | S_IRWXO)) {
			warn("WARNING: password file \"%s\" has group or world access; permissions should be u=rw (0600) or less", fname);
			return false;
		}
		return true;
	};
	var matcher = module.exports.match = function(connInfo, entry) {
		return fieldNames.slice(0, -1).reduce(function(prev, field, idx) {
			if (idx == 1) {
				if (Number(connInfo[field] || defaultPort) === Number(entry[field])) return prev && true;
			}
			return prev && (entry[field] === "*" || entry[field] === connInfo[field]);
		}, true);
	};
	module.exports.getPassword = function(connInfo, stream, cb) {
		var pass;
		var lineStream = stream.pipe(split());
		function onLine(line) {
			var entry = parseLine(line);
			if (entry && isValidEntry(entry) && matcher(connInfo, entry)) {
				pass = entry[passKey];
				lineStream.end();
			}
		}
		var onEnd = function() {
			stream.destroy();
			cb(pass);
		};
		var onErr = function(err) {
			stream.destroy();
			warn("WARNING: error on reading file: %s", err);
			cb(void 0);
		};
		stream.on("error", onErr);
		lineStream.on("data", onLine).on("end", onEnd).on("error", onErr);
	};
	var parseLine = module.exports.parseLine = function(line) {
		if (line.length < 11 || line.match(/^\s+#/)) return null;
		var curChar = "";
		var prevChar = "";
		var fieldIdx = 0;
		var startIdx = 0;
		var obj = {};
		var isLastField = false;
		var addToObj = function(idx, i0, i1) {
			var field = line.substring(i0, i1);
			if (!Object.hasOwnProperty.call(process.env, "PGPASS_NO_DEESCAPE")) field = field.replace(/\\([:\\])/g, "$1");
			obj[fieldNames[idx]] = field;
		};
		for (var i = 0; i < line.length - 1; i += 1) {
			curChar = line.charAt(i + 1);
			prevChar = line.charAt(i);
			isLastField = fieldIdx == nrOfFields - 1;
			if (isLastField) {
				addToObj(fieldIdx, startIdx);
				break;
			}
			if (i >= 0 && curChar == ":" && prevChar !== "\\") {
				addToObj(fieldIdx, startIdx, i + 1);
				startIdx = i + 2;
				fieldIdx += 1;
			}
		}
		obj = Object.keys(obj).length === nrOfFields ? obj : null;
		return obj;
	};
	var isValidEntry = module.exports.isValidEntry = function(entry) {
		var rules = {
			0: function(x) {
				return x.length > 0;
			},
			1: function(x) {
				if (x === "*") return true;
				x = Number(x);
				return isFinite(x) && x > 0 && x < 9007199254740992 && Math.floor(x) === x;
			},
			2: function(x) {
				return x.length > 0;
			},
			3: function(x) {
				return x.length > 0;
			},
			4: function(x) {
				return x.length > 0;
			}
		};
		for (var idx = 0; idx < fieldNames.length; idx += 1) {
			var rule = rules[idx];
			if (!rule(entry[fieldNames[idx]] || "")) return false;
		}
		return true;
	};
}));
//#endregion
//#region ../../node_modules/pgpass/lib/index.js
var require_lib$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	__require("path");
	var fs = __require("fs"), helper = require_helper();
	module.exports = function(connInfo, cb) {
		var file = helper.getFileName();
		fs.stat(file, function(err, stat) {
			if (err || !helper.usePgPass(stat, file)) return cb(void 0);
			var st = fs.createReadStream(file);
			helper.getPassword(connInfo, st, cb);
		});
	};
	module.exports.warnTo = helper.warnTo;
}));
//#endregion
//#region ../../node_modules/pg/lib/client.js
var require_client$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var EventEmitter$3 = __require("events").EventEmitter;
	var utils = require_utils$1();
	var nodeUtils$1 = __require("util");
	var sasl = require_sasl();
	var TypeOverrides = require_type_overrides();
	var ConnectionParameters = require_connection_parameters();
	var Query = require_query$1();
	var defaults = require_defaults();
	var Connection = require_connection();
	var crypto = require_utils();
	var activeQueryDeprecationNotice = nodeUtils$1.deprecate(() => {}, "Client.activeQuery is deprecated and will be removed in pg@9.0");
	var queryQueueDeprecationNotice = nodeUtils$1.deprecate(() => {}, "Client.queryQueue is deprecated and will be removed in pg@9.0.");
	var pgPassDeprecationNotice = nodeUtils$1.deprecate(() => {}, "pgpass support is deprecated and will be removed in pg@9.0. You can provide an async function as the password property to the Client/Pool constructor that returns a password instead. Within this function you can call the pgpass module in your own code.");
	var byoPromiseDeprecationNotice = nodeUtils$1.deprecate(() => {}, "Passing a custom Promise implementation to the Client/Pool constructor is deprecated and will be removed in pg@9.0.");
	var queryQueueLengthDeprecationNotice = nodeUtils$1.deprecate(() => {}, "Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead.");
	function coerceNumberOrDefault(value, defaultValue) {
		if (typeof value === "number") return Number.isFinite(value) ? value : defaultValue;
		if (typeof value === "string" && value.trim() !== "") {
			const n = Number(value);
			return Number.isFinite(n) ? n : defaultValue;
		}
		return defaultValue;
	}
	var Client = class extends EventEmitter$3 {
		constructor(config) {
			super();
			this.connectionParameters = new ConnectionParameters(config);
			this.user = this.connectionParameters.user;
			this.database = this.connectionParameters.database;
			this.port = this.connectionParameters.port;
			this.host = this.connectionParameters.host;
			Object.defineProperty(this, "password", {
				configurable: true,
				enumerable: false,
				writable: true,
				value: this.connectionParameters.password
			});
			this.replication = this.connectionParameters.replication;
			const c = config || {};
			if (c.Promise) byoPromiseDeprecationNotice();
			this._Promise = c.Promise || global.Promise;
			this._types = new TypeOverrides(c.types);
			this._ending = false;
			this._ended = false;
			this._connecting = false;
			this._connected = false;
			this._connectionError = false;
			this._queryable = true;
			this._activeQuery = null;
			this._txStatus = null;
			this.enableChannelBinding = Boolean(c.enableChannelBinding);
			this.scramMaxIterations = coerceNumberOrDefault(c.scramMaxIterations, sasl.DEFAULT_MAX_SCRAM_ITERATIONS);
			this.connection = c.connection || new Connection({
				stream: c.stream,
				ssl: this.connectionParameters.ssl,
				sslNegotiation: this.connectionParameters.sslnegotiation,
				keepAlive: c.keepAlive || false,
				keepAliveInitialDelayMillis: c.keepAliveInitialDelayMillis || 0,
				encoding: this.connectionParameters.client_encoding || "utf8"
			});
			this._queryQueue = [];
			this._sentQueryQueue = [];
			this.pipeline = Boolean(c.pipeline);
			this.binary = c.binary || defaults.binary;
			this.processID = null;
			this.secretKey = null;
			this.ssl = this.connectionParameters.ssl || false;
			this.sslNegotiation = this.connectionParameters.sslnegotiation || "postgres";
			if (this.ssl && this.ssl.key) Object.defineProperty(this.ssl, "key", { enumerable: false });
			this._connectionTimeoutMillis = c.connectionTimeoutMillis || 0;
		}
		get activeQuery() {
			activeQueryDeprecationNotice();
			return this._activeQuery;
		}
		set activeQuery(val) {
			activeQueryDeprecationNotice();
			this._activeQuery = val;
		}
		_getActiveQuery() {
			return this._activeQuery;
		}
		_errorAllQueries(err) {
			const enqueueError = (query) => {
				process.nextTick(() => {
					query.handleError(err, this.connection);
				});
			};
			const activeQuery = this._getActiveQuery();
			if (activeQuery) {
				enqueueError(activeQuery);
				this._activeQuery = null;
			}
			this._sentQueryQueue.forEach(enqueueError);
			this._sentQueryQueue.length = 0;
			this._queryQueue.forEach(enqueueError);
			this._queryQueue.length = 0;
		}
		_connect(callback) {
			const self = this;
			const con = this.connection;
			this._connectionCallback = callback;
			if (this._connecting || this._connected) {
				const err = /* @__PURE__ */ new Error("Client has already been connected. You cannot reuse a client.");
				process.nextTick(() => {
					callback(err);
				});
				return;
			}
			this._connecting = true;
			if (this._connectionTimeoutMillis > 0) {
				this.connectionTimeoutHandle = setTimeout(() => {
					con._ending = true;
					con.stream.destroy(/* @__PURE__ */ new Error("timeout expired"));
				}, this._connectionTimeoutMillis);
				if (this.connectionTimeoutHandle.unref) this.connectionTimeoutHandle.unref();
			}
			if (this.host && this.host.indexOf("/") === 0) con.connect(this.host + "/.s.PGSQL." + this.port);
			else con.connect(this.port, this.host);
			con.on("connect", function() {
				if (self.ssl) {
					if (self.sslNegotiation !== "direct") con.requestSsl();
				} else con.startup(self.getStartupConf());
			});
			con.on("sslconnect", function() {
				con.startup(self.getStartupConf());
			});
			this._attachListeners(con);
			con.once("end", () => {
				const error = this._ending ? /* @__PURE__ */ new Error("Connection terminated") : /* @__PURE__ */ new Error("Connection terminated unexpectedly");
				clearTimeout(this.connectionTimeoutHandle);
				this._errorAllQueries(error);
				this._ended = true;
				if (!this._ending) {
					if (this._connecting && !this._connectionError) if (this._connectionCallback) this._connectionCallback(error);
					else this._handleErrorEvent(error);
					else if (!this._connectionError) this._handleErrorEvent(error);
				}
				process.nextTick(() => {
					this.emit("end");
				});
			});
		}
		connect(callback) {
			if (callback) {
				this._connect(callback);
				return;
			}
			return new this._Promise((resolve, reject) => {
				this._connect((error) => {
					if (error) reject(error);
					else resolve(this);
				});
			});
		}
		_attachListeners(con) {
			con.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this));
			con.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this));
			con.on("authenticationSASL", this._handleAuthSASL.bind(this));
			con.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this));
			con.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this));
			con.on("backendKeyData", this._handleBackendKeyData.bind(this));
			con.on("error", this._handleErrorEvent.bind(this));
			con.on("errorMessage", this._handleErrorMessage.bind(this));
			con.on("readyForQuery", this._handleReadyForQuery.bind(this));
			con.on("notice", this._handleNotice.bind(this));
			con.on("rowDescription", this._handleRowDescription.bind(this));
			con.on("dataRow", this._handleDataRow.bind(this));
			con.on("portalSuspended", this._handlePortalSuspended.bind(this));
			con.on("emptyQuery", this._handleEmptyQuery.bind(this));
			con.on("commandComplete", this._handleCommandComplete.bind(this));
			con.on("parseComplete", this._handleParseComplete.bind(this));
			con.on("copyInResponse", this._handleCopyInResponse.bind(this));
			con.on("copyData", this._handleCopyData.bind(this));
			con.on("notification", this._handleNotification.bind(this));
		}
		_getPassword(cb) {
			const con = this.connection;
			if (typeof this.password === "function") this._Promise.resolve().then(() => this.password(this.connectionParameters)).then((pass) => {
				if (pass !== void 0) {
					if (typeof pass !== "string") {
						con.emit("error", /* @__PURE__ */ new TypeError("Password must be a string"));
						return;
					}
					this.connectionParameters.password = this.password = pass;
				} else this.connectionParameters.password = this.password = null;
				cb();
			}).catch((err) => {
				con.emit("error", err);
			});
			else if (this.password !== null) cb();
			else try {
				require_lib$1()(this.connectionParameters, (pass) => {
					if (void 0 !== pass) {
						pgPassDeprecationNotice();
						this.connectionParameters.password = this.password = pass;
					}
					cb();
				});
			} catch (e) {
				this.emit("error", e);
			}
		}
		_handleAuthCleartextPassword(msg) {
			this._getPassword(() => {
				this.connection.password(this.password);
			});
		}
		_handleAuthMD5Password(msg) {
			this._getPassword(async () => {
				try {
					const hashedPassword = await crypto.postgresMd5PasswordHash(this.user, this.password, msg.salt);
					this.connection.password(hashedPassword);
				} catch (e) {
					this.emit("error", e);
				}
			});
		}
		_handleAuthSASL(msg) {
			this._getPassword(() => {
				try {
					this.saslSession = sasl.startSession(msg.mechanisms, this.enableChannelBinding && this.connection.stream, this.scramMaxIterations);
					this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response);
				} catch (err) {
					this.connection.emit("error", err);
				}
			});
		}
		async _handleAuthSASLContinue(msg) {
			try {
				await sasl.continueSession(this.saslSession, this.password, msg.data, this.enableChannelBinding && this.connection.stream);
				this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
			} catch (err) {
				this.connection.emit("error", err);
			}
		}
		_handleAuthSASLFinal(msg) {
			try {
				sasl.finalizeSession(this.saslSession, msg.data);
				this.saslSession = null;
			} catch (err) {
				this.connection.emit("error", err);
			}
		}
		_handleBackendKeyData(msg) {
			this.processID = msg.processID;
			this.secretKey = msg.secretKey;
		}
		_handleReadyForQuery(msg) {
			if (this._connecting) {
				this._connecting = false;
				this._connected = true;
				clearTimeout(this.connectionTimeoutHandle);
				if (this._connectionCallback) {
					this._connectionCallback(null, this);
					this._connectionCallback = null;
				}
				this.emit("connect");
			}
			const activeQuery = this._getActiveQuery();
			this._activeQuery = null;
			this._txStatus = msg?.status ?? null;
			this.readyForQuery = true;
			if (activeQuery) activeQuery.handleReadyForQuery(this.connection);
			this._pulseQueryQueue();
		}
		_handleErrorWhileConnecting(err) {
			if (this._connectionError) return;
			this._connectionError = true;
			clearTimeout(this.connectionTimeoutHandle);
			if (this._connectionCallback) return this._connectionCallback(err);
			this.emit("error", err);
		}
		_handleErrorEvent(err) {
			if (this._connecting) return this._handleErrorWhileConnecting(err);
			this._queryable = false;
			this._errorAllQueries(err);
			this.emit("error", err);
		}
		_handleErrorMessage(msg) {
			if (this._connecting) return this._handleErrorWhileConnecting(msg);
			const activeQuery = this._getActiveQuery();
			if (!activeQuery) {
				this._handleErrorEvent(msg);
				return;
			}
			this._activeQuery = null;
			if (activeQuery.name) delete this.connection.submittedNamedStatements[activeQuery.name];
			activeQuery.handleError(msg, this.connection);
		}
		_handleRowDescription(msg) {
			const activeQuery = this._getActiveQuery();
			if (activeQuery == null) {
				const error = /* @__PURE__ */ new Error("Received unexpected rowDescription message from backend.");
				this._handleErrorEvent(error);
				return;
			}
			activeQuery.handleRowDescription(msg);
		}
		_handleDataRow(msg) {
			const activeQuery = this._getActiveQuery();
			if (activeQuery == null) {
				const error = /* @__PURE__ */ new Error("Received unexpected dataRow message from backend.");
				this._handleErrorEvent(error);
				return;
			}
			activeQuery.handleDataRow(msg);
		}
		_handlePortalSuspended(msg) {
			const activeQuery = this._getActiveQuery();
			if (activeQuery == null) {
				const error = /* @__PURE__ */ new Error("Received unexpected portalSuspended message from backend.");
				this._handleErrorEvent(error);
				return;
			}
			activeQuery.handlePortalSuspended(this.connection);
		}
		_handleEmptyQuery(msg) {
			const activeQuery = this._getActiveQuery();
			if (activeQuery == null) {
				const error = /* @__PURE__ */ new Error("Received unexpected emptyQuery message from backend.");
				this._handleErrorEvent(error);
				return;
			}
			activeQuery.handleEmptyQuery(this.connection);
		}
		_handleCommandComplete(msg) {
			const activeQuery = this._getActiveQuery();
			if (activeQuery == null) {
				const error = /* @__PURE__ */ new Error("Received unexpected commandComplete message from backend.");
				this._handleErrorEvent(error);
				return;
			}
			activeQuery.handleCommandComplete(msg, this.connection);
		}
		_handleParseComplete() {
			const activeQuery = this._getActiveQuery();
			if (activeQuery == null) {
				const error = /* @__PURE__ */ new Error("Received unexpected parseComplete message from backend.");
				this._handleErrorEvent(error);
				return;
			}
			if (activeQuery.name) {
				this.connection.parsedStatements[activeQuery.name] = activeQuery.text;
				delete this.connection.submittedNamedStatements[activeQuery.name];
			}
		}
		_handleCopyInResponse(msg) {
			const activeQuery = this._getActiveQuery();
			if (activeQuery == null) {
				const error = /* @__PURE__ */ new Error("Received unexpected copyInResponse message from backend.");
				this._handleErrorEvent(error);
				return;
			}
			activeQuery.handleCopyInResponse(this.connection);
		}
		_handleCopyData(msg) {
			const activeQuery = this._getActiveQuery();
			if (activeQuery == null) {
				const error = /* @__PURE__ */ new Error("Received unexpected copyData message from backend.");
				this._handleErrorEvent(error);
				return;
			}
			activeQuery.handleCopyData(msg, this.connection);
		}
		_handleNotification(msg) {
			this.emit("notification", msg);
		}
		_handleNotice(msg) {
			this.emit("notice", msg);
		}
		getStartupConf() {
			const params = this.connectionParameters;
			const data = {
				user: params.user,
				database: params.database
			};
			const appName = params.application_name || params.fallback_application_name;
			if (appName) data.application_name = appName;
			if (params.replication) data.replication = "" + params.replication;
			if (params.statement_timeout) data.statement_timeout = String(parseInt(params.statement_timeout, 10));
			if (params.lock_timeout) data.lock_timeout = String(parseInt(params.lock_timeout, 10));
			if (params.idle_in_transaction_session_timeout) data.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10));
			if (params.options) data.options = params.options;
			return data;
		}
		cancel(client, query) {
			if (client.activeQuery === query) {
				const con = this.connection;
				if (this.host && this.host.indexOf("/") === 0) con.connect(this.host + "/.s.PGSQL." + this.port);
				else con.connect(this.port, this.host);
				con.on("connect", function() {
					con.cancel(client.processID, client.secretKey);
				});
			} else if (client._queryQueue.indexOf(query) !== -1) client._queryQueue.splice(client._queryQueue.indexOf(query), 1);
			else if (client._sentQueryQueue.indexOf(query) !== -1) query.callback = () => {};
		}
		setTypeParser(oid, format, parseFn) {
			return this._types.setTypeParser(oid, format, parseFn);
		}
		getTypeParser(oid, format) {
			return this._types.getTypeParser(oid, format);
		}
		escapeIdentifier(str) {
			return utils.escapeIdentifier(str);
		}
		escapeLiteral(str) {
			return utils.escapeLiteral(str);
		}
		_pulseQueryQueue() {
			if (this.pipeline) {
				this._pulsePipelinedQueryQueue();
				return;
			}
			if (this.readyForQuery === true) {
				this._activeQuery = this._queryQueue.shift();
				const activeQuery = this._getActiveQuery();
				if (activeQuery) {
					this.readyForQuery = false;
					this.hasExecuted = true;
					const queryError = activeQuery.submit(this.connection);
					if (queryError) process.nextTick(() => {
						activeQuery.handleError(queryError, this.connection);
						this.readyForQuery = true;
						this._pulseQueryQueue();
					});
				} else if (this.hasExecuted) {
					this._activeQuery = null;
					this.emit("drain");
				}
			}
		}
		_pulsePipelinedQueryQueue() {
			if (!this._connected || !this._queryable) return;
			while (this._queryQueue.length > 0) {
				const query = this._queryQueue.shift();
				this.hasExecuted = true;
				const queryError = query.submit(this.connection);
				if (queryError) {
					process.nextTick(() => {
						query.handleError(queryError, this.connection);
					});
					continue;
				}
				this._sentQueryQueue.push(query);
			}
			if (this.readyForQuery && !this._activeQuery && this._sentQueryQueue.length > 0) {
				this._activeQuery = this._sentQueryQueue.shift();
				this.readyForQuery = false;
			}
			if (!this._activeQuery && this._sentQueryQueue.length === 0 && this._queryQueue.length === 0 && this.hasExecuted) this.emit("drain");
		}
		query(config, values, callback) {
			let query;
			let result;
			if (config == null) throw new TypeError("Client was passed a null or undefined query");
			if (typeof config.submit === "function") {
				result = query = config;
				if (!query.callback) {
					if (typeof values === "function") query.callback = values;
					else if (callback) query.callback = callback;
				}
			} else {
				query = new Query(config, values, callback);
				if (!query.callback) result = new this._Promise((resolve, reject) => {
					query.callback = (err, res) => err ? reject(err) : resolve(res);
				}).catch((err) => {
					Error.captureStackTrace(err);
					throw err;
				});
				else if (typeof query.callback !== "function") throw new TypeError("callback is not a function");
			}
			const readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
			if (readTimeout) {
				const queryCallback = query.callback || (() => {});
				const readTimeoutTimer = setTimeout(() => {
					const error = /* @__PURE__ */ new Error("Query read timeout");
					process.nextTick(() => {
						query.handleError(error, this.connection);
					});
					queryCallback(error);
					query.callback = () => {};
					const index = this._queryQueue.indexOf(query);
					if (index > -1) this._queryQueue.splice(index, 1);
					else if (this.pipeline) {
						this.connection.stream.destroy();
						return;
					}
					this._pulseQueryQueue();
				}, readTimeout);
				query.callback = (err, res) => {
					clearTimeout(readTimeoutTimer);
					queryCallback(err, res);
				};
			}
			if (this.binary && !query.binary) query.binary = true;
			if (query._result && !query._result._types) query._result._types = this._types;
			if (this.pipeline) {
				const portalQuery = typeof config.submit === "function" && !(query instanceof Query) ? "Custom query classes such as pg-cursor and pg-query-stream are" : query.rows ? "The `rows` option is" : null;
				if (portalQuery) {
					process.nextTick(() => {
						query.handleError(/* @__PURE__ */ new Error(`${portalQuery} not supported in pipeline mode`), this.connection);
					});
					return result;
				}
			}
			if (!this._queryable) {
				process.nextTick(() => {
					query.handleError(/* @__PURE__ */ new Error("Client has encountered a connection error and is not queryable"), this.connection);
				});
				return result;
			}
			if (this._ending) {
				process.nextTick(() => {
					query.handleError(/* @__PURE__ */ new Error("Client was closed and is not queryable"), this.connection);
				});
				return result;
			}
			if (this._queryQueue.length > 0 && !this.pipeline) queryQueueLengthDeprecationNotice();
			this._queryQueue.push(query);
			this._pulseQueryQueue();
			return result;
		}
		ref() {
			this.connection.ref();
		}
		unref() {
			this.connection.unref();
		}
		getTransactionStatus() {
			return this._txStatus;
		}
		end(cb) {
			this._ending = true;
			if (!this.connection._connecting || this._ended) if (cb) {
				cb();
				return;
			} else return this._Promise.resolve();
			if (!this._queryable) this.connection.stream.destroy();
			else if (this.pipeline && (this._getActiveQuery() || this._sentQueryQueue.length > 0 || this._queryQueue.length > 0)) this.once("drain", () => this.connection.end());
			else if (this._getActiveQuery()) this.connection.stream.destroy();
			else this.connection.end();
			if (cb) this.connection.once("end", cb);
			else return new this._Promise((resolve) => {
				this.connection.once("end", resolve);
			});
		}
		get queryQueue() {
			queryQueueDeprecationNotice();
			return this._queryQueue;
		}
	};
	Client.Query = Query;
	module.exports = Client;
}));
//#endregion
//#region ../../node_modules/pg-pool/index.js
var require_pg_pool = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var EventEmitter$2 = __require("events").EventEmitter;
	var NOOP = function() {};
	var removeWhere = (list, predicate) => {
		const i = list.findIndex(predicate);
		return i === -1 ? void 0 : list.splice(i, 1)[0];
	};
	var IdleItem = class {
		constructor(client, idleListener, timeoutId) {
			this.client = client;
			this.idleListener = idleListener;
			this.timeoutId = timeoutId;
		}
	};
	var PendingItem = class {
		constructor(callback) {
			this.callback = callback;
		}
	};
	function throwOnDoubleRelease() {
		throw new Error("Release called on client which has already been released to the pool.");
	}
	function promisify(Promise, callback) {
		if (callback) return {
			callback,
			result: void 0
		};
		let rej;
		let res;
		const cb = function(err, client) {
			err ? rej(err) : res(client);
		};
		return {
			callback: cb,
			result: new Promise(function(resolve, reject) {
				res = resolve;
				rej = reject;
			}).catch((err) => {
				Error.captureStackTrace(err);
				throw err;
			})
		};
	}
	function makeIdleListener(pool, client) {
		return function idleListener(err) {
			err.client = client;
			client.removeListener("error", idleListener);
			client.on("error", () => {
				pool.log("additional client error after disconnection due to error", err);
			});
			pool._remove(client);
			pool.emit("error", err, client);
		};
	}
	var Pool = class extends EventEmitter$2 {
		constructor(options, Client) {
			super();
			this.options = Object.assign({}, options);
			if (options != null && "password" in options) Object.defineProperty(this.options, "password", {
				configurable: true,
				enumerable: false,
				writable: true,
				value: options.password
			});
			if (options != null && options.ssl && options.ssl.key) Object.defineProperty(this.options.ssl, "key", { enumerable: false });
			this.options.max = this.options.max || this.options.poolSize || 10;
			this.options.min = this.options.min || 0;
			this.options.maxUses = this.options.maxUses || Infinity;
			this.options.allowExitOnIdle = this.options.allowExitOnIdle || false;
			this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0;
			this.log = this.options.log || function() {};
			this.Client = this.options.Client || Client || require_lib().Client;
			this.Promise = this.options.Promise || global.Promise;
			if (typeof this.options.idleTimeoutMillis === "undefined") this.options.idleTimeoutMillis = 1e4;
			this._clients = [];
			this._idle = [];
			this._expired = /* @__PURE__ */ new WeakSet();
			this._pendingQueue = [];
			this._endCallback = void 0;
			this.ending = false;
			this.ended = false;
		}
		_promiseTry(f) {
			const Promise = this.Promise;
			if (typeof Promise.try === "function") return Promise.try(f);
			return new Promise((resolve) => resolve(f()));
		}
		_isFull() {
			return this._clients.length >= this.options.max;
		}
		_isAboveMin() {
			return this._clients.length > this.options.min;
		}
		_pulseQueue() {
			this.log("pulse queue");
			if (this.ended) {
				this.log("pulse queue ended");
				return;
			}
			if (this.ending) {
				this.log("pulse queue on ending");
				if (this._idle.length) this._idle.slice().map((item) => {
					this._remove(item.client);
				});
				if (!this._clients.length) {
					this.ended = true;
					this._endCallback();
				}
				return;
			}
			if (!this._pendingQueue.length) {
				this.log("no queued requests");
				return;
			}
			if (!this._idle.length && this._isFull()) return;
			const pendingItem = this._pendingQueue.shift();
			if (this._idle.length) {
				const idleItem = this._idle.pop();
				clearTimeout(idleItem.timeoutId);
				const client = idleItem.client;
				client.ref && client.ref();
				const idleListener = idleItem.idleListener;
				return this._acquireClient(client, pendingItem, idleListener, false);
			}
			if (!this._isFull()) return this.newClient(pendingItem);
			throw new Error("unexpected condition");
		}
		_remove(client, callback) {
			const removed = removeWhere(this._idle, (item) => item.client === client);
			if (removed !== void 0) clearTimeout(removed.timeoutId);
			this._clients = this._clients.filter((c) => c !== client);
			const context = this;
			client.end(() => {
				context.emit("remove", client);
				if (typeof callback === "function") callback();
			});
		}
		connect(cb) {
			if (this.ending) {
				const err = /* @__PURE__ */ new Error("Cannot use a pool after calling end on the pool");
				return cb ? cb(err) : this.Promise.reject(err);
			}
			const response = promisify(this.Promise, cb);
			const result = response.result;
			if (this._isFull() || this._idle.length) {
				if (this._idle.length) process.nextTick(() => this._pulseQueue());
				if (!this.options.connectionTimeoutMillis) {
					this._pendingQueue.push(new PendingItem(response.callback));
					return result;
				}
				const queueCallback = (err, res, done) => {
					clearTimeout(tid);
					response.callback(err, res, done);
				};
				const pendingItem = new PendingItem(queueCallback);
				const tid = setTimeout(() => {
					removeWhere(this._pendingQueue, (i) => i.callback === queueCallback);
					pendingItem.timedOut = true;
					response.callback(/* @__PURE__ */ new Error("timeout exceeded when trying to connect"));
				}, this.options.connectionTimeoutMillis);
				if (tid.unref) tid.unref();
				this._pendingQueue.push(pendingItem);
				return result;
			}
			this.newClient(new PendingItem(response.callback));
			return result;
		}
		newClient(pendingItem) {
			const client = new this.Client(this.options);
			this._clients.push(client);
			const idleListener = makeIdleListener(this, client);
			this.log("checking client timeout");
			let tid;
			let timeoutHit = false;
			if (this.options.connectionTimeoutMillis) tid = setTimeout(() => {
				if (client.connection) {
					this.log("ending client due to timeout");
					timeoutHit = true;
					client.connection.stream.destroy();
				} else if (!client.isConnected()) {
					this.log("ending client due to timeout");
					timeoutHit = true;
					client.end();
				}
			}, this.options.connectionTimeoutMillis);
			this.log("connecting new client");
			client.connect((err) => {
				if (tid) clearTimeout(tid);
				client.on("error", idleListener);
				if (err) {
					this.log("client failed to connect", err);
					this._clients = this._clients.filter((c) => c !== client);
					if (timeoutHit) err = new Error("Connection terminated due to connection timeout", { cause: err });
					this._pulseQueue();
					if (!pendingItem.timedOut) pendingItem.callback(err, void 0, NOOP);
				} else {
					this.log("new client connected");
					if (this.options.onConnect) {
						this._promiseTry(() => this.options.onConnect(client)).then(() => {
							this._afterConnect(client, pendingItem, idleListener);
						}, (hookErr) => {
							this._clients = this._clients.filter((c) => c !== client);
							client.end(() => {
								this._pulseQueue();
								if (!pendingItem.timedOut) pendingItem.callback(hookErr, void 0, NOOP);
							});
						});
						return;
					}
					return this._afterConnect(client, pendingItem, idleListener);
				}
			});
		}
		_afterConnect(client, pendingItem, idleListener) {
			if (this.options.maxLifetimeSeconds !== 0) {
				const maxLifetimeTimeout = setTimeout(() => {
					this.log("ending client due to expired lifetime");
					this._expired.add(client);
					if (this._idle.findIndex((idleItem) => idleItem.client === client) !== -1) this._acquireClient(client, new PendingItem((err, client, clientRelease) => clientRelease()), idleListener, false);
				}, this.options.maxLifetimeSeconds * 1e3);
				maxLifetimeTimeout.unref();
				client.once("end", () => clearTimeout(maxLifetimeTimeout));
			}
			return this._acquireClient(client, pendingItem, idleListener, true);
		}
		_acquireClient(client, pendingItem, idleListener, isNew) {
			if (isNew) this.emit("connect", client);
			this.emit("acquire", client);
			client.release = this._releaseOnce(client, idleListener);
			client.removeListener("error", idleListener);
			if (!pendingItem.timedOut) if (isNew && this.options.verify) this.options.verify(client, (err) => {
				if (err) {
					client.release(err);
					return pendingItem.callback(err, void 0, NOOP);
				}
				pendingItem.callback(void 0, client, client.release);
			});
			else pendingItem.callback(void 0, client, client.release);
			else if (isNew && this.options.verify) this.options.verify(client, client.release);
			else client.release();
		}
		_releaseOnce(client, idleListener) {
			let released = false;
			return (err) => {
				if (released) throwOnDoubleRelease();
				released = true;
				this._release(client, idleListener, err);
			};
		}
		_release(client, idleListener, err) {
			client.on("error", idleListener);
			client._poolUseCount = (client._poolUseCount || 0) + 1;
			this.emit("release", err, client);
			if (err || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses) {
				if (client._poolUseCount >= this.options.maxUses) this.log("remove expended client");
				return this._remove(client, this._pulseQueue.bind(this));
			}
			if (this._expired.has(client)) {
				this.log("remove expired client");
				this._expired.delete(client);
				return this._remove(client, this._pulseQueue.bind(this));
			}
			let tid;
			if (this.options.idleTimeoutMillis && this._isAboveMin()) {
				tid = setTimeout(() => {
					if (this._isAboveMin()) {
						this.log("remove idle client");
						this._remove(client, this._pulseQueue.bind(this));
					}
				}, this.options.idleTimeoutMillis);
				if (this.options.allowExitOnIdle) tid.unref();
			}
			if (this.options.allowExitOnIdle) client.unref();
			this._idle.push(new IdleItem(client, idleListener, tid));
			this._pulseQueue();
		}
		query(text, values, cb) {
			if (typeof text === "function") {
				const response = promisify(this.Promise, text);
				setImmediate(function() {
					return response.callback(/* @__PURE__ */ new Error("Passing a function as the first parameter to pool.query is not supported"));
				});
				return response.result;
			}
			if (typeof values === "function") {
				cb = values;
				values = void 0;
			}
			const response = promisify(this.Promise, cb);
			cb = response.callback;
			this.connect((err, client) => {
				if (err) return cb(err);
				let clientReleased = false;
				const onError = (err) => {
					if (clientReleased) return;
					clientReleased = true;
					client.release(err);
					cb(err);
				};
				client.once("error", onError);
				this.log("dispatching query");
				try {
					client.query(text, values, (err, res) => {
						this.log("query dispatched");
						client.removeListener("error", onError);
						if (clientReleased) return;
						clientReleased = true;
						client.release(err);
						if (err) return cb(err);
						return cb(void 0, res);
					});
				} catch (err) {
					client.release(err);
					return cb(err);
				}
			});
			return response.result;
		}
		end(cb) {
			this.log("ending");
			if (this.ending) {
				const err = /* @__PURE__ */ new Error("Called end on pool more than once");
				return cb ? cb(err) : this.Promise.reject(err);
			}
			this.ending = true;
			const promised = promisify(this.Promise, cb);
			this._endCallback = promised.callback;
			this._pulseQueue();
			return promised.result;
		}
		get waitingCount() {
			return this._pendingQueue.length;
		}
		get idleCount() {
			return this._idle.length;
		}
		get expiredCount() {
			return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0);
		}
		get totalCount() {
			return this._clients.length;
		}
	};
	module.exports = Pool;
}));
//#endregion
//#region __vite-optional-peer-dep:pg-native:pg
var __vite_optional_peer_dep_pg_native_pg_exports = /* @__PURE__ */ __exportAll({ default: () => __vite_optional_peer_dep_pg_native_pg_default });
var __vite_optional_peer_dep_pg_native_pg_default;
var init___vite_optional_peer_dep_pg_native_pg = __esmMin((() => {
	__vite_optional_peer_dep_pg_native_pg_default = {};
	throw new Error(`Could not resolve "pg-native" imported by "pg". Is it installed?`);
}));
//#endregion
//#region ../../node_modules/pg/lib/native/query.js
var require_query = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var EventEmitter$1 = __require("events").EventEmitter;
	var util$1 = __require("util");
	var utils = require_utils$1();
	var NativeQuery = module.exports = function(config, values, callback) {
		EventEmitter$1.call(this);
		config = utils.normalizeQueryConfig(config, values, callback);
		this.text = config.text;
		this.values = config.values;
		this.name = config.name;
		this.queryMode = config.queryMode;
		this.callback = config.callback;
		this.state = "new";
		this._arrayMode = config.rowMode === "array";
		this._emitRowEvents = false;
		this.on("newListener", function(event) {
			if (event === "row") this._emitRowEvents = true;
		}.bind(this));
	};
	util$1.inherits(NativeQuery, EventEmitter$1);
	var errorFieldMap = {
		sqlState: "code",
		statementPosition: "position",
		messagePrimary: "message",
		messageDetail: "detail",
		messageHint: "hint",
		context: "where",
		schemaName: "schema",
		tableName: "table",
		columnName: "column",
		dataTypeName: "dataType",
		constraintName: "constraint",
		sourceFile: "file",
		sourceLine: "line",
		sourceFunction: "routine"
	};
	NativeQuery.prototype.handleError = function(err) {
		const fields = this.native && this.native.pq.resultErrorFields();
		if (fields) for (const key in fields) {
			const normalizedFieldName = errorFieldMap[key] || key;
			err[normalizedFieldName] = fields[key];
		}
		if (this.callback) this.callback(err);
		else this.emit("error", err);
		this.state = "error";
	};
	NativeQuery.prototype.then = function(onSuccess, onFailure) {
		return this._getPromise().then(onSuccess, onFailure);
	};
	NativeQuery.prototype.catch = function(callback) {
		return this._getPromise().catch(callback);
	};
	NativeQuery.prototype._getPromise = function() {
		if (this._promise) return this._promise;
		this._promise = new Promise(function(resolve, reject) {
			this._once("end", resolve);
			this._once("error", reject);
		}.bind(this));
		return this._promise;
	};
	NativeQuery.prototype.submit = function(client) {
		this.state = "running";
		const self = this;
		this.native = client.native;
		client.native.arrayMode = this._arrayMode;
		let after = function(err, rows, results) {
			client.native.arrayMode = false;
			setImmediate(function() {
				self.emit("_done");
			});
			if (err) return self.handleError(err);
			if (self._emitRowEvents) if (results.length > 1) rows.forEach((rowOfRows, i) => {
				rowOfRows.forEach((row) => {
					self.emit("row", row, results[i]);
				});
			});
			else rows.forEach(function(row) {
				self.emit("row", row, results);
			});
			self.state = "end";
			self.emit("end", results);
			if (self.callback) self.callback(null, results);
		};
		if (process.domain) after = process.domain.bind(after);
		if (this.name) {
			if (this.name.length > 63) {
				console.error("Warning! Postgres only supports 63 characters for query names.");
				console.error("You supplied %s (%s)", this.name, this.name.length);
				console.error("This can cause conflicts and silent errors executing queries");
			}
			const values = (this.values || []).map(utils.prepareValue);
			if (client.namedQueries[this.name] !== void 0) {
				if (this.text && client.namedQueries[this.name] !== this.text) {
					const err = /* @__PURE__ */ new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
					return after(err);
				}
				return client.native.execute(this.name, values, after);
			}
			return client.native.prepare(this.name, this.text, values.length, function(err) {
				if (err) return after(err);
				client.namedQueries[self.name] = self.text;
				return self.native.execute(self.name, values, after);
			});
		} else if (this.values) {
			if (!Array.isArray(this.values)) return after(/* @__PURE__ */ new Error("Query values must be an array"));
			const vals = this.values.map(utils.prepareValue);
			client.native.query(this.text, vals, after);
		} else if (this.queryMode === "extended") client.native.query(this.text, [], after);
		else client.native.query(this.text, after);
	};
}));
//#endregion
//#region ../../node_modules/pg/lib/native/client.js
var require_client = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var nodeUtils = __require("util");
	var Native;
	try {
		Native = (init___vite_optional_peer_dep_pg_native_pg(), __toCommonJS(__vite_optional_peer_dep_pg_native_pg_exports));
	} catch (e) {
		throw e;
	}
	var TypeOverrides = require_type_overrides();
	var EventEmitter = __require("events").EventEmitter;
	var util = __require("util");
	var ConnectionParameters = require_connection_parameters();
	var NativeQuery = require_query();
	var queryQueueLengthDeprecationNotice = nodeUtils.deprecate(() => {}, "Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead.");
	var Client = module.exports = function(config) {
		EventEmitter.call(this);
		config = config || {};
		this._Promise = config.Promise || global.Promise;
		this._types = new TypeOverrides(config.types);
		this.native = new Native({ types: this._types });
		this._queryQueue = [];
		this._ending = false;
		this._connecting = false;
		this._connected = false;
		this._queryable = true;
		this.pipeline = Boolean(config.pipeline);
		this._pipelineInFlight = false;
		const cp = this.connectionParameters = new ConnectionParameters(config);
		if (config.nativeConnectionString) cp.nativeConnectionString = config.nativeConnectionString;
		this.user = cp.user;
		Object.defineProperty(this, "password", {
			configurable: true,
			enumerable: false,
			writable: true,
			value: cp.password
		});
		this.database = cp.database;
		this.host = cp.host;
		this.port = cp.port;
		this.namedQueries = {};
	};
	Client.Query = NativeQuery;
	util.inherits(Client, EventEmitter);
	Client.prototype._errorAllQueries = function(err) {
		const enqueueError = (query) => {
			process.nextTick(() => {
				query.native = this.native;
				query.handleError(err);
			});
		};
		if (this._hasActiveQuery()) {
			enqueueError(this._activeQuery);
			this._activeQuery = null;
		}
		this._queryQueue.forEach(enqueueError);
		this._queryQueue.length = 0;
	};
	Client.prototype._connect = function(cb) {
		const self = this;
		if (this._connecting) {
			process.nextTick(() => cb(/* @__PURE__ */ new Error("Client has already been connected. You cannot reuse a client.")));
			return;
		}
		this._connecting = true;
		this.connectionParameters.getLibpqConnectionString(function(err, conString) {
			if (self.connectionParameters.nativeConnectionString) conString = self.connectionParameters.nativeConnectionString;
			if (err) return cb(err);
			self.native.connect(conString, function(err) {
				if (err) {
					self.native.end();
					return cb(err);
				}
				self._connected = true;
				self.native.on("error", function(err) {
					self._queryable = false;
					self._errorAllQueries(err);
					self.emit("error", err);
				});
				self.native.on("notification", function(msg) {
					self.emit("notification", {
						channel: msg.relname,
						payload: msg.extra
					});
				});
				self.emit("connect");
				self._pulseQueryQueue(true);
				cb(null, this);
			});
		});
	};
	Client.prototype.connect = function(callback) {
		if (callback) {
			this._connect(callback);
			return;
		}
		return new this._Promise((resolve, reject) => {
			this._connect((error) => {
				if (error) reject(error);
				else resolve(this);
			});
		});
	};
	Client.prototype.query = function(config, values, callback) {
		let query;
		let result;
		let readTimeout;
		let readTimeoutTimer;
		let queryCallback;
		if (config === null || config === void 0) throw new TypeError("Client was passed a null or undefined query");
		else if (typeof config.submit === "function") {
			readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
			result = query = config;
			if (typeof values === "function") config.callback = values;
		} else {
			readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
			query = new NativeQuery(config, values, callback);
			if (!query.callback) {
				let resolveOut, rejectOut;
				result = new this._Promise((resolve, reject) => {
					resolveOut = resolve;
					rejectOut = reject;
				}).catch((err) => {
					Error.captureStackTrace(err);
					throw err;
				});
				query.callback = (err, res) => err ? rejectOut(err) : resolveOut(res);
			}
		}
		if (readTimeout) {
			queryCallback = query.callback || (() => {});
			readTimeoutTimer = setTimeout(() => {
				const error = /* @__PURE__ */ new Error("Query read timeout");
				process.nextTick(() => {
					query.handleError(error, this.connection);
				});
				queryCallback(error);
				query.callback = () => {};
				const index = this._queryQueue.indexOf(query);
				if (index > -1) this._queryQueue.splice(index, 1);
				this._pulseQueryQueue();
			}, readTimeout);
			query.callback = (err, res) => {
				clearTimeout(readTimeoutTimer);
				queryCallback(err, res);
			};
		}
		if (!this._queryable) {
			query.native = this.native;
			process.nextTick(() => {
				query.handleError(/* @__PURE__ */ new Error("Client has encountered a connection error and is not queryable"));
			});
			return result;
		}
		if (this._ending) {
			query.native = this.native;
			process.nextTick(() => {
				query.handleError(/* @__PURE__ */ new Error("Client was closed and is not queryable"));
			});
			return result;
		}
		if (this._queryQueue.length > 0 && !this.pipeline) queryQueueLengthDeprecationNotice();
		this._queryQueue.push(query);
		this._pulseQueryQueue();
		return result;
	};
	Client.prototype.end = function(cb) {
		const self = this;
		this._ending = true;
		if (this._connecting && !this._connected) this.once("connect", () => {
			this.end(() => {});
		});
		let result;
		if (!cb) result = new this._Promise(function(resolve, reject) {
			cb = (err) => err ? reject(err) : resolve();
		});
		const doEnd = function() {
			self.native.end(function() {
				self._connected = false;
				self._errorAllQueries(/* @__PURE__ */ new Error("Connection terminated"));
				process.nextTick(() => {
					self.emit("end");
					if (cb) cb();
				});
			});
		};
		if (this.pipeline && (this._pipelineInFlight || this._queryQueue.length > 0)) this.once("drain", doEnd);
		else doEnd();
		return result;
	};
	Client.prototype._hasActiveQuery = function() {
		return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
	};
	Client.prototype._pulseQueryQueue = function(initialConnection) {
		if (!this._connected) return;
		if (this.pipeline && !initialConnection) return this._pulsePipelinedQueryQueue();
		if (this._hasActiveQuery()) return;
		const query = this._queryQueue.shift();
		if (!query) {
			if (!initialConnection) this.emit("drain");
			return;
		}
		this._activeQuery = query;
		query.submit(this);
		const self = this;
		query.once("_done", function() {
			self._pulseQueryQueue();
		});
	};
	Client.prototype._pulsePipelinedQueryQueue = function() {
		if (!this._connected || this._pipelineInFlight) return;
		if (this._queryQueue.length === 0) {
			if (this.hasExecuted) this.emit("drain");
			return;
		}
		this._pipelineInFlight = true;
		const self = this;
		const queries = [];
		const nativeQueries = [];
		const utils = require_utils$1();
		while (this._queryQueue.length > 0) {
			const query = this._queryQueue.shift();
			this.hasExecuted = true;
			nativeQueries.push(query);
			const values = query.values ? query.values.map(utils.prepareValue) : null;
			const pipelineEntry = {
				text: query.text,
				name: query.name,
				arrayMode: query._arrayMode
			};
			if (values) pipelineEntry.values = values;
			if (query.name && this.namedQueries[query.name]) pipelineEntry._alreadyPrepared = true;
			queries.push(pipelineEntry);
		}
		this.native.pipeline(queries, function(err, results) {
			self._pipelineInFlight = false;
			if (err) {
				self._connected = false;
				self._queryable = false;
				for (let i = 0; i < nativeQueries.length; i++) {
					const q = nativeQueries[i];
					q.native = self.native;
					q.handleError(err);
				}
				self._errorAllQueries(err);
				self.emit("error", err);
				self.emit("end");
				return;
			}
			for (let i = 0; i < nativeQueries.length; i++) {
				const q = nativeQueries[i];
				const r = results[i];
				q.native = self.native;
				if (r.err) q.handleError(r.err);
				else {
					if (q.name) self.namedQueries[q.name] = q.text;
					q.state = "end";
					q.emit("end", r.result);
					if (q.callback) q.callback(null, r.result);
				}
				setImmediate(function() {
					q.emit("_done");
				});
			}
			self._pulsePipelinedQueryQueue();
		});
	};
	Client.prototype.cancel = function(query) {
		if (this._activeQuery === query) this.native.cancel(function() {});
		else if (this._queryQueue.indexOf(query) !== -1) this._queryQueue.splice(this._queryQueue.indexOf(query), 1);
	};
	Client.prototype.ref = function() {};
	Client.prototype.unref = function() {};
	Client.prototype.setTypeParser = function(oid, format, parseFn) {
		return this._types.setTypeParser(oid, format, parseFn);
	};
	Client.prototype.getTypeParser = function(oid, format) {
		return this._types.getTypeParser(oid, format);
	};
	Client.prototype.isConnected = function() {
		return this._connected;
	};
	Client.prototype.getTransactionStatus = function() {
		return this.native.getTransactionStatus();
	};
}));
//#endregion
//#region ../../node_modules/pg/lib/native/index.js
var require_native = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_client();
}));
//#endregion
//#region ../../node_modules/pg/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Client = require_client$1();
	var defaults = require_defaults();
	var Connection = require_connection();
	var Result = require_result();
	var utils = require_utils$1();
	var Pool = require_pg_pool();
	var TypeOverrides = require_type_overrides();
	var { DatabaseError } = require_dist();
	var { escapeIdentifier, escapeLiteral } = require_utils$1();
	var poolFactory = (Client) => {
		return class BoundPool extends Pool {
			constructor(options) {
				super(options, Client);
			}
		};
	};
	var PG = function(clientConstructor) {
		this.defaults = defaults;
		this.Client = clientConstructor;
		this.Query = this.Client.Query;
		this.Pool = poolFactory(this.Client);
		this._pools = [];
		this.Connection = Connection;
		this.types = require_pg_types();
		this.DatabaseError = DatabaseError;
		this.TypeOverrides = TypeOverrides;
		this.escapeIdentifier = escapeIdentifier;
		this.escapeLiteral = escapeLiteral;
		this.Result = Result;
		this.utils = utils;
	};
	var clientConstructor = Client;
	var forceNative = false;
	try {
		forceNative = !!process.env.NODE_PG_FORCE_NATIVE;
	} catch {}
	if (forceNative) clientConstructor = require_native();
	module.exports = new PG(clientConstructor);
	Object.defineProperty(module.exports, "native", {
		configurable: true,
		enumerable: false,
		get() {
			let native = null;
			try {
				native = new PG(require_native());
			} catch (err) {
				if (err.code !== "MODULE_NOT_FOUND") throw err;
			}
			Object.defineProperty(module.exports, "native", { value: native });
			return native;
		}
	});
}));
//#endregion
//#region ../../node_modules/pg/esm/index.mjs
var import_lib = /* @__PURE__ */ __toESM(require_lib(), 1);
import_lib.default.Client;
import_lib.default.Pool;
import_lib.default.Connection;
import_lib.default.types;
import_lib.default.Query;
import_lib.default.DatabaseError;
import_lib.default.escapeIdentifier;
import_lib.default.escapeLiteral;
import_lib.default.Result;
import_lib.default.TypeOverrides;
import_lib.default.defaults;
var esm_default = import_lib.default;
//#endregion
//#region lib/gaming/supabase-ca.ts
var SUPABASE_ROOT_CA = `-----BEGIN CERTIFICATE-----
MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW
QyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q
DmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2
GtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi
cvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4
O4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt
NaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX
uXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt
aUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU
tVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b
VW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6
jB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx
Cea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2
CMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P
o/bKiIz+Fq8=
-----END CERTIFICATE-----`;
//#endregion
//#region lib/gaming/competition-database.ts
var keys = {
	devices: ["id"],
	participants: ["id"],
	sessions: ["id"],
	start_requests: ["device", "request"],
	contact_messages: ["id"],
	sheet_sync: ["kind", "id"],
	registrations: ["id"]
};
var tableNames = Object.keys(keys);
var lock = "SELECT pg_advisory_xact_lock(1279870535, 1)";
var databaseSchema = `
CREATE SCHEMA IF NOT EXISTS lif_game;
REVOKE ALL ON SCHEMA lif_game FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS lif_game.devices(id TEXT PRIMARY KEY,token TEXT UNIQUE NOT NULL,created BIGINT NOT NULL,_order BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE TABLE IF NOT EXISTS lif_game.participants(id TEXT PRIMARY KEY,device TEXT UNIQUE NOT NULL REFERENCES lif_game.devices(id),name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,nickname TEXT NOT NULL,nickname_key TEXT UNIQUE NOT NULL,terms BIGINT NOT NULL,created BIGINT NOT NULL,updated BIGINT NOT NULL,_order BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE TABLE IF NOT EXISTS lif_game.sessions(id TEXT PRIMARY KEY,device TEXT NOT NULL REFERENCES lif_game.devices(id),participant TEXT REFERENCES lif_game.participants(id),game TEXT NOT NULL,seed BIGINT NOT NULL,started BIGINT NOT NULL,ended BIGINT,status TEXT NOT NULL,attempt BIGINT NOT NULL,day TEXT NOT NULL,raw_score BIGINT NOT NULL DEFAULT 0,validated_score BIGINT NOT NULL DEFAULT 0,reason TEXT,inputs TEXT NOT NULL DEFAULT '[]',sim_ms BIGINT NOT NULL DEFAULT 0,version TEXT NOT NULL,heartbeat BIGINT NOT NULL,_order BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE INDEX IF NOT EXISTS session_attempts ON lif_game.sessions(device,game,day);
CREATE INDEX IF NOT EXISTS session_ranking ON lif_game.sessions(game,status,started,participant);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_game ON lif_game.sessions(device) WHERE status='playing';
CREATE TABLE IF NOT EXISTS lif_game.start_requests(device TEXT NOT NULL REFERENCES lif_game.devices(id),request TEXT NOT NULL,session TEXT NOT NULL REFERENCES lif_game.sessions(id),PRIMARY KEY(device,request),_order BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE TABLE IF NOT EXISTS lif_game.contact_messages(id TEXT PRIMARY KEY,request TEXT UNIQUE NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,message TEXT NOT NULL,consent BIGINT NOT NULL,created BIGINT NOT NULL,province TEXT NOT NULL DEFAULT '',canton TEXT NOT NULL DEFAULT '',district TEXT NOT NULL DEFAULT '',_order BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE TABLE IF NOT EXISTS lif_game.sheet_sync(kind TEXT NOT NULL,id TEXT NOT NULL,hash TEXT NOT NULL,PRIMARY KEY(kind,id),_order BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE TABLE IF NOT EXISTS lif_game.registrations(id TEXT PRIMARY KEY REFERENCES lif_game.sessions(id),participant TEXT NOT NULL,device TEXT NOT NULL REFERENCES lif_game.devices(id),name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,nickname TEXT NOT NULL,nickname_key TEXT NOT NULL,terms BIGINT NOT NULL,created BIGINT NOT NULL,updated BIGINT NOT NULL,_order BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE INDEX IF NOT EXISTS registration_nicknames ON lif_game.registrations(nickname_key,device);
CREATE TABLE IF NOT EXISTS lif_game.migration(id BIGINT PRIMARY KEY CHECK(id=1),revision BIGINT NOT NULL,fingerprint TEXT NOT NULL,counts JSONB NOT NULL,completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
${[...tableNames, "migration"].map((table) => `ALTER TABLE lif_game.${table} ENABLE ROW LEVEL SECURITY;`).join("\n")}
REVOKE ALL ON ALL TABLES IN SCHEMA lif_game FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA lif_game FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA lif_game REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
`;
function metadata(store, table) {
	return store.db.prepare(`PRAGMA table_info(${table})`).all();
}
function rowKey(table, row) {
	return JSON.stringify(keys[table].map((key) => row[key]));
}
function snapshotProof(snapshot) {
	const data = JSON.parse(snapshot);
	const canonical = Object.fromEntries(tableNames.map((table) => [table, (data.tables[table] ?? []).map((row) => Object.fromEntries(Object.keys(row).sort().map((key) => [key, row[key]]))).sort((a, b) => rowKey(table, a).localeCompare(rowKey(table, b)))]));
	return {
		fingerprint: createHash("sha256").update(JSON.stringify(canonical)).digest("hex"),
		counts: Object.fromEntries(tableNames.map((table) => [table, data.tables[table]?.length ?? 0]))
	};
}
var PostgresCompetitionDatabase = class {
	constructor(pool) {
		this.pool = pool;
	}
	async close() {
		await this.pool.end?.();
	}
	async transaction(operation) {
		const client = await this.pool.connect();
		let broken = false;
		try {
			await client.query("BEGIN");
			await client.query("SET LOCAL lock_timeout='8s'; SET LOCAL statement_timeout='15s'");
			await client.query(lock);
			const result = await operation(client);
			await client.query("COMMIT");
			return result;
		} catch (error) {
			try {
				await client.query("ROLLBACK");
			} catch {
				broken = true;
			}
			throw error;
		} finally {
			client.release(broken);
		}
	}
	async load(client, store) {
		const tables = {};
		for (const table of tableNames) {
			const columns = metadata(store, table);
			tables[table] = (await client.query(`SELECT ${columns.map((c) => c.name).join(",")} FROM lif_game.${table} ORDER BY _order`)).rows.map((row) => Object.fromEntries(columns.map((column) => {
				const raw = row[column.name];
				const value = raw !== null && column.type === "INTEGER" ? Number(raw) : raw;
				if (column.type === "INTEGER" && value !== null && !Number.isSafeInteger(value)) throw new Error("DATABASE_VALUE_INVALID");
				return [column.name, value];
			})));
		}
		const snapshot = JSON.stringify({
			version: 1,
			tables
		});
		importCompetitionState(store, snapshot);
		return snapshot;
	}
	async delta(client, store, before, after) {
		const previous = JSON.parse(before), next = JSON.parse(after);
		for (const table of tableNames) {
			const oldRows = new Map(previous.tables[table].map((row) => [rowKey(table, row), JSON.stringify(row)]));
			const newKeys = new Set(next.tables[table].map((row) => rowKey(table, row)));
			if ([...oldRows.keys()].some((key) => !newKeys.has(key))) throw new Error("DATABASE_DELETE_FORBIDDEN");
			const changed = next.tables[table].filter((row) => oldRows.get(rowKey(table, row)) !== JSON.stringify(row));
			if (table === "registrations" && changed.some((row) => oldRows.has(rowKey(table, row)))) throw new Error("DATABASE_REGISTRATION_IMMUTABLE");
			if (!changed.length) continue;
			for (const rows of [changed.filter((row) => oldRows.has(rowKey(table, row))), changed.filter((row) => !oldRows.has(rowKey(table, row)))]) {
				if (!rows.length) continue;
				const columns = metadata(store, table).map((column) => column.name);
				const update = columns.filter((column) => !keys[table].includes(column)).map((column) => `${column}=EXCLUDED.${column}`).join(",");
				await client.query(`INSERT INTO lif_game.${table}(${columns.join(",")}) SELECT ${columns.join(",")} FROM jsonb_populate_recordset(NULL::lif_game.${table},$1::jsonb) ON CONFLICT(${keys[table].join(",")}) DO UPDATE SET ${update}`, [JSON.stringify(rows)]);
			}
		}
	}
	async transact(operation) {
		return this.transaction(async (client) => {
			if (!(await client.query("SELECT id FROM lif_game.migration WHERE id=1")).rows.length) throw new Error("DATABASE_NOT_READY");
			const store = new CompetitionStore(":memory:");
			try {
				const before = await this.load(client, store);
				const result = await operation(store);
				await this.delta(client, store, before, exportCompetitionState(store));
				return result;
			} finally {
				store.db.close();
			}
		});
	}
	snapshot() {
		return this.transact(async (store) => exportCompetitionState(store));
	}
	async acknowledge(rows) {
		if (!rows.length) return;
		await this.transact(async (store) => {
			for (const row of rows) {
				if (!["games", "contacts"].includes(String(row.kind)) || typeof row.id !== "string" || typeof row.hash !== "string") throw new Error("ACK_INVALID");
				store.db.prepare("INSERT INTO sheet_sync VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET hash=excluded.hash").run(row.kind, row.id, row.hash);
			}
		});
	}
	async probe() {
		const client = await this.pool.connect();
		try {
			await client.query("SELECT 1 AS connected");
			return { connected: true };
		} finally {
			client.release();
		}
	}
	async importHistory(snapshot, revision, verifySource) {
		const source = new CompetitionStore(":memory:");
		try {
			importCompetitionState(source, snapshot);
			const normalized = exportCompetitionState(source), proof = snapshotProof(normalized);
			return await this.transaction(async (client) => {
				await client.query(databaseSchema);
				if ((await client.query("SELECT id FROM lif_game.migration WHERE id=1")).rows.length) throw new Error("MIGRATION_ALREADY_SEALED");
				const target = new CompetitionStore(":memory:");
				try {
					const before = await this.load(client, target);
					if (Object.values(snapshotProof(before).counts).some((count) => count !== 0)) throw new Error("MIGRATION_TARGET_NOT_EMPTY");
					await this.delta(client, source, before, normalized);
					const restored = new CompetitionStore(":memory:");
					try {
						if (snapshotProof(await this.load(client, restored)).fingerprint !== proof.fingerprint) throw new Error("MIGRATION_VERIFICATION_FAILED");
					} finally {
						restored.db.close();
					}
					await verifySource();
					await client.query("INSERT INTO lif_game.migration(id,revision,fingerprint,counts) VALUES(1,$1,$2,$3::jsonb)", [
						revision,
						proof.fingerprint,
						JSON.stringify(proof.counts)
					]);
					return {
						migrated: true,
						revision,
						...proof
					};
				} finally {
					target.db.close();
				}
			});
		} finally {
			source.db.close();
		}
	}
};
var database;
function createCompetitionDatabase(env) {
	const { LIF_DATABASE_HOST: host, LIF_DATABASE_USER: user, LIF_DATABASE_PASSWORD: password } = env;
	if (!host || !user || !password) throw new Error("DATABASE_CONFIG_INVALID");
	const pool = new esm_default.Pool({
		host,
		user,
		password,
		database: "postgres",
		port: 6543,
		ssl: {
			rejectUnauthorized: true,
			ca: SUPABASE_ROOT_CA
		},
		max: 1,
		connectionTimeoutMillis: 8e3,
		idleTimeoutMillis: 5e3,
		allowExitOnIdle: true,
		application_name: "lif-games"
	});
	pool.on("error", () => console.error("LIF_DATABASE_IDLE_CONNECTION_ERROR"));
	return new PostgresCompetitionDatabase(pool);
}
function configuredDatabase() {
	database ??= createCompetitionDatabase(process.env);
	return database;
}
//#endregion
//#region netlify/functions/connection.ts
function dependencies(duration = 52e3) {
	const endpoint = process.env.LIF_SHEETS_ENDPOINT ?? "";
	const secret = process.env.LIF_SHEETS_SYNC_KEY ?? "";
	const mode = process.env.LIF_GAME_STORAGE ?? "sheets";
	if (![
		"sheets",
		"migrating",
		"postgres"
	].includes(mode)) throw new Error("STORAGE_CONFIG_INVALID");
	const deadline = Date.now() + duration;
	const connection = () => new SheetsConnection(endpoint, secret, fetch, deadline);
	return {
		database: mode === "postgres" ? configuredDatabase() : void 0,
		maintenance: mode === "migrating",
		state: mode === "postgres" ? {
			async load() {
				throw new Error("LEGACY_STATE_DISABLED");
			},
			async save() {
				throw new Error("LEGACY_STATE_DISABLED");
			}
		} : new GoogleCompetitionState(connection()),
		sheets: (store) => new CompetitionSheets(store, endpoint, secret, fetch, connection())
	};
}
//#endregion
//#region netlify/functions/lif-sync.ts
async function lifSync() {
	await syncNetlifyRecords(dependencies(27e3));
}
var config = { schedule: "*/5 * * * *" };
//#endregion
export { config, lifSync as default };
