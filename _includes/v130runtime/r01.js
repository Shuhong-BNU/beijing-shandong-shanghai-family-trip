const PLAN={
A:{name:'方案 A｜主推：青岛2晚 + 威海2晚 + 威海单日自驾',nights:'北京1｜青岛2｜威海2｜上海2',fit:'第一次带父母远游；兼顾经典、历史与海岸',diff:'青岛不租车；8/24威海单日租车'},
B:{name:'方案 B｜零驾驶：青岛2晚 + 威海2晚',nights:'北京1｜青岛2｜威海2｜上海2',fit:'不想承担驾驶、停车、还车变量',diff:'山东段铁路 + 网约车'},
C:{name:'方案 C｜青岛深度：青岛3晚 + 威海1晚',nights:'北京1｜青岛3｜威海1｜上海2',fit:'崂山优先，愿意压缩威海',diff:'8/22不转场，多一晚青岛'},
D:{name:'方案 D｜山东跨城自驾：青岛→荣成→威海',nights:'北京1｜青岛2｜威海2｜上海2',fit:'驾驶经验充足，想把沿海移动本身当体验',diff:'青岛起租，威海机场还车'},
E:{name:'方案 E｜慢节奏减负',nights:'北京1｜青岛2｜威海2｜上海2',fit:'怕热、膝盖一般、宁可少看',diff:'删远郊和高强度项目'}};
const modeText={flight:'✈ 飞机',taxi:'🚕 打车',metro:'🚇 地铁',rail:'🚄 铁路',walk:'🚶 步行',drive:'🚗 自驾',ferry:'⛴ 轮渡',airportline:'🚆 机场线'};
let MAPDATA={},LOCS={},selected=localStorage.getItem('trip:selectedPlan')||'A',AMAP_LOADING=null;
const AMAP_PROD_CONFIG = {
  jsKey: "95d9eb0382f5d7f05dac2a5e5adda547",
  serviceHost: "https://trip-amap-proxy.shuhong001.workers.dev/_AMapService"
};
const FLIGHT_METRIC={
'GanzhouAirport>PEK':{km:1591,time:'航班时长以订单为准；23:40抵达'},
'PEK>PVG_QD':{km:513,time:'1小时25分'},
'WHAirport>PVG':{km:673,time:'1小时50分'},
'Hongqiao>GanzhouAirport':{km:874,time:'1小时55分'},
'PVG>GuangzhouAirport':{km:1203,time:'2小时25分'}};
const FERRY_METRIC={'LiugongDock>Liugong':{km:5.6,time:'执行预留约30分（含候船/登船）'},'Liugong>LiugongDock':{km:5.6,time:'执行预留约30分（含候船/登船）'}};
function nodeCity(k){const bj=['PEK','BUPT','BNU','Tiananmen','Mao','Rostrum','Jingshan','Shichahai'],qd=['PVG_QD','QDHotel','Zhanqiao','Navy','OldCity','Signal','Badaguan','Wusi','Olympic','Beer','Laoshan','QDNorth'],wh=['WHStation','WHHotel','Xingfu','WHpark','LiugongDock','Liugong','Haiyuan','HalfMoon','Torch8','IntlBeach','Maotou','WHAirport'],rc=['Naxianghai','Chengshantou'],sh=['PVG','SHHotel','Yuyuan','Bund','Pearl','SHTower','Wukang','SHMuseumEast','Hongqiao'];if(k==='GanzhouAirport')return'赣州';if(k==='GuangzhouAirport')return'广州';if(bj.includes(k))return'北京';if(qd.includes(k))return'青岛';if(wh.includes(k))return'威海';if(rc.includes(k))return'荣成';if(sh.includes(k))return'上海';return'—'}
function dayDate(d){const m=(d?.title||'').match(/^(\d+\/\d+)/);return m?m[1]:'—'}
async function loadBaseline(){if(Object.keys(MAPDATA).length)return;const src=await fetch('../v110/').then(r=>{if(!r.ok)throw new Error('v110 '+r.status);return r.text()});const m0=src.indexOf('window.MAPDATA=')+'window.MAPDATA='.length,m1=src.indexOf(';\nwindow.LOCS=',m0),l0=m1+';\nwindow.LOCS='.length,l1=src.indexOf(';\nconst modeStyle=',l0);if(m1<0||l1<0)throw new Error('route data markers not found');MAPDATA=JSON.parse(src.slice(m0,m1));LOCS=JSON.parse(src.slice(l0,l1));LOCS.GuangzhouAirport=['广州白云机场',23.3924,113.2988]}
function amapCfg(){
  let local = {};

  try {
    local = JSON.parse(
      localStorage.getItem('trip:amap-config-v130') || '{}'
    );
  } catch {}

  return {
    jsKey: local.jsKey || AMAP_PROD_CONFIG.jsKey,
    serviceHost:
      local.serviceHost ||
      AMAP_PROD_CONFIG.serviceHost,

    // 正式生产环境不再把 securityJsCode 放浏览器
    security: "",

    // Web Service 已在构建阶段冻结，不给浏览器
    webKey: "",

    cap: local.cap || 80
  };
}
function saveAmapCfg(){const c={jsKey:amapJsKey.value.trim(),security:amapSecurityCode.value.trim(),webKey:amapWebKey.value.trim(),cap:+amapLocalCap.value||80};localStorage.setItem('trip:amap-config-v130',JSON.stringify(c));updateAmapBadge();location.reload()}
function clearAmapCfg(){localStorage.removeItem('trip:amap-config-v130');localStorage.removeItem('trip:amap-route-cache-v130');localStorage.removeItem('trip:amap-usage-v130');location.reload()}
function updateAmapBadge(){const c=amapCfg(),b=document.getElementById('amapStatusBadge');if(!b)return;b.textContent=c.jsKey&&c.security?'已配置':'未配置';b.className='status-chip '+(c.jsKey&&c.security?'ok':'warn');const u=usage();document.getElementById('amapUsageText').textContent=`本站今日未缓存算路：${u.count}/${c.cap||80}；缓存30天。此上限只保护本站调用量，不是高德账单硬上限。`}
function usage(){const today=new Date().toISOString().slice(0,10);let u={date:today,count:0};try{u=JSON.parse(localStorage.getItem('trip:amap-usage-v130')||'null')||u}catch{}if(u.date!==today)u={date:today,count:0};return u}
function bumpUsage(){const c=amapCfg(),u=usage();if(u.count>=(c.cap||80))throw new Error('本站今日未缓存算路已达本机上限');u.count++;localStorage.setItem('trip:amap-usage-v130',JSON.stringify(u));updateAmapBadge()}
function routeCache(){try{return JSON.parse(localStorage.getItem('trip:amap-route-cache-v130')||'{}')}catch{return{}}}
function getCached(k){const c=routeCache(),x=c[k];return x&&Date.now()-x.ts<30*864e5?x:null}
function setCached(k,v){const c=routeCache();c[k]={...v,ts:Date.now()};localStorage.setItem('trip:amap-route-cache-v130',JSON.stringify(c))}
function outOfChina(lng,lat){return lng<72.004||lng>137.8347||lat<0.8293||lat>55.8271}
function transformLat(x,y){return -100+2*x+3*y+.2*y*y+.1*x*y+.2*Math.sqrt(Math.abs(x))+(20*Math.sin(6*x*Math.PI)+20*Math.sin(2*x*Math.PI))*2/3+(20*Math.sin(y*Math.PI)+40*Math.sin(y/3*Math.PI))*2/3+(160*Math.sin(y/12*Math.PI)+320*Math.sin(y*Math.PI/30))*2/3}
function transformLng(x,y){return 300+x+2*y+.1*x*x+.1*x*y+.1*Math.sqrt(Math.abs(x))+(20*Math.sin(6*x*Math.PI)+20*Math.sin(2*x*Math.PI))*2/3+(20*Math.sin(x*Math.PI)+40*Math.sin(x/3*Math.PI))*2/3+(150*Math.sin(x/12*Math.PI)+300*Math.sin(x/30*Math.PI))*2/3}
function gcj(lng,lat){if(outOfChina(lng,lat))return[lng,lat];let dLat=transformLat(lng-105,lat-35),dLng=transformLng(lng-105,lat-35),rad=lat/180*Math.PI,magic=Math.sin(rad);magic=1-.00669342162296594323*magic*magic;const sqrt=Math.sqrt(magic);dLat=dLat*180/((6335552.717000426/(magic*sqrt))*Math.PI);dLng=dLng*180/(6378245/sqrt*Math.cos(rad)*Math.PI);return[lng+dLng,lat+dLat]}
function coord(k){const p=LOCS[k];return p?gcj(p[2],p[1]):null}
function loadAmap(){if(window.AMap)return Promise.resolve(window.AMap);if(AMAP_LOADING)return AMAP_LOADING;const c=amapCfg();if(!c.jsKey||!c.security)return Promise.reject(new Error('请先配置高德 JS API Key 与 securityJsCode'));window._AMapSecurityConfig={securityJsCode:c.security};AMAP_LOADING=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=`https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(c.jsKey)}&plugin=AMap.Driving,AMap.Walking,AMap.Transfer`;s.onload=()=>resolve(window.AMap);s.onerror=()=>reject(new Error('高德 JS API 加载失败'));document.head.appendChild(s)});return AMAP_LOADING}
function fmtMetric(x){if(!x)return'待计算';return `${x.km!=null?x.km.toFixed(x.km<10?1:0)+' km':'距离待确认'}｜${x.time||'时长待确认'}`}
function metricKey(a,b,m){return `${a}>${b}:${m}`}
function fixedMetric(a,b,m){const k=`${a}>${b}`;if(m==='flight'&&FLIGHT_METRIC[k])return{...FLIGHT_METRIC[k],source:'大圆距离 + 已锁定航班',kind:'fixed'};if(m==='ferry'&&FERRY_METRIC[k])return{...FERRY_METRIC[k],source:'直线水距 + 行程预留',kind:'fixed'};if(m==='airportline'&&a==='Hongqiao'&&b==='PVG')return{km:null,time:'约40分（官方两机场通达时长）',source:'上海市域机场线官方',kind:'fixed'};return null}
function routeService(mode,map){if(mode==='walk')return new AMap.Walking({map,hideMarkers:true});if(mode==='metro'||mode==='airportline')return new AMap.Transfer({map,city:'全国',policy:AMap.TransferPolicy.LEAST_TIME,hideMarkers:true});return new AMap.Driving({map,hideMarkers:true,policy:AMap.DrivingPolicy.LEAST_TIME})}
async function jsRouteMetric(a,b,mode,map=null){const key=metricKey(a,b,mode),cached=getCached(key);if(cached)return cached;const f=fixedMetric(a,b,mode);if(f)return f;if(mode==='rail')return railMetric(a,b);await loadAmap();bumpUsage();const start=coord(a),end=coord(b);if(!start||!end)throw new Error('坐标缺失');return new Promise((resolve,reject)=>{const svc=routeService(mode,map);svc.search(start,end,(status,res)=>{if(status!=='complete')return reject(new Error('高德算路失败'));let r;if(mode==='metro'||mode==='airportline')r=res.plans?.[0];else r=res.routes?.[0];if(!r)return reject(new Error('无路线结果'));const sec=Number(r.time||r.duration||0),m=Number(r.distance||0),v={km:m/1000,time:sec?`${Math.round(sec/60)} 分钟`:'时长待确认',source:'高德实际路线',kind:'live'};setCached(key,v);resolve(v)})})}
function jsonp(url){return new Promise((resolve,reject)=>{const cb='amapcb_'+Math.random().toString(36).slice(2);window[cb]=d=>{delete window[cb];s.remove();resolve(d)};const s=document.createElement('script');s.src=url+(url.includes('?')?'&':'?')+'callback='+cb;s.onerror=()=>{delete window[cb];s.remove();reject(new Error('高德 Web Service 请求失败'))};document.body.appendChild(s)})}
