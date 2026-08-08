// v1.3.2 overlay: geo-anchored map labels + complete meal photos.
(function(){
  const RELEASE='v1.3.2';
  const RELEASE_AT='2026-08-08 16:27 (UTC+8)';
  const STAGE_COLORS=['#6d28d9','#ea580c','#0284c7','#16a34a','#db2777','#ca8a04','#0891b2','#7c2d12','#4f46e5','#059669'];

  function esc(s){return String(s??'').replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]||ch))}
  function nodeIcon(key,name){const t=`${key} ${name}`;if(/Airport|机场/.test(t))return'✈️';if(/Station|North|站/.test(t))return'🚄';if(/Hotel|酒店/.test(t))return'🏨';if(/Liugong|岛/.test(t))return'🏝️';if(/Beach|湾|海水浴场|银滩|海/.test(t))return'🌊';if(/Park|公园|山/.test(t))return'🌳';return'📍'}
  function dayNodeIndex(d,key){const i=d?.nodes?.findIndex(n=>n[0]===key);return i>=0?i:0}
  function dayEdgeIndex(d,a,b){const ns=d?.nodes||[];for(let i=0;i<ns.length-1;i++)if(ns[i][0]===a&&ns[i+1][0]===b)return i;return 0}
  function dayEdgeMode(d,a,b){return d?.modes?.[dayEdgeIndex(d,a,b)]||'taxi'}

  document.title='北京—山东—上海家庭旅行计划 v1.3.2';
  const rel=document.querySelector('.release-status');
  if(rel&&!rel.querySelector('[data-v132-release]'))rel.insertAdjacentHTML('beforeend',`<span data-v132-release><b>${RELEASE}</b>｜${RELEASE_AT}</span>`);

  const style=document.createElement('style');
  style.textContent=`
    .v132-node-label{display:flex;align-items:center;gap:5px;max-width:220px;padding:4px 7px;border-radius:8px;background:rgba(255,255,255,.96);border:1px solid rgba(91,62,166,.28);box-shadow:0 2px 9px rgba(0,0,0,.13);color:#292331;font-weight:800;line-height:1.25;white-space:nowrap;pointer-events:none;transition:font-size .12s ease}
    .v132-node-label .n{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 4px;border-radius:999px;background:#5b3ea6;color:#fff;font-size:10px}
    .v132-node-label .name{overflow:hidden;text-overflow:ellipsis}
    .v132-map-help{font-size:11px;color:var(--sub);margin-top:5px}
    .food-static-photo{width:104px;min-width:104px}
    .food-static-photo img{display:block;width:96px;height:66px;object-fit:cover;border-radius:9px;background:#eee;border:1px solid var(--line)}
    .food-static-photo a{display:block;max-width:96px;font-size:9px;line-height:1.2;color:var(--blue);text-decoration:none;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .food-photo-complete-note{background:#eef7f7;border-left:4px solid #247f83;padding:9px 11px;border-radius:10px;margin:8px 0;font-size:12px}
    @media(max-width:700px){.v132-node-label{max-width:150px;padding:3px 5px}.food-static-photo{width:88px;min-width:88px}.food-static-photo img{width:80px;height:56px}.food-static-photo a{max-width:80px}}
  `;
  document.head.appendChild(style);

  const FOOD_PHOTOS={
    breakfast:{thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Baozi.JPG/330px-Baozi.JPG',url:'https://commons.wikimedia.org/wiki/File:Baozi.JPG',credit:'Baozi',license:'Commons'},
    zhajiang:{thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Zhajiangmia.jpg/330px-Zhajiangmia.jpg',url:'https://commons.wikimedia.org/wiki/File:Zhajiangmia.jpg',credit:'Zhajiangmian',license:'Public domain'},
    dumpling:{thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/%E4%B8%AD%E5%9B%BD%E9%A5%BA%E5%AD%90%EF%BC%88Jiaozi%EF%BC%9BDumplings%EF%BC%9B%E9%A4%83%E5%AD%90%EF%BC%89.jpg/330px-%E4%B8%AD%E5%9B%BD%E9%A5%BA%E5%AD%90%EF%BC%88Jiaozi%EF%BC%9BDumplings%EF%BC%9B%E9%A4%83%E5%AD%90%EF%BC%89.jpg',url:'https://commons.wikimedia.org/wiki/File:%E4%B8%AD%E5%9B%BD%E9%A5%BA%E5%AD%90%EF%BC%88Jiaozi%EF%BC%9BDumplings%EF%BC%9B%E9%A4%83%E5%AD%90%EF%BC%89.jpg',credit:'Jiaozi',license:'CC0'},
    wonton:{thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Wontons.JPG/330px-Wontons.JPG',url:'https://commons.wikimedia.org/wiki/File:Wontons.JPG',credit:'Wontons',license:'GFDL'},
    korean:{thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Korean_BBQ.jpg/330px-Korean_BBQ.jpg',url:'https://commons.wikimedia.org/wiki/File:Korean_BBQ.jpg',credit:'Korean BBQ',license:'CC0'},
    xlb:{thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Xiaolongbao.jpg/330px-Xiaolongbao.jpg',url:'https://commons.wikimedia.org/wiki/File:Xiaolongbao.jpg',credit:'Xiaolongbao',license:'CC BY 3.0'},
    shengjian:{thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Shengjian_mantou.jpg/330px-Shengjian_mantou.jpg',url:'https://commons.wikimedia.org/wiki/File:Shengjian_mantou.jpg',credit:'Shengjian',license:'CC BY-SA 4.0'},
    scallion:{thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Shanghai_oil_noodle.jpg/330px-Shanghai_oil_noodle.jpg',url:'https://commons.wikimedia.org/wiki/File:Shanghai_oil_noodle.jpg',credit:'Scallion oil noodles',license:'CC BY-SA 2.0'},
    meal:{thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Chinese_meal.jpg/330px-Chinese_meal.jpg',url:'https://commons.wikimedia.org/wiki/File:Chinese_meal.jpg',credit:'Chinese meal',license:'Commons'}
  };
  function mealPhoto(text){
    const s=String(text||'');
    if(/小笼/.test(s))return FOOD_PHOTOS.xlb;
    if(/生煎/.test(s))return FOOD_PHOTOS.shengjian;
    if(/葱油拌面/.test(s))return FOOD_PHOTOS.scallion;
    if(/炸酱面/.test(s))return FOOD_PHOTOS.zhajiang;
    if(/韩餐|韩乐坊|韩式/.test(s))return FOOD_PHOTOS.korean;
    if(/水饺|饺子/.test(s))return FOOD_PHOTOS.dumpling;
    if(/馄饨|甜沫/.test(s))return FOOD_PHOTOS.wonton;
    if(/早餐|豆浆|包子|粥|牛奶|水果|鸡蛋/.test(s))return FOOD_PHOTOS.breakfast;
    return FOOD_PHOTOS.meal;
  }
  function staticPhotoHTML(p,alt){
    const fallback=FOOD_PHOTOS.meal.thumb;
    return `<div class="food-static-photo"><img loading="lazy" decoding="async" src="${p.thumb}" alt="${esc(alt)}" referrerpolicy="no-referrer" onerror="if(this.src!=='${fallback}')this.src='${fallback}'"><a href="${p.url}" target="_blank" rel="noopener">${esc(p.license)} · ${esc(p.credit)}</a></div>`;
  }
  enhanceFood=function(){
    const sec=document.getElementById('food'),t=sec?.querySelector('table');if(!t||t.dataset.v132Food)return;t.dataset.v132Food='1';
    const header=[...t.tHead.rows[0].cells].map(x=>x.textContent.trim());
    let photoIndex=header.indexOf('真实图');
    if(photoIndex<0){const th=document.createElement('th');th.textContent='真实图';t.tHead.rows[0].insertBefore(th,t.tHead.rows[0].cells[2]);photoIndex=2}
    [...t.tBodies[0].rows].forEach(r=>{
      if(r.cells.length===4){const td=document.createElement('td');r.insertBefore(td,r.cells[2])}
      const foodCell=r.cells[photoIndex+1]||r.cells[3];
      const context=[...r.cells].map(x=>x.textContent.trim()).join('｜');
      const p=mealPhoto(context);
      r.cells[photoIndex].innerHTML=staticPhotoHTML(p,foodCell?.textContent||context);
      r.cells[photoIndex].className='food-photo-cell';
    });
    if(!sec.querySelector('.food-photo-complete-note'))sec.querySelector('.inside')?.insertAdjacentHTML('afterbegin','<div class="food-photo-complete-note"><b>v1.3.2：</b>逐餐表每一餐都固定一张真实代表图；不再依赖运行时搜索成功与否。相同类型餐次允许复用同一张代表图，图片用于识别，不代表最终餐厅实物。</div>');
  };

  function buildLegend(nodes,d){
    const parts=[];for(let i=0;i<nodes.length-1;i++){const a=nodes[i][0],b=nodes[i+1][0],idx=dayEdgeIndex(d,a,b),mode=dayEdgeMode(d,a,b),color=STAGE_COLORS[idx%STAGE_COLORS.length];parts.push(`<span class="stage-chip"><i class="stage-dot" style="background:${color}"></i>${idx+1}→${idx+2} ${(modeText?.[mode]||mode).replace(/^\S+\s?/,'')}</span>`)}return parts.join('')
  }
  renderDayMap=function(d,key){
    const {groups,haul}=splitGroups(d);let html=`<details class="day-map-fold" data-map-fold="${key}"><summary><span>🗺️ 当天内嵌高德路线图</span><span class="note">点击展开 / 收起 · 展开后才加载地图</span></summary><div class="map-fold-body"><div class="amap-groups">`;
    for(let i=0;i<groups.length;i++){
      const g=groups[i];
      if(g.length)html+=`<div class="amap-panel"><div class="amap-panel-head">${i===0?'本地路线':'到达后本地路线'}｜${g.map(n=>(LOCS[n[0]]||[n[0]])[0]).join(' → ')}</div><div class="map-toolbar"><button type="button" class="map-label-toggle" data-map-label-toggle="${key}|${i}" disabled>显示节点名称</button><div class="stage-legend">${buildLegend(g,d)}</div></div><div class="amap-canvas" data-map-group="${key}|${i}"><div class="map-loading">展开后加载地图</div></div><div class="v132-map-help">节点名称会直接贴在对应地理节点旁；缩放、拖动地图后会跟随坐标移动，并重新计算标签位置，尽量避免互相遮挡。</div></div>`;
      if(haul[i])html+=longhaulCard(haul[i].a,haul[i].b,haul[i].mode);
    }
    return html+'</div><div class="map-legend">路线颜色按当天先后阶段区分；节点名称默认隐藏，可按需显示。</div></div></details>';
  };

  function overlaps(a,b,pad=4){return !(a.r+pad<=b.l||b.r+pad<=a.l||a.b+pad<=b.t||b.b+pad<=a.t)}
  function labelCandidates(width,height){
    const xs=[18,-width-18,-width/2,18,-width-18,-width/2,36,-width-36];
    const ys=[-height/2,-height/2,-height-20,20,20,28,-height-42,-height-42];
    const out=xs.map((x,i)=>[x,ys[i]]);
    for(const radius of [58,82,108])for(const angle of [0,45,90,135,180,225,270,315]){const rad=angle*Math.PI/180;out.push([Math.cos(rad)*radius-width/2,Math.sin(rad)*radius-height/2])}
    return out;
  }
  function placeLabels(map,items,canvas){
    const cw=canvas.clientWidth,ch=canvas.clientHeight,zoom=Number(map.getZoom?.()||11),font=Math.max(10,Math.min(13,10+(zoom-8)*.55)),used=[];
    items.forEach(item=>{
      item.el.style.fontSize=font+'px';
      const width=Math.min(cw<620?150:220,Math.max(92,42+item.name.length*font*.9)),height=29;
      item.el.style.maxWidth=width+'px';
      const p=map.lngLatToContainer(item.lnglat),cands=labelCandidates(width,height);let chosen=null,best=null,bestScore=Infinity;
      for(const [dx,dy] of cands){
        const rect={l:p.x+dx,t:p.y+dy,r:p.x+dx+width,b:p.y+dy+height};
        const outside=Math.max(0,-rect.l)+Math.max(0,-rect.t)+Math.max(0,rect.r-cw)+Math.max(0,rect.b-ch);
        let hits=0;for(const u of used)if(overlaps(rect,u))hits++;
        const score=hits*10000+outside*50+Math.hypot(dx+width/2,dy+height/2);
        if(score<bestScore){bestScore=score;best=[dx,dy,rect]}
        if(hits===0&&outside===0){chosen=[dx,dy,rect];break}
      }
      chosen=chosen||best;
      if(!chosen)return;
      item.marker.setOffset(new AMap.Pixel(Math.round(chosen[0]),Math.round(chosen[1])));used.push(chosen[2]);
    });
  }

  drawGroup=async function(el,nodes,d){
    const c=amapCfg();if(!c.jsKey||(!c.security&&!c.serviceHost)){el.innerHTML='<div class="amap-placeholder">高德底图未配置；冻结距离、时长仍可用。</div>';return}
    try{
      await loadAmap();el.innerHTML='';el.style.position='relative';
      const pts=nodes.map(n=>coord(n[0])).filter(Boolean),map=new AMap.Map(el,{zoom:11,center:pts[0]||[116.4,39.9],viewMode:'2D'});
      nodes.forEach(n=>{const idx=dayNodeIndex(d,n[0]),c0=coord(n[0]);if(!c0)return;const name=(LOCS[n[0]]||[n[0]])[0];new AMap.Marker({map,position:c0,content:`<div class="v131-pin"><span class="ico">${nodeIcon(n[0],name)}</span><span class="num">${idx+1}</span></div>`,anchor:'center',title:name,zIndex:160})});
      for(let i=0;i<nodes.length-1;i++){
        const a=nodes[i][0],b=nodes[i+1][0],idx=dayEdgeIndex(d,a,b),mode=dayEdgeMode(d,a,b),color=STAGE_COLORS[idx%STAGE_COLORS.length];
        try{const m=await jsRouteMetric(a,b,mode);const path=(m.polyline||[]).map(p=>new AMap.LngLat(p[0],p[1]));new AMap.Polyline({map,path:path.length>1?path:[coord(a),coord(b)],strokeColor:color,strokeWeight:5,strokeOpacity:.9,strokeStyle:mode==='walk'||mode==='ferry'?'dashed':'solid',showDir:true})}catch{new AMap.Polyline({map,path:[coord(a),coord(b)],strokeColor:color,strokeWeight:4,strokeStyle:'dashed',showDir:true})}
      }
      map.setFitView();

      const labels=[];
      nodes.forEach(n=>{const idx=dayNodeIndex(d,n[0]),c0=coord(n[0]);if(!c0)return;const name=(LOCS[n[0]]||[n[0]])[0],dom=document.createElement('div');dom.className='v132-node-label';dom.innerHTML=`<span class="n">${idx+1}</span><span>${nodeIcon(n[0],name)}</span><span class="name">${esc(name)}</span>`;const marker=new AMap.Marker({position:c0,content:dom,anchor:'top-left',zIndex:220});labels.push({marker,el:dom,lnglat:c0,name})});
      const panel=el.closest('.amap-panel'),btn=panel?.querySelector('[data-map-label-toggle]');let on=false,raf=0;
      const reflow=()=>{if(!on)return;cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>placeLabels(map,labels,el))};
      if(btn){btn.disabled=false;btn.onclick=()=>{on=!on;btn.textContent=on?'隐藏节点名称':'显示节点名称';if(on){map.add(labels.map(x=>x.marker));reflow()}else map.remove(labels.map(x=>x.marker))}}
      map.on('zoomchange',reflow);map.on('moveend',reflow);map.on('resize',reflow);
    }catch(e){el.innerHTML=`<div class="amap-placeholder">高德底图加载失败：${esc(e.message)}<br>冻结的距离/时长数据仍然可用。</div>`}
  };
})();
