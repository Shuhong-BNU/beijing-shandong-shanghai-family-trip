// v1.3.3 overlay: per-plan full-route AMap overviews.
(function(){
  const RELEASE='v1.3.3';
  const RELEASE_AT='2026-08-08 16:55 (UTC+8)';
  const SEGMENT_COLORS=['#6d28d9','#ea580c','#0284c7','#16a34a','#db2777','#ca8a04','#0891b2','#7c2d12','#4f46e5','#059669','#c2410c','#0369a1','#9333ea','#15803d'];

  document.title='北京—山东—上海家庭旅行计划 v1.3.3';
  const rel=document.querySelector('.release-status');
  if(rel&&!rel.querySelector('[data-v133-release]'))rel.insertAdjacentHTML('beforeend',`<span data-v133-release><b>${RELEASE}</b>｜${RELEASE_AT}</span>`);

  const style=document.createElement('style');
  style.textContent=`
    .v133-plan-map-card{margin:12px 0;border:1px solid var(--line);border-radius:15px;background:#fff;overflow:hidden}
    .v133-plan-map-card>summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;font-weight:900;background:linear-gradient(90deg,#f7f3ff,#fff)}
    .v133-plan-map-card>summary::-webkit-details-marker{display:none}
    .v133-plan-map-card>summary:before{content:'▸';color:var(--purple);font-weight:900;margin-right:2px}.v133-plan-map-card[open]>summary:before{content:'▾'}
    .v133-plan-map-body{padding:11px 12px 13px}
    .v133-total-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px}
    .v133-total-map{height:620px;border:1px solid var(--line);border-radius:13px;overflow:hidden;background:#eef1f6;position:relative}
    .v133-label-toggle{border:1px solid #cfc7df;background:#fff;color:#49308e;border-radius:9px;padding:7px 10px;font-weight:850;cursor:pointer}
    .v133-label-toggle[disabled]{opacity:.5;cursor:wait}
    .v133-edge-legend{display:flex;gap:6px;overflow-x:auto;max-width:100%;padding:3px 1px 7px;scrollbar-width:thin}
    .v133-edge-chip{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;border:1px solid var(--line);border-radius:999px;background:#fff;padding:4px 7px;font-size:10.5px;line-height:1.2}
    .v133-edge-dot{display:inline-block;width:10px;height:10px;border-radius:50%;flex:none}
    .v133-total-note{font-size:11px;color:var(--sub);margin-top:7px;line-height:1.55}
    .v133-node-pin{display:flex;align-items:center;justify-content:center;min-width:30px;height:30px;padding:0 5px;border-radius:999px;background:#5b3ea6;color:#fff;border:3px solid #fff;font-size:10px;font-weight:950;box-shadow:0 2px 7px rgba(0,0,0,.24);white-space:nowrap}
    .v133-total-label{width:max-content;max-width:220px;padding:5px 7px;border:1px solid rgba(91,62,166,.3);border-radius:8px;background:rgba(255,255,255,.97);box-shadow:0 2px 9px rgba(0,0,0,.14);color:#292331;line-height:1.22;pointer-events:none}
    .v133-total-label .meta{font-size:9px;font-weight:850;color:#725da9;white-space:normal}
    .v133-total-label .name{font-size:11px;font-weight:900;white-space:normal;overflow-wrap:anywhere;margin-top:2px}
    .v133-overview-shell{margin:12px 0}.v133-overview-shell>h3{margin-bottom:4px}
    .v133-current-map{margin-top:12px}
    @media(max-width:700px){.v133-total-map{height:440px}.v133-total-label{max-width:145px}.v133-total-label .meta{font-size:8.5px}.v133-total-label .name{font-size:10px}.v133-node-pin{min-width:27px;height:27px;font-size:9px}.v133-plan-map-card>summary{align-items:flex-start;flex-direction:column;gap:2px}}
  `;
  document.head.appendChild(style);

  function planKeys(code){return Object.keys(MAPDATA).filter(k=>k.startsWith(code+'-d')).sort((a,b)=>(+a.split('d')[1]||0)-(+b.split('d')[1]||0))}
  function edgeId(a,b,m,day){return `${day}|${a}>${b}:${m}`}
  function nodeName(key){return (LOCS[key]||[key])[0]}
  function iconFor(key,name){const t=`${key} ${name}`;if(/Airport|机场/.test(t))return'✈️';if(/Station|North|站/.test(t))return'🚄';if(/Hotel|酒店/.test(t))return'🏨';if(/Liugong|岛/.test(t))return'🏝️';if(/Beach|湾|海水浴场|银滩|海/.test(t))return'🌊';if(/Park|公园|山/.test(t))return'🌳';if(/Tiananmen|城楼|广场/.test(t))return'🏯';return'📍'}

  function buildPlanGraph(code){
    const keys=planKeys(code),nodes=new Map(),edges=[],seenEdges=new Set();let firstOrder=0;
    function addVisit(key,visit){
      if(!key||!coord(key))return;
      let x=nodes.get(key);
      if(!x){x={key,name:nodeName(key),order:++firstOrder,visits:[]};nodes.set(key,x)}
      const sig=`${visit.day}|${visit.date}|${visit.local}|${visit.role||''}`;
      if(!x.visits.some(v=>`${v.day}|${v.date}|${v.local}|${v.role||''}`===sig))x.visits.push(visit);
    }
    function addEdge(a,b,mode,meta){
      if(!coord(a)||!coord(b))return;
      const id=edgeId(a,b,mode,meta.day);if(seenEdges.has(id))return;seenEdges.add(id);
      edges.push({a,b,mode,...meta,index:edges.length});
    }
    keys.forEach((k,di)=>{
      const d=MAPDATA[k],day=di+1,date=dayDate(d);
      (d.nodes||[]).forEach((n,ni)=>addVisit(n[0],{day,date,local:ni+1}));
      for(let i=0;i<(d.nodes||[]).length-1;i++)addEdge(d.nodes[i][0],d.nodes[i+1][0],(d.modes||[])[i]||'taxi',{day,date,localFrom:i+1,localTo:i+2});
    });
    const d8=keys.length?MAPDATA[keys[keys.length-1]]:null,date8=d8?dayDate(d8):'8/26',day8=keys.length||8;
    // Day 8 has two passenger branches. Add them explicitly so every plan's total map shows the full family split.
    if(coord('Hongqiao')){
      addVisit('Hongqiao',{day:day8,date:date8,local:99,role:'分流点'});
      if(coord('GanzhouAirport')){addVisit('GanzhouAirport',{day:day8,date:date8,local:100,role:'爸妈'});addEdge('Hongqiao','GanzhouAirport','flight',{day:day8,date:date8,localFrom:99,localTo:100,role:'爸妈'})}
      if(coord('PVG')&&coord('GuangzhouAirport')){
        addVisit('PVG',{day:day8,date:date8,local:101,role:'女友'});addVisit('GuangzhouAirport',{day:day8,date:date8,local:102,role:'女友'});
        addEdge('Hongqiao','PVG','airportline',{day:day8,date:date8,localFrom:99,localTo:101,role:'女友'});addEdge('PVG','GuangzhouAirport','flight',{day:day8,date:date8,localFrom:101,localTo:102,role:'女友'});
      }
    }
    return{code,keys,nodes:[...nodes.values()].sort((a,b)=>a.order-b.order),edges};
  }

  function visitMeta(node){
    const grouped=[];
    node.visits.sort((a,b)=>a.day-b.day||a.local-b.local).forEach(v=>{
      const role=v.role?` · ${v.role}`:'';
      grouped.push(`Day ${v.day} · ${v.date}${role}`);
    });
    return [...new Set(grouped)].join(' / ');
  }
  function edgeColor(i){return SEGMENT_COLORS[i%SEGMENT_COLORS.length]}
  function edgeModeText(m){return (modeText?.[m]||m).replace(/^\S+\s?/,'')}
  function legendHTML(graph){return graph.edges.map((e,i)=>{const step=e.role?`${e.role}分支`:`${e.localFrom}→${e.localTo}`;return `<span class="v133-edge-chip"><i class="v133-edge-dot" style="background:${edgeColor(i)}"></i>D${e.day} ${e.date} · ${step} ${edgeModeText(e.mode)}</span>`}).join('')}
  function planMapDetails(code,kind='overview'){
    const graph=buildPlanGraph(code),title=PLAN[code]?.name||`方案 ${code}`;
    return `<details class="v133-plan-map-card ${kind==='journey'?'v133-current-map':''}" data-v133-plan-map="${code}"><summary><span>🗺️ ${kind==='journey'?'当前方案':'方案 '+code}｜全程总路线图</span><span class="note">${graph.nodes.length} 个地理节点 · ${graph.edges.length} 段路线 · 点击展开</span></summary><div class="v133-plan-map-body"><div class="v133-total-toolbar"><div><b>${title}</b><div class="note">节点旁直接显示 Day + 日期 + 名称；重复到访同一地点会合并成一个地理节点，并列出全部到访日期。</div></div><button type="button" class="v133-label-toggle" data-v133-label-toggle disabled>隐藏节点详标</button></div><div class="v133-edge-legend">${legendHTML(graph)}</div><div class="v133-total-map" data-v133-map-canvas><div class="map-loading">展开后加载高德全程总路线图</div></div><div class="v133-total-note">相邻路线段使用高对比颜色，并通过高德 Polyline 方向箭头表示行进方向；飞机/铁路/轮渡等长途或特殊交通使用虚线。全国尺度用于看全局顺序，城市内细节仍以每天局部地图为准。</div></div></details>`;
  }

  function intersects(a,b,pad=4){return !(a.r+pad<=b.l||b.r+pad<=a.l||a.b+pad<=b.t||b.b+pad<=a.t)}
  function candidateCenters(w,h){
    const base=[[w/2+22,0],[-w/2-22,0],[0,-h/2-28],[0,h/2+28],[w/2+26,-h/2-25],[-w/2-26,-h/2-25],[w/2+26,h/2+25],[-w/2-26,h/2+25]];
    for(const radius of [70,100,135,175])for(const deg of [0,45,90,135,180,225,270,315]){const r=deg*Math.PI/180;base.push([Math.cos(r)*radius,Math.sin(r)*radius])}
    return base;
  }
  function placeTotalLabels(map,items,canvas){
    const cw=canvas.clientWidth,ch=canvas.clientHeight,zoom=Number(map.getZoom?.()||5),used=[];
    items.forEach(item=>{
      const compact=zoom<=5.5;item.el.classList.toggle('compact',compact);
      item.el.style.fontSize=(zoom<=5?9.5:zoom>=10?11.5:10.5)+'px';
      const box=item.el.getBoundingClientRect(),w=Math.min(box.width||180,cw<700?150:225),h=Math.max(box.height||40,34),p=map.lngLatToContainer(item.lnglat);let choice=null,best=null,bestScore=Infinity;
      for(const [cx,cy] of candidateCenters(w,h)){
        const rect={l:p.x+cx-w/2,t:p.y+cy-h/2,r:p.x+cx+w/2,b:p.y+cy+h/2};
        const outside=Math.max(0,-rect.l)+Math.max(0,-rect.t)+Math.max(0,rect.r-cw)+Math.max(0,rect.b-ch);
        let hits=0;for(const u of used)if(intersects(rect,u))hits++;
        const score=hits*100000+outside*100+Math.hypot(cx,cy);
        if(score<bestScore){bestScore=score;best=[cx,cy,rect]}
        if(hits===0&&outside===0){choice=[cx,cy,rect];break}
      }
      choice=choice||best;if(!choice)return;item.marker.setOffset(new AMap.Pixel(Math.round(choice[0]),Math.round(choice[1])));used.push(choice[2]);
    });
  }

  async function drawPlanTotalMap(fold,code){
    const canvas=fold.querySelector('[data-v133-map-canvas]'),btn=fold.querySelector('[data-v133-label-toggle]');if(!canvas||canvas.dataset.drawn)return;canvas.dataset.drawn='1';
    const c=amapCfg();if(!c.jsKey||(!c.serviceHost&&!c.security)){canvas.innerHTML='<div class="amap-placeholder">高德底图尚未配置；请先完成 JS API + serviceHost 配置。</div>';return}
    try{
      await loadAmap();canvas.innerHTML='';const graph=buildPlanGraph(code),pts=graph.nodes.map(n=>coord(n.key)).filter(Boolean),map=new AMap.Map(canvas,{zoom:5,center:pts[0]||[116.4,39.9],viewMode:'2D'}),labelItems=[];
      graph.nodes.forEach((n,i)=>{
        const p=coord(n.key);if(!p)return;const lnglat=new AMap.LngLat(p[0],p[1]),ico=iconFor(n.key,n.name);
        const pin=document.createElement('div');pin.className='v133-node-pin';pin.textContent=`${ico} ${i+1}`;
        new AMap.Marker({map,position:lnglat,content:pin,anchor:'center',zIndex:220,title:n.name});
        const el=document.createElement('div');el.className='v133-total-label';const meta=document.createElement('div');meta.className='meta';meta.textContent=visitMeta(n);const name=document.createElement('div');name.className='name';name.textContent=`#${i+1} ${ico} ${n.name}`;el.append(meta,name);
        const marker=new AMap.Marker({map,position:lnglat,content:el,anchor:'center',zIndex:210,title:n.name});labelItems.push({marker,el,lnglat,node:n});
      });
      for(let i=0;i<graph.edges.length;i++){
        const e=graph.edges[i],color=edgeColor(i);let path=[];
        try{const m=await jsRouteMetric(e.a,e.b,e.mode);path=(m.polyline||[]).map(p=>new AMap.LngLat(p[0],p[1]))}catch{}
        if(path.length<2){const a=coord(e.a),b=coord(e.b);if(a&&b)path=[new AMap.LngLat(a[0],a[1]),new AMap.LngLat(b[0],b[1])]}
        if(path.length>1)new AMap.Polyline({map,path,strokeColor:color,strokeWeight:e.mode==='flight'||e.mode==='rail'?4:5,strokeOpacity:.88,strokeStyle:['flight','rail','walk','ferry'].includes(e.mode)?'dashed':'solid',showDir:true,zIndex:100+i});
      }
      if(pts.length>1)map.setFitView();
      let labelsOn=true;const arrange=()=>{if(!labelsOn)return;requestAnimationFrame(()=>placeTotalLabels(map,labelItems,canvas))};
      map.on('zoomchange',arrange);map.on('moveend',arrange);map.on('resize',arrange);setTimeout(arrange,150);
      if(btn){btn.disabled=false;btn.textContent='隐藏节点详标';btn.onclick=()=>{labelsOn=!labelsOn;labelItems.forEach(x=>labelsOn?x.marker.show():x.marker.hide());btn.textContent=labelsOn?'隐藏节点详标':'显示节点详标';if(labelsOn)arrange()}}
    }catch(e){canvas.innerHTML=`<div class="amap-placeholder">全程总路线图加载失败：${String(e.message||e)}</div>`}
  }

  function wirePlanFold(fold){if(!fold||fold.dataset.v133Wired)return;fold.dataset.v133Wired='1';const code=fold.dataset.v133PlanMap;fold.addEventListener('toggle',()=>{if(fold.open)drawPlanTotalMap(fold,code)});if(fold.open)drawPlanTotalMap(fold,code)}
  function wireAll(root=document){root.querySelectorAll('[data-v133-plan-map]').forEach(wirePlanFold)}

  async function injectOverviewMaps(){
    await loadBaseline();const quick=document.getElementById('quick');if(!quick||document.getElementById('v133OverviewMaps'))return;
    const comparison=[...quick.querySelectorAll('.card')].find(x=>x.querySelector('h3')?.textContent.includes('五方案一页比较'));
    const shell=document.createElement('div');shell.id='v133OverviewMaps';shell.className='card v133-overview-shell';shell.innerHTML=`<h3>五方案高德全程总路线图</h3><p class="note">A–E 每个方案都把 8 天全部节点放进同一张高德地图；每张图独立折叠，展开后才加载。节点详标默认显示 Day / 日期 / 名称，重复地点合并显示多次到访信息。</p>${Object.keys(PLAN).map(k=>planMapDetails(k)).join('')}`;
    (comparison||quick.lastElementChild)?.insertAdjacentElement('afterend',shell);wireAll(shell);
  }

  const renderJourneyV132=renderJourney;
  renderJourney=async function(){
    await renderJourneyV132();await loadBaseline();const mount=document.getElementById('journeyOverviewMount');if(!mount)return;
    mount.insertAdjacentHTML('beforeend',planMapDetails(selected,'journey'));wireAll(mount);
  };

  loadBaseline().then(injectOverviewMaps).catch(()=>{});
})();
