/* Public stock only. Credentials and customer information never enter this file. */
(function(){
  'use strict';
  const endpoint='https://tibiboard-stock-sync.tibiboard100.workers.dev/status';
  let busy=false, previous='', latestRaw;
  function clean(raw){
    if(raw?.version!==1 || !raw.products || typeof raw.products!=='object') throw new Error('invalid');
    const fresh=raw.health==='ok' && Number.isFinite(Date.parse(raw.checked_at)) && Math.abs(Date.now()-Date.parse(raw.checked_at))<15*60000;
    const products={};
    for(const [id,p] of Object.entries(raw.products)){
      if(!/^No\.\d+$/.test(id)||!Number.isSafeInteger(p.item_id)||!['sold','available','pending'].includes(p.state))continue;
      const out={item_id:p.item_id,state:p.state};
      if(Number.isSafeInteger(p.sale_price)&&p.sale_price>0&&['キット','完成版'].includes(p.saleKind)&&/^\d{4}-\d{2}-\d{2}$/.test(p.sold_date||'')) Object.assign(out,{sale_price:p.sale_price,saleKind:p.saleKind,sold_date:p.sold_date});
      products[id]=out;
    }
    return {fresh,products};
  }
  async function refresh(){
    if(busy)return;busy=true;
    try{
      const response=await fetch(endpoint,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(12000)});
      latestRaw=await response.json();
      const data=clean(latestRaw);
      const key=JSON.stringify(data);
      if(key!==previous){window.TIBI_STOCK_APPLY?.(data);previous=key;}
    }catch{window.TIBI_STOCK_APPLY?.({fresh:false,products:{}});previous='';}
    finally{busy=false;}
  }
  function replay(){if(latestRaw){try{window.TIBI_STOCK_APPLY?.(clean(latestRaw));}catch{}}}
  for(const at of (window.TIBI_LAUNCH_TIMES||[])){const delay=at-Date.now();if(delay>0&&delay<2147483647)setTimeout(()=>{replay();refresh();},delay);}
  refresh();setInterval(()=>{if(!document.hidden)refresh();},30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){replay();refresh();}});
})();
