/* No third-party video player is requested before a visitor presses play. */
(()=>{
 const section=document.getElementById('pv-sec');if(!section)return;
 let active=null;
 section.addEventListener('click',event=>{
  const button=event.target.closest('button[data-song-video]');if(!button||!section.contains(button))return;
  const id=button.dataset.songVideo;if(!/^[\w-]{11}$/.test(id))return;
  if(active)active.frame.replaceWith(active.button);
  const frame=document.createElement('iframe');
  frame.title=button.getAttribute('aria-label');
  frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen=true;
  frame.referrerPolicy='strict-origin-when-cross-origin';
  frame.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&playsinline=1&rel=0';
  button.replaceWith(frame);active={frame,button};frame.focus();
 });
})();
