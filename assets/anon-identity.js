// 天喜 TIANXI · anon identity for lounge (NO real auth yet · A3 will add).
// Stores a generated UUID + a friendly "馬迷####" handle in localStorage,
// editable via TX_ID.setHandle().
(function(){
  var ID_KEY = 'tx-anon-id';
  var H_KEY  = 'tx-anon-handle';

  function genId(){
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    // fallback — not cryptographically strong but fine for anon handle
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10);
  }

  var id = null, handle = null;
  try { id = localStorage.getItem(ID_KEY); handle = localStorage.getItem(H_KEY); } catch(e){}
  if (!id) {
    id = genId();
    try { localStorage.setItem(ID_KEY, id); } catch(e){}
  }
  if (!handle) {
    handle = '馬迷' + Math.floor(Math.random()*9000 + 1000);
    try { localStorage.setItem(H_KEY, handle); } catch(e){}
  }

  window.TX_ID = {
    get id(){ return id; },
    get handle(){ return handle; },
    setHandle: function(h){
      if (!h) return;
      handle = String(h).slice(0, 24);
      try { localStorage.setItem(H_KEY, handle); } catch(e){}
      return handle;
    },
  };
})();
