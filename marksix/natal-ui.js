(function(global){
  var WX_CLS = {木:'mu',火:'huo',土:'tu',金:'jin',水:'shui'};
  function fmtDT(s){ return String(s||'').replace('T',' '); }
  function readPersonal(){
    var el=document.getElementById('personalDT');
    if(!el||!el.value) return null;
    var m=el.value.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):?(\d{2})?/);
    if(!m) return null;
    return {y:+m[1],m:+m[2],d:+m[3],h:+m[4],min:+(m[5]||0)};
  }
  function currentSex(){
    var on=document.querySelector('.m6-sex-btn.active');
    return on ? on.getAttribute('data-sex') : '';
  }
  function pillarsChart(p, title){
    var E=global.TXMarkSixEngine;
    if(!p) return '';
    var det=(E&&E.enrichPillars)?E.enrichPillars(p):null;
    if(!det||!det.cols){
      return '<div class="m6-meta"><b>'+title+'</b><br>'+p.year+' · '+p.month+' · '+p.day+' · '+p.hour+
        ' · 日主 '+p.dayMaster+'（'+(p.dayMasterWx||'')+'）</div>';
    }
    var cols=det.cols.map(function(c){
      var cang=c.cang.map(function(x){
        return '<span class="bz-cang-item wx-'+x.cls+'">'+x.gan+'<i class="bz-shen">'+x.shen+'</i></span>';
      }).join('');
      return '<div class="bz-col">'+
        '<div class="bz-lab">'+c.lab+'</div>'+
        '<div class="bz-stem wx-'+c.ganCls+'"><span class="bz-char">'+c.gan+'</span><i class="bz-shen">'+c.ganShen+'</i></div>'+
        '<div class="bz-zhi wx-'+c.zhiCls+'"><span class="bz-char">'+c.zhi+'</span><i class="bz-shen">'+(c.zhiShen||'')+'</i></div>'+
        '<div class="bz-cang">'+cang+'</div>'+
      '</div>';
    }).join('');
    return '<div class="bz-wrap">'+
      '<div class="bz-title"><b>'+title+'</b> · 日主 <span class="wx-'+(WX_CLS[det.dayMasterWx]||'')+'">'+det.dayMaster+'</span>（'+det.dayMasterWx+'）</div>'+
      '<div class="bz-chart">'+cols+'</div>'+
    '</div>';
  }
  function wxChip(wx){
    var cls = WX_CLS[wx] || '';
    return '<span class="ge-chip wx-'+cls+'">'+wx+'</span>';
  }
  function chips(arr){
    if(!arr||!arr.length) return '—';
    return arr.map(wxChip).join('');
  }
  function gejuHTML(ge){
    if(!ge||!ge.pattern) return '';
    var p=ge.pattern, zg=ge.zhong_gua||{};
    var notes=(ge.note||[]).length?'<div class="yun-meta">'+ge.note.join(' · ')+'</div>':'';
    var th=ge.tiaohou&&ge.tiaohou.need?('調候 '+(ge.tiaohou.urgent?'急要 ':'')+ge.tiaohou.need):'';
    return '<div class="yun-wrap ge-wrap">'+
      '<div class="m6-block-title">格局喜用</div>'+
      '<p class="yun-meta"><b>'+p.primary+'</b> · 月令 '+p.yue_ling+' · 表鍵 '+p.table_key+
      (p.status&&p.status!=='成'?' · '+p.status:'')+
      (th?' · '+th:'')+
      '<br>眾寡 自黨 '+zg.party_self+'／他黨 '+zg.party_other+'（比 '+zg.ratio+'）'+
      (zg.rooted?' · 有根':' · 無根')+'</p>'+
      '<div class="ge-row"><span class="ge-k">用</span>'+chips(ge.yong_shen)+'</div>'+
      '<div class="ge-row"><span class="ge-k">喜</span>'+chips(ge.xi_shen)+'</div>'+
      '<div class="ge-row"><span class="ge-k">忌</span>'+chips(ge.ji_shen)+'</div>'+
      '<div class="ge-row"><span class="ge-k">仇</span>'+chips(ge.chou_shen)+'</div>'+
      notes+
    '</div>';
  }
  function yunHTML(yun){
    var cur=yun.current_dayun, ln=yun.current_liunian;
    var rows=(yun.rows||[]).map(function(r){
      return '<tr class="'+(r.current?'now':'')+'"><td>'+r.kind+'</td><td class="yun-gz">'+r.ganzhi+
        '</td><td>'+r.shi_shen+'</td><td>'+r.xu_sui+'</td><td>'+fmtDT(r.start_solar)+'<br>'+fmtDT(r.end_solar)+'</td></tr>';
    }).join('');
    var lns=(yun.liunian_in_current||[]).map(function(x){
      return '<tr class="'+(x.current?'now':'')+'"><td>'+x.year+'</td><td class="yun-gz">'+x.ganzhi+'</td><td>'+x.shi_shen+'</td></tr>';
    }).join('');
    return '<div class="yun-wrap"><p class="yun-meta">'+yun.sexLabel+' · '+yun.direction+
      ' · 起運節 <b>'+yun.jie.name+'</b>（'+fmtDT(yun.jie.datetime)+'）'+
      '<br>起運 '+yun.qiyun_note+' → <b>'+fmtDT(yun.qiyun_solar)+'</b>'+
      '<br>當運 <b>'+cur.ganzhi+' '+cur.shi_shen+'</b> · '+cur.xu_sui+
      '（'+fmtDT(cur.start_solar)+' ～ '+fmtDT(cur.end_solar)+'）'+
      '<br>流年 <b>'+ln.year+' '+ln.ganzhi+' '+ln.shi_shen+'</b></p>'+
      '<div class="m6-block-title">大運</div><div style="overflow:auto"><table class="yun-table">'+
      '<thead><tr><th>限</th><th>干支</th><th>十神</th><th>虛歲</th><th>交運</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      '<div class="m6-block-title">當運流年</div><div style="overflow:auto"><table class="yun-table">'+
      '<thead><tr><th>年</th><th>干支</th><th>十神</th></tr></thead><tbody>'+lns+'</tbody></table></div></div>';
  }
  function ensureCss(){
    if(document.getElementById('tx-ge-css')) return;
    var st=document.createElement('style');
    st.id='tx-ge-css';
    st.textContent='.ge-row{display:flex;align-items:center;gap:8px;margin:4px 0;font-size:13px}.ge-k{width:1.4em;font-weight:800;color:var(--ink-mute)}.ge-chip{display:inline-flex;align-items:center;justify-content:center;min-width:1.6em;padding:1px 8px;margin-right:4px;border-radius:999px;border:1px solid var(--rule);font-weight:800;font-size:13px;background:var(--paper)}';
    document.head.appendChild(st);
  }
  function loadScript(src, done){
    var exist=document.querySelector('script[src="'+src+'"]');
    if(exist){ if(done) done(); return; }
    var s=document.createElement('script');
    s.src=src;
    s.onload=function(){ if(done) done(); };
    document.head.appendChild(s);
  }
  function render(){
    var box=document.getElementById('natalOut');
    if(!box){
      var status=document.getElementById('status');
      if(!status||!status.parentNode) return;
      box=document.createElement('div');
      box.id='natalOut';
      status.parentNode.insertBefore(box, status.nextSibling);
    }
    var per=readPersonal();
    var sex=currentSex();
    var E=global.TXMarkSixEngine;
    if(!per||!sex){ box.classList.add('hidden'); box.innerHTML=''; return; }
    if(!E||!E.buildYun){
      box.classList.remove('hidden');
      box.innerHTML='<div class="m6-note">命盤引擎未載入</div>';
      return;
    }
    try{
      var yun=E.buildYun(per.y,per.m,per.d,per.h,per.min,sex,new Date());
      var pers=E.pillarsAt?E.pillarsAt(per.y,per.m,per.d,per.h,per.min):yun.pillars;
      box.classList.remove('hidden');
      var ge=E.analyzeGeju?E.analyzeGeju({year:pers.year,month:pers.month,day:pers.day,hour:pers.hour}):null;
      box.innerHTML='<div class="m6-block-title">個人命盤</div>'+pillarsChart(pers,'出生四柱')+gejuHTML(ge)+yunHTML(yun);
    }catch(err){
      box.classList.remove('hidden');
      box.innerHTML='<div class="m6-note" style="color:var(--red)">'+(err&&err.message||err)+'</div>';
    }
  }
  function bindXiyong(){
    var btn=document.getElementById('btnBazi');
    if(!btn||btn.getAttribute('data-xiyong-bound')==='1') return;
    btn.setAttribute('data-xiyong-bound','1');
    btn.addEventListener('click', function(){
      var E=global.TXMarkSixEngine, per=readPersonal(), sex=currentSex();
      if(!E||!E.xiyongPick||!per||!sex) return;
      var nextBox=document.getElementById('nextDrawBox');
      var dateEl=document.querySelector('.m6-next-v');
      var now=new Date();
      var y=now.getFullYear(), m=now.getMonth()+1, d=now.getDate();
      if(global.__TX_NEXT && global.__TX_NEXT.y){ y=global.__TX_NEXT.y; m=global.__TX_NEXT.m; d=global.__TX_NEXT.d; }
      try{
        var r=E.xiyongPick(per.y,per.m,per.d,per.h,per.min||0,sex,y,m,d);
        var out=document.getElementById('baziOut');
        if(!out) return;
        var nums=(r.numbers||[]).map(function(n){ return '<span class="m6-ball m6-ball--md">'+n+'</span>'; }).join('');
        var extra=gejuHTML({pattern:r.pattern,yong_shen:r.yong_shen,xi_shen:r.xi_shen,ji_shen:r.ji_shen,chou_shen:r.chou_shen,tiaohou:r.tiaohou,zhong_gua:{},note:r.interact});
        var head=out.querySelector('.m6-block-title');
        if(head) head.textContent='喜用合盤 · 15 碼 · '+r.ruleVersion;
        if(!out.querySelector('.ge-wrap')) out.insertAdjacentHTML('beforeend', extra);
      }catch(e){ console.warn(e); }
    });
  }
  function boot(){
    ensureCss();
    var E=global.TXMarkSixEngine;
    function afterEngines(){
      if(!(E&&E.buildYun)){
        var s=document.createElement('script');
        s.src='./tianxi-mingpan.js';
        s.onload=function(){ render(); bindXiyong(); };
        document.head.appendChild(s);
      } else { render(); bindXiyong(); }
    }
    loadScript('./tianxi-geju.js', function(){
      loadScript('./tianxi-xiyong-pick.js', afterEngines);
    });
    document.querySelectorAll('.m6-sex-btn').forEach(function(b){
      if(b.getAttribute('data-natal-bound')==='1') return;
      b.setAttribute('data-natal-bound','1');
      b.addEventListener('click',function(){
        document.querySelectorAll('.m6-sex-btn').forEach(function(x){
          var on=x===b;
          x.classList.toggle('active',on);
          x.setAttribute('aria-pressed',on?'true':'false');
        });
        render();
      });
    });
    var dt=document.getElementById('personalDT');
    if(dt && dt.getAttribute('data-natal-bound')!=='1'){
      dt.setAttribute('data-natal-bound','1');
      dt.addEventListener('input',render);
      dt.addEventListener('change',render);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})(typeof window!=='undefined'?window:globalThis);
