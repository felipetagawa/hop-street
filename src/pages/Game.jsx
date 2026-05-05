import { useEffect, useRef, useState, useCallback } from 'react';

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TILE = 80;
const LANE_H = 56;
const SLAB_D = 14;
const SLAB_STEP = LANE_H + SLAB_D;

const CAR_W = TILE * 1.65;
const CAR_H = LANE_H * 0.72;
const CAR_MIN = 1.0;
const CAR_MAX = 3.0;

const PLAYER_Y_RATIO = 0.62;

// â”€â”€â”€ Stage Definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STAGES = [
    {
        id: 1,
        name: 'BAIRRO TRANQUILO',
        goalRow: 22,
        cornTarget: 3,
        carMin: 0.65, carMax: 1.95,
        roadRatio: 0.4,
        maxCarsPerLane: 2,
        maxRoadRun: 3,
        theme: 'suburb',
        skyTop: '#5ec8e8', skyBot: '#a8e4f8',
        accent: '#7ee8a2',
    },
    {
        id: 2,
        name: 'AVENIDA MOVIMENTADA',
        goalRow: 30,
        cornTarget: 5,
        carMin: 1.05, carMax: 3.15,
        roadRatio: 0.6,
        maxCarsPerLane: 3,
        maxRoadRun: 4,
        theme: 'avenue',
        skyTop: '#3a8fcc', skyBot: '#7cc8f8',
        accent: '#f5be00',
    },
    {
        id: 3,
        name: 'HORA DO RUSH',
        goalRow: 40,
        cornTarget: 7,
        carMin: 1.7, carMax: 3.95,
        roadRatio: 0.65,
        maxCarsPerLane: 4,
        maxRoadRun: 5,
        theme: 'rush',
        skyTop: '#e06030', skyBot: '#f0a060',
        accent: '#ff4444',
    },
];

// â”€â”€â”€ Visual Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

function drawPixelPanel(ctx, x, y, w, h, label, value, isRight = false) {
    const pad = 8;
    const border = 4;
    
    // Outer shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x + 4, y + 4, w, h);

    // Main box (Dark Slate)
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, w, h);
    
    // Double Border
    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth = border;
    ctx.strokeRect(x + border/2, y + border/2, w - border, h - border);
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

    // Label
    ctx.fillStyle = '#8a8ab0';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = isRight ? 'right' : 'left';
    ctx.fillText(label, isRight ? x + w - 12 : x + 12, y + 18);

    // Value
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = isRight ? 'right' : 'left';
    ctx.fillText(value, isRight ? x + w - 12 : x + 12, y + h - 14);

    // Corner highlights
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x + 4, y + 4, w - 8, 4);
    ctx.fillRect(x + 4, y + 4, 4, h - 8);
}

// â”€â”€â”€ Lane generation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function makeLane(idx, CANVAS_W, stageCfg = STAGES[0]) {
    if (idx < 3) return { type: 'grass', shade: idx % 2, trees: makeTrees(idx, 9), cornCol: null, cornTaken: false };
    if (idx % 6 === 0) return { type: 'grass', shade: idx % 2, trees: makeTrees(idx, Math.floor(CANVAS_W / TILE)), cornCol: null, cornTaken: false };
    const roll = Math.random();
    if (roll < (1 - stageCfg.roadRatio)) return { type: 'grass', shade: idx % 2, trees: makeTrees(idx, Math.floor(CANVAS_W / TILE)), cornCol: null, cornTaken: false };
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
        return { type: 'grass', shade: idx % 2, trees: makeTrees(idx, Math.floor(CANVAS_W / TILE)), cornCol: null, cornTaken: false };
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

// â”€â”€â”€ Draw: sky + ground background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function drawBg(ctx, CANVAS_W, CANVAS_H, stageCfg = STAGES[0]) {
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H * 0.55);
    sky.addColorStop(0, stageCfg.skyTop);
    sky.addColorStop(1, stageCfg.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'rgba(120,210,80,0.12)';
    ctx.fillRect(0, CANVAS_H * 0.5, CANVAS_W, CANVAS_H * 0.5);
}

// â”€â”€â”€ Draw: destination row marker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    const labels = ['FASE CONCLUIDA - CONTINUE', 'ULTIMA ETAPA A FRENTE', 'FESTIVAL DO MILHO'];
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

function makeCornParticles(seed, count = 10) {
    const rand = mulberry32(seed);
    const particles = [];
    for (let i = 0; i < count; i++) {
        const ang = rand() * Math.PI * 2;
        const speed = 38 + rand() * 70;
        particles.push({
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed * 0.65 - 18,
            size: 2 + ((rand() * 3) | 0),
            life: 0.22 + rand() * 0.2,
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
            ln.cornCol = preferred;
            ln.cornTaken = false;
            placed++;
            continue;
        }
        for (let c = 1; c < cols - 1; c++) {
            if (!blocked.has(c)) {
                ln.cornCol = c;
                ln.cornTaken = false;
                placed++;
                break;
            }
        }
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

function drawCorn(ctx, col, sy) {
    const x = col * TILE + TILE / 2 - 7;
    const y = sy + LANE_H * 0.44;
    drawGroundShadow(ctx, x + 8, y + 20, 7, 2, 0.16);
    ctx.fillStyle = '#f4c431';
    ctx.fillRect(x + 2, y, 10, 14);
    ctx.fillStyle = '#d29a17';
    ctx.fillRect(x + 12, y + 2, 3, 14);
    ctx.fillStyle = '#f9dd72';
    ctx.fillRect(x + 3, y + 2, 7, 3);
    ctx.fillStyle = '#4d8f2a';
    ctx.fillRect(x - 1, y + 10, 3, 6);
    ctx.fillRect(x + 12, y + 11, 3, 6);
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

// â”€â”€â”€ Draw: road lane slab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    
    const arc = bounce * 28;
    const squishX = 1 - bounce * 0.12;
    const squishY = 1 + bounce * 0.14;

    const cx = px + TILE / 2;
    const cy = py + LANE_H * 0.78 - arc - idle;

    ctx.save();
    ctx.translate(cx, cy);
    drawGroundShadow(ctx, 0, arc + idle + 10, 20 * squishX, 6, 0.28);
    ctx.scale(squishX, squishY);

    ctx.strokeStyle = '#f09020';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-7, 12); ctx.lineTo(-10, 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7, 12); ctx.lineTo(10, 24); ctx.stroke();

    const bw = 30, bh = 26;
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.fillStyle = shade('#f2f2f2', 15);
    ctx.fillRect(-bw / 2, -bh / 2, bw, 4);

    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(bw / 2, -bh / 2 + 3, 7, bh + 5);
    ctx.fillStyle = '#a8a8a8';
    ctx.fillRect(-bw / 2, bh / 2, bw, 5);

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(-7, -bh / 2 - 12, 14, 14);

    const hw = 22, hh = 20;
    const hbY = -bh / 2 - 12 - hh;
    ctx.fillStyle = '#fff';
    ctx.fillRect(-hw / 2, hbY, hw, hh);
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(hw / 2, hbY + 3, 6, hh + 4);
    ctx.fillStyle = '#b0b0b0';
    ctx.fillRect(-hw / 2, hbY + hh, hw, 4);

    ctx.fillStyle = '#dd3333';
    ctx.fillRect(-6, hbY - 12, 7, 10);
    ctx.fillRect(-2, hbY - 17, 6, 7);

    ctx.fillStyle = '#f09020';
    ctx.fillRect(hw / 2 - 1, hbY + hh / 2 - 3, 11, 7);

    ctx.fillStyle = '#111';
    ctx.fillRect(hw / 2 - 10, hbY + 5, 6, 6);
    ctx.restore();
}

function drawHUD(ctx, score, hiScore, CANVAS_W, scorePop = 0, stageName = '', stageCorn = 0, stageCornTarget = 0) {
    const scoreY = 24 - Math.round(scorePop * 4);
    drawPixelPanel(ctx, 24, scoreY, 120, 70, 'SCORE', score);
    drawPixelPanel(ctx, CANVAS_W - 184, 24, 160, 70, 'BEST', hiScore, true);
    
    const cx = CANVAS_W - 165;
    const cy = 40;
    ctx.fillStyle = '#f5be00';
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    if (scorePop > 0) {
        ctx.fillStyle = `rgba(255,230,140,${0.35 * scorePop})`;
        ctx.fillRect(24, scoreY + 6, 112, 58);
    }
    // Stage label in center
    if (stageName) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(CANVAS_W / 2 - 120, 24, 240, 30);
        ctx.strokeStyle = '#4a4a6a';
        ctx.lineWidth = 2;
        ctx.strokeRect(CANVAS_W / 2 - 120, 24, 240, 30);
        ctx.fillStyle = '#d0d0ff';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(stageName, CANVAS_W / 2, 44);
        ctx.textAlign = 'left';
    }
    if (stageCornTarget > 0) {
        const cw = 122;
        const ch = 24;
        const cx = CANVAS_W / 2 - cw / 2;
        const cy = 58;
        ctx.fillStyle = 'rgba(0,0,0,0.42)';
        ctx.fillRect(cx, cy, cw, ch);
        ctx.strokeStyle = '#4a4a6a';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx, cy, cw, ch);
        ctx.fillStyle = '#f0bf34';
        ctx.fillRect(cx + 8, cy + 7, 10, 10);
        ctx.fillStyle = '#d59a1e';
        ctx.fillRect(cx + 18, cy + 9, 3, 10);
        ctx.fillStyle = '#6e9d35';
        ctx.fillRect(cx + 6, cy + 14, 2, 5);
        ctx.fillStyle = '#d0d0ff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`MILHO ${stageCorn}/${stageCornTarget}`, cx + 24, cy + 16);
    }
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

function laneY(row, camRow, CANVAS_H) {
    return Math.round(CANVAS_H * PLAYER_Y_RATIO - (row - camRow + 1) * SLAB_STEP + SLAB_STEP * 0.5);
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Game() {
    const canvasRef = useRef(null);
    const stateRef = useRef(null);
    const hiRef = useRef(0);
    const rafRef = useRef(null);

    const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight, cols: 9 });
    const [phase, setPhase] = useState('start');       // start | playing | stageclear | gameover | victory
    const [stageIdx, setStageIdx] = useState(0);       // 0-2 index into STAGES
    const [score, setScore] = useState(0);
    const [hiScore, setHiScore] = useState(0);
    const [stageCorn, setStageCorn] = useState(0);
    const [totalCorn, setTotalCorn] = useState(0);

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

    const makeInitialState = useCallback((sIdx, w, cols, carryTotalCorn = 0) => {
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
                inputBuffer: null,
            },
            score: 0,
            stageCorn: 0,
            totalCorn: carryTotalCorn,
            maxRow: 1,
            frozen: false,
            cameraRow: 1,
            fx: { scorePopUntil: 0, hit: null, cornPopUntil: 0, cornBurst: null },
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

    const resetGame = useCallback(() => {
        stateRef.current = makeInitialState(0, dims.w, dims.cols, 0);
        setScore(0);
        setStageIdx(0);
        setStageCorn(0);
        setTotalCorn(0);
        setPhase('playing');
    }, [dims.w, dims.cols, makeInitialState]);

    const advanceStage = useCallback(() => {
        const nextIdx = stageIdx + 1;
        const s = stateRef.current;
        stateRef.current = makeInitialState(nextIdx, dims.w, dims.cols, s.totalCorn);
        setScore(0);
        setStageCorn(0);
        setTotalCorn(stateRef.current.totalCorn);
        setStageIdx(nextIdx);
        setPhase('playing');
    }, [stageIdx, dims.w, dims.cols, makeInitialState]);

    const triggerMove = useCallback((key, cfg) => {
        const s = stateRef.current;
        if (s.frozen || s.player.hopT < 1) return;
        const p = s.player;
        const k = key.toLowerCase();
        let nc = p.col, nr = p.row;
        if (k === 'arrowup' || k === 'w') nr = p.row + 1;
        if (k === 'arrowdown' || k === 's') nr = Math.max(0, p.row - 1);
        if (k === 'arrowleft' || k === 'a') nc = Math.max(0, p.col - 1);
        if (k === 'arrowright' || k === 'd') nc = Math.min(dims.cols - 1, p.col + 1);
        if (nc === p.col && nr === p.row) return;
        ensureLanes(s, cfg);
        p.targetCol = nc; p.targetRow = nr; p.hopT = 0;
        p.inputBuffer = null;
    }, [dims.cols, ensureLanes]);

    const loop = useCallback((time) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = stateRef.current;
        const { w, h } = dims;
        const cfg = STAGES[stageIdx];

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
            p.hopT = Math.min(1, p.hopT + 0.12);
            if (p.hopT >= 1) {
                p.col = p.targetCol;
                p.row = p.targetRow;
                p.hopT = 1;
                if (p.row > s.maxRow) {
                    s.maxRow = p.row;
                    const prevScore = s.score;
                    s.score = p.row - 1;
                    if (s.score > prevScore) s.fx.scorePopUntil = time + 260;
                    setScore(s.score);
                    if (s.score > hiRef.current) { hiRef.current = s.score; setHiScore(s.score); }
                }
                const landedLane = s.lanes[p.row];
                if (landedLane && landedLane.type === 'grass' && landedLane.cornCol === p.col && !landedLane.cornTaken) {
                    landedLane.cornTaken = true;
                    s.stageCorn += 1;
                    s.totalCorn += 1;
                    s.fx.cornPopUntil = time + 260;
                    const collectY = laneY(p.row, s.cameraRow, h) + LANE_H * 0.54;
                    const collectX = p.col * TILE + TILE / 2;
                    const cseed = (((p.row + 3) * 15331) ^ ((p.col + 11) * 9176) ^ ((time | 0) * 37)) >>> 0;
                    s.fx.cornBurst = { t0: time, x: collectX, y: collectY, particles: makeCornParticles(cseed) };
                    setStageCorn(s.stageCorn);
                    setTotalCorn(s.totalCorn);
                }
                // Goal reached?
                if (p.row >= cfg.goalRow && !s.frozen) {
                    s.frozen = true;
                    if (stageIdx >= STAGES.length - 1) {
                        setPhase('victory');
                    } else {
                        setPhase('stageclear');
                    }
                }
            }
        } else if (p.inputBuffer && !s.frozen) {
            triggerMove(p.inputBuffer, cfg);
        }

        // 3. Continuous Collision Detection (Every Frame)
        if (!s.frozen && phase === 'playing') {
            if (!collides(s, w)) {
                const impactCol = p.col + (p.targetCol - p.col) * p.hopT;
                const impactRow = p.row + (p.targetRow - p.row) * p.hopT;
                const impactY = laneY(impactRow, s.cameraRow, h) + LANE_H * 0.74;
                const impactX = impactCol * TILE + TILE / 2;
                const seed = (((p.row + 1) * 92821) ^ ((p.col + 7) * 68917) ^ ((time | 0) * 131)) >>> 0;
                s.fx.hit = { t0: time, x: impactX, y: impactY, particles: makeImpactParticles(seed) };
                s.frozen = true;
                setPhase('gameover');
            }
        }

        const tgt = p.hopT < 1 ? p.row + (p.targetRow - p.row) * p.hopT : p.row;
        s.cameraRow += (tgt - s.cameraRow) * 0.13;

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
                if (ln.cornCol !== null && !ln.cornTaken) drawCorn(ctx, ln.cornCol, sy);
            } else {
                drawRoadLane(ctx, sy, ln.shade, w, r);
                ln.cars.forEach(c => drawCar(ctx, c.x, sy, ln.dir, c.color, c.variant));
            }
        }

        const ac = p.col + (p.targetCol - p.col) * p.hopT;
        const ar = p.row + (p.targetRow - p.row) * p.hopT;
        const csy = laneY(ar, s.cameraRow, h);
        drawChicken(ctx, ac * TILE, csy, p.hopT < 1 ? p.hopT : 1, time);

        const scorePop = s.fx.scorePopUntil > time ? (s.fx.scorePopUntil - time) / 260 : 0;
        drawHUD(ctx, s.score, hiRef.current, w, scorePop, `FASE ${cfg.id} - ${cfg.name}`, s.stageCorn, cfg.cornTarget);
        if (s.fx.cornBurst && drawCornFX(ctx, s.fx.cornBurst, time)) s.fx.cornBurst = null;
        if (s.fx.hit && drawImpactFX(ctx, s.fx.hit, time)) s.fx.hit = null;

        rafRef.current = requestAnimationFrame(loop);
    }, [dims, phase, stageIdx, triggerMove]);

    function collides(s, w) {
        const p = s.player;
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
        const onKey = e => {
            const s = stateRef.current;
            const key = e.key.toLowerCase();
            const isGameKey = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(key);
            if (phase === 'start') { if (isGameKey) setPhase('playing'); return; }
            if (phase === 'gameover') { if (key === ' ' || key === 'enter') resetGame(); return; }
            if (phase === 'stageclear') { if (key === ' ' || key === 'enter') advanceStage(); return; }
            if (phase === 'victory') { if (key === ' ' || key === 'enter') resetGame(); return; }
            if (s.frozen) return;
            if (isGameKey) {
                e.preventDefault();
                if (s.player.hopT < 1) { s.player.inputBuffer = key; }
                else { triggerMove(key, STAGES[stageIdx]); }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [phase, resetGame, advanceStage, triggerMove, stageIdx]);

    useEffect(() => {
        rafRef.current = requestAnimationFrame(loop);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [phase, loop]);

    const nextStage = STAGES[stageIdx + 1];

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100dvh', background: '#0d1117', userSelect: 'none', overflow: 'hidden' }}>
            <canvas ref={canvasRef} width={dims.w} height={dims.h} style={{ display: 'block' }} />

            {phase !== 'playing' && (
                <div style={OVL}>
                    {phase === 'start' && (
                        <div style={PANEL}>
                            <div style={TITLE}>HOP STREET</div>
                            <p style={{ color: '#8a8ab0', fontFamily: 'monospace', fontSize: 13, marginBottom: 6, textAlign: 'center' }}>
                                Ajude a galinha a chegar ao <b style={{ color: '#ffe066' }}>Festival do Milho</b>
                            </p>
                            <p style={{ color: '#6a6a8a', fontFamily: 'monospace', fontSize: 12, marginBottom: 10 }}>
                                Colete milhos nas areas seguras pelo caminho
                            </p>
                            <div style={{ display: 'flex', gap: 10, marginBottom: 24, marginTop: 8 }}>
                                {STAGES.map((s, i) => (
                                    <div key={i} style={{ background: '#1a1a3a', border: '2px solid #4a4a6a', borderRadius: 8, padding: '6px 12px', fontFamily: 'monospace', fontSize: 11, color: '#aaa', textAlign: 'center' }}>
                                        <div style={{ color: s.accent, fontWeight: 900 }}>FASE {s.id}</div>
                                        <div>{s.name}</div>
                                    </div>
                                ))}
                            </div>
                            <p style={{ color: '#6a6a8a', fontFamily: 'monospace', fontSize: 12, marginBottom: 24 }}>
                                Setas ou WASD para mover
                            </p>
                            <button style={BTN} onClick={() => setPhase('playing')}>JOGAR</button>
                        </div>
                    )}
                    {phase === 'stageclear' && (
                        <div style={PANEL}>
                            <div style={{ ...TITLE, color: '#7ee8a2', fontSize: 36 }}>FASE {stageCfg.id} CONCLUIDA!</div>
                            <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 18, margin: '10px 0 6px' }}>{stageCfg.name}</div>
                            {nextStage && (
                                <div style={{ color: '#8a8ab0', fontFamily: 'monospace', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
                                    Proxima: <b style={{ color: nextStage.accent }}>{nextStage.name}</b>
                                </div>
                            )}
                            <div style={{ color: '#ffe066', fontFamily: 'monospace', fontSize: 14, marginBottom: 16 }}>
                                Milho na fase: <b>{stageCorn}/{stageCfg.cornTarget}</b>
                            </div>
                            <button style={BTN} onClick={advanceStage}>CONTINUAR</button>
                            <p style={{ color: '#5a5a7a', fontFamily: 'monospace', fontSize: 11, marginTop: 14 }}>ou pressione Espaco</p>
                        </div>
                    )}
                    {phase === 'gameover' && (
                        <div style={PANEL}>
                            <div style={{ ...TITLE, color: '#ff4455' }}>GAME OVER</div>
                            <div style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 14, marginBottom: 4 }}>
                                FASE <b style={{ color: stageCfg.accent }}>{stageCfg.id}</b> - {stageCfg.name}
                            </div>
                            <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 28, margin: '10px 0 24px' }}>
                                Score: <b style={{ color: '#ffe066' }}>{score}</b>
                            </div>
                            <button style={BTN} onClick={resetGame}>RECOMECAR</button>
                        </div>
                    )}
                    {phase === 'victory' && (
                        <div style={PANEL}>
                            <div style={{ ...TITLE, color: '#f5be00', fontSize: 36 }}>VOCE CHEGOU AO FESTIVAL DO MILHO!</div>
                            <div style={{ color: '#ffe066', fontFamily: 'monospace', fontSize: 18, marginBottom: 8 }}>HOP STREET</div>
                            <div style={{ color: '#8a8ab0', fontFamily: 'monospace', fontSize: 14, marginBottom: 6, textAlign: 'center' }}>
                                Todas as fases concluidas
                            </div>
                            <div style={{ color: '#ffe066', fontFamily: 'monospace', fontSize: 14, marginBottom: 6 }}>
                                Total de milho: <b>{totalCorn}</b>
                            </div>
                            <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 28, margin: '10px 0 24px' }}>
                                Score Final: <b style={{ color: '#ffe066' }}>{hiScore}</b>
                            </div>
                            <button style={BTN} onClick={resetGame}>JOGAR NOVAMENTE</button>
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
    background: 'rgba(0,0,0,0.78)', zIndex: 10,
};
const PANEL = {
    background: '#0f1923',
    border: '4px solid #fff',
    boxShadow: '0 16px 50px rgba(0,0,0,0.9)',
    borderRadius: 20, padding: '44px 56px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    maxWidth: '92%', textAlign: 'center',
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
