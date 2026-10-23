import {OPENINGS} from './literature.mjs';
export const LEVELS={easy:{name:'かんたん',target:1.05,window:.24,perfect:.09,hint:'ゆっくり、短いことばから。'},normal:{name:'ふつう',target:1.9,window:.19,perfect:.075,hint:'ひと拍ずつ、ことばをつなごう。'},hard:{name:'むずかしい',target:3.2,window:.15,perfect:.06,hint:'細かいリズムと長いことば。'}};
export function audibleClock(context,performanceNow){
 if(typeof context.getOutputTimestamp==='function'){
  const stamp=context.getOutputTimestamp();
  if(stamp.performanceTime>0&&stamp.contextTime>0)return Math.min(context.currentTime,stamp.contextTime+Math.max(0,performanceNow-stamp.performanceTime)/1000);
 }
 return Math.max(0,context.currentTime-(context.baseLatency||0)-(context.outputLatency||0));
}
export function makeChart(track,levelName,phaseCorrection=0,passage=OPENINGS[0]){
 if(!LEVELS[levelName])throw Error('unknown difficulty');
 const times=track.rhythmCharts?.[levelName];
 if(!Array.isArray(times)||!times.length)throw Error('missing onset-backed chart');
 const notes=[];let phrase=0,letter=0,wordId=0,wordStart=0;
 for(const attack of times){
  const time=attack+phaseCorrection;
  if(time<0||time>=track.duration-.3)continue;
  const [kana,word]=passage.phrases[phrase];
  if(letter===0)wordStart=time;
  notes.push({time:+time.toFixed(6),key:word[letter],kana,word,letter,wordId,wordStart,phraseIndex:phrase,status:'pending',quality:0});
  letter++;
  if(letter===word.length){letter=0;phrase=(phrase+1)%passage.phrases.length;wordId++;}
 }
 const minimumGap=notes.length>1?Math.min(...notes.slice(1).map((n,i)=>n.time-notes[i].time)):1;
 return {notes,minimumGap,actualRate:notes.length/track.duration,source:'audio-onsets',passageId:passage.id};
}
export function judge(notes,key,time,levelName){
 const lv=LEVELS[levelName];let target=null,distance=Infinity;
 for(const n of notes){if(n.status!=='pending')continue;let d=Math.abs(n.time-time);if(d<distance){distance=d;target=n;}if(n.time>time+lv.window)break;}
 if(!target||distance>lv.window)return {kind:'outside'};
 if(target.key!==key)return {kind:'wrong',note:target};
 let quality=distance<=lv.perfect?1:distance<=lv.window*.72?.72:.45;
 target.status='hit';target.quality=quality;
 return {kind:'hit',note:target,quality,delta:time-target.time};
}
export function expire(notes,time,levelName){let missed=0;for(const n of notes){if(n.status==='pending'&&n.time+LEVELS[levelName].window<time){n.status='miss';missed++;}else if(n.time>time)break;}return missed;}
export function summary(notes,wrong=0){const hits=notes.filter(n=>n.status==='hit');return {hits:hits.length,total:notes.length,score:Math.round(hits.reduce((a,n)=>a+n.quality,0)/Math.max(1,notes.length)*1000000),accuracy:Math.round(hits.reduce((a,n)=>a+n.quality,0)/Math.max(1,notes.length+wrong)*100)};}
