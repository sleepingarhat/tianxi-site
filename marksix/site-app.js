(function(){
  'use strict';
  var RAW='https://raw.githubusercontent.com/sleepingarhat/hk-mark-six-2002-now/main/data/';
  var LATEST_URL=RAW+'latest.json', HISTORY_URL=RAW+'mark-six.json';
  var RED=new Set([1,2,7,8,12,13,18,19,23,24,29,30,34,35,40,45,46]);
  var BLUE=new Set([3,4,9,10,14,15,20,25,26,31,36,37,41,42,47,48]);
  function grp(n){return RED.has(n)?'red':BLUE.has(n)?'blue':'green';}
  function ball(n,size,special){return '<span class="m6-ball m6-ball--'+(size||'md')+' '+grp(n)+(special?' special':'')+'">'+n+'</span>';}
  function ballHit(n,hits,sp){
    var hit=hits&&hits.indexOf(n)>=0;
    var isSp=sp!=null&&n===sp;
    var c='m6-ball m6-ball--sm '+grp(n)+(hit?' hit':'')+(isSp?' sp':'');
    return '<span class="'+c+'"'+(hit?' title="命中"':'')+'>'+n+'</span>';
  }
  var WD=['日','一','二','三','四','五','六'];
  function money(v){if(v==null||v==='')return'';var n=Number(v);return isNaN(n)?String(v):'$'+n.toLocaleString('en-US');}
  function num(v){var n=Number(v);return isNaN(n)?String(v):n.toLocaleString('en-US');}
  function cnDate(iso){if(!iso)return'';var m=iso.match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return iso;var d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));return +m[1]+'年'+(+m[2])+'月'+(+m[3])+'日（'+WD[d.getUTCDay()]+'）';}
  function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function parseYMD(s){var a=s.split('-');return{y:+a[0],m:+a[1],d:+a[2]};}

  var LATEST=null,HISTORY=[],byDate={},LATEST_YEAR='',PERIOD='100',SORT='num';
  var E=window.TXMarkSixEngine;
  var NEXT=null;

  if(E&&document.getElementById('ruleVer')) document.getElementById('ruleVer').textContent=E.ruleVersion;

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
    if(lastDraw&&/^\d{2}\/\d{3}$/.test(lastDraw)){
      var yy=lastDraw.slice(0,2), nn=parseInt(lastDraw.slice(3),10)+1;
      nextDraw=yy+'/'+String(nn).padStart(3,'0');
    }
    return {date:nextDate, draw:nextDraw, y:d.getFullYear(), m:d.getMonth()+1, d:d.getDate(),
      timeLabel:'21:30 HKT', weekday:WD[d.getDay()]};
  }

  function renderNextDraw(){
    var el=document.getElementById('nextDrawBox');
    if(!el||!NEXT){if(el)el.innerHTML='<div class="m6-state">載入下一期資料中…</div>';return;}
    var pillarsHTML='';
    if(NEXT.pillars){
      var p=NEXT.pillars;
      pillarsHTML='<div class="m6-next-pillars">'+
        '<div class="m6-next-k">八字四柱（攪珠 21:30）</div>'+
        '<div class="m6-next-v">'+p.year+' · '+p.month+' · '+p.day+' · '+p.hour+
        ' <span class="m6-note">日主 '+p.dayMaster+'（'+(p.dayMasterWx||'')+'）</span></div></div>';
    }
    el.innerHTML=
      '<div class="m6-next-grid">'+
        '<div><div class="m6-next-k">下一期期數</div><div class="m6-next-v m6-next-draw">'+(NEXT.draw||'—')+'</div></div>'+
        '<div><div class="m6-next-k">攪珠日期時間</div><div class="m6-next-v">'+cnDate(NEXT.date)+' · '+NEXT.timeLabel+'</div></div>'+
      '</div>'+pillarsHTML;
  }

  function renderResult(){
    var el=document.getElementById('m6-result');
    if(!LATEST){el.innerHTML='<div class="m6-state err">未能載入最新攪珠結果。</div>';return;}
    var d=LATEST;
    var ballsHTML='';
    d.numbers.forEach(function(n){ballsHTML+=ball(n,'lg',false);});
    ballsHTML+='<span class="m6-plus">+</span>'+ball(d.special,'lg',true);
    var prizes=d.prizes||[],showUnits=prizes.some(function(p){return p.winningUnit!=null&&p.winningUnit!=='';});
    var showDividend=prizes.some(function(p){return p.dividend!=null&&p.dividend!=='';});
    var prizeRows='';
    var TIER_CN={1:'頭獎',2:'二獎',3:'三獎',4:'四獎',5:'五獎',6:'六獎',7:'七獎'};
    prizes.forEach(function(p){
      prizeRows+='<tr'+(p.tier===1?' class="t1"':'')+'><td>'+(TIER_CN[p.tier]||('第'+p.tier+'獎'))+'</td>';
      if(showUnits)prizeRows+='<td>'+num(p.winningUnit)+'</td>';
      if(showDividend)prizeRows+='<td class="amt">'+money(p.dividend)+'</td>';
      prizeRows+='</tr>';
    });
    el.innerHTML=
      '<div class="m6-rhead"><span class="draw">第 '+d.draw+' 期</span><span class="date">'+cnDate(d.date)+'</span>'+
      (d.snowball?'<span class="m6-snow">'+d.snowball+'</span>':'')+'</div>'+
      '<div class="m6-balls">'+ballsHTML+'</div>'+
      '<div class="m6-balls-cap">正碼六粒 · 特別號碼一粒</div>'+
      (prizeRows?'<table class="m6-prize"><thead><tr><th>獎級</th>'+(showUnits?'<th>中獎注數</th>':'')+(showDividend?'<th>派彩</th>':'')+'</tr></thead><tbody>'+prizeRows+'</tbody></table>':'')+
      '<div class="m6-rfoot">'+
        '<div class="m6-stat"><div class="k">投注額</div><div class="v">'+money(d.totalInvestment)+'</div></div>'+
        '<div class="m6-stat"><div class="k">頭獎基金</div><div class="v">'+money(d.jackpot||d.firstPrizeDividend)+'</div></div>'+
      '</div>';
    document.getElementById('m6-ticker').innerHTML='<strong>第 '+d.draw+' 期</strong> · '+d.numbers.join(' ')+' ＋'+d.special+' · '+cnDate(d.date)+(d.snowball?' · '+d.snowball:'');
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
    var s=computeStats(PERIOD),grid=document.getElementById('m6-numgrid'),maxCount=0;
    for(var i=1;i<=49;i++)if(s.count[i]>maxCount)maxCount=s.count[i];
    var order=[];for(var n=1;n<=49;n++)order.push(n);
    if(SORT==='hot')order.sort(function(a,b){return s.count[b]-s.count[a]||a-b;});
    else if(SORT==='due')order.sort(function(a,b){return s.curOm[b]-s.curOm[a]||a-b;});
    var html='';order.forEach(function(n){var heat=maxCount?(s.count[n]/maxCount)*100:0;
      html+='<div class="m6-cell"><div class="heat" style="height:'+heat+'%"></div>'+ball(n,'sm')+
        '<div class="row"><span>開</span><b>'+s.count[n]+'</b></div><div class="row"><span>遺</span><b class="'+(s.curOm[n]>=10?'due':'')+'">'+s.curOm[n]+'</b></div><div class="row"><span>期</span><b>'+s.maxOm[n]+'</b></div></div>';});
    grid.innerHTML=html;
  }
  function buildSeg(id,items,getActive,onPick){
    var box=document.getElementById(id);
    box.innerHTML=items.map(function(it){return '<button data-v="'+it.v+'"'+(it.v===getActive()?' class="active"':'')+'>'+it.label+'</button>';}).join('');
    box.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){onPick(b.getAttribute('data-v'));box.querySelectorAll('button').forEach(function(x){x.classList.remove('active');});b.classList.add('active');});});
  }
  function ballsHTML(nums,hits,sp){return '<div class="m6-nums">'+nums.map(function(n){return ballHit(n,hits,sp);}).join('')+'</div>';}
  function pillarsHTML(p,t){return '<div class="m6-meta"><b>'+t+'</b><br>'+p.year+' · '+p.month+' · '+p.day+' · '+p.hour+' · 日主 '+p.dayMaster+'（'+(p.dayMasterWx||'')+'）</div>';}
  function panHTML(pan,t){var di=pan.di_pan,cells=[];[4,9,2,3,5,7,8,1,6].forEach(function(p){cells.push(p+':'+(di[p]||'-'));});
    return '<div class="m6-meta"><b>'+t+'</b><br>'+(pan.yang?'陽':'陰')+'遁'+pan.ju+'局 '+pan.yuan+' · 值符宮'+pan.zhi_fu_palace+(pan.shi_gan_palace!=null?' · 時乾宮'+pan.shi_gan_palace:'')+
      '<br><span class="m6-note">地盤 '+cells.join(' · ')+'</span>'+(pan.meta?'<br><span class="m6-note">節氣 '+pan.meta.jie+(pan.meta.fu_tou_gz?' 符頭'+pan.meta.fu_tou_gz:'')+' · '+(pan.meta.method||'')+'</span>':'')+'</div>';}

  function readPersonal(){
    var v=document.getElementById('personalDT').value;
    if(!v)return null;
    var d=new Date(v);
    if(isNaN(d.getTime()))return null;
    return{y:d.getFullYear(),m:d.getMonth()+1,d:d.getDate(),h:d.getHours()};
  }
  function setStatus(msg,err){
    var el=document.getElementById('status');
    el.innerHTML=err?'<span style="color:var(--red)">'+msg+'</span>':msg;
  }
  function showPanel(which){
    ['solo','bazi','qimen','bt'].forEach(function(k){
      var el=document.getElementById('panel-'+k);
      if(el)el.classList.toggle('hidden',k!==which);
    });
    document.querySelectorAll('.m6-mode-btn').forEach(function(b){
      b.classList.toggle('active',b.getAttribute('data-mode')===which);
    });
  }

  function runSolo(){
    if(!E||!NEXT){setStatus('引擎或下一期未就緒',true);return;}
    showPanel('solo');
    var bz=E.pureBazi(NEXT.y,NEXT.m,NEXT.d), qm=E.pureQimen(NEXT.y,NEXT.m,NEXT.d);
    document.getElementById('soloOut').innerHTML=
      '<div class="m6-block">'+
        '<div class="m6-block-title">純八字 · 15 碼</div>'+
        pillarsHTML(bz.pillars,'攪珠日八字')+
        ballsHTML(bz.numbers)+
        '<p class="m6-note">'+bz.method.anchor+' · '+bz.method.weights+' · '+bz.method.pick+'</p>'+
      '</div>'+
      '<div class="m6-block">'+
        '<div class="m6-block-title">純奇門 · 15 碼</div>'+
        panHTML(qm.pan,'攪珠日奇門')+
        ballsHTML(qm.numbers)+
        '<p class="m6-note">'+qm.method.dingju+' · '+qm.method.extract+'</p>'+
      '</div>';
    setStatus('八字與奇門獨測 · 下一期 '+NEXT.draw+'（'+NEXT.date+'）');
  }

  function runBaziCombo(){
    if(!E||!NEXT){setStatus('引擎或下一期未就緒',true);return;}
    var per=readPersonal();
    if(!per){setStatus('請先輸入個人出生資料（含時辰）',true);return;}
    showPanel('bazi');
    var r=E.personalBazi(per.y,per.m,per.d,per.h,NEXT.y,NEXT.m,NEXT.d);
    document.getElementById('baziOut').innerHTML=
      pillarsHTML(r.personal_pillars,'個人八字')+
      pillarsHTML(r.draw_pillars,'攪珠日八字')+
      '<div class="m6-block-title" style="margin-top:12px">八字合盤 · 15 碼</div>'+
      ballsHTML(r.numbers)+
      '<p class="m6-note">個人盤權重 + 攪珠日盤權重融合後五段各取 3 碼</p>';
    setStatus('八字合盤 · 下一期 '+NEXT.draw);
  }

  function runQimenCombo(){
    if(!E||!NEXT){setStatus('引擎或下一期未就緒',true);return;}
    var per=readPersonal();
    if(!per){setStatus('請先輸入個人出生資料（含時辰）',true);return;}
    showPanel('qimen');
    var r=E.personalQimen(per.y,per.m,per.d,per.h,NEXT.y,NEXT.m,NEXT.d);
    document.getElementById('qimenOut').innerHTML=
      panHTML(r.personal,'個人奇門終身參考盤（出生時起）')+
      panHTML(r.draw,'攪珠日奇門盤')+
      '<div class="m6-block-title" style="margin-top:12px">奇門合盤 · 15 碼</div>'+
      ballsHTML(r.numbers)+
      '<p class="m6-note">攪珠盤分數 ×1 + 個人盤分數 ×0.75 融合後五段各取 3 碼</p>';
    setStatus('奇門合盤 · 下一期 '+NEXT.draw);
  }

  function runBacktest(kind){
    if(!E||!HISTORY.length){setStatus('歷史未載入',true);return;}
    showPanel('bt');
    var needPersonal=(kind==='bazi'||kind==='qimen');
    var per=needPersonal?readPersonal():null;
    if(needPersonal&&!per){setStatus('合盤回測需先輸入個人出生資料',true);return;}

    setStatus('回測計算中…');
    var slice=HISTORY.slice(-100);
    var tbody=document.querySelector('#btTable tbody');
    tbody.innerHTML='';
    var sum=0,sumB=0,sumQ=0,eq5=0,maxS=0,n=slice.length;
    var modeLabel=kind==='solo'?'八字與奇門獨測':(kind==='bazi'?'八字合盤':'奇門合盤');
    document.getElementById('btModeLabel').textContent=modeLabel+' · 近 '+n+' 期';

    var thead=document.querySelector('#btTable thead tr');
    if(kind==='solo'){
      thead.innerHTML='<th>日期</th><th>期數</th><th>八字預測</th><th>奇門預測</th><th>官方結果</th><th>八字命中</th><th>奇門命中</th>';
    }else{
      thead.innerHTML='<th>日期</th><th>期數</th><th>預測15碼</th><th>官方結果</th><th>命中號碼</th><th>得分</th>';
    }

    var i=0;
    function step(){
      for(var k=0;k<6&&i<slice.length;k++,i++){
        var row=slice[i],p=parseYMD(row.date);
        var nums=row.numbers.slice(0,6);
        var sp=row.special!=null?row.special:row.numbers[6];
        var official=nums.join(' ')+' +'+sp;
        var tr=document.createElement('tr');

        if(kind==='solo'){
          var bz=E.pureBazi(p.y,p.m,p.d), qm=E.pureQimen(p.y,p.m,p.d);
          var sb=E.scorePred(bz.numbers,nums,sp), sq=E.scorePred(qm.numbers,nums,sp);
          sumB+=sb.score;sumQ+=sq.score;
          if(sb.score>=5)eq5++;if(sq.score>=5)eq5++;
          if(sb.score>maxS)maxS=sb.score;if(sq.score>maxS)maxS=sq.score;
          tr.innerHTML=
            '<td>'+row.date+'</td><td>'+(row.draw||'')+'</td>'+
            '<td><div class="m6-nums-mini">'+bz.numbers.map(function(x){return ballHit(x,sb.hit_zheng,sp);}).join('')+'</div></td>'+
            '<td><div class="m6-nums-mini">'+qm.numbers.map(function(x){return ballHit(x,sq.hit_zheng,sp);}).join('')+'</div></td>'+
            '<td>'+official+'</td>'+
            '<td class="m6-score'+(sb.score>=5?' hi':'')+'">'+sb.score+(sb.hit_special?'★':'')+'</td>'+
            '<td class="m6-score'+(sq.score>=5?' hi':'')+'">'+sq.score+(sq.hit_special?'★':'')+'</td>';
        }else{
          var pred,sc;
          if(kind==='bazi'){
            pred=E.personalBazi(per.y,per.m,per.d,per.h,p.y,p.m,p.d);
          }else{
            pred=E.personalQimen(per.y,per.m,per.d,per.h,p.y,p.m,p.d);
          }
          sc=E.scorePred(pred.numbers,nums,sp);
          sum+=sc.score;if(sc.score>=5)eq5++;if(sc.score>maxS)maxS=sc.score;
          var hitStr=(sc.hit_zheng||[]).join(' ')+(sc.hit_special?' +特'+sp:'');
          tr.innerHTML=
            '<td>'+row.date+'</td><td>'+(row.draw||'')+'</td>'+
            '<td><div class="m6-nums-mini">'+pred.numbers.map(function(x){return ballHit(x,sc.hit_zheng,sp);}).join('')+'</div></td>'+
            '<td>'+official+'</td>'+
            '<td>'+(hitStr||'—')+'</td>'+
            '<td class="m6-score'+(sc.score>=5?' hi':'')+'">'+sc.score+(sc.hit_special?'★':'')+'</td>';
        }
        tbody.appendChild(tr);
      }
      if(i<slice.length){
        setStatus('回測 '+i+'/'+slice.length+'…');
        setTimeout(step,0);
      }else{
        var stats='';
        if(kind==='solo'){
          stats='<div class="m6-statgrid">'+
            '<div class="m6-statbox"><div class="k">純八字平均</div><div class="v">'+(sumB/n).toFixed(3)+'</div></div>'+
            '<div class="m6-statbox"><div class="k">純奇門平均</div><div class="v">'+(sumQ/n).toFixed(3)+'</div></div>'+
            '<div class="m6-statbox"><div class="k">單術 ≥5 字次數</div><div class="v">'+eq5+'</div></div>'+
            '<div class="m6-statbox"><div class="k">最高單期</div><div class="v">'+maxS+'</div></div></div>';
        }else{
          stats='<div class="m6-statgrid">'+
            '<div class="m6-statbox"><div class="k">整體平均命中</div><div class="v">'+(sum/n).toFixed(3)+'</div></div>'+
            '<div class="m6-statbox"><div class="k">≥5 字期數</div><div class="v">'+eq5+'</div></div>'+
            '<div class="m6-statbox"><div class="k">最高單期</div><div class="v">'+maxS+'</div></div>'+
            '<div class="m6-statbox"><div class="k">回測期數</div><div class="v">'+n+'</div></div></div>';
        }
        document.getElementById('btStats').innerHTML=stats;
        setStatus('回測完成 · '+modeLabel+' · n='+n);
      }
    }
    step();
  }

  var INFO={
    solo:{
      title:'八字與奇門獨測',
      body:'【純八字】以下一期攪珠日 21:30 HKT 起四柱；權重時4／日3／月2／年1.5＋日主河圖1；五段（1–9…40–49）各取最高 3 碼，共 15 碼。\n\n【純奇門】拆補定局（符頭地支定元＋節氣口訣定局，不置閏）；取數＝時乾落宮字尾＋範洪五行數＋宮先後天；同樣五段各 3 碼。\n\n兩術獨立，不合併。'
    },
    bazi:{
      title:'八字合盤',
      body:'個人出生四柱 × 下一期攪珠日四柱。\n攪珠盤權重：時4 日3 月2 年1.5＋日主1；個人盤權重：日3 時2.5 月2 年1.5＋日主1。\n兩盤分數相加後，按五段目標各取 3 碼，輸出 15 碼。\n需先填寫「輸入個人出生資料」。'
    },
    qimen:{
      title:'奇門合盤',
      body:'個人奇門＝以出生時辰起時家奇門終身參考盤；攪珠奇門＝下一期攪珠日 21:30 起盤。\n定局：拆補（blog/407 口訣）。\n取數：時乾落宮＋範洪數＋宮先後天。\n融合：攪珠盤 ×1 ＋ 個人盤 ×0.75，再五段各取 3 碼。\n需先填寫「輸入個人出生資料」。'
    }
  };
  function bindInfo(){
    document.querySelectorAll('[data-info]').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        var key=btn.getAttribute('data-info');
        var pop=document.getElementById('infoPop');
        var meta=INFO[key];if(!meta)return;
        var rect=btn.getBoundingClientRect();
        document.getElementById('infoPopTitle').textContent=meta.title;
        document.getElementById('infoPopBody').textContent=meta.body;
        pop.classList.remove('hidden');
        var top=window.scrollY+rect.bottom+8;
        var left=Math.min(window.scrollX+rect.left, window.scrollX+window.innerWidth-300);
        pop.style.top=top+'px';
        pop.style.left=Math.max(12,left)+'px';
      });
    });
    document.getElementById('infoPopClose').onclick=function(){document.getElementById('infoPop').classList.add('hidden');};
    document.addEventListener('click',function(){var p=document.getElementById('infoPop');if(p)p.classList.add('hidden');});
  }

  function bindModes(){
    document.getElementById('btnSolo').onclick=function(){try{runSolo();}catch(e){setStatus(e.message,true);console.error(e);}};
    document.getElementById('btnBazi').onclick=function(){try{runBaziCombo();}catch(e){setStatus(e.message,true);console.error(e);}};
    document.getElementById('btnQimen').onclick=function(){try{runQimenCombo();}catch(e){setStatus(e.message,true);console.error(e);}};
    document.getElementById('btnBT').onclick=function(){
      var kind=document.getElementById('btKind').value||'solo';
      try{runBacktest(kind);}catch(e){setStatus(e.message,true);console.error(e);}
    };
  }

  function setupControls(){
    buildSeg('m6-periods',[{v:'10',label:'近10期'},{v:'50',label:'近50期'},{v:'100',label:'近100期'},{v:'500',label:'近500期'},{v:'ytd',label:'今年至今'}],function(){return PERIOD;},function(v){PERIOD=v;renderStats();});
    buildSeg('m6-sort',[{v:'num',label:'號碼'},{v:'hot',label:'最熱'},{v:'due',label:'最冷'}],function(){return SORT;},function(v){SORT=v;renderStats();});
  }

  function boot(){
    setupControls();
    bindModes();
    bindInfo();
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
        if(E&&E.pillarsAt){
          try{NEXT.pillars=E.pillarsAt(NEXT.y,NEXT.m,NEXT.d,21);}catch(e){console.warn(e);}
        }
        renderNextDraw();
      }else{
        document.getElementById('m6-numgrid').innerHTML='<div class="m6-state err">未能載入歷史。</div>';
      }
      setStatus('歷史 '+(HISTORY.length)+' 期已載入'+(NEXT?' · 下一期 '+NEXT.draw:''));
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
