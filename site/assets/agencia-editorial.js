/* site-fabrica — agência, composição «editorial»: as fotos das casas a alternar no hero da landing (com pausa); o filtro por
   prédio do catálogo (#alegria / #bolhao abre filtrado); o voo do hero do Premium continua com o scroll; o interior do Premium como na Casa do Poço (portas de correr
   com o scroll); no bairro, a linha da lista acende o seu número no mapa. */
(() => {
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // hero da landing: cada foto fica enquanto a barra dela enche; parar/continuar; tocar numa barra salta para essa foto
  const hs = document.querySelector('[data-slides]');
  if (hs) {
    const fs = [...hs.querySelectorAll('.e-hs__f')];
    const ls = [...hs.querySelectorAll('.e-hs__leg')];
    const bs = [...hs.querySelectorAll('.e-hs__b')];
    const pausa = hs.querySelector('.e-hs__pausa');
    let i = 0;
    const vai = (n) => {
      i = (n + fs.length) % fs.length;
      [fs, ls, bs].forEach((g) => g.forEach((el, j) => el.classList.toggle('on', j === i)));
      bs.forEach((b, j) => b.classList.toggle('feito', j < i));
      const prox = fs[(i + 1) % fs.length]?.querySelector('img');
      if (prox) prox.loading = 'eager';
    };
    const para = (sim) => {
      hs.classList.toggle('para', sim);
      if (pausa) {
        pausa.setAttribute('aria-pressed', String(sim));
        pausa.setAttribute('aria-label', sim ? 'Continuar as fotografias' : 'Parar as fotografias');
      }
    };
    bs.forEach((b, j) => {
      b.addEventListener('animationend', () => { if (j === i) vai(i + 1); });
      b.addEventListener('click', () => vai(j));
    });
    pausa?.addEventListener('click', () => para(!hs.classList.contains('para')));
    if (calmo) para(true);
    document.addEventListener('visibilitychange', () => { if (document.hidden && !hs.classList.contains('para')) { para(true); hs.dataset.retoma = '1'; } else if (!document.hidden && hs.dataset.retoma) { delete hs.dataset.retoma; para(false); } });
  }

  // catálogo: filtro por prédio
  const fil = document.querySelector('.e-filtro');
  if (fil) {
    const qs = [...document.querySelectorAll('.e-cat__g .e-q')];
    fil.addEventListener('click', (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      fil.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const f = b.dataset.f;
      qs.forEach((q) => { q.hidden = q.hasAttribute('data-remate') ? !!f : !!f && q.dataset.predio !== f; });
      if (ev.isTrusted && history.replaceState) history.replaceState(null, '', f ? `#${f}` : location.pathname);
    });
    // apartamentos/#bolhao (vindo do quadrado do prédio na landing): abre já filtrado
    const deHash = () => { const b = fil.querySelector(`button[data-f="${location.hash.slice(1)}"]`); if (b && location.hash) b.click(); };
    deHash();
    addEventListener('hashchange', deHash);
  }

  // Premium: voo do hero com o scroll
  const voo = document.querySelector('.e-voo');
  if (voo && !calmo) {
    let pede = false;
    const move = () => { pede = false; const y = Math.min(scrollY, innerHeight); voo.style.transform = `translate3d(0, ${(y * .32).toFixed(1)}px, 0)`; };
    addEventListener('scroll', () => { if (!pede) { pede = true; requestAnimationFrame(move); } }, { passive: true });
    move();
  }

  // Premium: o interior como na Casa do Poço. Cada passo de scroll: um momento parado, a porta a correr, outro momento parado;
  // corre com o scroll nos dois sentidos (sem setas)
  const pt = document.querySelector('[data-portas]');
  if (pt) {
    const fs = [...pt.querySelectorAll('.e-pt__foto')];
    const ls = [...pt.querySelectorAll('.e-pt__leg')];
    const conta = pt.querySelector('[data-conta]');
    const n = fs.length;
    const lim = (v, a, b) => Math.min(Math.max(v, a), b);
    const suave = (t) => t * t * (3 - 2 * t);
    let ult = -1, ativa = -1, pede = false;
    const desenha = () => {
      pede = false;
      const r = pt.getBoundingClientRect();
      const curso = Math.max(1, r.height - innerHeight);
      const bruto = lim(-r.top / curso, 0, 1) * (n - 1);
      const k = Math.min(Math.floor(bruto), Math.max(0, n - 2));
      const t = n < 2 ? 0 : (calmo ? Math.round(bruto) : k + suave(lim((bruto - k - .16) / .68, 0, 1)));
      if (t === ult) return;
      ult = t;
      for (let j = 1; j < n; j++) {
        const q = lim(t - (j - 1), 0, 1);
        fs[j].style.transform = `translate3d(${((1 - q) * 100).toFixed(2)}%, 0, 0)`;
        fs[j].querySelector('img').style.transform = `translate3d(${(-(1 - q) * 50).toFixed(2)}%, 0, 0)`;
        fs[j].style.visibility = q > 0 ? 'visible' : 'hidden';
      }
      const a = Math.round(t);
      if (a !== ativa) {
        ativa = a;
        ls.forEach((l, j) => l.classList.toggle('on', j === a));
        if (conta) conta.textContent = String(a + 1).padStart(2, '0');
      }
      pt.style.setProperty('--prog', n > 1 ? (t / (n - 1)).toFixed(3) : 1);
    };
    addEventListener('scroll', () => { if (!pede) { pede = true; requestAnimationFrame(desenha); } }, { passive: true });
    addEventListener('resize', () => { ult = -1; desenha(); });
    desenha();
    // as fotos descarregam todas quando a secção se aproxima (nada a meio do scroll)
    const perto = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      pt.querySelectorAll('img').forEach((im) => { im.loading = 'eager'; im.decode?.().catch(() => {}); });
      perto.disconnect();
    }), { rootMargin: '1200px 0px' });
    perto.observe(pt);
  }

  // bairro: a linha da lista acende o seu número no mapa
  document.querySelectorAll('.e-bl li[data-b]').forEach((li) => {
    const pin = document.querySelector(`.e-pin[data-b="${li.dataset.b}"]`);
    if (!pin) return;
    const liga = (s) => () => pin.classList.toggle('acende', s);
    li.addEventListener('mouseenter', liga(true));
    li.addEventListener('mouseleave', liga(false));
    li.addEventListener('focusin', liga(true));
    li.addEventListener('focusout', liga(false));
  });
})();
