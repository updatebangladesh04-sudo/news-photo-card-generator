
export interface Card {
  tpl: string;
  size: [number, number];
export interface Card {
  tpl: string;
  size: [number, number];
  text: string;
  name: string;
  role: string;
  date: string;
  source: string;
  category: string;
  fontSize: number;
  align: CanvasTextAlign;
  accent: string;
  bg: string;
  color: string;
  overlay: number;
  spX: number;
  spY: number;
  spS: number;
  bgX: number;
  bgY: number;
  bgS: number;
  logoPos: "tl" | "tr";
  logoS: number;
}

export interface Imgs {
  speaker: HTMLImageElement | null;
  photo: HTMLImageElement | null;
  logo: HTMLImageElement | null;
}

export interface Tpl {
  id: string;
  name: string;
  category: string;
  bg: string;
  accent: string;
  color: string;
}

export const TEMPLATES: Tpl[] = [
  {
    id: "light",
    name: "Premium Speaker – Light Editorial",
    category: "Speaker",
    bg: "#e8f0f8",
    accent: "#d62828",
    color: "#0b2a55",
  },
  {
    id: "dark",
    name: "Premium Speaker – Dark Premium",
    category: "Speaker",
    bg: "#0b1f44",
    accent: "#f4c430",
    color: "#ffffff",
  },
  {
    id: "split",
    name: "Premium Speaker – Split Editorial",
    category: "Speaker",
    bg: "#ffffff",
    accent: "#d62828",
    color: "#111111",
  },
  {
    id: "breaking",
    name: "Red Breaking News",
    category: "Breaking",
    bg: "#a90000",
    accent: "#ed0808",
    color: "#ffffff",
  },
  {
    id: "headphoto",
    name: "Bold Headline over Photo",
    category: "Headline",
    bg: "#ffffff",
    accent: "#d62828",
    color: "#0b2a55",
  },
  {
    id: "minimal",
    name: "Minimalist Speaker Right",
    category: "Minimal",
    bg: "#f6f6f2",
    accent: "#1d4ed8",
    color: "#111111",
  },
  {
    id: "white-headline",
    name: "White Headline – Red & Blue",
    category: "Headline",
    bg: "#ffffff",
    accent: "#c40018",
    color: "#252b78",
  },
];

const FONT =
  '"Noto Serif Bengali","Noto Sans Bengali","Kalpurush",serif';

const F = (wt: number, px: number) =>
  `${wt} ${Math.max(1, Math.round(px))}px ${FONT}`;

type W = { t: string; a: boolean };
type Box = { x: number; y: number; w: number; h: number };

const parse = (s: string): W[] =>
  s
    .split("*")
    .flatMap((p, i) =>
      p
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => ({ t, a: i % 2 === 1 }))
    );

function lay(
  c: CanvasRenderingContext2D,
  ws: W[],
  maxW: number,
  px: number,
  wt: number
) {
  c.font = F(wt, px);
  const sp = c.measureText(" ").width;
  const lines: { ws: W[]; w: number }[] = [];
  let cur: W[] = [];
  let cw = 0;

  for (const word of ws) {
    const ww = c.measureText(word.t).width;

    if (cur.length && cw + sp + ww > maxW) {
      lines.push({ ws: cur, w: cw });
      cur = [];
      cw = 0;
    }

    cw += (cur.length ? sp : 0) + ww;
    cur.push(word);
  }

  if (cur.length) lines.push({ ws: cur, w: cw });
  return { lines, sp };
}

export function text(
  c: CanvasRenderingContext2D,
  s: string,
  b: Box,
  st: Card,
  col: string,
  acc: string,
  wt = 900,
  align = st.align,
  start = st.fontSize
) {
  const ws = parse(s);
  if (!ws.length || b.w <= 0 || b.h <= 0) return;

  let px = Math.max(12, start || 24);
  let r = lay(c, ws, b.w, px, wt);

  while (
    px > 12 &&
    (r.lines.length * px * 1.32 > b.h ||
      r.lines.some((line) => line.w > b.w))
  ) {
    px -= 1;
    r = lay(c, ws, b.w, px, wt);
  }

  c.font = F(wt, px);
  c.textBaseline = "top";
  c.textAlign = "left";

  const lineHeight = px * 1.32;
  const totalHeight = r.lines.length * lineHeight;
  const top = b.y + Math.max(0, (b.h - totalHeight) / 2);

  r.lines.forEach((line, i) => {
    let x =
      align === "center"
        ? b.x + (b.w - line.w) / 2
        : align === "right"
          ? b.x + b.w - line.w
          : b.x;

    line.ws.forEach((word, j) => {
      c.fillStyle = word.a ? acc : col;
      c.fillText(word.t, x, top + i * lineHeight);
      x += c.measureText(word.t).width;
      if (j < line.ws.length - 1) x += r.sp;
    });
  });
}

function cover(
  c: CanvasRenderingContext2D,
  im: HTMLImageElement,
  b: Box,
  z: number,
  px: number,
  py: number
) {
  if (!im.width || !im.height) return;

  const scale = Math.max(b.w / im.width, b.h / im.height) * z;
  const dw = im.width * scale;
  const dh = im.height * scale;

  c.save();
  c.beginPath();
  c.rect(b.x, b.y, b.w, b.h);
  c.clip();
  c.drawImage(
    im,
    b.x + (b.w - dw) / 2 + px * b.w,
    b.y + (b.h - dh) / 2 + py * b.h,
    dw,
    dh
  );
  c.restore();
}

function photo(
  c: CanvasRenderingContext2D,
  im: Imgs,
  b: Box,
  st: Card,
  fallback: string,
  addOverlay = true
) {
  if (im.photo) {
    cover(c, im.photo, b, st.bgS || 1, st.bgX || 0, st.bgY || 0);
  } else {
    const g = c.createLinearGradient(0, b.y, 0, b.y + b.h);
    g.addColorStop(0, fallback);
    g.addColorStop(1, "#111111");
    c.fillStyle = g;
    c.fillRect(b.x, b.y, b.w, b.h);
  }

  if (addOverlay && st.overlay > 0) {
    const g = c.createLinearGradient(0, b.y, 0, b.y + b.h);
    g.addColorStop(0, `rgba(0,0,0,${st.overlay * 0.25})`);
    g.addColorStop(1, `rgba(0,0,0,${st.overlay})`);
    c.fillStyle = g;
    c.fillRect(b.x, b.y, b.w, b.h);
  }
}

function speaker(
  c: CanvasRenderingContext2D,
  im: Imgs,
  w: number,
  h: number,
  st: Card,
  hFrac: number,
  cxFrac: number,
  bottom: number
) {
  const s = im.speaker;
  if (!s || !s.width || !s.height) return;

  const hh = h * hFrac * (st.spS || 1);
  const ww = (hh * s.width) / s.height;

  c.drawImage(
    s,
    w * cxFrac - ww / 2 + st.spX * w,
    bottom - hh + st.spY * h,
    ww,
    hh
  );
}

function logo(
  c: CanvasRenderingContext2D,
  im: Imgs,
  w: number,
  st: Card,
  y: number
) {
  const l = im.logo;
  if (!l || !l.width || !l.height) return;

  const lw = w * 0.2 * (st.logoS || 1);
  const lh = (lw * l.height) / l.width;
  const margin = w * 0.04;

  c.drawImage(
    l,
    st.logoPos === "tr" ? w - margin - lw : margin,
    y,
    lw,
    lh
  );
}

function nameBlock(
  c: CanvasRenderingContext2D,
  st: Card,
  b: Box,
  col: string,
  sub: string
) {
  const px = Math.max(18, b.h * 0.43);

  text(
    c,
    st.name,
    { x: b.x, y: b.y, w: b.w, h: px * 1.35 },
    st,
    col,
    col,
    900,
    st.align,
    px
  );

  text(
    c,
    st.role,
    {
      x: b.x,
      y: b.y + px * 1.35,
      w: b.w,
      h: Math.max(10, b.h - px * 1.35),
    },
    st,
    sub,
    sub,
    400,
    st.align,
    px * 0.55
  );
}

function meta(
  c: CanvasRenderingContext2D,
  st: Card,
  w: number,
  h: number,
  col: string
) {
  const size = Math.max(12, w * 0.022);
  c.font = F(400, size);
  c.fillStyle = col;
  c.textBaseline = "alphabetic";
  c.textAlign = "left";

  const s = [st.date, st.source].filter(Boolean).join("   |   ");

  if (s) c.fillText(s, w * 0.04, h - h * 0.02, w * 0.72);

  if (st.category) {
    c.textAlign = "right";
    c.fillText(st.category, w * 0.96, h - h * 0.02, w * 0.22);
  }
}

function quote(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  px: number,
  col: string
) {
  c.font = F(900, px);
  c.fillStyle = col;
  c.textBaseline = "top";
  c.textAlign = "left";
  c.fillText("\u201C", x, y);
}

function headlineLines(
  c: CanvasRenderingContext2D,
  s: string,
  b: Box,
  px: number,
  color: string,
  wt = 900,
  align: CanvasTextAlign = "center"
) {
  const lines = s.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return;

  let size = px;
  c.font = F(wt, size);

  while (
    size > 14 &&
    lines.some((line) => c.measureText(line).width > b.w)
  ) {
    size -= 1;
    c.font = F(wt, size);
  }

  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = "middle";

  const lh = size * 1.35;
  const total = lines.length * lh;
  let y = b.y + Math.max(0, (b.h - total) / 2) + lh / 2;

  for (const line of lines) {
    c.fillText(
      line,
      align === "left" ? b.x : align === "right" ? b.x + b.w : b.x + b.w / 2,
      y,
      b.w
    );
    y += lh;
  }
}

export function draw(
  c: CanvasRenderingContext2D,
  st: Card,
  im: Imgs
) {
  const [w, h] = st.size;
  const m = w * 0.05;
  const tall = h >= w;

  c.clearRect(0, 0, w, h);
  c.fillStyle = st.bg;
  c.fillRect(0, 0, w, h);

  switch (st.tpl) {
    case "light": {
      const py = h * (tall ? 0.5 : 0.45);

      photo(c, im, { x: 0, y: py, w, h: h - py }, st, "#6b7f99", false);

      c.fillStyle = st.accent;
      c.fillRect(m, h * 0.1, w * 0.12, h * 0.008);
      quote(c, m, h * 0.1, w * 0.2, st.accent);

      text(
        c, st.text,
        { x: m, y: h * 0.17, w: w - 2 * m, h: py - h * 0.2 },
        st, st.color, st.accent
      );

      speaker(c, im, w, h, st, 0.62, 0.5, h * 0.9);
      c.fillStyle = "rgba(255,255,255,.92)";
      c.fillRect(0, h * 0.9, w, h * 0.1);

      nameBlock(c, st, { x: m, y: h * 0.905, w: w - 2 * m, h: h * 0.08 }, st.color, st.accent);
      logo(c, im, w, st, h * 0.025);
      break;
    }

    case "dark": {
      const g = c.createRadialGradient(w / 2, h * 0.25, 10, w / 2, h * 0.25, w);
      g.addColorStop(0, "#16336b");
      g.addColorStop(1, st.bg);
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);

      const py = h * 0.56;
      photo(c, im, { x: 0, y: py, w, h: h - py }, st, "#1b3a74", false);
      quote(c, m, h * 0.06, w * 0.34, st.accent);

      text(c, st.text, { x: m, y: h * 0.17, w: w - 2 * m, h: py - h * 0.2 }, st, st.color, st.accent);
      speaker(c, im, w, h, st, 0.62, 0.5, h * 0.9);

      c.fillStyle = st.accent;
      c.fillRect(0, h * 0.9, w, h * 0.1);
      nameBlock(c, st, { x: m, y: h * 0.905, w: w - 2 * m, h: h * 0.08 }, "#0b1f44", "#0b1f44");
      logo(c, im, w, st, h * 0.025);
      break;
    }

    case "split": {
      const py = h * 0.48;
      c.fillStyle = "#f2f2f2";
      c.fillRect(0, 0, w, py);
      c.fillStyle = st.accent;
      c.fillRect(0, 0, w * 0.025, py);

      photo(c, im, { x: 0, y: py, w, h: h - py }, st, "#555", false);
      text(c, st.text, { x: m * 1.4, y: h * 0.1, w: w - 2.6 * m, h: py - h * 0.12 }, st, st.color, st.accent);
      speaker(c, im, w, h, st, 0.62, 0.5, h * 0.93);

      c.fillStyle = st.accent;
      c.fillRect(0, h * 0.9, w, h * 0.1);
      nameBlock(c, st, { x: m, y: h * 0.905, w: w - 2 * m, h: h * 0.08 }, "#fff", "#fff");
      logo(c, im, w, st, h * 0.025);
      break;
    }

    case "breaking": {
      // Reference design: photo on top, red title panel below.
      const photoH = h * 0.65;

      photo(c, im, { x: 0, y: 0, w, h: photoH }, st, "#333", false);

      c.fillStyle = "#ed0808";
      c.fillRect(0, photoH, w, h * 0.055);

      c.fillStyle = "#a90000";
      c.fillRect(0, photoH + h * 0.055, w, h * 0.295);

      // Subtle dot pattern
      c.save();
      c.globalAlpha = 0.12;
      c.fillStyle = "#ffb0b0";
      for (let yy = photoH + h * 0.08; yy < h * 0.93; yy += h * 0.018) {
        for (let xx = w * 0.03; xx < w * 0.97; xx += w * 0.018) {
          c.beginPath();
          c.arc(xx, yy, Math.max(1, w * 0.002), 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();

      // Centered channel logo on the red divider
      if (im.logo) {
        const lw = w * 0.19 * (st.logoS || 1);
        const lh = (lw * im.logo.height) / im.logo.width;
        c.drawImage(im.logo, (w - lw) / 2, photoH + h * 0.055 - lh * 0.45, lw, lh);
      }

      headlineLines(
        c,
        st.text || "এখানে সংবাদ শিরোনাম লিখুন",
        { x: m * 0.6, y: photoH + h * 0.075, w: w - 1.2 * m, h: h * 0.21 },
        st.fontSize || w * 0.055,
        "#ffffff"
      );

      c.fillStyle = "#480000";
      c.fillRect(0, h * 0.95, w, h * 0.05);

      c.font = F(400, w * 0.023);
      c.fillStyle = "#ffffff";
      c.textBaseline = "middle";
      c.textAlign = "left";
      c.fillText(st.date || "", m, h * 0.975, w * 0.5);
      c.textAlign = "right";
      c.fillText(st.source || "", w - m, h * 0.975, w * 0.5);
      break;
    }

    case "headphoto": {
      const ty = h * 0.4;
      c.fillStyle = st.accent;
      c.fillRect(0, 0, w, h * 0.012);

      text(c, st.text, { x: m, y: h * 0.04, w: w - 2 * m, h: ty - h * 0.06 }, st, st.color, st.accent);
      photo(c, im, { x: 0, y: ty, w, h: h - ty }, st, "#667", false);

      if (im.speaker) speaker(c, im, w, h, st, 0.58, 0.5, h * 0.93);

      c.fillStyle = "rgba(0,0,0,.6)";
      c.fillRect(0, h * 0.9, w, h * 0.1);
      nameBlock(c, st, { x: m, y: h * 0.905, w: w - 2 * m, h: h * 0.08 }, "#fff", "#ddd");
      logo(c, im, w, st, h * 0.025);
      break;
    }

    case "white-headline": {
      // White newspaper-style headline with red first line and blue second line.
      c.fillStyle = "#e7eff7";
      c.fillRect(0, 0, w, h * 0.30);
      c.fillStyle = "#ffffff";
      c.fillRect(0, h * 0.025, w, h * 0.27);

      logo(c, im, w, { ...st, logoPos: "tr" }, h * 0.035);

      const lines = (st.text || "এখানে সংবাদ শিরোনাম লিখুন").split("\n");
      const first = lines.slice(0, 1).join("");
      const rest = lines.slice(1).join(" ") || "";

      headlineLines(
        c,
        first,
        { x: m * 0.55, y: h * 0.075, w: w - m * 1.1, h: h * 0.09 },
        st.fontSize || w * 0.052,
        "#c40018"
      );

      if (rest) {
        headlineLines(
          c,
          rest,
          { x: m * 0.7, y: h * 0.16, w: w - m * 1.4, h: h * 0.12 },
          (st.fontSize || w * 0.052) * 0.94,
          "#252b78"
        );
      }

      photo(c, im, { x: 0, y: h * 0.30, w, h: h * 0.70 }, st, "#777", false);

      if (im.speaker) {
        speaker(c, im, w, h, st, 0.53, 0.5, h * 0.96);
      }
      break;
    }

    default: {
      c.fillStyle = st.accent;
      c.fillRect(m, h * 0.08, w * 0.08, h * 0.008);

      text(c, st.text, { x: m, y: h * 0.12, w: w * (tall ? 0.9 : 0.55) - m, h: h * 0.5 }, st, st.color, st.accent);

      if (!tall) {
        photo(c, im, { x: w * 0.6, y: 0, w: w * 0.4, h }, st, "#ddd", false);
      }

      speaker(c, im, w, h, st, 0.6, tall ? 0.7 : 0.8, h * 0.88);
      nameBlock(c, st, { x: m, y: h * 0.75, w: w * 0.55, h: h * 0.11 }, st.color, st.accent);
      logo(c, im, w, st, h * 0.025);
    }
  }

  if (!["breaking", "white-headline"].includes(st.tpl)) {
    meta(
      c,
      st,
      w,
      h,
      ["dark", "split", "headphoto"].includes(st.tpl) ? "#fff" : st.color
    );
  }
}

export async function exportCard(
  st: Card,
  im: Imgs,
  type: "image/png" | "image/jpeg",
  k: number
): Promise<Blob> {
  await document.fonts.load(F(900, 40), "আবগ");
  await document.fonts.ready;

  const cv = document.createElement("canvas");
  cv.width = st.size[0] * k;
  cv.height = st.size[1] * k;

  const c = cv.getContext("2d");

  if (!c) {
    throw new Error("Canvas context তৈরি করা যায়নি।");
  }

  c.scale(k, k);

  if (type === "image/jpeg") {
    c.fillStyle = "#fff";
    c.fillRect(0, 0, st.size[0], st.size[1]);
  }

  draw(c, st, im);

  return new Promise((resolve, reject) => {
    cv.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Export failed"));
        }
      },
      type,
      0.95
    );
  });
}

  text: string;
  name: string;
  role: string;
  date: string;
  source: string;
  category: string;
  fontSize: number;
  align: CanvasTextAlign;
  accent: string;
  bg: string;
  color: string;
  overlay: number;
  spX: number;
  spY: number;
  spS: number;
  bgX: number;
  bgY: number;
  bgS: number;
  logoPos: "tl" | "tr";
  logoS: number;
}

export interface Imgs {
  speaker: HTMLImageElement | null;
  photo: HTMLImageElement | null;
  logo: HTMLImageElement | null;
}

export interface Tpl {
  id: string;
  name: string;
  category: string;
  bg: string;
  accent: string;
  color: string;
}

export const TEMPLATES: Tpl[] = [
  {
    id: "light",
    name: "Premium Speaker – Light Editorial",
    category: "Speaker",
    bg: "#e8f0f8",
    accent: "#d62828",
    color: "#0b2a55",
  },
  {
    id: "dark",
    name: "Premium Speaker – Dark Premium",
    category: "Speaker",
    bg: "#0b1f44",
    accent: "#f4c430",
    color: "#ffffff",
  },
  {
    id: "split",
    name: "Premium Speaker – Split Editorial",
    category: "Speaker",
    bg: "#ffffff",
    accent: "#d62828",
    color: "#111111",
  },
  {
    id: "breaking",
    name: "Breaking News",
    category: "Breaking",
    bg: "#111111",
    accent: "#e11d1d",
    color: "#ffffff",
  },
  {
    id: "headphoto",
    name: "Bold Headline over Photo",
    category: "Headline",
    bg: "#ffffff",
    accent: "#d62828",
    color: "#0b2a55",
  },
  {
    id: "minimal",
    name: "Minimalist Speaker Right",
    category: "Minimal",
    bg: "#f6f6f2",
    accent: "#1d4ed8",
    color: "#111111",
  },
];

const FONT =
  '"Noto Serif Bengali","Noto Sans Bengali","Kalpurush",serif';

const F = (wt: number, px: number) =>
  `${wt} ${Math.round(px)}px ${FONT}`;

type W = { t: string; a: boolean };

const parse = (s: string): W[] =>
  s
    .split("*")
    .flatMap((p, i) =>
      p
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => ({ t, a: i % 2 === 1 }))
    );

type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
};

function lay(
  c: CanvasRenderingContext2D,
  ws: W[],
  maxW: number,
  px: number,
  wt: number
) {
  c.font = F(wt, px);
  const sp = c.measureText(" ").width;
  const lines: { ws: W[]; w: number }[] = [];
  let cur: W[] = [];
  let cw = 0;

  for (const w of ws) {
    const ww = c.measureText(w.t).width;

    if (cur.length && cw + sp + ww > maxW) {
      lines.push({ ws: cur, w: cw });
      cur = [];
      cw = 0;
    }

    cw += (cur.length ? sp : 0) + ww;
    cur.push(w);
  }

  if (cur.length) {
    lines.push({ ws: cur, w: cw });
  }

  return { lines, sp };
}

export function text(
  c: CanvasRenderingContext2D,
  s: string,
  b: Box,
  st: Card,
  col: string,
  acc: string,
  wt = 900,
  align = st.align,
  start = st.fontSize
) {
  const ws = parse(s);
  if (!ws.length) return;

  let px = start;
  let r = lay(c, ws, b.w, px, wt);

  while (
    px > 18 &&
    (
      r.lines.length * px * 1.32 > b.h ||
      r.lines.some((l) => l.w > b.w)
    )
  ) {
    px -= 2;
    r = lay(c, ws, b.w, px, wt);
  }

  c.font = F(wt, px);
  c.textBaseline = "top";
  c.textAlign = "left";

  const lh = px * 1.32;
  const top =
    b.y + Math.max(0, (b.h - r.lines.length * lh) / 2);

  r.lines.forEach((l, i) => {
    let x =
      align === "center"
        ? b.x + (b.w - l.w) / 2
        : align === "right"
          ? b.x + b.w - l.w
          : b.x;

    for (const w of l.ws) {
      c.fillStyle = w.a ? acc : col;
      c.fillText(w.t, x, top + i * lh);
      x += c.measureText(w.t).width + r.sp;
    }
  });
}

function cover(
  c: CanvasRenderingContext2D,
  im: HTMLImageElement,
  b: Box,
  z: number,
  px: number,
  py: number
) {
  const k = Math.max(b.w / im.width, b.h / im.height) * z;
  const dw = im.width * k;
  const dh = im.height * k;

  c.save();
  c.beginPath();
  c.rect(b.x, b.y, b.w, b.h);
  c.clip();

  c.drawImage(
    im,
    b.x + (b.w - dw) / 2 + px * b.w,
    b.y + (b.h - dh) / 2 + py * b.h,
    dw,
    dh
  );

  c.restore();
}

function photo(
  c: CanvasRenderingContext2D,
  im: Imgs,
  b: Box,
  st: Card,
  fallback: string
) {
  if (im.photo) {
    cover(c, im.photo, b, st.bgS, st.bgX, st.bgY);
  } else {
    const g = c.createLinearGradient(
      0,
      b.y,
      0,
      b.y + b.h
    );

    g.addColorStop(0, fallback);
    g.addColorStop(1, "#000");

    c.fillStyle = g;
    c.fillRect(b.x, b.y, b.w, b.h);
  }

  const g = c.createLinearGradient(
    0,
    b.y,
    0,
    b.y + b.h
  );

  g.addColorStop(
    0,
    `rgba(0,0,0,${st.overlay * 0.4})`
  );
  g.addColorStop(
    1,
    `rgba(0,0,0,${st.overlay})`
  );

  c.fillStyle = g;
  c.fillRect(b.x, b.y, b.w, b.h);
}

function speaker(
  c: CanvasRenderingContext2D,
  im: Imgs,
  w: number,
  h: number,
  st: Card,
  hFrac: number,
  cxFrac: number,
  bottom: number
) {
  const s = im.speaker;
  if (!s) return;

  const hh = h * hFrac * st.spS;
  const ww = (hh * s.width) / s.height;

  c.drawImage(
    s,
    w * cxFrac - ww / 2 + st.spX * w,
    bottom - hh + st.spY * h,
    ww,
    hh
  );
}

function logo(
  c: CanvasRenderingContext2D,
  im: Imgs,
  w: number,
  st: Card,
  y: number
) {
  const l = im.logo;
  if (!l) return;

  const lw = w * 0.2 * st.logoS;
  const lh = (lw * l.height) / l.width;
  const m = w * 0.04;

  c.drawImage(
    l,
    st.logoPos === "tr" ? w - m - lw : m,
    y,
    lw,
    lh
  );
}

function nameBlock(
  c: CanvasRenderingContext2D,
  st: Card,
  b: Box,
  col: string,
  sub: string
) {
  const px = b.h * 0.5;

  text(
    c,
    st.name,
    { x: b.x, y: b.y, w: b.w, h: px * 1.4 },
    st,
    col,
    col,
    900,
    st.align,
    px
  );

  text(
    c,
    st.role,
    {
      x: b.x,
      y: b.y + px * 1.4,
      w: b.w,
      h: b.h - px * 1.4,
    },
    st,
    sub,
    sub,
    400,
    st.align,
    px * 0.6
  );
}

function meta(
  c: CanvasRenderingContext2D,
  st: Card,
  w: number,
  h: number,
  col: string
) {
  c.font = F(400, w * 0.022);
  c.fillStyle = col;
  c.textBaseline = "alphabetic";
  c.textAlign = "left";

  const s = [st.date, st.source]
    .filter(Boolean)
    .join("   |   ");

  if (s) {
    c.fillText(s, w * 0.04, h - h * 0.02);
  }

  if (st.category) {
    c.textAlign = "right";
    c.fillText(st.category, w * 0.96, h - h * 0.02);
  }
}

function quote(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  px: number,
  col: string
) {
  c.font = F(900, px);
  c.fillStyle = col;
  c.textBaseline = "top";
  c.textAlign = "left";
  c.fillText("\u201C", x, y);
}

export function draw(
  c: CanvasRenderingContext2D,
  st: Card,
  im: Imgs
) {
  const [w, h] = st.size;
  const m = w * 0.05;

  c.clearRect(0, 0, w, h);
  c.fillStyle = st.bg;
  c.fillRect(0, 0, w, h);

  const tall = h >= w;

  switch (st.tpl) {
    case "light": {
      const py = h * (tall ? 0.5 : 0.45);

      photo(
        c, im,
        { x: 0, y: py, w, h: h - py },
        st, "#6b7f99"
      );

      c.fillStyle = st.accent;
      c.fillRect(m, h * 0.1, w * 0.12, h * 0.008);

      quote(c, m, h * 0.1, w * 0.2, st.accent);

      text(
        c, st.text,
        { x: m, y: h * 0.17, w: w - 2 * m, h: py - h * 0.2 },
        st, st.color, st.accent
      );

      speaker(c, im, w, h, st, 0.62, 0.5, h * 0.9);

      c.fillStyle = "rgba(255,255,255,.92)";
      c.fillRect(0, h * 0.9, w, h * 0.1);

      nameBlock(
        c, st,
        { x: m, y: h * 0.905, w: w - 2 * m, h: h * 0.08 },
        st.color, st.accent
      );

      logo(c, im, w, st, h * 0.025);
      break;
    }

    case "dark": {
      const g = c.createRadialGradient(
        w / 2, h * 0.25, 10,
        w / 2, h * 0.25, w
      );

      g.addColorStop(0, "#16336b");
      g.addColorStop(1, st.bg);

      c.fillStyle = g;
      c.fillRect(0, 0, w, h);

      c.globalAlpha = 0.07;
      c.font = F(900, w * 0.7);
      c.fillStyle = "#fff";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("\u2605", w / 2, h * 0.3);
      c.globalAlpha = 1;

      const py = h * 0.56;

      photo(
        c, im,
        { x: 0, y: py, w, h: h - py },
        st, "#1b3a74"
      );

      quote(c, m, h * 0.06, w * 0.34, st.accent);

      text(
        c, st.text,
        { x: m, y: h * 0.17, w: w - 2 * m, h: py - h * 0.2 },
        st, st.color, st.accent
      );

      speaker(c, im, w, h, st, 0.62, 0.5, h * 0.9);

      c.fillStyle = st.accent;
      c.fillRect(0, h * 0.9, w, h * 0.1);

      nameBlock(
        c, st,
        { x: m, y: h * 0.905, w: w - 2 * m, h: h * 0.08 },
        "#0b1f44", "#0b1f44"
      );

      logo(c, im, w, st, h * 0.025);
      break;
    }

    case "split": {
      const py = h * 0.48;

      c.fillStyle = "#f2f2f2";
      c.fillRect(0, 0, w, py);

      c.fillStyle = st.accent;
      c.fillRect(0, 0, w * 0.025, py);

      photo(
        c, im,
        { x: 0, y: py, w, h: h - py },
        st, "#555"
      );

      text(
        c, st.text,
        { x: m * 1.4, y: h * 0.1, w: w - 2.6 * m, h: py - h * 0.12 },
        st, st.color, st.accent
      );

      speaker(c, im, w, h, st, 0.62, 0.5, h * 0.93);

      c.fillStyle = st.accent;
      c.fillRect(0, h * 0.9, w, h * 0.1);

      nameBlock(
        c, st,
        { x: m, y: h * 0.905, w: w - 2 * m, h: h * 0.08 },
        "#fff", "#fff"
      );

      logo(c, im, w, st, h * 0.025);
      break;
    }

    case "breaking": {
      photo(
        c, im,
        { x: 0, y: 0, w, h },
        { ...st, overlay: Math.max(st.overlay, 0.4) },
        "#333"
      );

      if (im.speaker) {
        speaker(c, im, w, h, st, 0.6, 0.5, h * 0.62);
      }

      c.fillStyle = st.accent;
      c.fillRect(0, h * 0.62, w, h * 0.07);

      text(
        c, st.category || "ব্রেকিং নিউজ",
        { x: m, y: h * 0.62, w: w - 2 * m, h: h * 0.07 },
        st, "#fff", "#fff", 900, "left", h * 0.05
      );

      c.fillStyle = "rgba(0,0,0,.85)";
      c.fillRect(0, h * 0.69, w, h * 0.31);

      text(
        c, st.text,
        { x: m, y: h * 0.71, w: w - 2 * m, h: h * 0.2 },
        st, st.color, "#ffd23f"
      );

      nameBlock(
        c, st,
        { x: m, y: h * 0.915, w: w - 2 * m, h: h * 0.055 },
        "#fff", "#ccc"
      );

      logo(c, im, w, st, h * 0.025);
      break;
    }

    case "headphoto": {
      const ty = h * 0.4;

      c.fillStyle = st.accent;
      c.fillRect(0, 0, w, h * 0.012);

      text(
        c, st.text,
        { x: m, y: h * 0.04, w: w - 2 * m, h: ty - h * 0.06 },
        st, st.color, st.accent
      );

      photo(
        c, im,
        { x: 0, y: ty, w, h: h - ty },
        st, "#667"
      );

      if (im.speaker) {
        speaker(c, im, w, h, st, 0.58, 0.5, h * 0.93);
      }

      c.fillStyle = "rgba(0,0,0,.6)";
      c.fillRect(0, h * 0.9, w, h * 0.1);

      nameBlock(
        c, st,
        { x: m, y: h * 0.905, w: w - 2 * m, h: h * 0.08 },
        "#fff", "#ddd"
      );

      logo(c, im, w, st, ty + h * 0.02);
      break;
    }

    default: {
      c.fillStyle = st.accent;
      c.fillRect(m, h * 0.08, w * 0.08, h * 0.008);

      text(
        c, st.text,
        {
          x: m,
          y: h * 0.12,
          w: w * (tall ? 0.9 : 0.55) - m,
          h: h * 0.5,
        },
        st, st.color, st.accent
      );

      if (!tall) {
        photo(
          c, im,
          { x: w * 0.6, y: 0, w: w * 0.4, h },
          st, "#ddd"
        );
      }

      speaker(
        c, im, w, h, st,
        0.6, tall ? 0.7 : 0.8, h * 0.88
      );

      nameBlock(
        c, st,
        { x: m, y: h * 0.75, w: w * 0.55, h: h * 0.11 },
        st.color, st.accent
      );

      logo(c, im, w, st, h * 0.025);
    }
  }

  meta(
    c, st, w, h,
    ["dark", "breaking", "split", "headphoto"].includes(st.tpl)
      ? "#fff"
      : st.color
  );
}

export async function exportCard(
  st: Card,
  im: Imgs,
  type: "image/png" | "image/jpeg",
  k: number
): Promise<Blob> {
  await document.fonts.load(F(900, 40), "আবগ");
  await document.fonts.ready;

  const cv = document.createElement("canvas");
  cv.width = st.size[0] * k;
  cv.height = st.size[1] * k;

  const c = cv.getContext("2d");

  if (!c) {
    throw new Error("Canvas context তৈরি করা যায়নি।");
  }

  c.scale(k, k);

  if (type === "image/jpeg") {
    c.fillStyle = "#fff";
    c.fillRect(0, 0, st.size[0], st.size[1]);
  }

  draw(c, st, im);

  return new Promise((resolve, reject) => {
    cv.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Export failed"));
        }
      },
      type,
      0.95
    );
  });
}

