// v1.3.1 UX/performance/content overlay. Loaded only by /v131/.
(function(){
  const RELEASE='v1.3.1';
  const RELEASE_AT='2026-08-08 16:11 (UTC+8)';
  const STAGE_COLORS=['#6d28d9','#ea580c','#0284c7','#16a34a','#db2777','#ca8a04','#0891b2','#7c2d12','#4f46e5','#059669'];

  function esc(s){return String(s??'').replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]))}
  function nodeIcon(key,name){const t=`${key} ${name}`;if(/Airport|机场/.test(t))return'✈️';if(/Station|North|站/.test(t))return'🚄';if(/Hotel|酒店/.test(t))return'🏨';if(/Liugong|岛/.test(t))return'🏝️';if(/Beach|湾|海水浴场|银滩|海/.test(t))return'🌊';if(/Park|公园|山/.test(t))return'🌳';return'📍'}
  function dayNodeIndex(d,key){const i=d?.nodes?.findIndex(n=>n[0]===key);return i>=0?i:0}
  function dayEdgeIndex(d,a,b){const ns=d?.nodes||[];for(let i=0;i<ns.length-1;i++)if(ns[i][0]===a&&ns[i+1][0]===b)return i;return 0}
  function dayEdgeMode(d,a,b){const i=dayEdgeIndex(d,a,b);return d?.modes?.[i]||'taxi'}

  document.title='北京—山东—上海家庭旅行计划 v1.3.1';
  const rel=document.querySelector('.release-status');
  if(rel&&!rel.querySelector('[data-v131-release]'))rel.insertAdjacentHTML('beforeend',`<span data-v131-release><b>${RELEASE}</b>｜${RELEASE_AT}</span>`);

  const style=document.createElement('style');
  style.textContent=`
    .day-map-fold{border:1px solid var(--line);border-radius:14px;background:#fbfbfe;margin:12px 0;overflow:hidden}
    .day-map-fold>summary{cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px;font-weight:900;background:#f7f4fc}
    .day-map-fold>.map-fold-body{padding:10px 12px 12px}
    .map-toolbar{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:8px 0}
    .map-label-toggle{border:1px solid #cfc7df;background:#fff;color:#49308e;border-radius:9px;padding:7px 10px;font-weight:800;cursor:pointer}
    .map-label-toggle[disabled]{opacity:.5;cursor:wait}
    .stage-legend{display:flex;gap:6px;flex-wrap:wrap;font-size:11px}
    .stage-chip{display:inline-flex;align-items:center;gap:5px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:3px 7px;white-space:nowrap}
    .stage-dot{width:10px;height:10px;border-radius:50%;display:inline-block;flex:none}
    .amap-canvas{position:relative}
    .map-name-overlay{position:absolute;left:8px;right:8px;top:8px;z-index:500;pointer-events:none;display:none}
    .map-name-overlay.show{display:block}
    .map-name-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;max-width:660px}
    .map-name-item{display:flex;align-items:center;gap:6px;min-width:0;background:rgba(255,255,255,.94);border:1px solid rgba(91,62,166,.18);box-shadow:0 2px 8px rgba(0,0,0,.08);border-radius:8px;padding:4px 7px;font-size:11px;line-height:1.3}
    .map-name-item b{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;border-radius:999px;background:#5b3ea6;color:#fff;font-size:10px}
    .map-name-item span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .v131-pin{display:flex;align-items:center;gap:2px;transform:translate(-50%,-50%);filter:drop-shadow(0 2px 3px rgba(0,0,0,.2))}
    .v131-pin .ico{font-size:15px;line-height:1}
    .v131-pin .num{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#5b3ea6;color:#fff;border:3px solid #fff;font-size:12px;font-weight:900}
    .corridor-note{margin:8px 0 10px;padding:9px 11px;border-radius:10px;background:#eef7f7;border-left:4px solid #247f83;font-size:12px}
    .photo-source-panel.v131{background:#eef7f7;border-left:4px solid #247f83;padding:9px 11px;border-radius:10px;margin:8px 0;font-size:12px}
    @media(max-width:700px){.map-name-grid{grid-template-columns:1fr}.map-name-item{font-size:10.5px}.stage-legend{max-width:100%;overflow-x:auto;flex-wrap:nowrap}}
  `;
  document.head.appendChild(style);

  // ---- v1.3.1 content additions before v1.3.0 initUI enhances/sorts tables ----
  function findCityTable(prefix){for(const h of document.querySelectorAll('#attractions h3')){if(h.textContent.trim().startsWith(prefix))return h.nextElementSibling?.querySelector?.('table.attr')||null}return null}
  function addAttractionRows(){
    const t=findCityTable('威海');
    if(!t||t.dataset.v131Corridor)return;
    t.dataset.v131Corridor='1';
    t.closest('.table-wrap')?.insertAdjacentHTML('beforebegin','<div class="corridor-note"><b>🚗 胶东自驾走廊补充：</b>乳山属于威海市，银滩/大乳山更接近青岛→威海南线；东浦湾、逍遥湾、海驴岛、天鹅湖属于威海→荣成东部海岸线。它们进入景点池，但不等于主推方案全部去。</div>');
    const rows=[
      ['乳山银滩旅游度假区','A-/B+','60–120分钟','★★★','★★','4A；开放式滨海度假区；是否进入当日路线看青岛→威海自驾走法','青岛→威海南线最有代表性的海岸补充；铁路方案不专程绕行。'],
      ['大乳山滨海旅游度假区','B','2–4小时','★★★','★★','乳山4A滨海度假区；需单独留出较完整时段','适合跨城自驾且偏自然度假时选；本次时间紧不与银滩同时深游。'],
      ['东浦湾 / 逍遥湾','B+','30–60分钟','★★–★★★','★','威海东部环海自驾沿线开放式海岸点','若走威海→荣成海岸线可短停，价值在顺路，不值得单独跨城追。'],
      ['海驴岛','B+','1.5–2.5小时','★★★★','★★','海岛/海上项目受天气、船班影响','海鸟与海岸辨识度高，但会显著增加船班变量；与刘公岛不建议连续两天都做海岛重项目。'],
      ['荣成天鹅湖','B','30–60分钟','★★','★','荣成好运角滨水点；季节性很强','冬季天鹅价值最高；8月主要作为沿海景观补充，不按“看天鹅”预期安排。']
    ];
    for(const r of rows){
      const tr=document.createElement('tr');
      tr.innerHTML=`<td><b>${r[0]}</b></td><td><span class="prio ${r[1].startsWith('A')?'pA':'pB'}">${r[1]}</span></td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]} <a class="src" href="https://wlj.weihai.gov.cn/art/2026/5/8/art_162556_4824985.html" target="_blank" rel="noopener">↗ 威海文旅</a></td><td>${r[6]} <a class="src" href="https://www.weihai.gov.cn/art/2025/7/14/art_58817_5646131.html" target="_blank" rel="noopener">↗ 自驾线路</a></td>`;
      t.tBodies[0].appendChild(tr);
    }
  }

  function promoteTiananmen(){
    const t=findCityTable('北京');if(!t)return;
    for(const tr of t.tBodies[0].rows){if(tr.cells[0]?.textContent.includes('天安门城楼')){tr.cells[1].innerHTML='<span class="prio pA">A</span>';tr.cells[6].innerHTML='第一次北京且不进故宫时，城楼是很有辨识度的轻量替代；与广场同区但体验不同。 <a class="src" href="https://english.beijing.gov.cn/latest/news/202509/t20250906_4192380.html" target="_blank" rel="noopener">↗ 预约规则</a>';break}}
  }

  function patchBooking(){
    const sec=document.getElementById('booking');if(!sec)return;
    const tables=sec.querySelectorAll('table');
    const quick=tables[0],dated=tables[1];
    if(quick){for(const tr of quick.tBodies[0].rows){if(tr.cells[0]?.textContent.includes('天安门城楼')){tr.cells[1].innerHTML='每日17:00放票，可预约次日起7日内；至少提前1日 <a class="src" href="https://english.beijing.gov.cn/latest/news/202509/t20250906_4192380.html" target="_blank" rel="noopener">↗ 官方规则</a>';tr.cells[4].textContent='8/20如登城楼，建议8/13 17:00就抢；60岁及以上虽免票也要预约';break}}}
    if(dated&&!dated.dataset.v131Tiananmen){
      dated.dataset.v131Tiananmen='1';
      const tr=document.createElement('tr');
      tr.innerHTML='<td><b>8/13 17:00</b></td><td><b>抢8/20天安门城楼</b></td><td>天安门城楼参观预约官网 / 微信公众号</td><td>每日17:00放出次日起7日内票；无当日票和现场票。成人15元，60岁及以上预约后免费。 <a class="src" href="https://english.beijing.gov.cn/latest/news/202509/t20250906_4192380.html" target="_blank" rel="noopener">↗ 官方规则</a></td><td><span class="prio pA">A</span></td>';
      const target=[...dated.tBodies[0].rows].find(x=>x.cells[0]?.textContent.includes('8/13 20:00'));
      target?dated.tBodies[0].insertBefore(tr,target):dated.tBodies[0].appendChild(tr);
    }
  }

  if(typeof SCORES==='object'){
    SCORES['天安门城楼']=91;
    SCORES['乳山银滩旅游度假区']=81;SCORES['大乳山滨海旅游度假区']=75;SCORES['东浦湾 / 逍遥湾']=77;SCORES['海驴岛']=79;SCORES['荣成天鹅湖']=72;
  }
  if(typeof NOTES==='object'){
    NOTES['天安门城楼']='登城楼看中轴线，轻量且辨识度高';
    NOTES['乳山银滩旅游度假区']='青威南线自驾最顺路的海岸补充之一';NOTES['大乳山滨海旅游度假区']='山海度假型，时间成本高于短停型海岸';NOTES['东浦湾 / 逍遥湾']='威海东部海岸自驾顺路短停';NOTES['海驴岛']='海鸟与海岛体验强，但受船班天气影响';NOTES['荣成天鹅湖']='季节性明显，8月价值低于冬季';
  }
  if(typeof PHOTO_ALIAS==='object'){
    PHOTO_ALIAS['乳山银滩旅游度假区']='Rushan Silver Beach Weihai';PHOTO_ALIAS['大乳山滨海旅游度假区']='Darushan Weihai';PHOTO_ALIAS['东浦湾 / 逍遥湾']='Weihai Xiaoyaowan coast';PHOTO_ALIAS['海驴岛']='Hailv Island Weihai';PHOTO_ALIAS['荣成天鹅湖']='Rongcheng Swan Lake Weihai';
  }
  addAttractionRows();promoteTiananmen();patchBooking();

  // ---- Photo performance: curated direct thumbs for first screen + persistent cache + limited concurrency ----
  const STATIC_PHOTOS={
    'Tiananmen Beijing':{thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Front_view_of_Tiananmen_gate_from_north_end_of_Tiananmen_Square.jpg/330px-Front_view_of_Tiananmen_gate_from_north_end_of_Tiananmen_Square.jpg',url:'https://commons.wikimedia.org/wiki/File:Front_view_of_Tiananmen_gate_from_north_end_of_Tiananmen_Square.jpg',credit:'Daniel Case',license:'CC BY-SA 3.0'},
    'Tiananmen gate':{thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Front_view_of_Tiananmen_gate_from_north_end_of_Tiananmen_Square.jpg/330px-Front_view_of_Tiananmen_gate_from_north_end_of_Tiananmen_Square.jpg',url:'https://commons.wikimedia.org/wiki/File:Front_view_of_Tiananmen_gate_from_north_end_of_Tiananmen_Square.jpg',credit:'Daniel Case',license:'CC BY-SA 3.0'},
    'Qingdao Zhanqiao':{thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Qingdao_Zhanqiao.jpg/330px-Qingdao_Zhanqiao.jpg',url:'https://commons.wikimedia.org/wiki/File:Qingdao_Zhanqiao.jpg',credit:'Vitsuha',license:'CC BY-SA 4.0'},
    'Weihai Liugong Island':{thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Liu_Gong_Island.jpg/330px-Liu_Gong_Island.jpg',url:'https://commons.wikimedia.org/wiki/File:Liu_Gong_Island.jpg',credit:'Yue03090616',license:'CC BY-SA 4.0'},
    'Shanghai Bund skyline':{thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Shanghai_skyline_from_the_bund.jpg/330px-Shanghai_skyline_from_the_bund.jpg',url:'https://commons.wikimedia.org/wiki/File:Shanghai_skyline_from_the_bund.jpg',credit:'Nkon21 / source CC0',license:'CC0'}
  };
  if(typeof commonsPhoto==='function'){
    const baseCommonsPhoto=commonsPhoto;
    let active=0;const wait=[];const LIMIT=3;
    const slot=async(fn)=>{if(active>=LIMIT)await new Promise(r=>wait.push(r));active++;try{return await fn()}finally{active--;wait.shift()?.()}};
    commonsPhoto=async function(query){
      if(STATIC_PHOTOS[query])return STATIC_PHOTOS[query];
      let disk={};try{disk=JSON.parse(localStorage.getItem('trip:photo-cache-v131')||'{}')}catch{}
      if(disk[query]?.thumb)return disk[query];
      return slot(async()=>{const x=await baseCommonsPhoto(query);if(x){disk[query]=x;try{localStorage.setItem('trip:photo-cache-v131',JSON.stringify(disk))}catch{}}return x});
    };
    const v131PhotoObs=new IntersectionObserver(es=>es.forEach(async e=>{if(!e.isIntersecting)return;v131PhotoObs.unobserve(e.target);const q=e.target.dataset.photoQuery,x=await commonsPhoto(q);if(!x)return;e.target.innerHTML=`<img class="real-photo" loading="lazy" decoding="async" src="${x.thumb}" alt="${esc(q)}" referrerpolicy="no-referrer"><a class="photo-credit" href="${x.url}" target="_blank" rel="noopener">${x.license} · ${x.credit}</a>`}),{rootMargin:'60px'});
    observePhotos=function(root=document){root.querySelectorAll('[data-photo-query]').forEach(x=>v131PhotoObs.observe(x))};
  }

  // ---- Map UX: collapsible maps, stage colors, node-name toggle ----
  function buildLegend(nodes,d){
    const parts=[];
    for(let i=0;i<nodes.length-1;i++){
      const a=nodes[i][0],b=nodes[i+1][0],edgeIdx=dayEdgeIndex(d,a,b),mode=dayEdgeMode(d,a,b),color=STAGE_COLORS[edgeIdx%STAGE_COLORS.length];
      parts.push(`<span class="stage-chip"><i class="stage-dot" style="background:${color}"></i>${edgeIdx+1}→${edgeIdx+2} ${(modeText?.[mode]||mode).replace(/^\S+\s?/,'')}</span>`);
    }
    return parts.join('');
  }
  function buildNames(nodes,d){return nodes.map(n=>{const idx=dayNodeIndex(d,n[0]);const name=(LOCS[n[0]]||[n[0]])[0];return`<div class="map-name-item"><b>${idx+1}</b><span>${nodeIcon(n[0],name)} ${esc(name)}</span></div>`}).join('')}

  renderDayMap=function(d,key){
    const {groups,haul}=splitGroups(d);let html=`<details class="day-map-fold" data-map-fold="${key}"><summary><span>🗺️ 当天内嵌高德路线图</span><span class="note">点击展开 / 收起 · 展开后才加载地图</span></summary><div class="map-fold-body"><div class="amap-groups">`;
    for(let i=0;i<groups.length;i++){
      const g=groups[i];
      if(g.length){html+=`<div class="amap-panel"><div class="amap-panel-head">${i===0?'本地路线':'到达后本地路线'}｜${g.map(n=>(LOCS[n[0]]||[n[0]])[0]).join(' → ')}</div><div class="map-toolbar"><button type="button" class="map-label-toggle" data-map-label-toggle="${key}|${i}" disabled>显示节点名称</button><div class="stage-legend">${buildLegend(g,d)}</div></div><div class="amap-canvas" data-map-group="${key}|${i}"><div class="map-loading">展开后加载地图</div></div></div>`}
      if(haul[i])html+=longhaulCard(haul[i].a,haul[i].b,haul[i].mode);
    }
    html+='</div><div class="map-legend">路线颜色按当天先后阶段区分；节点名称默认隐藏。点击“显示节点名称”后，以地图内浮层列出全部名称和编号，避免文字互相遮挡。</div></div></details>';
    return html;
  };

  drawGroup=async function(el,nodes,d){
    const c=amapCfg();if(!c.jsKey||(!c.security&&!c.serviceHost)){el.innerHTML='<div class="amap-placeholder">高德底图未配置；冻结距离、时长仍可用。</div>';return}
    try{
      await loadAmap();
      el.innerHTML='';el.style.position='relative';
      const pts=nodes.map(n=>coord(n[0])).filter(Boolean),map=new AMap.Map(el,{zoom:11,center:pts[0]||[116.4,39.9],viewMode:'2D'});
      nodes.forEach(n=>{const idx=dayNodeIndex(d,n[0]),c0=coord(n[0]);if(!c0)return;const name=(LOCS[n[0]]||[n[0]])[0];new AMap.Marker({map,position:c0,content:`<div class="v131-pin"><span class="ico">${nodeIcon(n[0],name)}</span><span class="num">${idx+1}</span></div>`,anchor:'center',title:name})});
      for(let i=0;i<nodes.length-1;i++){
        const a=nodes[i][0],b=nodes[i+1][0],edgeIdx=dayEdgeIndex(d,a,b),mode=dayEdgeMode(d,a,b),color=STAGE_COLORS[edgeIdx%STAGE_COLORS.length];
        try{const m=await jsRouteMetric(a,b,mode);const path=(m.polyline||[]).map(p=>new AMap.LngLat(p[0],p[1]));new AMap.Polyline({map,path:path.length>1?path:[coord(a),coord(b)],strokeColor:color,strokeWeight:5,strokeOpacity:.9,strokeStyle:mode==='walk'||mode==='ferry'?'dashed':'solid',showDir:true})}catch{new AMap.Polyline({map,path:[coord(a),coord(b)],strokeColor:color,strokeWeight:4,strokeStyle:'dashed',showDir:true})}
      }
      map.setFitView();
      const overlay=document.createElement('div');overlay.className='map-name-overlay';overlay.innerHTML=`<div class="map-name-grid">${buildNames(nodes,d)}</div>`;el.appendChild(overlay);
      const panel=el.closest('.amap-panel'),btn=panel?.querySelector('[data-map-label-toggle]');
      if(btn){btn.disabled=false;btn.onclick=()=>{const on=overlay.classList.toggle('show');btn.textContent=on?'隐藏节点名称':'显示节点名称'}}
    }catch(e){el.innerHTML=`<div class="amap-placeholder">高德底图加载失败：${esc(e.message)}<br>冻结的距离/时长数据仍然可用。</div>`}
  };

  hydrateDay=async function(details,d,key){
    details.querySelectorAll('[data-edge]').forEach(async el=>{const [a,b,m]=el.dataset.edge.split('|');try{const x=await jsRouteMetric(a,b,m);el.textContent=fmtMetric(x);el.className='edge-metric '+(x.kind||'frozen')}catch(e){el.textContent='未计算：'+e.message;el.className='edge-metric pending'}});
    const fold=details.querySelector(`[data-map-fold="${key}"]`);if(!fold)return;
    let drawn=false;
    const draw=()=>{if(drawn||!fold.open)return;drawn=true;const groups=splitGroups(d).groups;fold.querySelectorAll('[data-map-group]').forEach((el,i)=>drawGroup(el,groups[i],d))};
    fold.addEventListener('toggle',draw);draw();
  };
})();
