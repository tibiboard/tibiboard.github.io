/* Keep loading artwork visible until the first paint pass is ready. */
(()=>{
 const root=document.documentElement;
 root.classList.add('paint-pending');
 root.style.setProperty('--paint-clip','url("'+location.href.split('#')[0]+'#paint-reveal")');
 setTimeout(()=>root.classList.remove('paint-pending'),8000);
})();
