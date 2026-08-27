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
      return '<div class="m6-meta"><b>'+title+'</b><br>'+p.year+' · '+p.month+' · '+p.day+' · '+p.hour+' · 日主 '+p.dayMaster+'（'+(p.dayMasterWx||'')+'）</div>';
    }
    var cols=det.cols.map(function(c){
      var cang=c.cang.map(function(x){
        return '<span class="bz-cang-item wx-'+x.cls+'">'+x.gan+'<i class="bz-shen">'+x.shen+'</i></span>';
      }).join('');
      return '<div class="bz-col"><div class="bz-lab">'+c.lab+'</div><div class="bz-stem wx-'+c.ganCls+'"><span class="bz-char">'+c.gan+'</span><i class="bz-shen">'+c.ganShen+'</i></div><div class="bz-zhi wx-'+c.zhiCls+'"><span class="bz-char">'+c.zhi+'</span><i class="bz-shen">'+(c.zhiShen||'')+'</i></div><div class="bz-cang">'+cang+'</div></div>';
    }).join('');
    return '<div class="bz-wrap"><div class="bz-title"><b>'+title+'</b> · 日主 <span class="wx-'+(WX_CLS[det.dayMasterWx]||'')+'">'+det.dayMaster+'</span>（'+det.dayMasterWx+'）</div><div class="bz-chart">'+cols+'</div></div>';
  }
  function yunHTML(yun){
    if(!yun) return '';
    var cur=yun.current_dayun||{}, ln=yun.current_liunian||{};
    var rows=(yun.rows||[]).map(function(r){
      return '<tr class="'+(r.current?'now':'')+'"><td>'+r.kind+'</td><td class="yun-gz">'+r.ganzhi+'</td><td>'+r.shi_shen+'</td><td>'+r.xu_sui+'</td><td>'+fmtDT(r.start_solar)+'<br>'+fmtDT(r.end_solar)+'</td></tr>';
    }).join('');
    var lns=(yun.liunian_in_current||[]).map(function(x){
      return '<tr class="'+(x.current?'now':'')+'"><td>'+x.year+'</td><td class="yun-gz">'+x.ganzhi+'</td><td>'+x.shi_shen+'</td></tr>';
    }).join('');
    return '<div class="yun-wrap"><p class="yun-meta">'+yun.sexLabel+' · '+yun.direction+' · 起運節 <b>'+(yun.jie&&yun.jie.name||'')+'</b>（'+fmtDT(yun.jie&&yun.jie.datetime)+'）<br>起運 '+(yun.qiyun_note||'')+' → <b>'+fmtDT(yun.qiyun_solar)+'</b><br>當運 <b>'+(cur.ganzhi||'')+' '+(cur.shi_shen||'')+'</b> · '+(cur.xu_sui||'')+'（'+fmtDT(cur.start_solar)+' ～ '+fmtDT(cur.end_solar)+'）<br>流年 <b>'+(ln.year||'')+' '+(ln.ganzhi||'')+' '+(ln.shi_shen||'')+'</b></p><div class="m6-block-title">大運排盤</div><div style="overflow:auto"><table class="yun-table"><thead><tr><th>限</th><th>干支</th><th>十神</th><th>虛歲</th><th>交運</th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="m6-block-title">當運流年</div><div style="overflow:auto"><table class="yun-table"><thead><tr><th>年</th><th>干支</th><th>十神</th></tr></thead><tbody>'+lns+'</tbody></table></div></div>';
  }
  function ensureCss(){
    if(document.getElementById('tx-mj-css')) return;
    var st=document.createElement('style');
    st.id='tx-mj-css';
    st.textContent='.mj-plus{color:var(--green-2);font-weight:800;font-family:var(--font-mono)}.mj-minus{color:var(--red);font-weight:800;font-family:var(--font-mono)}.mj-score{font-family:var(--font-mono);font-size:18px;margin:0 4px}.mj-how{display:inline-block;margin-left:4px;font-size:10px;color:var(--ink-mute)}.mj-hint{font-size:11px;color:var(--ink-mute)}';
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
    if(!E||!E.pillarsAt){
      box.classList.remove('hidden');
      box.innerHTML='<div class="m6-note">命盤引擎未載入</div>';
      return;
    }
    try{
      var pers=E.pillarsAt(per.y,per.m,per.d,per.h,per.min);
      var mj=(E.scoreMingJu)?E.scoreMingJu(pers,{day:per.d}):null;
      var mjHtml=(E.mingJuHTML&&mj)?E.mingJuHTML(mj):'';
      var yunHtml='';
      if(E.buildYun){
        try{ yunHtml=yunHTML(E.buildYun(per.y,per.m,per.d,per.h,per.min,sex,new Date())); }catch(e){}
      }
      box.classList.remove('hidden');
      box.innerHTML='<div class="m6-block-title">個人命盤</div>'+pillarsChart(pers,'出生四柱')+mjHtml+yunHtml;
    }catch(err){
      box.classList.remove('hidden');
      box.innerHTML='<div class="m6-note" style="color:var(--red)">'+(err&&err.message||err)+'</div>';
    }
  }
  function boot(){
    ensureCss();
    function ready(){ render(); }
    loadScript('./tianxi-wuxing.js?v=wx-20260827', function(){
      loadScript('./tianxi-canggan.js?v=cg-20260827', function(){
        loadScript('./tianxi-mingju.js?v=mj-l1c-20260827', function(){
          if(!(global.TXMarkSixEngine&&global.TXMarkSixEngine.buildYun)){
            loadScript('./tianxi-mingpan.js', ready);
          } else ready();
        });
      });
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
