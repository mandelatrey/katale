import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { nodes, edges } from '../data/architectureData';

// ── Constants ──────────────────────────────────────────────────────────────────
const TILE = 52;

const C = {
  bg:      '#e5e0c8',
  panelBg: '#d8d4bc',
  border:  '#2a2418',
  stroke:  '#2a2418',
  label:   '#1a1408',
  hatch:   '#6a6448',
  selBg:   '#2a2418',
  selText: '#e5e0c8',
};

const CAT_PAL = {
  'frontend-core':  { top: '#b8b898', right: '#989878', front: '#787860' },
  'frontend-views': { top: '#c0bca0', right: '#a09c80', front: '#807c60' },
  'map':            { top: '#b4baa8', right: '#949a88', front: '#747a68' },
  'api-client':     { top: '#b8c0a8', right: '#98a088', front: '#788068' },
  'backend-routes': { top: '#b0b8b0', right: '#909890', front: '#707870' },
  'services':       { top: '#a8b0b8', right: '#889098', front: '#687078' },
  'models':         { top: '#a0a8b8', right: '#8088a0', front: '#606880' },
  'whatsapp':       { top: '#a8c0a8', right: '#88a088', front: '#688068' },
  'ai-layer':       { top: '#c0b8a0', right: '#a09880', front: '#807860' },
  'infrastructure': { top: '#b8a8a0', right: '#988880', front: '#786860' },
};

const CATS = [
  { key: 'frontend-core',   label: 'FRONTEND CORE' },
  { key: 'frontend-views',  label: 'VIEWS' },
  { key: 'map',             label: 'MAP' },
  { key: 'api-client',      label: 'API CLIENT' },
  { key: 'backend-routes',  label: 'ROUTES' },
  { key: 'services',        label: 'SERVICES' },
  { key: 'models',          label: 'MODELS' },
  { key: 'whatsapp',        label: 'WHATSAPP BOT' },
  { key: 'ai-layer',        label: 'AI LAYER' },
  { key: 'infrastructure',  label: 'INFRASTRUCTURE' },
];

// Views: iso rotations (SE default, 90° steps) plus an orthographic TOP.
const VIEWS = [
  { key: 'se',  label: 'SE',  rotation: 0, mode: 'iso' },
  { key: 'ne',  label: 'NE',  rotation: 1, mode: 'iso' },
  { key: 'nw',  label: 'NW',  rotation: 2, mode: 'iso' },
  { key: 'sw',  label: 'SW',  rotation: 3, mode: 'iso' },
  { key: 'top', label: 'TOP', rotation: 0, mode: 'top' },
];

// ── Isometric math ─────────────────────────────────────────────────────────────
// mode: 'iso' = standard isometric, 'top' = orthographic top-down (no depth).
function proj(gx, gy, gz, mode) {
  if (mode === 'top') return { sx: gx * TILE, sy: gy * TILE };
  return {
    sx: (gx - gy) * TILE,
    sy: (gx + gy) * TILE * 0.5 - gz * TILE * 0.75,
  };
}

function pts(arr) {
  return arr.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(' ');
}

function faces(gx, gy, h, mode) {
  if (mode === 'top') {
    const t = [
      proj(gx,   gy,   0, mode), proj(gx+1, gy,   0, mode),
      proj(gx+1, gy+1, 0, mode), proj(gx,   gy+1, 0, mode),
    ];
    return { top: t, right: null, front: null };
  }
  return {
    top:   [proj(gx, gy, h, mode),   proj(gx+1, gy, h, mode),   proj(gx+1, gy+1, h, mode), proj(gx, gy+1, h, mode)],
    right: [proj(gx+1, gy, 0, mode), proj(gx+1, gy+1, 0, mode), proj(gx+1, gy+1, h, mode), proj(gx+1, gy, h, mode)],
    front: [proj(gx, gy+1, 0, mode), proj(gx+1, gy+1, 0, mode), proj(gx+1, gy+1, h, mode), proj(gx, gy+1, h, mode)],
  };
}

function topCtr(gx, gy, h, mode) {
  if (mode === 'top') return proj(gx + 0.5, gy + 0.5, 0, mode);
  return proj(gx + 0.5, gy + 0.5, h + 0.06, mode);
}

// ── Edge routing ───────────────────────────────────────────────────────────────
// Segment vs axis-aligned rectangle intersection (Liang–Barsky slab clip).
function segRectIntersect(p1x, p1y, p2x, p2y, x1, y1, x2, y2) {
  const dx = p2x - p1x, dy = p2y - p1y;
  let tmin = 0, tmax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (p1x < x1 || p1x > x2) return false;
  } else {
    const ta = (x1 - p1x) / dx, tb = (x2 - p1x) / dx;
    tmin = Math.max(tmin, Math.min(ta, tb));
    tmax = Math.min(tmax, Math.max(ta, tb));
    if (tmin > tmax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (p1y < y1 || p1y > y2) return false;
  } else {
    const ta = (y1 - p1y) / dy, tb = (y2 - p1y) / dy;
    tmin = Math.max(tmin, Math.min(ta, tb));
    tmax = Math.min(tmax, Math.max(ta, tb));
    if (tmin > tmax) return false;
  }
  return tmax > 0 && tmin < 1;
}

// A* on a coarse grid. Runs as a fallback when the cheap L/Z heuristics fail.
// Returns a list of grid-aligned world coords from (startX,startY) to
// (endX,endY) that avoids the obstacle rectangles, or null if unreachable.
function astar(startX, startY, endX, endY, obstacles) {
  const gridSize = 0.4;
  const margin = 1.5;
  let minX = Math.min(startX, endX);
  let maxX = Math.max(startX, endX);
  let minY = Math.min(startY, endY);
  let maxY = Math.max(startY, endY);
  for (const o of obstacles) {
    if (o.x1 < minX) minX = o.x1;
    if (o.x2 > maxX) maxX = o.x2;
    if (o.y1 < minY) minY = o.y1;
    if (o.y2 > maxY) maxY = o.y2;
  }
  minX -= margin; maxX += margin; minY -= margin; maxY += margin;

  const cols = Math.ceil((maxX - minX) / gridSize);
  const rows = Math.ceil((maxY - minY) / gridSize);
  if (cols < 2 || rows < 2 || cols * rows > 30000) return null;
  const N = cols * rows;

  const worldX = (cx) => minX + (cx + 0.5) * gridSize;
  const worldY = (cy) => minY + (cy + 0.5) * gridSize;

  const blocked = new Uint8Array(N);
  for (const o of obstacles) {
    const c1 = Math.max(0, Math.floor((o.x1 - minX) / gridSize));
    const c2 = Math.min(cols - 1, Math.ceil((o.x2 - minX) / gridSize) - 1);
    const r1 = Math.max(0, Math.floor((o.y1 - minY) / gridSize));
    const r2 = Math.min(rows - 1, Math.ceil((o.y2 - minY) / gridSize) - 1);
    for (let cy = r1; cy <= r2; cy++) {
      const base = cy * cols;
      for (let cx = c1; cx <= c2; cx++) blocked[base + cx] = 1;
    }
  }

  const sx = Math.max(0, Math.min(cols - 1, Math.floor((startX - minX) / gridSize)));
  const sy = Math.max(0, Math.min(rows - 1, Math.floor((startY - minY) / gridSize)));
  const ex = Math.max(0, Math.min(cols - 1, Math.floor((endX - minX) / gridSize)));
  const ey = Math.max(0, Math.min(rows - 1, Math.floor((endY - minY) / gridSize)));
  const startIdx = sy * cols + sx;
  const endIdx   = ey * cols + ex;
  blocked[startIdx] = 0;
  blocked[endIdx]   = 0;

  const g = new Float32Array(N); g.fill(Infinity);
  const f = new Float32Array(N); f.fill(Infinity);
  const parent = new Int32Array(N); parent.fill(-1);
  const inOpen   = new Uint8Array(N);
  const inClosed = new Uint8Array(N);
  const open = [startIdx];

  g[startIdx] = 0;
  f[startIdx] = Math.abs(sx - ex) + Math.abs(sy - ey);
  inOpen[startIdx] = 1;

  const maxIter = N * 2;
  let iter = 0;
  while (open.length > 0 && iter++ < maxIter) {
    let bestI = 0, bestF = f[open[0]];
    for (let i = 1; i < open.length; i++) {
      const fi = f[open[i]];
      if (fi < bestF) { bestF = fi; bestI = i; }
    }
    const cur = open[bestI];
    open[bestI] = open[open.length - 1];
    open.pop();
    inOpen[cur] = 0;

    if (cur === endIdx) {
      const path = [];
      let idx = cur;
      while (idx !== -1) {
        const cx = idx % cols;
        const cy = (idx - cx) / cols;
        path.unshift({ x: worldX(cx), y: worldY(cy) });
        idx = parent[idx];
      }
      return path;
    }

    inClosed[cur] = 1;
    const cx = cur % cols;
    const cy = (cur - cx) / cols;
    const relax = (n, ncx, ncy) => {
      if (inClosed[n] || blocked[n]) return;
      const t = g[cur] + 1;
      if (t < g[n]) {
        parent[n] = cur;
        g[n] = t;
        f[n] = t + Math.abs(ncx - ex) + Math.abs(ncy - ey);
        if (!inOpen[n]) { open.push(n); inOpen[n] = 1; }
      }
    };
    if (cx > 0)        relax(cur - 1,    cx - 1, cy);
    if (cx < cols - 1) relax(cur + 1,    cx + 1, cy);
    if (cy > 0)        relax(cur - cols, cx, cy - 1);
    if (cy < rows - 1) relax(cur + cols, cx, cy + 1);
  }
  return null;
}

// Line-of-sight smoothing: greedily skip intermediate waypoints while the
// straight line to the furthest visible point stays clear. Turns A*'s jagged
// grid path into a small number of long segments.
function smoothPath(pts, obstacles) {
  if (pts.length <= 2) return pts;
  const clear = (a, b) => !obstacles.some(o =>
    segRectIntersect(a.x, a.y, b.x, b.y, o.x1, o.y1, o.x2, o.y2));
  const out = [pts[0]];
  let cur = 0;
  while (cur < pts.length - 1) {
    let next = cur + 1;
    for (let i = pts.length - 1; i > cur + 1; i--) {
      if (clear(pts[cur], pts[i])) { next = i; break; }
    }
    out.push(pts[next]);
    cur = next;
  }
  return out;
}

// Given source/dest centres and a set of obstacle rectangles, return an
// ordered list of waypoints that avoids the obstacles. Cascade:
//   direct → L-elbow (2 variants) → Z-shape with varying midpoints →
//   A* fallback + line-of-sight smoothing.
function routePath(sdx, sdy, ddx, ddy, obstacles) {
  const start = { x: sdx + 0.5, y: sdy + 0.5 };
  const end   = { x: ddx + 0.5, y: ddy + 0.5 };
  const clear = (a, b) => !obstacles.some(o =>
    segRectIntersect(a.x, a.y, b.x, b.y, o.x1, o.y1, o.x2, o.y2));

  if (clear(start, end)) return [start, end];

  const e1 = { x: start.x, y: end.y };
  if (clear(start, e1) && clear(e1, end)) return [start, e1, end];

  const e2 = { x: end.x, y: start.y };
  if (clear(start, e2) && clear(e2, end)) return [start, e2, end];

  // Z-shape (V-H-V): pick a mid-x, run start→(mx,sy)→(mx,ey)→end.
  const midX = (start.x + end.x) / 2;
  for (const off of [0, 0.6, -0.6, 1.2, -1.2, 2, -2, 3, -3, 4.5, -4.5]) {
    const mx = midX + off;
    const m1 = { x: mx, y: start.y }, m2 = { x: mx, y: end.y };
    if (clear(start, m1) && clear(m1, m2) && clear(m2, end)) return [start, m1, m2, end];
  }

  // Z-shape (H-V-H): pick a mid-y, run start→(sx,my)→(ex,my)→end.
  const midY = (start.y + end.y) / 2;
  for (const off of [0, 0.6, -0.6, 1.2, -1.2, 2, -2, 3, -3, 4.5, -4.5]) {
    const my = midY + off;
    const m1 = { x: start.x, y: my }, m2 = { x: end.x, y: my };
    if (clear(start, m1) && clear(m1, m2) && clear(m2, end)) return [start, m1, m2, end];
  }

  // Full A* fallback.
  const raw = astar(start.x, start.y, end.x, end.y, obstacles);
  if (raw && raw.length >= 2) {
    raw[0] = { x: start.x, y: start.y };
    raw[raw.length - 1] = { x: end.x, y: end.y };
    return smoothPath(raw, obstacles);
  }

  return [start, end];
}

function splitLabel(label) {
  if (label.length <= 11) return [label];
  const sp = label.indexOf(' ');
  if (sp > 0 && sp < label.length - 2) return [label.slice(0, sp), label.slice(sp + 1)];
  for (let i = 2; i < label.length; i++) {
    if (label[i] >= 'A' && label[i] <= 'Z') return [label.slice(0, i), label.slice(i)];
  }
  return [label.slice(0, 11), label.slice(11)];
}

// ── Camera rotation ────────────────────────────────────────────────────────────
// rotation 0=SE (default), 1=NE, 2=NW, 3=SW
// Transforms a world grid point to display coordinates for the chosen angle.
function toDisplay(gx, gy, rotation, maxGx, maxGy) {
  switch (rotation) {
    case 1: return [maxGy - 1 - gy, gx];
    case 2: return [maxGx - 1 - gx, maxGy - 1 - gy];
    case 3: return [gy, maxGx - 1 - gx];
    default: return [gx, gy];
  }
}

// Returns the (dx, dy) of the min-corner of a 1×1 world box after rotation.
function dispXY(gx, gy, rotation, maxGx, maxGy) {
  const cs = [
    toDisplay(gx,   gy,   rotation, maxGx, maxGy),
    toDisplay(gx+1, gy,   rotation, maxGx, maxGy),
    toDisplay(gx+1, gy+1, rotation, maxGx, maxGy),
    toDisplay(gx,   gy+1, rotation, maxGx, maxGy),
  ];
  return [Math.min(...cs.map(c => c[0])), Math.min(...cs.map(c => c[1]))];
}

// Inverse of the linear part of toDisplay, applied to a delta vector.
// Used when converting a screen-space drag delta back into world grid coords.
function invRotateDelta(ddx, ddy, rotation) {
  switch (rotation) {
    case 1: return [ddy, -ddx];
    case 2: return [-ddx, -ddy];
    case 3: return [-ddy, ddx];
    default: return [ddx, ddy];
  }
}

// Convert a screen-space mouse delta to a delta in world grid coordinates.
function screenToWorldDelta(dsx, dsy, rotation, mode, scale) {
  const svgDx = dsx / scale;
  const svgDy = dsy / scale;
  let ddx, ddy;
  if (mode === 'top') {
    ddx = svgDx / TILE;
    ddy = svgDy / TILE;
  } else {
    // Inverse of proj at gz=0: sx = (gx - gy)*T ; sy = (gx + gy)*T*0.5
    ddx = svgDx / (2 * TILE) + svgDy / TILE;
    ddy = -svgDx / (2 * TILE) + svgDy / TILE;
  }
  return invRotateDelta(ddx, ddy, rotation);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function IsoBox({ node, dx, dy, isSel, isHov, isDimmed, isDragging, onEnter, onLeave, onMouseDown, mode }) {
  const h = node.height;
  const { top, right, front } = faces(dx, dy, h, mode);
  const ctr = topCtr(dx, dy, h, mode);
  const pal = CAT_PAL[node.category] || CAT_PAL['frontend-core'];
  const lines = splitLabel(node.label);
  const lh = 9;
  const y0 = ctr.sy - ((lines.length - 1) * lh) / 2;
  const sw = isSel ? 1.5 : 0.8;
  const auto = node.auto === true;
  const baseOpacity = isSel || isHov || isDragging
    ? 1
    : isDimmed ? 0.28
    : (auto ? 0.5 : 0.9);

  return (
    <g style={{ cursor: isDragging ? 'grabbing' : 'move' }} opacity={baseOpacity}
       onMouseEnter={onEnter} onMouseLeave={onLeave} onMouseDown={onMouseDown}>
      <polygon points={pts(top)}   fill={isSel ? C.selBg  : pal.top}   stroke={C.stroke} strokeWidth={sw} />
      <polygon points={pts(top)}   fill="url(#ah)" stroke="none" opacity={0.35} style={{ pointerEvents: 'none' }} />
      {right && <polygon points={pts(right)} fill={isSel ? '#1c1810' : pal.right} stroke={C.stroke} strokeWidth={sw} />}
      {front && <polygon points={pts(front)} fill={isSel ? '#100e08' : pal.front} stroke={C.stroke} strokeWidth={sw} />}
      {lines.map((ln, i) => (
        <text key={i} x={ctr.sx} y={y0 + i * lh + 4} textAnchor="middle"
              fontSize={h >= 2 ? 9 : 7} fontFamily="monospace"
              fontWeight={isSel ? 'bold' : 'normal'}
              fill={isSel ? C.selText : C.label}
              style={{ pointerEvents: 'none', userSelect: 'none' }}>
          {ln}
        </text>
      ))}
    </g>
  );
}

// An edge is "auto" (import-derived) if its description starts with the [auto]
// marker written by scripts/generateArchitecture.mjs. These are rendered very
// faintly so curated edges dominate the diagram.
function isAutoEdge(e) {
  return typeof e[2] === 'string' && e[2].startsWith('[auto]');
}

function EdgeLine({ edge, path, src, dst, isHovered, isConnected, isDimmed, onEnter, onLeave, mode }) {
  if (!path || !src || !dst) return null;

  const auto = isAutoEdge(edge);

  const midH = Math.max(src.height, dst.height) + 0.06;
  const projPts = path.map((p, i) => {
    let h = midH;
    if (i === 0) h = src.height + 0.06;
    else if (i === path.length - 1) h = dst.height + 0.06;
    return proj(p.x, p.y, h, mode);
  });
  const first = projPts[0], last = projPts[projPts.length - 1];
  const ptsStr = projPts.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(' ');

  // Highlighting: hovered edge → strongest; edge touching the selected node
  // → promoted; every other edge while something is selected → strongly dimmed.
  const promoted = isHovered || isConnected;
  const stroke  = promoted ? '#1a1008' : (auto ? '#7a7460' : '#3a3020');
  const sw      = isHovered ? 2.4 : (isConnected ? 1.9 : (auto ? 0.7 : 1.4));
  const opacity = promoted ? 1 : (isDimmed ? 0.1 : (auto ? 0.35 : 0.72));
  const rSrc    = promoted ? 5 : (auto ? 0 : 3.5);
  const rDst    = promoted ? 5 : (auto ? 2 : 3.5);

  return (
    <g opacity={opacity}>
      {/* Wide invisible hit zone */}
      <polyline points={ptsStr} fill="none"
                stroke="transparent" strokeWidth={14}
                style={{ cursor: 'crosshair' }}
                onMouseEnter={onEnter} onMouseLeave={onLeave} />
      {/* Visible line */}
      <polyline points={ptsStr} fill="none"
                stroke={stroke} strokeWidth={sw}
                strokeLinejoin="round" strokeLinecap="round"
                style={{ pointerEvents: 'none' }} />
      {rSrc > 0 && <circle cx={first.sx} cy={first.sy} r={rSrc} fill={stroke} style={{ pointerEvents: 'none' }} />}
      {rDst > 0 && <circle cx={last.sx}  cy={last.sy}  r={rDst} fill={stroke} style={{ pointerEvents: 'none' }} />}
      {rDst > 1.5 && <circle cx={last.sx} cy={last.sy} r={rDst * 0.44} fill={C.bg} style={{ pointerEvents: 'none' }} />}
    </g>
  );
}

function LeftPanel({ selectedNode, hoveredNode, onSelect }) {
  const active = selectedNode || hoveredNode;
  return (
    <div style={{
      width: 192, flexShrink: 0, overflowY: 'auto',
      background: C.panelBg, borderRight: `1px solid ${C.border}`,
      fontFamily: 'monospace', color: C.label,
    }}>
      <div style={{ padding: '10px 10px 8px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 8, opacity: 0.42, letterSpacing: 1 }}>REPOSITORY</div>
        <div style={{ fontSize: 11, fontWeight: 'bold', marginTop: 1 }}>uganda-market-map</div>
        <div style={{ fontSize: 8, opacity: 0.48, marginTop: 4 }}>
          {nodes.length} components · {edges.length} edges
        </div>
      </div>

      {CATS.map(cat => {
        const catNodes = nodes.filter(n => n.category === cat.key);
        if (!catNodes.length) return null;
        return (
          <div key={cat.key}>
            <div style={{ padding: '5px 10px 1px', fontSize: 7.5, opacity: 0.38, letterSpacing: 1 }}>
              {cat.label}
            </div>
            {catNodes.map(node => {
              const isActive = active?.id === node.id;
              return (
                <div key={node.id}
                     onClick={() => onSelect(isActive ? null : node)}
                     style={{
                       display: 'flex', alignItems: 'center', gap: 6,
                       padding: '2px 10px', cursor: 'pointer', lineHeight: 1.3,
                       background: isActive ? C.selBg : 'transparent',
                       color: isActive ? C.selText : C.label,
                     }}>
                  <span style={{
                    width: 14, height: 14, fontSize: 7, fontWeight: 'bold', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? C.selText : C.selBg,
                    color: isActive ? C.selBg : C.selText,
                  }}>
                    {node.label[0].toUpperCase()}
                  </span>
                  <span style={{ flex: 1, fontSize: 9 }}>{node.label}</span>
                  <span style={{ fontSize: 7.5, opacity: 0.4 }}>{node.height}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function RightPanel({ node }) {
  const [tab, setTab] = useState('what');
  useEffect(() => { setTab('what'); }, [node?.id]);
  const catLabel = CATS.find(c => c.key === node?.category)?.label;

  const Btn = ({ t, lbl }) => (
    <button onClick={() => setTab(t)} style={{
      flex: 1, padding: '7px 0', fontSize: 8, letterSpacing: 1, cursor: 'pointer',
      background: 'none', border: 'none',
      borderBottom: tab === t ? `2px solid ${C.border}` : '2px solid transparent',
      fontFamily: 'monospace', fontWeight: tab === t ? 'bold' : 'normal', color: C.label,
    }}>{lbl}</button>
  );

  return (
    <div style={{
      width: 252, flexShrink: 0, overflowY: 'auto',
      background: C.panelBg, borderLeft: `1px solid ${C.border}`,
      fontFamily: 'monospace', color: C.label,
    }}>
      <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 8, opacity: 0.42, letterSpacing: 1 }}>AGRIBRIDGE</div>
        <div style={{ fontSize: 11, fontWeight: 'bold', marginTop: 1 }}>Uganda Market Map</div>
        <div style={{ fontSize: 8, opacity: 0.48, marginTop: 1 }}>Repository Architecture</div>
      </div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
        <Btn t="what" lbl="WHAT IT DOES" />
        <Btn t="how"  lbl="HOW IT'S BUILT" />
      </div>

      {node ? (
        <div style={{ padding: 12 }}>
          {catLabel && (
            <div style={{
              display: 'inline-block', fontSize: 7, letterSpacing: 1,
              padding: '2px 6px', background: '#2a241820', marginBottom: 6,
            }}>{catLabel}</div>
          )}
          <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 3, lineHeight: 1.25 }}>
            {node.label}
          </div>
          <div style={{ fontSize: 8, opacity: 0.38, marginBottom: 10, wordBreak: 'break-all' }}>
            {node.file}
          </div>
          <div style={{ fontSize: 9, lineHeight: 1.7, opacity: 0.82 }}>
            {tab === 'what' ? node.what : node.how}
          </div>
        </div>
      ) : (
        <div style={{ padding: 12, fontSize: 9, lineHeight: 1.75, opacity: 0.62 }}>
          <p>Agribridge is a full-stack agritech platform with two parallel entry points: an admin web app for brokers and staff, and a WhatsApp bot for farmers in the field.</p>
          <p style={{ marginTop: 8 }}>Both paths converge on the same Express services and MongoDB models.</p>
          <p style={{ marginTop: 8 }}>Hover any box to read its description. Click to pin. The "How it's built" tab gives implementation detail.</p>
          <p style={{ marginTop: 8, opacity: 0.6 }}>Drag to pan · scroll to zoom · Esc to deselect.</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ArchitectureView() {
  const [sel,      setSel]      = useState(null);
  const [hov,      setHov]      = useState(null);
  const [hovEdge,  setHovEdge]  = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pan,      setPan]      = useState({ x: 0, y: 0 });
  const [scale,    setScale]    = useState(1);
  const [dragging, setDragging] = useState(false);
  const [view,      setView]      = useState(0);
  const [positions, setPositions] = useState({}); // { nodeId: {gridX, gridY} } drag overrides
  const [draggingId, setDraggingId] = useState(null);
  const dragRef     = useRef(null);   // canvas pan
  const nodeDragRef = useRef(null);   // node drag
  const canvasRef   = useRef(null);

  const rotation = VIEWS[view].rotation;
  const mode     = VIEWS[view].mode;

  const nmap = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), []);

  // maxGx/maxGy are locked to the ORIGINAL positions so rotation stays stable
  // even after the user drags nodes far outside the initial layout bounds.
  const maxGx = useMemo(() => Math.max(...nodes.map(n => n.gridX + 1)), []);
  const maxGy = useMemo(() => Math.max(...nodes.map(n => n.gridY + 1)), []);

  // Precompute display coords for every node, applying any drag overrides.
  const displayNodes = useMemo(() => nodes.map(n => {
    const o = positions[n.id];
    const gx = o?.gridX ?? n.gridX;
    const gy = o?.gridY ?? n.gridY;
    const [dx, dy] = dispXY(gx, gy, rotation, maxGx, maxGy);
    return { ...n, gridX: gx, gridY: gy, dx, dy };
  }), [rotation, maxGx, maxGy, positions]);

  const displayById = useMemo(
    () => Object.fromEntries(displayNodes.map(n => [n.id, n])),
    [displayNodes],
  );

  // Every node's box as a routable obstacle rectangle. Built once per layout so
  // per-edge routing just filters this list rather than rebuilding.
  const allObstacles = useMemo(() => displayNodes.map(n => ({
    id: n.id,
    x1: n.dx,       y1: n.dy,
    x2: n.dx + 1,   y2: n.dy + 1,
  })), [displayNodes]);

  // Route every edge so it steers around other boxes. Recomputed on rotation
  // change; independent of mode (routing is in grid space).
  const routedEdges = useMemo(() => edges.map(edge => {
    const src = displayById[edge[0]];
    const dst = displayById[edge[1]];
    if (!src || !dst) return { edge, path: null, src: null, dst: null };
    const obstacles = allObstacles.filter(o => o.id !== src.id && o.id !== dst.id);
    const path = routePath(src.dx, src.dy, dst.dx, dst.dy, obstacles);
    return { edge, path, src, dst };
  }), [displayById, allObstacles]);

  // Auto edges render first (behind) so curated edges paint on top. When a
  // node is selected, promote its incident edges to render last (on top of
  // everything else) so highlights are unobstructed.
  const sortedEdges = useMemo(() => {
    const rank = (r) => {
      if (sel && (r.edge[0] === sel.id || r.edge[1] === sel.id)) return 2;
      return isAutoEdge(r.edge) ? 0 : 1;
    };
    return [...routedEdges].sort((a, b) => rank(a) - rank(b));
  }, [routedEdges, sel]);

  // Set of node IDs that are neighbours of the selected node (via any edge).
  const neighbourIds = useMemo(() => {
    if (!sel) return null;
    const s = new Set([sel.id]);
    for (const e of edges) {
      if (e[0] === sel.id) s.add(e[1]);
      else if (e[1] === sel.id) s.add(e[0]);
    }
    return s;
  }, [sel]);

  // Painter's sort: ascending (dx+dy) paints furthest-back nodes first
  const sorted = useMemo(() =>
    [...displayNodes].sort((a, b) => (a.dx + a.dy) - (b.dx + b.dy)),
  [displayNodes]);

  const bounds = useMemo(() => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    displayNodes.forEach(n => {
      [
        proj(n.dx,   n.dy,   0,        mode),
        proj(n.dx+1, n.dy,   0,        mode),
        proj(n.dx,   n.dy+1, 0,        mode),
        proj(n.dx+1, n.dy+1, 0,        mode),
        proj(n.dx,   n.dy,   n.height, mode),
        proj(n.dx+1, n.dy+1, n.height, mode),
      ].forEach(p => {
        if (p.sx < x0) x0 = p.sx; if (p.sx > x1) x1 = p.sx;
        if (p.sy < y0) y0 = p.sy; if (p.sy > y1) y1 = p.sy;
      });
    });
    return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 };
  }, [displayNodes, mode]);

  const fitToCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const { width, height } = canvasRef.current.getBoundingClientRect();
    const s = Math.min(0.82, Math.min((width - 40) / bounds.w, (height - 60) / bounds.h));
    setScale(s);
    setPan({
      x: (width  - bounds.w * s) / 2 - bounds.x0 * s,
      y: (height - bounds.h * s) / 2 - bounds.y0 * s,
    });
  }, [bounds]);

  // Auto-fit on mount and on view (rotation/mode) change, but NOT on every
  // node-drag position change — otherwise the diagram would jump around while
  // the user is exploring the layout. Uses a ref so the effect can call the
  // latest fitToCanvas without listing it as a dependency.
  const fitRef = useRef(fitToCanvas);
  fitRef.current = fitToCanvas;
  useEffect(() => { fitRef.current(); }, [view]);

  // Wheel zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.9 : 1.11;
    setScale(s => {
      const next = Math.max(0.18, Math.min(4, s * factor));
      setPan(p => ({
        x: mx - (mx - p.x) * (next / s),
        y: my - (my - p.y) * (next / s),
      }));
      return next;
    });
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Escape key
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') setSel(null); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  // Canvas pan starts on empty-space mousedown.
  const onCanvasDown = useCallback(e => {
    if (e.button !== 0) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
    setDragging(true);
  }, [pan]);

  // Box mousedown: prep for either a click (select) or a drag (move).
  // We defer the decision to mousemove: >3px of movement means "drag".
  const onBoxDown = useCallback((e, dnode) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // don't start a canvas pan
    nodeDragRef.current = {
      id: dnode.id,
      startMx: e.clientX,
      startMy: e.clientY,
      startGx: dnode.gridX,
      startGy: dnode.gridY,
      moved: false,
    };
  }, []);

  const onMouseMove = useCallback(e => {
    setMousePos({ x: e.clientX, y: e.clientY });

    // Node drag takes precedence.
    const nd = nodeDragRef.current;
    if (nd) {
      const dsx = e.clientX - nd.startMx;
      const dsy = e.clientY - nd.startMy;
      if (!nd.moved && Math.hypot(dsx, dsy) > 3) {
        nd.moved = true;
        setDraggingId(nd.id);
      }
      if (nd.moved) {
        const [dgx, dgy] = screenToWorldDelta(dsx, dsy, rotation, mode, scale);
        setPositions(p => ({
          ...p,
          [nd.id]: { gridX: nd.startGx + dgx, gridY: nd.startGy + dgy },
        }));
      }
      return;
    }

    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.px + (e.clientX - dragRef.current.sx),
      y: dragRef.current.py + (e.clientY - dragRef.current.sy),
    });
  }, [rotation, mode, scale]);

  const onMouseUp = useCallback(() => {
    const nd = nodeDragRef.current;
    if (nd) {
      nodeDragRef.current = null;
      setDraggingId(null);
      if (!nd.moved) {
        // Treat as click → toggle selection
        const node = nmap[nd.id];
        if (node) setSel(s => s?.id === node.id ? null : node);
      }
      return;
    }
    dragRef.current = null;
    setDragging(false);
  }, [nmap]);

  const handleView = useCallback(v => {
    setView(v);
    setSel(null);
    setHov(null);
    setHovEdge(null);
  }, []);

  const resetLayout = useCallback(() => {
    setPositions({});
  }, []);

  const hasMoved = Object.keys(positions).length > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden', zIndex: 100 }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px',
        height: 34, flexShrink: 0,
        background: C.panelBg, borderBottom: `1px solid ${C.border}`,
        fontFamily: 'monospace', fontSize: 9, color: C.label,
      }}>
        <span style={{ opacity: 0.4, letterSpacing: 1 }}>REPOSITORY</span>
        <span style={{ fontWeight: 'bold' }}>uganda-market-map</span>
        <span style={{ opacity: 0.28 }}>·</span>
        <span style={{ opacity: 0.52 }}>{nodes.length} components</span>
        <span style={{ opacity: 0.28 }}>·</span>
        <span style={{ opacity: 0.52 }}>{edges.length} connections</span>
        <div style={{ flex: 1 }} />

        {/* Camera angle buttons */}
        <span style={{ opacity: 0.38, letterSpacing: 1, fontSize: 8 }}>VIEW</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {VIEWS.map((v, i) => (
            <button key={v.key} onClick={() => handleView(i)} style={{
              padding: '2px 9px', fontSize: 8, letterSpacing: 1, cursor: 'pointer',
              fontFamily: 'monospace', fontWeight: view === i ? 'bold' : 'normal',
              background: view === i ? C.selBg : 'transparent',
              color: view === i ? C.selText : C.label,
              border: `1px solid ${view === i ? C.selBg : '#2a241860'}`,
            }}>{v.label}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 18, background: C.border, opacity: 0.2 }} />

        {hasMoved && (
          <button onClick={resetLayout} style={{
            padding: '3px 10px', fontSize: 8, letterSpacing: 1, cursor: 'pointer',
            background: 'transparent', color: C.label,
            border: `1px solid ${C.border}`,
            fontFamily: 'monospace', fontWeight: 'bold',
          }}>↺ RESET LAYOUT</button>
        )}

        <button onClick={fitToCanvas} style={{
          padding: '3px 10px', fontSize: 8, letterSpacing: 1, cursor: 'pointer',
          background: C.selBg, color: C.selText, border: 'none',
          fontFamily: 'monospace', fontWeight: 'bold',
        }}>↺ RESET VIEW</button>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <LeftPanel selectedNode={sel} hoveredNode={hov} onSelect={setSel} />

        {/* Canvas */}
        <div
          ref={canvasRef}
          style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: dragging ? 'grabbing' : 'grab' }}
          onMouseDown={onCanvasDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <svg width="100%" height="100%" style={{ display: 'block' }}>
            <defs>
              <pattern id="ah" patternUnits="userSpaceOnUse" width="6" height="6"
                       patternTransform="rotate(45 0 0)">
                <line x1="0" y1="0" x2="0" y2="6" stroke={C.hatch} strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={C.bg} />
            <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
              {sortedEdges.map(({ edge, path, src, dst }, i) => {
                const key = `${edge[0]}-${edge[1]}`;
                const connected = sel && (edge[0] === sel.id || edge[1] === sel.id);
                return (
                  <EdgeLine
                    key={i}
                    edge={edge}
                    path={path}
                    src={src}
                    dst={dst}
                    isHovered={hovEdge?.key === key}
                    isConnected={!!connected}
                    isDimmed={!!(sel && !connected)}
                    onEnter={() => setHovEdge({ key, edge })}
                    onLeave={() => setHovEdge(null)}
                    mode={mode}
                  />
                );
              })}
              {sorted.map(dnode => (
                <IsoBox
                  key={dnode.id}
                  node={dnode}
                  dx={dnode.dx}
                  dy={dnode.dy}
                  isSel={sel?.id === dnode.id}
                  isHov={hov?.id === dnode.id}
                  isDimmed={!!(neighbourIds && !neighbourIds.has(dnode.id))}
                  isDragging={draggingId === dnode.id}
                  onEnter={() => setHov(dnode)}
                  onLeave={() => setHov(null)}
                  onMouseDown={(e) => onBoxDown(e, dnode)}
                  mode={mode}
                />
              ))}
            </g>
          </svg>

          {/* Edge hover tooltip */}
          {hovEdge && nmap[hovEdge.edge[0]] && nmap[hovEdge.edge[1]] && (
            <div style={{
              position: 'fixed',
              left: mousePos.x + 16,
              top:  mousePos.y - 12,
              background: C.selBg,
              color: C.selText,
              fontFamily: 'monospace',
              fontSize: 9,
              lineHeight: 1.6,
              padding: '7px 10px',
              maxWidth: 320,
              pointerEvents: 'none',
              zIndex: 200,
              boxShadow: '2px 3px 0 #0005',
            }}>
              <div style={{ opacity: 0.55, fontSize: 8, marginBottom: 3, letterSpacing: 0.5 }}>
                {nmap[hovEdge.edge[0]].label}
                <span style={{ margin: '0 5px' }}>→</span>
                {nmap[hovEdge.edge[1]].label}
              </div>
              <div>{hovEdge.edge[2]}</div>
            </div>
          )}

          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            fontSize: 7.5, fontFamily: 'monospace', color: C.label, opacity: 0.32,
            letterSpacing: 1, pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            CLICK TO SELECT · DRAG A BOX TO MOVE IT · DRAG EMPTY SPACE TO PAN · SCROLL TO ZOOM · ESC TO DESELECT
          </div>
        </div>

        <RightPanel node={sel || hov} />
      </div>
    </div>
  );
}
