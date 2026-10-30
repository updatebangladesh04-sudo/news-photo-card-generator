export interface Card {
  tpl: string; size: [number, number]; text: string; name: string; role: string
  date: string; source: string; category: string
  fontSize: number; align: CanvasTextAlign; accent: string; bg: string; color: string
  overlay: number; spX: number; spY: number; spS: number
  bgX: number; bgY: number; bgS: number; logoPos: 'tl' | 'tr'; logoS: number
}
export interface Imgs { speaker: HTMLImageElement | null; photo: HTMLImageElement | null; logo: HTMLImageElement | null }
export interface Tpl { id: string; name: string; category: string; bg: string; accent: string; color: string }
export const TEMPLATES: Tpl[] = [
  { id: 'light', name: 'Premium Speaker – Light Editorial', category: 'Speaker', bg: '#e8f0f8', accent: '#d62828', color: '#0b2a55' },
  { id: 'dark', name: 'Premium Speaker – Dark Premium', category: 'Speaker', bg: '#0b1f44', accent: '#f4c430', color: '#ffffff' },
  { id: 'split', name: 'Premium Speaker – Split Editorial', category: 'Speaker', bg: '#ffffff', accent: '#d62828', color: '#111111' },
  { id: 'breaking', name: 'Breaking News', category: 'Breaking', bg: '#111111', accent: '#e11d1d', color: '#ffffff' },
  { id: 'headphoto', name: 'Bold Headline over Photo', category: 'Headline', bg: '#ffffff', accent: '#d62828', color: '#0b2a55' },
  { id: 'minimal', name: 'Minimalist Speaker Right', category: 'Minimal', bg: '#f6f6f2', accent: '#1d4ed8', color: '#111111' },
]
const FONT = '"Noto Serif Bengali","Noto Sans Bengali","Kalpurush",serif'
const F = (wt: number, px: number) => `${wt} ${Math.round(px)}px ${FONT}`
type W = { t: string; a: boolean }
const parse = (s: string): W[] => s.split('*').flatMap((p, i) => p.split(/\s+/).filter(Boolean).map(t => ({ t, a: i % 2 === 1 })))
type Box = { x: number; y: number; w: number; h: number }

function lay(c: CanvasRenderingContext2D, ws: W[], maxW: number, px: number, wt: number) {
  c.font = F(wt, px); const sp = c.measureText(' ').width
  const lines: { ws: W[]; w: number }[] = []; let cur: W[] = []; let cw = 0
  for (const w of ws) {
    const ww = c.measureText(w.t).width
    if (cur.length && cw + sp + ww > maxW) { lines.push({ ws: cur, w: cw }); cur = []; cw = 0 }
    cw += (cur.length ? sp : 0) + ww; cur.push(w)
  }
  if (cur.length) lines.push({ ws: cur, w: cw })
  return { lines, sp }
}
export function text(c: CanvasRenderingContext2D, s: string, b: Box, st: Card, col: string, acc: string, wt = 900, align = st.align, start = st.fontSize) {
  const ws = parse(s); if (!ws.length) return
  let px = start; let r = lay(c, ws, b.w, px, wt)
  while (px > 18 && (r.lines.length * px * 1.32 > b.h || r.lines.some(l => l.w > b.w))) { px -= 2; r = lay(c, ws, b.w, px, wt) }
  c.font = F(wt, px); c.textBaseline = 'top'; c.textAlign = 'left'
  const lh = px * 1.32; const top = b.y + Math.max(0, (b.h - r.lines.length * lh) / 2)
  r.lines.forEach((l, i) => {
    let x = align === 'center' ? b.x + (b.w - l.w) / 2 : align === 'right' ? b.x + b.w - l.w : b.x
    for (const w of l.ws) { c.fillStyle = w.a ? acc : col; c.fillText(w.t, x, top + i * lh); x += c.measureText(w.t).width + r.sp }
  })
}
function cover(c: CanvasRenderingContext2D, im: HTMLImageElement, b: Box, z: number, px: number, py: number) {
  const k = Math.max(b.w / im.width, b.h / im.height) * z; const dw = im.width * k, dh = im.height * k
  c.save(); c.beginPath(); c.rect(b.x, b.y, b.w, b.h); c.clip()
  c.drawImage(im, b.x + (b.w - dw) / 2 + px * b.w, b.y + (b.h - dh) / 2 + py * b.h, dw, dh); c.restore()
}
function photo(c: CanvasRenderingContext2D, im: Imgs, b: Box, st: Card, fallback: string) {
  if (im.photo) cover(c, im.photo, b, st.bgS, st.bgX, st.bgY)
  else { const g = c.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, fallback); g.addColorStop(1, '#000'); c.fillStyle = g; c.fillRect(b.x, b.y, b.w, b.h) }
  const g = c.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, `rgba(0,0,0,${st.overlay * 0.4})`); g.addColorStop(1, `rgba(0,0,0,${st.overlay})`)
  c.fillStyle = g; c.fillRect(b.x, b.y, b.w, b.h)
}
function speaker(c: CanvasRenderingContext2D, im: Imgs, w: number, h: number, st: Card, hFrac: number, cxFrac: number, bottom: number) {
  const s = im.speaker; if (!s) return
  const hh = h * hFrac * st.spS, ww = hh * s.width / s.height
  c.drawImage(s, w * cxFrac - ww / 2 + st.spX * w, bottom - hh + st.spY * h, ww, hh)
}
function logo(c: CanvasRenderingContext2D, im: Imgs, w: number, st: Card, y: number) {
  const l = im.logo; if (!l) return
  const lw = w * 0.2 * st.logoS, lh = lw * l.height / l.width, m = w * 0.04
  c.drawImage(l, st.logoPos === 'tr' ? w - m - lw : m, y, lw, lh)
}
function nameBlock(c: CanvasRenderingContext2D, st: Card, b: Box, col: string, sub: string) {
  const px = b.h * 0.5
  text(c, st.name, { x: b.x, y: b.y, w: b.w, h: px * 1.4 }, st, col, col, 900, st.align, px)
  text(c, st.role, { x: b.x, y: b.y + px * 1.4, w: b.w, h: b.h - px * 1.4 }, st, sub, sub, 400, st.align, px * 0.6)
}
function meta(c: CanvasRenderingContext2D, st: Card, w: number, h: number, col: string) {
  c.font = F(400, w * 0.022); c.fillStyle = col; c.textBaseline = 'alphabetic'; c.textAlign = 'left'
  const s = [st.date, st.source].filter(Boolean).join('   |   '); if (s) c.fillText(s, w * 0.04, h - h * 0.02)
  if (st.category) { c.textAlign = 'right'; c.fillText(st.category, w * 0.96, h - h * 0.02) }
}
function quote(c: CanvasRenderingContext2D, x: number, y: number, px: number, col: string) { c.font = F(900, px); c.fillStyle = col; c.textBaseline = 'top'; c.textAlign = 'left'; c.fillText('\u201C', x, y) }

export function draw(c: CanvasRenderingContext2D, st: Card, im: Imgs) {
  const [w, h] = st.size; const m = w * 0.05
  c.clearRect(0, 0, w, h); c.fillStyle = st.bg; c.fillRect(0, 0, w, h)
  const tall = h >= w
  switch (st.tpl) {
    case 'light': { // text top, photo bottom, speaker in front
      const py = h * (tall ? 0.5 : 0.45)
      photo(c, im, { x: 0, y: py, w, h: h - py }, st, '#6b7f99')
      c.fillStyle = st.accent; c.fillRect(m, h * 0.1, w * 0.12, h * 0.008)
      quote(c, m, h * 0.1, w * 0.2, st.accent)
      text(c, st.text, { x: m, y: h * 0.17, w: w - 2 * m, h: py - h * 0.2 }, st, st.color, st.accent)
      speaker(c, im, w, h, st, 0.62, 0.5, h * 0.9)
      c.fillStyle = 'rgba(255,255,255,.92)'; c.fillRect(0, h * 0.9, w, h * 0.1)
      nameBlock(c, st, { x: m, y: h * 0.905, w: w - 2 * m, h: h * 0.08 }, st.color, st.accent)
      logo(c, im, w, st, h * 0.025); break }
    case 'dark': {
      const g = c.createRadialGradient(w / 2, h * 0.25, 10, w / 2, h * 0.25, w); g.addColorStop(0, '#16336b'); g.addColorStop(1, st.bg); c.fillStyle = g; c.fillRect(0, 0, w, h)
      c.globalAlpha = 0.07; c.font = F(900, w * 0.7); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('\u2605', w / 2, h * 0.3); c.globalAlpha = 1
      const py = h * 0.56; c.save(); c.globalAlpha = 1
      photo(c, im, { x: 0, y: py, w, h: h - py }, st, '#1b3a74'); c.restore()
      quote(c, m, h * 0.06, w * 0.34, st.accent)
      text(c, st.text, { x: m, y: h * 0.17, w: w - 2 * m, h: py - h * 0.2 }, st, st.color, st.accent)
      speaker(c, im, w, h, st, 0.62, 0.5, h * 0.9)
      c.fillStyle = st.accent; c.fillRect(0, h * 0.9, w, h * 0.1)
      nameBlock(c, st, { x: m, y: h * 0.905, w: w - 2 * m, h: h * 0.08 }, '#0b1f44', '#0b1f44')
      logo(c, im, w, st, h * 0.025); break }
    case 'split': {
      const py = h * 0.48
      c.fillStyle = '#f2f2f2'; c.fillRect(0, 0, w, py); c.fillStyle = st.accent; c.fillRect(0, 0, w * 0.025, py)
      photo(c, im, { x: 0, y: py, w, h: h - py }, st, '#555')
      text(c, st.text, { x: m * 1.4, y: h * 0.1, w: w - 2.6 * m, h: py - h * 0.12 }, st, st.color, st.accent)
      speaker(c, im, w, h, st, 0.62, 0.5, h * 0.93)
      c.fillStyle = st.accent; c.fillRect(0, h * 0.9, w, h * 0.1)
      nameBlock(c, st, { x: m, y: h * 0.905, w: w - 2 * m, h: h * 0.08 }, '#fff', '#fff')
      logo(c, im, w, st, h * 0.025); break }
    case 'breaking': {
      photo(c, im, { x: 0, y: 0, w, h }, { ...st, overlay: Math.max(st.overlay, 0.4) }, '#333')
      if (im.speaker) speaker(c, im, w, h, st, 0.6, 0.5, h * 0.62)
      c.fillStyle = st.accent; c.fillRect(0, h * 0.62, w, h * 0.07)
      text(c, st.category || 'ব্রেকিং নিউজ', { x: m, y: h * 0.62, w: w - 2 * m, h: h * 0.07 }, st, '#fff', '#fff', 900, 'left', h * 0.05)
      c.fillStyle = 'rgba(0,0,0,.85)'; c.fillRect(0, h * 0.69, w, h * 0.31)
      text(c, st.text, { x: m, y: h * 0.71, w: w - 2 * m, h: h * 0.2 }, st, st.color, '#ffd23f')
      nameBlock(c, st, { x: m, y: h * 0.915, w: w - 2 * m, h: h * 0.055 }, '#fff', '#ccc')
      logo(c, im, w, st, h * 0.025); break }
    case 'headphoto': {
      const ty = h * 0.4
      c.fillStyle = st.accent; c.fillRect(0, 0, w, h * 0.012)
      text(c, st.text, { x: m, y: h * 0.04, w: w - 2 * m, h: ty - h * 0.06 }, st, st.color, st.accent)
      photo(c, im, { x: 0, y: ty, w, h: h - ty }, st, '#667')
      if (im.speaker) speaker(c, im, w, h, st, 0.58, 0.5, h * 0.93)
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, h * 0.9, w, h * 0.1)
      nameBlock(c, st, { x: m, y: h * 0.905, w: w - 2 * m, h: h * 0.08 }, '#fff', '#ddd')
      logo(c, im, w, st, ty + h * 0.02); break }
    default: { // minimal: statement left, speaker right
      c.fillStyle = st.accent; c.fillRect(m, h * 0.08, w * 0.08, h * 0.008)
      text(c, st.text, { x: m, y: h * 0.12, w: w * (tall ? 0.9 : 0.55) - m, h: h * 0.5 }, st, st.color, st.accent)
      if (!tall) photo(c, im, { x: w * 0.6, y: 0, w: w * 0.4, h }, st, '#ddd')
      speaker(c, im, w, h, st, 0.6, tall ? 0.7 : 0.8, h * 0.88)
      nameBlock(c, st, { x: m, y: h * 0.75, w: w * 0.55, h: h * 0.11 }, st.color, st.accent)
      logo(c, im, w, st, h * 0.025) }
  }
  meta(c, st, w, h, ['dark', 'breaking', 'split', 'headphoto'].includes(st.tpl) ? '#fff' : st.color)
}
export async function exportCard(st: Card, im: Imgs, type: 'image/png' | 'image/jpeg', k: number): Promise<Blob> {
  await document.fonts.load(F(900, 40), 'আবগ'); await document.fonts.ready
  const cv = document.createElement('canvas'); cv.width = st.size[0] * k; cv.height = st.size[1] * k
  const c = cv.getContext('2d')!; c.scale(k, k)
  if (type === 'image/jpeg') { c.fillStyle = '#fff'; c.fillRect(0, 0, st.size[0], st.size[1]) }
  draw(c, st, im)
  return new Promise((res, rej) => cv.toBlob(b => (b ? res(b) : rej(new Error('Export failed'))), type, 0.95))
}
