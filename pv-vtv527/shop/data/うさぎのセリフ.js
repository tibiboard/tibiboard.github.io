/* うさぎのセリフ(会話データ)。正本の言葉は うさぎのセリフ_メモ.md(たけろうが書く)。ここは機械で写した物(2026-09-02 全面更新)。
   node: {text, choices:[{label,next}]} / {text,end:true,runaway:true} / coins:±n を付けるとその時にコインが増減する
   TRIVIAは配列。'ぷろんぷと|へんじ' の1行 か、choices付きノード。
     time:'morning'|'noon'|'night'|'late' を付けると その時間帯だけ出る(朝5-11 / 昼11-17 / 夕17-19=無印だけ / 夜19-24 / 深夜0-5)
     mobile:true を付けると スマホで見ている時だけ出る
   HIDDENは配列(文字列のみ)。隠れているうさぎを見つけてクリックした時のセリフ。HIDDEN_EARS=耳だけの時 / HIDDEN_CEIL=天井の時
   「しりたい?」の枝(start)はエンジン側が回数を数えて作る: 1回目「しりたい?」2回目「ほんとに?」3回目「ほんとに ほんとに?」
     [おしえて]→ yes1「おしえない」。3回目の[おしえて]→ secret。[いい]→ 何も言わず逃げる
*/
window.USAGI_SERIFU = {
  again: { text: 'また きたの?', choices: [ { label: 'つぎへ', next: 'start' } ] },

  yes1: { text: 'おしえない', end: true, runaway: true },
  secret: { text: 'しかたない。おしえてやるか…', choices: [ { label: '…', next: 'secret2' } ] },
  secret2: { text: '(ここは まだ ひみつ)', choices: [ { label: 'とじる', next: 'bye' } ] },
  bye: { text: 'じゃあね', end: true, runaway: true },

  trivia: { random: 'TRIVIA' },

  /* ===== コイン(話しかけた回数: 5回目2枚・10回目3枚・以降10の倍数で3枚・100回目15枚) ===== */
  COIN_GIVE: [ '君暇なの？はいこれ', 'しつこいね、はいこれ' ],

  /* ===== コインが99枚の時 ===== */
  coin99: { text: 'おいおっさんいいから飛んでみろよ', choices: [
    { label: 'チャリンチャリン', next: 'coin99_a' },
    { label: 'やだ', next: 'coin99_b' }
  ]},
  coin99_a: { text: '毎度あり', coins: -5, end: true, runaway: true },
  coin99_b: { text: '北斗百烈拳！', coins: -5, end: true, runaway: true },

  /* ===== 鍵を持っている時 ===== */
  key: { text: '君…もってるね', choices: [
    { label: 'うん', next: 'key_a' },
    { label: '何に使う？', next: 'key_a' }
  ]},
  key_a: { text: '宝箱開けに行こうぜ！', end: true, runaway: true },

  /* ===== ガチャ/スロットで外れた直後(5分の1) ===== */
  miss: { text: 'また負けた? そういう日もあるさ', choices: [  /* 2026-09-13 たけろう修正(旧「落ち込むなって」8/20) */
    { label: 'ありがと', next: 'miss_a' },
    { label: 'ほっといて', next: 'miss_b' }
  ]},
  miss_a: { text: 'これあげる', coins: 5, end: true, runaway: true },
  miss_b: { text: 'ねーねー今どんな気持ち？頑張って集めたコイン一瞬で溶かして煽られてる今の気持ち、伝えられそ？僕に上手に伝えられそ？うまくまとめられそ？その感情上手く言葉にまとめられそ?', end: true, runaway: true },

  /* ===== 図鑑(エンジンが数を入れる): ZUKAN.mada='まだ {n}' / half / ato='あと {n}' / all ===== */
  ZUKAN: { mada: 'まだ {n}', half: '丁度半分だよ', ato: 'あと {n}', all: '図鑑コンプおめ' },

  /* ===== 暦のイベント(その日の最初のクリックだけ)。⚠文面は仮(たけろう確認待ち) ===== */
  EVENTS: {
    '01-01': 'あけおめ', '02-03': 'おには そと', '03-03': 'ひなまつり だね', '05-05': 'こどもの ひ だよ',
    '07-07': 'たなばた。ねがいごと は?', '08-13': 'おぼん だね', '10-31': 'はろうぃん', '12-25': 'めりくり', '12-31': 'ことしも おわるね'
  },

  /* ===== 隠れている うさぎを 見つけて クリックした時 ===== */
  HIDDEN: [
    'なに',
    'いないよ',
    'えきなら つきあたり みぎ まっすぐです',
    'H！',
    'みーんみんみん',
    'きょりかん かんがえて',
    'どちらさまですか',
    'りょうみみの すきまに ゆび いれるの やめてもらっていいですか'
  ],
  HIDDEN_EARS: [ 'みみ つかんだな' ],
  HIDDEN_CEIL: [ 'さかさまでも いきてる' ],

  /* ===== 歩いている うさぎを クリックした時(4回に3回はここからランダム) ===== */
  TRIVIA: [
    /* --- 問いかけ(2026-09-07 たけろう決定: 世間の目に合わせる自分に気づかせる。人は傷つけない。文の正本=うさぎのセリフ_メモ.md 9/7の枠) --- */
    { text: 'その服、だれに 見せたくて 買った?', choices: [ { label: 'じぶん', next: 'T_ME_FUKU_A' }, { label: 'みんな', next: 'T_ME_FUKU_B' } ] },
    { text: '5年まえに はやったもの、まだ つかってる?', choices: [ { label: 'つかってる', next: 'T_ME_RYUKO_A' }, { label: 'すてた', next: 'T_ME_RYUKO_B' } ] },
    { text: 'ともだちに「それ へん」って 言われたら?', choices: [ { label: 'やめる', next: 'T_ME_HEN_A' }, { label: 'きにしない', next: 'T_ME_HEN_B' } ] },
    { text: 'おしゃれって、だれが きめるの?', choices: [ { label: 'せけん', next: 'T_ME_OSHARE_A' }, { label: 'じぶん', next: 'T_ME_OSHARE_B' } ] },
    { text: 'ここの子は、ここでしか 買えない。1台ずつ 手で つくってる', end: true, runaway: true },
    /* 候補13本のうち たけろう採用=10番・12番(07:5x) */
    { text: 'にんきの色と すきな色、どっちを えらぶ?', choices: [ { label: 'にんき', next: 'T_ME_IRO_A' }, { label: 'すき', next: 'T_ME_IRO_B' } ] },
    { text: 'ぼくのこと、へんな うさぎだと おもう?', choices: [ { label: 'おもう', next: 'T_ME_USAGI_A' }, { label: 'かわいい', next: 'T_ME_USAGI_B' } ] },
    /* 7本目(逆説「買うかどうかは きみが きめて」)は たけろう「1〜6を入れて」で外した(9/7 07:3x) */
    /* --- 自己肯定(2026-09-07 たけろう: 15本のうち15番だけ採用。他14本は外した 07:5x) --- */
    { text: 'じぶんらしく、って むずかしく 言わなくて いい。すきな物を そばに おく。それだけ', end: true, runaway: true },
    /* --- 朝 --- */
    { time: 'morning', text: '朝だよ、静かに', end: true, runaway: true },
    { time: 'morning', text: 'ぐもーにん', end: true, runaway: true },
    { time: 'morning', text: '朝活か？', choices: [ { label: 'うん', next: 'T_ASAKATSU_A' }, { label: '何が？', next: 'T_ASAKATSU_B' } ] },
    /* --- 昼 --- */
    { time: 'noon', text: '昼だよ、', choices: [ { label: 'うん', next: 'T_HIRU_A' }, { label: '違うよ', next: 'T_HIRU_B' } ] },
    { time: 'noon', text: '騒がしいな', choices: [ { label: 'ね！', next: 'T_SAWAGA_A' }, { label: 'だね', next: 'T_SAWAGA_B' } ] },
    { time: 'noon', text: '昼飯くった？', choices: [ { label: 'うん', next: 'T_HIRUMESHI_A' }, { label: 'どっちだと思う？', next: 'T_HIRUMESHI_B' } ] },
    { time: 'noon', text: '昼寝中', choices: [ { label: 'ねえ', next: 'T_HAOU' }, { label: 'ねえねえ', next: 'T_JAOU' } ] },
    /* --- 夜 --- */
    { time: 'night', text: '夜は静かに！', choices: [ { label: 'はい！', next: 'T_SHII' }, { label: 'はい！！！', next: 'T_HAOU' } ] },
    { time: 'night', text: '夜空が綺麗だね', choices: [ { label: 'うん', next: 'T_YOZORA_A' }, { label: '別に', next: 'T_YOZORA_B' } ] },
    { time: 'night', text: 'アイス買ってきて', choices: [ { label: 'いいよ', next: 'T_ICE_A' }, { label: 'やだ', next: 'T_HAOU' } ] },
    /* --- 深夜 --- */
    { time: 'late', text: '深夜に騒ぐな！', choices: [ { label: 'ごめん', next: 'T_SHINYA_A' }, { label: '何が？', next: 'T_SHINYA_B' } ] },
    { time: 'late', text: '寝ないの？', choices: [ { label: 'うん', next: 'T_NENAI_A' }, { label: 'もう寝る', next: 'T_NENAI_B' } ] },
    { time: 'late', text: 'zzzzzzz', choices: [ { label: 'あのぉ', next: 'T_MAKANKO' }, { label: 'ツンツン', next: 'T_MURYOU' } ] },
    /* --- スマホの時だけ --- */
    { mobile: true, text: 'スマホでうまく表示できてる？', choices: [ { label: 'うん', next: 'T_SUMAHO_A' }, { label: '微妙', next: 'T_SUMAHO_B' } ] },
    /* --- いつでも --- */
    { text: 'ぼくのこと すき?', choices: [ { label: 'すき', next: 'T_SUKI_Q' }, { label: 'きらい', next: 'T_KIRAI' } ] },
    { text: '唐揚げって10回言って', choices: [ { label: '言った', next: 'T_KARAAGE_A' }, { label: 'やだ', next: 'T_KARAAGE_B' } ] },
    { text: 'らっしゃい！', choices: [ { label: 'コハダね', next: 'T_SUSHI_A' }, { label: 'サーモンね', next: 'T_SUSHI_B' } ] },
    { text: '恋、してる？', choices: [ { label: 'してる', next: 'T_KOI_A' }, { label: 'してない', next: 'T_KOI_B' } ] },
    { text: '生きるべきか死ぬべきか', choices: [ { label: 'それが問題だ', next: 'T_IKIRU_A' }, { label: 'いきろ！', next: 'T_IKIRU_B' } ] },
    { text: 'きみかわうぃーねー', choices: [ { label: '嬉しい！', next: 'T_KAWAII_A' }, { label: 'あんがと', next: 'T_KAWAII_B' } ] },
    { text: '肉派？魚派？', choices: [ { label: '魚', next: 'T_NIKU_A' }, { label: 'どっちだと思う？', next: 'T_NIKU_B' } ] },
    { text: 'りんごゴリララッパ', choices: [ { label: 'パンツ', next: 'T_RINGO_A' }, { label: 'パソコン', next: 'T_RINGO_B' } ] },
    { text: '踊ってない夜を？', choices: [ { label: '知らない', next: 'T_OREMO' }, { label: '知ってる', next: 'T_SOREIJO' } ] },
    { text: 'ぬるぽ', choices: [ { label: 'ガっ', next: 'T_NURUPO_A' }, { label: 'なに？', next: 'T_NURUPO_B' } ] },  /* 2026-09-13 たけろう */
    { text: 'とつぜんだけど じゃんけん', choices: [
      { label: 'ぐー', next: 'TR_JYANKEN_RANT' }, { label: 'ちょき', next: 'TR_JYANKEN_RANT' },
      { label: 'ぱー', next: 'TR_JYANKEN_RANT' }, { label: 'しない', next: 'TR_JYANKEN_NORI' } ] },
    { text: 'きゅうぎ とくい?', choices: [ { label: 'はい', next: 'TR_KYUGI_HAI' }, { label: 'いいえ', next: 'TR_KYUGI_IIE' } ] },
    { text: 'はなげ でてるよ', choices: [ { label: 'うん', next: 'TR_HANAGE_UN' }, { label: 'うそつき', next: 'TR_HANAGE_URUSO' } ] },
    { text: '四字熟語', choices: [ { label: '焼肉定食', next: 'TR_YOJI_A' }, { label: 'オーヤンフィフィ', next: 'TR_YOJI_B' } ] },
    { text: 'くるま くるま くるま!', choices: [ { label: 'とどろき!', next: 'TR_KURUMA_A' }, { label: 'とどろきーー☝️', next: 'TR_KURUMA_B' } ] },
    /* 2026-09-11 たけろう「突然ぱー、きみの頭がね はおかしい」: 正本メモに無い1行(じゃんけんの文脈が無いと意味が通らない)。外した */
  ],

  /* --- 返事 --- */
  /* 問いかけ(2026-09-07)の返事 */
  T_ME_FUKU_A: { text: 'なら、それが せいかい', end: true, runaway: true },
  T_ME_FUKU_B: { text: 'ぼくも まえは そうだった。みんなの目って、来年には かわってるけどね', end: true, runaway: true },
  T_ME_RYUKO_A: { text: 'じゃあ それは りゅうこうじゃなくて、きみの すき', end: true, runaway: true },
  T_ME_RYUKO_B: { text: 'りゅうこうは すてられる。すきは すてられない。どっちを 買う?', end: true, runaway: true },
  T_ME_HEN_A: { text: 'その ともだちの すきで、きみの へやが うまっていくよ', end: true, runaway: true },
  T_ME_HEN_B: { text: 'うん。へんって言われるのは、まだ だれも もってないってこと', end: true, runaway: true },
  T_ME_OSHARE_A: { text: 'せけんは まいとし きめなおす。ふりまわされるの、つかれない?', end: true, runaway: true },
  T_ME_OSHARE_B: { text: 'それを 言える人は、あんまり いない', end: true, runaway: true },
  T_ME_IRO_A: { text: 'にんきは 来年 べつの色に なる', end: true, runaway: true },
  T_ME_IRO_B: { text: 'すきな色は、10年 きみと いっしょ', end: true, runaway: true },
  T_ME_USAGI_A: { text: 'うん。だから おぼえてもらえる', end: true, runaway: true },
  T_ME_USAGI_B: { text: '(*\'\'▽\'\')', end: true, runaway: true },
  T_ASAKATSU_A: { text: '好きだね君も', end: true, runaway: true },
  T_ASAKATSU_B: { text: '何がって何が？', end: true, runaway: true },
  T_HIRU_A: { text: '退屈な人、でもそれでいい', end: true, runaway: true },
  T_HIRU_B: { text: '針一本目からどうぞ 1000／1000', end: true, runaway: true },
  T_SAWAGA_A: { text: 'そだねー', end: true, runaway: true },
  T_SAWAGA_B: { text: 'ダネフシッ！', end: true, runaway: true },
  T_HIRUMESHI_A: { text: 'おにぎり食べたい！', end: true, runaway: true },
  T_HIRUMESHI_B: { text: 'いいから焼きそばパン買ってこいよ', end: true, runaway: true },
  T_HAOU: { text: 'ペガサス流星拳', end: true, runaway: true },
  T_JAOU: { text: '邪王炎殺黒龍波！', end: true, runaway: true },
  T_SHII: { text: 'しー！', end: true, runaway: true },
  T_YOZORA_A: { text: 'ごめん君誰？', end: true, runaway: true },
  T_YOZORA_B: { text: '逆に可哀想だなって、逆に', end: true, runaway: true },
  T_ICE_A: { text: '後ケンちゃんラーメンも', end: true, runaway: true },
  T_SHINYA_A: { text: 'わかればいーのよ', end: true, runaway: true },
  T_SHINYA_B: { text: 'テメーはおれを怒らせた', end: true, runaway: true },
  T_NENAI_A: { text: 'ふーん', end: true, runaway: true },
  T_NENAI_B: { text: 'おやすみ', end: true, runaway: true },
  T_MAKANKO: { text: '魔貫光殺砲！', end: true, runaway: true },
  T_MURYOU: { text: '無量空処', end: true, runaway: true },
  T_SUMAHO_A: { text: 'コイン二枚あげよう', coins: 2, end: true, runaway: true },
  T_SUMAHO_B: { text: 'まじか、言っとくわ', end: true, runaway: true },
  T_SUKI_Q: { text: 'どこが すき?', choices: [ { label: 'ぜんぶ', next: 'T_SUKI_ZENBU' }, { label: 'みみ', next: 'T_SUKI_MIMI' } ] },
  T_SUKI_ZENBU: { text: 'ぼくも きみの でんぶが すき', end: true, runaway: true },
  T_SUKI_MIMI: { text: 'みみの あいだに ゆび いれるの やめてもらっていいですか', end: true, runaway: true },
  T_KIRAI: { text: 'わたしの じかん かえしてよ ＞＜', end: true, runaway: true },
  T_KARAAGE_A: { text: '唐揚げ⤴︎🎶', end: true, runaway: true },
  T_KARAAGE_B: { text: 'のりわる × 銃なら やってくれる?', end: true, runaway: true },
  T_SUSHI_A: { text: 'てやんでぃ！', end: true, runaway: true },
  T_SUSHI_B: { text: 'さぁ……もん？', end: true, runaway: true },
  T_KOI_A: { text: '恋の奴隷…か', end: true, runaway: true },
  T_KOI_B: { text: 'おれも', end: true, runaway: true },
  T_IKIRU_A: { text: 'どうして？', end: true, runaway: true },
  T_IKIRU_B: { text: '生きねば！', end: true, runaway: true },
  T_KAWAII_A: { text: '小野妹子そっくり', end: true, runaway: true },
  T_KAWAII_B: { text: '亀井静香そっくり', end: true, runaway: true },
  T_NIKU_A: { text: 'そんな顔だわ', end: true, runaway: true },
  T_NIKU_B: { text: '質問に質問で返すってちょっとコミュニケーションとしてどうなんでしょうか？あなたいい大人ですよね？そこまで興味ないですし、というかあなた自分を過大評価なさっているのでは？', end: true, runaway: true },
  T_RINGO_A: { text: 'H', end: true, runaway: true },
  T_RINGO_B: { text: 'ンジャメナ', end: true, runaway: true },
  T_SOREIJO: { text: 'それ以上はいけない！', end: true, runaway: true },
  T_NURUPO_A: { text: 'キモ', end: true, runaway: true },
  T_NURUPO_B: { text: '偽物か', end: true, runaway: true },  /* 2026-09-13 */
  T_OREMO: { text: 'おれも', end: true, runaway: true },

  TR_JYANKEN_RANT: {
    text: '僕の勝利！',  /* 2026-09-13 たけろう */
    end: true, runaway: true
  },
  TR_JYANKEN_NORI: { text: 'のり わる', end: true, runaway: true },
  TR_KYUGI_HAI: { text: 'ちょーし のんな', end: true, runaway: true },
  TR_KYUGI_IIE: { text: 'しってる', end: true, runaway: true },
  TR_HANAGE_UN: { text: 'ぬかないで あげて', end: true, runaway: true },
  TR_HANAGE_URUSO: {
    text: 'あの、少々よろしいでしょうか。私は先ほど「鼻毛が出ている」という事実をご報告申し上げたに過ぎません。それに対して「嘘つき」という評価を頂戴するのは、いささか心外と申しますか、率直に申し上げて遺憾でございます。私がこれまで貴殿に虚偽の申告をしたことが一度でもありましたでしょうか。ありませんよね。ご確認いただければお分かりになるかと存じます。…失礼、少し熱くなりました。',  /* 2026-09-13 たけろう(文はクロちゃん案を採用) */
    end: true, runaway: true
  },
  TR_YOJI_A: { text: 'ばかなの?', end: true, runaway: true },
  TR_YOJI_B: { text: 'らゔ いず おーゔぁー♪', end: true, runaway: true },
  TR_KURUMA_A: { text: 'どちら様ですか？', end: true, runaway: true },
  TR_KURUMA_B: { text: 'どんだけーー☝️', end: true, runaway: true }
};
