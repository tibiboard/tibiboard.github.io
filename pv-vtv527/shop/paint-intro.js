/* One texture and six SVG reveal regions; no additional image layers. */
(()=>{
 const root=document.documentElement, image=document.getElementById('intro-image'), paint=document.querySelector('#paint-surface img');
 if(!image||!paint)return;
 const base=new URL('assets/paint/',document.baseURI);
 const preview=new URLSearchParams(location.search).get('art');
 const pick=['a','b'].includes(preview)?preview:(Math.random()<.5?'a':'b');root.dataset.intro=pick;
 document.getElementById('intro-art').className='art-'+pick;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const phone=matchMedia('(max-width:600px) and (orientation:portrait) and (pointer:coarse)').matches;
 if(phone&&!reduce)root.classList.add('paint-mobile-reveal');
 // Animate the actual SVG geometry. CSS transforms inside clipPath can fail
 // to repaint on mobile Safari even while the animation clock is running.
 const passes=Array.from(phone?document.querySelectorAll('#paint-reveal .paint-pass'):[],(node,index)=>{
  const style=getComputedStyle(node);
  return {node,original:node.getAttribute('points'),points:node.getAttribute('points').trim().split(/\s+/).map(pair=>pair.split(',').map(Number)),
   delay:parseFloat(style.getPropertyValue('--delay'))*1000,duration:parseFloat(style.getPropertyValue('--duration'))*1000,right:index%2===1,last:-1};
 });
 let started=false,done=false,artReady=false,paintReady=paint.complete,frame=0,watchdog=0,artTimeout=0,entryObserver=null;
 const world=document.getElementById('world');
 const finish=()=>{
  if(done)return;done=true;cancelAnimationFrame(frame);clearTimeout(watchdog);clearTimeout(artTimeout);
  passes.forEach(pass=>pass.node.setAttribute('points',pass.original));
  document.removeEventListener('visibilitychange',onVisibility);
  if(entryObserver)entryObserver.disconnect();
  root.classList.remove('paint-running','paint-pending');root.classList.add('paint-done');
 };
 const draw=elapsed=>passes.forEach(pass=>{
  const progress=Math.max(0,Math.min(1,(elapsed-pass.delay)/pass.duration));
  if(progress===pass.last)return;pass.last=progress;
  const amount=progress*progress*(3-2*progress);
  pass.node.setAttribute('points',pass.points.map(([x,y])=>[(pass.right?1+(x-1)*amount:x*amount).toFixed(5),y].join(',')).join(' '));
 });
 const start=()=>{
  if(started||done||!artReady||!paintReady||(world&&!world.classList.contains('lit'))||(phone&&document.hidden))return;
  started=true;clearTimeout(artTimeout);
  if(reduce){finish();return;}
  if(!phone){root.classList.remove('paint-pending');root.classList.add('paint-running');watchdog=setTimeout(finish,4600);return;}
  if(!passes.length){finish();return;}
  draw(0);root.classList.remove('paint-pending');root.classList.add('paint-running');
  let first=null;
  const tick=now=>{
   if(done)return;if(first===null)first=now;
   const elapsed=now-first;
   if(elapsed>=4050){finish();return;}
   draw(elapsed);frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);watchdog=setTimeout(finish,4600);
 };
 function onVisibility(){if(!document.hidden)start();}
 if(world&&!world.classList.contains('lit')){entryObserver=new MutationObserver(start);entryObserver.observe(world,{attributes:true,attributeFilter:['class']});}
 if(phone)document.addEventListener('visibilitychange',onVisibility);
 document.getElementById('paint-surface').addEventListener('animationend',e=>{if(!phone&&e.target.classList.contains('stroke-5'))finish();});
 const readyArt=()=>{artReady=true;start();};
 const readyPaint=()=>{paintReady=true;start();};
 paint.addEventListener('load',readyPaint,{once:true});paint.addEventListener('error',readyPaint,{once:true});
 image.addEventListener('load',readyArt,{once:true});image.addEventListener('error',readyArt,{once:true});
 image.src=pick==='a'?new URL('assets/intro-keyboards-v4.webp',location.href).href:new URL('electronics.webp',base).href;
 artTimeout=setTimeout(readyArt,1800);
 if(image.complete)readyArt();
 document.addEventListener('click',e=>{if(e.target.closest('#batsu'))finish();},{capture:true});
 if(reduce)finish();
})();
