/* site-fabrica — site de uma agência (agencia.py), versão parada: só o que funciona ao clique.
   Barra de reservas (casa, calendário próprio, pessoas → Booking dessa casa com a pesquisa feita), fita de fotos por divisão
   (separadores, setas, contador, arrastar), álbum de todas as fotos, filtro do catálogo por zona. O topo, a barra do telemóvel
   e o visor vêm do motor-parado.js. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- reservas ---------- */
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const legivel = (t) => { const [, m, d] = t.split('-').map(Number); return `${d} ${CURTO[m - 1]}`; };
  const forms = [];
  $$('.rb').forEach((f) => {
    const casas = JSON.parse(f.dataset.casas);
    const ir = $('.rb__ir', f), out = $('output', f), cal = $('.rb__cal', f), sel = $('select', f);
    const mais = $('[data-passo="1"]', f), menos = $('[data-passo="-1"]', f);
    const campos = { in: $('[data-campo="in"]', f), out: $('[data-campo="out"]', f) };
    const hoje = new Date(); hoje.setHours(12, 0, 0, 0);
    const minimo = iso(hoje);
    let casa = casas[+f.dataset.sel || 0], n = Math.min(2, casa.max), ent = '', sai = '', fase = '';
    let ano = hoje.getFullYear(), mes = hoje.getMonth();

    const liga = () => {
      out.textContent = n;
      mais.disabled = n >= casa.max; menos.disabled = n <= 1;
      const q = new URLSearchParams({ group_adults: n, group_children: 0, no_rooms: 1, selected_currency: 'EUR' });
      if (ent && sai) { q.set('checkin', ent); q.set('checkout', sai); }
      ir.href = casa.url.includes('booking.com') ? `${casa.url}?${q}` : casa.url;
      for (const [k, v] of [['in', ent], ['out', sai]]) {
        campos[k].classList.toggle('cheio', !!v);
        campos[k].classList.toggle('agora', fase === k);
        $('b', campos[k]).textContent = v ? legivel(v) : 'Escolher';
      }
    };
    const desenha = () => {
      const primeiro = new Date(ano, mes, 1, 12), dias = new Date(ano, mes + 1, 0).getDate();
      const vazios = (primeiro.getDay() + 6) % 7;
      const ant = ano > hoje.getFullYear() || mes > hoje.getMonth();
      let h = `<div class="rb__mes"><button type="button" data-mes="-1" aria-label="Mês anterior"${ant ? '' : ' disabled'}>‹</button><span aria-live="polite">${MESES[mes]} ${ano}</span><button type="button" data-mes="1" aria-label="Mês seguinte">›</button></div><div class="rb__dias">`;
      h += ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d) => `<span>${d}</span>`).join('') + '<i></i>'.repeat(vazios);
      for (let d = 1; d <= dias; d++) {
        const t = iso(new Date(ano, mes, d, 12));
        const fora = t < minimo || (fase === 'out' && ent && t <= ent);
        const cl = t === ent || t === sai ? 'ponta' : ent && sai && t > ent && t < sai ? 'entre' : '';
        h += `<button type="button" data-dia="${t}" class="${cl}"${fora ? ' disabled' : ''} aria-label="${d} de ${MESES[mes]}">${d}</button>`;
      }
      cal.innerHTML = `${h}</div>`;
    };
    const abre = (k) => {
      forms.forEach((o) => o !== fecha && o());
      fase = k;
      const t = (k === 'out' ? sai || ent : ent);
      if (t) { const [a, m] = t.split('-').map(Number); ano = a; mes = m - 1; }
      cal.hidden = false; desenha(); liga();
    };
    const fecha = () => { if (!fase) return; fase = ''; cal.hidden = true; liga(); };
    forms.push(fecha);
    campos.in.addEventListener('click', () => { if (fase === 'in') fecha(); else abre('in'); });
    campos.out.addEventListener('click', () => { if (fase === 'out') fecha(); else abre(ent ? 'out' : 'in'); });
    cal.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.mes) {
        mes += +b.dataset.mes;
        if (mes < 0) { mes = 11; ano--; } else if (mes > 11) { mes = 0; ano++; }
        return desenha();
      }
      const t = b.dataset.dia;
      if (fase === 'in') { ent = t; if (sai && sai <= ent) sai = ''; fase = 'out'; desenha(); liga(); } else { sai = t; fecha(); }
    });
    $$('[data-passo]', f).forEach((b) => b.addEventListener('click', () => { n = Math.max(1, Math.min(casa.max, n + +b.dataset.passo)); liga(); }));
    if (sel) sel.addEventListener('change', () => { casa = casas[+sel.value]; n = Math.min(n, casa.max); liga(); });
    ir.addEventListener('click', (e) => { if (!ent || !sai) { e.preventDefault(); abre(ent ? 'out' : 'in'); } });
    f.addEventListener('submit', (e) => e.preventDefault());
    document.addEventListener('click', (e) => { if (fase && !f.contains(e.target)) fecha(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecha(); });
    liga();
  });

  /* «Reservar» do topo e da barra do telemóvel: leva à barra/cartão e abre já a chegada */
  $$('a[href="#reservar"]').forEach((a) => a.addEventListener('click', (e) => {
    const alvo = document.getElementById('reservar');
    if (!alvo) return;
    e.preventDefault();
    alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { const c = $('[data-campo="in"]', alvo); if (c && $('.rb__cal', alvo).hidden) c.click(); }, 450);
  }));

  /* ---------- fita: a ativa encostada à grelha, as vizinhas esbatidas ---------- */
  $$('[data-fita]').forEach((fita) => {
    const pista = $('.fita__pista', fita), fila = $('.fita__fila', fita), figs = $$('.fita__f', fita);
    const tabs = $$('.fita__tabs button', fita), conta = $('.fita__conta b', fita), barra = $('.fita__barra i', fita);
    const ant = $('[data-passo="-1"]', fita), seg = $('[data-passo="1"]', fita);
    const inicio = tabs.map((t) => +t.dataset.ir);
    let i = 0;
    const x = (k) => figs[k].offsetLeft - figs[0].offsetLeft;
    const vai = (k) => {
      i = Math.max(0, Math.min(figs.length - 1, k));
      fila.style.transform = `translate3d(${-x(i)}px, 0, 0)`;
      figs.forEach((f, j) => f.classList.toggle('ativa', j === i));
      conta.textContent = String(i + 1).padStart(2, '0');
      barra.style.setProperty('--p', `${((i + 1) / figs.length) * 100}%`);
      let t = 0; inicio.forEach((s, j) => { if (i >= s) t = j; });
      tabs.forEach((b, j) => b.setAttribute('aria-pressed', j === t ? 'true' : 'false'));
      ant.disabled = i === 0; seg.disabled = i === figs.length - 1;
    };
    // a primeira foto alinha com a grelha do texto
    const alinha = () => { const g = $('.largura', fita).getBoundingClientRect().left; fila.style.setProperty('--fita-x', `${g}px`); vai(i); };
    // Destaque (pedido de 15/11): a fita corre com o scroll da página; a secção fica presa o tempo que a fita leva a passar
    const rola = fita.closest('[data-rola]');
    if (rola) {
      let fimX = 0, alvo = 0, agora = 0, pedido = 0;
      const curso = () => rola.offsetHeight - innerHeight;
      const anda = () => {
        pedido = 0;
        agora += (alvo - agora) * 0.16;
        if (Math.abs(alvo - agora) < 0.3) agora = alvo;
        fila.style.transform = `translate3d(${-agora}px, 0, 0)`;
        let k = 0; figs.forEach((f, j) => { if (x(j) <= agora + f.offsetWidth * 0.5) k = j; });
        if (agora >= fimX - 2) k = figs.length - 1;
        if (k !== i) {
          i = k;
          conta.textContent = String(i + 1).padStart(2, '0');
          let t = 0; inicio.forEach((s, j) => { if (i >= s) t = j; });
          tabs.forEach((b, j) => b.setAttribute('aria-pressed', j === t ? 'true' : 'false'));
        }
        barra.style.setProperty('--p', `${fimX ? (agora / fimX) * 100 : 100}%`);
        ant.disabled = agora <= 1; seg.disabled = agora >= fimX - 1;
        if (agora !== alvo) pedido = requestAnimationFrame(anda);
      };
      const le = () => {
        const p = curso() > 0 ? Math.min(1, Math.max(0, -rola.getBoundingClientRect().top / curso())) : 0;
        alvo = p * fimX;
        if (!pedido) pedido = requestAnimationFrame(anda);
      };
      const mede = () => {
        const g = $('.largura', fita).getBoundingClientRect().left;
        fila.style.setProperty('--fita-x', `${g}px`);
        const u = fila.lastElementChild;
        fimX = Math.max(0, u.offsetLeft + u.offsetWidth - figs[0].offsetLeft - (pista.clientWidth - 2 * g));
        rola.style.height = `${innerHeight + fimX * 0.7}px`;
        le();
      };
      const irA = (k) => {
        k = Math.max(0, Math.min(figs.length - 1, k));
        const topo = rola.getBoundingClientRect().top + scrollY;
        scrollTo({ top: topo + (fimX ? Math.min(1, x(k) / fimX) : 0) * curso() + 1, behavior: 'smooth' });
      };
      tabs.forEach((b) => b.addEventListener('click', () => irA(+b.dataset.ir)));
      ant.addEventListener('click', () => irA(i - 1));
      seg.addEventListener('click', () => irA(i + 1));
      addEventListener('scroll', le, { passive: true });
      addEventListener('resize', mede);
      if (document.fonts) document.fonts.ready.then(mede);
      addEventListener('load', mede);
      figs.forEach((f) => { const im = $('img', f); if (im && !im.complete) im.addEventListener('load', mede, { once: true }); });
      mede();
      return;
    }
    tabs.forEach((b) => b.addEventListener('click', () => vai(+b.dataset.ir)));
    ant.addEventListener('click', () => vai(i - 1));
    seg.addEventListener('click', () => vai(i + 1));
    pista.setAttribute('tabindex', '0');
    pista.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') vai(i + 1); if (e.key === 'ArrowLeft') vai(i - 1); });
    // arrastar (rato e dedo); arrastar não abre o visor
    let x0 = null, y0 = 0, dx = 0, arrastou = false;
    pista.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; dx = 0; arrastou = false; });
    addEventListener('pointermove', (e) => {
      if (x0 === null) return;
      dx = e.clientX - x0;
      if (!arrastou && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - y0)) { arrastou = true; pista.classList.add('agarrada'); }
      if (arrastou) fila.style.transform = `translate3d(${-x(i) + dx}px, 0, 0)`;
    });
    const larga = () => {
      if (x0 === null) return;
      x0 = null; pista.classList.remove('agarrada');
      if (arrastou) vai(i + (dx < -50 ? 1 : dx > 50 ? -1 : 0));
    };
    addEventListener('pointerup', larga); addEventListener('pointercancel', larga);
    pista.addEventListener('click', (e) => { if (arrastou) { e.stopPropagation(); e.preventDefault(); arrastou = false; } }, true);
    addEventListener('resize', alinha);
    if (document.fonts) document.fonts.ready.then(alinha);
    addEventListener('load', alinha);
    alinha();
  });

  /* ---------- Premium: a casa em painel, como na Casa do Poço (pedido de 15/11) ----------
     Um passo de scroll por foto; a foto nova esvai-se por cima da anterior e a moldura toma o formato dela; o traço da divisão
     enche com as suas fotos; os traços levam o scroll a essa divisão. */
  $$('[data-painel]').forEach((pn) => {
    const mold = $('.wpn__moldura', pn), fotos = $$('.wpn__foto', pn), divs = $$('.wpn__div', pn);
    const tabs = $$('.wpn__linha button', pn), tracos = tabs.map((b) => $('.wpn__traco span', b));
    const N = fotos.length, ini = [];
    fotos.forEach((f, k) => { const d = +f.dataset.d; if (ini[d] === undefined) ini[d] = k; });
    ini.push(N);
    let atual = 0, div = 0;
    const pronta = (f) => { const im = $('img', f); return im.complete ? Promise.resolve() : im.decode().catch(() => {}); };
    const mostra = (k) => {
      if (k === atual) return;
      const nova = fotos[k];
      atual = k;
      mold.dataset.visor = nova.dataset.serie; mold.dataset.indice = nova.dataset.i;
      const d = +nova.dataset.d;
      if (d !== div) {
        div = d;
        divs.forEach((t, j) => t.classList.toggle('ativo', j === d));
        tabs.forEach((b, j) => b.setAttribute('aria-pressed', j === d ? 'true' : 'false'));
      }
      const leg = $('.wpn__leg', divs[d]);
      if (leg.textContent !== nova.dataset.leg) { leg.classList.add('troca'); setTimeout(() => { leg.textContent = nova.dataset.leg; leg.classList.remove('troca'); }, 220); }
      pronta(nova).then(() => {
        if (atual !== k) return;
        mold.style.setProperty('--ar', nova.dataset.ar); mold.style.setProperty('--wmax', nova.dataset.w);
        fotos.forEach((f) => { if (f !== nova && f.classList.contains('ativo')) { f.classList.remove('ativo'); f.classList.add('sai'); clearTimeout(f._t); f._t = setTimeout(() => f.classList.remove('sai'), 1300); } });
        clearTimeout(nova._t); nova.classList.remove('sai'); nova.classList.add('ativo');
      });
    };
    const curso = () => pn.offsetHeight - innerHeight;
    let pedido = 0;
    const pinta = () => {
      pedido = 0;
      const r = pn.getBoundingClientRect();
      if (r.top > innerHeight || r.bottom < 0) return;
      const P = Math.min(0.9999, Math.max(0, -r.top / curso())) * N;
      mostra(Math.floor(P));
      tracos.forEach((t, j) => t.style.setProperty('--b', Math.min(1, Math.max(0, (P - ini[j]) / (ini[j + 1] - ini[j]))).toFixed(3)));
    };
    addEventListener('scroll', () => { if (!pedido) pedido = requestAnimationFrame(pinta); }, { passive: true });
    addEventListener('resize', pinta);
    tabs.forEach((b, j) => b.addEventListener('click', () => scrollTo({ top: pn.getBoundingClientRect().top + scrollY + (ini[j] + 0.5) / N * curso(), behavior: 'smooth' })));
    mold.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mold.click(); } });
    pinta();
  });

  /* ---------- heros com movimento: a foto desce mais devagar do que a página ---------- */
  const heroF = $('.w-hero--premium .hero__foto, .w-hero--landing .hero__foto, .w-hero--destaque .hero__foto');
  if (heroF && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let pedidoH = 0;
    const desce = () => { pedidoH = 0; if (scrollY < innerHeight * 1.2) heroF.style.setProperty('--desce', `${(scrollY * 0.28).toFixed(1)}px`); };
    addEventListener('scroll', () => { if (!pedidoH) pedidoH = requestAnimationFrame(desce); }, { passive: true });
  }

  /* ---------- álbum: todas as fotos por divisão ---------- */
  $$('[data-album]').forEach((b) => b.addEventListener('click', () => {
    const alb = document.getElementById(`alb-${b.dataset.album}`);
    if (!alb) return;
    alb.hidden = false; document.body.classList.add('com-album');
    $('.alb__corpo', alb).scrollTop = 0; $('.alb__x', alb).focus();
  }));
  $$('.alb').forEach((alb) => {
    const fecha = () => { alb.hidden = true; document.body.classList.remove('com-album'); };
    $('.alb__x', alb).addEventListener('click', fecha);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !alb.hidden && $('#visor').hidden) fecha(); });
    $$('.alb__ind a', alb).forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      const d = alb.querySelector(a.getAttribute('href'));
      $('.alb__corpo', alb).scrollTo({ top: d.offsetTop - 8, behavior: 'smooth' });
    }));
  });

  /* ---------- catálogo: filtrar por zona (chips, zonas da secção «Onde ficar» e pinos do mapa) ---------- */
  const chips = $$('[data-zf]');
  const filtra = (z) => {
    chips.forEach((c) => c.setAttribute('aria-pressed', c.dataset.zf === z ? 'true' : 'false'));
    $$('#casas .wc').forEach((c) => { c.hidden = z !== 'todas' && c.dataset.zona !== z; });
    const resto = $('.wcat__resto');
    if (resto) resto.hidden = !$$('.wc', resto).some((c) => !c.hidden);
  };
  chips.forEach((c) => c.addEventListener('click', () => filtra(c.dataset.zf)));
  $$('[data-filtra]').forEach((a) => a.addEventListener('click', () => filtra(a.dataset.filtra)));
})();
