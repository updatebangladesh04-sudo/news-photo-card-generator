
import { useEffect, useRef, useState } from 'react';
import { Card, Imgs, TEMPLATES, draw, exportCard } from '../render';

const CREDIT = 'এই ওয়েবসাইট তৈরি করেছেন: আসাদুল্লাহ গালিভ আল সাদি';

const SIZES: Record<string, [number, number]> = {
  '1080×1350': [1080, 1350],
  '1080×1080': [1080, 1080],
  '1200×675': [1200, 675],
  '1080×1920': [1080, 1920],
};

const today = () =>
  new Date().toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const INIT: Card = {
  tpl: 'light',
  size: [1080, 1350],
  text: 'নমুনা বক্তব্য: এখানে আপনার *মূল বক্তব্য* লিখুন, তারকা চিহ্নের ভেতরের অংশ রঙিন হবে',
  name: 'নমুনা নাম',
  role: 'নমুনা পদবি',
  date: today(),
  source: '',
  category: '',
  fontSize: 110,
  align: 'left',
  accent: '#d62828',
  bg: '#e8f0f8',
  color: '#0b2a55',
  overlay: 0.3,
  spX: 0,
  spY: 0,
  spS: 1,
  bgX: 0,
  bgY: 0,
  bgS: 1,
  logoPos: 'tr',
  logoS: 1,
};

const MAX = 15 * 1024 * 1024;

export default function App() {
  const [st, setSt] = useState<Card>(INIT);
  const [im, setIm] = useState<Imgs>({
    speaker: null,
    photo: null,
    logo: null,
  });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const cv = useRef<HTMLCanvasElement>(null);

  const set = <K extends keyof Card>(k: K, v: Card[K]) => {
    setSt((s) => ({ ...s, [k]: v }));
  };

  useEffect(() => {
    const c = cv.current;
    if (!c) return;

    c.width = st.size[0];
    c.height = st.size[1];

    const ctx = c.getContext('2d');
    if (!ctx) return;

    draw(ctx, st, im);
    document.fonts.ready.then(() => {
      draw(ctx, st, im);
    });
  }, [st, im]);

  const pick = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;

    setSt((s) => ({
      ...s,
      tpl: id,
      bg: t.bg,
      accent: t.accent,
      color: t.color,
    }));
  };

  const up = (k: keyof Imgs) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;

      if (!/^image\/(png|jpeg|webp)$/.test(f.type)) {
        setMsg('ত্রুটি: শুধু PNG, JPG বা WebP ফাইল দিন।');
        return;
      }

      if (f.size > MAX) {
        setMsg('ত্রুটি: ফাইল ১৫ MB এর বেশি।');
        return;
      }

      const i = new Image();

      i.onload = () => {
        setIm((o) => ({ ...o, [k]: i }));
        setMsg('ছবি যুক্ত হয়েছে।');
      };

      i.onerror = () => {
        setMsg('ত্রুটি: ছবি পড়া যায়নি।');
      };

      i.src = URL.createObjectURL(f);
    };

  const dl = async (
    type: 'image/png' | 'image/jpeg',
    scale: number,
  ) => {
    setBusy(true);

    try {
      const b = await exportCard(st, im, type, scale);
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');

      a.href = url;
      a.download = `news-card.${type === 'image/png' ? 'png' : 'jpg'}`;
      a.click();

      URL.revokeObjectURL(url);
      setMsg('ডাউনলোড সম্পন্ন।');
    } catch {
      setMsg('ত্রুটি: এক্সপোর্ট ব্যর্থ।');
    } finally {
      setBusy(false);
    }
  };

  const R = (
    label: string,
    k:
      | 'spX'
      | 'spY'
      | 'spS'
      | 'bgX'
      | 'bgY'
      | 'bgS'
      | 'overlay'
      | 'logoS'
      | 'fontSize',
    min: number,
    max: number,
    step: number,
  ) => (
    <label key={k}>
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={st[k]}
        onChange={(e) => set(k, Number(e.target.value))}
      />
    </label>
  );

  const list = TEMPLATES.filter((t) =>
    (t.name + t.category).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <header>
        <h1>নিউজ ফটোকার্ড জেনারেটর</h1>
        <span className="tag">নমুনা কনটেন্ট দেখানো হচ্ছে</span>
      </header>

      <main>
        <section className="panel">
          <h2>টেমপ্লেট</h2>

          <input
            placeholder="টেমপ্লেট খুঁজুন"
            aria-label="টেমপ্লেট খুঁজুন"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="gal">
            {list.map((t) => (
              <button
                key={t.id}
                className={t.id === st.tpl ? 'on' : ''}
                onClick={() => pick(t.id)}
                style={{ borderLeftColor: t.accent }}
              >
                <b>{t.name}</b>
                <small>{t.category}</small>
              </button>
            ))}
          </div>

          <h2>কনটেন্ট</h2>

          <label>
            বক্তব্য / শিরোনাম (*শব্দ* = রঙিন)
            <textarea
              rows={4}
              value={st.text}
              onChange={(e) => set('text', e.target.value)}
            />
          </label>

          <label>
            নাম
            <input
              value={st.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </label>

          <label>
            পদবি
            <input
              value={st.role}
              onChange={(e) => set('role', e.target.value)}
            />
          </label>

          <label>
            তারিখ
            <span className="row">
              <input
                value={st.date}
                onChange={(e) => set('date', e.target.value)}
              />
              <button onClick={() => set('date', today())}>আজ</button>
            </span>
          </label>

          <label>
            সূত্র / ওয়েবসাইট
            <input
              value={st.source}
              onChange={(e) => set('source', e.target.value)}
            />
          </label>

          <label>
            ক্যাটাগরি
            <input
              value={st.category}
              onChange={(e) => set('category', e.target.value)}
            />
          </label>

          <h2>মিডিয়া</h2>

          <label>
            স্পিকার পোর্ট্রেট
            <input
              type="file"
              accept="image/png,image/webp"
              onChange={up('speaker')}
            />
          </label>

          {R('স্পিকার অনুভূমিক', 'spX', -0.5, 0.5, 0.005)}
          {R('স্পিকার উল্লম্ব', 'spY', -0.3, 0.3, 0.005)}
          {R('স্পিকার স্কেল', 'spS', 0.4, 1.8, 0.01)}

          <button
            onClick={() =>
              setSt((s) => ({ ...s, spX: 0, spY: 0, spS: 1 }))
            }
          >
            স্পিকার রিসেট
          </button>

          <label>
            ব্যাকগ্রাউন্ড ছবি
            <input
              type="file"
              accept="image/*"
              onChange={up('photo')}
            />
          </label>

          {R('ব্যাকগ্রাউন্ড X', 'bgX', -0.5, 0.5, 0.005)}
          {R('ব্যাকগ্রাউন্ড Y', 'bgY', -0.5, 0.5, 0.005)}
          {R('জুম', 'bgS', 1, 3, 0.01)}
          {R('ওভারলে', 'overlay', 0, 0.9, 0.01)}

          <label>
            লোগো
            <input
              type="file"
              accept="image/png,image/webp,image/jpeg"
              onChange={up('logo')}
            />
          </label>

          <label>
            লোগো অবস্থান
            <select
              value={st.logoPos}
              onChange={(e) =>
                set('logoPos', e.target.value as 'tl' | 'tr')
              }
            >
              <option value="tr">ডান-উপর</option>
              <option value="tl">বাম-উপর</option>
            </select>
          </label>

          {R('লোগো আকার', 'logoS', 0.4, 2.5, 0.05)}

          <h2>স্টাইল</h2>

          {R('ফন্ট সাইজ', 'fontSize', 30, 180, 2)}

          <label>
            অ্যালাইনমেন্ট
            <select
              value={st.align}
              onChange={(e) =>
                set('align', e.target.value as CanvasTextAlign)
              }
            >
              <option value="left">বাম</option>
              <option value="center">মাঝ</option>
              <option value="right">ডান</option>
            </select>
          </label>

          <div className="row">
            <label>
              ব্যাকগ্রাউন্ড
              <input
                type="color"
                value={st.bg}
                onChange={(e) => set('bg', e.target.value)}
              />
            </label>

            <label>
              অ্যাকসেন্ট
              <input
                type="color"
                value={st.accent}
                onChange={(e) => set('accent', e.target.value)}
              />
            </label>

            <label>
              লেখা
              <input
                type="color"
                value={st.color}
                onChange={(e) => set('color', e.target.value)}
              />
            </label>
          </div>

          <label>
            সাইজ
            <select
              value={`${st.size[0]}×${st.size[1]}`}
              onChange={(e) => set('size', SIZES[e.target.value])}
            >
              {Object.keys(SIZES).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="prev">
          <canvas ref={cv} aria-label="লাইভ প্রিভিউ" />

          <div className="row">
            <button disabled={busy} onClick={() => dl('image/png', 1)}>
              PNG
            </button>
            <button disabled={busy} onClick={() => dl('image/jpeg', 1)}>
              JPEG
            </button>
            <button disabled={busy} onClick={() => dl('image/png', 2)}>
              PNG ২x
            </button>
            <button
              onClick={() => {
                setSt(INIT);
                setIm({ speaker: null, photo: null, logo: null });
                setMsg('');
              }}
            >
              রিসেট
            </button>
          </div>

          <p role="status">{busy ? 'এক্সপোর্ট হচ্ছে…' : msg}</p>
          <small className="cr">{CREDIT}</small>
        </section>
      </main>

      <section className="about">
        <h2>পরিচিতি</h2>
        <p>
          এটি বাংলা নিউজ ফটোকার্ড তৈরির একটি ওয়েব টুল।
          ছবি, লোগো ও বক্তব্য দিলেই কার্ড তৈরি হয়।
        </p>
        <p>{CREDIT}</p>
      </section>

      <footer>{CREDIT}</footer>
    </>
  );
}
