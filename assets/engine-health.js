(function(){
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function render(el, d){
    if (!el || !d) return;
    var ov = d.overall || 'WATCH';
    var rows = (d.checks||[]).map(function(c){
      var col = c.status==='PASS'?'#1a7f4b':c.status==='FAIL'?'#8b1e1e':'#8a5a00';
      return '<div style="display:grid;grid-template-columns:64px 1fr;gap:8px;padding:7px 0;border-bottom:1px solid var(--rule-2,#ddd)">'+
        '<b style="font-family:ui-monospace,monospace;font-size:11px;color:'+col+'">'+esc(c.status)+'</b>'+
        '<div><div style="font-weight:700;font-size:13px">'+esc(c.label)+'</div>'+
        '<div style="font-size:12px;opacity:.75;line-height:1.5">'+esc(c.detail)+'</div></div></div>';
    }).join('');
    el.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">'+
      '<b>總評 '+esc(ov)+'</b><span>PASS '+(d.counts&&d.counts.pass)+'</span>'+
      '<span>WATCH '+(d.counts&&d.counts.watch)+'</span>'+
      '<span>'+esc((d.season&&d.season.label)||'')+'</span></div>'+
      '<p style="font-size:12px;opacity:.8;margin:0 0 8px">'+esc(d.summary||'')+' · '+esc(d.generatedHKT||'')+'</p>'+rows;
  }
  window.TX_ENGINE_HEALTH = {
    load: function(id){
      var el = document.getElementById(id); if(!el) return;
      var base = (window.TX_API && TX_API.base) || 'https://tianxi-backend.tianxi-entertainment.workers.dev';
      fetch(base+'/api/analyze/engine-health').then(function(r){if(!r.ok)throw 0;return r.json();})
        .catch(function(){return fetch('/engine/health.json?t='+Date.now()).then(function(r){if(!r.ok)throw 0;return r.json();});})
        .then(function(d){render(el,d);})
        .catch(function(){el.textContent='引擎健康清單暫時無法載入';});
    }
  };
})();
