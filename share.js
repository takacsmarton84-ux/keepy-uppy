/* ---------------------------------------------------------------
   Share card: builds a branded result image and opens the phone's
   own share sheet (WhatsApp, Messenger, Instagram, etc.).
   Needs the BRAND object from index.html.
   --------------------------------------------------------------- */
(function () {
  const NAME_KEY = 'dekazas-name';
  const CARD_W = 1080, CARD_H = 1920; // story format, also fine in chats

  const C = BRAND.colors;
  const gameUrl = location.origin + location.pathname.replace(/index\.html$/, '');

  /* ---------- UI: name field + share button on the game over card ---------- */
  const style = document.createElement('style');
  style.textContent = `
    .share-row { display: flex; flex-direction: column; gap: 10px; margin: 0 0 12px; }
    .share-row input {
      width: 100%;
      font: 600 16px var(--font);
      padding: 13px 14px;
      border-radius: 12px;
      border: 1.5px solid color-mix(in srgb, var(--card-muted) 40%, transparent);
      background: transparent;
      color: var(--card-ink);
      outline: none;
      -webkit-user-select: text;
      user-select: text;
    }
    .share-row input:focus { border-color: var(--accent); }
    .share-row input.shake { animation: shake 0.35s; border-color: #e5484d; }
    @keyframes shake { 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
    .card button.share-btn {
      background: transparent;
      color: var(--card-ink);
      border: 1.5px solid var(--accent);
    }
  `;
  document.head.appendChild(style);

  const overCard = document.querySelector('#over .card');
  const againBtn = document.getElementById('againBtn');
  const row = document.createElement('div');
  row.className = 'share-row';
  row.innerHTML =
    '<input id="playerName" type="text" maxlength="24" autocomplete="nickname" autocapitalize="words" placeholder="Your name" aria-label="Your name">' +
    '<button class="share-btn" id="shareBtn" type="button">Share result</button>';
  overCard.insertBefore(row, againBtn);

  const nameInput = document.getElementById('playerName');
  const shareBtn = document.getElementById('shareBtn');
  try { nameInput.value = localStorage.getItem(NAME_KEY) || ''; } catch (e) {}

  /* ---------- images used on the card ---------- */
  function loadImage(src) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });
  }
  const imagesReady = Promise.all([loadImage(BRAND.stadiumImage), loadImage('icons/icon-512.png')]);

  /* ---------- drawing ---------- */
  function shield(ctx, x, y, w, color) {
    const h = w * 1.11, s = w / 36;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(18, 2); ctx.lineTo(33, 7); ctx.lineTo(33, 19);
    ctx.bezierCurveTo(33, 29, 26, 35, 18, 38);
    ctx.bezierCurveTo(10, 35, 3, 29, 3, 19);
    ctx.lineTo(3, 7); ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '800 9.5px Montserrat, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(BRAND.initials, 18, 23);
    ctx.restore();
    return h;
  }

  function fitText(ctx, text, weight, maxSize, maxWidth) {
    let size = maxSize;
    ctx.font = weight + ' ' + size + 'px Montserrat, Arial, sans-serif';
    const w = ctx.measureText(text).width;
    if (w > maxWidth) {
      size = Math.floor(size * maxWidth / w);
      ctx.font = weight + ' ' + size + 'px Montserrat, Arial, sans-serif';
    }
    return size;
  }

  function drawCard(ctx, name, score, stadium, ballImg) {
    const W = CARD_W, H = CARD_H;
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // stadium photo, faded into the background
    const photoH = H * 0.55;
    if (stadium) {
      const s = Math.max(W / stadium.width, photoH / stadium.height);
      const iw = stadium.width * s, ih = stadium.height * s;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(stadium, (W - iw) / 2, 0, iw, ih);
      ctx.globalAlpha = 1;
    }
    const fade = ctx.createLinearGradient(0, 0, 0, photoH);
    fade.addColorStop(0, 'rgba(12,30,44,0.5)');
    fade.addColorStop(0.6, 'rgba(12,30,44,0.45)');
    fade.addColorStop(1, C.bg);
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, W, photoH + 2);

    // header: crest + club name
    const crestW = 84;
    ctx.font = '700 44px Montserrat, Arial, sans-serif';
    const clubW = ctx.measureText(BRAND.clubName).width;
    const headW = crestW + 24 + clubW;
    const hx = (W - headW) / 2, hy = 140;
    shield(ctx, hx, hy, crestW, C.accent);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(BRAND.clubName, hx + crestW + 24, hy + crestW * 0.55);

    // ball (the app icon has the same navy background, so it blends in)
    if (ballImg) {
      const b = 560, bx = (W - b) / 2, by = 330;
      const r = b * 0.31, cx = W / 2, cy = by + b / 2;
      // soft shadow under the ball
      const sh = ctx.createRadialGradient(cx, cy + r * 1.2, 0, cx, cy + r * 1.2, r);
      sh.addColorStop(0, 'rgba(0,0,0,0.45)');
      sh.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.translate(0, cy + r * 1.2);
      ctx.scale(1, 0.18);
      ctx.translate(0, -(cy + r * 1.2));
      ctx.fillStyle = sh;
      ctx.fillRect(cx - r, cy + r * 1.2 - r, r * 2, r * 2);
      ctx.restore();
      // only the ball itself, not the icon's square background
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(ballImg, bx, by, b, b);
      ctx.restore();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // player name
    ctx.fillStyle = C.accent;
    fitText(ctx, name, '700', 76, W - 160);
    ctx.fillText(name, W / 2, 1010);

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '600 46px Montserrat, Arial, sans-serif';
    ctx.fillText('kept the ball up', W / 2, 1082);

    // score
    ctx.fillStyle = '#ffffff';
    fitText(ctx, String(score), '800', 400, W - 120);
    ctx.fillText(String(score), W / 2, 1440);

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '600 50px Montserrat, Arial, sans-serif';
    ctx.fillText(score === 1 ? 'time' : 'times', W / 2, 1520);

    // call to action pill
    const cta = 'Can you beat it?';
    ctx.font = '800 54px Montserrat, Arial, sans-serif';
    const cw = ctx.measureText(cta).width + 100, ch = 110;
    const cx = (W - cw) / 2, cy = 1610;
    ctx.fillStyle = C.accent;
    roundRect(ctx, cx, cy, cw, ch, 28);
    ctx.fill();
    ctx.fillStyle = C.bg;
    ctx.textBaseline = 'middle';
    ctx.fillText(cta, W / 2, cy + ch / 2 + 2);

    // link
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textBaseline = 'alphabetic';
    fitText(ctx, gameUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''), '600', 34, W - 160);
    ctx.fillText(gameUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''), W / 2, 1830);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  async function makeCardFile(name, score) {
    try { await document.fonts.load('800 100px Montserrat'); await document.fonts.load('700 100px Montserrat'); } catch (e) {}
    const [stadium, ballImg] = await imagesReady;
    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    drawCard(canvas.getContext('2d'), name, score, stadium, ballImg);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    return new File([blob], 'keepy-uppy-' + score + '.png', { type: 'image/png' });
  }

  /* ---------- pre-build the image so the share sheet opens instantly ---------- */
  // iOS only opens the share sheet if it's called right after the tap,
  // so the image is prepared as soon as the game over card shows up.
  let cached = null; // { key, file }
  let building = null;
  function currentScore() { return parseInt(document.getElementById('finalScore').textContent, 10) || 0; }
  function currentName() { return nameInput.value.trim(); }

  function prepare() {
    const name = currentName();
    if (!name) return null;
    const key = name + '|' + currentScore();
    if (cached && cached.key === key) return Promise.resolve(cached.file);
    building = makeCardFile(name, currentScore()).then((file) => { cached = { key, file }; return file; });
    return building;
  }

  let debounce;
  nameInput.addEventListener('input', () => {
    nameInput.classList.remove('shake');
    try { localStorage.setItem(NAME_KEY, nameInput.value.trim()); } catch (e) {}
    clearTimeout(debounce);
    debounce = setTimeout(prepare, 250);
  });
  nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') nameInput.blur(); });

  new MutationObserver(() => {
    if (!document.getElementById('over').hidden) { cached = null; prepare(); }
  }).observe(document.getElementById('over'), { attributes: true, attributeFilter: ['hidden'] });

  /* ---------- share ---------- */
  shareBtn.addEventListener('click', async () => {
    const name = currentName();
    if (!name) {
      nameInput.classList.remove('shake');
      void nameInput.offsetWidth;
      nameInput.classList.add('shake');
      nameInput.focus();
      return;
    }
    const score = currentScore();
    const key = name + '|' + score;
    const file = cached && cached.key === key ? cached.file : await prepare();
    const text = name + ' kept the ball up ' + score + ' times. Can you beat it? ' + gameUrl;

    try {
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text });
      } else if (navigator.share) {
        await navigator.share({ text, url: gameUrl });
      } else {
        // desktop fallback: download the image
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }
    } catch (e) {
      // AbortError = the player closed the share sheet; nothing to do
      if (e && e.name !== 'AbortError') console.warn('Share failed', e);
    }
  });

  // exposed for testing the card layout
  window.__keepyUppyCard = { drawCard, CARD_W, CARD_H };
})();
