(function(global){
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
      box.innerHTML='<div class="m6-block-title">個人命盤</div>'+
        '<div class="bz-title"><b>出生四柱</b> · 日主 '+pers.dayMaster+'（'+pers.dayMasterWx+'）</div>'+
        '<div class="m6-meta">'+pers.year+' 　'+pers.month+' 　'+pers.day+' 　'+pers.hour+'</div>'+
        yunHTML(yun);
    }catch(err){
      box.classList.remove('hidden');
      box.innerHTML='<div class="m6-note" style="color:var(--red)">'+(err&&err.message||err)+'</div>';
    }
  }
  function boot(){
    var s=document.createElement('script');
    s.src='./tianxi-mingpan.js';
    s.onload=function(){ render(); };
    document.head.appendChild(s);
    document.querySelectorAll('.m6-sex-btn').forEach(function(b){
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
    if(dt){ dt.addEventListener('input',render); dt.addEventListener('change',render); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})(typeof window!=='undefined'?window:globalThis);
