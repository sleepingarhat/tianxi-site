(function(){
  'use strict';
  var RAW='https://raw.githubusercontent.com/sleepingarhat/hk-mark-six-2002-now/main/data/';
  var LATEST_URL=RAW+'latest.json', HISTORY_URL=RAW+'mark-six.json';
  var RED=new Set([1,2,7,8,12,13,18,19,23,24,29,30,34,35,40,45,46]);
  var BLUE=new Set([3,4,9,10,14,15,20,25,26,31,36,37,41,42,47,48]);
  function grp(n){return RED.has(n)?'red':BLUE.has(n)?'blue':'green';}
  function ball(n,size,special){return '<span class="m6-ball m6-ball--'+(size||'md')+' '+grp(n)+(special?' special':'')+'">'+n+'</span>';}
  function ballHit(n,hits,sp){
    var inZheng=hits&&hits.indexOf(n)>=0;
    var isSp=sp!=null&&n===sp;
    var hit=!!(inZheng||isSp);
    var c='m6-ball m6-ball--sm '+grp(n)+(hit?' hit':'')+(isSp?' sp':'');
    return '<span class="'+c+'"'+(hit?' title="命中"':'')+(isSp?' data-sp="1"':'')+'>'+n+'</span>';
  }
  var WD=['日','一','二','三','四','五','六'];
  function money(v){if(v==null||v==='')return'';var n=Number(v);return isNaN(n)?String(v):'$'+n.toLocaleString('en-US');}
  function num(v){var n=Number(v);return isNaN(n)?String(v):n.toLocaleString('en-US');}
  function cnDate(iso){if(!iso)return'';var m=iso.match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return iso;var d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));return +m[1]+'年'+(+m[2])+'月'+(+m[3])+'日（'+WD[d.getUTCDay()]+'）';}
  function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function parseYMD(s){var a=s.split('-');return{y:+a[0],m:+a[1],d:+a[2]};}
  var LATEST=null,HISTORY=[],byDate={},LATEST_YEAR='',PERIOD='100',SORT='num';
  var NEXT=null;
  function engine(){ return window.TXMarkSixEngine || null; }
  function engineReady(fn){
    var E=engine();
    if(!E) return false;
    if(!fn) return true;
    return typeof E[fn]==='function';
  }
  var DESC_SOLO='獨測：攪珠日八字＋奇門，各取15碼。';
  var DESC_BAZI='八字合盤：個人四柱 × 攪珠日四柱。';
  var DESC_QIMEN='奇門合盤：出生時家盤 × 攪珠日奇門盤。';
  var WX_CLS_UI={木:'mu',火:'huo',土:'tu',金:'jin',水:'shui'};
  function nextDrawFrom(lastDate, lastDraw){
    var p=parseYMD(lastDate);
    var d=new Date(p.y, p.m-1, p.d);
    d.setDate(d.getDate()+1);
    for(var i=0;i<14;i++){
      var wd=d.getDay();
      if(wd===2||wd===4||wd===6) break;
      d.setDate(d.getDate()+1);
    }
    var nextDate=ymd(d);
    var nextDraw='';
    if(lastDraw&&lastDraw.length===6&&lastDraw.charAt(2)==='/'){
      var yy=lastDraw.slice(0,2), nn=parseInt(lastDraw.slice(3),10)+1;
      nextDraw=yy+'/'+String(nn).padStart(3,'0');
    }
    return {date:nextDate, draw:nextDraw, y:d.getFullYear(), m:d.getMonth()+1, d:d.getDate(), timeLabel:'21:30 HKT', weekday:WD[d.getDay()]};
  }
  function renderPillarsChart(p,t){
    if(!p)return'';
    var Eng=engine(); var det=(Eng&&Eng.enrichPillars)?Eng.enrichPillars(p):null;
    if(!det||!det.cols){
      return '<div class="m6-meta"><b>'+t+'</b><br>'+p.year+' · '+p.month+' · '+p.day+' · '+p.hour+' · 日主 '+p.dayMaster+'</div>';
    }
    var cols=det.cols.map(function(c){
      return '<div class="bz-col"><div class="bz-lab">'+c.lab+'</div><div class="bz-stem">'+c.gan+'</div><div class="bz-zhi">'+c.zhi+'</div></div>';
    }).join('');
    return '<div class="bz-wrap"><div class="bz-title"><b>'+t+'</b></div><div class="bz-chart">'+cols+'</div></div>';
  }
  function renderNextDraw(){
    var el=document.getElementById('nextDrawBox');
    if(!el||!NEXT){if(el)el.innerHTML='<div class="m6-state">載入下一期資料中…</div>';return;}
    el.innerHTML='<div><b>下一期</b> '+(NEXT.draw||'—')+' · '+cnDate(NEXT.date)+' · '+NEXT.timeLabel+'</div>'+(NEXT.pillars?renderPillarsChart(NEXT.pillars,'攪珠日'):'');
  }
  function renderResult(){
    var el=document.getElementById('m6-result');
    if(!LATEST){el.innerHTML='<div class="m6-state err">未能載入最新攪珠結果。</div>';return;}
    var d=LATEST;
    var ballsHTML='';
    d.numbers.forEach(function(n){ballsHTML+=ball(n,'lg',false);});
    ballsHTML+='<span class="m6-plus">+</span>'+ball(d.special,'lg',true);
    el.innerHTML='<div class="m6-rhead"><span class="draw">第 '+d.draw+' 期</span></div><div class="m6-balls">'+ballsHTML+'</div>';
    var tick=document.getElementById('m6-ticker');
    if(tick) tick.innerHTML='<strong>第 '+d.draw+' 期</strong> · '+d.numbers.join(' ')+' ＋'+d.special;
  }
  function computeStats(periodKey){
    var win;if(periodKey==='ytd')win=HISTORY.filter(function(d){return d.date.slice(0,4)===LATEST_YEAR;});
    else{var n=parseInt(periodKey,10)||100;win=HISTORY.slice(-n);}
    var count={},run={},maxOm={},curOm={};for(var v=1;v<=49;v++){count[v]=0;run[v]=0;maxOm[v]=0;}
    win.forEach(function(d){var has={};d.numbers.forEach(function(x){has[x]=1;});for(var v=1;v<=49;v++){if(has[v]){count[v]++;if(run[v]>maxOm[v])maxOm[v]=run[v];run[v]=0;}else run[v]++;}});
    for(var v=1;v<=49;v++){if(run[v]>maxOm[v])maxOm[v]=run[v];curOm[v]=run[v];}
    return{count:count,maxOm:maxOm,curOm:curOm,n:win.length};
  }
  function renderStats(){
    var grid=document.getElementById('m6-numgrid');
    if(!grid) return;
    var s=computeStats(PERIOD),html='';
    for(var n=1;n<=49;n++) html+='<div class="m6-cell">'+ball(n,'sm')+'<div>開'+s.count[n]+' 遺'+s.curOm[n]+'</div></div>';
    grid.innerHTML=html;
  }
  function buildSeg(id,items,getActive,onPick){
    var box=document.getElementById(id);
    if(!box) return;
    box.innerHTML=items.map(function(it){return '<button data-v="'+it.v+'"'+(it.v===getActive()?' class="active"':'')+'>'+it.label+'</button>';}).join('');
    box.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){onPick(b.getAttribute('data-v'));box.querySelectorAll('button').forEach(function(x){x.classList.remove('active');});b.classList.add('active');});});
  }
  function ballsHTML(nums,hits,sp){return '<div class="m6-nums">'+nums.map(function(n){return ballHit(n,hits,sp);}).join('')+'</div>';}
  function panHTML(pan,t){
    var Eng=engine(); if(Eng&&Eng.qimenBoardHTML) return Eng.qimenBoardHTML(pan,t);
    var di=pan.di_pan,cells=[];[4,9,2,3,5,7,8,1,6].forEach(function(p){cells.push(p+':'+(di[p]||'-'));});
    return '<div class="m6-meta"><b>'+t+'</b><br>'+(pan.yang?'陽':'陰')+'遁'+pan.ju+'局 · 值符宮'+pan.zhi_fu_palace+'</div>';
  }
  function readPersonal(){
    var el=document.getElementById('personalDT');
    if(!el||!el.value)return null;
    var d=new Date(el.value);
    if(isNaN(d.getTime()))return null;
    return{y:d.getFullYear(),m:d.getMonth()+1,d:d.getDate(),h:d.getHours()};
  }
  function setStatus(msg,err){
    var el=document.getElementById('status');
    if(!el) return;
    el.innerHTML=err?'<span style="color:var(--red)">'+msg+'</span>':msg;
  }
  function showPanel(which){
    ['solo','bazi','qimen','bt'].forEach(function(k){
      var el=document.getElementById('panel-'+k);
      if(el)el.classList.toggle('hidden',k!==which);
    });
  }
  function runSolo(){
    if(!engineReady('pureBazi')||!engineReady('pureQimen')||!NEXT){setStatus('引擎未載入完整版，請用無痕視窗重開 /marksix/',true);return;}
    var E=engine();
    showPanel('solo');
    var bz=E.pureBazi(NEXT.y,NEXT.m,NEXT.d), qm=E.pureQimen(NEXT.y,NEXT.m,NEXT.d);
    document.getElementById('soloOut').innerHTML=renderPillarsChart(bz.pillars,'攪珠日八字')+ballsHTML(bz.numbers)+panHTML(qm.pan,'攪珠日奇門')+ballsHTML(qm.numbers);
    setStatus('獨測 · 下一期 '+NEXT.draw);
  }
  function runBaziCombo(){
    if(!engineReady('personalBazi')||!NEXT){setStatus('引擎未載入完整版，請用無痕視窗重開 /marksix/',true);return;}
    var E=engine();
    var per=readPersonal();
    if(!per){setStatus('請先輸入個人出生資料（含時辰）',true);return;}
    showPanel('bazi');
    var r=E.personalBazi(per.y,per.m,per.d,per.h,NEXT.y,NEXT.m,NEXT.d);
    document.getElementById('baziOut').innerHTML=renderPillarsChart(r.personal_pillars,'個人八字')+renderPillarsChart(r.draw_pillars,'攪珠日八字')+ballsHTML(r.numbers);
    setStatus('八字合盤 · 下一期 '+NEXT.draw);
  }
  function runQimenCombo(){
    if(!engineReady('personalQimen')||!NEXT){setStatus('引擎未載入完整版，請用無痕視窗重開 /marksix/',true);return;}
    var E=engine();
    var per=readPersonal();
    if(!per){setStatus('請先輸入個人出生資料（含時辰）',true);return;}
    showPanel('qimen');
    var r=E.personalQimen(per.y,per.m,per.d,per.h,NEXT.y,NEXT.m,NEXT.d);
    document.getElementById('qimenOut').innerHTML=panHTML(r.personal,'個人奇門終身參考盤')+panHTML(r.draw,'攪珠日奇門盤')+ballsHTML(r.numbers);
    setStatus('奇門合盤 · 下一期 '+NEXT.draw);
  }
  function runBacktest(kind){
    var E=engine();
    if(!E||!HISTORY.length){setStatus('歷史未載入',true);return;}
    var needFn={pure_bazi:'pureBazi',pure_qimen:'pureQimen',bazi:'personalBazi',qimen:'personalQimen'}[kind];
    if(needFn&&typeof E[needFn]!=='function'){setStatus('引擎未載入完整版，請用無痕視窗重開 /marksix/',true);return;}
    var needPersonal=(kind==='bazi'||kind==='qimen');
    var per=needPersonal?readPersonal():null;
    if(needPersonal&&!per){setStatus('合盤回測需先輸入個人出生資料',true);return;}
    showPanel('bt');
    setStatus('回測計算中…');
    var slice=HISTORY.slice(-100).slice().reverse();
    var tbody=document.querySelector('#btTable tbody');
    if(!tbody){setStatus('回測表未就緒',true);return;}
    tbody.innerHTML='';
    var sum=0,eq5=0,maxS=0,n=slice.length,i=0;
    function step(){
      for(var k=0;k<6&&i<slice.length;k++,i++){
        var row=slice[i],p=parseYMD(row.date);
        var nums=row.numbers.slice(0,6);
        var sp=row.special!=null?row.special:row.numbers[6];
        var pred;
        if(kind==='pure_bazi') pred=E.pureBazi(p.y,p.m,p.d);
        else if(kind==='pure_qimen') pred=E.pureQimen(p.y,p.m,p.d);
        else if(kind==='bazi') pred=E.personalBazi(per.y,per.m,per.d,per.h,p.y,p.m,p.d);
        else pred=E.personalQimen(per.y,per.m,per.d,per.h,p.y,p.m,p.d);
        var sc=E.scorePred(pred.numbers,nums,sp);
        sum+=sc.score; if(sc.score>=5) eq5++; if(sc.score>maxS) maxS=sc.score;
        var tr=document.createElement('tr');
        tr.innerHTML='<td>'+row.date+'</td><td>'+pred.numbers.join(' ')+'</td><td>'+nums.join(' ')+'</td><td>'+(sc.hit_zheng||[]).join(' ')+'</td><td>'+sc.score+'</td>';
        tbody.appendChild(tr);
      }
      if(i<slice.length) setTimeout(step,0);
      else setStatus('回測完成 · n='+n+' · 平均 '+(sum/n).toFixed(3)+' · ≥5字 '+eq5+' · 最高 '+maxS);
    }
    step();
  }
  function bindModes(){
    var a=document.getElementById('btnSolo'); if(a) a.onclick=function(){try{runSolo();}catch(e){setStatus(e.message,true);}};
    var b=document.getElementById('btnBazi'); if(b) b.onclick=function(){try{runBaziCombo();}catch(e){setStatus(e.message,true);}};
    var c=document.getElementById('btnQimen'); if(c) c.onclick=function(){try{runQimenCombo();}catch(e){setStatus(e.message,true);}};
    document.querySelectorAll('.m6-bt-btn').forEach(function(btn){
      btn.onclick=function(){
        try{runBacktest(btn.getAttribute('data-bt'));}catch(e){setStatus(e.message,true);}
      };
    });
  }
  function setupControls(){
    buildSeg('m6-periods',[{v:'10',label:'近10期'},{v:'50',label:'近50期'},{v:'100',label:'近100期'},{v:'500',label:'近500期'},{v:'ytd',label:'今年至今'}],function(){return PERIOD;},function(v){PERIOD=v;renderStats();});
    buildSeg('m6-sort',[{v:'num',label:'號碼'},{v:'hot',label:'最熱'},{v:'due',label:'最冷'}],function(){return SORT;},function(v){SORT=v;renderStats();});
  }
  function boot(){
    setupControls();
    bindModes();
    Promise.all([
      fetch(LATEST_URL).then(function(r){if(!r.ok)throw 0;return r.json();}).catch(function(){return null;}),
      fetch(HISTORY_URL).then(function(r){if(!r.ok)throw 0;return r.json();}).catch(function(){return null;})
    ]).then(function(res){
      LATEST=res[0];HISTORY=(res[1]||[]).slice().sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
      HISTORY.forEach(function(row){byDate[row.date]=row;});
      LATEST_YEAR=HISTORY.length?HISTORY[HISTORY.length-1].date.slice(0,4):String(new Date().getUTCFullYear());
      renderResult();
      if(HISTORY.length){
        renderStats();
        var last=HISTORY[HISTORY.length-1];
        NEXT=nextDrawFrom(last.date, last.draw);
        if(engine()&&engine().pillarsAt){
          try{NEXT.pillars=engine().pillarsAt(NEXT.y,NEXT.m,NEXT.d,21);}catch(e){}
        }
        renderNextDraw();
      }
      setStatus('歷史 '+(HISTORY.length)+' 期已載入'+(NEXT?' · 下一期 '+NEXT.draw:''));
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
