/* Visibility gates only. Swimming uses CSS, with no frame or scroll loop. */
(()=>{
 const layer=document.getElementById('memory-fish-layer'),region=document.getElementById('scene-region'),river=document.getElementById('moji-sec');
 if(!layer||!region||!river)return;
 const img=layer.querySelector('img'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const update=()=>{
  const rect=region.getBoundingClientRect(),ready=img.complete&&img.naturalWidth>0;
  const enabled=ready&&rect.top<innerHeight&&rect.bottom>0&&river.getBoundingClientRect().bottom<=0;
  layer.classList.toggle('fish-enabled',enabled);
  layer.classList.toggle('fish-active',enabled&&!document.hidden&&!reduce.matches);
 };
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(update,{threshold:0});
  observer.observe(region);observer.observe(river);
 }
 img.addEventListener('load',update,{once:true});
 document.addEventListener('visibilitychange',update);
 reduce.addEventListener('change',update);
 window.addEventListener('resize',update,{passive:true});
 update();
})();
