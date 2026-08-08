#!/usr/bin/env python3
import freeze_amap_routes as base


def query_route_v2(r, locs):
    a,b,mode=r['from'],r['to'],r['mode']; la,lb=locs[a],locs[b]
    origin,dest=base.coordstr(la),base.coordstr(lb)
    if mode in ('taxi','drive'):
        data=base.http_json('/v5/direction/driving', {'origin':origin,'destination':dest,'show_fields':'cost,polyline'})
    elif mode == 'walk':
        data=base.http_json('/v5/direction/walking', {'origin':origin,'destination':dest,'show_fields':'cost,polyline'})
    elif mode in ('metro','airportline','rail'):
        data=base.http_json('/v5/direction/transit/integrated', {
            'origin':origin,
            'destination':dest,
            'city1':r.get('from_city') or r.get('to_city') or '全国',
            'city2':r.get('to_city') or r.get('from_city') or '全国',
            'strategy':'0',
            'show_fields':'cost,polyline',
        })
    else:
        raise RuntimeError('unsupported dynamic mode '+mode)
    m=base.parse_metric(data,mode)
    m.update({'source':'AMap Web Service Route Planning 2.0','mode':mode,'status':'ok'})
    return m

base.query_route=query_route_v2
raise SystemExit(base.main())
