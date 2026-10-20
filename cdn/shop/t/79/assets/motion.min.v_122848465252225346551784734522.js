/**
 * Bundled by jsDelivr using Rollup v2.79.1 and Terser v5.19.2.
 * Original file: /npm/motion@11.11.13/dist/es/motion/lib/index.mjs
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
function t(t, e) {
  const n = t.indexOf(e);
  n > -1 && t.splice(n, 1);
}
class e {
  constructor() {
    this.subscriptions = [];
  }
  add(e) {
    var n, s;
    return (
      (n = this.subscriptions),
      (s = e),
      -1 === n.indexOf(s) && n.push(s),
      () => t(this.subscriptions, e)
    );
  }
  notify(t, e, n) {
    const s = this.subscriptions.length;
    if (s)
      if (1 === s) this.subscriptions[0](t, e, n);
      else
        for (let i = 0; i < s; i++) {
          const s = this.subscriptions[i];
          s && s(t, e, n);
        }
  }
  getSize() {
    return this.subscriptions.length;
  }
  clear() {
    this.subscriptions.length = 0;
  }
}
function n(t, e) {
  return e ? t * (1e3 / e) : 0;
}
const s = !1,
  i = (t) => t;
const r = [
  'read',
  'resolveKeyframes',
  'update',
  'preRender',
  'render',
  'postRender',
];
const {
  schedule: o,
  cancel: a,
  state: l,
  steps: u,
} = (function (t, e) {
  let n = !1,
    s = !0;
  const i = { delta: 0, timestamp: 0, isProcessing: !1 },
    o = () => (n = !0),
    a = r.reduce(
      (t, e) => (
        (t[e] = (function (t) {
          let e = new Set(),
            n = new Set(),
            s = !1,
            i = !1;
          const r = new WeakSet();
          let o = { delta: 0, timestamp: 0, isProcessing: !1 };
          function a(e) {
            r.has(e) && (l.schedule(e), t()), e(o);
          }
          const l = {
            schedule: (t, i = !1, o = !1) => {
              const a = o && s ? e : n;
              return i && r.add(t), a.has(t) || a.add(t), t;
            },
            cancel: (t) => {
              n.delete(t), r.delete(t);
            },
            process: (t) => {
              (o = t),
                s
                  ? (i = !0)
                  : ((s = !0),
                    ([e, n] = [n, e]),
                    n.clear(),
                    e.forEach(a),
                    (s = !1),
                    i && ((i = !1), l.process(t)));
            },
          };
          return l;
        })(o)),
        t
      ),
      {}
    ),
    {
      read: l,
      resolveKeyframes: u,
      update: c,
      preRender: h,
      render: d,
      postRender: p,
    } = a,
    f = () => {
      const r = performance.now();
      (n = !1),
        (i.delta = s ? 1e3 / 60 : Math.max(Math.min(r - i.timestamp, 40), 1)),
        (i.timestamp = r),
        (i.isProcessing = !0),
        l.process(i),
        u.process(i),
        c.process(i),
        h.process(i),
        d.process(i),
        p.process(i),
        (i.isProcessing = !1),
        n && e && ((s = !1), t(f));
    };
  return {
    schedule: r.reduce((e, r) => {
      const o = a[r];
      return (
        (e[r] = (e, r = !1, a = !1) => (
          n || ((n = !0), (s = !0), i.isProcessing || t(f)), o.schedule(e, r, a)
        )),
        e
      );
    }, {}),
    cancel: (t) => {
      for (let e = 0; e < r.length; e++) a[r[e]].cancel(t);
    },
    state: i,
    steps: a,
  };
})('undefined' != typeof requestAnimationFrame ? requestAnimationFrame : i, !0);
let c;
function h() {
  c = void 0;
}
const d = {
  now: () => (
    void 0 === c &&
      d.set(l.isProcessing || s ? l.timestamp : performance.now()),
    c
  ),
  set: (t) => {
    (c = t), queueMicrotask(h);
  },
};
class p {
  constructor(t, e = {}) {
    (this.version = '11.11.13'),
      (this.canTrackVelocity = null),
      (this.events = {}),
      (this.updateAndNotify = (t, e = !0) => {
        const n = d.now();
        this.updatedAt !== n && this.setPrevFrameValue(),
          (this.prev = this.current),
          this.setCurrent(t),
          this.current !== this.prev &&
            this.events.change &&
            this.events.change.notify(this.current),
          e &&
            this.events.renderRequest &&
            this.events.renderRequest.notify(this.current);
      }),
      (this.hasAnimated = !1),
      this.setCurrent(t),
      (this.owner = e.owner);
  }
  setCurrent(t) {
    var e;
    (this.current = t),
      (this.updatedAt = d.now()),
      null === this.canTrackVelocity &&
        void 0 !== t &&
        (this.canTrackVelocity = ((e = this.current), !isNaN(parseFloat(e))));
  }
  setPrevFrameValue(t = this.current) {
    (this.prevFrameValue = t), (this.prevUpdatedAt = this.updatedAt);
  }
  onChange(t) {
    return this.on('change', t);
  }
  on(t, n) {
    this.events[t] || (this.events[t] = new e());
    const s = this.events[t].add(n);
    return 'change' === t
      ? () => {
          s(),
            o.read(() => {
              this.events.change.getSize() || this.stop();
            });
        }
      : s;
  }
  clearListeners() {
    for (const t in this.events) this.events[t].clear();
  }
  attach(t, e) {
    (this.passiveEffect = t), (this.stopPassiveEffect = e);
  }
  set(t, e = !0) {
    e && this.passiveEffect
      ? this.passiveEffect(t, this.updateAndNotify)
      : this.updateAndNotify(t, e);
  }
  setWithVelocity(t, e, n) {
    this.set(e),
      (this.prev = void 0),
      (this.prevFrameValue = t),
      (this.prevUpdatedAt = this.updatedAt - n);
  }
  jump(t, e = !0) {
    this.updateAndNotify(t),
      (this.prev = t),
      (this.prevUpdatedAt = this.prevFrameValue = void 0),
      e && this.stop(),
      this.stopPassiveEffect && this.stopPassiveEffect();
  }
  get() {
    return this.current;
  }
  getPrevious() {
    return this.prev;
  }
  getVelocity() {
    const t = d.now();
    if (
      !this.canTrackVelocity ||
      void 0 === this.prevFrameValue ||
      t - this.updatedAt > 30
    )
      return 0;
    const e = Math.min(this.updatedAt - this.prevUpdatedAt, 30);
    return n(parseFloat(this.current) - parseFloat(this.prevFrameValue), e);
  }
  start(t) {
    return (
      this.stop(),
      new Promise((e) => {
        (this.hasAnimated = !0),
          (this.animation = t(e)),
          this.events.animationStart && this.events.animationStart.notify();
      }).then(() => {
        this.events.animationComplete && this.events.animationComplete.notify(),
          this.clearAnimation();
      })
    );
  }
  stop() {
    this.animation &&
      (this.animation.stop(),
      this.events.animationCancel && this.events.animationCancel.notify()),
      this.clearAnimation();
  }
  isAnimating() {
    return !!this.animation;
  }
  clearAnimation() {
    delete this.animation;
  }
  destroy() {
    this.clearListeners(),
      this.stop(),
      this.stopPassiveEffect && this.stopPassiveEffect();
  }
}
function f(t, e) {
  return new p(t, e);
}
function m(t) {
  let e;
  return () => (void 0 === e && (e = t()), e);
}
const g = m(() => void 0 !== window.ScrollTimeline);
class y {
  constructor(t) {
    (this.stop = () => this.runAll('stop')),
      (this.animations = t.filter(Boolean));
  }
  then(t, e) {
    return Promise.all(this.animations).then(t).catch(e);
  }
  getAll(t) {
    return this.animations[0][t];
  }
  setAll(t, e) {
    for (let n = 0; n < this.animations.length; n++) this.animations[n][t] = e;
  }
  attachTimeline(t, e) {
    const n = this.animations.map((n) =>
      g() && n.attachTimeline ? n.attachTimeline(t) : e(n)
    );
    return () => {
      n.forEach((t, e) => {
        t && t(), this.animations[e].stop();
      });
    };
  }
  get time() {
    return this.getAll('time');
  }
  set time(t) {
    this.setAll('time', t);
  }
  get speed() {
    return this.getAll('speed');
  }
  set speed(t) {
    this.setAll('speed', t);
  }
  get startTime() {
    return this.getAll('startTime');
  }
  get duration() {
    let t = 0;
    for (let e = 0; e < this.animations.length; e++)
      t = Math.max(t, this.animations[e].duration);
    return t;
  }
  runAll(t) {
    this.animations.forEach((e) => e[t]());
  }
  play() {
    this.runAll('play');
  }
  pause() {
    this.runAll('pause');
  }
  cancel() {
    this.runAll('cancel');
  }
  complete() {
    this.runAll('complete');
  }
}
const v = (t) => 1e3 * t,
  w = (t) => t / 1e3,
  b = 5;
function x(t, e, s) {
  const i = Math.max(e - b, 0);
  return n(s - t(i), e - i);
}
let T = i,
  S = i;
const V = (t, e, n) => (n > e ? e : n < t ? t : n),
  A = 0.001,
  M = 0.01,
  P = 10,
  k = 0.05,
  F = 1;
function C({
  duration: t = 800,
  bounce: e = 0.25,
  velocity: n = 0,
  mass: s = 1,
}) {
  let i,
    r,
    o = 1 - e;
  (o = V(k, F, o)),
    (t = V(M, P, w(t))),
    o < 1
      ? ((i = (e) => {
          const s = e * o,
            i = s * t,
            r = s - n,
            a = O(e, o),
            l = Math.exp(-i);
          return A - (r / a) * l;
        }),
        (r = (e) => {
          const s = e * o * t,
            r = s * n + n,
            a = Math.pow(o, 2) * Math.pow(e, 2) * t,
            l = Math.exp(-s),
            u = O(Math.pow(e, 2), o);
          return ((-i(e) + A > 0 ? -1 : 1) * ((r - a) * l)) / u;
        }))
      : ((i = (e) => Math.exp(-e * t) * ((e - n) * t + 1) - A),
        (r = (e) => Math.exp(-e * t) * (t * t * (n - e))));
  const a = (function (t, e, n) {
    let s = n;
    for (let n = 1; n < E; n++) s -= t(s) / e(s);
    return s;
  })(i, r, 5 / t);
  if (((t = v(t)), isNaN(a)))
    return { stiffness: 100, damping: 10, duration: t };
  {
    const e = Math.pow(a, 2) * s;
    return { stiffness: e, damping: 2 * o * Math.sqrt(s * e), duration: t };
  }
}
const E = 12;
function O(t, e) {
  return t * Math.sqrt(1 - e * e);
}
const R = ['duration', 'bounce'],
  B = ['stiffness', 'damping', 'mass'];
function I(t, e) {
  return e.some((e) => void 0 !== t[e]);
}
function L({ keyframes: t, restDelta: e, restSpeed: n, ...s }) {
  const i = t[0],
    r = t[t.length - 1],
    o = { done: !1, value: i },
    {
      stiffness: a,
      damping: l,
      mass: u,
      duration: c,
      velocity: h,
      isResolvedFromDuration: d,
    } = (function (t) {
      let e = {
        velocity: 0,
        stiffness: 100,
        damping: 10,
        mass: 1,
        isResolvedFromDuration: !1,
        ...t,
      };
      if (!I(t, B) && I(t, R)) {
        const n = C(t);
        (e = { ...e, ...n, mass: 1 }), (e.isResolvedFromDuration = !0);
      }
      return e;
    })({ ...s, velocity: -w(s.velocity || 0) }),
    p = h || 0,
    f = l / (2 * Math.sqrt(a * u)),
    m = r - i,
    g = w(Math.sqrt(a / u)),
    y = Math.abs(m) < 5;
  let b;
  if ((n || (n = y ? 0.01 : 2), e || (e = y ? 0.005 : 0.5), f < 1)) {
    const t = O(g, f);
    b = (e) => {
      const n = Math.exp(-f * g * e);
      return (
        r - n * (((p + f * g * m) / t) * Math.sin(t * e) + m * Math.cos(t * e))
      );
    };
  } else if (1 === f) b = (t) => r - Math.exp(-g * t) * (m + (p + g * m) * t);
  else {
    const t = g * Math.sqrt(f * f - 1);
    b = (e) => {
      const n = Math.exp(-f * g * e),
        s = Math.min(t * e, 300);
      return (
        r - (n * ((p + f * g * m) * Math.sinh(s) + t * m * Math.cosh(s))) / t
      );
    };
  }
  return {
    calculatedDuration: (d && c) || null,
    next: (t) => {
      const s = b(t);
      if (d) o.done = t >= c;
      else {
        let i = 0;
        f < 1 && (i = 0 === t ? v(p) : x(b, t, s));
        const a = Math.abs(i) <= n,
          l = Math.abs(r - s) <= e;
        o.done = a && l;
      }
      return (o.value = o.done ? r : s), o;
    },
  };
}
const W = 2e4;
function D(t) {
  let e = 0;
  let n = t.next(e);
  for (; !n.done && e < W; ) (e += 50), (n = t.next(e));
  return e >= W ? 1 / 0 : e;
}
function N(t, e = 100, n) {
  const s = n({ ...t, keyframes: [0, e] }),
    i = Math.min(D(s), W);
  return {
    type: 'keyframes',
    ease: (t) => s.next(i * t).value / e,
    duration: w(i),
  };
}
const K = (t, e, n) => t + (e - t) * n,
  $ = (t, e, n) => {
    const s = e - t;
    return 0 === s ? 1 : (n - t) / s;
  };
function z(t, e) {
  const n = t[t.length - 1];
  for (let s = 1; s <= e; s++) {
    const i = $(0, e, s);
    t.push(K(n, 1, i));
  }
}
function j(t) {
  const e = [0];
  return z(e, t.length - 1), e;
}
const H = (t) => Boolean(t && t.getVelocity);
function U(t, e, n) {
  var s;
  if ('string' == typeof t) {
    let i = document;
    e && (S(Boolean(e.current)), (i = e.current)),
      n
        ? ((null !== (s = n[t]) && void 0 !== s) ||
            (n[t] = i.querySelectorAll(t)),
          (t = n[t]))
        : (t = i.querySelectorAll(t));
  } else t instanceof Element && (t = [t]);
  return Array.from(t || []);
}
function Y(t) {
  return 'object' == typeof t && !Array.isArray(t);
}
function q(t, e, n, s) {
  return 'string' == typeof t && Y(e)
    ? U(t, n, s)
    : t instanceof NodeList
    ? Array.from(t)
    : Array.isArray(t)
    ? t
    : [t];
}
function X(t) {
  return 'function' == typeof t;
}
function G(t, e, n, s) {
  var i;
  return 'number' == typeof e
    ? e
    : e.startsWith('-') || e.startsWith('+')
    ? Math.max(0, t + parseFloat(e))
    : '<' === e
    ? n
    : null !== (i = s.get(e)) && void 0 !== i
    ? i
    : t;
}
const Z = (t, e, n) => {
    const s = e - t;
    return ((((n - t) % s) + s) % s) + t;
  },
  _ = (t) => Array.isArray(t) && 'number' != typeof t[0];
function J(t, e) {
  return _(t) ? t[Z(0, t.length, e)] : t;
}
function Q(e, n, s, i, r, o) {
  !(function (e, n, s) {
    for (let i = 0; i < e.length; i++) {
      const r = e[i];
      r.at > n && r.at < s && (t(e, r), i--);
    }
  })(e, r, o);
  for (let t = 0; t < n.length; t++)
    e.push({ value: n[t], at: K(r, o, i[t]), easing: J(s, t) });
}
function tt(t, e) {
  return t.at === e.at
    ? null === t.value
      ? 1
      : null === e.value
      ? -1
      : 0
    : t.at - e.at;
}
const et = 'easeInOut';
function nt(t, e) {
  return !e.has(t) && e.set(t, {}), e.get(t);
}
function st(t, e) {
  return e[t] || (e[t] = []), e[t];
}
function it(t) {
  return Array.isArray(t) ? t : [t];
}
function rt(t, e) {
  return t && t[e] ? { ...t, ...t[e] } : { ...t };
}
const ot = (t) => 'number' == typeof t,
  at = (t) => t.every(ot),
  lt = new WeakMap(),
  ut = [
    'transformPerspective',
    'x',
    'y',
    'z',
    'translateX',
    'translateY',
    'translateZ',
    'scale',
    'scaleX',
    'scaleY',
    'rotate',
    'rotateX',
    'rotateY',
    'rotateZ',
    'skew',
    'skewX',
    'skewY',
  ],
  ct = new Set(ut),
  ht = { type: 'spring', stiffness: 500, damping: 25, restSpeed: 10 },
  dt = { type: 'keyframes', duration: 0.8 },
  pt = { type: 'keyframes', ease: [0.25, 0.1, 0.35, 1], duration: 0.3 },
  ft = (t, { keyframes: e }) =>
    e.length > 2
      ? dt
      : ct.has(t)
      ? t.startsWith('scale')
        ? {
            type: 'spring',
            stiffness: 550,
            damping: 0 === e[1] ? 2 * Math.sqrt(550) : 30,
            restSpeed: 10,
          }
        : ht
      : pt;
function mt(t, e) {
  return t ? t[e] || t.default || t : void 0;
}
const gt = (t) => null !== t;
function yt(t, { repeat: e, repeatType: n = 'loop' }, s) {
  const i = t.filter(gt),
    r = e && 'loop' !== n && e % 2 == 1 ? 0 : i.length - 1;
  return r && void 0 !== s ? s : i[r];
}
const vt = (t, e, n) =>
    (((1 - 3 * n + 3 * e) * t + (3 * n - 6 * e)) * t + 3 * e) * t,
  wt = 1e-7,
  bt = 12;
function xt(t, e, n, s) {
  if (t === e && n === s) return i;
  const r = (e) =>
    (function (t, e, n, s, i) {
      let r,
        o,
        a = 0;
      do {
        (o = e + (n - e) / 2), (r = vt(o, s, i) - t), r > 0 ? (n = o) : (e = o);
      } while (Math.abs(r) > wt && ++a < bt);
      return o;
    })(e, 0, 1, t, n);
  return (t) => (0 === t || 1 === t ? t : vt(r(t), e, s));
}
const Tt = (t) => (e) => e <= 0.5 ? t(2 * e) / 2 : (2 - t(2 * (1 - e))) / 2,
  St = (t) => (e) => 1 - t(1 - e),
  Vt = xt(0.33, 1.53, 0.69, 0.99),
  At = St(Vt),
  Mt = Tt(At),
  Pt = (t) =>
    (t *= 2) < 1 ? 0.5 * At(t) : 0.5 * (2 - Math.pow(2, -10 * (t - 1))),
  kt = (t) => 1 - Math.sin(Math.acos(t)),
  Ft = St(kt),
  Ct = Tt(kt),
  Et = (t) => /^0[^.\s]+$/u.test(t);
const Ot = (t) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(t),
  Rt = (t) => (e) => 'string' == typeof e && e.startsWith(t),
  Bt = Rt('--'),
  It = Rt('var(--'),
  Lt = (t) => !!It(t) && Wt.test(t.split('/*')[0].trim()),
  Wt =
    /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu,
  Dt = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
function Nt(t, e, n = 1) {
  const [s, i] = (function (t) {
    const e = Dt.exec(t);
    if (!e) return [,];
    const [, n, s, i] = e;
    return [`--${null != n ? n : s}`, i];
  })(t);
  if (!s) return;
  const r = window.getComputedStyle(e).getPropertyValue(s);
  if (r) {
    const t = r.trim();
    return Ot(t) ? parseFloat(t) : t;
  }
  return Lt(i) ? Nt(i, e, n + 1) : i;
}
const Kt = {
    test: (t) => 'number' == typeof t,
    parse: parseFloat,
    transform: (t) => t,
  },
  $t = { ...Kt, transform: (t) => V(0, 1, t) },
  zt = { ...Kt, default: 1 },
  jt = (t) => ({
    test: (e) =>
      'string' == typeof e && e.endsWith(t) && 1 === e.split(' ').length,
    parse: parseFloat,
    transform: (e) => `${e}${t}`,
  }),
  Ht = jt('deg'),
  Ut = jt('%'),
  Yt = jt('px'),
  qt = jt('vh'),
  Xt = jt('vw'),
  Gt = {
    ...Ut,
    parse: (t) => Ut.parse(t) / 100,
    transform: (t) => Ut.transform(100 * t),
  },
  Zt = new Set([
    'width',
    'height',
    'top',
    'left',
    'right',
    'bottom',
    'x',
    'y',
    'translateX',
    'translateY',
  ]),
  _t = (t) => t === Kt || t === Yt,
  Jt = (t, e) => parseFloat(t.split(', ')[e]),
  Qt =
    (t, e) =>
    (n, { transform: s }) => {
      if ('none' === s || !s) return 0;
      const i = s.match(/^matrix3d\((.+)\)$/u);
      if (i) return Jt(i[1], e);
      {
        const e = s.match(/^matrix\((.+)\)$/u);
        return e ? Jt(e[1], t) : 0;
      }
    },
  te = new Set(['x', 'y', 'z']),
  ee = ut.filter((t) => !te.has(t));
const ne = {
  width: ({ x: t }, { paddingLeft: e = '0', paddingRight: n = '0' }) =>
    t.max - t.min - parseFloat(e) - parseFloat(n),
  height: ({ y: t }, { paddingTop: e = '0', paddingBottom: n = '0' }) =>
    t.max - t.min - parseFloat(e) - parseFloat(n),
  top: (t, { top: e }) => parseFloat(e),
  left: (t, { left: e }) => parseFloat(e),
  bottom: ({ y: t }, { top: e }) => parseFloat(e) + (t.max - t.min),
  right: ({ x: t }, { left: e }) => parseFloat(e) + (t.max - t.min),
  x: Qt(4, 13),
  y: Qt(5, 14),
};
(ne.translateX = ne.x), (ne.translateY = ne.y);
const se = (t) => (e) => e.test(t),
  ie = [Kt, Yt, Ut, Ht, Xt, qt, { test: (t) => 'auto' === t, parse: (t) => t }],
  re = (t) => ie.find(se(t)),
  oe = new Set();
let ae = !1,
  le = !1;
function ue() {
  if (le) {
    const t = Array.from(oe).filter((t) => t.needsMeasurement),
      e = new Set(t.map((t) => t.element)),
      n = new Map();
    e.forEach((t) => {
      const e = (function (t) {
        const e = [];
        return (
          ee.forEach((n) => {
            const s = t.getValue(n);
            void 0 !== s &&
              (e.push([n, s.get()]), s.set(n.startsWith('scale') ? 1 : 0));
          }),
          e
        );
      })(t);
      e.length && (n.set(t, e), t.render());
    }),
      t.forEach((t) => t.measureInitialState()),
      e.forEach((t) => {
        t.render();
        const e = n.get(t);
        e &&
          e.forEach(([e, n]) => {
            var s;
            null === (s = t.getValue(e)) || void 0 === s || s.set(n);
          });
      }),
      t.forEach((t) => t.measureEndState()),
      t.forEach((t) => {
        void 0 !== t.suspendedScrollY && window.scrollTo(0, t.suspendedScrollY);
      });
  }
  (le = !1), (ae = !1), oe.forEach((t) => t.complete()), oe.clear();
}
function ce() {
  oe.forEach((t) => {
    t.readKeyframes(), t.needsMeasurement && (le = !0);
  });
}
class he {
  constructor(t, e, n, s, i, r = !1) {
    (this.isComplete = !1),
      (this.isAsync = !1),
      (this.needsMeasurement = !1),
      (this.isScheduled = !1),
      (this.unresolvedKeyframes = [...t]),
      (this.onComplete = e),
      (this.name = n),
      (this.motionValue = s),
      (this.element = i),
      (this.isAsync = r);
  }
  scheduleResolve() {
    (this.isScheduled = !0),
      this.isAsync
        ? (oe.add(this), ae || ((ae = !0), o.read(ce), o.resolveKeyframes(ue)))
        : (this.readKeyframes(), this.complete());
  }
  readKeyframes() {
    const {
      unresolvedKeyframes: t,
      name: e,
      element: n,
      motionValue: s,
    } = this;
    for (let i = 0; i < t.length; i++)
      if (null === t[i])
        if (0 === i) {
          const i = null == s ? void 0 : s.get(),
            r = t[t.length - 1];
          if (void 0 !== i) t[0] = i;
          else if (n && e) {
            const s = n.readValue(e, r);
            null != s && (t[0] = s);
          }
          void 0 === t[0] && (t[0] = r), s && void 0 === i && s.set(t[0]);
        } else t[i] = t[i - 1];
  }
  setFinalKeyframe() {}
  measureInitialState() {}
  renderEndStyles() {}
  measureEndState() {}
  complete() {
    (this.isComplete = !0),
      this.onComplete(this.unresolvedKeyframes, this.finalKeyframe),
      oe.delete(this);
  }
  cancel() {
    this.isComplete || ((this.isScheduled = !1), oe.delete(this));
  }
  resume() {
    this.isComplete || this.scheduleResolve();
  }
}
const de = (t) => Math.round(1e5 * t) / 1e5,
  pe = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
const fe =
    /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu,
  me = (t, e) => (n) =>
    Boolean(
      ('string' == typeof n && fe.test(n) && n.startsWith(t)) ||
        (e &&
          !(function (t) {
            return null == t;
          })(n) &&
          Object.prototype.hasOwnProperty.call(n, e))
    ),
  ge = (t, e, n) => (s) => {
    if ('string' != typeof s) return s;
    const [i, r, o, a] = s.match(pe);
    return {
      [t]: parseFloat(i),
      [e]: parseFloat(r),
      [n]: parseFloat(o),
      alpha: void 0 !== a ? parseFloat(a) : 1,
    };
  },
  ye = { ...Kt, transform: (t) => Math.round(((t) => V(0, 255, t))(t)) },
  ve = {
    test: me('rgb', 'red'),
    parse: ge('red', 'green', 'blue'),
    transform: ({ red: t, green: e, blue: n, alpha: s = 1 }) =>
      'rgba(' +
      ye.transform(t) +
      ', ' +
      ye.transform(e) +
      ', ' +
      ye.transform(n) +
      ', ' +
      de($t.transform(s)) +
      ')',
  };
const we = {
    test: me('#'),
    parse: function (t) {
      let e = '',
        n = '',
        s = '',
        i = '';
      return (
        t.length > 5
          ? ((e = t.substring(1, 3)),
            (n = t.substring(3, 5)),
            (s = t.substring(5, 7)),
            (i = t.substring(7, 9)))
          : ((e = t.substring(1, 2)),
            (n = t.substring(2, 3)),
            (s = t.substring(3, 4)),
            (i = t.substring(4, 5)),
            (e += e),
            (n += n),
            (s += s),
            (i += i)),
        {
          red: parseInt(e, 16),
          green: parseInt(n, 16),
          blue: parseInt(s, 16),
          alpha: i ? parseInt(i, 16) / 255 : 1,
        }
      );
    },
    transform: ve.transform,
  },
  be = {
    test: me('hsl', 'hue'),
    parse: ge('hue', 'saturation', 'lightness'),
    transform: ({ hue: t, saturation: e, lightness: n, alpha: s = 1 }) =>
      'hsla(' +
      Math.round(t) +
      ', ' +
      Ut.transform(de(e)) +
      ', ' +
      Ut.transform(de(n)) +
      ', ' +
      de($t.transform(s)) +
      ')',
  },
  xe = {
    test: (t) => ve.test(t) || we.test(t) || be.test(t),
    parse: (t) =>
      ve.test(t) ? ve.parse(t) : be.test(t) ? be.parse(t) : we.parse(t),
    transform: (t) =>
      'string' == typeof t
        ? t
        : t.hasOwnProperty('red')
        ? ve.transform(t)
        : be.transform(t),
  },
  Te =
    /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;
const Se = 'number',
  Ve = 'color',
  Ae = 'var',
  Me = 'var(',
  Pe = '${}',
  ke =
    /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
function Fe(t) {
  const e = t.toString(),
    n = [],
    s = { color: [], number: [], var: [] },
    i = [];
  let r = 0;
  const o = e
    .replace(
      ke,
      (t) => (
        xe.test(t)
          ? (s.color.push(r), i.push(Ve), n.push(xe.parse(t)))
          : t.startsWith(Me)
          ? (s.var.push(r), i.push(Ae), n.push(t))
          : (s.number.push(r), i.push(Se), n.push(parseFloat(t))),
        ++r,
        Pe
      )
    )
    .split(Pe);
  return { values: n, split: o, indexes: s, types: i };
}
function Ce(t) {
  return Fe(t).values;
}
function Ee(t) {
  const { split: e, types: n } = Fe(t),
    s = e.length;
  return (t) => {
    let i = '';
    for (let r = 0; r < s; r++)
      if (((i += e[r]), void 0 !== t[r])) {
        const e = n[r];
        i += e === Se ? de(t[r]) : e === Ve ? xe.transform(t[r]) : t[r];
      }
    return i;
  };
}
const Oe = (t) => ('number' == typeof t ? 0 : t);
const Re = {
    test: function (t) {
      var e, n;
      return (
        isNaN(t) &&
        'string' == typeof t &&
        ((null === (e = t.match(pe)) || void 0 === e ? void 0 : e.length) ||
          0) +
          ((null === (n = t.match(Te)) || void 0 === n ? void 0 : n.length) ||
            0) >
          0
      );
    },
    parse: Ce,
    createTransformer: Ee,
    getAnimatableNone: function (t) {
      const e = Ce(t);
      return Ee(t)(e.map(Oe));
    },
  },
  Be = new Set(['brightness', 'contrast', 'saturate', 'opacity']);
function Ie(t) {
  const [e, n] = t.slice(0, -1).split('(');
  if ('drop-shadow' === e) return t;
  const [s] = n.match(pe) || [];
  if (!s) return t;
  const i = n.replace(s, '');
  let r = Be.has(e) ? 1 : 0;
  return s !== n && (r *= 100), e + '(' + r + i + ')';
}
const Le = /\b([a-z-]*)\(.*?\)/gu,
  We = {
    ...Re,
    getAnimatableNone: (t) => {
      const e = t.match(Le);
      return e ? e.map(Ie).join(' ') : t;
    },
  },
  De = {
    borderWidth: Yt,
    borderTopWidth: Yt,
    borderRightWidth: Yt,
    borderBottomWidth: Yt,
    borderLeftWidth: Yt,
    borderRadius: Yt,
    radius: Yt,
    borderTopLeftRadius: Yt,
    borderTopRightRadius: Yt,
    borderBottomRightRadius: Yt,
    borderBottomLeftRadius: Yt,
    width: Yt,
    maxWidth: Yt,
    height: Yt,
    maxHeight: Yt,
    top: Yt,
    right: Yt,
    bottom: Yt,
    left: Yt,
    padding: Yt,
    paddingTop: Yt,
    paddingRight: Yt,
    paddingBottom: Yt,
    paddingLeft: Yt,
    margin: Yt,
    marginTop: Yt,
    marginRight: Yt,
    marginBottom: Yt,
    marginLeft: Yt,
    backgroundPositionX: Yt,
    backgroundPositionY: Yt,
  },
  Ne = {
    rotate: Ht,
    rotateX: Ht,
    rotateY: Ht,
    rotateZ: Ht,
    scale: zt,
    scaleX: zt,
    scaleY: zt,
    scaleZ: zt,
    skew: Ht,
    skewX: Ht,
    skewY: Ht,
    distance: Yt,
    translateX: Yt,
    translateY: Yt,
    translateZ: Yt,
    x: Yt,
    y: Yt,
    z: Yt,
    perspective: Yt,
    transformPerspective: Yt,
    opacity: $t,
    originX: Gt,
    originY: Gt,
    originZ: Yt,
  },
  Ke = { ...Kt, transform: Math.round },
  $e = {
    ...De,
    ...Ne,
    zIndex: Ke,
    size: Yt,
    fillOpacity: $t,
    strokeOpacity: $t,
    numOctaves: Ke,
  },
  ze = {
    ...$e,
    color: xe,
    backgroundColor: xe,
    outlineColor: xe,
    fill: xe,
    stroke: xe,
    borderColor: xe,
    borderTopColor: xe,
    borderRightColor: xe,
    borderBottomColor: xe,
    borderLeftColor: xe,
    filter: We,
    WebkitFilter: We,
  },
  je = (t) => ze[t];
function He(t, e) {
  let n = je(t);
  return (
    n !== We && (n = Re), n.getAnimatableNone ? n.getAnimatableNone(e) : void 0
  );
}
const Ue = new Set(['auto', 'none', '0']);
class Ye extends he {
  constructor(t, e, n, s, i) {
    super(t, e, n, s, i, !0);
  }
  readKeyframes() {
    const { unresolvedKeyframes: t, element: e, name: n } = this;
    if (!e || !e.current) return;
    super.readKeyframes();
    for (let n = 0; n < t.length; n++) {
      let s = t[n];
      if ('string' == typeof s && ((s = s.trim()), Lt(s))) {
        const i = Nt(s, e.current);
        void 0 !== i && (t[n] = i),
          n === t.length - 1 && (this.finalKeyframe = s);
      }
    }
    if ((this.resolveNoneKeyframes(), !Zt.has(n) || 2 !== t.length)) return;
    const [s, i] = t,
      r = re(s),
      o = re(i);
    if (r !== o)
      if (_t(r) && _t(o))
        for (let e = 0; e < t.length; e++) {
          const n = t[e];
          'string' == typeof n && (t[e] = parseFloat(n));
        }
      else this.needsMeasurement = !0;
  }
  resolveNoneKeyframes() {
    const { unresolvedKeyframes: t, name: e } = this,
      n = [];
    for (let e = 0; e < t.length; e++)
      ('number' == typeof (s = t[e])
        ? 0 === s
        : null === s || 'none' === s || '0' === s || Et(s)) && n.push(e);
    var s;
    n.length &&
      (function (t, e, n) {
        let s,
          i = 0;
        for (; i < t.length && !s; ) {
          const e = t[i];
          'string' == typeof e &&
            !Ue.has(e) &&
            Fe(e).values.length &&
            (s = t[i]),
            i++;
        }
        if (s && n) for (const i of e) t[i] = He(n, s);
      })(t, n, e);
  }
  measureInitialState() {
    const { element: t, unresolvedKeyframes: e, name: n } = this;
    if (!t || !t.current) return;
    'height' === n && (this.suspendedScrollY = window.pageYOffset),
      (this.measuredOrigin = ne[n](
        t.measureViewportBox(),
        window.getComputedStyle(t.current)
      )),
      (e[0] = this.measuredOrigin);
    const s = e[e.length - 1];
    void 0 !== s && t.getValue(n, s).jump(s, !1);
  }
  measureEndState() {
    var t;
    const { element: e, name: n, unresolvedKeyframes: s } = this;
    if (!e || !e.current) return;
    const i = e.getValue(n);
    i && i.jump(this.measuredOrigin, !1);
    const r = s.length - 1,
      o = s[r];
    (s[r] = ne[n](e.measureViewportBox(), window.getComputedStyle(e.current))),
      null !== o && void 0 === this.finalKeyframe && (this.finalKeyframe = o),
      (null === (t = this.removedTransforms) || void 0 === t
        ? void 0
        : t.length) &&
        this.removedTransforms.forEach(([t, n]) => {
          e.getValue(t).set(n);
        }),
      this.resolveNoneKeyframes();
  }
}
const qe = (t, e) =>
  'zIndex' !== e &&
  (!('number' != typeof t && !Array.isArray(t)) ||
    !(
      'string' != typeof t ||
      (!Re.test(t) && '0' !== t) ||
      t.startsWith('url(')
    ));
function Xe(t, e, n, s) {
  const i = t[0];
  if (null === i) return !1;
  if ('display' === e || 'visibility' === e) return !0;
  const r = t[t.length - 1],
    o = qe(i, e),
    a = qe(r, e);
  return (
    !(!o || !a) &&
    ((function (t) {
      const e = t[0];
      if (1 === t.length) return !0;
      for (let n = 0; n < t.length; n++) if (t[n] !== e) return !0;
    })(t) ||
      (('spring' === n || X(n)) && s))
  );
}
class Ge {
  constructor({
    autoplay: t = !0,
    delay: e = 0,
    type: n = 'keyframes',
    repeat: s = 0,
    repeatDelay: i = 0,
    repeatType: r = 'loop',
    ...o
  }) {
    (this.isStopped = !1),
      (this.hasAttemptedResolve = !1),
      (this.createdAt = d.now()),
      (this.options = {
        autoplay: t,
        delay: e,
        type: n,
        repeat: s,
        repeatDelay: i,
        repeatType: r,
        ...o,
      }),
      this.updateFinishedPromise();
  }
  calcStartTime() {
    return this.resolvedAt && this.resolvedAt - this.createdAt > 40
      ? this.resolvedAt
      : this.createdAt;
  }
  get resolved() {
    return (
      this._resolved || this.hasAttemptedResolve || (ce(), ue()), this._resolved
    );
  }
  onKeyframesResolved(t, e) {
    (this.resolvedAt = d.now()), (this.hasAttemptedResolve = !0);
    const {
      name: n,
      type: s,
      velocity: i,
      delay: r,
      onComplete: o,
      onUpdate: a,
      isGenerator: l,
    } = this.options;
    if (!l && !Xe(t, n, s, i)) {
      if (!r)
        return (
          null == a || a(yt(t, this.options, e)),
          null == o || o(),
          void this.resolveFinishedPromise()
        );
      this.options.duration = 0;
    }
    const u = this.initPlayback(t, e);
    !1 !== u &&
      ((this._resolved = { keyframes: t, finalKeyframe: e, ...u }),
      this.onPostResolved());
  }
  onPostResolved() {}
  then(t, e) {
    return this.currentFinishedPromise.then(t, e);
  }
  updateFinishedPromise() {
    this.currentFinishedPromise = new Promise((t) => {
      this.resolveFinishedPromise = t;
    });
  }
}
function Ze({
  keyframes: t,
  velocity: e = 0,
  power: n = 0.8,
  timeConstant: s = 325,
  bounceDamping: i = 10,
  bounceStiffness: r = 500,
  modifyTarget: o,
  min: a,
  max: l,
  restDelta: u = 0.5,
  restSpeed: c,
}) {
  const h = t[0],
    d = { done: !1, value: h },
    p = (t) =>
      void 0 === a
        ? l
        : void 0 === l || Math.abs(a - t) < Math.abs(l - t)
        ? a
        : l;
  let f = n * e;
  const m = h + f,
    g = void 0 === o ? m : o(m);
  g !== m && (f = g - h);
  const y = (t) => -f * Math.exp(-t / s),
    v = (t) => g + y(t),
    w = (t) => {
      const e = y(t),
        n = v(t);
      (d.done = Math.abs(e) <= u), (d.value = d.done ? g : n);
    };
  let b, T;
  const S = (t) => {
    var e;
    ((e = d.value), (void 0 !== a && e < a) || (void 0 !== l && e > l)) &&
      ((b = t),
      (T = L({
        keyframes: [d.value, p(d.value)],
        velocity: x(v, t, d.value),
        damping: i,
        stiffness: r,
        restDelta: u,
        restSpeed: c,
      })));
  };
  return (
    S(0),
    {
      calculatedDuration: null,
      next: (t) => {
        let e = !1;
        return (
          T || void 0 !== b || ((e = !0), w(t), S(t)),
          void 0 !== b && t >= b ? T.next(t - b) : (!e && w(t), d)
        );
      },
    }
  );
}
const _e = xt(0.42, 0, 1, 1),
  Je = xt(0, 0, 0.58, 1),
  Qe = xt(0.42, 0, 0.58, 1),
  tn = (t) => Array.isArray(t) && 'number' == typeof t[0],
  en = {
    linear: i,
    easeIn: _e,
    easeInOut: Qe,
    easeOut: Je,
    circIn: kt,
    circInOut: Ct,
    circOut: Ft,
    backIn: At,
    backInOut: Mt,
    backOut: Vt,
    anticipate: Pt,
  },
  nn = (t) => {
    if (tn(t)) {
      S(4 === t.length);
      const [e, n, s, i] = t;
      return xt(e, n, s, i);
    }
    return 'string' == typeof t ? en[t] : t;
  },
  sn = (t, e) => (n) => e(t(n)),
  rn = (...t) => t.reduce(sn);
function on(t, e, n) {
  return (
    n < 0 && (n += 1),
    n > 1 && (n -= 1),
    n < 1 / 6
      ? t + 6 * (e - t) * n
      : n < 0.5
      ? e
      : n < 2 / 3
      ? t + (e - t) * (2 / 3 - n) * 6
      : t
  );
}
function an(t, e) {
  return (n) => (n > 0 ? e : t);
}
const ln = (t, e, n) => {
    const s = t * t,
      i = n * (e * e - s) + s;
    return i < 0 ? 0 : Math.sqrt(i);
  },
  un = [we, ve, be];
function cn(t) {
  const e = ((n = t), un.find((t) => t.test(n)));
  var n;
  if (!Boolean(e)) return !1;
  let s = e.parse(t);
  return (
    e === be &&
      (s = (function ({ hue: t, saturation: e, lightness: n, alpha: s }) {
        (t /= 360), (n /= 100);
        let i = 0,
          r = 0,
          o = 0;
        if ((e /= 100)) {
          const s = n < 0.5 ? n * (1 + e) : n + e - n * e,
            a = 2 * n - s;
          (i = on(a, s, t + 1 / 3)),
            (r = on(a, s, t)),
            (o = on(a, s, t - 1 / 3));
        } else i = r = o = n;
        return {
          red: Math.round(255 * i),
          green: Math.round(255 * r),
          blue: Math.round(255 * o),
          alpha: s,
        };
      })(s)),
    s
  );
}
const hn = (t, e) => {
    const n = cn(t),
      s = cn(e);
    if (!n || !s) return an(t, e);
    const i = { ...n };
    return (t) => (
      (i.red = ln(n.red, s.red, t)),
      (i.green = ln(n.green, s.green, t)),
      (i.blue = ln(n.blue, s.blue, t)),
      (i.alpha = K(n.alpha, s.alpha, t)),
      ve.transform(i)
    );
  },
  dn = new Set(['none', 'hidden']);
function pn(t, e) {
  return (n) => K(t, e, n);
}
function fn(t) {
  return 'number' == typeof t
    ? pn
    : 'string' == typeof t
    ? Lt(t)
      ? an
      : xe.test(t)
      ? hn
      : yn
    : Array.isArray(t)
    ? mn
    : 'object' == typeof t
    ? xe.test(t)
      ? hn
      : gn
    : an;
}
function mn(t, e) {
  const n = [...t],
    s = n.length,
    i = t.map((t, n) => fn(t)(t, e[n]));
  return (t) => {
    for (let e = 0; e < s; e++) n[e] = i[e](t);
    return n;
  };
}
function gn(t, e) {
  const n = { ...t, ...e },
    s = {};
  for (const i in n)
    void 0 !== t[i] && void 0 !== e[i] && (s[i] = fn(t[i])(t[i], e[i]));
  return (t) => {
    for (const e in s) n[e] = s[e](t);
    return n;
  };
}
const yn = (t, e) => {
  const n = Re.createTransformer(e),
    s = Fe(t),
    i = Fe(e);
  return s.indexes.var.length === i.indexes.var.length &&
    s.indexes.color.length === i.indexes.color.length &&
    s.indexes.number.length >= i.indexes.number.length
    ? (dn.has(t) && !i.values.length) || (dn.has(e) && !s.values.length)
      ? (function (t, e) {
          return dn.has(t) ? (n) => (n <= 0 ? t : e) : (n) => (n >= 1 ? e : t);
        })(t, e)
      : rn(
          mn(
            (function (t, e) {
              var n;
              const s = [],
                i = { color: 0, var: 0, number: 0 };
              for (let r = 0; r < e.values.length; r++) {
                const o = e.types[r],
                  a = t.indexes[o][i[o]],
                  l = null !== (n = t.values[a]) && void 0 !== n ? n : 0;
                (s[r] = l), i[o]++;
              }
              return s;
            })(s, i),
            i.values
          ),
          n
        )
    : an(t, e);
};
function vn(t, e, n) {
  if ('number' == typeof t && 'number' == typeof e && 'number' == typeof n)
    return K(t, e, n);
  return fn(t)(t, e);
}
function wn(t, e, { clamp: n = !0, ease: s, mixer: r } = {}) {
  const o = t.length;
  if ((S(o === e.length), 1 === o)) return () => e[0];
  if (2 === o && t[0] === t[1]) return () => e[1];
  t[0] > t[o - 1] && ((t = [...t].reverse()), (e = [...e].reverse()));
  const a = (function (t, e, n) {
      const s = [],
        r = n || vn,
        o = t.length - 1;
      for (let n = 0; n < o; n++) {
        let o = r(t[n], t[n + 1]);
        if (e) {
          const t = Array.isArray(e) ? e[n] || i : e;
          o = rn(t, o);
        }
        s.push(o);
      }
      return s;
    })(e, s, r),
    l = a.length,
    u = (e) => {
      let n = 0;
      if (l > 1) for (; n < t.length - 2 && !(e < t[n + 1]); n++);
      const s = $(t[n], t[n + 1], e);
      return a[n](s);
    };
  return n ? (e) => u(V(t[0], t[o - 1], e)) : u;
}
function bn({
  duration: t = 300,
  keyframes: e,
  times: n,
  ease: s = 'easeInOut',
}) {
  const i = _(s) ? s.map(nn) : nn(s),
    r = { done: !1, value: e[0] },
    o = (function (t, e) {
      return t.map((t) => t * e);
    })(n && n.length === e.length ? n : j(e), t),
    a = wn(o, e, {
      ease: Array.isArray(i)
        ? i
        : ((l = e), (u = i), l.map(() => u || Qe).splice(0, l.length - 1)),
    });
  var l, u;
  return {
    calculatedDuration: t,
    next: (e) => ((r.value = a(e)), (r.done = e >= t), r),
  };
}
const xn = (t) => {
    const e = ({ timestamp: e }) => t(e);
    return {
      start: () => o.update(e, !0),
      stop: () => a(e),
      now: () => (l.isProcessing ? l.timestamp : d.now()),
    };
  },
  Tn = { decay: Ze, inertia: Ze, tween: bn, keyframes: bn, spring: L },
  Sn = (t) => t / 100;
class Vn extends Ge {
  constructor(t) {
    super(t),
      (this.holdTime = null),
      (this.cancelTime = null),
      (this.currentTime = 0),
      (this.playbackSpeed = 1),
      (this.pendingPlayState = 'running'),
      (this.startTime = null),
      (this.state = 'idle'),
      (this.stop = () => {
        if (
          (this.resolver.cancel(), (this.isStopped = !0), 'idle' === this.state)
        )
          return;
        this.teardown();
        const { onStop: t } = this.options;
        t && t();
      });
    const { name: e, motionValue: n, element: s, keyframes: i } = this.options,
      r = (null == s ? void 0 : s.KeyframeResolver) || he;
    (this.resolver = new r(
      i,
      (t, e) => this.onKeyframesResolved(t, e),
      e,
      n,
      s
    )),
      this.resolver.scheduleResolve();
  }
  initPlayback(t) {
    const {
        type: e = 'keyframes',
        repeat: n = 0,
        repeatDelay: s = 0,
        repeatType: i,
        velocity: r = 0,
      } = this.options,
      o = X(e) ? e : Tn[e] || bn;
    let a, l;
    o !== bn &&
      'number' != typeof t[0] &&
      ((a = rn(Sn, vn(t[0], t[1]))), (t = [0, 100]));
    const u = o({ ...this.options, keyframes: t });
    'mirror' === i &&
      (l = o({ ...this.options, keyframes: [...t].reverse(), velocity: -r })),
      null === u.calculatedDuration && (u.calculatedDuration = D(u));
    const { calculatedDuration: c } = u,
      h = c + s;
    return {
      generator: u,
      mirroredGenerator: l,
      mapPercentToKeyframes: a,
      calculatedDuration: c,
      resolvedDuration: h,
      totalDuration: h * (n + 1) - s,
    };
  }
  onPostResolved() {
    const { autoplay: t = !0 } = this.options;
    this.play(),
      'paused' !== this.pendingPlayState && t
        ? (this.state = this.pendingPlayState)
        : this.pause();
  }
  tick(t, e = !1) {
    const { resolved: n } = this;
    if (!n) {
      const { keyframes: t } = this.options;
      return { done: !0, value: t[t.length - 1] };
    }
    const {
      finalKeyframe: s,
      generator: i,
      mirroredGenerator: r,
      mapPercentToKeyframes: o,
      keyframes: a,
      calculatedDuration: l,
      totalDuration: u,
      resolvedDuration: c,
    } = n;
    if (null === this.startTime) return i.next(0);
    const {
      delay: h,
      repeat: d,
      repeatType: p,
      repeatDelay: f,
      onUpdate: m,
    } = this.options;
    this.speed > 0
      ? (this.startTime = Math.min(this.startTime, t))
      : this.speed < 0 &&
        (this.startTime = Math.min(t - u / this.speed, this.startTime)),
      e
        ? (this.currentTime = t)
        : null !== this.holdTime
        ? (this.currentTime = this.holdTime)
        : (this.currentTime = Math.round(t - this.startTime) * this.speed);
    const g = this.currentTime - h * (this.speed >= 0 ? 1 : -1),
      y = this.speed >= 0 ? g < 0 : g > u;
    (this.currentTime = Math.max(g, 0)),
      'finished' === this.state &&
        null === this.holdTime &&
        (this.currentTime = u);
    let v = this.currentTime,
      w = i;
    if (d) {
      const t = Math.min(this.currentTime, u) / c;
      let e = Math.floor(t),
        n = t % 1;
      !n && t >= 1 && (n = 1), 1 === n && e--, (e = Math.min(e, d + 1));
      Boolean(e % 2) &&
        ('reverse' === p
          ? ((n = 1 - n), f && (n -= f / c))
          : 'mirror' === p && (w = r)),
        (v = V(0, 1, n) * c);
    }
    const b = y ? { done: !1, value: a[0] } : w.next(v);
    o && (b.value = o(b.value));
    let { done: x } = b;
    y ||
      null === l ||
      (x = this.speed >= 0 ? this.currentTime >= u : this.currentTime <= 0);
    const T =
      null === this.holdTime &&
      ('finished' === this.state || ('running' === this.state && x));
    return (
      T && void 0 !== s && (b.value = yt(a, this.options, s)),
      m && m(b.value),
      T && this.finish(),
      b
    );
  }
  get duration() {
    const { resolved: t } = this;
    return t ? w(t.calculatedDuration) : 0;
  }
  get time() {
    return w(this.currentTime);
  }
  set time(t) {
    (t = v(t)),
      (this.currentTime = t),
      null !== this.holdTime || 0 === this.speed
        ? (this.holdTime = t)
        : this.driver && (this.startTime = this.driver.now() - t / this.speed);
  }
  get speed() {
    return this.playbackSpeed;
  }
  set speed(t) {
    const e = this.playbackSpeed !== t;
    (this.playbackSpeed = t), e && (this.time = w(this.currentTime));
  }
  play() {
    if ((this.resolver.isScheduled || this.resolver.resume(), !this._resolved))
      return void (this.pendingPlayState = 'running');
    if (this.isStopped) return;
    const { driver: t = xn, onPlay: e, startTime: n } = this.options;
    this.driver || (this.driver = t((t) => this.tick(t))), e && e();
    const s = this.driver.now();
    null !== this.holdTime
      ? (this.startTime = s - this.holdTime)
      : this.startTime
      ? 'finished' === this.state && (this.startTime = s)
      : (this.startTime = null != n ? n : this.calcStartTime()),
      'finished' === this.state && this.updateFinishedPromise(),
      (this.cancelTime = this.startTime),
      (this.holdTime = null),
      (this.state = 'running'),
      this.driver.start();
  }
  pause() {
    var t;
    this._resolved
      ? ((this.state = 'paused'),
        (this.holdTime =
          null !== (t = this.currentTime) && void 0 !== t ? t : 0))
      : (this.pendingPlayState = 'paused');
  }
  complete() {
    'running' !== this.state && this.play(),
      (this.pendingPlayState = this.state = 'finished'),
      (this.holdTime = null);
  }
  finish() {
    this.teardown(), (this.state = 'finished');
    const { onComplete: t } = this.options;
    t && t();
  }
  cancel() {
    null !== this.cancelTime && this.tick(this.cancelTime),
      this.teardown(),
      this.updateFinishedPromise();
  }
  teardown() {
    (this.state = 'idle'),
      this.stopDriver(),
      this.resolveFinishedPromise(),
      this.updateFinishedPromise(),
      (this.startTime = this.cancelTime = null),
      this.resolver.cancel();
  }
  stopDriver() {
    this.driver && (this.driver.stop(), (this.driver = void 0));
  }
  sample(t) {
    return (this.startTime = 0), this.tick(t, !0);
  }
}
const An = new Set(['opacity', 'clipPath', 'filter', 'transform']),
  Mn = (t, e) => {
    let n = '';
    const s = Math.max(Math.round(e / 10), 2);
    for (let e = 0; e < s; e++) n += t($(0, s - 1, e)) + ', ';
    return `linear(${n.substring(0, n.length - 2)})`;
  },
  Pn = { linearEasing: void 0 };
function kn(t, e) {
  const n = m(t);
  return () => {
    var t;
    return null !== (t = Pn[e]) && void 0 !== t ? t : n();
  };
}
const Fn = kn(() => {
  try {
    document
      .createElement('div')
      .animate({ opacity: 0 }, { easing: 'linear(0, 1)' });
  } catch (t) {
    return !1;
  }
  return !0;
}, 'linearEasing');
function Cn(t) {
  return Boolean(
    ('function' == typeof t && Fn()) ||
      !t ||
      ('string' == typeof t && (t in On || Fn())) ||
      tn(t) ||
      (Array.isArray(t) && t.every(Cn))
  );
}
const En = ([t, e, n, s]) => `cubic-bezier(${t}, ${e}, ${n}, ${s})`,
  On = {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    circIn: En([0, 0.65, 0.55, 1]),
    circOut: En([0.55, 0, 1, 0.45]),
    backIn: En([0.31, 0.01, 0.66, -0.59]),
    backOut: En([0.33, 1.53, 0.69, 0.99]),
  };
function Rn(t, e) {
  return t
    ? 'function' == typeof t && Fn()
      ? Mn(t, e)
      : tn(t)
      ? En(t)
      : Array.isArray(t)
      ? t.map((t) => Rn(t, e) || On.easeOut)
      : On[t]
    : void 0;
}
function Bn(
  t,
  e,
  n,
  {
    delay: s = 0,
    duration: i = 300,
    repeat: r = 0,
    repeatType: o = 'loop',
    ease: a = 'easeInOut',
    times: l,
  } = {}
) {
  const u = { [e]: n };
  l && (u.offset = l);
  const c = Rn(a, i);
  return (
    Array.isArray(c) && (u.easing = c),
    t.animate(u, {
      delay: s,
      duration: i,
      easing: Array.isArray(c) ? 'linear' : c,
      fill: 'both',
      iterations: r + 1,
      direction: 'reverse' === o ? 'alternate' : 'normal',
    })
  );
}
function In(t, e) {
  (t.timeline = e), (t.onfinish = null);
}
const Ln = m(() => Object.hasOwnProperty.call(Element.prototype, 'animate'));
const Wn = { anticipate: Pt, backInOut: Mt, circInOut: Ct };
class Dn extends Ge {
  constructor(t) {
    super(t);
    const { name: e, motionValue: n, element: s, keyframes: i } = this.options;
    (this.resolver = new Ye(
      i,
      (t, e) => this.onKeyframesResolved(t, e),
      e,
      n,
      s
    )),
      this.resolver.scheduleResolve();
  }
  initPlayback(t, e) {
    var n;
    let {
      duration: s = 300,
      times: i,
      ease: r,
      type: o,
      motionValue: a,
      name: l,
      startTime: u,
    } = this.options;
    if (!(null === (n = a.owner) || void 0 === n ? void 0 : n.current))
      return !1;
    var c;
    if (
      ('string' == typeof r && Fn() && r in Wn && (r = Wn[r]),
      X((c = this.options).type) || 'spring' === c.type || !Cn(c.ease))
    ) {
      const {
          onComplete: e,
          onUpdate: n,
          motionValue: a,
          element: l,
          ...u
        } = this.options,
        c = (function (t, e) {
          const n = new Vn({
            ...e,
            keyframes: t,
            repeat: 0,
            delay: 0,
            isGenerator: !0,
          });
          let s = { done: !1, value: t[0] };
          const i = [];
          let r = 0;
          for (; !s.done && r < 2e4; )
            (s = n.sample(r)), i.push(s.value), (r += 10);
          return {
            times: void 0,
            keyframes: i,
            duration: r - 10,
            ease: 'linear',
          };
        })(t, u);
      1 === (t = c.keyframes).length && (t[1] = t[0]),
        (s = c.duration),
        (i = c.times),
        (r = c.ease),
        (o = 'keyframes');
    }
    const h = Bn(a.owner.current, l, t, {
      ...this.options,
      duration: s,
      times: i,
      ease: r,
    });
    return (
      (h.startTime = null != u ? u : this.calcStartTime()),
      this.pendingTimeline
        ? (In(h, this.pendingTimeline), (this.pendingTimeline = void 0))
        : (h.onfinish = () => {
            const { onComplete: n } = this.options;
            a.set(yt(t, this.options, e)),
              n && n(),
              this.cancel(),
              this.resolveFinishedPromise();
          }),
      { animation: h, duration: s, times: i, type: o, ease: r, keyframes: t }
    );
  }
  get duration() {
    const { resolved: t } = this;
    if (!t) return 0;
    const { duration: e } = t;
    return w(e);
  }
  get time() {
    const { resolved: t } = this;
    if (!t) return 0;
    const { animation: e } = t;
    return w(e.currentTime || 0);
  }
  set time(t) {
    const { resolved: e } = this;
    if (!e) return;
    const { animation: n } = e;
    n.currentTime = v(t);
  }
  get speed() {
    const { resolved: t } = this;
    if (!t) return 1;
    const { animation: e } = t;
    return e.playbackRate;
  }
  set speed(t) {
    const { resolved: e } = this;
    if (!e) return;
    const { animation: n } = e;
    n.playbackRate = t;
  }
  get state() {
    const { resolved: t } = this;
    if (!t) return 'idle';
    const { animation: e } = t;
    return e.playState;
  }
  get startTime() {
    const { resolved: t } = this;
    if (!t) return null;
    const { animation: e } = t;
    return e.startTime;
  }
  attachTimeline(t) {
    if (this._resolved) {
      const { resolved: e } = this;
      if (!e) return i;
      const { animation: n } = e;
      In(n, t);
    } else this.pendingTimeline = t;
    return i;
  }
  play() {
    if (this.isStopped) return;
    const { resolved: t } = this;
    if (!t) return;
    const { animation: e } = t;
    'finished' === e.playState && this.updateFinishedPromise(), e.play();
  }
  pause() {
    const { resolved: t } = this;
    if (!t) return;
    const { animation: e } = t;
    e.pause();
  }
  stop() {
    if ((this.resolver.cancel(), (this.isStopped = !0), 'idle' === this.state))
      return;
    this.resolveFinishedPromise(), this.updateFinishedPromise();
    const { resolved: t } = this;
    if (!t) return;
    const {
      animation: e,
      keyframes: n,
      duration: s,
      type: i,
      ease: r,
      times: o,
    } = t;
    if ('idle' === e.playState || 'finished' === e.playState) return;
    if (this.time) {
      const {
          motionValue: t,
          onUpdate: e,
          onComplete: a,
          element: l,
          ...u
        } = this.options,
        c = new Vn({
          ...u,
          keyframes: n,
          duration: s,
          type: i,
          ease: r,
          times: o,
          isGenerator: !0,
        }),
        h = v(this.time);
      t.setWithVelocity(c.sample(h - 10).value, c.sample(h).value, 10);
    }
    const { onStop: a } = this.options;
    a && a(), this.cancel();
  }
  complete() {
    const { resolved: t } = this;
    t && t.animation.finish();
  }
  cancel() {
    const { resolved: t } = this;
    t && t.animation.cancel();
  }
  static supports(t) {
    const {
      motionValue: e,
      name: n,
      repeatDelay: s,
      repeatType: i,
      damping: r,
      type: o,
    } = t;
    return (
      Ln() &&
      n &&
      An.has(n) &&
      e &&
      e.owner &&
      e.owner.current instanceof HTMLElement &&
      !e.owner.getProps().onUpdate &&
      !s &&
      'mirror' !== i &&
      0 !== r &&
      'inertia' !== o
    );
  }
}
const Nn =
    (t, e, n, s = {}, i, r) =>
    (a) => {
      const l = mt(s, t) || {},
        u = l.delay || s.delay || 0;
      let { elapsed: c = 0 } = s;
      c -= v(u);
      let h = {
        keyframes: Array.isArray(n) ? n : [null, n],
        ease: 'easeOut',
        velocity: e.getVelocity(),
        ...l,
        delay: -c,
        onUpdate: (t) => {
          e.set(t), l.onUpdate && l.onUpdate(t);
        },
        onComplete: () => {
          a(), l.onComplete && l.onComplete();
        },
        name: t,
        motionValue: e,
        element: r ? void 0 : i,
      };
      (function ({
        when: t,
        delay: e,
        delayChildren: n,
        staggerChildren: s,
        staggerDirection: i,
        repeat: r,
        repeatType: o,
        repeatDelay: a,
        from: l,
        elapsed: u,
        ...c
      }) {
        return !!Object.keys(c).length;
      })(l) || (h = { ...h, ...ft(t, h) }),
        h.duration && (h.duration = v(h.duration)),
        h.repeatDelay && (h.repeatDelay = v(h.repeatDelay)),
        void 0 !== h.from && (h.keyframes[0] = h.from);
      let d = !1;
      if (
        ((!1 === h.type || (0 === h.duration && !h.repeatDelay)) &&
          ((h.duration = 0), 0 === h.delay && (d = !0)),
        d && !r && void 0 !== e.get())
      ) {
        const t = yt(h.keyframes, l);
        if (void 0 !== t)
          return (
            o.update(() => {
              h.onUpdate(t), h.onComplete();
            }),
            new y([])
          );
      }
      return !r && Dn.supports(h) ? new Dn(h) : new Vn(h);
    },
  Kn = (t) => (((t) => Array.isArray(t))(t) ? t[t.length - 1] || 0 : t);
function $n(t) {
  const e = [{}, {}];
  return (
    null == t ||
      t.values.forEach((t, n) => {
        (e[0][n] = t.get()), (e[1][n] = t.getVelocity());
      }),
    e
  );
}
function zn(t, e, n, s) {
  if ('function' == typeof e) {
    const [i, r] = $n(s);
    e = e(void 0 !== n ? n : t.custom, i, r);
  }
  if (
    ('string' == typeof e && (e = t.variants && t.variants[e]),
    'function' == typeof e)
  ) {
    const [i, r] = $n(s);
    e = e(void 0 !== n ? n : t.custom, i, r);
  }
  return e;
}
function jn(t, e, n) {
  t.hasValue(e) ? t.getValue(e).set(n) : t.addValue(e, f(n));
}
function Hn(t, e) {
  const n = (function (t, e, n) {
    const s = t.getProps();
    return zn(s, e, void 0 !== n ? n : s.custom, t);
  })(t, e);
  let { transitionEnd: s = {}, transition: i = {}, ...r } = n || {};
  r = { ...r, ...s };
  for (const e in r) {
    jn(t, e, Kn(r[e]));
  }
}
const Un = (t) => t.replace(/([a-z])([A-Z])/gu, '$1-$2').toLowerCase(),
  Yn = 'data-' + Un('framerAppearId');
function qn(t) {
  return t.props[Yn];
}
function Xn(t, e) {
  const n = t.getValue('willChange');
  if (((s = n), Boolean(H(s) && s.add))) return n.add(e);
  var s;
}
function Gn({ protectedKeys: t, needsAnimating: e }, n) {
  const s = t.hasOwnProperty(n) && !0 !== e[n];
  return (e[n] = !1), s;
}
function Zn(t, e, { delay: n = 0, transitionOverride: s, type: i } = {}) {
  var r;
  let { transition: a = t.getDefaultTransition(), transitionEnd: l, ...u } = e;
  s && (a = s);
  const c = [],
    h = i && t.animationState && t.animationState.getState()[i];
  for (const e in u) {
    const s = t.getValue(
        e,
        null !== (r = t.latestValues[e]) && void 0 !== r ? r : null
      ),
      i = u[e];
    if (void 0 === i || (h && Gn(h, e))) continue;
    const l = { delay: n, ...mt(a || {}, e) };
    let d = !1;
    if (window.MotionHandoffAnimation) {
      const n = qn(t);
      if (n) {
        const t = window.MotionHandoffAnimation(n, e, o);
        null !== t && ((l.startTime = t), (d = !0));
      }
    }
    Xn(t, e),
      s.start(
        Nn(e, s, i, t.shouldReduceMotion && ct.has(e) ? { type: !1 } : l, t, d)
      );
    const p = s.animation;
    p && c.push(p);
  }
  return (
    l &&
      Promise.all(c).then(() => {
        o.update(() => {
          l && Hn(t, l);
        });
      }),
    c
  );
}
const _n = {};
function Jn(t, { layout: e, layoutId: n }) {
  return (
    ct.has(t) ||
    t.startsWith('origin') ||
    ((e || void 0 !== n) && (!!_n[t] || 'opacity' === t))
  );
}
function Qn(t, e, n) {
  var s;
  const { style: i } = t,
    r = {};
  for (const o in i)
    (H(i[o]) ||
      (e.style && H(e.style[o])) ||
      Jn(o, t) ||
      void 0 !==
        (null === (s = null == n ? void 0 : n.getValue(o)) || void 0 === s
          ? void 0
          : s.liveStyle)) &&
      (r[o] = i[o]);
  return r;
}
const ts = 'undefined' != typeof window,
  es = { current: null },
  ns = { current: !1 };
const ss = [
  'initial',
  'animate',
  'whileInView',
  'whileFocus',
  'whileHover',
  'whileTap',
  'whileDrag',
  'exit',
];
function is(t) {
  return (
    (null !== (e = t.animate) &&
      'object' == typeof e &&
      'function' == typeof e.start) ||
    ss.some((e) =>
      (function (t) {
        return 'string' == typeof t || Array.isArray(t);
      })(t[e])
    )
  );
  var e;
}
const rs = {
    animation: [
      'animate',
      'variants',
      'whileHover',
      'whileTap',
      'exit',
      'whileInView',
      'whileFocus',
      'whileDrag',
    ],
    exit: ['exit'],
    drag: ['drag', 'dragControls'],
    focus: ['whileFocus'],
    hover: ['whileHover', 'onHoverStart', 'onHoverEnd'],
    tap: ['whileTap', 'onTap', 'onTapStart', 'onTapCancel'],
    pan: ['onPan', 'onPanStart', 'onPanSessionStart', 'onPanEnd'],
    inView: ['whileInView', 'onViewportEnter', 'onViewportLeave'],
    layout: ['layout', 'layoutId'],
  },
  os = {};
for (const t in rs) os[t] = { isEnabled: (e) => rs[t].some((t) => !!e[t]) };
const as = [...ie, xe, Re],
  ls = () => ({ x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }),
  us = [
    'AnimationStart',
    'AnimationComplete',
    'Update',
    'BeforeLayoutMeasure',
    'LayoutMeasure',
    'LayoutAnimationStart',
    'LayoutAnimationComplete',
  ];
class cs {
  scrapeMotionValuesFromProps(t, e, n) {
    return {};
  }
  constructor(
    {
      parent: t,
      props: e,
      presenceContext: n,
      reducedMotionConfig: s,
      blockInitialAnimation: i,
      visualState: r,
    },
    a = {}
  ) {
    (this.current = null),
      (this.children = new Set()),
      (this.isVariantNode = !1),
      (this.isControllingVariants = !1),
      (this.shouldReduceMotion = null),
      (this.values = new Map()),
      (this.KeyframeResolver = he),
      (this.features = {}),
      (this.valueSubscriptions = new Map()),
      (this.prevMotionValues = {}),
      (this.events = {}),
      (this.propEventSubscriptions = {}),
      (this.notifyUpdate = () => this.notify('Update', this.latestValues)),
      (this.render = () => {
        this.current &&
          (this.triggerBuild(),
          this.renderInstance(
            this.current,
            this.renderState,
            this.props.style,
            this.projection
          ));
      }),
      (this.renderScheduledAt = 0),
      (this.scheduleRender = () => {
        const t = d.now();
        this.renderScheduledAt < t &&
          ((this.renderScheduledAt = t), o.render(this.render, !1, !0));
      });
    const { latestValues: l, renderState: u } = r;
    (this.latestValues = l),
      (this.baseTarget = { ...l }),
      (this.initialValues = e.initial ? { ...l } : {}),
      (this.renderState = u),
      (this.parent = t),
      (this.props = e),
      (this.presenceContext = n),
      (this.depth = t ? t.depth + 1 : 0),
      (this.reducedMotionConfig = s),
      (this.options = a),
      (this.blockInitialAnimation = Boolean(i)),
      (this.isControllingVariants = is(e)),
      (this.isVariantNode = (function (t) {
        return Boolean(is(t) || t.variants);
      })(e)),
      this.isVariantNode && (this.variantChildren = new Set()),
      (this.manuallyAnimateOnMount = Boolean(t && t.current));
    const { willChange: c, ...h } = this.scrapeMotionValuesFromProps(
      e,
      {},
      this
    );
    for (const t in h) {
      const e = h[t];
      void 0 !== l[t] && H(e) && e.set(l[t], !1);
    }
  }
  mount(t) {
    (this.current = t),
      lt.set(t, this),
      this.projection && !this.projection.instance && this.projection.mount(t),
      this.parent &&
        this.isVariantNode &&
        !this.isControllingVariants &&
        (this.removeFromVariantTree = this.parent.addVariantChild(this)),
      this.values.forEach((t, e) => this.bindToMotionValue(e, t)),
      ns.current ||
        (function () {
          if (((ns.current = !0), ts))
            if (window.matchMedia) {
              const t = window.matchMedia('(prefers-reduced-motion)'),
                e = () => (es.current = t.matches);
              t.addListener(e), e();
            } else es.current = !1;
        })(),
      (this.shouldReduceMotion =
        'never' !== this.reducedMotionConfig &&
        ('always' === this.reducedMotionConfig || es.current)),
      this.parent && this.parent.children.add(this),
      this.update(this.props, this.presenceContext);
  }
  unmount() {
    lt.delete(this.current),
      this.projection && this.projection.unmount(),
      a(this.notifyUpdate),
      a(this.render),
      this.valueSubscriptions.forEach((t) => t()),
      this.valueSubscriptions.clear(),
      this.removeFromVariantTree && this.removeFromVariantTree(),
      this.parent && this.parent.children.delete(this);
    for (const t in this.events) this.events[t].clear();
    for (const t in this.features) {
      const e = this.features[t];
      e && (e.unmount(), (e.isMounted = !1));
    }
    this.current = null;
  }
  bindToMotionValue(t, e) {
    this.valueSubscriptions.has(t) && this.valueSubscriptions.get(t)();
    const n = ct.has(t),
      s = e.on('change', (e) => {
        (this.latestValues[t] = e),
          this.props.onUpdate && o.preRender(this.notifyUpdate),
          n && this.projection && (this.projection.isTransformDirty = !0);
      }),
      i = e.on('renderRequest', this.scheduleRender);
    let r;
    window.MotionCheckAppearSync &&
      (r = window.MotionCheckAppearSync(this, t, e)),
      this.valueSubscriptions.set(t, () => {
        s(), i(), r && r(), e.owner && e.stop();
      });
  }
  sortNodePosition(t) {
    return this.current && this.sortInstanceNodePosition && this.type === t.type
      ? this.sortInstanceNodePosition(this.current, t.current)
      : 0;
  }
  updateFeatures() {
    let t = 'animation';
    for (t in os) {
      const e = os[t];
      if (!e) continue;
      const { isEnabled: n, Feature: s } = e;
      if (
        (!this.features[t] &&
          s &&
          n(this.props) &&
          (this.features[t] = new s(this)),
        this.features[t])
      ) {
        const e = this.features[t];
        e.isMounted ? e.update() : (e.mount(), (e.isMounted = !0));
      }
    }
  }
  triggerBuild() {
    this.build(this.renderState, this.latestValues, this.props);
  }
  measureViewportBox() {
    return this.current
      ? this.measureInstanceViewportBox(this.current, this.props)
      : { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
  }
  getStaticValue(t) {
    return this.latestValues[t];
  }
  setStaticValue(t, e) {
    this.latestValues[t] = e;
  }
  update(t, e) {
    (t.transformTemplate || this.props.transformTemplate) &&
      this.scheduleRender(),
      (this.prevProps = this.props),
      (this.props = t),
      (this.prevPresenceContext = this.presenceContext),
      (this.presenceContext = e);
    for (let e = 0; e < us.length; e++) {
      const n = us[e];
      this.propEventSubscriptions[n] &&
        (this.propEventSubscriptions[n](),
        delete this.propEventSubscriptions[n]);
      const s = t['on' + n];
      s && (this.propEventSubscriptions[n] = this.on(n, s));
    }
    (this.prevMotionValues = (function (t, e, n) {
      for (const s in e) {
        const i = e[s],
          r = n[s];
        if (H(i)) t.addValue(s, i);
        else if (H(r)) t.addValue(s, f(i, { owner: t }));
        else if (r !== i)
          if (t.hasValue(s)) {
            const e = t.getValue(s);
            !0 === e.liveStyle ? e.jump(i) : e.hasAnimated || e.set(i);
          } else {
            const e = t.getStaticValue(s);
            t.addValue(s, f(void 0 !== e ? e : i, { owner: t }));
          }
      }
      for (const s in n) void 0 === e[s] && t.removeValue(s);
      return e;
    })(
      this,
      this.scrapeMotionValuesFromProps(t, this.prevProps, this),
      this.prevMotionValues
    )),
      this.handleChildMotionValue && this.handleChildMotionValue();
  }
  getProps() {
    return this.props;
  }
  getVariant(t) {
    return this.props.variants ? this.props.variants[t] : void 0;
  }
  getDefaultTransition() {
    return this.props.transition;
  }
  getTransformPagePoint() {
    return this.props.transformPagePoint;
  }
  getClosestVariantNode() {
    return this.isVariantNode
      ? this
      : this.parent
      ? this.parent.getClosestVariantNode()
      : void 0;
  }
  addVariantChild(t) {
    const e = this.getClosestVariantNode();
    if (e)
      return (
        e.variantChildren && e.variantChildren.add(t),
        () => e.variantChildren.delete(t)
      );
  }
  addValue(t, e) {
    const n = this.values.get(t);
    e !== n &&
      (n && this.removeValue(t),
      this.bindToMotionValue(t, e),
      this.values.set(t, e),
      (this.latestValues[t] = e.get()));
  }
  removeValue(t) {
    this.values.delete(t);
    const e = this.valueSubscriptions.get(t);
    e && (e(), this.valueSubscriptions.delete(t)),
      delete this.latestValues[t],
      this.removeValueFromRenderState(t, this.renderState);
  }
  hasValue(t) {
    return this.values.has(t);
  }
  getValue(t, e) {
    if (this.props.values && this.props.values[t]) return this.props.values[t];
    let n = this.values.get(t);
    return (
      void 0 === n &&
        void 0 !== e &&
        ((n = f(null === e ? void 0 : e, { owner: this })),
        this.addValue(t, n)),
      n
    );
  }
  readValue(t, e) {
    var n;
    let s =
      void 0 === this.latestValues[t] && this.current
        ? null !== (n = this.getBaseTargetFromProps(this.props, t)) &&
          void 0 !== n
          ? n
          : this.readValueFromInstance(this.current, t, this.options)
        : this.latestValues[t];
    var i;
    return (
      null != s &&
        ('string' == typeof s && (Ot(s) || Et(s))
          ? (s = parseFloat(s))
          : ((i = s), !as.find(se(i)) && Re.test(e) && (s = He(t, e))),
        this.setBaseTarget(t, H(s) ? s.get() : s)),
      H(s) ? s.get() : s
    );
  }
  setBaseTarget(t, e) {
    this.baseTarget[t] = e;
  }
  getBaseTarget(t) {
    var e;
    const { initial: n } = this.props;
    let s;
    if ('string' == typeof n || 'object' == typeof n) {
      const i = zn(
        this.props,
        n,
        null === (e = this.presenceContext) || void 0 === e ? void 0 : e.custom
      );
      i && (s = i[t]);
    }
    if (n && void 0 !== s) return s;
    const i = this.getBaseTargetFromProps(this.props, t);
    return void 0 === i || H(i)
      ? void 0 !== this.initialValues[t] && void 0 === s
        ? void 0
        : this.baseTarget[t]
      : i;
  }
  on(t, n) {
    return this.events[t] || (this.events[t] = new e()), this.events[t].add(n);
  }
  notify(t, ...e) {
    this.events[t] && this.events[t].notify(...e);
  }
}
class hs extends cs {
  constructor() {
    super(...arguments), (this.KeyframeResolver = Ye);
  }
  sortInstanceNodePosition(t, e) {
    return 2 & t.compareDocumentPosition(e) ? 1 : -1;
  }
  getBaseTargetFromProps(t, e) {
    return t.style ? t.style[e] : void 0;
  }
  removeValueFromRenderState(t, { vars: e, style: n }) {
    delete e[t], delete n[t];
  }
}
const ds = (t, e) => (e && 'number' == typeof t ? e.transform(t) : t),
  ps = {
    x: 'translateX',
    y: 'translateY',
    z: 'translateZ',
    transformPerspective: 'perspective',
  },
  fs = ut.length;
function ms(t, e, n) {
  const { style: s, vars: i, transformOrigin: r } = t;
  let o = !1,
    a = !1;
  for (const t in e) {
    const n = e[t];
    if (ct.has(t)) o = !0;
    else if (Bt(t)) i[t] = n;
    else {
      const e = ds(n, $e[t]);
      t.startsWith('origin') ? ((a = !0), (r[t] = e)) : (s[t] = e);
    }
  }
  if (
    (e.transform ||
      (o || n
        ? (s.transform = (function (t, e, n) {
            let s = '',
              i = !0;
            for (let r = 0; r < fs; r++) {
              const o = ut[r],
                a = t[o];
              if (void 0 === a) continue;
              let l = !0;
              if (
                ((l =
                  'number' == typeof a
                    ? a === (o.startsWith('scale') ? 1 : 0)
                    : 0 === parseFloat(a)),
                !l || n)
              ) {
                const t = ds(a, $e[o]);
                l || ((i = !1), (s += `${ps[o] || o}(${t}) `)), n && (e[o] = t);
              }
            }
            return (
              (s = s.trim()), n ? (s = n(e, i ? '' : s)) : i && (s = 'none'), s
            );
          })(e, t.transform, n))
        : s.transform && (s.transform = 'none')),
    a)
  ) {
    const { originX: t = '50%', originY: e = '50%', originZ: n = 0 } = r;
    s.transformOrigin = `${t} ${e} ${n}`;
  }
}
function gs(t, e, n) {
  return 'string' == typeof t ? t : Yt.transform(e + n * t);
}
const ys = { offset: 'stroke-dashoffset', array: 'stroke-dasharray' },
  vs = { offset: 'strokeDashoffset', array: 'strokeDasharray' };
function ws(
  t,
  {
    attrX: e,
    attrY: n,
    attrScale: s,
    originX: i,
    originY: r,
    pathLength: o,
    pathSpacing: a = 1,
    pathOffset: l = 0,
    ...u
  },
  c,
  h
) {
  if ((ms(t, u, h), c))
    return void (t.style.viewBox && (t.attrs.viewBox = t.style.viewBox));
  (t.attrs = t.style), (t.style = {});
  const { attrs: d, style: p, dimensions: f } = t;
  d.transform && (f && (p.transform = d.transform), delete d.transform),
    f &&
      (void 0 !== i || void 0 !== r || p.transform) &&
      (p.transformOrigin = (function (t, e, n) {
        return `${gs(e, t.x, t.width)} ${gs(n, t.y, t.height)}`;
      })(f, void 0 !== i ? i : 0.5, void 0 !== r ? r : 0.5)),
    void 0 !== e && (d.x = e),
    void 0 !== n && (d.y = n),
    void 0 !== s && (d.scale = s),
    void 0 !== o &&
      (function (t, e, n = 1, s = 0, i = !0) {
        t.pathLength = 1;
        const r = i ? ys : vs;
        t[r.offset] = Yt.transform(-s);
        const o = Yt.transform(e),
          a = Yt.transform(n);
        t[r.array] = `${o} ${a}`;
      })(d, o, a, l, !1);
}
const bs = new Set([
  'baseFrequency',
  'diffuseConstant',
  'kernelMatrix',
  'kernelUnitLength',
  'keySplines',
  'keyTimes',
  'limitingConeAngle',
  'markerHeight',
  'markerWidth',
  'numOctaves',
  'targetX',
  'targetY',
  'surfaceScale',
  'specularConstant',
  'specularExponent',
  'stdDeviation',
  'tableValues',
  'viewBox',
  'gradientTransform',
  'pathLength',
  'startOffset',
  'textLength',
  'lengthAdjust',
]);
function xs(t, { style: e, vars: n }, s, i) {
  Object.assign(t.style, e, i && i.getProjectionStyles(s));
  for (const e in n) t.style.setProperty(e, n[e]);
}
class Ts extends hs {
  constructor() {
    super(...arguments),
      (this.type = 'svg'),
      (this.isSVGTag = !1),
      (this.measureInstanceViewportBox = ls);
  }
  getBaseTargetFromProps(t, e) {
    return t[e];
  }
  readValueFromInstance(t, e) {
    if (ct.has(e)) {
      const t = je(e);
      return (t && t.default) || 0;
    }
    return (e = bs.has(e) ? e : Un(e)), t.getAttribute(e);
  }
  scrapeMotionValuesFromProps(t, e, n) {
    return (function (t, e, n) {
      const s = Qn(t, e, n);
      for (const n in t)
        (H(t[n]) || H(e[n])) &&
          (s[
            -1 !== ut.indexOf(n)
              ? 'attr' + n.charAt(0).toUpperCase() + n.substring(1)
              : n
          ] = t[n]);
      return s;
    })(t, e, n);
  }
  build(t, e, n) {
    ws(t, e, this.isSVGTag, n.transformTemplate);
  }
  renderInstance(t, e, n, s) {
    !(function (t, e, n, s) {
      xs(t, e, void 0, s);
      for (const n in e.attrs)
        t.setAttribute(bs.has(n) ? n : Un(n), e.attrs[n]);
    })(t, e, 0, s);
  }
  mount(t) {
    var e;
    (this.isSVGTag =
      'string' == typeof (e = t.tagName) && 'svg' === e.toLowerCase()),
      super.mount(t);
  }
}
class Ss extends hs {
  constructor() {
    super(...arguments), (this.type = 'html'), (this.renderInstance = xs);
  }
  readValueFromInstance(t, e) {
    if (ct.has(e)) {
      const t = je(e);
      return (t && t.default) || 0;
    }
    {
      const s = ((n = t), window.getComputedStyle(n)),
        i = (Bt(e) ? s.getPropertyValue(e) : s[e]) || 0;
      return 'string' == typeof i ? i.trim() : i;
    }
    var n;
  }
  measureInstanceViewportBox(t, { transformPagePoint: e }) {
    return (function (t, e) {
      return (function ({ top: t, left: e, right: n, bottom: s }) {
        return { x: { min: e, max: n }, y: { min: t, max: s } };
      })(
        (function (t, e) {
          if (!e) return t;
          const n = e({ x: t.left, y: t.top }),
            s = e({ x: t.right, y: t.bottom });
          return { top: n.y, left: n.x, bottom: s.y, right: s.x };
        })(t.getBoundingClientRect(), e)
      );
    })(t, e);
  }
  build(t, e, n) {
    ms(t, e, n.transformTemplate);
  }
  scrapeMotionValuesFromProps(t, e, n) {
    return Qn(t, e, n);
  }
  handleChildMotionValue() {
    this.childSubscription &&
      (this.childSubscription(), delete this.childSubscription);
    const { children: t } = this.props;
    H(t) &&
      (this.childSubscription = t.on('change', (t) => {
        this.current && (this.current.textContent = `${t}`);
      }));
  }
}
class Vs extends cs {
  constructor() {
    super(...arguments), (this.type = 'object');
  }
  readValueFromInstance(t, e) {
    if (
      (function (t, e) {
        return t in e;
      })(e, t)
    ) {
      const n = t[e];
      if ('string' == typeof n || 'number' == typeof n) return n;
    }
  }
  getBaseTargetFromProps() {}
  removeValueFromRenderState(t, e) {
    delete e.output[t];
  }
  measureInstanceViewportBox() {
    return { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
  }
  build(t, e) {
    Object.assign(t.output, e);
  }
  renderInstance(t, { output: e }) {
    Object.assign(t, e);
  }
  sortInstanceNodePosition() {
    return 0;
  }
}
function As(t) {
  const e = {
      presenceContext: null,
      props: {},
      visualState: {
        renderState: {
          transform: {},
          transformOrigin: {},
          style: {},
          vars: {},
          attrs: {},
        },
        latestValues: {},
      },
    },
    n = (function (t) {
      return t instanceof SVGElement && 'svg' !== t.tagName;
    })(t)
      ? new Ts(e)
      : new Ss(e);
  n.mount(t), lt.set(t, n);
}
function Ms(t) {
  const e = new Vs({
    presenceContext: null,
    props: {},
    visualState: { renderState: { output: {} }, latestValues: {} },
  });
  e.mount(t), lt.set(t, e);
}
function Ps(t, e, n, s) {
  const i = [];
  if (
    (function (t, e) {
      return H(t) || 'number' == typeof t || ('string' == typeof t && !Y(e));
    })(t, e)
  )
    i.push(
      (function (t, e, n) {
        const s = H(t) ? t : f(t);
        return s.start(Nn('', s, e, n)), s.animation;
      })(t, (Y(e) && e.default) || e, (n && n.default) || n)
    );
  else {
    const r = q(t, e, s),
      o = r.length;
    for (let t = 0; t < o; t++) {
      const s = r[t],
        a = s instanceof Element ? As : Ms;
      lt.has(s) || a(s);
      const l = lt.get(s),
        u = { ...n };
      'delay' in u && 'function' == typeof u.delay && (u.delay = u.delay(t, o)),
        i.push(...Zn(l, { ...e, transition: u }, {}));
    }
  }
  return i;
}
function ks(t, e, n) {
  const s = [],
    i = (function (t, { defaultTransition: e = {}, ...n } = {}, s, i) {
      const r = e.duration || 0.3,
        o = new Map(),
        a = new Map(),
        l = {},
        u = new Map();
      let c = 0,
        h = 0,
        d = 0;
      for (let n = 0; n < t.length; n++) {
        const o = t[n];
        if ('string' == typeof o) {
          u.set(o, h);
          continue;
        }
        if (!Array.isArray(o)) {
          u.set(o.name, G(h, o.at, c, u));
          continue;
        }
        let [p, f, m = {}] = o;
        void 0 !== m.at && (h = G(h, m.at, c, u));
        let g = 0;
        const y = (t, n, s, o = 0, a = 0) => {
          const l = it(t),
            { delay: u = 0, times: c = j(l), type: p = 'keyframes', ...f } = n;
          let { ease: m = e.ease || 'easeOut', duration: y } = n;
          const w = 'function' == typeof u ? u(o, a) : u,
            b = l.length,
            x = X(p) ? p : null == i ? void 0 : i[p];
          if (b <= 2 && x) {
            let t = 100;
            if (2 === b && at(l)) {
              const e = l[1] - l[0];
              t = Math.abs(e);
            }
            const e = { ...f };
            void 0 !== y && (e.duration = v(y));
            const n = N(e, t, x);
            (m = n.ease), (y = n.duration);
          }
          null != y || (y = r);
          const T = h + w,
            S = T + y;
          1 === c.length && 0 === c[0] && (c[1] = 1);
          const V = c.length - l.length;
          V > 0 && z(c, V),
            1 === l.length && l.unshift(null),
            Q(s, l, m, c, T, S),
            (g = Math.max(w + y, g)),
            (d = Math.max(S, d));
        };
        if (H(p)) y(f, m, st('default', nt(p, a)));
        else {
          const t = q(p, f, s, l),
            e = t.length;
          for (let n = 0; n < e; n++) {
            const s = nt(t[n], a);
            for (const t in f) y(f[t], rt(m, t), st(t, s), n, e);
          }
        }
        (c = h), (h += g);
      }
      return (
        a.forEach((t, s) => {
          for (const i in t) {
            const r = t[i];
            r.sort(tt);
            const a = [],
              l = [],
              u = [];
            for (let t = 0; t < r.length; t++) {
              const { at: e, value: n, easing: s } = r[t];
              a.push(n), l.push($(0, d, e)), u.push(s || 'easeOut');
            }
            0 !== l[0] && (l.unshift(0), a.unshift(a[0]), u.unshift(et)),
              1 !== l[l.length - 1] && (l.push(1), a.push(null)),
              o.has(s) || o.set(s, { keyframes: {}, transition: {} });
            const c = o.get(s);
            (c.keyframes[i] = a),
              (c.transition[i] = {
                ...e,
                duration: d,
                ease: u,
                times: l,
                ...n,
              });
          }
        }),
        o
      );
    })(t, e, n, { spring: L });
  return (
    i.forEach(({ keyframes: t, transition: e }, n) => {
      s.push(...Ps(n, t, e));
    }),
    s
  );
}
function Fs(t) {
  return function (e, n, s) {
    let i = [];
    var r;
    (r = e),
      (i =
        Array.isArray(r) && Array.isArray(r[0]) ? ks(e, n, t) : Ps(e, n, s, t));
    const o = new y(i);
    return t && t.animations.push(o), o;
  };
}
const Cs = Fs();
function Es(t, e, n) {
  t.style.setProperty(`--${e}`, n);
}
function Os(t, e, n) {
  t.style[e] = n;
}
const Rs = m(() => {
    try {
      document.createElement('div').animate({ opacity: [1] });
    } catch (t) {
      return !1;
    }
    return !0;
  }),
  Bs = new WeakMap();
const Is = 'easeOut';
function Ls(t) {
  const e = Bs.get(t) || new Map();
  return Bs.set(t, e), Bs.get(t);
}
class Ws {
  constructor(t, e, n, s) {
    const i = e.startsWith('--');
    (this.setValue = i ? Es : Os),
      (this.options = s),
      this.updateFinishedPromise(),
      S('string' != typeof s.type);
    const r = Ls(t).get(e);
    r && r.stop();
    if (
      (Array.isArray(n) || (n = [n]),
      (function (t, e, n) {
        for (let s = 0; s < e.length; s++)
          null === e[s] && (e[s] = 0 === s ? n() : e[s - 1]),
            'number' == typeof e[s] && De[t] && (e[s] = De[t].transform(e[s]));
        !Rs() && e.length < 2 && e.unshift(n());
      })(e, n, () =>
        e.startsWith('--')
          ? t.style.getPropertyValue(e)
          : window.getComputedStyle(t)[e]
      ),
      X(s.type))
    ) {
      const t = N(s, 100, s.type);
      (s.ease = Fn() ? t.ease : Is),
        (s.duration = v(t.duration)),
        (s.type = 'keyframes');
    } else s.ease = s.ease || Is;
    this.removeAnimation = () => {
      var n;
      return null === (n = Bs.get(t)) || void 0 === n ? void 0 : n.delete(e);
    };
    const o = () => {
      this.setValue(t, e, yt(n, this.options)),
        this.cancel(),
        this.resolveFinishedPromise();
    };
    Ln()
      ? ((this.animation = Bn(t, e, n, s)),
        !1 === s.autoplay && this.animation.pause(),
        (this.animation.onfinish = o),
        this.pendingTimeline && In(this.animation, this.pendingTimeline),
        Ls(t).set(e, this))
      : o();
  }
  get duration() {
    return w(this.options.duration || 300);
  }
  get time() {
    var t;
    return this.animation
      ? w(
          (null === (t = this.animation) || void 0 === t
            ? void 0
            : t.currentTime) || 0
        )
      : 0;
  }
  set time(t) {
    this.animation && (this.animation.currentTime = v(t));
  }
  get speed() {
    return this.animation ? this.animation.playbackRate : 1;
  }
  set speed(t) {
    this.animation && (this.animation.playbackRate = t);
  }
  get state() {
    return this.animation ? this.animation.playState : 'finished';
  }
  get startTime() {
    return this.animation ? this.animation.startTime : null;
  }
  play() {
    'finished' === this.state && this.updateFinishedPromise(),
      this.animation && this.animation.play();
  }
  pause() {
    this.animation && this.animation.pause();
  }
  stop() {
    this.animation &&
      'idle' !== this.state &&
      'finished' !== this.state &&
      (this.animation.commitStyles && this.animation.commitStyles(),
      this.cancel());
  }
  complete() {
    this.animation && this.animation.finish();
  }
  cancel() {
    this.removeAnimation();
    try {
      this.animation && this.animation.cancel();
    } catch (t) {}
  }
  then(t, e) {
    return this.currentFinishedPromise.then(t, e);
  }
  updateFinishedPromise() {
    this.currentFinishedPromise = new Promise((t) => {
      this.resolveFinishedPromise = t;
    });
  }
  attachTimeline(t) {
    return (
      this.animation ? In(this.animation, t) : (this.pendingTimeline = t), i
    );
  }
}
const Ds = (t) =>
    function (e, n, s) {
      return new y(
        (function (t, e, n, s) {
          const i = U(t, s),
            r = i.length,
            o = [];
          for (let t = 0; t < r; t++) {
            const s = i[t],
              a = { ...n };
            'function' == typeof a.delay && (a.delay = a.delay(t, r));
            for (const t in e) {
              const i = e[t],
                r = { ...mt(n, t) };
              (r.duration = r.duration ? v(r.duration) : r.duration),
                (r.delay = v(r.delay || 0)),
                o.push(new Ws(s, t, i, r));
            }
          }
          return o;
        })(e, n, s, t)
      );
    },
  Ns = Ds(),
  Ks = new WeakMap();
let $s;
function zs({ target: t, contentRect: e, borderBoxSize: n }) {
  var s;
  null === (s = Ks.get(t)) ||
    void 0 === s ||
    s.forEach((s) => {
      s({
        target: t,
        contentSize: e,
        get size() {
          return (function (t, e) {
            if (e) {
              const { inlineSize: t, blockSize: n } = e[0];
              return { width: t, height: n };
            }
            return t instanceof SVGElement && 'getBBox' in t
              ? t.getBBox()
              : { width: t.offsetWidth, height: t.offsetHeight };
          })(t, n);
        },
      });
    });
}
function js(t) {
  t.forEach(zs);
}
function Hs(t, e) {
  $s || ('undefined' != typeof ResizeObserver && ($s = new ResizeObserver(js)));
  const n = U(t);
  return (
    n.forEach((t) => {
      let n = Ks.get(t);
      n || ((n = new Set()), Ks.set(t, n)),
        n.add(e),
        null == $s || $s.observe(t);
    }),
    () => {
      n.forEach((t) => {
        const n = Ks.get(t);
        null == n || n.delete(e),
          (null == n ? void 0 : n.size) || null == $s || $s.unobserve(t);
      });
    }
  );
}
const Us = new Set();
let Ys;
function qs(t) {
  return (
    Us.add(t),
    Ys ||
      ((Ys = () => {
        const t = { width: window.innerWidth, height: window.innerHeight },
          e = { target: window, size: t, contentSize: t };
        Us.forEach((t) => t(e));
      }),
      window.addEventListener('resize', Ys)),
    () => {
      Us.delete(t), !Us.size && Ys && (Ys = void 0);
    }
  );
}
const Xs = 50,
  Gs = () => ({
    time: 0,
    x: {
      current: 0,
      offset: [],
      progress: 0,
      scrollLength: 0,
      targetOffset: 0,
      targetLength: 0,
      containerLength: 0,
      velocity: 0,
    },
    y: {
      current: 0,
      offset: [],
      progress: 0,
      scrollLength: 0,
      targetOffset: 0,
      targetLength: 0,
      containerLength: 0,
      velocity: 0,
    },
  }),
  Zs = {
    x: { length: 'Width', position: 'Left' },
    y: { length: 'Height', position: 'Top' },
  };
function _s(t, e, s, i) {
  const r = s[e],
    { length: o, position: a } = Zs[e],
    l = r.current,
    u = s.time;
  (r.current = t[`scroll${a}`]),
    (r.scrollLength = t[`scroll${o}`] - t[`client${o}`]),
    (r.offset.length = 0),
    (r.offset[0] = 0),
    (r.offset[1] = r.scrollLength),
    (r.progress = $(0, r.scrollLength, r.current));
  const c = i - u;
  r.velocity = c > Xs ? 0 : n(r.current - l, c);
}
const Js = {
    Enter: [
      [0, 1],
      [1, 1],
    ],
    Exit: [
      [0, 0],
      [1, 0],
    ],
    Any: [
      [1, 0],
      [0, 1],
    ],
    All: [
      [0, 0],
      [1, 1],
    ],
  },
  Qs = { start: 0, center: 0.5, end: 1 };
function ti(t, e, n = 0) {
  let s = 0;
  if ((t in Qs && (t = Qs[t]), 'string' == typeof t)) {
    const e = parseFloat(t);
    t.endsWith('px')
      ? (s = e)
      : t.endsWith('%')
      ? (t = e / 100)
      : t.endsWith('vw')
      ? (s = (e / 100) * document.documentElement.clientWidth)
      : t.endsWith('vh')
      ? (s = (e / 100) * document.documentElement.clientHeight)
      : (t = e);
  }
  return 'number' == typeof t && (s = e * t), n + s;
}
const ei = [0, 0];
function ni(t, e, n, s) {
  let i = Array.isArray(t) ? t : ei,
    r = 0,
    o = 0;
  return (
    'number' == typeof t
      ? (i = [t, t])
      : 'string' == typeof t &&
        (i = (t = t.trim()).includes(' ')
          ? t.split(' ')
          : [t, Qs[t] ? t : '0']),
    (r = ti(i[0], n, s)),
    (o = ti(i[1], e)),
    r - o
  );
}
const si = { x: 0, y: 0 };
function ii(t, e, n) {
  const { offset: s = Js.All } = n,
    { target: i = t, axis: r = 'y' } = n,
    o = 'y' === r ? 'height' : 'width',
    a =
      i !== t
        ? (function (t, e) {
            const n = { x: 0, y: 0 };
            let s = t;
            for (; s && s !== e; )
              if (s instanceof HTMLElement)
                (n.x += s.offsetLeft),
                  (n.y += s.offsetTop),
                  (s = s.offsetParent);
              else if ('svg' === s.tagName) {
                const t = s.getBoundingClientRect();
                s = s.parentElement;
                const e = s.getBoundingClientRect();
                (n.x += t.left - e.left), (n.y += t.top - e.top);
              } else {
                if (!(s instanceof SVGGraphicsElement)) break;
                {
                  const { x: t, y: e } = s.getBBox();
                  (n.x += t), (n.y += e);
                  let i = null,
                    r = s.parentNode;
                  for (; !i; )
                    'svg' === r.tagName && (i = r), (r = s.parentNode);
                  s = i;
                }
              }
            return n;
          })(i, t)
        : si,
    l =
      i === t
        ? { width: t.scrollWidth, height: t.scrollHeight }
        : (function (t) {
            return 'getBBox' in t && 'svg' !== t.tagName
              ? t.getBBox()
              : { width: t.clientWidth, height: t.clientHeight };
          })(i),
    u = { width: t.clientWidth, height: t.clientHeight };
  e[r].offset.length = 0;
  let c = !e[r].interpolate;
  const h = s.length;
  for (let t = 0; t < h; t++) {
    const n = ni(s[t], u[o], l[o], a[r]);
    c || n === e[r].interpolatorOffsets[t] || (c = !0), (e[r].offset[t] = n);
  }
  c &&
    ((e[r].interpolate = wn(e[r].offset, j(s))),
    (e[r].interpolatorOffsets = [...e[r].offset])),
    (e[r].progress = e[r].interpolate(e[r].current));
}
function ri(t, e, n, s = {}) {
  return {
    measure: () =>
      (function (t, e = t, n) {
        if (((n.x.targetOffset = 0), (n.y.targetOffset = 0), e !== t)) {
          let s = e;
          for (; s && s !== t; )
            (n.x.targetOffset += s.offsetLeft),
              (n.y.targetOffset += s.offsetTop),
              (s = s.offsetParent);
        }
        (n.x.targetLength = e === t ? e.scrollWidth : e.clientWidth),
          (n.y.targetLength = e === t ? e.scrollHeight : e.clientHeight),
          (n.x.containerLength = t.clientWidth),
          (n.y.containerLength = t.clientHeight);
      })(t, s.target, n),
    update: (e) => {
      !(function (t, e, n) {
        _s(t, 'x', e, n), _s(t, 'y', e, n), (e.time = n);
      })(t, n, e),
        (s.offset || s.target) && ii(t, n, s);
    },
    notify: () => e(n),
  };
}
const oi = new WeakMap(),
  ai = new WeakMap(),
  li = new WeakMap(),
  ui = (t) => (t === document.documentElement ? window : t);
function ci(t, { container: e = document.documentElement, ...n } = {}) {
  let s = li.get(e);
  s || ((s = new Set()), li.set(e, s));
  const i = Gs(),
    r = ri(e, t, i, n);
  if ((s.add(r), !oi.has(e))) {
    const t = () => {
        for (const t of s) t.measure();
      },
      n = () => {
        for (const t of s) t.update(l.timestamp);
      },
      i = () => {
        for (const t of s) t.notify();
      },
      r = () => {
        o.read(t, !1, !0), o.read(n, !1, !0), o.update(i, !1, !0);
      };
    oi.set(e, r);
    const a = ui(e);
    window.addEventListener('resize', r, { passive: !0 }),
      e !== document.documentElement &&
        ai.set(e, ((c = r), 'function' == typeof (u = e) ? qs(u) : Hs(u, c))),
      a.addEventListener('scroll', r, { passive: !0 });
  }
  var u, c;
  const h = oi.get(e);
  return (
    o.read(h, !1, !0),
    () => {
      var t;
      a(h);
      const n = li.get(e);
      if (!n) return;
      if ((n.delete(r), n.size)) return;
      const s = oi.get(e);
      oi.delete(e),
        s &&
          (ui(e).removeEventListener('scroll', s),
          null === (t = ai.get(e)) || void 0 === t || t(),
          window.removeEventListener('resize', s));
    }
  );
}
function hi(t, e) {
  let n;
  const s = () => {
    const { currentTime: s } = e,
      i = (null === s ? 0 : s.value) / 100;
    n !== i && t(i), (n = i);
  };
  return o.update(s, !0), () => a(s);
}
const di = new Map();
function pi({
  source: t,
  container: e = document.documentElement,
  axis: n = 'y',
} = {}) {
  t && (e = t), di.has(e) || di.set(e, {});
  const s = di.get(e);
  return (
    s[n] ||
      (s[n] = g()
        ? new ScrollTimeline({ source: e, axis: n })
        : (function ({ source: t, container: e, axis: n = 'y' }) {
            t && (e = t);
            const s = { value: 0 },
              i = ci(
                (t) => {
                  s.value = 100 * t[n].progress;
                },
                { container: e, axis: n }
              );
            return { currentTime: s, cancel: i };
          })({ source: e, axis: n })),
    s[n]
  );
}
function fi(t) {
  return t && (t.target || t.offset);
}
function mi(t, { axis: e = 'y', ...n } = {}) {
  const s = { axis: e, ...n };
  return 'function' == typeof t
    ? (function (t, e) {
        return (function (t) {
          return 2 === t.length;
        })(t) || fi(e)
          ? ci((n) => {
              t(n[e.axis].progress, n);
            }, e)
          : hi(t, pi(e));
      })(t, s)
    : (function (t, e) {
        if (fi(e))
          return (
            t.pause(),
            ci((n) => {
              t.time = t.duration * n[e.axis].progress;
            }, e)
          );
        {
          const n = pi(e);
          return t.attachTimeline(
            n,
            (t) => (
              t.pause(),
              hi((e) => {
                t.time = t.duration * e;
              }, n)
            )
          );
        }
      })(t, s);
}
const gi = { some: 0, all: 1 };
function yi(t, e, { root: n, margin: s, amount: i = 'some' } = {}) {
  const r = U(t),
    o = new WeakMap(),
    a = new IntersectionObserver(
      (t) => {
        t.forEach((t) => {
          const n = o.get(t.target);
          if (t.isIntersecting !== Boolean(n))
            if (t.isIntersecting) {
              const n = e(t);
              'function' == typeof n
                ? o.set(t.target, n)
                : a.unobserve(t.target);
            } else n && (n(t), o.delete(t.target));
        });
      },
      { root: n, rootMargin: s, threshold: 'number' == typeof i ? i : gi[i] }
    );
  return r.forEach((t) => a.observe(t)), () => a.disconnect();
}
function vi(t, e = 'end') {
  return (n) => {
    const s = (n = 'end' === e ? Math.min(n, 0.999) : Math.max(n, 0.001)) * t,
      i = 'end' === e ? Math.floor(s) : Math.ceil(s);
    return V(0, 1, i / t);
  };
}
function wi(t = 0.1, { startDelay: e = 0, from: n = 0, ease: s } = {}) {
  return (i, r) => {
    const o =
        'number' == typeof n
          ? n
          : (function (t, e) {
              if ('first' === t) return 0;
              {
                const n = e - 1;
                return 'last' === t ? n : n / 2;
              }
            })(n, r),
      a = Math.abs(o - i);
    let l = t * a;
    if (s) {
      const e = r * t;
      l = nn(s)(l / e) * e;
    }
    return e + l;
  };
}
function bi(...t) {
  const e = !Array.isArray(t[0]),
    n = e ? 0 : -1,
    s = t[0 + n],
    i = t[1 + n],
    r = t[2 + n],
    o = t[3 + n],
    a = wn(i, r, {
      mixer:
        ((l = r[0]),
        ((t) => t && 'object' == typeof t && t.mix)(l) ? l.mix : void 0),
      ...o,
    });
  var l;
  return e ? a(s) : a;
}
function xi(t, e) {
  return (function (t, e) {
    const n = d.now(),
      s = ({ timestamp: i }) => {
        const r = i - n;
        r >= e && (a(s), t(r - e));
      };
    return o.read(s, !0), () => a(s);
  })(t, v(e));
}
const Ti = (t, e) => Math.abs(t - e);
function Si(t, e) {
  const n = Ti(t.x, e.x),
    s = Ti(t.y, e.y);
  return Math.sqrt(n ** 2 + s ** 2);
}
const Vi = o,
  Ai = r.reduce((t, e) => ((t[e] = (t) => a(t)), t), {});
export {
  p as MotionValue,
  Cs as animate,
  Ns as animateMini,
  Pt as anticipate,
  At as backIn,
  Mt as backInOut,
  Vt as backOut,
  a as cancelFrame,
  Ai as cancelSync,
  kt as circIn,
  Ct as circInOut,
  Ft as circOut,
  V as clamp,
  Fs as createScopedAnimate,
  xt as cubicBezier,
  xi as delay,
  Ti as distance,
  Si as distance2D,
  _e as easeIn,
  Qe as easeInOut,
  Je as easeOut,
  o as frame,
  l as frameData,
  u as frameSteps,
  yi as inView,
  Ze as inertia,
  wn as interpolate,
  S as invariant,
  bn as keyframes,
  Tt as mirrorEasing,
  vn as mix,
  f as motionValue,
  rn as pipe,
  $ as progress,
  St as reverseEasing,
  mi as scroll,
  ci as scrollInfo,
  L as spring,
  wi as stagger,
  vi as steps,
  Vi as sync,
  bi as transform,
  T as warning,
  Z as wrap,
};
export default null;
//# sourceMappingURL=/sm/98b7c894900d57325cbcc3be4f56c9cb72674a02f2e0362a3e70a203c742d402.map



if (typeof window !== 'undefined') {
  window.motion = {
    animate: Cs,
    animateMini: Ns,
    inView: yi,
    scroll: mi,
    scrollInfo: ci,
    stagger: wi,
    spring: L,
    timeline: Cs
  };
}
