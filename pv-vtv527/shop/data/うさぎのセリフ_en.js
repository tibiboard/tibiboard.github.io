/* Rabbit (Batsubei) dialogue — ENGLISH version (2026-09-09). Made from data/うさぎのセリフ.js (JP is the master).
   Same keys / same structure / same node names as the JP file. Only the text changed.
   Translation policy (Takero 2026-09-09 "as faithful as possible"): keep the deadpan, short, slightly rude tone.
   Japanese pop-culture references are kept as-is (romanized) with a tiny hint only where the joke would be invisible.
   Rebuild note: if うさぎのセリフ.js changes, mirror the change here. Check with: node data/_セリフ英語版の検査.js
*/
window.USAGI_SERIFU = {
  again: { text: 'You again?', choices: [ { label: 'Next', next: 'start' } ] },

  yes1: { text: 'Not telling.', end: true, runaway: true },
  secret: { text: 'Fine. I guess I\'ll tell you…', choices: [ { label: '…', next: 'secret2' } ] },
  secret2: { text: '(still a secret here)', choices: [ { label: 'Close', next: 'bye' } ] },
  bye: { text: 'See ya.', end: true, runaway: true },

  trivia: { random: 'TRIVIA' },

  /* ===== Engine strings (usagi_walk.js reads data.UI; JP file has none and falls back to Japanese) ===== */
  UI: { shiritai: 'Wanna know?', hontoni: 'Really?', hontoni2: 'Really, really?', oshiete: 'Tell me', ii: 'Nah', tojiru: 'Close' },

  /* ===== Coins (by number of times you talked: 5th=2, 10th=3, every 10th=3, 100th=15) ===== */
  COIN_GIVE: [ 'Got nothing better to do? Here.', 'You\'re persistent. Here.' ],

  /* ===== When you have 99 coins ===== */
  coin99: { text: 'Hey old man. Just jump already.', choices: [
    { label: 'Clink clink', next: 'coin99_a' },
    { label: 'No', next: 'coin99_b' }
  ]},
  coin99_a: { text: 'Pleasure doing business.', coins: -5, end: true, runaway: true },
  coin99_b: { text: 'HOKUTO HYAKURETSU KEN! (100-fist punch)', coins: -5, end: true, runaway: true },

  /* ===== When you hold the key ===== */
  key: { text: 'You… you\'ve got it, huh.', choices: [
    { label: 'Yep', next: 'key_a' },
    { label: 'What\'s it for?', next: 'key_a' }
  ]},
  key_a: { text: 'Let\'s go open the treasure box!', end: true, runaway: true },

  /* ===== Right after losing at gacha / slots (1 in 5) ===== */
  miss: { text: 'Don\'t let it get you down.', choices: [
    { label: 'Thanks', next: 'miss_a' },
    { label: 'Leave me alone', next: 'miss_b' }
  ]},
  miss_a: { text: 'Here, have this.', coins: 5, end: true, runaway: true },
  miss_b: { text: 'Hey, hey. How does it feel right now? All those coins you worked so hard for, gone in a second, and now I\'m rubbing it in. Can you put that feeling into words? Can you explain it to me nicely? Can you sum it up? Can you really put that emotion into words?', end: true, runaway: true },

  /* ===== Collection book (engine fills the number): ZUKAN.mada='まだ {n}' / half / ato='あと {n}' / all ===== */
  ZUKAN: { mada: 'Still {n} to go', half: 'Exactly halfway', ato: '{n} left', all: 'Collection complete. Congrats.' },

  /* ===== Calendar events (first click of that day only) ===== */
  EVENTS: {
    '01-01': 'Happy New Year', '02-03': 'Out with the demons (Setsubun)', '03-03': 'It\'s Hinamatsuri, huh', '05-05': 'It\'s Children\'s Day',
    '07-07': 'Tanabata. Got a wish?', '08-13': 'It\'s Obon, huh', '10-31': 'Halloween', '12-25': 'Merry Xmas', '12-31': 'Year\'s ending, huh'
  },

  /* ===== When you find the hidden rabbit and click it ===== */
  HIDDEN: [
    'What.',
    'Nobody here.',
    'The station? End of the hall, turn right, straight ahead.',
    'H!',
    'Meeeen-min-min-min (cicada noise)',
    'Personal space. Think about it.',
    'And you are?',
    'Could you please stop putting your finger between my ears?'
  ],
  HIDDEN_EARS: [ 'You grabbed my ears.' ],
  HIDDEN_CEIL: [ 'Still alive upside down.' ],

  /* ===== When you click the walking rabbit (3 out of 4 times: random from here) ===== */
  TRIVIA: [
    /* --- Questions (2026-09-07 Takero: make people notice they bend to what others think. Never hurt anyone.) --- */
    { text: 'Those clothes. Who did you buy them to show?', choices: [ { label: 'Myself', next: 'T_ME_FUKU_A' }, { label: 'Everyone', next: 'T_ME_FUKU_B' } ] },
    { text: 'That thing that was trendy 5 years ago. Still using it?', choices: [ { label: 'Still using it', next: 'T_ME_RYUKO_A' }, { label: 'Threw it out', next: 'T_ME_RYUKO_B' } ] },
    { text: 'If a friend said "that\'s weird"?', choices: [ { label: 'I\'d stop', next: 'T_ME_HEN_A' }, { label: 'Don\'t care', next: 'T_ME_HEN_B' } ] },
    { text: 'Being stylish. Who decides that?', choices: [ { label: 'The world', next: 'T_ME_OSHARE_A' }, { label: 'Me', next: 'T_ME_OSHARE_B' } ] },
    { text: 'The ones here, you can only get here. Made by hand, one at a time.', end: true, runaway: true },
    { text: 'The popular color or the color you like. Which do you pick?', choices: [ { label: 'Popular', next: 'T_ME_IRO_A' }, { label: 'The one I like', next: 'T_ME_IRO_B' } ] },
    { text: 'Do you think I\'m a weird rabbit?', choices: [ { label: 'Yeah', next: 'T_ME_USAGI_A' }, { label: 'Cute', next: 'T_ME_USAGI_B' } ] },
    /* --- Self-affirmation --- */
    { text: 'You don\'t have to make "being yourself" sound hard. Keep the things you like close. That\'s all.', end: true, runaway: true },
    /* --- Morning --- */
    { time: 'morning', text: 'It\'s morning. Keep it down.', end: true, runaway: true },
    { time: 'morning', text: 'G\'mornin\'.', end: true, runaway: true },
    { time: 'morning', text: 'Morning routine, huh?', choices: [ { label: 'Yep', next: 'T_ASAKATSU_A' }, { label: 'What is?', next: 'T_ASAKATSU_B' } ] },
    /* --- Noon --- */
    { time: 'noon', text: 'It\'s noon,', choices: [ { label: 'Yep', next: 'T_HIRU_A' }, { label: 'No it\'s not', next: 'T_HIRU_B' } ] },
    { time: 'noon', text: 'Noisy, isn\'t it.', choices: [ { label: 'Right!', next: 'T_SAWAGA_A' }, { label: 'Yeah', next: 'T_SAWAGA_B' } ] },
    { time: 'noon', text: 'Had lunch?', choices: [ { label: 'Yep', next: 'T_HIRUMESHI_A' }, { label: 'What do you think?', next: 'T_HIRUMESHI_B' } ] },
    { time: 'noon', text: 'Napping.', choices: [ { label: 'Hey', next: 'T_HAOU' }, { label: 'Hey hey', next: 'T_JAOU' } ] },
    /* --- Night --- */
    { time: 'night', text: 'Quiet at night!', choices: [ { label: 'Yes!', next: 'T_SHII' }, { label: 'YES!!!', next: 'T_HAOU' } ] },
    { time: 'night', text: 'Pretty night sky, huh.', choices: [ { label: 'Yeah', next: 'T_YOZORA_A' }, { label: 'Not really', next: 'T_YOZORA_B' } ] },
    { time: 'night', text: 'Go buy me ice cream.', choices: [ { label: 'Sure', next: 'T_ICE_A' }, { label: 'No', next: 'T_HAOU' } ] },
    /* --- Late night --- */
    { time: 'late', text: 'Don\'t make noise this late!', choices: [ { label: 'Sorry', next: 'T_SHINYA_A' }, { label: 'What noise?', next: 'T_SHINYA_B' } ] },
    { time: 'late', text: 'Not sleeping?', choices: [ { label: 'Nope', next: 'T_NENAI_A' }, { label: 'Going to bed', next: 'T_NENAI_B' } ] },
    { time: 'late', text: 'zzzzzzz', choices: [ { label: 'Um…', next: 'T_MAKANKO' }, { label: 'Poke poke', next: 'T_MURYOU' } ] },
    /* --- Phone only --- */
    { mobile: true, text: 'Does this show up OK on your phone?', choices: [ { label: 'Yep', next: 'T_SUMAHO_A' }, { label: 'So-so', next: 'T_SUMAHO_B' } ] },
    /* --- Anytime --- */
    { text: 'Do you like me?', choices: [ { label: 'Like', next: 'T_SUKI_Q' }, { label: 'Hate', next: 'T_KIRAI' } ] },
    { text: 'Say "karaage" 10 times.', choices: [ { label: 'Said it', next: 'T_KARAAGE_A' }, { label: 'No', next: 'T_KARAAGE_B' } ] },
    { text: 'Welcome in! (sushi chef voice)', choices: [ { label: 'Kohada, please', next: 'T_SUSHI_A' }, { label: 'Salmon, please', next: 'T_SUSHI_B' } ] },
    { text: 'You in love?', choices: [ { label: 'I am', next: 'T_KOI_A' }, { label: 'I\'m not', next: 'T_KOI_B' } ] },
    { text: 'To be, or not to be', choices: [ { label: 'That is the question', next: 'T_IKIRU_A' }, { label: 'LIVE!', next: 'T_IKIRU_B' } ] },
    { text: 'You\'re, like, sooo cute~', choices: [ { label: 'Yay!', next: 'T_KAWAII_A' }, { label: 'Thanks', next: 'T_KAWAII_B' } ] },
    { text: 'Meat or fish?', choices: [ { label: 'Fish', next: 'T_NIKU_A' }, { label: 'What do you think?', next: 'T_NIKU_B' } ] },
    { text: 'Ringo-gorilla-rappa (apple-gorilla-trumpet… word chain!)', choices: [ { label: 'Pantsu', next: 'T_RINGO_A' }, { label: 'Pasokon', next: 'T_RINGO_B' } ] },
    { text: 'A night without dancing?', choices: [ { label: 'Never heard of it', next: 'T_OREMO' }, { label: 'I know it', next: 'T_OREMO' } ] },
    { text: 'Out of nowhere: rock, paper, scissors.', choices: [
      { label: 'Rock', next: 'TR_JYANKEN_GU' }, { label: 'Scissors', next: 'TR_JYANKEN_CHOKI' },
      { label: 'Paper', next: 'TR_JYANKEN_PA' }, { label: 'Pass', next: 'TR_JYANKEN_NORI' } ] },
    { text: 'Good at ball games?', choices: [ { label: 'Yes', next: 'TR_KYUGI_HAI' }, { label: 'No', next: 'TR_KYUGI_IIE' } ] },
    { text: 'You\'ve got a nose hair showing.', choices: [ { label: 'Yeah', next: 'TR_HANAGE_UN' }, { label: 'Liar', next: 'TR_HANAGE_URUSO' } ] },
    { text: 'Four-character idiom. Go.', choices: [ { label: 'Yakiniku teishoku', next: 'TR_YOJI_A' }, { label: 'Ouyang Feifei', next: 'TR_YOJI_B' } ] },
    { text: 'Car! Car! Car!', choices: [ { label: 'Todoroki!', next: 'TR_KURUMA_A' }, { label: 'Todorokiii—☝️', next: 'TR_KURUMA_B' } ] },
    'Rock|You\'re an old man, aren\'t you.',
    'Paper|Yeah. Your head.',
    'Ouyang Feifei',
    'IKKO-san',
    'Sup.'
  ],

  /* --- Replies --- */
  T_ME_FUKU_A: { text: 'Then that\'s the right answer.', end: true, runaway: true },
  T_ME_FUKU_B: { text: 'I used to be like that too. Everyone\'s eyes change by next year, though.', end: true, runaway: true },
  T_ME_RYUKO_A: { text: 'Then that\'s not a trend. That\'s something you like.', end: true, runaway: true },
  T_ME_RYUKO_B: { text: 'Trends get thrown out. Things you like don\'t. Which one are you buying?', end: true, runaway: true },
  T_ME_HEN_A: { text: 'Your room is going to fill up with what your friend likes.', end: true, runaway: true },
  T_ME_HEN_B: { text: 'Yeah. "Weird" means nobody else has it yet.', end: true, runaway: true },
  T_ME_OSHARE_A: { text: 'The world re-decides every year. Doesn\'t it get tiring, being pushed around?', end: true, runaway: true },
  T_ME_OSHARE_B: { text: 'Not many people can say that.', end: true, runaway: true },
  T_ME_IRO_A: { text: 'The popular one will be a different color next year.', end: true, runaway: true },
  T_ME_IRO_B: { text: 'The color you like stays with you for 10 years.', end: true, runaway: true },
  T_ME_USAGI_A: { text: 'Yeah. That\'s why you\'ll remember me.', end: true, runaway: true },
  T_ME_USAGI_B: { text: 'You\'re using your own eyes. Good.', end: true, runaway: true },
  T_ASAKATSU_A: { text: 'You really like that stuff, huh.', end: true, runaway: true },
  T_ASAKATSU_B: { text: 'What do you mean "what is"?', end: true, runaway: true },
  T_HIRU_A: { text: 'A boring person. But that\'s fine.', end: true, runaway: true },
  T_HIRU_B: { text: 'Start from needle number one. 1000 / 1000.', end: true, runaway: true },
  T_SAWAGA_A: { text: 'Yeah, right?', end: true, runaway: true },
  T_SAWAGA_B: { text: 'DANEFUSHI! (yeah-choo!)', end: true, runaway: true },
  T_HIRUMESHI_A: { text: 'I want a rice ball!', end: true, runaway: true },
  T_HIRUMESHI_B: { text: 'Hmm… did you eeeeat!?', end: true, runaway: true },
  T_HAOU: { text: 'HAOH SHOKOH KEN!', end: true, runaway: true },
  T_JAOU: { text: 'JAOH ENSATSU KOKURYUHA!', end: true, runaway: true },
  T_SHII: { text: 'Shh!', end: true, runaway: true },
  T_YOZORA_A: { text: 'Sorry, who are you?', end: true, runaway: true },
  T_YOZORA_B: { text: 'Honestly, that\'s kind of sad. Honestly.', end: true, runaway: true },
  T_ICE_A: { text: 'And Ken-chan ramen after.', end: true, runaway: true },
  T_SHINYA_A: { text: 'As long as you get it.', end: true, runaway: true },
  T_SHINYA_B: { text: 'You\'ve made me angry.', end: true, runaway: true },
  T_NENAI_A: { text: 'Huh.', end: true, runaway: true },
  T_NENAI_B: { text: 'Night.', end: true, runaway: true },
  T_MAKANKO: { text: 'MAKANKOSAPPO!', end: true, runaway: true },
  T_MURYOU: { text: 'Unlimited Void.', end: true, runaway: true },
  T_SUMAHO_A: { text: 'Good. Keep reporting.', end: true, runaway: true },
  T_SUMAHO_B: { text: 'Seriously? I\'ll pass it on.', end: true, runaway: true },
  T_SUKI_Q: { text: 'What part?', choices: [ { label: 'All of you', next: 'T_SUKI_ZENBU' }, { label: 'The ears', next: 'T_SUKI_MIMI' } ] },
  T_SUKI_ZENBU: { text: 'I like your butt too.', end: true, runaway: true },
  T_SUKI_MIMI: { text: 'Could you please stop putting your finger between my ears?', end: true, runaway: true },
  T_KIRAI: { text: 'Give me back my time ＞＜', end: true, runaway: true },
  T_KARAAGE_A: { text: 'Karaage⤴︎🎶', end: true, runaway: true },
  T_KARAAGE_B: { text: 'Killjoy ✖️10', end: true, runaway: true },
  T_SUSHI_A: { text: 'Teyandei! (old Tokyo "yeah yeah!")', end: true, runaway: true },
  T_SUSHI_B: { text: 'Sa……mon?', end: true, runaway: true },
  T_KOI_A: { text: 'A slave to love… huh.', end: true, runaway: true },
  T_KOI_B: { text: 'Me neither.', end: true, runaway: true },
  T_IKIRU_A: { text: 'Why?', end: true, runaway: true },
  T_IKIRU_B: { text: 'LIVE!', end: true, runaway: true },
  T_KAWAII_A: { text: 'You look just like Ono no Imoko.', end: true, runaway: true },
  T_KAWAII_B: { text: 'You look just like Kamei Shizuka.', end: true, runaway: true },
  T_NIKU_A: { text: 'You\'ve got that kind of face.', end: true, runaway: true },
  T_NIKU_B: { text: 'Answering a question with a question… how is that communication, exactly? You\'re a grown adult, right? I\'m not that interested, and honestly, aren\'t you overestimating yourself a bit?', end: true, runaway: true },
  T_RINGO_A: { text: 'H', end: true, runaway: true },
  T_RINGO_B: { text: 'N\'Djamena', end: true, runaway: true },
  T_OREMO: { text: 'Me too.', end: true, runaway: true },

  TR_JYANKEN_GU: { text: 'I had scissors... you win! Here, one coin.', coins: 1, end: true, runaway: true },
  TR_JYANKEN_CHOKI: { text: 'Scissors too. A tie!', end: true, runaway: true },
  TR_JYANKEN_PA: { text: 'I had scissors. I win!', end: true, runaway: true },
  TR_JYANKEN_NORI: { text: 'Killjoy.', end: true, runaway: true },
  TR_KYUGI_HAI: { text: 'Don\'t get cocky.', end: true, runaway: true },
  TR_KYUGI_IIE: { text: 'I know.', end: true, runaway: true },
  TR_HANAGE_UN: { text: 'Leave it. Don\'t pull it out.', end: true, runaway: true },
  TR_HANAGE_URUSO: {
    text: 'Huh? Did you just call me a liar? Have I ever, even once, lied to you? No. So doubting me like that is pretty harsh, you know. …Calm down. Snap out of it?',
    end: true, runaway: true
  },
  TR_YOJI_A: { text: 'Are you stupid?', end: true, runaway: true },
  TR_YOJI_B: { text: 'Love is over.', end: true, runaway: true },
  TR_KURUMA_A: { text: 'And you are?', end: true, runaway: true },
  TR_KURUMA_B: { text: 'Dondake—☝️', end: true, runaway: true }
};
