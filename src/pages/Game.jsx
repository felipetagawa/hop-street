import { useEffect, useRef, useState, useCallback } from 'react';
import {
    initAudio,
    playCorn,
    playHit,
    playJump,
    playShieldBreak,
    playShieldOn,
    playStageClear,
    playVictory,
} from '../audio';

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Constants Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const TILE = 80;
const LANE_H = 56;
const SLAB_D = 14;
const SLAB_STEP = LANE_H + SLAB_D;

const CAR_W = TILE * 1.65;
const CAR_H = LANE_H * 0.72;
const CAR_MIN = 1.0;
const CAR_MAX = 3.0;

const PLAYER_Y_RATIO = 0.62;

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Stage Definitions Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const STAGES = [
    {
        id: 1,
        name: 'BAIRRO TRANQUILO',
        goalRow: 80,
        cornTarget: 12,
        carMin: 1.5, carMax: 3.2,
        roadRatio: 0.65,
        maxCarsPerLane: 4,
        maxRoadRun: 4,
        theme: 'suburb',
        skyTop: '#5ec8e8', skyBot: '#a8e4f8',
        accent: '#7ee8a2',
    },
    {
        id: 2,
        name: 'AVENIDA MOVIMENTADA',
        goalRow: 120,
        cornTarget: 20,
        carMin: 2.0, carMax: 4.5,
        roadRatio: 0.8,
        maxCarsPerLane: 5,
        maxRoadRun: 6,
        theme: 'avenue',
        skyTop: '#3a8fcc', skyBot: '#7cc8f8',
        accent: '#f5be00',
    },
    {
        id: 3,
        name: 'HORA DO RUSH',
        goalRow: 160,
        cornTarget: 28,
        carMin: 2.8, carMax: 5.8,
        roadRatio: 0.9,
        maxCarsPerLane: 6,
        maxRoadRun: 8,
        theme: 'rush',
        skyTop: '#e06030', skyBot: '#f0a060',
        accent: '#ff4444',
    },
];

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Visual Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function shade(hex, amt) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (n >> 16) + amt));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt));
    const b = Math.min(255, Math.max(0, (n & 0xff) + amt));
    return `rgb(${r},${g},${b})`;
}

// Simple deterministic pseudo-random based on lane index and seed
function getSeed(idx, seed = 0) {
    const x = Math.sin(idx + seed) * 10000;
    return x - Math.floor(x);
}

function mulberry32(seed) {
    let t = seed >>> 0;
    return () => {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function makeImpactParticles(seed, count = 16) {
    const rand = mulberry32(seed);
    const particles = [];
    for (let i = 0; i < count; i++) {
        const ang = rand() * Math.PI * 2;
        const speed = 75 + rand() * 140;
        particles.push({
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed * 0.65 - 30,
            size: 3 + (rand() * 4) | 0,
            life: 0.28 + rand() * 0.24,
            color: rand() > 0.5 ? '#ffe066' : '#ff784f',
        });
    }
    return particles;
}

function makeShieldParticles(seed, count = 14) {
    const rand = mulberry32(seed);
    const particles = [];
    for (let i = 0; i < count; i++) {
        const ang = rand() * Math.PI * 2;
        const speed = 60 + rand() * 120;
        particles.push({
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed * 0.65 - 20,
            size: 3 + (rand() * 5) | 0,
            life: 0.3 + rand() * 0.25,
            color: rand() > 0.5 ? '#f0d060' : '#c8a030',
        });
    }
    return particles;
}

function hexToRgba(hex, alpha) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = (n >> 16) & 0xff;
    const g = (n >> 8) & 0xff;
    const b = n & 0xff;
    return `rgba(${r},${g},${b},${alpha})`;
}

function drawGroundShadow(ctx, cx, cy, w, h, alpha = 0.22) {
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawPixelFrame(ctx, x, y, w, h, accent = '#f5be00', fill = '#14162a') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x + 5, y + 6, w, h);
    ctx.fillStyle = '#05070f';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = accent;
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    ctx.fillStyle = '#2f3358';
    ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
    ctx.fillStyle = fill;
    ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x + 10, y + 10, w - 20, 4);
    ctx.fillRect(x + 10, y + 10, 4, h - 20);
    ctx.fillStyle = '#05070f';
    ctx.fillRect(x, y, 8, 8);
    ctx.fillRect(x + w - 8, y, 8, 8);
    ctx.fillRect(x, y + h - 8, 8, 8);
    ctx.fillRect(x + w - 8, y + h - 8, 8, 8);
}

function drawCornIcon(ctx, x, y, s = 1) {
    const u = 2 * s;
    ctx.fillStyle = '#5a3610';
    ctx.fillRect(x + 3 * u, y, 5 * u, 10 * u);
    ctx.fillStyle = '#ffd84d';
    ctx.fillRect(x + 4 * u, y + u, 3 * u, 8 * u);
    ctx.fillStyle = '#fff08a';
    ctx.fillRect(x + 4 * u, y + 2 * u, 2 * u, 2 * u);
    ctx.fillStyle = '#d89216';
    ctx.fillRect(x + 7 * u, y + 2 * u, u, 7 * u);
    ctx.fillStyle = '#244f1d';
    ctx.fillRect(x + u, y + 6 * u, 3 * u, 5 * u);
    ctx.fillRect(x + 7 * u, y + 6 * u, 3 * u, 5 * u);
    ctx.fillStyle = '#58a83a';
    ctx.fillRect(x + 2 * u, y + 6 * u, 2 * u, 4 * u);
    ctx.fillRect(x + 7 * u, y + 6 * u, 2 * u, 4 * u);
}

function drawShieldIcon(ctx, x, y, s = 1, active = false) {
    const u = 2 * s;
    ctx.fillStyle = active ? '#7ee8a2' : '#5f617f';
    ctx.fillRect(x + 2 * u, y, 8 * u, 3 * u);
    ctx.fillRect(x + u, y + 3 * u, 10 * u, 5 * u);
    ctx.fillRect(x + 3 * u, y + 8 * u, 6 * u, 3 * u);
    ctx.fillStyle = active ? '#eaffc8' : '#aeb0c8';
    ctx.fillRect(x + 4 * u, y + 2 * u, 3 * u, 2 * u);
    ctx.fillStyle = '#243245';
    ctx.fillRect(x + 9 * u, y + 3 * u, 2 * u, 5 * u);
}

function drawPixelPanel(ctx, x, y, w, h, label, value, isRight = false, accent = '#f5be00') {
    drawPixelFrame(ctx, x, y, w, h, accent);

    ctx.fillStyle = '#b7bad8';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = isRight ? 'right' : 'left';
    ctx.fillText(label, isRight ? x + w - 14 : x + 14, y + 22);

    ctx.fillStyle = '#fff7dc';
    ctx.font = 'bold 31px monospace';
    ctx.textAlign = isRight ? 'right' : 'left';
    ctx.fillText(value, isRight ? x + w - 14 : x + 14, y + h - 14);
}

// â”€â”€â”€ Ranking Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const RANKING_KEY = 'hopStreetRanking';

function getRanking() {
    try {
        const data = localStorage.getItem(RANKING_KEY);
        const parsed = data ? JSON.parse(data) : [];
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter(entry => entry && typeof entry === 'object')
            .map(entry => ({
                name: String(entry.name || 'Jogador').substring(0, 12),
                score: Number(entry.score) || 0,
                stage: entry.stage || 'FASE 1',
                corn: Number(entry.corn) || 0,
                date: entry.date || '',
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    } catch {
        return [];
    }
}

function saveRanking(entry) {
    const top10 = [...getRanking(), entry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    try {
        localStorage.setItem(RANKING_KEY, JSON.stringify(top10));
    } catch {
        // If localStorage is unavailable, still return the in-memory result.
    }
    return top10;
}

function clearRanking() {
    try {
        localStorage.removeItem(RANKING_KEY);
    } catch {
        // Nothing else to do if the browser refuses localStorage access.
    }
    return [];
}

// â”€â”€â”€ Lane generation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function makeLane(idx, CANVAS_W, stageCfg = STAGES[0]) {
    if (idx < 3) return { type: 'grass', shade: idx % 2, trees: makeTrees(idx, 9), corn: null, cornTaken: false };
    if (idx % 6 === 0) return { type: 'grass', shade: idx % 2, trees: makeTrees(idx, Math.floor(CANVAS_W / TILE)), corn: null, cornTaken: false };
    const roll = Math.random();
    if (roll < (1 - stageCfg.roadRatio)) return { type: 'grass', shade: idx % 2, trees: makeTrees(idx, Math.floor(CANVAS_W / TILE)), corn: null, cornTaken: false };
    const dir = Math.random() < 0.5 ? 1 : -1;
    const speedBase = stageCfg.carMin + Math.random() * (stageCfg.carMax - stageCfg.carMin);
    const speedVar = 0.92 + ((idx % 5) * 0.04);
    const speed = Math.min(stageCfg.carMax, Math.max(stageCfg.carMin, speedBase * speedVar));
    
    const baseCols = Math.floor(CANVAS_W / TILE);
    const n = 1 + Math.floor(Math.random() * Math.min(stageCfg.maxCarsPerLane, Math.ceil(baseCols / 3)));
    
    const palette = ['#6e4fbd', '#4f7ecf', '#3aaa5c', '#d45f28', '#c84ea0'];
    const cars = [];
    for (let i = 0; i < n; i++) {
        const variants = ['compact', 'van', 'pickup', 'shortBus'];
        cars.push({
            x: (CANVAS_W / n) * i + Math.random() * 80 - 40,
            color: palette[Math.floor(Math.random() * palette.length)],
            variant: variants[Math.floor(Math.random() * variants.length)],
        });
    }
    return { type: 'road', dir, speed, cars, shade: idx % 2 };
}

function getRoadRun(lanes) {
    let run = 0;
    for (let i = lanes.length - 1; i >= 0; i--) {
        if (lanes[i].type === 'road') run++;
        else break;
    }
    return run;
}

function enforceLaneFairness(lane, idx, lanes, stageCfg, CANVAS_W) {
    const maxRun = stageCfg.maxRoadRun ?? 5;
    const roadRun = getRoadRun(lanes);
    if (lane.type === 'road' && roadRun >= maxRun) {
        return { type: 'grass', shade: idx % 2, trees: makeTrees(idx, Math.floor(CANVAS_W / TILE)), corn: null, cornTaken: false };
    }
    return lane;
}

function makeTrees(idx, cols) {
    if (idx < 1) return [];
    const out = [];
    const used = new Set();
    const n = Math.random() < 0.45 ? 0 : 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
        const c = Math.floor(Math.random() * cols);
        if (!used.has(c)) { used.add(c); out.push(c); }
    }
    return out;
}

function buildLanes(n, CANVAS_W, stageCfg = STAGES[0]) {
    return Array.from({ length: n }, (_, i) => makeLane(i, CANVAS_W, stageCfg));
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Draw: sky + ground background Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function drawBg(ctx, CANVAS_W, CANVAS_H, stageCfg = STAGES[0]) {
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H * 0.55);
    sky.addColorStop(0, stageCfg.skyTop);
    sky.addColorStop(1, stageCfg.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'rgba(120,210,80,0.12)';
    ctx.fillRect(0, CANVAS_H * 0.5, CANVAS_W, CANVAS_H * 0.5);
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Draw: destination row marker Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function drawDestination(ctx, sy, CANVAS_W, stageCfg) {
    // Safe zone base
    ctx.fillStyle = '#e8d88a';
    ctx.fillRect(0, sy, CANVAS_W, LANE_H);
    ctx.fillStyle = '#d4bc60';
    ctx.fillRect(0, sy, CANVAS_W, 4);
    ctx.fillStyle = '#b89840';
    ctx.fillRect(0, sy + LANE_H, CANVAS_W, SLAB_D * 0.6 | 0);
    ctx.fillStyle = '#8a7030';
    ctx.fillRect(0, sy + LANE_H + (SLAB_D * 0.6 | 0), CANVAS_W, SLAB_D - (SLAB_D * 0.6 | 0));

    // Checkered finish strip
    const cw = 20;
    for (let x = 0; x < CANVAS_W; x += cw) {
        const even = Math.floor(x / cw) % 2 === 0;
        ctx.fillStyle = even ? '#fff' : '#111';
        ctx.fillRect(x, sy, cw, 8);
    }

    // Banner label
    const labels = ['FASE CONCLUÃDA - CONTINUE', 'ÃšLTIMA ETAPA Ã€ FRENTE', 'FESTIVAL DO MILHO'];
    const stageIdx = STAGES.indexOf(stageCfg);
    const msg = labels[Math.max(0, Math.min(stageIdx, 2))];
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(CANVAS_W / 2 - 200, sy + 12, 400, 30);
    ctx.fillStyle = stageCfg.accent;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(msg, CANVAS_W / 2, sy + 32);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#6b5622';
    for (let x = 20; x < CANVAS_W; x += 36) {
        ctx.fillRect(x, sy + LANE_H - 8, 10, 3);
    }
}

function makeCornParticles(seed, count = 15) {
    const rand = mulberry32(seed);
    const particles = [];
    for (let i = 0; i < count; i++) {
        const ang = rand() * Math.PI * 2;
        const speed = 38 + rand() * 70;
        particles.push({
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed * 0.65 - 18,
            size: 3 + ((rand() * 4) | 0),
            life: 0.29 + rand() * 0.26,
            color: rand() > 0.5 ? '#ffd95b' : '#f0b92e',
        });
    }
    return particles;
}

function placeStageCorn(lanes, stageCfg, cols) {
    let placed = 0;
    const maxRow = Math.min(stageCfg.goalRow - 1, lanes.length - 1);
    for (let r = 2; r <= maxRow && placed < stageCfg.cornTarget; r++) {
        const ln = lanes[r];
        if (!ln || ln.type !== 'grass') continue;
        const preferred = 1 + ((r * 7) % Math.max(2, cols - 2));
        const blocked = new Set(ln.trees || []);
        if (!blocked.has(preferred)) {
            ln.corn = { col: preferred, golden: false };
            ln.cornTaken = false;
            placed++;
            continue;
        }
        for (let c = 1; c < cols - 1; c++) {
            if (!blocked.has(c)) {
                ln.corn = { col: c, golden: false };
                ln.cornTaken = false;
                placed++;
                break;
            }
        }
    }

    const candidates = [];
    for (let r = 2; r <= maxRow; r++) {
        const ln = lanes[r];
        if (!ln || ln.type !== 'grass' || ln.corn) continue;
        const blocked = new Set(ln.trees || []);
        const validCols = [];
        for (let c = 1; c < cols - 1; c++) {
            if (!blocked.has(c)) validCols.push(c);
        }
        if (validCols.length > 0) candidates.push({ row: r, validCols });
    }
    if (candidates.length > 0) {
        const pickIdx = Math.floor(Math.random() * candidates.length);
        const pick = candidates[pickIdx];
        const col = pick.validCols[Math.floor(Math.random() * pick.validCols.length)];
        lanes[pick.row].corn = { col, golden: true };
        lanes[pick.row].cornTaken = false;
    }
}


function drawGrassLane(ctx, sy, shd, trees, CANVAS_W, r) {
    const top1 = shd === 0 ? '#6dc45e' : '#5bb34e';
    const top2 = shd === 0 ? '#7ed670' : '#6dc45e';
    const front = shd === 0 ? '#3d8830' : '#306d26';
    const frontLo = shd === 0 ? '#2d6622' : '#23521a';

    // Base surface
    ctx.fillStyle = top1;
    ctx.fillRect(0, sy, CANVAS_W, LANE_H);
    
    // Highlights
    ctx.fillStyle = top2;
    ctx.fillRect(0, sy, CANVAS_W, 4);

    // Deterministic decorations with reduced density in center corridor.
    for (let i = 0; i < 12; i++) {
        const x = (getSeed(r, i) * CANVAS_W);
        const y = sy + 10 + (getSeed(r, i + 10) * (LANE_H - 20));
        const inCenter = x > CANVAS_W * 0.37 && x < CANVAS_W * 0.63;
        
        const type = getSeed(r, i + 20);
        if (type < 0.24) {
            // Tuft
            ctx.fillStyle = shade(top1, 12);
            ctx.fillRect(x, y, 12, 4);
            ctx.fillRect(x + 3, y - 3, 4, 3);
        } else if (type < 0.38) {
            // Flower
            const colors = ['#f0f', '#ff0', '#0ff', '#fff'];
            const c = colors[Math.floor(getSeed(r, i + 30) * colors.length)];
            ctx.fillStyle = c;
            ctx.fillRect(x, y, 4, 4);
            ctx.fillStyle = shade(top1, -20);
            ctx.fillRect(x, y + 4, 4, 2);
        } else if (type < 0.48) {
            // Small Stone
            ctx.fillStyle = '#999';
            ctx.fillRect(x, y, 6, 4);
            ctx.fillStyle = '#666';
            ctx.fillRect(x, y + 4, 6, 2);
        } else if (!inCenter && type < 0.56) {
            // Short fence
            ctx.fillStyle = '#7a5a35';
            ctx.fillRect(x, y, 16, 3);
            ctx.fillStyle = '#5d4122';
            ctx.fillRect(x + 2, y - 6, 3, 9);
            ctx.fillRect(x + 11, y - 6, 3, 9);
        } else if (!inCenter && type < 0.62) {
            // Bush
            ctx.fillStyle = '#3f8a36';
            ctx.fillRect(x, y, 14, 8);
            ctx.fillStyle = '#2d6d26';
            ctx.fillRect(x, y + 8, 14, 3);
            drawGroundShadow(ctx, x + 7, y + 12, 7, 2, 0.16);
        } else if (!inCenter && type < 0.67) {
            // Sign post
            ctx.fillStyle = '#6f4b28';
            ctx.fillRect(x + 4, y - 8, 3, 11);
            ctx.fillStyle = '#d5bf82';
            ctx.fillRect(x, y - 14, 12, 6);
            ctx.fillStyle = '#9c7b40';
            ctx.fillRect(x, y - 8, 12, 2);
        } else if (!inCenter && type < 0.72) {
            // Fallen log
            ctx.fillStyle = '#8f6438';
            ctx.fillRect(x, y + 1, 18, 5);
            ctx.fillStyle = '#6d4a2a';
            ctx.fillRect(x + 1, y + 6, 16, 2);
        }
    }

    // Front slab
    ctx.fillStyle = front;
    ctx.fillRect(0, sy + LANE_H, CANVAS_W, SLAB_D * 0.6 | 0);
    ctx.fillStyle = frontLo;
    ctx.fillRect(0, sy + LANE_H + (SLAB_D * 0.6 | 0), CANVAS_W, SLAB_D - (SLAB_D * 0.6 | 0));

    if (trees && trees.length) {
        trees.forEach(col => drawTree(ctx, col * TILE + TILE / 2, sy));
    }
}

function drawCorn(ctx, corn, sy, time = 0) {
    if (!corn) return;
    const col = corn.col;
    const isGolden = !!corn.golden;
    const bob = Math.round(Math.sin(time * 0.006 + col) * 2);
    const pulse = isGolden
        ? (0.58 + Math.sin(((Date.now() % 600) / 600) * Math.PI * 2) * 0.22)
        : (0.62 + Math.sin(time * 0.009 + col) * 0.24);
    const x = Math.round(col * TILE + TILE / 2 - 12);
    const y = Math.round(sy + LANE_H * 0.34 + bob);

    drawGroundShadow(ctx, x + 13, y + 32 - bob, 13, 4, 0.24);

    ctx.fillStyle = isGolden ? `rgba(255,195,45,${0.25 + pulse * 0.25})` : `rgba(255,220,70,${0.18 + pulse * 0.16})`;
    ctx.fillRect(x - 6 - (isGolden ? 1 : 0), y - 5 - (isGolden ? 1 : 0), 38 + (isGolden ? 2 : 0), 38 + (isGolden ? 2 : 0));
    ctx.fillStyle = isGolden ? `rgba(255,245,190,${0.5 + pulse * 0.2})` : `rgba(255,250,160,${0.4 + pulse * 0.22})`;
    ctx.fillRect(x - 3, y, 4, 4);
    ctx.fillRect(x + 26, y + 7, 4, 4);
    ctx.fillRect(x + 19, y - 7, 3, 3);
    ctx.fillRect(x + 4, y + 26, 3, 3);

    ctx.fillStyle = isGolden ? '#7d4a14' : '#5a3610';
    ctx.fillRect(x + 5, y, 15, 25);
    ctx.fillRect(x + 3, y + 4, 20, 18);
    ctx.fillRect(x + 8, y - 3, 10, 30);

    ctx.fillStyle = isGolden ? '#ffb82f' : '#ffd84d';
    ctx.fillRect(x + 7, y + 1, 11, 22);
    ctx.fillStyle = isGolden ? '#ff9427' : '#f0b92e';
    ctx.fillRect(x + 18, y + 4, 4, 18);
    ctx.fillStyle = isGolden ? '#ffe69d' : '#fff08a';
    ctx.fillRect(x + 8, y + 3, 7, 4);
    ctx.fillRect(x + 9, y + 11, 7, 3);
    ctx.fillRect(x + 8, y + 18, 6, 3);
    ctx.fillStyle = isGolden ? '#f5871d' : '#d89216';
    ctx.fillRect(x + 12, y + 2, 2, 21);
    ctx.fillRect(x + 17, y + 7, 2, 12);

    if (isGolden) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 10, y + 5, 3, 3);
        ctx.fillRect(x + 14, y + 8, 2, 2);
    }

    ctx.fillStyle = '#244f1d';
    ctx.fillRect(x - 1, y + 15, 7, 11);
    ctx.fillRect(x + 19, y + 16, 7, 11);
    ctx.fillStyle = '#58a83a';
    ctx.fillRect(x, y + 14, 5, 10);
    ctx.fillRect(x + 19, y + 15, 5, 10);
    ctx.fillStyle = '#8bd05a';
    ctx.fillRect(x + 2, y + 16, 2, 4);
    ctx.fillRect(x + 21, y + 17, 2, 4);
}

function drawStageFlavor(ctx, sy, CANVAS_W, r, stageCfg) {
    const x = 18 + ((r * 47) % Math.max(24, CANVAS_W - 120));
    const leftSide = x < CANVAS_W * 0.35;
    const rightSide = x > CANVAS_W * 0.65;
    if (!leftSide && !rightSide) return;

    const selector = r % 7;
    if (stageCfg.theme === 'suburb') {
        if (selector === 0) {
            ctx.fillStyle = '#7a5a35'; ctx.fillRect(x, sy + 18, 20, 3);
            ctx.fillStyle = '#d8c28e'; ctx.fillRect(x + 3, sy + 10, 14, 7);
            ctx.fillStyle = '#5f4326'; ctx.fillRect(x + 9, sy + 10, 2, 11);
        }
        if (selector === 3) {
            ctx.fillStyle = '#3f8a36'; ctx.fillRect(x, sy + 20, 16, 8);
            ctx.fillStyle = '#2d6d26'; ctx.fillRect(x + 2, sy + 28, 12, 3);
        }
    }
    if (stageCfg.theme === 'avenue') {
        if (selector === 1) {
            ctx.fillStyle = '#6f4b28'; ctx.fillRect(x + 6, sy + 10, 3, 14);
            ctx.fillStyle = '#d5bf82'; ctx.fillRect(x, sy + 2, 16, 7);
            ctx.fillStyle = '#1f1f1f'; ctx.fillRect(x + 2, sy + 4, 12, 2);
        }
        if (selector === 4) {
            ctx.fillStyle = '#f0a220'; ctx.fillRect(x + 2, sy + 18, 10, 9);
            ctx.fillStyle = '#c17712'; ctx.fillRect(x + 4, sy + 27, 6, 3);
        }
    }
    if (stageCfg.theme === 'rush') {
        if (selector === 2) {
            ctx.fillStyle = '#a36b2a'; ctx.fillRect(x, sy + 18, 18, 10);
            ctx.fillStyle = '#e0b45d'; ctx.fillRect(x + 2, sy + 20, 14, 4);
            ctx.fillStyle = '#1e1e1e'; ctx.fillRect(x + 4, sy + 24, 10, 2);
        }
        if (selector === 5) {
            ctx.fillStyle = '#7a2f2f'; ctx.fillRect(x, sy + 8, 22, 3);
            ctx.fillStyle = '#f0d080'; ctx.fillRect(x + 2, sy + 11, 2, 8);
            ctx.fillRect(x + 10, sy + 11, 2, 8);
            ctx.fillRect(x + 18, sy + 11, 2, 8);
        }
    }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Draw: road lane slab Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function drawRoadLane(ctx, sy, shd, CANVAS_W, r) {
    const top = shd === 0 ? '#525252' : '#474747';
    const front = shd === 0 ? '#282828' : '#202020';
    const frontLo = '#141414';

    // Asphalt base
    ctx.fillStyle = top;
    ctx.fillRect(0, sy, CANVAS_W, LANE_H);
    
    // Low density asphalt texture.
    ctx.fillStyle = shade(top, 5);
    for (let x = 0; x < CANVAS_W; x += 24) {
        const noise = getSeed(r * 13 + x, x * 0.11 + 17);
        if (noise > 0.88) {
            const yy = sy + 6 + (getSeed(x, r + 47) * (LANE_H - 16));
            ctx.fillRect(x, yy, 3, 3);
        }
    }
    ctx.fillStyle = shade(top, -8);
    for (let x = 12; x < CANVAS_W; x += 40) {
        const crack = getSeed(r * 9 + x, 91);
        if (crack > 0.92) {
            const yy = sy + 8 + (getSeed(r, x) * (LANE_H - 14));
            ctx.fillRect(x, yy, 6, 1);
            ctx.fillRect(x + 2, yy + 1, 3, 1);
        }
    }

    // Lane border lines
    ctx.fillStyle = '#636363';
    ctx.fillRect(0, sy, CANVAS_W, 4);
    
    // Dashed center line
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let x = 0; x < CANVAS_W; x += 62) {
        ctx.fillRect(x, sy + LANE_H / 2 - 2, 28, 4);
        ctx.fillStyle = 'rgba(25,25,25,0.2)';
        ctx.fillRect(x, sy + LANE_H / 2 + 2, 28, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
    }

    // Front slab
    ctx.fillStyle = front;
    ctx.fillRect(0, sy + LANE_H, CANVAS_W, SLAB_D * 0.55 | 0);
    ctx.fillStyle = frontLo;
    ctx.fillRect(0, sy + LANE_H + (SLAB_D * 0.55 | 0), CANVAS_W, SLAB_D - (SLAB_D * 0.55 | 0));

    // Road shoulders
    ctx.fillStyle = 'rgba(245,245,245,0.75)';
    ctx.fillRect(0, sy + 3, CANVAS_W, 2);
    ctx.fillStyle = 'rgba(10,10,10,0.28)';
    ctx.fillRect(0, sy + LANE_H - 4, CANVAS_W, 2);
}

function drawTree(ctx, cx, laneTop) {
    drawGroundShadow(ctx, cx + 4, laneTop + LANE_H - 4, 24, 8);

    const tx = cx - 10, tw = 20;
    const tTrunkTop = laneTop + LANE_H * 0.48;
    const tTrunkH = LANE_H * 0.46;

    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(tx, tTrunkTop, tw, tTrunkH);
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(tx + tw, tTrunkTop + 3, 7, tTrunkH + 5);
    ctx.fillStyle = '#3d2510';
    ctx.fillRect(tx, tTrunkTop + tTrunkH, tw, 5);

    const layers = [
        { x: cx - 26, y: laneTop + LANE_H * 0.28, w: 52, h: 22 },
        { x: cx - 20, y: laneTop + LANE_H * 0.06, w: 40, h: 22 },
        { x: cx - 13, y: laneTop - LANE_H * 0.15, w: 26, h: 20 },
    ];
    const topColors = ['#4a9c38', '#55b042', '#62c44e'];
    const rightColors = ['#2d6622', '#336e28', '#3a7a2e'];
    const frontColors = ['#1f4a17', '#234f1a', '#27561c'];

    layers.forEach(({ x, y, w, h }, i) => {
        ctx.fillStyle = topColors[i];
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = shade(topColors[i], 20);
        ctx.fillRect(x, y, w, 4);
        ctx.fillStyle = rightColors[i];
        ctx.fillRect(x + w, y + 3, 7, h + 5);
        ctx.fillStyle = frontColors[i];
        ctx.fillRect(x, y + h, w, 6);
    });
}

function drawCar(ctx, x, sy, dir, color, variant = 'compact') {
    const cx = x;
    const cy = sy + (LANE_H - CAR_H) / 2 - 4;
    const cw = CAR_W;
    const ch = CAR_H;
    const depth = 9;

    const cDark = shade(color, -40);
    const cSide = shade(color, -22);
    const cLight = shade(color, 18);

    drawGroundShadow(ctx, cx + cw / 2, cy + ch + depth + 6, cw * 0.42, 7, 0.24);

    let bodyInset = 0;
    let roofInset = cw * 0.16;
    let roofHeight = ch * 0.44;
    if (variant === 'van') {
        roofInset = cw * 0.11;
        roofHeight = ch * 0.56;
    } else if (variant === 'pickup') {
        roofInset = cw * 0.2;
        roofHeight = ch * 0.4;
    } else if (variant === 'shortBus') {
        bodyInset = 3;
        roofInset = cw * 0.1;
        roofHeight = ch * 0.62;
    }

    ctx.fillStyle = shade(color, -30);
    ctx.fillRect(cx, cy + ch - 2, cw, 2);
    ctx.fillStyle = color;
    ctx.fillRect(cx + bodyInset, cy, cw - bodyInset * 2, ch);
    ctx.fillStyle = cLight;
    ctx.fillRect(cx + 3 + bodyInset, cy + 2, cw - 6 - bodyInset * 2, 5);
    ctx.fillStyle = cDark;
    ctx.fillRect(cx + bodyInset, cy + ch, cw - bodyInset * 2, depth);
    ctx.fillStyle = cSide;
    ctx.fillRect(cx + cw - bodyInset, cy + 3, depth, ch + depth - 3);

    const ri = roofInset;
    const rTop = cy - roofHeight;
    const rH = roofHeight;
    const rW = cw - ri * 2;
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(cx + ri, rTop, rW, rH);
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(cx + ri, rTop + rH, rW, 6);
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(cx + ri + rW, rTop + 2, 6, rH + 4);

    const winY = rTop + 4;
    const winH = rH - 8;
    const winW = variant === 'shortBus' ? (rW - 16) / 3 - 1 : (rW - 10) / 2 - 2;
    ctx.fillStyle = '#152535';
    if (variant === 'shortBus') {
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(cx + ri + 4 + i * (winW + 3), winY, winW, winH);
        }
    } else {
        ctx.fillRect(cx + ri + 4, winY, winW, winH);
        ctx.fillRect(cx + ri + 4 + winW + 4, winY, winW, winH);
    }

    const wy = cy + ch - 2;
    const wArr = variant === 'shortBus' ? [cx + 14, cx + cw - 32] : [cx + 8, cx + cw - 26];
    ctx.fillStyle = '#111';
    wArr.forEach(wx => {
        ctx.fillRect(wx, wy, 20, 12);
        ctx.fillStyle = '#000';
        ctx.fillRect(wx, wy + 12, 20, 5);
        ctx.fillStyle = '#555';
        ctx.fillRect(wx + 4, wy + 2, 10, 8);
    });

    const goRight = dir === 1;
    ctx.fillStyle = goRight ? '#fff0a0' : '#ff3344';
    ctx.fillRect(goRight ? cx + cw - 6 : cx + 1, cy + ch * 0.45, 6, 11);
    ctx.fillStyle = goRight ? '#c31d1d' : '#ffd464';
    ctx.fillRect(goRight ? cx + 1 : cx + cw - 6, cy + ch * 0.45, 6, 11);
}

function drawChicken(ctx, px, py, hopT, time = 0) {
    const bounce = Math.sin(hopT * Math.PI);
    const idle = Math.sin(time * 0.006) * 2;
    const land = Math.max(0, 1 - Math.abs(hopT - 1) * 5);
    
    const arc = bounce * 28;
    const squishX = 1 - bounce * 0.08 + land * 0.05;
    const squishY = 1 + bounce * 0.1 - land * 0.04;

    const cx = px + TILE / 2;
    const cy = py + LANE_H * 0.78 - arc - idle;

    ctx.save();
    ctx.translate(cx, cy);
    drawGroundShadow(ctx, 2, arc + idle + 12, 23 * (1 - bounce * 0.18), 7, 0.32);
    ctx.scale(squishX, squishY);

    const bw = 32, bh = 27;
    ctx.fillStyle = '#2b2b36';
    ctx.fillRect(-bw / 2 - 2, -bh / 2 - 2, bw + 4, bh + 4);
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-bw / 2 + 3, -bh / 2 + 3, bw - 8, 5);
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(-bw / 2, bh / 2 - 2, bw, 5);

    ctx.fillStyle = '#cfcfd6';
    ctx.fillRect(-bw / 2 - 4, -2, 10, 15);
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(-bw / 2 - 2, 0, 7, 10);
    ctx.fillStyle = '#bfc0c8';
    ctx.fillRect(-bw / 2 - 4, 10, 10, 4);

    ctx.fillStyle = '#f09020';
    ctx.fillRect(-10, 13, 4, 12);
    ctx.fillRect(8, 13, 4, 12);
    ctx.fillStyle = '#c96f14';
    ctx.fillRect(-12, 24, 10, 3);
    ctx.fillRect(6, 24, 10, 3);

    const hw = 23, hh = 21;
    const hbY = -bh / 2 - hh + 2;
    ctx.fillStyle = '#2b2b36';
    ctx.fillRect(-hw / 2 - 2, hbY - 2, hw + 4, hh + 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-hw / 2, hbY, hw, hh);
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(-hw / 2 + 3, hbY + 3, hw - 7, 4);
    ctx.fillStyle = '#c8c8d0';
    ctx.fillRect(hw / 2 - 2, hbY + 4, 5, hh);
    ctx.fillStyle = '#b3b3bd';
    ctx.fillRect(-hw / 2, hbY + hh - 2, hw, 4);

    ctx.fillStyle = '#b51f2e';
    ctx.fillRect(-8, hbY - 13, 8, 11);
    ctx.fillRect(-2, hbY - 18, 7, 9);
    ctx.fillStyle = '#ff4d5e';
    ctx.fillRect(-6, hbY - 12, 5, 8);
    ctx.fillRect(0, hbY - 17, 4, 6);

    ctx.fillStyle = '#f6a12a';
    ctx.fillRect(hw / 2 - 1, hbY + hh / 2 - 4, 12, 8);
    ctx.fillStyle = '#ffd25a';
    ctx.fillRect(hw / 2, hbY + hh / 2 - 3, 8, 3);
    ctx.fillStyle = '#9b5a12';
    ctx.fillRect(hw / 2 + 8, hbY + hh / 2 + 1, 3, 3);

    ctx.fillStyle = '#111';
    ctx.fillRect(hw / 2 - 10, hbY + 5, 7, 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(hw / 2 - 8, hbY + 6, 2, 2);
    ctx.restore();
}

function drawShieldAura(ctx, px, py, hopT, time) {
    const bounce = Math.sin(hopT * Math.PI);
    const idle = Math.sin(time * 0.006) * 2;
    const arc = bounce * 28;
    const cx = px + TILE / 2;
    const cy = py + LANE_H * 0.78 - arc - idle;
    const pulse = 0.7 + Math.sin(time * 0.008) * 0.3;
    const r = 28;
    ctx.strokeStyle = `rgba(240,208,96,${0.3 * pulse})`;
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(cx, cy - 10, r + 6, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = `rgba(200,160,48,${0.6 * pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy - 10, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = `rgba(255,230,100,${0.5 * pulse})`;
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + time * 0.003;
        ctx.fillRect(cx + Math.cos(a) * (r + 2) - 2, cy - 10 + Math.sin(a) * (r + 2) - 2, 4, 4);
    }
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        return;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arc(x + w - radius, y + radius, radius, -Math.PI / 2, 0);
    ctx.lineTo(x + w, y + h - radius);
    ctx.arc(x + w - radius, y + h - radius, radius, 0, Math.PI / 2);
    ctx.lineTo(x + radius, y + h);
    ctx.arc(x + radius, y + h - radius, radius, Math.PI / 2, Math.PI);
    ctx.lineTo(x, y + radius);
    ctx.arc(x + radius, y + radius, radius, Math.PI, (Math.PI * 3) / 2);
}

function drawHudPill(ctx, x, y, w, h, accent, fill, dimmed = false, glowing = false) {
    const body = dimmed ? 'rgba(22,26,44,0.78)' : fill;
    const border = dimmed ? '#4c4f68' : accent;
    drawRoundedRectPath(ctx, x + 3, y + 4, w, h, h / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fill();

    if (glowing) {
        ctx.save();
        ctx.shadowColor = 'rgba(255,210,96,0.65)';
        ctx.shadowBlur = 12;
        drawRoundedRectPath(ctx, x, y, w, h, h / 2);
        ctx.fillStyle = body;
        ctx.fill();
        ctx.restore();
    } else {
        drawRoundedRectPath(ctx, x, y, w, h, h / 2);
        ctx.fillStyle = body;
        ctx.fill();
    }

    drawRoundedRectPath(ctx, x, y, w, h, h / 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = border;
    ctx.stroke();

    drawRoundedRectPath(ctx, x + 2, y + 2, w - 4, h / 2 - 2, h / 2.8);
    ctx.fillStyle = dimmed ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)';
    ctx.fill();
}

function drawHUD(ctx, score, hiScore, CANVAS_W, scorePop, stageName, stageCorn, stageCornTarget, cornBank, shieldActive) {
    const scoreY = 24 - Math.round((scorePop || 0) * 4);
    drawPixelPanel(ctx, 24, scoreY, 128, 72, 'SCORE', score, false, '#ffe066');
    drawPixelPanel(ctx, CANVAS_W - 184, 24, 160, 72, 'BEST', hiScore, true, '#7ee8a2');
    
    if (scorePop > 0) {
        ctx.fillStyle = `rgba(255,230,140,${0.35 * scorePop})`;
        ctx.fillRect(32, scoreY + 10, 112, 54);
    }
    // Stage label in center
    if (stageName) {
        const w = 286;
        const x = CANVAS_W / 2 - w / 2;
        drawPixelFrame(ctx, x, 22, w, 34, '#d0d0ff', '#15172c');
        ctx.fillStyle = '#eef0ff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(stageName, CANVAS_W / 2, 44);
        ctx.textAlign = 'left';
    }

    const canShield = (cornBank || 0) >= 3;
    const pillY = 62;
    const pillH = 30;
    const pillGap = 8;
    const pillW = 146;
    const rowW = (pillW * 3) + (pillGap * 2);
    const rowX = CANVAS_W / 2 - rowW / 2;

    if (stageCornTarget > 0) {
        const metaComplete = stageCorn >= stageCornTarget;
        drawHudPill(ctx, rowX, pillY, pillW, pillH, metaComplete ? '#7ee8a2' : '#f0bf34', 'rgba(16,21,38,0.92)', false, false);
        drawCornIcon(ctx, rowX + 10, pillY + 6, 0.62);
        ctx.fillStyle = '#fff7dc';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${stageCorn}/${stageCornTarget}`, rowX + 38, pillY + 20);
    }

    const bankX = rowX + pillW + pillGap;
    drawHudPill(ctx, bankX, pillY, pillW, pillH, '#f0bf34', 'rgba(16,21,38,0.92)', false, false);
    drawCornIcon(ctx, bankX + 10, pillY + 6, 0.62);
    ctx.fillStyle = '#ffe066';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${cornBank || 0}`, bankX + 38, pillY + 20);

    const shieldX = bankX + pillW + pillGap;
    const shieldDimmed = !shieldActive && !canShield;
    drawHudPill(ctx, shieldX, pillY, pillW, pillH, shieldActive ? '#f0d060' : '#7c7f9c', 'rgba(16,21,38,0.92)', shieldDimmed, shieldActive);
    drawShieldIcon(ctx, shieldX + 10, pillY + 5, 0.62, shieldActive || canShield);
    ctx.fillStyle = shieldDimmed ? '#7b7f9d' : (shieldActive ? '#ffe9a6' : '#eef0ff');
    ctx.fillText('3', shieldX + 38, pillY + 20);
}

function drawCornFX(ctx, cornFx, time) {
    if (!cornFx) return true;
    const t = (time - cornFx.t0) / 1000;
    if (t > 0.44) return true;
    cornFx.particles.forEach((p) => {
        const k = Math.min(1, t / p.life);
        const alpha = Math.max(0, 1 - k);
        const px = cornFx.x + p.vx * t;
        const py = cornFx.y + p.vy * t + 90 * t * t;
        ctx.fillStyle = hexToRgba(p.color, alpha);
        ctx.fillRect(px, py, p.size, p.size);
    });
    return false;
}

function drawImpactFX(ctx, hit, time) {
    if (!hit) return false;
    const t = (time - hit.t0) / 1000;
    if (t > 0.56) return true;

    hit.particles.forEach((p) => {
        const k = Math.min(1, t / p.life);
        const px = hit.x + p.vx * t;
        const py = hit.y + p.vy * t + 120 * t * t;
        const alpha = Math.max(0, 1 - k);
        ctx.fillStyle = hexToRgba(p.color, alpha);
        ctx.fillRect(px, py, p.size, p.size);
    });

    const flash = Math.max(0, 1 - t / 0.16) * 0.22;
    if (flash > 0) {
        ctx.fillStyle = `rgba(255,220,160,${flash})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    return false;
}

function drawShieldBreakFX(ctx, shieldBreak, time) {
    if (!shieldBreak) return false;
    const t = (time - shieldBreak.t0) / 1000;
    if (t > 0.6) return true;
    shieldBreak.particles.forEach((p) => {
        const k = Math.min(1, t / p.life);
        const px = shieldBreak.x + p.vx * t;
        const py = shieldBreak.y + p.vy * t + 100 * t * t;
        const alpha = Math.max(0, 1 - k);
        ctx.fillStyle = hexToRgba(p.color, alpha);
        ctx.fillRect(px, py, p.size, p.size);
    });
    const flash = Math.max(0, 1 - t / 0.2) * 0.25;
    if (flash > 0) {
        ctx.fillStyle = `rgba(240,208,80,${flash})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    return false;
}

function laneY(row, camRow, CANVAS_H) {
    return Math.round(CANVAS_H * PLAYER_Y_RATIO - (row - camRow + 1) * SLAB_STEP + SLAB_STEP * 0.5);
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Main Component Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function normalizeMoveKey(key) {
    const k = key.toLowerCase();
    if (k === 'arrowup' || k === 'w' || k === 'up') return 'up';
    if (k === 'arrowdown' || k === 's' || k === 'down') return 'down';
    if (k === 'arrowleft' || k === 'a' || k === 'left') return 'left';
    if (k === 'arrowright' || k === 'd' || k === 'right') return 'right';
    return null;
}

export default function Game() {
    const canvasRef = useRef(null);
    const stateRef = useRef(null);
    const hiRef = useRef(0);
    const rafRef = useRef(null);
    const rankingSaveLockRef = useRef(false);
    const pressedMoveKeysRef = useRef(new Set());
    const moveKeyOrderRef = useRef([]);
    const queuedMoveDirRef = useRef(null);
    const shakeRef = useRef({ frames: 0, intensity: 0 });
    const flashRef = useRef({ frames: 0, color: '' });
    const nearMissRef = useRef({ show: false, timer: 0, cooldown: 0, x: 0, y: 0 });
    const startIdleTimeoutRef = useRef(null);

    const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight, cols: 9 });
    const [phase, setPhase] = useState('start');       // start | playing | stageclear | gameover | victory
    const [stageIdx, setStageIdx] = useState(0);       // 0-2 index into STAGES
    const [score, setScore] = useState(0);
    const [hiScore, setHiScore] = useState(0);
    const [stageCorn, setStageCorn] = useState(0);
    const [totalCorn, setTotalCorn] = useState(0);
    const [cornBank, setCornBank] = useState(0);

    const [playerName, setPlayerName] = useState('');
    const [rankingSaved, setRankingSaved] = useState(false);
    const [startIdle, setStartIdle] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [rankingList, setRankingList] = useState([]);

    const stageCfg = STAGES[stageIdx];

    const updateDims = useCallback(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        let cols = Math.floor(w / TILE);
        if (w > 1024) cols = Math.min(21, Math.max(13, cols));
        else cols = Math.max(7, cols);
        setDims({ w, h, cols });
    }, []);

    useEffect(() => {
        updateDims();
        window.addEventListener('resize', updateDims);
        return () => window.removeEventListener('resize', updateDims);
    }, [updateDims]);

    useEffect(() => {
        if (phase === 'gameover' || phase === 'victory') {
            const currentScore = stateRef.current ? stateRef.current.score : score;
            const currentCorn = stateRef.current ? stateRef.current.totalCorn : totalCorn;
            setFinalScore(currentScore + currentCorn * 5);
            rankingSaveLockRef.current = false;
            setRankingSaved(false);
            setPlayerName('');
            setRankingList(getRanking());
        } else if (phase === 'start') {
            setRankingList(getRanking());
        }
    }, [phase, score, totalCorn]);

    useEffect(() => {
        if (phase !== 'start') {
            setStartIdle(false);
            if (startIdleTimeoutRef.current) {
                clearTimeout(startIdleTimeoutRef.current);
                startIdleTimeoutRef.current = null;
            }
            return;
        }
        setStartIdle(false);
        if (startIdleTimeoutRef.current) clearTimeout(startIdleTimeoutRef.current);
        startIdleTimeoutRef.current = setTimeout(() => setStartIdle(true), 15000);
        return () => {
            if (startIdleTimeoutRef.current) {
                clearTimeout(startIdleTimeoutRef.current);
                startIdleTimeoutRef.current = null;
            }
        };
    }, [phase]);

    const makeInitialState = useCallback((sIdx, w, cols, carryTotalCorn = 0, carryCornBank = 0) => {
        const cfg = STAGES[sIdx];
        const lanes = [];
        for (let i = 0; i < 80; i++) {
            const next = makeLane(i, w, cfg);
            lanes.push(enforceLaneFairness(next, i, lanes, cfg, w));
        }
        placeStageCorn(lanes, cfg, cols);
        return {
            lanes,
            totalLanes: 80,
            player: {
                col: Math.floor(cols / 2),
                row: 1,
                hopT: 1,
                targetCol: Math.floor(cols / 2),
                targetRow: 1,
                shield: false,
                invincibleUntil: 0,
            },
            score: 0,
            stageCorn: 0,
            cornBank: carryCornBank,
            totalCorn: carryTotalCorn,
            maxRow: 1,
            frozen: false,
            cameraRow: 1,
            fx: { scorePopUntil: 0, hit: null, cornPopUntil: 0, cornBurst: null, shieldBreak: null, cornBonusUntil: 0, shieldWarningUntil: 0, goldenCornFrames: 0 },
        };
    }, []);

    if (!stateRef.current) {
        const initialCols = Math.floor(window.innerWidth / TILE);
        stateRef.current = makeInitialState(0, window.innerWidth, initialCols);
    }

    const ensureLanes = useCallback((s, cfg) => {
        while (s.totalLanes < s.player.row + 50) {
            const next = makeLane(s.totalLanes, dims.w, cfg);
            s.lanes.push(enforceLaneFairness(next, s.totalLanes, s.lanes, cfg, dims.w));
            s.totalLanes++;
        }
    }, [dims.w]);

    const clearMovementKeys = useCallback(() => {
        pressedMoveKeysRef.current.clear();
        moveKeyOrderRef.current = [];
        queuedMoveDirRef.current = null;
    }, []);

    const getActiveMoveDir = useCallback(() => {
        const order = moveKeyOrderRef.current;
        for (let i = order.length - 1; i >= 0; i--) {
            const key = order[i];
            if (pressedMoveKeysRef.current.has(key)) return normalizeMoveKey(key);
        }
        return null;
    }, []);

    const resetGame = useCallback(() => {
        clearMovementKeys();
        stateRef.current = makeInitialState(0, dims.w, dims.cols, 0, 0);
        setScore(0);
        setStageIdx(0);
        setStageCorn(0);
        setTotalCorn(0);
        setCornBank(0);
        rankingSaveLockRef.current = false;
        setRankingSaved(false);
        setPlayerName('');
        setPhase('playing');
    }, [dims.w, dims.cols, makeInitialState, clearMovementKeys]);

    const advanceStage = useCallback(() => {
        clearMovementKeys();
        const nextIdx = stageIdx + 1;
        const s = stateRef.current;
        stateRef.current = makeInitialState(nextIdx, dims.w, dims.cols, s.totalCorn, s.cornBank);
        setScore(0);
        setStageCorn(0);
        setTotalCorn(stateRef.current.totalCorn);
        setCornBank(stateRef.current.cornBank);
        setStageIdx(nextIdx);
        setPhase('playing');
    }, [stageIdx, dims.w, dims.cols, makeInitialState, clearMovementKeys]);

    const handleSaveRanking = useCallback(() => {
        if (rankingSaved || rankingSaveLockRef.current) return;
        rankingSaveLockRef.current = true;
        const nameToSave = playerName.trim() || 'Jogador';
        const reachedStage = STAGES[stageIdx];
        const entry = {
            name: nameToSave.substring(0, 12),
            score: finalScore,
            stage: reachedStage ? (reachedStage.name || reachedStage.id) : stageIdx + 1,
            corn: stateRef.current ? stateRef.current.totalCorn : totalCorn,
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        const updatedRanking = saveRanking(entry);
        setRankingList(updatedRanking);
        setRankingSaved(true);
    }, [playerName, finalScore, stageIdx, totalCorn, rankingSaved]);

    const handleClearRanking = useCallback(() => {
        if (!window.confirm('Limpar o ranking local da feira?')) return;
        setRankingList(clearRanking());
    }, []);

    const triggerMove = useCallback((key, cfg) => {
        const s = stateRef.current;
        if (s.frozen || s.player.hopT < 1) return;
        const p = s.player;
        const dir = normalizeMoveKey(key);
        if (!dir) return;
        let nc = p.col, nr = p.row;
        if (dir === 'up') nr = p.row + 1;
        if (dir === 'down') nr = Math.max(0, p.row - 1);
        if (dir === 'left') nc = Math.max(0, p.col - 1);
        if (dir === 'right') nc = Math.min(dims.cols - 1, p.col + 1);
        if (nc === p.col && nr === p.row) return;
        ensureLanes(s, cfg);
        p.targetCol = nc; p.targetRow = nr; p.hopT = 0;
        playJump();
    }, [dims.cols, ensureLanes]);

    const loop = useCallback((time) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = stateRef.current;
        const { w, h } = dims;
        const cfg = STAGES[stageIdx];

        if (phase === 'start') {
            drawBg(ctx, w, h, STAGES[0]);
            const laneRows = Math.ceil(h / SLAB_STEP) + 6;
            for (let r = 0; r < laneRows; r++) {
                const sy = h - ((r + 1) * SLAB_STEP);
                if (r % 4 === 1 || r % 4 === 2) drawRoadLane(ctx, sy, r % 2, w, r);
                else drawGrassLane(ctx, sy, r % 2, [], w, r);
            }

            const decoCars = [
                { lane: 1, dir: 1, speed: 0.16, color: '#4f7ecf', variant: 'van', offset: 140 },
                { lane: 2, dir: -1, speed: 0.2, color: '#d45f28', variant: 'pickup', offset: 420 },
                { lane: 5, dir: 1, speed: 0.24, color: '#6e4fbd', variant: 'compact', offset: 760 },
            ];
            decoCars.forEach((car) => {
                const sy = h - ((car.lane + 1) * SLAB_STEP);
                const span = w + CAR_W * 2;
                const progress = (time * car.speed + car.offset) % span;
                const x = car.dir > 0 ? (-CAR_W + progress) : (w + CAR_W - progress);
                drawCar(ctx, x, sy, car.dir, car.color, car.variant);
            });

            const poseTick = Math.floor(Date.now() / 300) % 2;
            const chickenRow = 0;
            const chickenSy = h - ((chickenRow + 1) * SLAB_STEP);
            const chickenX = Math.floor(w * 0.28) + (poseTick ? 6 : 0);
            const chickenY = chickenSy + (poseTick ? -2 : 0);
            drawChicken(ctx, chickenX, chickenY, 1, time);

            rafRef.current = requestAnimationFrame(loop);
            return;
        }

        // 1. Update Cars
        if (!s.frozen) {
            s.lanes.forEach(ln => {
                if (ln.type !== 'road') return;
                ln.cars.forEach(c => {
                    c.x += ln.dir * ln.speed;
                    if (c.x > w + CAR_W) c.x = -CAR_W;
                    if (c.x < -CAR_W) c.x = w + CAR_W;
                });
            });
        }

        // 2. Update Player Hop
        const p = s.player;
        if (p.hopT < 1) {
            p.hopT = Math.min(1, p.hopT + 0.14);
            if (p.hopT >= 1) {
                p.col = p.targetCol;
                p.row = p.targetRow;
                p.hopT = 1;
                if (p.row > s.maxRow) {
                    s.maxRow = p.row;
                    const prevScore = s.score;
                    s.score = Math.max(s.score, p.row - 1);
                    if (s.score > prevScore) s.fx.scorePopUntil = time + 260;
                    setScore(s.score);
                    if (s.score > hiRef.current) { hiRef.current = s.score; setHiScore(s.score); }
                }
                const landedLane = s.lanes[p.row];
                if (landedLane && landedLane.type === 'grass' && landedLane.corn && landedLane.corn.col === p.col && !landedLane.cornTaken) {
                    landedLane.cornTaken = true;
                    playCorn();
                    const isGoldenCorn = !!landedLane.corn.golden;
                    s.stageCorn += 1;
                    s.totalCorn += 1;
                    s.cornBank += isGoldenCorn ? 3 : 1;
                    if (isGoldenCorn) {
                        s.score += 15;
                        s.fx.scorePopUntil = time + 260;
                        s.fx.goldenCornFrames = 90;
                        setScore(s.score);
                        if (s.score > hiRef.current) { hiRef.current = s.score; setHiScore(s.score); }
                    }
                    s.fx.cornPopUntil = time + 260;
                    const collectY = laneY(p.row, s.cameraRow, h) + LANE_H * 0.54;
                    const collectX = p.col * TILE + TILE / 2;
                    const cseed = (((p.row + 3) * 15331) ^ ((p.col + 11) * 9176) ^ ((time | 0) * 37)) >>> 0;
                    s.fx.cornBurst = { t0: time, x: collectX, y: collectY, particles: makeCornParticles(cseed, isGoldenCorn ? 30 : 15) };
                    if (s.stageCorn === cfg.cornTarget) {
                        s.fx.cornBonusUntil = time + 1500;
                    }
                    setStageCorn(s.stageCorn);
                    setTotalCorn(s.totalCorn);
                    setCornBank(s.cornBank);
                }
                // Goal reached?
                if (p.row >= cfg.goalRow && !s.frozen) {
                    clearMovementKeys();
                    s.frozen = true;
                    if (stageIdx >= STAGES.length - 1) {
                        playVictory();
                        setPhase('victory');
                    } else {
                        playStageClear();
                        setPhase('stageclear');
                    }
                }
                if (!s.frozen && phase === 'playing') {
                    const queuedDir = queuedMoveDirRef.current;
                    queuedMoveDirRef.current = null;
                    const activeDir = queuedDir || getActiveMoveDir();
                    if (activeDir) triggerMove(activeDir, cfg);
                }
            }
        } else if (!s.frozen && phase === 'playing') {
            const queuedDir = queuedMoveDirRef.current;
            queuedMoveDirRef.current = null;
            const activeDir = queuedDir || getActiveMoveDir();
            if (activeDir) triggerMove(activeDir, cfg);
        }

        // 3. Continuous Collision Detection (Every Frame)
        if (!s.frozen && phase === 'playing') {
            if (!isSafe(s, w, time)) {
                const impactCol = p.col + (p.targetCol - p.col) * p.hopT;
                const impactRow = p.row + (p.targetRow - p.row) * p.hopT;
                const impactY = laneY(impactRow, s.cameraRow, h) + LANE_H * 0.74;
                const impactX = impactCol * TILE + TILE / 2;
                
                if (p.shield) {
                    p.shield = false;
                    playShieldBreak();
                    shakeRef.current = { frames: 6, intensity: 3 };
                    p.invincibleUntil = time + 1000;
                    const cseed = (((p.row + 3) * 15331) ^ ((time | 0) * 37)) >>> 0;
                    s.fx.shieldBreak = { t0: time, x: impactX, y: impactY, particles: makeShieldParticles(cseed) };
                } else {
                    clearMovementKeys();
                    playHit();
                    shakeRef.current = { frames: 10, intensity: 5 };
                    flashRef.current = { frames: 5, color: 'rgba(220,30,30,0.35)' };
                    const seed = (((p.row + 1) * 92821) ^ ((p.col + 7) * 68917) ^ ((time | 0) * 131)) >>> 0;
                    s.fx.hit = { t0: time, x: impactX, y: impactY, particles: makeImpactParticles(seed) };
                    s.frozen = true;
                    setPhase('gameover');
                }
            }
        }

        if (nearMissRef.current.cooldown > 0) nearMissRef.current.cooldown -= 1;
        if (nearMissRef.current.timer > 0) {
            nearMissRef.current.timer -= 1;
            if (nearMissRef.current.timer <= 0) nearMissRef.current.show = false;
        }

        if (!s.frozen && phase === 'playing') {
            const ar = p.row + (p.targetRow - p.row) * p.hopT;
            const checkRow = Math.round(ar);
            const ln = s.lanes[checkRow];
            if (ln && ln.type === 'road' && nearMissRef.current.cooldown <= 0 && isSafe(s, w, time)) {
                const shrink = 22;
                const px = (p.col + (p.targetCol - p.col) * p.hopT) * TILE + shrink;
                const pw = TILE - shrink * 2;
                const nearCar = ln.cars.find(c => {
                    const carLeft = c.x + 12;
                    const carRight = c.x + CAR_W - 12;
                    const gap = px + pw < carLeft ? carLeft - (px + pw) : px > carRight ? px - carRight : 0;
                    return gap > 0 && gap <= TILE * 0.9;
                });
                if (nearCar) {
                    const nearX = (p.col + (p.targetCol - p.col) * p.hopT) * TILE + TILE / 2;
                    const nearY = laneY(ar, s.cameraRow, h) + LANE_H * 0.16;
                    nearMissRef.current = { show: true, timer: 90, cooldown: 120, x: nearX, y: nearY };
                    s.score += 2;
                    s.fx.scorePopUntil = time + 260;
                    setScore(s.score);
                    if (s.score > hiRef.current) { hiRef.current = s.score; setHiScore(s.score); }
                }
            }
        }

        const tgt = p.hopT < 1 ? p.row + (p.targetRow - p.row) * p.hopT : p.row;
        s.cameraRow += (tgt - s.cameraRow) * 0.13;

        let didShake = false;
        if (shakeRef.current.frames > 0) {
            const intensity = shakeRef.current.intensity;
            const ox = (Math.random() * 2 - 1) * intensity;
            const oy = (Math.random() * 2 - 1) * intensity;
            ctx.save();
            ctx.translate(ox, oy);
            shakeRef.current.frames -= 1;
            didShake = true;
        }

        drawBg(ctx, w, h, cfg);

        const vis = [];
        for (let r = 0; r < s.totalLanes; r++) {
            const sy = laneY(r, s.cameraRow, h);
            if (sy > h + SLAB_STEP * 2 || sy < -SLAB_STEP * 10) continue;
            vis.push({ r, sy, ln: s.lanes[r] });
        }
        vis.sort((a, b) => b.sy - a.sy);

        for (const { r, sy, ln } of vis) {
            // Draw destination row in place of a normal lane
            if (r === cfg.goalRow) {
                drawDestination(ctx, sy, w, cfg);
            } else if (ln.type === 'grass') {
                drawGrassLane(ctx, sy, ln.shade, ln.trees, w, r);
                drawStageFlavor(ctx, sy, w, r, cfg);
                if (ln.corn && !ln.cornTaken) drawCorn(ctx, ln.corn, sy, time);
            } else {
                drawRoadLane(ctx, sy, ln.shade, w, r);
                ln.cars.forEach(c => drawCar(ctx, c.x, sy, ln.dir, c.color, c.variant));
            }
        }

        const ac = p.col + (p.targetCol - p.col) * p.hopT;
        const ar = p.row + (p.targetRow - p.row) * p.hopT;
        const csy = laneY(ar, s.cameraRow, h);
        
        if (p.shield) drawShieldAura(ctx, ac * TILE, csy, p.hopT < 1 ? p.hopT : 1, time);
        
        if (p.invincibleUntil > time) {
            if (Math.floor(time / 100) % 2 === 0) {
                drawChicken(ctx, ac * TILE, csy, p.hopT < 1 ? p.hopT : 1, time);
            }
        } else {
            drawChicken(ctx, ac * TILE, csy, p.hopT < 1 ? p.hopT : 1, time);
        }

        if (nearMissRef.current.show && nearMissRef.current.timer > 0) {
            const alpha = Math.max(0, Math.min(1, nearMissRef.current.timer / 90));
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = `rgba(0,0,0,${0.45 * alpha})`;
            ctx.fillText('QUASE!', w / 2 + 2, 122);
            ctx.fillStyle = `rgba(255,224,80,${alpha})`;
            ctx.fillText('QUASE!', w / 2, 120);
        }

        const scorePop = s.fx.scorePopUntil > time ? (s.fx.scorePopUntil - time) / 260 : 0;
        drawHUD(ctx, s.score, hiRef.current, w, scorePop, `FASE ${cfg.id} - ${cfg.name}`, s.stageCorn, cfg.cornTarget, s.cornBank, p.shield);
        
        if (s.fx.cornBonusUntil > time) {
            ctx.fillStyle = '#ffe066';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('META DE MILHO COMPLETA!', w / 2, h / 2 - 40);
        }
        if (s.fx.goldenCornFrames > 0) {
            const alpha = Math.max(0, Math.min(1, s.fx.goldenCornFrames / 90));
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = `rgba(80,40,0,${0.5 * alpha})`;
            ctx.fillText('MILHO DOURADO! +15', w / 2 + 2, h * 0.36 + 2);
            ctx.fillStyle = `rgba(255,210,0,${0.75 * alpha})`;
            ctx.fillText('MILHO DOURADO! +15', w / 2, h * 0.36);
            s.fx.goldenCornFrames -= 1;
        }
        if (s.fx.shieldWarningUntil > time) {
            ctx.fillStyle = '#f0bf34';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`MILHO INSUFICIENTE`, w / 2, h / 2 - 40);
        }

        if (s.fx.shieldBreak && drawShieldBreakFX(ctx, s.fx.shieldBreak, time)) s.fx.shieldBreak = null;
        if (s.fx.cornBurst && drawCornFX(ctx, s.fx.cornBurst, time)) s.fx.cornBurst = null;
        if (s.fx.hit && drawImpactFX(ctx, s.fx.hit, time)) s.fx.hit = null;

        if (didShake) ctx.restore();

        if (flashRef.current.frames > 0) {
            ctx.fillStyle = flashRef.current.color;
            ctx.fillRect(0, 0, w, h);
            flashRef.current.frames -= 1;
        }

        rafRef.current = requestAnimationFrame(loop);
    }, [dims, phase, stageIdx, triggerMove, getActiveMoveDir, clearMovementKeys]);

    function isSafe(s, w, time) {
        const p = s.player;
        if (p.invincibleUntil > time) return true;
        const ar = p.row + (p.targetRow - p.row) * p.hopT;
        const checkRow = Math.round(ar);
        const ln = s.lanes[checkRow];
        if (!ln || ln.type !== 'road') return true;
        const shrink = 22;
        const px = (p.col + (p.targetCol - p.col) * p.hopT) * TILE + shrink;
        const pw = TILE - shrink * 2;
        for (const c of ln.cars) {
            if (px < c.x + CAR_W - 12 && px + pw > c.x + 12) return false;
        }
        return true;
    }

    useEffect(() => {
        const onKeyDown = e => {
            if (e.target.tagName && e.target.tagName.toLowerCase() === 'input') {
                clearMovementKeys();
                return;
            }

            initAudio();
            
            const s = stateRef.current;
            const key = e.key.toLowerCase();
            const moveDir = normalizeMoveKey(key);
            const isGameKey = Boolean(moveDir) || key === ' ' || key === 'enter';

            if (moveDir) {
                e.preventDefault();
                const wasPressed = pressedMoveKeysRef.current.has(key);
                pressedMoveKeysRef.current.add(key);
                if (!e.repeat && !wasPressed) {
                    moveKeyOrderRef.current = moveKeyOrderRef.current.filter(k => k !== key);
                    moveKeyOrderRef.current.push(key);
                }
            }

            if (phase === 'start') { if (isGameKey) setPhase('playing'); return; }
            if (phase === 'gameover') { if ((key === ' ' || key === 'enter') && rankingSaved) resetGame(); return; }
            if (phase === 'stageclear') { if (key === ' ' || key === 'enter') advanceStage(); return; }
            if (phase === 'victory') { if ((key === ' ' || key === 'enter') && rankingSaved) resetGame(); return; }
            if (s.frozen) return;

            if (moveDir && phase === 'playing' && s.player.hopT < 1) {
                queuedMoveDirRef.current = moveDir;
            }

            // Shield activation
            if (key === ' ' && phase === 'playing') {
                if (s.cornBank >= 3 && !s.player.shield) {
                    s.cornBank -= 3;
                    s.player.shield = true;
                    playShieldOn();
                    flashRef.current = { frames: 4, color: 'rgba(255,210,0,0.25)' };
                    setCornBank(s.cornBank);
                } else if (!s.player.shield) {
                    s.fx.shieldWarningUntil = performance.now() + 1000;
                }
                return;
            }

            if (moveDir && s.player.hopT >= 1) {
                const activeDir = getActiveMoveDir();
                if (activeDir) triggerMove(activeDir, STAGES[stageIdx]);
            }
        };

        const onKeyUp = e => {
            const key = e.key.toLowerCase();
            if (!normalizeMoveKey(key)) return;
            pressedMoveKeysRef.current.delete(key);
            moveKeyOrderRef.current = moveKeyOrderRef.current.filter(k => k !== key);
        };

        const onClick = () => initAudio();

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('click', onClick);
        window.addEventListener('blur', clearMovementKeys);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('click', onClick);
            window.removeEventListener('blur', clearMovementKeys);
        };
    }, [phase, resetGame, advanceStage, triggerMove, stageIdx, rankingSaved, clearMovementKeys, getActiveMoveDir]);

    useEffect(() => {
        rafRef.current = requestAnimationFrame(loop);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [phase, loop]);

    const nextStage = STAGES[stageIdx + 1];
    const DeadChickenBadge = () => (
        <svg width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="Galinha derrotada">
            <rect x="14" y="12" width="20" height="20" rx="3" fill="#f4f6ff" />
            <rect x="18" y="8" width="4" height="5" fill="#ef4b4b" />
            <rect x="22" y="6" width="4" height="6" fill="#ff6b5b" />
            <rect x="26" y="8" width="4" height="5" fill="#ef4b4b" />
            <rect x="32" y="18" width="6" height="4" fill="#f7b547" />
            <rect x="37" y="19" width="2" height="2" fill="#d98c2f" />
            <rect x="18" y="20" width="2" height="2" fill="#1c2138" />
            <rect x="20" y="22" width="2" height="2" fill="#1c2138" />
            <rect x="20" y="20" width="2" height="2" fill="#1c2138" />
            <rect x="18" y="22" width="2" height="2" fill="#1c2138" />
            <rect x="26" y="20" width="2" height="2" fill="#1c2138" />
            <rect x="28" y="22" width="2" height="2" fill="#1c2138" />
            <rect x="28" y="20" width="2" height="2" fill="#1c2138" />
            <rect x="26" y="22" width="2" height="2" fill="#1c2138" />
            <rect x="20" y="32" width="3" height="6" fill="#f7b547" />
            <rect x="25" y="32" width="3" height="6" fill="#f7b547" />
            <rect x="12" y="17" width="3" height="11" fill="#e2e5f8" />
            <rect x="33" y="17" width="3" height="11" fill="#e2e5f8" />
        </svg>
    );
    const renderRankingRows = (limit = 10, compact = false) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 5 : 8, width: '100%' }}>
            {rankingList.slice(0, limit).map((r, i) => {
                const top3Borders = ['rgba(245,190,0,0.9)', 'rgba(192,198,220,0.85)', 'rgba(205,127,50,0.9)'];
                const top3Bg = ['rgba(245,190,0,0.18)', 'rgba(192,198,220,0.13)', 'rgba(205,127,50,0.14)'];
                const isTop3 = i < 3;
                const rowStyle = {
                    fontFamily: 'monospace',
                    fontSize: compact ? 11 : (i === 0 ? 15 : i < 3 ? 14 : 13),
                    color: i < 3 ? '#fff4b0' : '#c8cae8',
                    background: isTop3 ? top3Bg[i] : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isTop3 ? top3Borders[i] : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: compact ? 6 : 8,
                    padding: compact ? '5px 7px' : '7px 9px',
                    boxShadow: i === 0 ? '0 8px 0 #05070f, 0 0 18px rgba(245,190,0,0.24)' : '0 5px 0 #05070f',
                };
                return (
                    <div key={`${r.name}-${r.score}-${r.date}-${i}`} style={rowStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                            <span style={{ fontWeight: i < 3 ? 900 : 700 }}>
                                <span style={{ display: 'inline-block', minWidth: compact ? 20 : 24 }}>{['ðŸ¥‡', 'ðŸ¥ˆ', 'ðŸ¥‰'][i] || `${i + 1}.`}</span>
                                {r.name}
                            </span>
                            <span style={{ fontWeight: 900, color: i < 3 ? '#ffe066' : '#eef0ff' }}>{r.score}</span>
                        </div>
                        <div style={{ color: '#8589ad', fontSize: compact ? 9 : 10, marginTop: compact ? 1 : 3 }}>
                            {r.stage} | {r.corn} milhos{r.date ? ` | ${r.date}` : ''}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100dvh', background: '#0d1117', userSelect: 'none', overflow: 'hidden' }}>
            <style>{`
                @keyframes panelDrop {
                    0% { opacity: 0; transform: translateY(-22px) scale(0.98); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes hopTitlePulse {
                    0% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-2px) scale(1.015); }
                    100% { transform: translateY(0) scale(1); }
                }
                @keyframes startPromptBlink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.45; }
                }
                @keyframes idlePromptPulse {
                    0% { opacity: 0.72; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.03); }
                    100% { opacity: 0.72; transform: scale(1); }
                }
            `}</style>
            <canvas ref={canvasRef} width={dims.w} height={dims.h} style={{ display: 'block' }} />

            {phase !== 'playing' && (
                <div style={{ ...OVL, ...(phase === 'gameover' ? GAME_OVER_OVL : null) }}>
                    {phase === 'start' && (
                        <div style={{...PANEL, maxWidth: 980, padding: '34px 46px'}}>
                            <div style={{ ...TITLE, fontSize: 58, color: '#ffe066', marginBottom: 4, animation: 'hopTitlePulse 2.4s ease-in-out infinite' }}>HOP STREET</div>
                            <p style={{ color: '#eef0ff', fontFamily: 'monospace', fontSize: 17, marginBottom: 8, textAlign: 'center', lineHeight: 1.45 }}>
                                Atravesse as ruas, colete milho e chegue ao <b style={{ color: '#ffe066' }}>Festival do Milho</b>.
                            </p>
                            {!startIdle ? (
                                <div style={{ color: '#7ee8a2', fontFamily: 'monospace', fontWeight: 900, fontSize: 16, marginTop: 6, textAlign: 'center', animation: 'startPromptBlink 1.2s ease-in-out infinite' }}>
                                    Pressione ESPACO ou ENTER para comecar
                                </div>
                            ) : (
                                <div style={{ color: '#ffe066', fontFamily: 'monospace', fontWeight: 900, fontSize: 16, marginTop: 6, textAlign: 'center', animation: 'idlePromptPulse 1.2s ease-in-out infinite', padding: '4px 10px', border: '1px solid rgba(245,190,0,0.45)', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>{'\u{1F440} Pressione ENTER para jogar'}</div>
                            )}
                            
                            <div style={{ display: 'flex', gap: 34, marginTop: 24, textAlign: 'left', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minWidth: 320 }}>
                                    <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 360 }}>
                                        {STAGES.map((s, i) => (
                                            <div key={i} style={{ background: '#15172c', border: `2px solid ${s.accent}`, borderRadius: 8, padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: '#c8cae8', textAlign: 'center', boxShadow: '0 5px 0 #05070f' }}>
                                                <div style={{ color: s.accent, fontWeight: 900 }}>FASE {s.id}</div>
                                                <div>{s.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ background: '#0b0d18', padding: '16px 20px', borderRadius: 10, border: '2px solid #33364f', marginBottom: 22, width: '100%', boxShadow: '0 8px 0 #05070f' }}>
                                        <h3 style={{ color: '#fff7dc', fontFamily: 'monospace', marginBottom: 12, fontSize: 16, textAlign: 'center' }}>CONTROLES</h3>
                                        <p style={{ color: '#d5d8ff', fontFamily: 'monospace', fontSize: 14, marginBottom: 8 }}><b style={{ color: '#ffe066' }}>WASD ou Setas:</b> mover</p>
                                        <p style={{ color: '#d5d8ff', fontFamily: 'monospace', fontSize: 14, marginBottom: 8 }}><b style={{ color: '#7ee8a2' }}>ESPAÃ‡O:</b> Escudo de Palha</p>
                                        <p style={{ color: '#f0bf34', fontFamily: 'monospace', fontSize: 13, marginBottom: 0 }}>Colete milho para usar escudo.</p>
                                    </div>
                                    <button style={{ ...BTN, minWidth: 260 }} onClick={() => setPhase('playing')}>JOGAR AGORA</button>
                                </div>
                                
                                <div style={{ background: '#101225', border: '3px solid #f5be00', borderRadius: 12, padding: '18px 20px', minWidth: 330, maxWidth: 390, display: 'flex', flexDirection: 'column', boxShadow: '0 10px 0 #05070f' }}>
                                    <h3 style={{ color: '#ffe066', fontFamily: 'monospace', marginBottom: 14, textAlign: 'center', fontSize: 22, textShadow: '2px 2px 0 #000' }}>TOP 10 DA FEIRA</h3>
                                    {rankingList.length === 0 ? (
                                        <p style={{ color: '#8589ad', fontFamily: 'monospace', fontSize: 13, textAlign: 'center', margin: 'auto' }}>Nenhum recorde ainda. Seja o primeiro da fila!</p>
                                    ) : (
                                        renderRankingRows(10)
                                    )}
                                    {rankingList.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleClearRanking}
                                            style={{ marginTop: 14, alignSelf: 'center', background: 'transparent', border: '1px solid #33364f', color: '#666985', fontFamily: 'monospace', fontSize: 10, padding: '5px 8px', borderRadius: 6, cursor: 'pointer' }}
                                        >
                                            LIMPAR RANKING
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {phase === 'stageclear' && (
                        <div style={{ ...PANEL, ...COMPACT_PANEL, maxWidth: 540 }}>
                            <div style={{ ...TITLE, color: '#7ee8a2', fontSize: 34, marginBottom: 8 }}>FASE CONCLUÃDA!</div>
                            <div style={{ color: '#fff7dc', fontFamily: 'monospace', fontSize: 18, margin: '4px 0 6px', fontWeight: 900 }}>FASE {stageCfg.id} - {stageCfg.name}</div>
                            {nextStage && (
                                <div style={{ color: '#aeb2d8', fontFamily: 'monospace', fontSize: 14, marginBottom: 14, textAlign: 'center' }}>
                                    PrÃ³xima: <b style={{ color: nextStage.accent }}>{nextStage.name}</b>
                                </div>
                            )}
                            <div style={{ background: '#101225', border: '2px solid #f0bf34', borderRadius: 10, padding: '10px 20px', marginBottom: 10, minWidth: 260 }}>
                                <div style={{ color: '#ffe066', fontFamily: 'monospace', fontSize: 16, fontWeight: 900 }}>
                                    Milhos coletados: {stageCorn}/{stageCfg.cornTarget}
                                </div>
                            </div>
                            <div style={{ color: stageCorn >= stageCfg.cornTarget ? '#7ee8a2' : '#aeb2d8', fontFamily: 'monospace', fontSize: 13, marginBottom: 14, fontWeight: 700 }}>
                                {stageCorn >= stageCfg.cornTarget ? 'Meta de milho completa!' : 'Colete mais na prÃ³xima para bÃ´nus'}
                            </div>
                            <button style={{ ...BTN, fontSize: 18, padding: '12px 34px' }} onClick={advanceStage}>CONTINUAR</button>
                            <p style={{ color: '#8589ad', fontFamily: 'monospace', fontSize: 11, marginTop: 10 }}>ou pressione EspaÃ§o/Enter</p>
                        </div>
                    )}
                    {phase === 'gameover' && (
                        <div style={{ ...PANEL, ...COMPACT_PANEL, ...GAME_OVER_PANEL, maxWidth: 620 }}>
                            <div style={{ marginBottom: 6 }}><DeadChickenBadge /></div>
                            <div style={{ ...TITLE, color: '#ff4455', fontSize: 40, marginBottom: 4 }}>GAME OVER</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
                                <div style={{ ...STAT_CARD, ...COMPACT_STAT_CARD }}>
                                    <span style={STAT_LABEL}>FASE ALCANÃ‡ADA</span>
                                    <b style={{ color: stageCfg.accent }}>FASE {stageCfg.id}</b>
                                    <small>{stageCfg.name}</small>
                                </div>
                                <div style={{ ...STAT_CARD, ...COMPACT_STAT_CARD }}>
                                    <span style={STAT_LABEL}>MILHOS</span>
                                    <b style={{ color: '#ffe066' }}>{stateRef.current?.totalCorn || 0}</b>
                                    <small>coletados no total</small>
                                </div>
                            </div>
                            <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 22, margin: '2px 0 14px', background: '#101225', border: '2px solid #ffe066', borderRadius: 10, padding: '9px 18px' }}>
                                PontuaÃ§Ã£o Final: <b style={{ color: '#ffe066' }}>{finalScore}</b>
                            </div>
                            
                            {!rankingSaved ? (
                                <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ color: '#aeb2d8', fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }}>Digite seu nome para entrar no ranking local.</div>
                                    <input 
                                        type="text" 
                                        placeholder="Seu nome" 
                                        maxLength={12}
                                        value={playerName}
                                        onChange={e => setPlayerName(e.target.value)}
                                        onKeyDown={e => { if(e.key === 'Enter') handleSaveRanking(); }}
                                        autoFocus
                                        style={{ padding: '8px 14px', fontSize: 17, fontFamily: 'monospace', borderRadius: 8, border: '2px solid #555', background: '#111', color: '#fff', textAlign: 'center', width: 220, marginBottom: 10, outline: 'none' }}
                                    />
                                    <button style={{...BTN, fontSize: 15, padding: '10px 22px'}} onClick={handleSaveRanking}>Salvar no ranking</button>
                                </div>
                            ) : (
                                <div style={{ marginBottom: 14, width: '100%', maxWidth: 430 }}>
                                    <h4 style={{ color: '#7ee8a2', fontFamily: 'monospace', marginBottom: 8, fontSize: 18 }}>PONTUAÃ‡ÃƒO SALVA!</h4>
                                    <div style={FINAL_RANKING_BOX}>
                                        {renderRankingRows(5, true)}
                                    </div>
                                </div>
                            )}

                            {rankingSaved && <button style={{ ...BTN, fontSize: 18, padding: '12px 34px' }} onClick={resetGame}>Jogar novamente</button>}
                            {rankingSaved && <p style={{ color: '#8589ad', fontFamily: 'monospace', fontSize: 11, marginTop: 10 }}>ou pressione EspaÃ§o/Enter</p>}
                        </div>
                    )}
                    {phase === 'victory' && (
                        <div style={{ ...PANEL, ...COMPACT_PANEL, maxWidth: 640 }}>
                            <div style={{ ...TITLE, color: '#f5be00', fontSize: 36, marginBottom: 6 }}>FESTIVAL DO MILHO!</div>
                            <div style={{ color: '#eef0ff', fontFamily: 'monospace', fontSize: 14, marginBottom: 12, textAlign: 'center' }}>
                                VitÃ³ria! VocÃª concluiu todas as fases.
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
                                <div style={{ ...STAT_CARD, ...COMPACT_STAT_CARD }}>
                                    <span style={STAT_LABEL}>ÃšLTIMA FASE</span>
                                    <b style={{ color: stageCfg.accent }}>{stageCfg.name}</b>
                                    <small>festival alcanÃ§ado</small>
                                </div>
                                <div style={{ ...STAT_CARD, ...COMPACT_STAT_CARD }}>
                                    <span style={STAT_LABEL}>MILHOS</span>
                                    <b style={{ color: '#ffe066' }}>{stateRef.current?.totalCorn || totalCorn}</b>
                                    <small>coletados no total</small>
                                </div>
                            </div>
                            <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 22, margin: '2px 0 14px', background: '#101225', border: '2px solid #ffe066', borderRadius: 10, padding: '9px 18px' }}>
                                PontuaÃ§Ã£o Final: <b style={{ color: '#ffe066' }}>{finalScore}</b>
                            </div>

                            {!rankingSaved ? (
                                <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ color: '#aeb2d8', fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }}>Digite seu nome para entrar no ranking local.</div>
                                    <input 
                                        type="text" 
                                        placeholder="Seu nome" 
                                        maxLength={12}
                                        value={playerName}
                                        onChange={e => setPlayerName(e.target.value)}
                                        onKeyDown={e => { if(e.key === 'Enter') handleSaveRanking(); }}
                                        autoFocus
                                        style={{ padding: '8px 14px', fontSize: 17, fontFamily: 'monospace', borderRadius: 8, border: '2px solid #555', background: '#111', color: '#fff', textAlign: 'center', width: 220, marginBottom: 10, outline: 'none' }}
                                    />
                                    <button style={{...BTN, fontSize: 15, padding: '10px 22px'}} onClick={handleSaveRanking}>Salvar no ranking</button>
                                </div>
                            ) : (
                                <div style={{ marginBottom: 14, width: '100%', maxWidth: 430 }}>
                                    <h4 style={{ color: '#7ee8a2', fontFamily: 'monospace', marginBottom: 8, fontSize: 18 }}>PONTUAÃ‡ÃƒO SALVA!</h4>
                                    <div style={FINAL_RANKING_BOX}>
                                        {renderRankingRows(5, true)}
                                    </div>
                                </div>
                            )}

                            {rankingSaved && <button style={{ ...BTN, fontSize: 18, padding: '12px 34px' }} onClick={resetGame}>Jogar novamente</button>}
                            {rankingSaved && <p style={{ color: '#8589ad', fontFamily: 'monospace', fontSize: 11, marginTop: 10 }}>ou pressione EspaÃ§o/Enter</p>}
                        </div>
                    )}
                </div>
            )}

            {phase === 'playing' && dims.w <= 768 && (
                <DPad stateRef={stateRef} ensureLanes={ensureLanes} stageCfg={stageCfg} cols={dims.cols} />
            )}
        </div>
    );
}

function DPad({ stateRef, ensureLanes, stageCfg, cols }) {
    const tap = dir => {
        const s = stateRef.current;
        if (s.frozen || s.player.hopT < 1) return;
        const p = s.player;
        let nc = p.col, nr = p.row;
        if (dir === 'u') nr = p.row + 1;
        if (dir === 'd') nr = Math.max(0, p.row - 1);
        if (dir === 'l') nc = Math.max(0, p.col - 1);
        if (dir === 'r') nc = Math.min(cols - 1, p.col + 1);
        if (nc === p.col && nr === p.row) return;
        ensureLanes(s, stageCfg);
        p.targetCol = nc; p.targetRow = nr; p.hopT = 0;
    };
    const BS = {
        width: 60, height: 60, borderRadius: 12,
        border: '3px solid #3a3a5a', background: 'rgba(30,30,60,0.85)',
        color: '#fff', fontSize: 24, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 0 #000a', fontFamily: 'monospace', touchAction: 'none',
    };
    return (
        <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: 8 }}>
            <span /><button style={BS} onPointerDown={e => { e.preventDefault(); tap('u') }}>UP</button><span />
            <button style={BS} onPointerDown={e => { e.preventDefault(); tap('l') }}>LEFT</button>
            <button style={BS} onPointerDown={e => { e.preventDefault(); tap('d') }}>DOWN</button>
            <button style={BS} onPointerDown={e => { e.preventDefault(); tap('r') }}>RIGHT</button>
        </div>
    );
}

const OVL = {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(circle at 50% 35%, rgba(22,28,52,0.9), rgba(0,0,0,0.86) 62%, rgba(0,0,0,0.94))', zIndex: 10,
    padding: 16,
    boxSizing: 'border-box',
};
const GAME_OVER_OVL = {
    background: 'radial-gradient(circle at 50% 34%, rgba(110,20,26,0.42), rgba(18,6,8,0.86) 62%, rgba(6,0,0,0.94))',
};
const PANEL = {
    background: '#0f1923',
    border: '4px solid #eef0ff',
    boxShadow: '0 16px 0 #05070f, 0 26px 60px rgba(0,0,0,0.9)',
    borderRadius: 20, padding: '44px 56px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    maxWidth: '92%', textAlign: 'center',
    maxHeight: 'calc(100dvh - 32px)',
    overflowY: 'auto',
    boxSizing: 'border-box',
};
const COMPACT_PANEL = {
    padding: '26px 34px',
};
const GAME_OVER_PANEL = {
    animation: 'panelDrop 300ms ease-out',
};
const TITLE = {
    fontFamily: 'monospace', fontWeight: 900, fontSize: 48, color: '#fff',
    textShadow: '4px 4px 0 #000', letterSpacing: 4, marginBottom: 12,
};
const BTN = {
    background: '#ffe066', color: '#111', fontWeight: 900,
    fontFamily: 'monospace', fontSize: 22, border: '3px solid #000',
    borderRadius: 12, padding: '16px 44px', cursor: 'pointer',
    boxShadow: '0 6px 0 #000', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.1s',
};
const STAT_CARD = {
    background: '#101225',
    border: '2px solid #33364f',
    borderRadius: 10,
    padding: '12px 16px',
    minWidth: 190,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    color: '#eef0ff',
    fontFamily: 'monospace',
    boxShadow: '0 5px 0 #05070f',
};
const COMPACT_STAT_CARD = {
    padding: '9px 12px',
    minWidth: 170,
    gap: 2,
};
const STAT_LABEL = {
    color: '#8589ad',
    fontSize: 11,
    fontWeight: 900,
};
const FINAL_RANKING_BOX = {
    background: '#0b0d18',
    border: '2px solid #33364f',
    borderRadius: 10,
    padding: 8,
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: 220,
    overflowY: 'auto',
};


