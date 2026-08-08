#!/usr/bin/env python3
import argparse, datetime as dt, json, math, os, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'scripts' / 'route_manifest_v131.json'
OUT = ROOT / 'assets' / 'data' / 'route-metrics-v131.json'
CHECK = ROOT / 'assets' / 'data' / 'amap-web-service-check.json'
API_KEY = os.environ.get('AMAP_WEB_SERVICE_KEY', '').strip()
BASE = 'https://restapi.amap.com'

A = 6378245.0
EE = 0.00669342162296594323

def out_of_china(lng, lat): return lng < 72.004 or lng > 137.8347 or lat < 0.8293 or lat > 55.8271
def transform_lat(x, y):
    return (-100 + 2*x + 3*y + .2*y*y + .1*x*y + .2*math.sqrt(abs(x))
            + (20*math.sin(6*x*math.pi)+20*math.sin(2*x*math.pi))*2/3
            + (20*math.sin(y*math.pi)+40*math.sin(y/3*math.pi))*2/3
            + (160*math.sin(y/12*math.pi)+320*math.sin(y*math.pi/30))*2/3)
def transform_lng(x, y):
    return (300 + x + 2*y + .1*x*x + .1*x*y + .1*math.sqrt(abs(x))
            + (20*math.sin(6*x*math.pi)+20*math.sin(2*x*math.pi))*2/3
            + (20*math.sin(x*math.pi)+40*math.sin(x/3*math.pi))*2/3
            + (150*math.sin(x/12*math.pi)+300*math.sin(x/30*math.pi))*2/3)
def wgs_to_gcj(lng, lat):
    if out_of_china(lng, lat): return lng, lat
    dlat = transform_lat(lng-105, lat-35); dlng = transform_lng(lng-105, lat-35)
    rad = lat / 180 * math.pi; magic = math.sin(rad); magic = 1 - EE*magic*magic; sqrtmagic = math.sqrt(magic)
    dlat = dlat * 180 / ((A*(1-EE)/(magic*sqrtmagic))*math.pi)
    dlng = dlng * 180 / (A/sqrtmagic*math.cos(rad)*math.pi)
    return lng+dlng, lat+dlat

def haversine_km(a, b):
    lng1,lat1=a; lng2,lat2=b; r=6371.0088
    p1,p2=math.radians(lat1),math.radians(lat2); dp=math.radians(lat2-lat1); dl=math.radians(lng2-lng1)
    h=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*r*math.asin(math.sqrt(h))

def http_json(path, params, tries=3):
    params = dict(params); params['key'] = API_KEY; params['output'] = 'json'
    url = BASE + path + '?' + urllib.parse.urlencode(params)
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent':'family-trip-route-freezer/1.0'})
            with urllib.request.urlopen(req, timeout=25) as r:
                data = json.loads(r.read().decode('utf-8'))
            if str(data.get('status')) != '1':
                raise RuntimeError(f"AMap {data.get('infocode')} {data.get('info')}")
            return data
        except Exception as e:
            last=e
            if attempt+1 < tries: time.sleep(1.5*(attempt+1))
    raise last

def collect_polyline(obj):
    out=[]
    def walk(x):
        if isinstance(x, dict):
            for k,v in x.items():
                if k == 'polyline' and isinstance(v,str) and ',' in v:
                    for part in v.split(';'):
                        try:
                            lng,lat=map(float,part.split(',')); out.append([lng,lat])
                        except Exception: pass
                else: walk(v)
        elif isinstance(x, list):
            for v in x: walk(v)
    walk(obj)
    clean=[]
    for p in out:
        if not clean or p != clean[-1]: clean.append(p)
    return clean

def first_path(data, mode):
    route=data.get('route') or {}
    arr=(route.get('transits') or []) if mode in ('metro','airportline','rail') else (route.get('paths') or [])
    if not arr: raise RuntimeError('AMap returned no route candidate')
    return arr[0]

def parse_metric(data, mode):
    x=first_path(data,mode)
    dist=float(x.get('distance') or 0)
    cost=x.get('cost') or {}
    dur=float(cost.get('duration') or x.get('duration') or 0)
    return {'distance_m': round(dist), 'duration_s': round(dur) if dur else None, 'polyline_gcj02': collect_polyline(x)}

def coord(loc):
    return wgs_to_gcj(float(loc[2]), float(loc[1]))
def coordstr(loc):
    lng,lat=coord(loc); return f'{lng:.6f},{lat:.6f}'

def query_route(r, locs):
    a,b,mode=r['from'],r['to'],r['mode']; la,lb=locs[a],locs[b]
    origin,dest=coordstr(la),coordstr(lb)
    if mode in ('taxi','drive'):
        data=http_json('/v5/direction/driving', {'origin':origin,'destination':dest,'show_fields':'cost,polyline'})
    elif mode == 'walk':
        data=http_json('/v5/direction/walking', {'origin':origin,'destination':dest,'show_fields':'cost,polyline'})
    elif mode in ('metro','airportline','rail'):
        p={'origin':origin,'destination':dest,'city':r.get('from_city') or r.get('to_city') or '全国','strategy':'0','show_fields':'cost,polyline'}
        if r.get('to_city') and r.get('to_city') != r.get('from_city'): p['cityd']=r['to_city']
        data=http_json('/v5/direction/transit/integrated', p)
    else:
        raise RuntimeError('unsupported dynamic mode '+mode)
    m=parse_metric(data,mode)
    m.update({'source':'AMap Web Service Route Planning 2.0','mode':mode,'status':'ok'})
    return m

FLIGHT_DURATION={'PEK>PVG_QD':85*60,'WHAirport>PVG':110*60}
FERRY_DURATION={'LiugongDock>Liugong':30*60,'Liugong>LiugongDock':30*60,'Liugong>WHHotel':30*60}

def fixed_route(r, locs):
    a,b,mode=r['from'],r['to'],r['mode']; la,lb=locs[a],locs[b]
    km=haversine_km((float(la[2]),float(la[1])),(float(lb[2]),float(lb[1])))
    if mode=='flight':
        sec=FLIGHT_DURATION.get(f'{a}>{b}')
        return {'distance_m':round(km*1000),'duration_s':sec,'polyline_gcj02':[list(coord(la)),list(coord(lb))], 'source':'great-circle distance; locked flight schedule when available','mode':mode,'status':'ok'}
    if mode=='ferry':
        sec=FERRY_DURATION.get(f'{a}>{b}')
        return {'distance_m':round(km*1000),'duration_s':sec,'polyline_gcj02':[list(coord(la)),list(coord(lb))], 'source':'straight-water-distance + execution reserve; not official sailing mileage','mode':mode,'status':'ok'}
    return None

def test_key(locs):
    r={'from':'PEK','to':'BUPT','mode':'drive','from_city':'北京','to_city':'北京'}
    m=query_route(r,locs)
    if not m.get('distance_m'): raise RuntimeError('Key test returned no distance')
    return {'status':'success','infocode':'10000','tested_service':'/v5/direction/driving','sample_route':'北京首都机场 → 北邮南门附近酒店','distance_m':m['distance_m'],'duration_s':m['duration_s'],'checked_at':dt.datetime.now(dt.timezone.utc).isoformat()}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--test-only',action='store_true'); args=ap.parse_args()
    if not API_KEY:
        print('ERROR: AMAP_WEB_SERVICE_KEY secret is missing.', file=sys.stderr); return 2
    manifest=json.loads(MANIFEST.read_text(encoding='utf-8')); locs=manifest['locations']; routes=manifest['routes']
    check=test_key(locs); CHECK.parent.mkdir(parents=True,exist_ok=True); CHECK.write_text(json.dumps(check,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"AMap Web Service key test: OK; sample distance={check['distance_m']}m duration={check['duration_s']}s")
    if args.test_only: return 0
    now=dt.datetime.now(dt.timezone.utc).isoformat(); data={'schema_version':1,'generated_at':now,'coordinate_input':'WGS84','amap_request_coordinate':'GCJ-02','generator':'scripts/freeze_amap_routes.py','routes':{}}
    failures=[]; dynamic=0
    for idx,r in enumerate(routes,1):
        k=f"{r['from']}>{r['to']}:{r['mode']}"
        try:
            m=fixed_route(r,locs)
            if m is None:
                m=query_route(r,locs); dynamic+=1; time.sleep(0.08)
            m.update({'from':r['from'],'to':r['to'],'from_name':locs[r['from']][0],'to_name':locs[r['to']][0],'from_city':r.get('from_city'),'to_city':r.get('to_city')})
            data['routes'][k]=m
            print(f"[{idx:02d}/{len(routes)}] OK {k}: {m['distance_m']}m / {m.get('duration_s')}s")
        except Exception as e:
            failures.append((k,str(e)))
            data['routes'][k]={'from':r['from'],'to':r['to'],'mode':r['mode'],'status':'error','error':str(e)}
            print(f"[{idx:02d}/{len(routes)}] ERROR {k}: {e}")
    data['summary']={'total_unique_segments':len(routes),'dynamic_amap_requests':dynamic,'failures':len(failures)}
    OUT.parent.mkdir(parents=True,exist_ok=True); OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(data['summary'],ensure_ascii=False))
    critical=[x for x in failures if x[0].endswith(':drive') or x[0].endswith(':taxi') or x[0].endswith(':walk')]
    if critical:
        print('Critical route failures:', critical, file=sys.stderr); return 1
    return 0

if __name__=='__main__': raise SystemExit(main())
