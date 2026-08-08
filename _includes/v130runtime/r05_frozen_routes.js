let FROZEN_ROUTE_PROMISE=null;
function frozenRoutes(){
  if(FROZEN_ROUTE_PROMISE)return FROZEN_ROUTE_PROMISE;
  FROZEN_ROUTE_PROMISE=fetch('../assets/data/route-metrics-v131.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('冻结路线数据 '+r.status);return r.json()});
  return FROZEN_ROUTE_PROMISE;
}
function secText(sec){if(!sec)return'时长以实际班次/订单为准';const min=Math.round(sec/60);return min>=60?`${Math.floor(min/60)}小时${min%60?min%60+'分':''}`:`${min} 分钟`}
function frozenDisplay(a,b,mode,x){
  if(!x||x.status!=='ok')return null;
  let km=x.distance_m!=null?x.distance_m/1000:null,time=secText(x.duration_s),source=x.source||'冻结路线数据';
  if(mode==='rail'){
    time='以最终12306具体车次为准';
    source='高德综合交通路线长度参考；列车时长以12306为准';
  }
  if(mode==='airportline'&&a==='Hongqiao'&&b==='PVG'){
    time='约40分（机场联络线官方口径）';
    source='高德冻结路线长度 + 上海机场联络线官方时长';
  }
  if(mode==='ferry')source='水上直线距离 + 执行预留；非官方纯航行里程';
  return{km,time,source,kind:'frozen',polyline:x.polyline_gcj02||[]};
}
jsRouteMetric=async function(a,b,mode,map=null){
  const data=await frozenRoutes(),raw=data.routes?.[metricKey(a,b,mode)],v=frozenDisplay(a,b,mode,raw);
  if(v)return v;
  const fixed=fixedMetric(a,b,mode);if(fixed)return fixed;
  throw new Error('该段未进入冻结路线表');
};
fmtMetric=function(x){if(!x)return'待确认';const km=x.km!=null?(x.km<10?x.km.toFixed(1):x.km.toFixed(0))+' km':'距离待确认';return `${km}｜${x.time||'时长待确认'}`};
saveAmapCfg=function(){const old=amapCfg(),c={jsKey:amapJsKey.value.trim(),security:amapSecurityCode.value.trim(),serviceHost:old.serviceHost||''};localStorage.setItem('trip:amap-config-v130',JSON.stringify(c));updateAmapBadge();location.reload()};
clearAmapCfg=function(){localStorage.removeItem('trip:amap-config-v130');location.reload()};
updateAmapBadge=function(){const c=amapCfg(),b=document.getElementById('amapStatusBadge');if(!b)return;const ready=!!(c.jsKey&&(c.security||c.serviceHost));b.textContent=ready?'底图已配置':'底图未配置';b.className='status-chip '+(ready?'ok':'warn');const t=document.getElementById('amapUsageText');if(t)t.textContent='60 个唯一转场已经冻结到静态 JSON；浏览网页不会再调用高德 Web Service。JS API 仅用于绘制底图、编号点和冻结 polyline。'};
loadAmap=function(){
  if(window.AMap)return Promise.resolve(window.AMap);if(AMAP_LOADING)return AMAP_LOADING;const c=amapCfg();
  if(!c.jsKey)return Promise.reject(new Error('请先配置高德 Web端（JS API）Key'));
  if(c.serviceHost)window._AMapSecurityConfig={serviceHost:c.serviceHost};else if(c.security)window._AMapSecurityConfig={securityJsCode:c.security};else return Promise.reject(new Error('请配置 serviceHost 或 securityJsCode'));
  AMAP_LOADING=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=`https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(c.jsKey)}`;s.onload=()=>resolve(window.AMap);s.onerror=()=>reject(new Error('高德 JS API 加载失败'));document.head.appendChild(s)});return AMAP_LOADING;
};
function routeStroke(mode){return{taxi:'#a45a00',drive:'#b42318',walk:'#666',metro:'#247f83',airportline:'#177245',ferry:'#2e86ab'}[mode]||'#5b3ea6'}
drawGroup=async function(el,nodes){
  const c=amapCfg();if(!c.jsKey||(!c.security&&!c.serviceHost)){el.innerHTML='<div class="amap-placeholder">路线距离和时长已经冻结并可直接显示。配置高德 JS API 后，这里会显示内嵌底图和冻结路线；不会重新请求路径规划。</div>';return}
  try{
    await loadAmap();el.innerHTML='';const pts=nodes.map(n=>coord(n[0])).filter(Boolean),map=new AMap.Map(el,{zoom:11,center:pts[0]||[116.4,39.9],viewMode:'2D'});nodes.forEach((n,i)=>numberedMarker(map,n,i));
    for(let i=0;i<nodes.length-1;i++){
      const a=nodes[i][0],b=nodes[i+1][0],mode=findDayEdgeMode(a,b)||'taxi';
      try{const m=await jsRouteMetric(a,b,mode);const path=(m.polyline||[]).map(p=>new AMap.LngLat(p[0],p[1]));if(path.length>1)new AMap.Polyline({map,path,strokeColor:routeStroke(mode),strokeWeight:5,strokeOpacity:.85,strokeStyle:mode==='walk'||mode==='ferry'?'dashed':'solid'});else new AMap.Polyline({map,path:[coord(a),coord(b)],strokeColor:routeStroke(mode),strokeWeight:4,strokeStyle:'dashed'})}catch{new AMap.Polyline({map,path:[coord(a),coord(b)],strokeColor:'#aaa',strokeWeight:3,strokeStyle:'dashed'})}
    }
    map.setFitView();
  }catch(e){el.innerHTML=`<div class="amap-placeholder">高德底图加载失败：${e.message}<br>冻结的距离/时长数据仍然可用。</div>`}
};
