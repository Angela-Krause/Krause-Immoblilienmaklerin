/* ============================================================
   KRAUSE IMMOBILIEN – main.js (BEIGE VERSION)
   Einziger Unterschied zur Copper-Version: PARTICLE_COLOR
============================================================ */

const PARTICLE_COLOR = 0x1d4ed8; // Cremeweiß/Blau

/* ──────────────────────────────────────────────────────────
   DEFAULT PROPERTY DATA
────────────────────────────────────────────────────────── */
const defaultProperties = [
  {
    id: 1,
    isExample: true,
    title: "Gepflegtes Einfamilienhaus",
    address: "Bamberg, Gereuth",
    price: "485.000",
    size: "148",
    rooms: 5,
    year: 1982,
    bathrooms: 2,
    plot: "620",
    status: "Verfügbar",
    badge: "Neu",
    description: "Charmantes Einfamilienhaus in ruhiger Wohnlage mit großzügigem Garten, Garage und herrlichem Blick auf das Bamberger Umland.",
    description_long: "Dieses gepflegte Einfamilienhaus überzeugt durch seine ruhige, grüne Lage im Bamberger Stadtteil Gereuth. Das 1982 erbaute und gut erhaltene Haus bietet auf 148 m² Wohnfläche viel Platz für die ganze Familie. Das großzügige Grundstück von 620 m² lädt zum Erholen und Spielen ein. Eine angebaute Garage, ein ausgebauter Keller sowie eine sonnige Terrasse runden das Angebot ab. Die ruhige Wohnstraße, die gute Infrastruktur und die herrliche Aussicht auf das Bamberger Umland machen diese Immobilie zu einem echten Juwel.",
    features: ["Angebaute Garage", "Großer Garten (620 m²)", "Ausgebauter Keller", "Sonnige Terrasse", "Ruhige Wohnlage", "Herrlicher Ausblick", "2 Vollbäder"],
    energyClass: "E",
    energyValue: "178",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80",
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=900&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=900&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=900&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80"
    ]
  },
  {
    id: 2,
    isExample: true,
    title: "Moderne Eigentumswohnung",
    address: "Forchheim, Zentrum",
    price: "265.000",
    size: "82",
    rooms: 3,
    year: 2008,
    bathrooms: 1,
    plot: "",
    status: "Verfügbar",
    badge: "",
    description: "Helle und moderne Eigentumswohnung in zentraler Lage. Balkon mit Südausrichtung und Tiefgaragenstellplatz inklusive.",
    description_long: "Diese lichtdurchflutete Eigentumswohnung im Herzen von Forchheim bietet modernen Wohnkomfort auf 82 m². Das 2008 errichtete Gebäude ist in gepflegtem Zustand und verfügt über eine hochwertige Ausstattung. Der großzügige Balkon mit Südausrichtung lädt zum Entspannen ein. Ein Tiefgaragenstellplatz ist im Kaufpreis inbegriffen. Die zentrale Lage bietet alle Annehmlichkeiten des täglichen Lebens in fußläufiger Entfernung – Einkaufsmöglichkeiten, Schulen und öffentliche Verkehrsmittel sind direkt vor der Tür.",
    features: ["Balkon Südausrichtung", "Tiefgaragenstellplatz", "Aufzug", "Fußbodenheizung", "Einbauküche", "Zentrale Lage", "Baujahr 2008"],
    energyClass: "B",
    energyValue: "52",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80",
      "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=900&q=80",
      "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=900&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=80"
    ]
  },
  {
    id: 3,
    isExample: true,
    title: "Doppelhaushälfte mit Garten",
    address: "Herzogenaurach",
    price: "375.000",
    size: "125",
    rooms: 4,
    year: 1995,
    bathrooms: 2,
    plot: "380",
    status: "Reserviert",
    badge: "",
    description: "Gut geschnittene Doppelhaushälfte in familienfreundlicher Wohnlage mit großem Garten und Garage.",
    description_long: "Diese gepflegte Doppelhaushälfte in Herzogenaurach bietet Familien auf 125 m² Wohnfläche viel Raum zum Leben. Das 1995 erbaute Haus überzeugt durch seinen gut geschnittenen Grundriss, einen großzügigen Garten von 380 m² sowie eine Garage. Die familienfreundliche Wohnlage mit nahegelegenen Schulen, Kindergärten und Einkaufsmöglichkeiten macht diese Immobilie besonders attraktiv für junge Familien. Terrasse, Keller und ein gepflegter Außenbereich runden das Angebot ab.",
    features: ["Garage", "Großer Garten (380 m²)", "Keller", "Terrasse", "Familienfreundliche Lage", "2 Vollbäder", "Nahe Schulen & KiTa"],
    energyClass: "D",
    energyValue: "128",
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&q=80",
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=900&q=80",
      "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=900&q=80",
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=900&q=80"
    ]
  }
];

/* ──────────────────────────────────────────────────────────
   STORAGE HELPERS
────────────────────────────────────────────────────────── */
let _propsCache = null;

async function loadPropertiesAsync() {
  if (_propsCache !== null) return _propsCache;
  try {
    const resp = await fetch('/data/properties.json');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    const items = Array.isArray(data) ? data : (data.items || []);
    _propsCache = items.length > 0 ? items : defaultProperties;
  } catch (e) {
    _propsCache = defaultProperties;
  }
  return _propsCache;
}

function loadProperties() {
  return _propsCache || defaultProperties;
}
function saveProperties(props) {
  _propsCache = props;
}
function getNextId(props) {
  return props.length ? Math.max(...props.map(p => p.id || 0)) + 1 : 1;
}

/* ──────────────────────────────────────────────────────────
   PRELOADER
────────────────────────────────────────────────────────── */
function runPreloader(onDone) {
  const fill = document.getElementById('plFill');
  const pct  = document.getElementById('plPct');
  const pl   = document.getElementById('preloader');

  // Kein Preloader auf dieser Seite (Unterseiten) → sofort weitermachen
  if (!fill || !pl) { onDone(); return; }

  let progress = 0;

  const tick = setInterval(() => {
    const step = Math.random() * 12 + 4;
    progress = Math.min(progress + step, 100);
    fill.style.width = progress + '%';
    if (pct) pct.textContent = Math.floor(progress) + '%';

    if (progress >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        gsap.to(pl, {
          yPercent: -100, duration: 1, ease: 'power4.inOut',
          onComplete: () => { pl.style.display = 'none'; onDone(); }
        });
      }, 300);
    }
  }, 60);
}

/* ──────────────────────────────────────────────────────────
   LENIS SMOOTH SCROLL
────────────────────────────────────────────────────────── */
let lenis;
function initLenis() {
  lenis = new Lenis({
    duration: 1.3,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothTouch: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ──────────────────────────────────────────────────────────
   THREE.JS PARTICLES
────────────────────────────────────────────────────────── */
function initParticles() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  camera.position.z = 3.5;

  const count = 1800;
  const pos   = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 12;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.025, color: PARTICLE_COLOR,
    transparent: true, opacity: 0.65,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / innerWidth  - 0.5) * 2;
    my = (e.clientY / innerHeight - 0.5) * 2;
  });

  (function animate() {
    requestAnimationFrame(animate);
    points.rotation.y += 0.0007;
    points.rotation.x += 0.0003;
    camera.position.x += (mx * 0.4 - camera.position.x) * 0.04;
    camera.position.y += (-my * 0.4 - camera.position.y) * 0.04;
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

/* ──────────────────────────────────────────────────────────
   CUSTOM CURSOR
────────────────────────────────────────────────────────── */
function initCursor() {
  const ring = document.getElementById('cursorRing');
  const dot  = document.getElementById('cursorDot');
  if (!ring || !dot) return;

  document.addEventListener('mousemove', e => {
    dot.style.left  = e.clientX + 'px';
    dot.style.top   = e.clientY + 'px';
    gsap.to(ring, { left: e.clientX, top: e.clientY, duration: 0.18, ease: 'power2.out' });
  });

  document.querySelectorAll('a, button, .mag-btn, .pf, .prop-cta').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });
}

/* ──────────────────────────────────────────────────────────
   NAVIGATION
────────────────────────────────────────────────────────── */
function initNav() {
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const mobile = document.getElementById('mobileNav');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 60);
  }, { passive: true });

  burger.addEventListener('click', () => mobile.classList.toggle('open'));
  mobile.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobile.classList.remove('open'));
  });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target && lenis) { e.preventDefault(); lenis.scrollTo(target, { offset: -80 }); }
    });
  });
}

/* ──────────────────────────────────────────────────────────
   TEXT SPLITTING
────────────────────────────────────────────────────────── */
function splitChars(el) {
  const text = el.innerHTML
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '');
  el.innerHTML = '';
  // Woerter als Einheit umbrechen - kein Zeilenbruch mitten im Wort
  text.split(' ').forEach((word, i, arr) => {
    if (word.length > 0) {
      const wordWrap = document.createElement('span');
      wordWrap.style.cssText = 'display:inline; white-space:nowrap;';
      [...word].forEach(ch => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        wordWrap.appendChild(span);
      });
      el.appendChild(wordWrap);
    }
    if (i < arr.length - 1) {
      el.appendChild(document.createTextNode(' '));
    }
  });
  return el.querySelectorAll('.char');
}

/* ──────────────────────────────────────────────────────────
   HERO ANIMATIONS
────────────────────────────────────────────────────────── */
function initHeroAnim() {
  const tl = gsap.timeline({ delay: 0.2 });

  // 1. "Ihr Partner für Erfahrung" zuerst
  tl.to('.hero-rota', {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out'
  });

  // 2. "Immobilien" – erste Zeile
  const lines = document.querySelectorAll('.hl');
  if (lines[0]) {
    const chars0 = splitChars(lines[0]);
    tl.to(chars0, {
      opacity: 1, y: 0, duration: 0.65, stagger: 0.016, ease: 'power4.out'
    }, '-=0.2');
  }

  // 3. "erfolgreich" – zweite Zeile
  if (lines[1]) {
    const chars1 = splitChars(lines[1]);
    tl.to(chars1, {
      opacity: 1, y: 0, duration: 0.65, stagger: 0.016, ease: 'power4.out'
    }, '-=0.1');
  }

  // 4. "verkaufen." – dritte Zeile
  if (lines[2]) {
    const chars2 = splitChars(lines[2]);
    tl.to(chars2, {
      opacity: 1, y: 0, duration: 0.65, stagger: 0.016, ease: 'power4.out'
    }, '-=0.1');
  }

  // 5. Subtext
  tl.to('.hero-sub', {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out'
  }, '-=0.1');

  // 6. CTA-Buttons
  tl.to('.hero-ctas', {
    opacity: 1, y: 0, duration: 0.6, ease: 'power3.out'
  }, '-=0.3');

  // 7. Float-Widget, Badge, Scroll-Hint
  tl.to('.hero-float, .hero-badge, .hero-scroll', {
    opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out'
  }, '-=0.2');
}

/* ──────────────────────────────────────────────────────────
   SCROLL ANIMATIONS
────────────────────────────────────────────────────────── */
function initScrollAnims() {
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.rf').forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el, start: 'top 88%',
      onEnter: () => {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.85, delay: (i % 4) * 0.08, ease: 'power3.out' });
        el.classList.add('in');
      },
      once: true
    });
  });

  document.querySelectorAll('.ss').forEach(el => {
    const chars = splitChars(el);
    ScrollTrigger.create({
      trigger: el, start: 'top 85%',
      onEnter: () => {
        gsap.to(chars, { opacity: 1, y: 0, duration: 0.7, stagger: 0.015, ease: 'power4.out' });
      },
      once: true
    });
  });

  document.querySelectorAll('.stat').forEach(stat => {
    const numEl  = stat.querySelector('.sn');
    const target = parseInt(stat.dataset.count);
    const suffix = stat.dataset.suffix || '';
    ScrollTrigger.create({
      trigger: stat, start: 'top 85%',
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target, duration: 2, ease: 'power2.out',
          onUpdate() { numEl.textContent = Math.floor(this.targets()[0].val) + suffix; }
        });
      },
      once: true
    });
  });

  const procFill = document.getElementById('procFill');
  if (procFill) {
    ScrollTrigger.create({
      trigger: '#process', start: 'top 70%', end: 'bottom 30%', scrub: true,
      onUpdate: self => {
        procFill.style.height = (self.progress * 100) + '%';
        document.querySelectorAll('.proc-step').forEach((step, i) => {
          step.classList.toggle('active', self.progress > i / 5);
        });
      }
    });
  }

  gsap.to('#aboutBg',  { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '#about',   scrub: true } });
  gsap.to('#procBg',   { yPercent: 20, ease: 'none', scrollTrigger: { trigger: '#process', scrub: true } });

  document.querySelectorAll('.svc-card').forEach((card, i) => {
    gsap.from(card, {
      opacity: 0, y: 50, duration: 0.8, delay: i * 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 85%', once: true }
    });
  });
}

/* ──────────────────────────────────────────────────────────
   MAGNETIC BUTTONS
────────────────────────────────────────────────────────── */
function initMagnet() {
  if (window.matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.mag-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width  / 2;
      const y = e.clientY - r.top  - r.height / 2;
      gsap.to(btn, { x: x * 0.28, y: y * 0.28, duration: 0.4, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.4)' });
    });
  });
}

/* ──────────────────────────────────────────────────────────
   PROPERTIES RENDERING
────────────────────────────────────────────────────────── */
let currentFilter = 'all';

async function renderProperties(filter) {
  currentFilter = filter;
  const allProps = await loadPropertiesAsync();
  // hide secret_sale objects from the public listing
  const props  = allProps.filter(p => !p.secret_sale);
  const grid   = document.getElementById('propGrid');
  const empty  = document.getElementById('propEmpty');
  if (!grid) return;

  const filtered = filter === 'all' ? props : props.filter(p => p.status === filter);
  grid.innerHTML = '';

  if (filtered.length === 0) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  // Show/hide demo notice based on whether all properties are examples
  const demoNotice = document.getElementById('propDemoNotice');
  if (demoNotice) {
    const allExample = props.length > 0 && props.every(p => p.isExample);
    demoNotice.classList.toggle('hidden', !allExample);
  }

  filtered.forEach((p, i) => {
    const statusClass = p.status === 'Verfügbar' ? 'status-v' : p.status === 'Reserviert' ? 'status-r' : 'status-k';
    const soldOverlay = p.status === 'Verkauft'
      ? `<div class="prop-sold-overlay"><div class="prop-sold-stamp">VERKAUFT</div></div>` : '';
    const badge = p.badge ? `<div class="prop-status ${statusClass}">${p.badge}</div>` : `<div class="prop-status ${statusClass}">${p.status}</div>`;
    const img = p.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';
    const wmHtml = p.isExample ? `<div class="prop-wm">Beispielimmobilie</div>` : '';

    const card = document.createElement('div');
    card.className = p.isExample ? 'prop-card is-example' : 'prop-card';
    card.style.animationDelay = (i * 0.08) + 's';
    card.innerHTML = `
      <div class="prop-img-wrap">
        <img src="${img}" alt="${p.title}" loading="lazy">
        ${badge}
        ${soldOverlay}
        ${wmHtml}
        <div class="prop-id">Obj.-Nr. ${p.objnr || String(p.id).padStart(3, '0')}</div>
      </div>
      <div class="prop-body">
        <div class="prop-price">€ ${p.price}</div>
        <div class="prop-title">${p.title}</div>
        <div class="prop-addr"><i class="fas fa-map-marker-alt"></i>${p.address}</div>
        <div class="prop-stats">
          ${p.size  ? `<div class="ps-item"><i class="fas fa-ruler-combined"></i>${p.size} m²</div>` : ''}
          ${p.rooms ? `<div class="ps-item"><i class="fas fa-door-open"></i>${p.rooms} Zimmer</div>` : ''}
          ${p.year      ? `<div class="ps-item"><i class="fas fa-calendar"></i>Bj. ${p.year}</div>` : ''}
          ${p.bathrooms ? `<div class="ps-item"><i class="fas fa-bath"></i>${p.bathrooms} Bad</div>` : ''}
          ${p.plot      ? `<div class="ps-item"><i class="fas fa-expand-arrows-alt"></i>${p.plot} m² Grund.</div>` : ''}
        </div>
        ${p.description ? `<div class="prop-desc">${p.description}</div>` : ''}
        <div class="prop-cta-row">
          <a href="expose.html?id=${p.objnr || p.id}" class="prop-expose mag-btn"><span>Zum Exposé</span><i class="fas fa-file-alt"></i></a>
          <a href="#contact" class="prop-cta mag-btn"><span>Anfragen</span><i class="fas fa-arrow-right"></i></a>
        </div>
      </div>`;
    grid.appendChild(card);
  });

  initMagnet();
}

function initPropertyFilters() {
  document.querySelectorAll('.pf').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pf').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProperties(btn.dataset.filter);
    });
  });
}

/* ──────────────────────────────────────────────────────────
   ADMIN PANEL
────────────────────────────────────────────────────────── */
function initAdmin() {
  const overlay   = document.getElementById('admOverlay');
  const closeBtn  = document.getElementById('admClose');
  const saveBtn   = document.getElementById('admSave');
  const cancelBtn = document.getElementById('admCancel');
  if (!overlay) return;

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); toggleAdmin(); }
    if (e.key === 'Escape') closeAdmin();
  });

  closeBtn.addEventListener('click', closeAdmin);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeAdmin(); });
  saveBtn.addEventListener('click', saveProperty);
  cancelBtn.addEventListener('click', resetAdminForm);

  function toggleAdmin() {
    overlay.classList.toggle('open');
    if (overlay.classList.contains('open')) renderAdminList();
  }
  function closeAdmin() { overlay.classList.remove('open'); resetAdminForm(); }

  function renderAdminList() {
    const list  = document.getElementById('admList');
    const count = document.getElementById('propCount');
    const props = loadProperties();
    count.textContent = `(${props.length})`;
    list.innerHTML = props.map(p => `
      <div class="adm-prop-item">
        <div class="adm-pi-info">
          <div class="adm-pi-title">${p.title}</div>
          <div class="adm-pi-meta">${p.address} · ${p.status} · € ${p.price}</div>
        </div>
        <div class="adm-pi-actions">
          <button onclick="editProperty(${p.id})" title="Bearbeiten"><i class="fas fa-edit"></i></button>
          <button class="del" onclick="deleteProperty(${p.id})" title="Löschen"><i class="fas fa-trash"></i></button>
        </div>
      </div>`).join('');
  }

  function saveProperty() {
    const id    = document.getElementById('editId').value;
    const props = loadProperties();
    const entry = {
      title:       document.getElementById('pTitle').value.trim(),
      address:     document.getElementById('pAddr').value.trim(),
      price:       document.getElementById('pPrice').value.trim(),
      size:        document.getElementById('pSize').value.trim(),
      rooms:       parseInt(document.getElementById('pRooms').value) || 0,
      year:        parseInt(document.getElementById('pYear').value) || 0,
      status:      document.getElementById('pStatus').value,
      image:       document.getElementById('pImg').value.trim(),
      description: document.getElementById('pDesc').value.trim(),
      badge:       '',
    };
    if (!entry.title || !entry.price) { alert('Bitte mindestens Titel und Preis ausfüllen.'); return; }

    if (id) {
      const idx = props.findIndex(p => p.id === parseInt(id));
      if (idx !== -1) { props[idx] = { ...props[idx], ...entry }; }
    } else {
      entry.id = getNextId(props);
      props.push(entry);
    }
    saveProperties(props);
    renderAdminList();
    renderProperties(currentFilter);
    resetAdminForm();
  }

  window.editProperty = function(id) {
    const props = loadProperties();
    const p = props.find(x => x.id === id);
    if (!p) return;
    document.getElementById('editId').value  = p.id;
    document.getElementById('pTitle').value  = p.title || '';
    document.getElementById('pAddr').value   = p.address || '';
    document.getElementById('pPrice').value  = p.price || '';
    document.getElementById('pSize').value   = p.size || '';
    document.getElementById('pRooms').value  = p.rooms || '';
    document.getElementById('pYear').value   = p.year || '';
    document.getElementById('pStatus').value = p.status || 'Verfügbar';
    document.getElementById('pImg').value    = p.image || '';
    document.getElementById('pDesc').value   = p.description || '';
    document.getElementById('admFormTitle').textContent = 'Objekt bearbeiten';
    cancelBtn.style.display = 'inline';
    document.getElementById('admFormTitle').scrollIntoView({ behavior: 'smooth' });
  };

  window.deleteProperty = function(id) {
    if (!confirm('Dieses Objekt wirklich löschen?')) return;
    let props = loadProperties();
    props = props.filter(p => p.id !== id);
    saveProperties(props);
    renderAdminList();
    renderProperties(currentFilter);
  };

  function resetAdminForm() {
    document.getElementById('editId').value   = '';
    document.getElementById('pTitle').value   = '';
    document.getElementById('pAddr').value    = '';
    document.getElementById('pPrice').value   = '';
    document.getElementById('pSize').value    = '';
    document.getElementById('pRooms').value   = '';
    document.getElementById('pYear').value    = '';
    document.getElementById('pStatus').value  = 'Verfügbar';
    document.getElementById('pImg').value     = '';
    document.getElementById('pDesc').value    = '';
    document.getElementById('admFormTitle').textContent = 'Neues Objekt hinzufügen';
    cancelBtn.style.display = 'none';
  }
}

/* ──────────────────────────────────────────────────────────
   CONTACT FORM
────────────────────────────────────────────────────────── */
function initContactForm() {
  const form      = document.getElementById('contactForm');
  const success   = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('contactSubmitBtn');
  const errorMsg  = document.getElementById('contactError');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (errorMsg) errorMsg.style.display = 'none';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.querySelector('span').textContent = 'Wird gesendet…';
    }

    // Hidden iframe – vermeidet fetch-Redirect-Probleme mit nForms
    const iframe = document.createElement('iframe');
    iframe.name = 'nforms_cf_' + Date.now();
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    form.target = iframe.name;

    iframe.addEventListener('load', () => {
      document.body.removeChild(iframe);
      window.location.href = 'danke.html';
    });

    form.submit();
  });
}

/* ──────────────────────────────────────────────────────────
   WORD ROTATOR  (raum96-inspired)
────────────────────────────────────────────────────────── */
function initRotator() {
  const el = document.getElementById('rotaWord');
  if (!el) return;
  const words = ['Erfahrung', 'Kompetenz', 'Ihren Erfolg', 'Sicherheit', 'besten Preis'];
  let idx = 0;

  setInterval(() => {
    gsap.to(el, {
      opacity: 0, y: -10, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        idx = (idx + 1) % words.length;
        el.textContent = words[idx];
        gsap.fromTo(el,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
        );
      }
    });
  }, 2800);
}

/* ──────────────────────────────────────────────────────────
   SUCHPROFIL  (raum96-inspired)
────────────────────────────────────────────────────────── */
function initSuchprofil() {
  const toggle  = document.getElementById('spToggle');
  const form    = document.getElementById('spForm');
  const submit  = document.getElementById('spSubmit');
  const success = document.getElementById('spSuccess');
  if (!toggle || !form) return;

  toggle.addEventListener('click', () => {
    const isOpen = form.classList.toggle('open');
    const label  = toggle.querySelector('span');
    if (label) label.textContent = isOpen ? 'Suchprofil schließen' : 'Suchprofil anlegen';
    if (isOpen) setTimeout(() => form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    initMagnet();
  });

  if (submit) {
    submit.addEventListener('click', () => {
      const email = document.getElementById('spEmail');
      if (!email || !email.value.trim()) { if (email) email.focus(); return; }

      /* ── nForms Submission ── */
      const fd = new FormData();
      fd.append('name',         document.getElementById('spName')?.value   || '');
      fd.append('email',        email.value);
      fd.append('telefon',      document.getElementById('spPhone')?.value  || '');
      fd.append('objektart',    document.getElementById('spType')?.value   || '');
      fd.append('region',       document.getElementById('spRegion')?.value || '');
      fd.append('max_kaufpreis',document.getElementById('spPrice')?.value  || '');
      fd.append('min_zimmer',   document.getElementById('spRooms')?.value  || '');
      fd.append('min_flaeche',  document.getElementById('spSize')?.value   || '');
      fd.append('wuensche',     document.getElementById('spNotes')?.value  || '');
      fd.append('quelle',       'index.html');

      fetch('https://api.nforms.eu/f/nf_z810ws5qsp2qiv28vutc8tpxk4gr9n5r', {
        method: 'POST', mode: 'no-cors', body: fd
      });

      if (success) {
        success.classList.add('show');
        gsap.from(success, { opacity: 0, y: 10, duration: 0.5, ease: 'power3.out' });
      }
      submit.style.display = 'none';
      setTimeout(() => { window.location.href = 'danke-suchprofil.html'; }, 800);
    });
  }
}

/* ──────────────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();

  runPreloader(() => {
    initLenis();
    initNav();
    initCursor();
    initHeroAnim();
    initScrollAnims();
    initMagnet();
    initPropertyFilters();
    loadPropertiesAsync().then(() => renderProperties('all'));
    initAdmin();
    initContactForm();
    initRotator();
    initSuchprofil();
  });
});
