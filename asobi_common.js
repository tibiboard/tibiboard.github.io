/* ===================================================================
   あそびば共通基盤 asobi_common.js
   コイン経済・日次制限・図鑑コレクション・優先権チャレンジを一元管理
   localStorageキー:
     chibi_coins     … コイン残高(数値)
     chibi_daily     … {date:'YYYY-MM-DD', usagi:0, run:0, perfect:0, chal:0}  日次カウンタ
                        usagi=うさぎ探し成功, run=はしれ!ばつべー成功, perfect=両方ボーナス付与済み
     chibi_zukan     … 図鑑で当てた子のID配列(JSON)
     chibi_atari     … 当選情報 {code:'XXXXXXXX', date:'YYYY-MM-DD'}
   =================================================================== */
(function(){
  const C = window.CHIBI = {};

  /* ---- うさぎ69種(透過フォルダの実ファイルに一致) ---- */
  C.DIR = 'img/usagi/';   // ページ位置により C.DIR を上書き可
  C.SERIES = {
    cute:  [1,2,3,4,6,7,8,10,11,13,14,15,16,17,18,19,20,21,23].map(n=>'cute_'+String(n).padStart(2,'0')),
    edgy:  [2,3,4,5,6,7,10,11,12,13,14,15,16,17,18,19,20,21,22].map(n=>'edgy_'+String(n).padStart(2,'0')),
    street:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20,21,22,23].map(n=>'street_'+String(n).padStart(2,'0'))
  };
  /* ずかんの並び=装飾グループ順(2026-08-14たけろう指示。正本=うさぎ\★うさぎ分類メモ)
     帽子→メガネ→頭かざり→ヘッドホン→首もと→小物→素 */
  C.ALL = [
    'edgy_04','street_01','street_06','street_15','street_17','street_23',
    'cute_11','edgy_03','edgy_13','edgy_19','street_02','street_07','street_18',
    'cute_01','cute_02','cute_04','cute_07','cute_10','cute_13','cute_15','cute_16','cute_21','cute_23','street_05','street_08',
    'edgy_09c','street_09',
    'cute_03','cute_20','edgy_02','edgy_05','edgy_07','edgy_12','edgy_16','edgy_17','street_03','street_04','street_10','street_11','street_14','street_16','street_22',
    'cute_14','cute_17','edgy_14','edgy_20','cute_06',
    'cute_08','cute_18','cute_19','edgy_06','edgy_10','edgy_11','edgy_15','edgy_18','edgy_22','street_13','street_21'
  ];
  C.seriesOf = id => id.split('_')[0];
  /* ばつべーは世界に1匹だけ(キティ方式)。集めているのは「コーデ(着こなし)」なので個体名は使わない(2026-08-14たけろう) */
  C.seriesJa = {cute:'キュートコーデ', edgy:'エッジコーデ', street:'ストリートコーデ'};

  /* ---- デバッグ: ?debug=1 で優先権当選確率100% ---- */
  C.DEBUG = /[?&]debug=1/.test(location.search);

  /* ---- デバッグ: ?debugwin=1 で大当たり(宝箱)確定。localhostのみ有効(2026-08-14新設) ---- */
  C.DEBUG_WIN = ['localhost','127.0.0.1'].includes(location.hostname) && /[?&]debugwin=1/.test(location.search);

  /* ---- デバッグ2(2026-08-12): 表示確認用。本番の人はURLを知らないので影響なし
       ?debugcoin=25 … コインを25枚にセット
       ?debugkey=1   … 鍵あり状態にする(当選コード発行済みと同じ)
       ?debugkey=0   … 鍵なし状態に戻す
       ?debugreset=1 … コイン・日次・鍵・図鑑を全部消して初見さん状態に ---- */
  (function(){
    const q = location.search;
    if(!['localhost','127.0.0.1'].includes(location.hostname)) return; // デバッグ機能は公開サイトでは無効(2026-08-13)
    const mCoin = q.match(/[?&]debugcoin=(\d+)/);
    if(mCoin) localStorage.setItem('chibi_coins', String(Math.max(0,parseInt(mCoin[1],10))));
    const mKey = q.match(/[?&]debugkey=([01])/);
    if(mKey){
      if(mKey[1]==='1'){
        if(!localStorage.getItem('chibi_atari')){
          const d=new Date(), t=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
          localStorage.setItem('chibi_atari', JSON.stringify({code:'DEBUGKEY', date:t}));
        }
      } else localStorage.removeItem('chibi_atari');
    }
    if(/[?&]debugreset=1/.test(q)){
      ['chibi_coins','chibi_daily','chibi_zukan','chibi_atari'].forEach(k=>localStorage.removeItem(k));
    }
    if(mCoin||mKey||/debugreset/.test(q)) C.DEBUG_TOOLS = true;
  })();

  /* ---- 開発パネル(2026-08-16): ?dev=1 で画面右下に小さな操作板。localhostのみ・本番では何も出ない。
       上のdebug○○のURLを覚えなくていいようにボタン化しただけ(中身は同じ) ---- */
  (function(){
    if(!['localhost','127.0.0.1'].includes(location.hostname)) return;
    if(!/[?&]dev=1/.test(location.search)) return;
    const go = extra => { const u=new URL(location.href); u.searchParams.set('dev','1');
      ['debugcoin','debugkey','debugreset','debugwin'].forEach(k=>u.searchParams.delete(k));
      Object.entries(extra).forEach(([k,v])=>u.searchParams.set(k,v)); location.href=u.toString(); };
    const btn=(t,f)=>{const b=document.createElement('button'); b.textContent=t; b.onclick=f;
      b.style.cssText='font:700 12px sans-serif;padding:4px 8px;border:0;border-radius:6px;background:#fff;color:#222;cursor:pointer'; return b;};
    const mk=()=>{
      const p=document.createElement('div');
      p.style.cssText='position:fixed;right:8px;bottom:8px;z-index:99999;background:#222c;color:#fff;padding:8px;border-radius:10px;display:flex;flex-wrap:wrap;gap:6px;max-width:260px;font:700 12px sans-serif;align-items:center';
      const st=document.createElement('span'); st.style.cssText='width:100%';
      const zukan=(()=>{try{return JSON.parse(localStorage.getItem('chibi_zukan')||'[]').length}catch(e){return 0}})();
      st.textContent='🛠dev  🪙'+(localStorage.getItem('chibi_coins')||0)+'  🔑'+(localStorage.getItem('chibi_atari')?'あり':'なし')+'  📖'+zukan+'匹';
      p.appendChild(st);
      p.appendChild(btn('🪙+10',()=>go({debugcoin:String((parseInt(localStorage.getItem('chibi_coins')||'0',10)||0)+10)})));
      p.appendChild(btn('🪙0',()=>go({debugcoin:'0'})));
      p.appendChild(btn('🔑あり',()=>go({debugkey:'1'})));
      p.appendChild(btn('🔑なし',()=>go({debugkey:'0'})));
      p.appendChild(btn('🎁大当たり',()=>go({debugwin:'1'})));
      p.appendChild(btn('🧹初見さんに戻す',()=>{ if(confirm('コイン・日次・鍵・図鑑を全部消す?')) go({debugreset:'1'}); }));
      p.appendChild(btn('✕',()=>p.remove()));
      document.body.appendChild(p);
    };
    if(document.body) mk(); else document.addEventListener('DOMContentLoaded',mk);
  })();

  /* ---- 今日の日付 ---- */
  C.today = () => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };

  /* ---- コイン ---- */
  C.getCoins = () => parseInt(localStorage.getItem('chibi_coins')||'0',10)||0;
  C.setCoins = n => localStorage.setItem('chibi_coins', String(Math.max(0,n)));
  C.addCoins = n => { C.setCoins(C.getCoins()+n); return C.getCoins(); };
  C.spendCoin = () => { if(C.getCoins()<1) return false; C.setCoins(C.getCoins()-1); return true; };

  /* ---- 日次カウンタ(日付が変わったら自動リセット) ---- */
  C.daily = () => {
    let d = {};
    try{ d = JSON.parse(localStorage.getItem('chibi_daily')||'{}'); }catch(e){}
    if(d.date !== C.today()) d = {date:C.today(), usagi:0, run:0, perfect:0, chal:0};
    return d;
  };
  C.saveDaily = d => localStorage.setItem('chibi_daily', JSON.stringify(d));

  /* ---- ミニゲーム日次記録(game = 'usagi' | 'run') ---- */
  C.gameDone = g => !!C.daily()[g];
  C.markGameDone = g => { const d=C.daily(); d[g]=1; C.saveDaily(d); };
  /* 両ゲーム成功でパーフェクトボーナス+1(1日1回だけ)。付与したら true を返す */
  C.tryPerfect = () => {
    const d=C.daily();
    if(d.usagi && d.run && !d.perfect){ d.perfect=1; C.saveDaily(d); C.addCoins(1); return true; }
    return false;
  };

  /* 鍵チャレンジ(旧・優先権チャレンジ)の1日3回枠は撤廃(2026-08-14たけろう指示)。
     「コインがある限り何回でも回せる。当たりにくさは1/100の確率だけで制御する」が方針。
     chalLeft/useChal/CHAL_MAXは古いページ(あそびば.html等)からまだ参照されるため
     関数自体は残すが、常に無制限を返す/何もしないダミーにする。 */
  C.CHAL_MAX  = Infinity;
  C.chalLeft  = () => Infinity;
  C.useChal   = () => {};

  /* ---- 宝箱は週1回まで(2026-08-14たけろう決定): 獲得したら7日間は大当たり抽選そのものをスキップ(ハズレ扱い)。
     ゲームを遊ぶこと自体・コイン獲得は無制限。ガチャ・スロット共通でここに1本化する。 ---- */
  C.TREASURE_COOLDOWN_MS = 7*24*60*60*1000;
  C.canDrawTreasure = () => {
    const t = localStorage.getItem('chibi_treasure_last');
    if(!t) return true;
    const last = new Date(t).getTime();
    return isNaN(last) ? true : (Date.now() - last) >= C.TREASURE_COOLDOWN_MS;
  };
  C.markTreasureWin = () => localStorage.setItem('chibi_treasure_last', new Date().toISOString());

  /* ---- 大当たり(→宝箱3択へ)の抽選: 1/100(2026-08-14たけろう指示。ガチャ・スロット共通)
     ?debug=1 / ?debugwin=1(localhostのみ) で必ず当たり(週1回制限もバイパス、確認用)
     通常時は週1回の枠を使い切っていたら、確率に関わらずハズレ扱い ---- */
  C.P_WIN = 1/100;
  C.drawPriority = () => {
    if(C.DEBUG || C.DEBUG_WIN) return true;
    if(!C.canDrawTreasure()) return false;
    const win = Math.random() < C.P_WIN;
    if(win) C.markTreasureWin();
    return win;
  };

  /* ---- 宝箱の中身抽選(2026-08-14新設、確率は同日たけろう改定): 95%=うさぎ(かぶりあり)/5%=かくしコマンド ----
     戻り値: {type:'usagi', id, isNew} または {type:'secret'} */
  C.TREASURE_SECRET_P = 0.05;
  /* 2026-08-15たけろう指示: かくしコマンドはアプリ側の機能が未実装のため、排出そのものを停止する(当面100%うさぎ)。
     9月のアプリ公開でアプリ側が実装できたら、このフラグを true に戻すだけで復活する(確率は上のTREASURE_SECRET_Pのまま5%・値は変更していない)。 */
  C.HIDDEN_CMD_ENABLED = false;
  C.openTreasure = () => {
    if(C.HIDDEN_CMD_ENABLED && Math.random() < C.TREASURE_SECRET_P) return {type:'secret'};
    const id = C.drawCard();          // C.ALLから一様ランダム・かぶりあり
    const isNew = C.addZukan(id);     // 新規ならずかんに追加、かぶりなら変化なし
    return {type:'usagi', id, isNew};
  };

  /* ---- 図鑑コレクション ---- */
  C.getZukan = () => {
    try{ const a=JSON.parse(localStorage.getItem('chibi_zukan')||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; }
  };
  C.addZukan = id => {
    const a = C.getZukan();
    const isNew = !a.includes(id);
    if(isNew){ a.push(id); localStorage.setItem('chibi_zukan', JSON.stringify(a)); }
    return isNew;
  };
  C.zukanComplete = () => C.getZukan().length >= C.ALL.length;

  /* ランダムに1枚引く(ダブりあり) */
  C.drawCard = () => C.ALL[Math.floor(Math.random()*C.ALL.length)];

  /* ---- 当選コード(英数8桁) ---- */
  C.makeCode = () => {
    const CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 紛らわしい I,O,0,1 抜き
    let s=''; const r = new Uint32Array(8);
    (window.crypto||{getRandomValues:a=>{for(let i=0;i<a.length;i++)a[i]=Math.floor(Math.random()*4294967296);}}).getRandomValues(r);
    for(let i=0;i<8;i++) s += CH[r[i]%CH.length];
    return s;
  };
  C.setAtari = () => {
    const code = C.makeCode();
    localStorage.setItem('chibi_atari', JSON.stringify({code, date:C.today()}));
    return code;
  };
  C.getAtari = () => { try{ return JSON.parse(localStorage.getItem('chibi_atari')||'null'); }catch(e){ return null; } };

  /* ---- 共通ヘッダーバー(コイン表示)を差し込むヘルパー
     ⚠2026-08-14: 回数上限は撤廃したので「のこり◯回」表示は出さない ---- */
  C.statusHtml = () =>
    `🪙 <b>${C.getCoins()}</b> コイン` + (C.DEBUG?' <span style="color:#e0197a">[DEBUG]</span>':'');

  /* ---- うさぎの名前(シリーズ名+No.) ---- */
  C.nameOf = id => { const [s,n]=(id||'').split('_'); return (s && C.seriesJa[s]) ? (C.seriesJa[s]+' No.'+n) : 'ばつべー'; };

  /* ===================================================================
     🎁 宝箱3択ピッカー(2026-08-14新設)
     大当たり演出の最後に呼ぶ。丸くて太いたからばこを3つ出し、1つ選ばせて
     C.openTreasure() の結果(うさぎ or かくしコマンド)を大きく見せる。
     ガチャ・スロット共通で使う(呼び出し側でconfetti等の追加演出をしてよい)。
     opts.onPick(i)  … 箱を選んだ瞬間に呼ばれる(開封音などを鳴らすフック)
     opts.onReveal(result) … 中身が確定した瞬間に呼ばれる(勝利音などのフック)
     opts.onClose()  … 閉じるボタンを押した時に呼ばれる
     =================================================================== */
  function ensureTreasureCss(){
    if(document.getElementById('chibiTreasureCss')) return;
    const st = document.createElement('style'); st.id='chibiTreasureCss';
    st.textContent = `
      #chibiTreasureOv{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;text-align:center;overflow-y:auto;
        background:
          radial-gradient(circle at 50% 36%, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 42%),
          radial-gradient(circle at 50% 42%, #e0197a 0%, #b81163 55%, #6e0d3d 100%)}
      #chibiTreasureOv::before{content:"";position:absolute;inset:0;pointer-events:none;
        background-image:radial-gradient(rgba(255,255,255,.16) 2.5px, transparent 3px);
        background-size:36px 36px}
      #chibiTreasureOv .wrap{position:relative;z-index:1;margin:auto 0;width:100%;max-width:820px;display:flex;flex-direction:column;align-items:center}
      #chibiTreasureOv .ttl{font-family:"Hiragino Maru Gothic ProN",Meiryo,sans-serif;font-size:clamp(28px,6vw,38px);font-weight:900;color:#ffd54f;letter-spacing:3px;margin-bottom:10px;text-shadow:0 3px 0 #7a0d42}
      #chibiTreasureOv .ttlsub{font-family:"Hiragino Maru Gothic ProN",Meiryo,sans-serif;font-size:clamp(12px,2.8vw,15px);font-weight:700;color:#fff0f6;opacity:.85;margin-bottom:26px}
      #chibiTreasureOv .row{display:flex;gap:36px;flex-wrap:wrap;justify-content:center;width:100%}

      /* ---- チョコ色の宝箱(マリオ系): 胴・フタ=こげ茶木目+金バンド2本+ハート金錠前。ピンク背景の上でくっきり浮くように ---- */
      .cc-wrap{position:relative;flex:0 0 214px;width:214px;height:250px}
      .chibiChest{width:214px;height:214px;position:absolute;left:0;top:26px;cursor:pointer;user-select:none;
        perspective:700px;animation:chibiChestJiggle 2.6s ease-in-out infinite;transition:transform .18s;z-index:2}
      .cc-wrap:nth-child(2) .chibiChest{animation-delay:.5s}
      .cc-wrap:nth-child(3) .chibiChest{animation-delay:1s}
      .chibiChest:hover{animation-play-state:paused;transform:scale(1.07) translateY(-6px)}
      .chibiChest:active{transform:scale(.95)}
      .cc-wrap.dim{animation:chibiSink .4s forwards}
      .cc-wrap.dim .chibiChest{pointer-events:none;animation:none;filter:grayscale(.5);opacity:.55}
      @keyframes chibiSink{to{transform:translateY(18px) scale(.82);opacity:.4}}
      @keyframes chibiChestJiggle{0%,88%,100%{transform:rotate(0)}90%{transform:rotate(-4deg)}93%{transform:rotate(3.5deg)}96%{transform:rotate(-2.5deg)}98%{transform:rotate(1.5deg)}}
      .cc-glow{position:absolute;left:6%;right:6%;top:2%;height:48%;border-radius:50%;
        background:radial-gradient(circle,#fffdf0 0%,rgba(255,213,79,.95) 45%,rgba(255,213,79,0) 72%);
        opacity:0;transition:opacity .25s;filter:blur(1px);z-index:1;pointer-events:none}
      .chibiChest.picked .cc-glow{opacity:1}
      .cc-base{position:absolute;left:4%;right:4%;bottom:4%;height:58%;z-index:2;
        background:linear-gradient(180deg,#8a5a35,#6b4022 55%,#4a2c15);
        border-radius:0 0 30px 30px;border:7px solid #3a2210;border-top:none;
        box-shadow:0 10px 0 rgba(0,0,0,.4), inset 0 -10px 16px rgba(0,0,0,.35), inset 0 6px 10px rgba(255,255,255,.12)}
      .cc-base::before{content:"";position:absolute;left:0;right:0;top:12%;height:16%;
        background:linear-gradient(180deg,#ffe9a3,#ffd54f 55%,#c99a1e);box-shadow:inset 0 2px 4px rgba(255,255,255,.85),0 2px 0 rgba(0,0,0,.25)}
      .cc-base::after{content:"";position:absolute;left:0;right:0;bottom:14%;height:16%;
        background:linear-gradient(180deg,#ffe9a3,#ffd54f 55%,#c99a1e);box-shadow:inset 0 2px 4px rgba(255,255,255,.85),0 2px 0 rgba(0,0,0,.25)}
      .cc-lock{position:absolute;left:50%;top:32%;width:42px;height:38px;margin-left:-21px;z-index:4;
        transform:rotate(45deg);background:linear-gradient(135deg,#fff3c4,#ffd54f 50%,#c99a1e);
        border:3px solid #8a6a10;box-shadow:0 4px 0 rgba(0,0,0,.4)}
      .cc-lock::before,.cc-lock::after{content:"";position:absolute;width:42px;height:42px;border-radius:50%;
        background:linear-gradient(135deg,#fff3c4,#ffd54f 50%,#c99a1e);border:3px solid #8a6a10}
      .cc-lock::before{top:-21px;left:0;border-bottom:none}
      .cc-lock::after{top:0;left:21px;border-left:none}
      .cc-lid{position:absolute;left:2%;right:2%;top:0;height:44%;z-index:3;
        background:linear-gradient(180deg,#a5703f,#7a4d28 65%,#5a3a1c);
        border-radius:50% 50% 16px 16px/85% 85% 16px 16px;border:7px solid #3a2210;
        transform-origin:50% 100%;transform-style:preserve-3d;transition:transform .5s cubic-bezier(.4,0,.3,1);
        box-shadow:0 4px 0 rgba(0,0,0,.3), inset 0 6px 10px rgba(255,255,255,.18)}
      .cc-lid::after{content:"";position:absolute;left:0;right:0;bottom:10%;height:24%;
        background:linear-gradient(180deg,#ffe9a3,#ffd54f 55%,#c99a1e);box-shadow:inset 0 2px 4px rgba(255,255,255,.85)}
      .chibiChest.picked .cc-lid{transform:rotateX(-118deg) translateY(-4px)}

      /* ---- フタの上から顔半分だけ のぞくばつべー(既存PNG)。1箱1匹・重ならない配置 ---- */
      .cc-peek{position:absolute;top:0;width:88px;z-index:1;pointer-events:none;left:50%;
        filter:drop-shadow(0 4px 4px rgba(0,0,0,.35));animation:chibiPeekHop 1.7s ease-in-out infinite;
        clip-path:inset(0 0 42% 0)}
      .cc-peek.o0{margin-left:-78px}
      .cc-peek.o1{margin-left:-44px}
      .cc-peek.o2{margin-left:-10px}
      @keyframes chibiPeekHop{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

      #chibiTreasureOv .result{display:none;margin-top:26px;animation:chibiPopIn .5s cubic-bezier(.2,1.5,.4,1)}
      #chibiTreasureOv .result.show{display:block}
      @keyframes chibiPopIn{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}
      /* うさぎ(黒い線画)は暗い背景に溶けるので、白い角丸カードに乗せて見せる */
      #chibiTreasureOv .result .card{display:inline-block;background:#fff;border-radius:24px;padding:26px 34px;box-shadow:0 14px 0 rgba(0,0,0,.35), 0 0 40px rgba(255,255,255,.25)}
      #chibiTreasureOv .result .card img{width:min(70vw,260px);display:block;margin:0 auto;filter:drop-shadow(0 8px 0 rgba(0,0,0,.15))}
      #chibiTreasureOv .result .icon64{font-size:64px}
      #chibiTreasureOv .result .name{font-family:"Hiragino Maru Gothic ProN",Meiryo,sans-serif;font-size:clamp(22px,5vw,30px);font-weight:900;color:#fff;letter-spacing:2px;margin-top:14px}
      #chibiTreasureOv .result .sub{font-family:"Hiragino Maru Gothic ProN",Meiryo,sans-serif;font-size:clamp(15px,3.6vw,19px);font-weight:800;color:#fff0f6;margin-top:10px;line-height:1.9}
      #chibiTreasureOv .result .go{display:inline-block;margin-top:20px;background:#e84898;color:#fff;font-weight:900;font-size:24px;border-radius:999px;padding:13px 30px;cursor:pointer;border:0;border-bottom:6px solid #b81163;font-family:"Hiragino Maru Gothic ProN",Meiryo,sans-serif}
      .chibiTconf{position:fixed;width:10px;height:14px;top:-20px;z-index:310;animation:chibiTconf 2.6s linear forwards;pointer-events:none}
      @keyframes chibiTconf{to{transform:translateY(105vh) rotate(720deg)}}
    `;
    document.head.appendChild(st);
  }
  /* フタの上からのぞかせる小さいばつべー(既存img/usagi/のPNGを流用)。3箱中2箱だけ・1箱1匹(重なり防止) */
  const CC_PEEKS = ['cute_01','cute_04','cute_20'];
  function chestHtml(i){
    const dir = C.DIR || 'img/usagi/';
    const showPeek = i !== 1; // 中央の箱には置かない=2匹だけになる
    const peek = showPeek ? `<img class="cc-peek o${i}" src="${dir}${CC_PEEKS[i%CC_PEEKS.length]}.png" alt="">` : '';
    return `<div class="cc-wrap" data-i="${i}">
        ${peek}
        <div class="chibiChest" data-i="${i}">
          <div class="cc-glow"></div>
          <div class="cc-base"></div>
          <div class="cc-lock"></div>
          <div class="cc-lid"></div>
        </div>
      </div>`;
  }
  /* ---- じまんカード画像の自動生成(2026-08-14新設): 1080×1080のPNGをcanvasで作る ----
     opts: {imgSrc}(うさぎの時) または {icon}(かくしコマンドの時) + caption(複数行可・\nで改行) */
  function roundRectPath(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }
  function chibiMakeCardBlob(opt){
    return new Promise((resolve)=>{
      const cv = document.createElement('canvas'); cv.width=1080; cv.height=1080;
      const ctx = cv.getContext('2d');
      const FONT = '"Hiragino Maru Gothic ProN","Yu Gothic",Meiryo,sans-serif';
      // 背景: ピンクのグラデ
      const bg = ctx.createRadialGradient(540,420,80,540,540,780);
      bg.addColorStop(0,'#ff6fae'); bg.addColorStop(1,'#b81163');
      ctx.fillStyle=bg; ctx.fillRect(0,0,1080,1080);
      // 白い角丸カード+ピンクの縁(下にキャプション3行ぶんの余白を残す)
      const cx=60, cy=120, cw=1080-120, ch=660;
      roundRectPath(ctx,cx,cy,cw,ch,48);
      ctx.fillStyle='#fff'; ctx.fill();
      ctx.lineWidth=16; ctx.strokeStyle='#e0197a'; ctx.stroke();
      function finish(){
        // 本文キャプション(カードの下の余白に3行まで)
        ctx.fillStyle='#fff';
        ctx.font='900 54px '+FONT;
        ctx.textAlign='center';
        const lines = String(opt.caption||'').split('\n');
        let ly = cy+ch+78;
        lines.forEach(line=>{ ctx.fillText(line, 540, ly); ly += 62; });
        // 隅のロゴ
        ctx.fillStyle='#e0197a';
        ctx.font='900 34px '+FONT;
        ctx.textAlign='right';
        ctx.fillText('🐰 ちびボード', cx+cw-34, cy+ch-34);
        cv.toBlob(b=>resolve(b), 'image/png');
      }
      if(opt.imgSrc){
        const img = new Image();
        img.onload = () => {
          const maxW=cw-140, maxH=ch-200;
          let w=img.naturalWidth||img.width, h=img.naturalHeight||img.height;
          const scale = Math.min(maxW/w, maxH/h);
          w*=scale; h*=scale;
          ctx.drawImage(img, 540-w/2, cy+70, w, h);
          finish();
        };
        img.onerror = finish; // 画像が読めなくても文字カードだけは出す
        img.src = opt.imgSrc; // img/usagi/ は同一オリジンなのでcanvas汚染なし
      } else if(opt.icon){
        ctx.textAlign='center';
        ctx.font='260px sans-serif';
        ctx.fillText(opt.icon, 540, cy+ch*0.56);
        finish();
      } else finish();
    });
  }
  /* 「じまんする」+「画像をほぞんする」の配線。
     navigator.canShare({files})に対応していれば画像付きで共有、非対応ならXインテント(文字のみ)+保存ボタン */
  function chibiWireShare(box, shareText, blobPromise){
    const tweetBtn = box.querySelector('.tweet');
    if(!tweetBtn) return;
    let blob = null, fileShareOk = false;
    blobPromise.then(b=>{
      blob = b;
      try{
        const f = new File([b], 'chibiboard_card.png', {type:'image/png'});
        fileShareOk = !!(navigator.canShare && navigator.canShare({files:[f]}));
      }catch(e){ fileShareOk = false; }
      if(!fileShareOk){
        const a = document.createElement('a');
        a.className = 'go save';
        a.textContent = '📥 画像を ほぞんする';
        a.style.cssText = 'background:#3ec9c2;border-bottom-color:#1f8f8a;border-radius:999px;display:inline-block;text-decoration:none';
        a.href = URL.createObjectURL(b);
        a.download = 'chibiboard_card.png';
        tweetBtn.insertAdjacentElement('afterend', a);
      }
    });
    tweetBtn.onclick = async () => {
      if(blob && fileShareOk){
        try{
          const f = new File([blob], 'chibiboard_card.png', {type:'image/png'});
          await navigator.share({text:shareText, files:[f]});
          return;
        }catch(e){ /* キャンセル等はフォールバックしない */ if(e && e.name==='AbortError') return; }
      }
      if(navigator.share){
        try{ await navigator.share({text:shareText}); return; }catch(e){}
      }
      window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(shareText), '_blank', 'noopener');
    };
  }
  function chibiConfetti(){
    const cols=['#e84898','#3ec9c2','#ffd54f'];
    for(let i=0;i<50;i++){ const c=document.createElement('div'); c.className='chibiTconf';
      c.style.left=Math.random()*100+'vw'; c.style.background=cols[i%3]; c.style.animationDelay=(Math.random()*0.6)+'s';
      document.body.appendChild(c); setTimeout(()=>c.remove(),3400); }
  }
  C.showTreasurePicker = (opts) => {
    opts = opts || {};
    ensureTreasureCss();
    const ov = document.createElement('div'); ov.id='chibiTreasureOv';
    ov.innerHTML = `<div class="wrap">
      <div class="ttl">🎉 たからばこを 1つ えらんでね!</div>
      <div class="ttlsub">📱 ちびボードアプリの「かくしコマンド」は、9月のアプリ公開で じっそう予定だよ🐰</div>
      <div class="row">${chestHtml(0)}${chestHtml(1)}${chestHtml(2)}</div>
      <div class="result" id="chibiTreasureResult"></div>
      </div>`;
    document.body.appendChild(ov);
    const chests = [...ov.querySelectorAll('.chibiChest')];
    let picked=false;
    chests.forEach(ch=>{
      ch.onclick = () => {
        if(picked) return; picked=true;
        const i = Number(ch.dataset.i);
        chests.forEach(o=>{ if(o!==ch) o.closest('.cc-wrap').classList.add('dim'); });
        ch.classList.add('picked');
        if(opts.onPick) opts.onPick(i);
        setTimeout(()=>{
          const result = C.openTreasure();
          const box = ov.querySelector('#chibiTreasureResult');
          let blobPromise, shareText;
          if(result.type==='secret'){
            shareText = 'たからばこから ちびボードアプリの隠しコマンドが でたよ🐰 #ちびボード';
            box.innerHTML = `<div class="icon64">📱</div>
              <div class="name">📱 ちびボードアプリの隠しコマンド ゲット!</div>
              <div class="sub">① この画面を スクショ<br>② X(@tibiboard)の「かくしコマンドうけつけ」の 固定ポストに リプライで おくってね<br>③ お店が きづきしだい、こちらから DMで コマンドを おくるね(1〜2日いない)<br>④ Xを もっていない人は <b>tibiboard100@gmail.com</b> へ おくってもOK</div>
              <button class="go tweet" style="background:#e0197a;border-bottom-color:#a3105a;border-radius:999px">じまんする</button>
              <button class="go">とじる ▶</button>`;
            blobPromise = chibiMakeCardBlob({icon:'📱', caption:'隠しコマンドを\nみつけた!'});
          } else {
            const isNew = result.isNew;
            const name = C.nameOf(result.id);   // 例: 「キュートコーデ No.19」
            shareText = `たからばこから ばつべーの〈${name}〉が でたよ🐰\n#ちびボード`;
            box.innerHTML = `<div class="card"><img src="${C.DIR}${result.id}.png"></div>
              <div class="name">ばつべーの<br>〈${name}〉を<br>みつけた!</div>
              <div class="sub">${isNew ? '✨NEW! ずかんに はいったよ' : 'この コーデは もう もってた! ざんねん!'}</div>
              <button class="go tweet" style="background:#e0197a;border-bottom-color:#a3105a;border-radius:999px">じまんする</button>
              <button class="go">とじる ▶</button>`;
            blobPromise = chibiMakeCardBlob({imgSrc:`${C.DIR}${result.id}.png`, caption:`ばつべーの\n〈${name}〉を\nみつけた!`});
          }
          chibiWireShare(box, shareText, blobPromise);
          box.classList.add('show');
          if(opts.onReveal) opts.onReveal(result);
          if(result.type!=='secret' && result.isNew) chibiConfetti();
          box.querySelector('.go:not(.tweet):not(.save)').onclick = () => {
            ov.remove();
            if(opts.onClose) opts.onClose(result);
          };
        }, 550);
      };
    });
  };
})();
