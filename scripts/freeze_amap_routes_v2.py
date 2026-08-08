#!/usr/bin/env python3
import freeze_amap_routes as base

CITYCODE={
    '北京':'010',
    '上海':'021',
    '青岛':'0532',
    '威海':'0631',
    '荣成':'0631',
    '赣州':'0797',
    '广州':'020',
}

def query_route_v2(r, locs):
    a,b,mode=r['from'],r['to'],r['mode']; la,lb=locs[a],locs[b]
    origin,dest=base.coordstr(la),base.coordstr(lb)
    if mode in ('taxi','drive'):
        data=base.http_json('/v5/direction/driving', {'origin':origin,'destination':dest,'show_fields':'cost,polyline'})
    elif mode == 'walk':
        data=base.http_json('/v5/direction/walking', {'origin':origin,'destination':dest,'show_fields':'cost,polyline'})
    elif mode in ('metro','airportline','rail'):
        c1=CITYCODE.get(r.get('from_city'))
        c2=CITYCODE.get(r.get('to_city'))
        if not c1 or not c2:
            raise RuntimeError(f"missing AMap citycode for {r.get('from_city')} -> {r.get('to_city')}")
        data=base.http_json('/v5/direction/transit/integrated', {
            'origin':origin,
            'destination':dest,
            'city1':c1,
            'city2':c2,
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
