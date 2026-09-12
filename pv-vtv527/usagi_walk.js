/* ==========================================================================
   うさぎ散歩 v2 (2026-08-20)
   ページの中に住んでいるうさぎ(position:fixedではなくabsolute=スクロールで流れる)。
   ふだんは足元をぴょんぴょん歩き、たまにコインの後ろ・タイトルの後ろ・棚のカードの角・
   ページの左右のはし・棚セクションの天井、に隠れている。クリックで会話ふきだし。
   失敗してもページを壊さないよう、全部 try/catch でくるむ。失敗したら #peek1 を元に戻す。
   会話データは window.USAGI_SERIFU (data/うさぎのセリフ.js) を読む。
   ========================================================================== */
(function () {
  var initOk = false;
  try {
    if (document.getElementById('usagiWalkWrap')) return; // 二重読み込み防止

    /* ---------- 定数 ---------- */
    var SIZE = 56;   /* 右下にいた覗きうさぎ(56px)と同じ大きさ。大きいと簡単につかまる */
    var HOP_MS = 900;
    var WALK_S = 18;
    var RUNAWAY_MS = 900;
    var HIDE_MS = 1500; /* 2026-08-21たけろう「いなくなったらすぐ次の場所に」(旧20000) */
    var Z = 9000; // dev panel(99999)より下、コンテンツより上
    var ZBACK = 3; // 「後ろに隠れる」系のスポット用(通常コンテンツより少し上、目立つUIよりは下)

    /* ---------- カウンター ---------- */
    var clicks = 0, visits = 0;
    try {
      clicks = parseInt(localStorage.getItem('usagi_clicks') || '0', 10) || 0;
      visits = parseInt(localStorage.getItem('usagi_visits') || '0', 10) || 0;
      visits += 1;
      localStorage.setItem('usagi_visits', String(visits));
    } catch (e) {}

    /* ---------- 公式うさぎ画像(前向き / 後ろ向き=シルエット) ----------
       ⛔手描きSVGは使わない。公式画像のみを使う(たけろう指示)。
       パスはこのスクリプト自身のsrcから計算する。 */
    var imgSrc = (function () {
      try {
        var self = document.currentScript;
        if (!self) {
          var list = document.getElementsByTagName('script');
          for (var i = 0; i < list.length; i++) {
            if (/usagi_walk\.js/.test(list[i].src)) { self = list[i]; break; }
          }
        }
        var src = self && self.src ? self.src : '';
        return src.replace(/usagi_walk\.js.*$/, '') + 'img/バツベイ_アイコン800.png';
      } catch (e) { return '../img/バツベイ_アイコン800.png'; }
    })();
    function imgTag(extraStyle) {
      return '<img src="' + imgSrc + '" width="' + SIZE + '" height="' + SIZE +
        '" style="display:block;width:' + SIZE + 'px;height:' + SIZE + 'px;object-fit:contain;' + (extraStyle || '') +
        '" alt="うさぎ" draggable="false" onerror="this.style.opacity=0">';
    }

    /* ---------- 音(Web Audio自作。ページの音とは独立=このファイル単体で完結) ---------- */
    var SAC = null;
    function sac() { if (!SAC) SAC = new (window.AudioContext || window.webkitAudioContext)(); return SAC; }
    function stone(f, t0, dur, type, gain, slide) {
      try {
        var a = sac(), o = a.createOscillator(), g = a.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(f, a.currentTime + t0);
        if (slide) o.frequency.exponentialRampToValueAtTime(slide, a.currentTime + t0 + dur);
        g.gain.setValueAtTime(Math.min(gain || 0.1, 0.15), a.currentTime + t0);
        g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + t0 + dur);
        o.connect(g); g.connect(a.destination);
        o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + 0.05);
      } catch (e) {}
    }
    function sndPop() { stone(880, 0, 0.08, 'sine', 0.12, 1320); }
    /* 2026-09-13 たけろう指示: コインが絡む時は「チャリン」 */
    function sndCoin() { stone(2093, 0, 0.10, 'triangle', 0.14); stone(2637, 0.07, 0.16, 'triangle', 0.14); stone(3136, 0.15, 0.22, 'sine', 0.10); }
    function sndScurry() {
      [0, 0.09, 0.18].forEach(function (t, i) { stone(1500 - i * 200, t, 0.08, 'triangle', 0.1, 700 - i * 150); });
    }
    function sndPeek() { stone(660, 0, 0.07, 'sine', 0.12); stone(990, 0.07, 0.09, 'sine', 0.12); }

    /* ---------- ページ座標ユーティリティ ---------- */
    function pageRect(el) {
      var r = el.getBoundingClientRect();
      var sx = window.pageXOffset || document.documentElement.scrollLeft || 0;
      var sy = window.pageYOffset || document.documentElement.scrollTop || 0;
      return { top: r.top + sy, left: r.left + sx, right: r.right + sx, bottom: r.bottom + sy, width: r.width, height: r.height };
    }
    function pageWidth() { return Math.max(document.documentElement.scrollWidth, document.documentElement.clientWidth); }
    function docHeight() { return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight); }

    /* ---------- スタイル注入 ---------- */
    var style = document.createElement('style');
    style.textContent = '' +
      '#usagiWalkWrap{position:absolute;pointer-events:none;z-index:' + Z + ';left:0;top:0;width:0;height:0;}' +
      '.usagi-band{position:absolute;left:0;width:100%;height:0;pointer-events:none;}' +
      '.usagi-track{position:absolute;left:0;bottom:0;width:calc(100% - ' + (SIZE + 20) + 'px);' +
        'animation:usagiWalkX ' + WALK_S + 's ease-in-out infinite alternate;pointer-events:none;}' +
      '.usagi-track.usagi-paused{animation-play-state:paused;}' +
      '.usagi-track.usagi-runaway{animation:none;transition:left ' + RUNAWAY_MS + 'ms ease-in;}' +
      '@keyframes usagiWalkX{from{left:0}to{left:100%}}' +
      /* 隠れスポット用の窓(overflow:hiddenで一部だけ見せる) */
      '.usagi-clip{position:absolute;overflow:hidden;pointer-events:auto;transition:width .25s ease,height .25s ease,left .25s ease,top .25s ease;}' +
      '.usagi-spotwrap{position:absolute;pointer-events:auto;}' +
      '#usagiHop{cursor:pointer;pointer-events:auto;display:block;width:' + SIZE + 'px;height:' + SIZE + 'px;' +
        'animation:usagiHopY .9s ease-in-out infinite;filter:drop-shadow(0 4px 3px rgba(0,0,0,.25));' +
        'transition:transform .2s ease;}' +
      '#usagiHop.usagi-nohop{animation:none;}' +
      '#usagiHop.usagi-paused{animation-play-state:paused;}' +
      '#usagiHop.usagi-mirror{transform:scaleX(-1);}' +
      /* ぴょん=ゆっくり大きめの放物線(点滅に見えない) */
      '@keyframes usagiHopY{0%,100%{transform:translateY(0)}50%{transform:translateY(-22px)}}' +
      '#usagiHop.usagi-mirror{animation:usagiHopYm .9s ease-in-out infinite;}' +
      '#usagiHop.usagi-mirror.usagi-nohop{animation:none;}' +
      '@keyframes usagiHopYm{0%,100%{transform:scaleX(-1) translateY(0)}50%{transform:scaleX(-1) translateY(-22px)}}' +
      /* 逃走: 小動物のジグザグダッシュ */
      '.usagi-scurry{animation:usagiScurry .9s ease-in both !important;}' +
      '@keyframes usagiScurry{' +
        '0%{transform:translateY(0) rotate(0deg)}' +
        '20%{transform:translateY(-10px) rotate(-8deg)}' +
        '40%{transform:translateY(2px) rotate(6deg)}' +
        '60%{transform:translateY(-8px) rotate(-6deg)}' +
        '80%{transform:translateY(2px) rotate(5deg)}' +
        '100%{transform:translateY(0) rotate(0deg)}' +
      '}' +
      '.usagi-dust{position:absolute;border-radius:50%;background:radial-gradient(circle,#ffd7ea,#ffd7ea00);' +
        'width:14px;height:14px;pointer-events:none;animation:usagiDust .5s ease-out forwards;}' +
      '@keyframes usagiDust{0%{opacity:.8;transform:scale(.4)}100%{opacity:0;transform:scale(1.6) translateY(6px)}}' +
      /* ポップ(隠れ場所からフルで出てくる) */
      '.usagi-pop{transform:scale(1.18) !important;}' +
      /* 天井(逆さ) */
      '.usagi-ceil #usagiHop{transform:scaleY(-1);}' +
      '.usagi-ceil #usagiHop.usagi-mirror{transform:scaleY(-1) scaleX(-1);}' +
      /* 角(45度) */
      '.usagi-corner #usagiHop{transform:rotate(45deg);}' +
      '.usagi-corner.usagi-pop #usagiHop{transform:rotate(0deg) scale(1.18);}' +
      /* 2026-08-22: アンカーの後ろに実配置(usagi-real)。後ろからゆっくり頭を出す→引っ込む */
      '#usagiHop.usagi-real-bob{animation:usagiRealBob 2s ease-in-out infinite;}' +
      '@keyframes usagiRealBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}' +
      '#usagiHop.usagi-real-bob.usagi-pop{animation-play-state:paused;}' +
      '#usagiBubbleBack{position:fixed;inset:0;z-index:' + (Z + 1) + ';background:transparent;}' +
      '#usagiBubble{position:fixed;z-index:' + (Z + 2) + ';max-width:min(88vw,380px);background:#fff;' +
        'border-radius:26px;padding:20px 22px;box-shadow:0 8px 0 rgba(0,0,0,.18),0 10px 30px rgba(0,0,0,.2);' +
        'font-weight:900;text-align:center;}' +
      '#usagiBubble .ub-txt{font-size:26px;line-height:1.5;color:#3a2a20;margin-bottom:14px;white-space:pre-wrap;}' +
      '#usagiBubble .ub-choices{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;}' +
      '#usagiBubble .ub-btn{font-size:20px;font-weight:900;border:0;border-radius:999px;padding:12px 22px;' +
        'cursor:pointer;color:#fff;box-shadow:0 4px 0 rgba(0,0,0,.2);}' +
      '#usagiBubble .ub-btn.pink{background:#ee85b5;}' +
      '#usagiBubble .ub-btn.mint{background:#5fd6c4;}' +
      '#usagiBubble .ub-tail{position:absolute;left:50%;margin-left:-14px;width:28px;height:28px;background:#fff;' +
        'transform:rotate(45deg);}' +
      '#usagiBubble.ub-above .ub-tail{bottom:-10px;}' +
      '#usagiBubble.ub-below .ub-tail{top:-10px;}';
    document.head.appendChild(style);

    /* ---------- DOM構築(共通の箱。中身はスポットごとに差し替え) ---------- */
    var wrap = document.createElement('div');
    wrap.id = 'usagiWalkWrap';
    document.body.appendChild(wrap);

    var stage = null;   // 現在のスポットのルート要素(band or clip or spotwrap)
    var clipEl = null;  // クリップ窓(隠れスポットの時だけ)
    var realCleanup = null; // buildBehindReal(2026-08-22)が付与したstyleを元に戻す関数
    var hop = document.createElement('div');
    hop.id = 'usagiHop';
    hop.innerHTML = imgTag();
    hop.setAttribute('aria-label', 'うさぎ');
    hop.setAttribute('role', 'button');

    /* ---------- スポット定義 ----------
       2026-08-21 増量: walker=0.25、残り0.75を隠れスポットで均等割り。
       builder: 'top'(耳だけ上に覗く=coin方式) / 'ceil'(天井から逆さにぶら下がる) /
                'edge'(要素の左右はしから半身だけ覗く。rot付きで横倒し=はみ出た耳)/
                'title'(要素の裏に半分かぶって隠れる)/ 'corner'(要素の角にひっかかる)
       anchorSelが実在しない場合はresolveAnchorsで自動的に除外される(既存の仕組み) */
    var SPOT_DEFS = [
      { name: 'walker',            weight: 0.25, anchorSel: null },
      { name: 'ears-coin',         anchorSel: '#mycoin',                          builder: 'real' },
      { name: 'behind-title',      anchorSel: '.catch',                           builder: 'title' },
      { name: 'card-corner',       anchorSel: '#shelf .item',                     builder: 'corner', dynamic: true },
      { name: 'card-ears',         anchorSel: '#shelf .item',                     builder: 'real',   dynamic: true },
      { name: 'edge-left',         anchorSel: '#shelf-sec',                       builder: 'edge', arg: { side: 'left' } },
      { name: 'edge-right',        anchorSel: '#shelf-sec',                       builder: 'edge', arg: { side: 'right' } },
      { name: 'edge-left-lie',     anchorSel: '#moji-sec',                        builder: 'edge', arg: { side: 'left', rot: 90 } },
      { name: 'edge-right-lie',    anchorSel: '#doors-sec',                       builder: 'edge', arg: { side: 'right', rot: -90 } },
      { name: 'ceiling-shelf',     anchorSel: '#shelf-sec',                       builder: 'ceil' },
      { name: 'ceiling-doors',     anchorSel: '#doors-sec',                       builder: 'ceil' },
      { name: 'ceiling-oshirase',  anchorSel: '#oshirase-sec',                    builder: 'ceil' },
      { name: 'ears-footer',       anchorSel: 'footer',                           builder: 'real' },
      { name: 'ears-oshirase',     anchorSel: '#oshirase-sec',                    builder: 'real' },
      { name: 'door1-corner',      anchorSel: '.doors .door:nth-child(1)',        builder: 'corner' },
      { name: 'door2-corner',      anchorSel: '.doors .door:nth-child(2)',        builder: 'corner' },
      { name: 'gacha-ears',        anchorSel: '.coingames .minimachine:nth-child(1)', builder: 'real' },
      { name: 'slot-ears',         anchorSel: '.coingames .minimachine:nth-child(2)', builder: 'real' },
      { name: 'databtn-corner',    anchorSel: '#dataInfoBtn',                     builder: 'corner' },
      { name: 'playdoor-title',    anchorSel: '.playdoor .pt',                    builder: 'title', arg: { xRatio: 0.2 } }
    ];
    var missingAnchors = [];
    /* dynamic: true のスポット(例: #shelf .item)は候補が複数あるので、
       resolveAnchorsでは「1件でもあるか」だけ確認し、実際にどれを使うかは
       出現のたびにpickDynamicAnchorでランダムに選び直す(2026-08-21修正:
       固定のquerySelectorだと常に先頭の1枚だけになっていた)。 */
    function pickDynamicAnchor(sel) {
      var list = document.querySelectorAll(sel);
      if (!list.length) return null;
      return list[Math.floor(Math.random() * list.length)];
    }
    function resolveAnchors() {
      var out = {};
      SPOT_DEFS.forEach(function (d) {
        if (!d.anchorSel) { out[d.name] = true; return; } // walkerはfooter/文書末尾を毎回計算
        if (d.dynamic) {
          var any = document.querySelector(d.anchorSel);
          if (any) out[d.name] = true;
          else if (missingAnchors.indexOf(d.anchorSel) === -1) missingAnchors.push(d.anchorSel);
          return;
        }
        var el = document.querySelector(d.anchorSel);
        if (el) out[d.name] = el;
        else if (missingAnchors.indexOf(d.anchorSel) === -1) missingAnchors.push(d.anchorSel);
      });
      return out;
    }
    var anchors = resolveAnchors();
    function availableSpots() {
      return SPOT_DEFS.filter(function (d) { return !!anchors[d.name]; });
    }
    /* 重み: walkerは定義済みのweightをそのまま使う。残りは(1-合計)を頭数で均等割り */
    function weightedPool() {
      var pool = availableSpots();
      var fixed = pool.filter(function (d) { return typeof d.weight === 'number'; });
      var rest = pool.filter(function (d) { return typeof d.weight !== 'number'; });
      var fixedTotal = fixed.reduce(function (s, d) { return s + d.weight; }, 0);
      var restEach = rest.length ? Math.max(0, 1 - fixedTotal) / rest.length : 0;
      return pool.map(function (d) {
        return { name: d.name, weight: (typeof d.weight === 'number') ? d.weight : restEach };
      });
    }
    var lastSpotName = null;
    function pickSpotName() {
      var pool = availableSpots();
      if (!pool.length) return 'walker';
      /* 確認用: ?usagi=ceiling 等で出る場所を固定(家のWi-Fi/localhostのみ。確認ハブから使う) */
      try {
        var m = location.search.match(/[?&]usagi=([a-z0-9-]+)/i);
        var home = (['localhost','127.0.0.1'].indexOf(location.hostname) >= 0) || /^192\.168\./.test(location.hostname);
        if (m && home && pool.some(function (d) { return d.name === m[1]; })) return m[1];
      } catch (e) {}
      var weighted = weightedPool();
      function draw() {
        var total = weighted.reduce(function (s, d) { return s + d.weight; }, 0);
        var r = Math.random() * total, acc = 0;
        for (var i = 0; i < weighted.length; i++) {
          acc += weighted[i].weight;
          if (r <= acc) return weighted[i].name;
        }
        return weighted[weighted.length - 1].name;
      }
      var picked = draw();
      /* 直前と同じ場所なら引き直し(最大3回まで。それでも同じなら諦めてそのまま使う=無限ループ防止) */
      var tries = 0;
      while (picked === lastSpotName && weighted.length > 1 && tries < 3) { picked = draw(); tries++; }
      lastSpotName = picked;
      return picked;
    }
    function footerAnchorRect() {
      var f = document.querySelector('footer');
      if (f) return pageRect(f);
      return { top: docHeight() - 40, left: 0, width: pageWidth(), height: 40 };
    }

    var currentSpotName = null;
    var iter = 0;

    function clearStage() {
      if (stage && stage.parentNode) stage.parentNode.removeChild(stage);
      stage = null; clipEl = null;
      if (realCleanup) { try { realCleanup(); } catch (e) {} realCleanup = null; }
    }

    /* ---------- 各スポットの組み立て ---------- */
    function buildWalker() {
      var band = document.createElement('div');
      band.className = 'usagi-band';
      var fr = footerAnchorRect();
      band.style.top = fr.top + 'px';
      var track = document.createElement('div');
      track.className = 'usagi-track';
      hop.className = 'usagi-mirror'; // 初期向きはあとでapplyMirrorが決める
      hop.classList.remove('usagi-nohop', 'usagi-pop');
      track.appendChild(hop);
      band.appendChild(track);
      wrap.appendChild(band);
      stage = band;
      iter = 0;
      track.addEventListener('animationiteration', function () { iter++; applyMirror(track); });
      applyMirror(track);
      return track;
    }
    function applyMirror(track) {
      if (!track) return;
      if (iter % 2 === 0) hop.classList.add('usagi-mirror');
      else hop.classList.remove('usagi-mirror');
    }

    /* 微調整の保存値(2026-08-22): かくれんぼ一覧の▲▼で決めた各スポットのズレ。localStorageに保存 */
    var TUNE = {};
    try { TUNE = JSON.parse(localStorage.getItem('usagi_tune') || '{}') || {}; } catch (e) {}
    function makeClip(x, y, w, h) {
      try { var tn = TUNE[currentSpotName]; if (tn) { y += (tn.dy || 0); x += (tn.dx || 0); } } catch (e) {}
      var c = document.createElement('div');
      c.className = 'usagi-clip';
      c.style.left = x + 'px'; c.style.top = y + 'px'; c.style.width = w + 'px'; c.style.height = h + 'px';
      c.style.zIndex = String(ZBACK);
      wrap.appendChild(c);
      return c;
    }
    function placeHopIn(container, left, top) {
      hop.style.position = 'absolute';
      hop.style.left = left + 'px';
      hop.style.top = top + 'px';
      hop.classList.add('usagi-nohop');
      hop.classList.remove('usagi-mirror', 'usagi-pop');
      container.appendChild(hop);
    }

    /* ---------- 耳だけ覗きの汎用ビルダー(2026-08-21、08-21 18:40修正) ----------
       anchorEl の上端のすぐ外側に小さな窓(高さ=SIZEの1/3)を置き、うさぎの頭側だけを見せる。
       #mycoin(元の「金貨の後ろ」)含め、いろいろな要素に使い回せるよう汎用化した。
       横位置: 要素が広い(#shelf-sec等)と毎回同じ中央固定になり単調だったので、
       要素幅の中でランダム(左右10%は避ける)にした。 */
    function randomClipX(r, clipW) {
      var margin = Math.max(0, r.width * 0.10);
      var span = r.width - margin * 2 - clipW;
      var x = (span > 0) ? (r.left + margin + Math.random() * span) : (r.left + r.width / 2 - clipW / 2);
      return Math.max(2, Math.min(pageWidth() - clipW - 2, x));
    }
    function buildEarsBehindCoin(anchorEl, randomX) {
      var r = pageRect(anchorEl);
      /* 2026-08-22たけろう「切り口が浮いて輪切りに見える」対策:
         窓を物の内側へ少し食い込ませ(OVERLAP)、切り口の線が必ず「絵の上」に乗るようにする。
         (コインや台は上辺が丸い/箱に余白があるため、箱の上端=絵の上端ではない) */
      var OVERLAP = 12;
      var visibleH = Math.round(SIZE / 3) + OVERLAP; /* 上に出る耳の量は従来どおり、食い込み分だけ窓を深く */
      var clipW = SIZE, clipH = visibleH;
      /* 2026-08-21たけろう分析: 窓のふちが「見えている物」のふちに重なって初めて隠れて見える。
         横ランダムだと物からズレて空中でちょん切れる。物に密着すべきスポット(コイン等)はrandomX省略=中央固定、
         幅いっぱいの背景(band/footer/oshirase/天井)だけrandomX:trueでランダムを許可。 */
      var clipX = randomX ? randomClipX(r, clipW) : Math.max(2, Math.min(pageWidth() - clipW - 2, r.left + r.width / 2 - clipW / 2));
      var clipY = r.top - (visibleH - OVERLAP); /* 窓の下側OVERLAP分が物の内側に食い込む */
      var fromBottom = false;
      if (clipY < 2) { clipY = r.bottom; fromBottom = true; } // 上に出す余白がない(文書の上端など)→下に出す
      clipEl = makeClip(clipX, clipY, clipW, clipH);
      placeHopIn(clipEl, 0, 0); // 窓=画像の上1/3=耳だけ(体は要素の後ろに隠れている想定)
      stage = clipEl;
      return { clipEl: clipEl, popW: SIZE, popH: SIZE, popLeft: 0, popTop: 0, fromBottom: fromBottom };
    }
    /* ---------- アンカーの後ろに実配置(2026-08-22 根本作り替え) ----------
       クリップ窓の微調整合戦をやめ、うさぎ要素を#usagiWalkWrapから出してアンカーの「親要素」の
       子として挿入する。アンカーとうさぎが同じスタッキングコンテキスト(親要素)の中で
       z-index比較されるので、ブラウザの重なり順が本物の遮蔽をやってくれる。
       ears系8スポット(ears-coin/pcoin/card-ears/ears-band/ears-footer/ears-oshirase/
       gacha-ears/slot-ears)専用。 */
    function buildBehindReal(anchorEl) {
      var parent = anchorEl.parentNode;
      var addedParentPos = false, addedAnchorPos = false, addedAnchorZ = false;
      try {
        if (getComputedStyle(parent).position === 'static') { parent.style.position = 'relative'; addedParentPos = true; }
      } catch (e) {}
      try {
        if (getComputedStyle(anchorEl).position === 'static') { anchorEl.style.position = 'relative'; addedAnchorPos = true; }
      } catch (e) {}
      try {
        if (!anchorEl.style.zIndex) { anchorEl.style.zIndex = '2'; addedAnchorZ = true; }
      } catch (e) {}
      var box = document.createElement('div');
      box.className = 'usagi-spotwrap usagi-real';
      box.style.position = 'absolute';
      box.style.width = SIZE + 'px'; box.style.height = SIZE + 'px';
      box.style.zIndex = '1'; // アンカー(z=2以上)より必ず下
      box.style.left = (anchorEl.offsetLeft + anchorEl.offsetWidth / 2 - SIZE / 2) + 'px';
      box.style.top = (anchorEl.offsetTop - SIZE / 2) + 'px'; // 体の下半分がアンカーに重なる高さ=耳・頭だけ自然に覗く
      parent.appendChild(box);
      hop.style.position = 'static';
      hop.classList.add('usagi-nohop', 'usagi-real-bob');
      hop.classList.remove('usagi-mirror', 'usagi-pop');
      box.appendChild(hop);
      stage = box;
      realCleanup = function () {
        hop.classList.remove('usagi-real-bob');
        if (addedAnchorZ) anchorEl.style.zIndex = '';
        if (addedAnchorPos) anchorEl.style.position = '';
        if (addedParentPos) parent.style.position = '';
      };
      return { box: box, isReal: true };
    }
    function buildCeiling(anchorEl) {
      var r = pageRect(anchorEl);
      var visibleH = Math.round(SIZE / 3);
      var clipW = SIZE, clipH = visibleH;
      var clipX = randomClipX(r, clipW);
      var clipY = Math.max(2, r.top); // セクション天井のすぐ下(文書の上端より上にはしない)
      clipEl = makeClip(clipX, clipY, clipW, clipH);
      hop.classList.add('usagi-ceil-marker');
      placeHopIn(clipEl, 0, clipH - SIZE); // 逆さ(scaleY(-1))なので耳は要素の下端。要素の下1/3を窓に入れる
      clipEl.classList.add('usagi-ceil');
      stage = clipEl;
      return { clipEl: clipEl, popW: SIZE, popH: SIZE, popLeft: 0, popTop: 0, ceil: true };
    }
    /* edge: anchorEl の左右のはしから半身だけ覗く。rotを渡すと横倒し(端から耳だけはみ出た感じ)。
       anchorElが画面いっぱいの要素(#shelf-sec等)なら実質「画面のはし」になる。 */
    function buildEdge(anchorEl, side, rot) {
      var r = pageRect(anchorEl);
      var y = r.top + Math.random() * Math.max(1, r.height - SIZE);
      var half = Math.round(SIZE / 2);
      var edgeX = side === 'left' ? r.left : (r.right - half);
      edgeX = Math.max(0, Math.min(pageWidth() - half, edgeX));
      clipEl = makeClip(edgeX, y, half, SIZE);
      var innerLeft = side === 'left' ? -half : 0; // leftは右半分だけ見せる/rightは左半分だけ見せる
      placeHopIn(clipEl, innerLeft, 0);
      if (rot) hop.style.transform = 'rotate(' + rot + 'deg)';
      stage = clipEl;
      return { clipEl: clipEl, popW: SIZE, popH: SIZE, popLeft: side === 'left' ? -half : -(SIZE - half), popTop: 0, rot: rot || 0 };
    }
    /* ---------- 角から頭だけ覗く窓(未使用のまま残置。corner/title系は下の「見える子」枠へ戻した) ---------- */
    function buildCornerPeek(anchorEl) {
      var r = pageRect(anchorEl);
      var clipW = SIZE, clipH = Math.round(SIZE * 0.85);
      var clipX = Math.max(2, Math.min(pageWidth() - clipW - 2, r.right - clipW * 0.65));
      var clipY = r.top - clipH * 0.6;
      if (clipY < 2) clipY = Math.max(2, r.top); // 上の余白が無ければアンカー上端に揃える
      clipEl = makeClip(clipX, clipY, clipW, clipH);
      placeHopIn(clipEl, 0, 0);
      stage = clipEl;
      return { clipEl: clipEl, popW: SIZE, popH: SIZE, popLeft: 0, popTop: 0 };
    }
    /* ---------- 08-21復活: 「見える子」枠(顔・全身丸見えでOKな座りポーズ) ----------
       たけろう訂正: corner/title系は「隠れてる」のではなく「そこに座ってる・顔を出してる」枠。
       丸見えが正解なのでz-index比較は不要。旧実装(_直前退避\2026-08-21\usagi_walk.js_2138)を復活。 */
    function buildBehindTitle(anchorEl, xRatio) {
      var r = pageRect(anchorEl);
      var xr = (typeof xRatio === 'number') ? xRatio : 0.5; // 0.5=中央。playdoor-titleはdatabtn-cornerと重ならないよう左寄り(0.2)を渡す
      try {
        if (!anchorEl.style.position) anchorEl.style.position = 'relative';
        if (!anchorEl.style.zIndex) anchorEl.style.zIndex = '4';
      } catch (e) {}
      var box = document.createElement('div');
      box.className = 'usagi-spotwrap';
      box.style.left = (r.left + r.width * xr - SIZE / 2) + 'px';
      box.style.top = (r.top + r.height / 2 - SIZE / 2) + 'px';
      box.style.width = SIZE + 'px'; box.style.height = SIZE + 'px';
      box.style.zIndex = String(ZBACK);
      wrap.appendChild(box);
      hop.style.position = 'static';
      hop.classList.add('usagi-nohop');
      hop.classList.remove('usagi-mirror', 'usagi-pop');
      box.appendChild(hop);
      stage = box;
      return { box: box, isBehindTitle: true };
    }
    function buildCardCorner(anchorEl) {
      var r = pageRect(anchorEl);
      var box = document.createElement('div');
      box.className = 'usagi-spotwrap usagi-corner';
      box.style.left = (r.right - SIZE * 0.62) + 'px';
      box.style.top = (r.top - SIZE * 0.3) + 'px';
      box.style.width = SIZE + 'px'; box.style.height = SIZE + 'px';
      box.style.zIndex = String(Z - 1);
      wrap.appendChild(box);
      hop.style.position = 'static';
      hop.classList.add('usagi-nohop');
      hop.classList.remove('usagi-mirror', 'usagi-pop');
      box.appendChild(hop);
      stage = box;
      return { box: box };
    }

    var currentPop = null; // ポップ解除に使う情報

    function layoutSpot(name) {
      clearStage();
      currentSpotName = name;
      hop.innerHTML = imgTag();
      hop.style.transform = '';
      hop.classList.remove('usagi-pop');
      if (name === 'walker') {
        currentPop = null;
        return buildWalker();
      }
      var def = null;
      for (var i = 0; i < SPOT_DEFS.length; i++) { if (SPOT_DEFS[i].name === name) { def = SPOT_DEFS[i]; break; } }
      /* dynamic(#shelf .item等・複数候補): 出現のたびにランダムな1枚を選び直す。
         それ以外: resolveAnchorsで確定済みの要素をそのまま使う。 */
      var a = (def && def.dynamic) ? pickDynamicAnchor(def.anchorSel) : anchors[name];
      if (!a) { name = 'walker'; currentSpotName = 'walker'; currentPop = null; return buildWalker(); }
      var builder = def && def.builder;
      var arg = (def && def.arg) || {};
      if (builder === 'top') { currentPop = buildEarsBehindCoin(a, arg.randomX); }
      else if (builder === 'real') { currentPop = buildBehindReal(a); }
      else if (builder === 'ceil') { currentPop = buildCeiling(a); }
      else if (builder === 'edge') { currentPop = buildEdge(a, arg.side || 'left', arg.rot || 0); }
      else if (builder === 'title') { currentPop = buildBehindTitle(a, arg.xRatio); }
      else if (builder === 'corner') { currentPop = buildCardCorner(a); }
      else if (builder === 'cornerpeek') { currentPop = buildCornerPeek(a); }
      else { currentPop = null; return buildWalker(); }
      return null;
    }

    var track = layoutSpot(pickSpotName());

    /* ---------- 見学モード(?usagitour=1・家のネット限定): 全スポットを2.5秒ごとに巡回。
       確認用の裏口。window.__usagiTourLog に各スポットの実測(位置・見えているか)を残す ---------- */
    try {
      var homeNet = (['localhost','127.0.0.1'].indexOf(location.hostname) >= 0) || /^192\.168\./.test(location.hostname);
      if (homeNet && /[?&]usagitour=1/.test(location.search)) {
        /* 2026-08-21たけろう「自動巡回はやりづらい。一覧から選ばせて」→ 番号つきメニュー方式に変更。
           クリックでその場所にうさぎが出て自動スクロール。計測(__usagiTourLog)も選んだ分だけ記録 */
        window.__usagiTourLog = [];
        var LABELS = {
          walker: 'したを さんぽ', 'ears-coin': 'きんかの うしろ', 'ears-pcoin': 'きんか2の うしろ',
          'behind-title': 'タイトルに かぶる', 'card-corner': 'カードの かど', 'card-ears': 'カードの うしろ(みみ)',
          'edge-left': 'ひだりはし(はんしん)', 'edge-right': 'みぎはし(はんしん)',
          'edge-left-lie': 'ひだりはし よこたおし', 'edge-right-lie': 'みぎはし よこたおし',
          'ceiling-shelf': 'たなの てんじょう', 'ceiling-doors': 'とびらの てんじょう', 'ceiling-oshirase': 'おしらせの てんじょう',
          'ears-band': 'おびの うえ(みみ)', 'ears-footer': 'フッターの うえ(みみ)', 'ears-oshirase': 'おしらせの うえ(みみ)',
          'door1-corner': 'とびら1の かど', 'door2-corner': 'とびら2の かど',
          'gacha-ears': 'ガチャだいの うしろ', 'slot-ears': 'スロットだいの うしろ',
          'databtn-corner': 'データボタンの かど', 'playdoor-title': 'あそびばの みだし'
        };
        var showSpot = function (nm) {
          try {
            anchors = resolveAnchors();
            track = layoutSpot(nm);
            setTimeout(function () {
              try {
                hop.scrollIntoView({ block: 'center', behavior: 'smooth' });
                setTimeout(function () {
                  try {
                    var r = hop.getBoundingClientRect();
                    var clipR = clipEl ? clipEl.getBoundingClientRect() : null;
                    var visW = clipR ? Math.max(0, Math.min(r.right, clipR.right) - Math.max(r.left, clipR.left)) : r.width;
                    var visH = clipR ? Math.max(0, Math.min(r.bottom, clipR.bottom) - Math.max(r.top, clipR.top)) : r.height;
                    window.__usagiTourLog.push({ name: nm, top: Math.round(r.top), left: Math.round(r.left), visW: Math.round(visW), visH: Math.round(visH) });
                  } catch (e) {}
                }, 700);
              } catch (e) {}
            }, 150);
          } catch (e) {}
        };
        /* 微調整バー(2026-08-22): 選択中スポットの位置を▲▼◀▶で2pxずつ動かして保存。
           保存先=localStorage 'usagi_tune'(本番の全員に効かせる時はF5がこの値を回収してコードに焼き込む) */
        var tuneTarget = null;
        var tuneBar = document.createElement('div');
        tuneBar.style.cssText = 'position:sticky;bottom:0;background:#fff;padding:8px 4px 2px;display:none;border-top:3px solid #f3f1f5;';
        var tuneInfo = document.createElement('div');
        tuneInfo.style.cssText = 'font-size:14px;margin-bottom:6px;color:#3a2a20;';
        tuneBar.appendChild(tuneInfo);
        var tuneBtns = document.createElement('div');
        tuneBtns.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:4px;';
        tuneBar.appendChild(tuneBtns);
        var applyTune = function (ddx, ddy) {
          if (!tuneTarget) return;
          var t = TUNE[tuneTarget] || (TUNE[tuneTarget] = { dx: 0, dy: 0 });
          t.dx = (t.dx || 0) + ddx; t.dy = (t.dy || 0) + ddy;
          try { localStorage.setItem('usagi_tune', JSON.stringify(TUNE)); } catch (e) {}
          tuneInfo.textContent = 'よこ ' + (t.dx || 0) + ' / たて ' + (t.dy || 0);
          showSpot(tuneTarget);
        };
        [['◀', -2, 0], ['▶', 2, 0], ['▲', 0, -2], ['▼', 0, 2]].forEach(function (bb) {
          var tb = document.createElement('button');
          tb.textContent = bb[0];
          tb.style.cssText = 'border:0;background:#5fd6c4;color:#fff;font-weight:900;font-size:20px;border-radius:10px;padding:8px 0;cursor:pointer;font-family:inherit;';
          tb.onclick = function () { applyTune(bb[1], bb[2]); };
          tuneBtns.appendChild(tb);
        });
        var openTune = function (nm) {
          tuneTarget = nm;
          var t = TUNE[nm] || {};
          tuneInfo.textContent = 'よこ ' + (t.dx || 0) + ' / たて ' + (t.dy || 0);
          tuneBar.style.display = 'block';
        };
        var menu = document.createElement('div');
        menu.id = 'usagiTourMenu';
        menu.style.cssText = 'position:fixed;right:8px;top:8px;bottom:8px;overflow-y:auto;z-index:99998;' +
          'background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.25);padding:10px;width:230px;font-weight:900;';
        /* 2026-08-22たけろう「スマホで画面を占有してうさぎが見えない」→ とじる/ひらく式に。
           とじると小さな🐰ボタンだけ残り、押すと一覧が戻る */
        var reopenBtn = document.createElement('button');
        reopenBtn.textContent = '🐰';
        reopenBtn.style.cssText = 'position:fixed;right:8px;top:8px;z-index:99998;display:none;' +
          'width:56px;height:56px;border:0;border-radius:50%;background:#fff;font-size:28px;cursor:pointer;' +
          'box-shadow:0 8px 24px rgba(0,0,0,.25);';
        reopenBtn.onclick = function () { menu.style.display = 'block'; reopenBtn.style.display = 'none'; };
        document.body.appendChild(reopenBtn);
        var head = document.createElement('div');
        head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:2px 4px 8px;';
        var headTxt = document.createElement('span');
        headTxt.textContent = '🐰 かくれんぼ一覧';
        headTxt.style.cssText = 'font-size:18px;font-weight:900;';
        head.appendChild(headTxt);
        var closeBtn = document.createElement('button');
        closeBtn.textContent = 'とじる';
        closeBtn.style.cssText = 'border:0;background:#ee85b5;color:#fff;font-weight:900;font-size:16px;' +
          'border-radius:10px;padding:8px 12px;cursor:pointer;font-family:inherit;';
        closeBtn.onclick = function () { menu.style.display = 'none'; reopenBtn.style.display = 'block'; };
        head.appendChild(closeBtn);
        menu.appendChild(head);
        SPOT_DEFS.forEach(function (d, i) {
          var b = document.createElement('button');
          b.textContent = (i + 1) + '. ' + (LABELS[d.name] || d.name);
          b.style.cssText = 'display:block;width:100%;text-align:left;border:0;background:#f3f1f5;color:#3a2a20;' +
            'font-weight:900;font-size:16px;border-radius:10px;padding:9px 10px;margin:4px 0;cursor:pointer;font-family:inherit;';
          b.onclick = function () {
            [].forEach.call(menu.querySelectorAll('button'), function (x) { x.style.background = '#f3f1f5'; x.style.color = '#3a2a20'; });
            b.style.background = '#ee85b5'; b.style.color = '#fff';
            showSpot(d.name);
            openTune(d.name);
          };
          menu.appendChild(b);
        });
        menu.appendChild(tuneBar);
        document.body.appendChild(menu);
      }
    } catch (e) {}

    /* ---------- リサイズ時に再計算(1回だけ・デバウンス) ---------- */
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        try {
          anchors = resolveAnchors();
          if (state === 'talk' || state === 'runaway') return; // 会話中/逃走中は動かさない
          track = layoutSpot(currentSpotName);
        } catch (e) {}
      }, 200);
    });

    /* ---------- ふきだし ---------- */
    var back, bubble, state = 'idle';
    function closeBubble() {
      if (back) { back.remove(); back = null; }
      if (bubble) { bubble.remove(); bubble = null; }
      state = 'idle';
    }
    function resumeWalk() {
      if (track) track.classList.remove('usagi-paused');
      hop.classList.remove('usagi-paused');
    }
    function pauseWalk() {
      if (track) track.classList.add('usagi-paused');
      hop.classList.add('usagi-paused');
    }

    /* ---------- 時間帯・端末・状況(2026-09-02 たけろうのセリフ仕様) ---------- */
    function timeSlot() {
      var h = new Date().getHours();
      if (h >= 5 && h < 11) return 'morning';
      if (h >= 11 && h < 17) return 'noon';
      if (h >= 17 && h < 19) return 'evening'; /* 夕方のセリフは無し=無印だけ出る */
      if (h >= 19) return 'night';
      return 'late';
    }
    function isNightNow() { var s = timeSlot(); return s === 'night' || s === 'late'; }
    function isMobileNow() {
      try { return window.matchMedia('(max-width: 700px)').matches; } catch (e) { return false; }
    }
    function getCoins() {
      try { if (window.CHIBI && CHIBI.getCoins) return CHIBI.getCoins(); return parseInt(localStorage.getItem('chibi_coins') || '0', 10) || 0; } catch (e) { return 0; }
    }
    function addCoins(n) {
      try {
        if (window.CHIBI && CHIBI.addCoins) { CHIBI.addCoins(n); if (CHIBI.refreshCoinGui) CHIBI.refreshCoinGui(true); return; }
        localStorage.setItem('chibi_coins', String(Math.max(0, getCoins() + n)));
      } catch (e) {}
    }
    function hasKey() { try { return !!localStorage.getItem('chibi_atari'); } catch (e) { return false; } }
    function recentMiss() {
      try {
        var t = parseInt(localStorage.getItem('usagi_lastmiss') || '0', 10) || 0;
        return t && (Date.now() - t) < 10 * 60 * 1000;
      } catch (e) { return false; }
    }
    function clearMiss() { try { localStorage.removeItem('usagi_lastmiss'); } catch (e) {} }
    function oshieteCount() { try { return parseInt(localStorage.getItem('usagi_oshiete') || '0', 10) || 0; } catch (e) { return 0; } }
    function setOshiete(n) { try { localStorage.setItem('usagi_oshiete', String(n)); } catch (e) {} }
    function zukanNode(data) {
      var z = data.ZUKAN || {};
      var total = (window.CHIBI && CHIBI.ALL && CHIBI.ALL.length) || 58, got = 0;
      try { got = JSON.parse(localStorage.getItem('chibi_zukan') || '[]').length; } catch (e) {}
      var half = Math.floor(total / 2), t;
      if (got >= total) t = z.all || '';
      else if (got === half) t = z.half || '';
      else if (got < half) t = (z.mada || '').replace('{n}', String(got));
      else t = (z.ato || '').replace('{n}', String(total - got));
      return { text: t, end: true, runaway: true };
    }
    function eventLineToday(data) {
      try {
        var d = new Date(), key = ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
        var text = data.EVENTS && data.EVENTS[key];
        if (!text) return null;
        var stamp = d.getFullYear() + '-' + key;
        if (localStorage.getItem('usagi_event_said') === stamp) return null;
        localStorage.setItem('usagi_event_said', stamp);
        return { text: text, end: true, runaway: true };
      } catch (e) { return null; }
    }
    var pendingCoinGive = 0;
    var lastOpening = '';
    var lastClickCeil = false;
    function pickOpening(data) {
      /* 1) 話しかけた回数のごほうび(5回目2枚・10回目3枚・以降10の倍数3枚・100回目15枚) */
      var give = 0;
      if (clicks === 5) give = 2; else if (clicks === 100) give = 15; else if (clicks >= 10 && clicks % 10 === 0) give = 3;
      if (give > 0) { pendingCoinGive = give; return '__COIN_GIVE__'; }
      /* 2) 暦のイベント(その日の最初だけ) */
      if (data.EVENTS && data.EVENTS[('0' + (new Date().getMonth() + 1)).slice(-2) + '-' + ('0' + new Date().getDate()).slice(-2)]) {
        var ev = eventLineToday(data); if (ev) { pendingEvent = ev; return '__EVENT__'; }
      }
      /* 2026-09-13 たけろう決定: 以下は全部「1つの袋」から均等に引く(pickTriviaKey)。
         条件もの(外れ直後・鍵・コイン90万・図鑑・しりたい?・逆さま・時間帯・スマホ)は条件を満たす時だけ袋に入る。出やすくはしない */
      return 'trivia';
    }
    var pendingEvent = null;

    function pickTriviaKey(data) {
      /* 2026-09-13: 袋= まめちしき + 隠れ/耳の一言(条件なし) + 逆さまの一言(逆さまの時) + 条件もの(ref) */
      var list = (data.TRIVIA || []).slice();
      var plain = function (t) { return { text: t, end: true, runaway: true }; };
      (data.HIDDEN || []).forEach(function (t) { list.push(plain(t)); });
      (data.HIDDEN_EARS || []).forEach(function (t) { list.push(plain(t)); });
      if (lastClickCeil) (data.HIDDEN_CEIL || []).forEach(function (t) { list.push(plain(t)); });
      lastClickCeil = false;
      if (recentMiss() && data.miss) list.push({ ref: 'miss' });
      if (hasKey() && data.key) list.push({ ref: 'key' });
      if (getCoins() >= 900000 && data.coin99) list.push({ ref: 'coin99' }); /* 2026-09-13: 99枚→90万枚以上 */
      if (data.ZUKAN) list.push({ ref: '__ZUKAN__' });
      list.push({ ref: 'start' }); /* しりたい? も袋の1本 */
      var candidates = [];
      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (item && typeof item === 'object') {
          if (item.night && !isNightNow()) continue;
          if (item.time && item.time !== timeSlot()) continue;
          if (item.mobile && !isMobileNow()) continue;
        }
        candidates.push(i);
      }
      if (!candidates.length) candidates = list.map(function (_, i) { return i; });
      /* 2026-09-11 たけろう「同じのが10回中3回出る」: 一様乱数は同じ物が続いても不思議ではない(候補30本で10回引くと
         2回出る物がほぼ必ず出る)。最近出した物(直近12本)を候補から外して、全部出てから戻すようにする */
      var recent = [];
      try { recent = JSON.parse(sessionStorage.getItem('usagi_recent_trivia') || '[]'); } catch (e) {}
      /* 2026-09-13: 直近は「文」で覚える(袋の並びが変わっても効く)。直近24本は出さない=同じ物がすぐ出ない */
      var keyOf = function (i) { var it = list[i]; return typeof it === 'string' ? it : (it.ref || it.text || String(i)); };
      var fresh = candidates.filter(function (i) { return recent.indexOf(keyOf(i)) < 0; });
      if (fresh.length) candidates = fresh;
      var idx = candidates[Math.floor(Math.random() * candidates.length)];
      try { recent.push(keyOf(idx)); while (recent.length > 24) recent.shift(); sessionStorage.setItem('usagi_recent_trivia', JSON.stringify(recent)); } catch (e) {}
      return { idx: idx, item: list[idx] };
    }

    var pendingTriviaReply = ''; // 'ぷろんぷと|へんじ' 形式の1行トリビア用: 「…」の後にテキストとして出す返事
    function resolveNode(data, key) {
      /* 「しりたい?」の枝: 回数で文が変わる。[おしえて]は2回「おしえない」、3回目でひみつへ。[いい]は無言で逃げる */
      if (key === 'start') {
        var n = oshieteCount();
        var ui = data.UI || {}; /* 英語版などは data.UI で差し替え。無ければ日本語(2026-09-09) */
        var t = n >= 2 ? (ui.hontoni2 || 'ほんとに ほんとに?') : (n === 1 ? (ui.hontoni || 'ほんとに?') : (ui.shiritai || 'しりたい?'));
        return { text: t, choices: [ { label: ui.oshiete || 'おしえて', next: '__OSHIETE__' }, { label: ui.ii || 'いい', next: '__II__' } ] };
      }
      if (key === '__OSHIETE__') {
        var n2 = oshieteCount();
        if (n2 >= 2) { setOshiete(0); return data.secret; }
        setOshiete(n2 + 1); return data.yes1;
      }
      if (key === '__II__') return null;
      if (key === '__COIN_GIVE__') {
        var lines = data.COIN_GIVE || ['はいこれ'];
        return { text: lines[Math.floor(Math.random() * lines.length)], coins: pendingCoinGive, end: true, runaway: true };
      }
      if (key === '__EVENT__') { var ev = pendingEvent; pendingEvent = null; return ev; }
      if (key === '__ZUKAN__') return zukanNode(data);
      if (key === 'trivia') {
        var picked = pickTriviaKey(data);
        var item = picked.item;
        if (item && item.ref) { if (item.ref === 'miss') clearMiss(); return resolveNode(data, item.ref); } /* 2026-09-13: 条件ものは元の枝へ */
        if (typeof item === 'string') {
          var parts = item.split('|');
          if (parts[1]) {
            pendingTriviaReply = parts[1];
            return { text: parts[0], choices: [{ label: '…', next: '__TRIVIA_REPLY__' }] };
          }
          return { text: parts[0], end: true, runaway: true };
        }
        return item; // choices付きノード or {text,end,runaway}
      }
      if (key === '__TRIVIA_REPLY__') {
        return { text: pendingTriviaReply, choices: [{ label: (data.UI && data.UI.tojiru) || 'とじる', next: '__TRIVIA_REPLY_END__' }] };
      }
      return data[key];
    }

    function renderNode(nodeKey) {
      var data = window.USAGI_SERIFU || {};
      var node;
      if (nodeKey === '__TRIVIA_REPLY_END__') {
        node = null;
      } else {
        node = resolveNode(data, nodeKey);
      }
      if (!node) { closeBubble(); startRunaway(); return; }
      if (node.coins) { addCoins(node.coins); try { sndCoin(); } catch (e) {} } /* コインの増減はここ1か所。2026-09-13: 音=チャリン */

      if (!bubble) {
        back = document.createElement('div');
        back.id = 'usagiBubbleBack';
        back.onclick = function () { closeBubble(); if (state !== 'runaway') resumeWalk(); };
        document.body.appendChild(back);

        bubble = document.createElement('div');
        bubble.id = 'usagiBubble';
        document.body.appendChild(bubble);
        sndPop();
      }

      var txt = node.text || '';
      var html = '<div class="ub-txt"></div><div class="ub-choices"></div><div class="ub-tail"></div>';
      bubble.innerHTML = html;
      bubble.querySelector('.ub-txt').textContent = txt;

      var choicesEl = bubble.querySelector('.ub-choices');
      var colors = ['pink', 'mint'];
      if (node.choices && node.choices.length) {
        node.choices.forEach(function (c, i) {
          var b = document.createElement('button');
          b.className = 'ub-btn ' + colors[i % 2];
          b.textContent = c.label;
          b.onclick = function () {
            try { renderNode(c.next); } catch (e) { closeBubble(); }
          };
          choicesEl.appendChild(b);
        });
      }

      positionBubble();

      if (node.end) {
        setTimeout(function () {
          closeBubble();
          if (node.runaway) startRunaway(); else resumeWalk();
        }, node.choices && node.choices.length ? 0 : 1600);
      }
    }

    var MARGIN = 8;
    function positionBubble() {
      if (!bubble) return;
      var r = hop.getBoundingClientRect();
      var rabbitCX = r.left + r.width / 2;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var above = !(r.top < vh * 0.4);
      bubble.classList.remove('ub-above', 'ub-below');
      bubble.classList.add(above ? 'ub-above' : 'ub-below');
      requestAnimationFrame(function () {
        if (!bubble) return;
        var bw = bubble.offsetWidth || 300;
        var bh = bubble.offsetHeight || 120;
        var left = Math.max(MARGIN, Math.min(window.innerWidth - MARGIN - bw, rabbitCX - bw / 2));
        bubble.style.left = left + 'px';
        if (above) bubble.style.top = (r.top - bh - 16) + 'px';
        else bubble.style.top = (r.bottom + 16) + 'px';
        var tail = bubble.querySelector('.ub-tail');
        if (tail) {
          var tailX = Math.max(18, Math.min(bw - 18, rabbitCX - left));
          tail.style.left = tailX + 'px';
          tail.style.marginLeft = '-14px';
        }
      });
    }

    /* ---------- 逃走演出: 小動物のジグザグダッシュ + 砂けむり ---------- */
    function spawnDust(x, y) {
      for (var i = 0; i < 3; i++) {
        (function (i) {
          setTimeout(function () {
            try {
              var d = document.createElement('div');
              d.className = 'usagi-dust';
              d.style.left = (x - 7 + (Math.random() * 16 - 8)) + 'px';
              d.style.top = (y - 7 + (Math.random() * 10 - 5)) + 'px';
              wrap.appendChild(d);
              setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 550);
            } catch (e) {}
          }, i * 90);
        })(i);
      }
    }

    function reappearFresh() {
      var name = pickSpotName();
      currentSpotName = name;
      if (name === 'walker') {
        track = layoutSpot('walker');
      } else {
        track = layoutSpot(name); // 隠れスポット: 一瞬でその場に出る(スライド演出なし)
      }
      hop.innerHTML = imgTag();
      hop.style.opacity = '';
      hop.style.transform = '';
      hop.classList.remove('usagi-scurry', 'usagi-pop');
      wrap.style.visibility = '';
      resumeWalk();
      state = 'idle';
    }

    function startRunaway() {
      state = 'runaway';
      closeBubble();

      // 後ろ姿(シルエット)にする
      var img = hop.querySelector('img');
      if (img) img.style.filter = 'brightness(0)';
      hop.classList.remove('usagi-mirror', 'usagi-pop');

      var r = hop.getBoundingClientRect();
      spawnDust(r.left + r.width / 2, r.bottom);
      sndScurry();
      hop.classList.add('usagi-scurry');

      if (currentSpotName === 'walker' && track) {
        var trackW = track.offsetWidth;
        var curLeft = track.getBoundingClientRect().left;
        var goRight = curLeft < trackW / 2;
        track.classList.add('usagi-runaway');
        void track.offsetWidth;
        track.style.left = (goRight ? trackW : 0) + 'px';
        setTimeout(function () {
          wrap.style.visibility = 'hidden';
          setTimeout(reappearFresh, HIDE_MS);
        }, RUNAWAY_MS + 50);
      } else {
        // 隠れスポット: 一番近い辺へジグザグしながら消える
        var toRight = (r.left + r.width / 2) > (window.innerWidth / 2);
        hop.style.transition = 'transform ' + RUNAWAY_MS + 'ms ease-in';
        hop.style.transform = 'translateX(' + (toRight ? window.innerWidth : -window.innerWidth) + 'px)';
        setTimeout(function () {
          wrap.style.visibility = 'hidden';
          hop.style.transition = '';
          hop.style.transform = '';
          setTimeout(reappearFresh, HIDE_MS);
        }, RUNAWAY_MS + 50);
      }
    }

    /* ---------- 隠れスポットの「ポン」と出てくる演出 ---------- */
    function popOutHidden() {
      try {
        if (clipEl) {
          clipEl.style.width = SIZE + 'px';
          clipEl.style.height = SIZE + 'px';
          hop.style.left = '0px';
          hop.style.top = '0px';
        }
        hop.classList.add('usagi-pop');
        if (stage) stage.classList.add('usagi-pop');
        var r = hop.getBoundingClientRect();
        sndPeek();
      } catch (e) {}
    }

    /* ---------- うさぎは1羽だけ: 初期化に成功したのでフッターの覗きうさぎは隠す ---------- */
    try {
      var peek1 = document.getElementById('peek1');
      if (peek1) peek1.style.display = 'none';
    } catch (e) {}

    /* ---------- クリック開始 ---------- */
    var HIDDEN_LINES = (window.USAGI_SERIFU && window.USAGI_SERIFU.HIDDEN) || [
      'なに', 'いないよ', 'えきなら つきあたり みぎ まっすぐです', 'h', 'みーんみんみん',
      'きょりかん かんがえて', 'どちらさまですか', 'りょうみみの すきまに ゆび いれるの やめてもらっていいですか'
    ];
    hop.addEventListener('click', function () {
      if (state === 'runaway') return;
      try { clicks++; localStorage.setItem('usagi_clicks', String(clicks)); } catch (e) {}

      if (currentSpotName !== 'walker') {
        /* 2026-09-11 たけろう決定: 隠れている時の「場所専用の小さな袋(8〜10本)」をやめる。
           うさぎは75%の確率で隠れているので、クリックの75%が小さな袋から出ていた=同じセリフばかりに見えた正体。
           ポンと出てきたあとは、散歩中と同じ会話(豆知識36本・しりたい?・ごほうび・暦)にする */
        state = 'talk';
        lastClickCeil = /^ceiling/.test(currentSpotName || ''); /* 2026-09-13: 逆さまの時だけ「さかさまでも いきてる」が候補に入る */
        popOutHidden();
        renderNode(pickOpening(window.USAGI_SERIFU || {}));
        return;
      }

      pauseWalk();
      state = 'talk';
      /* 2026-09-13 たけろう指示: 「また きたの?」(日をまたいだ最初)は無し */
      renderNode(pickOpening(window.USAGI_SERIFU || {}));
    });

    function showHiddenLine(text) {
      if (!bubble) {
        back = document.createElement('div');
        back.id = 'usagiBubbleBack';
        back.onclick = function () { closeBubble(); startRunaway(); };
        document.body.appendChild(back);
        bubble = document.createElement('div');
        bubble.id = 'usagiBubble';
        document.body.appendChild(bubble);
        sndPop();
      }
      bubble.innerHTML = '<div class="ub-txt"></div><div class="ub-choices"></div><div class="ub-tail"></div>';
      bubble.querySelector('.ub-txt').textContent = text;
      var choicesEl = bubble.querySelector('.ub-choices');
      var b = document.createElement('button');
      b.className = 'ub-btn pink';
      b.textContent = '…';
      b.onclick = function () { closeBubble(); startRunaway(); };
      choicesEl.appendChild(b);
      positionBubble();
    }

    initOk = true;
  } catch (err) {
    try { console.error('usagi_walk failed', err); } catch (e) {}
    try {
      var p1 = document.getElementById('peek1');
      if (p1) p1.style.display = '';
      var wrapEl = document.getElementById('usagiWalkWrap');
      if (wrapEl && !initOk) wrapEl.remove();
    } catch (e2) {}
  }
})();
