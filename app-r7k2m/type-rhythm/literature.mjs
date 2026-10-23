// Short opening excerpts of Japanese public-domain works. Romanization and
// phrase boundaries are supplied for this typing game; punctuation is not typed.
export const OPENINGS = [
 {id:'cat',title:'吾輩は猫である',author:'夏目漱石',source:'https://www.aozora.gr.jp/cards/000148/files/789_14547.html',phrases:[['吾輩は','wagahaiha'],['猫である。','nekodearu'],['名前は','namaeha'],['まだ無い。','madanai'],['どこで','dokode'],['生れたか','umaretaka'],['とんと','tonto'],['見当が','kentouga'],['つかぬ。','tsukanu']]},
 {id:'botchan',title:'坊っちゃん',author:'夏目漱石',source:'https://www.aozora.gr.jp/cards/000148/files/752_14964.html',phrases:[['親譲りの','oyayuzurino'],['無鉄砲で','muteppoude'],['小供の時から','kodomonotokikara'],['損ばかり','sonbakari'],['している。','shiteiru'],['小学校に','shougakkouni'],['居る時分','irujibun'],['学校の','gakkouno'],['二階から','nikaikara'],['飛び降りて','tobiorite'],['一週間ほど','isshuukanhodo'],['腰を抜かした','koshiwonukashita'],['事がある。','kotogaaru']]},
 {id:'kokoro',title:'こころ',author:'夏目漱石',source:'https://www.aozora.gr.jp/cards/000148/files/773_14560.html',phrases:[['私は','watashiha'],['その人を','sonohitowo'],['常に','tsuneni'],['先生と','senseito'],['呼んでいた。','yondeita'],['だから','dakara'],['ここでも','kokodemo'],['ただ先生と','tadasenseito'],['書くだけで','kakudakede'],['本名は','honmyouha'],['打ち明けない。','uchiakenai']]},
 {id:'kusamakura',title:'草枕',author:'夏目漱石',source:'https://www.aozora.gr.jp/cards/000148/files/776_14941.html',phrases:[['山路を','yamamichiwo'],['登りながら、','noborinagara'],['こう考えた。','koukangaeta'],['智に働けば','chinihatarakeba'],['角が立つ。','kadogatatsu'],['情に棹させば','jounisaosaseba'],['流される。','nagasareru'],['意地を通せば','ijiwotooseba'],['窮屈だ。','kyuukutsuda'],['とかくに','tokakuni'],['人の世は','hitonoyoha'],['住みにくい。','suminikui']]},
 {id:'rashomon',title:'羅生門',author:'芥川龍之介',source:'https://www.aozora.gr.jp/cards/000879/files/127_15260.html',phrases:[['ある日の','aruhino'],['暮方の','kuregatano'],['事である。','kotodearu'],['一人の下人が、','hitorinogeninga'],['羅生門の下で','rashoumonnoshitade'],['雨やみを','amayamiwo'],['待っていた。','matteita'],['広い門の下には、','hiroimonnoshitaniha'],['この男のほかに','konootokonohokani'],['誰もいない。','daremoinai']]},
 {id:'hana',title:'鼻',author:'芥川龍之介',source:'https://www.aozora.gr.jp/cards/000879/files/42_15228.html',phrases:[['禅智内供の','zenchinaiguno'],['鼻と云えば、','hanatoieba'],['池の尾で','ikenoode'],['知らない者は','shiranaimonoha'],['ない。','nai'],['長さは','nagasaha'],['五六寸あって','gorokusunatte'],['上唇の上から','uwakuchibirunouekara'],['顋の下まで','agonoshitamade'],['下っている。','sagatteiru']]},
 {id:'melos',title:'走れメロス',author:'太宰治',source:'https://www.aozora.gr.jp/cards/000035/files/1567_14913.html',phrases:[['メロスは','merosuha'],['激怒した。','gekidoshita'],['必ず、','kanarazu'],['かの','kano'],['邪智暴虐の','jachibougyakuno'],['王を','ouwo'],['除かなければ','nozokanakereba'],['ならぬと','naranuto'],['決意した。','ketsuishita'],['メロスには','merosuniha'],['政治が','seijiga'],['わからぬ。','wakaranu']]},
 {id:'ningen',title:'人間失格（第一の手記）',author:'太宰治',source:'https://www.aozora.gr.jp/cards/000035/files/301_14912.html',phrases:[['恥の多い','hajinoooi'],['生涯を','shougaiwo'],['送って来ました。','okuttekimashita'],['自分には、','jibunniha'],['人間の','ningenno'],['生活というものが、','seikatsutoiumonoga'],['見当つかないのです。','kentoutsukanainodesu']]},
 {id:'ginga',title:'銀河鉄道の夜',author:'宮沢賢治',source:'https://www.aozora.gr.jp/cards/000081/files/456_15050.html',phrases:[['ではみなさんは、','dehaminasanha'],['そういうふうに','souiufuuni'],['川だと','kawadato'],['云われたり、','iwaretari'],['乳の流れた','chichinonagareta'],['あとだと','atodato'],['云われたり','iwaretari'],['していた','shiteita'],['このぼんやりと','konobonyarito'],['白いものが','shiroimonoga'],['ほんとうは何か','hontouhananika'],['ご承知ですか。','goshouchidesuka']]},
 {id:'chumon',title:'注文の多い料理店',author:'宮沢賢治',source:'https://www.aozora.gr.jp/cards/000081/files/43754_17659.html',phrases:[['二人の若い紳士が、','futarinowakaishinshiga'],['すっかり','sukkari'],['イギリスの','igirisuno'],['兵隊の','heitaino'],['かたちをして、','katachiwoshite'],['ぴかぴかする','pikapikasuru'],['鉄砲を','teppouwo'],['かついで、','katsuide'],['白熊のような','shirokumonoyouna'],['犬を二疋つれて、','inuwonihikitsurete']]} 
];

// Short reading lines follow the current phrase, without affecting note timing.
export function passageLine(passage,index=0){
 let text='',start=0;
 for(let i=0;i<passage.phrases.length;i++){
  const phrase=passage.phrases[i][0];
  if(text&&text.length+phrase.length>28){if(index>=start&&index<i)return text;text='';start=i;}
  text+=phrase;
  if(/[。！？]$/.test(phrase)){if(index>=start&&index<=i)return text;text='';start=i+1;}
 }
 return text;
}
