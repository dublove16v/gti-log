import csv, json, re, os, glob
out=[]
def num(v):
    try: return float(v)
    except: return None
for f in sorted(glob.glob('logs_raw/*.csv')):
    base=os.path.basename(f)[:-4]
    if base.endswith('.csv'): base=base[:-4]
    date,name=base.split('__',1)
    txt=open(f,errors='replace').read()
    m=re.search(r'Purdy Tune (V\d+\.\d+)',txt); ver=m.group(1) if m else None
    rows=list(csv.reader(txt.splitlines()))
    hdr=rows[0]; ix={h:i for i,h in enumerate(hdr)}
    def col(r,name):
        i=ix.get(name); 
        return num(r[i]) if i is not None and i<len(r) else None
    data=[r for r in rows[1:] if r and num(r[0]) is not None]
    pts=[]
    for r in data:
        ks=[col(r,f'Knock Ret. Cyl. {c} (Degrees)') for c in range(1,5)]
        ks=[k for k in ks if k is not None]
        pts.append(dict(t=col(r,'Time (sec)'),boost=col(r,'Boost Press. (psi)'),trgt=col(r,'Trgt. Boost Press. (psi)'),
          knock=min(ks) if ks else None,rail=col(r,'Rail Pressure Actual (psi)'),railT=col(r,'Rail Pressure Target (psi)'),
          lpfp=col(r,'LPFP Duty (%)'),iat=col(r,'IAT (F)'),rpm=col(r,'RPM (RPM)'),app=col(r,'APP (%)'),map=col(r,'Man. Abs. Press. (psi)'),mi=col(r,'Mileage (mi)')))
    if not pts: continue
    offs=sorted(p['map']-p['boost'] for p in pts if p['map'] is not None and p['boost'] is not None and p['boost']>1)
    baro=offs[len(offs)//2] if offs else 14.5
    for p in pts:
        if p['trgt'] is not None: p['trgt']=max(0.0,p['trgt']-baro)
    def ser(k): return [p[k] for p in pts if p[k] is not None]
    wot=[p for p in pts if (p['app'] or 0)>=90]
    step=max(1,len(pts)//90)
    chart=[{k:(round(v,2) if isinstance(v,float) else v) for k,v in p.items() if k not in ('mi','map')} for p in pts[::step]]
    kn=ser('knock'); rail=ser('rail'); mi=ser('mi')
    out.append(dict(id=base,date=date,name=name.replace('_',' '),version=ver,rows=len(pts),
      durationSec=round((pts[-1]['t'] or 0)-(pts[0]['t'] or 0),1),
      mileage=int(mi[0]) if mi else None,
      maxBoost=max(ser('boost')) if ser('boost') else None,
      maxTarget=max(ser('trgt')) if ser('trgt') else None,
      worstKnock=min(kn) if kn else None,
      minRailWot=min((p['rail'] for p in wot if p['rail'] is not None),default=None),
      maxLpfp=max(ser('lpfp')) if ser('lpfp') else None,
      maxIat=max(ser('iat')) if ser('iat') else None,
      wot=len(wot)>5,baro=round(baro,1), chart=chart))
json.dump(out,open('app/src/data/logs.json','w'),separators=(',',':'))
print(len(out), os.path.getsize('app/src/data/logs.json'))
for o in out: print(o['date'],o['version'],o['maxBoost'],o['maxTarget'],o['worstKnock'],o['minRailWot'],o['maxLpfp'],o['maxIat'],o['mileage'],o['wot'])
