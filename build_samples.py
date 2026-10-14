import csv, json, glob, os, re
def num(v):
    try: return float(v)
    except: return None
CH={'rpm':'RPM (RPM)','boost':'Boost Press. (psi)','trgt':'Trgt. Boost Press. (psi)','map':'Man. Abs. Press. (psi)','timing':'Final Timing (Degrees)',
    'afr':'AFR (AFR)','rail':'Rail Pressure Actual (psi)','lpfp':'LPFP Duty (%)','iat':'IAT (F)','ect':'Coolant Temp. (F)','app':'APP (%)','load':'Load Actual (%)','t':'Time (sec)'}
out=[]
for f in sorted(glob.glob('logs_raw/*.csv')):
    base=os.path.basename(f)[:-4]
    if base.endswith('.csv'): base=base[:-4]
    txt=open(f,errors='replace').read()
    m=re.search(r'Purdy Tune (V\d+\.\d+)',txt); ver=m.group(1) if m else None
    rows=list(csv.reader(txt.splitlines())); ix={h:i for i,h in enumerate(rows[0])}
    data=[r for r in rows[1:] if r and num(r[0]) is not None]
    step=max(1,len(data)//400)
    cols={k:[] for k in CH}; cols['knock']=[]
    offs=[]
    for r in data[::step]:
        g=lambda n: num(r[ix[n]]) if n in ix and ix[n]<len(r) else None
        for k,n in CH.items():
            v=g(n)
            if k=='afr' and v is not None and not (8<=v<=20): v=None
            cols[k].append(None if v is None else round(v,2))
        ks=[g(f'Knock Ret. Cyl. {c} (Degrees)') for c in range(1,5)]; ks=[k for k in ks if k is not None]
        cols['knock'].append(min(ks) if ks else None)
        if cols['map'][-1] is not None and cols['boost'][-1] is not None and cols['boost'][-1]>1: offs.append(cols['map'][-1]-cols['boost'][-1])
    baro=sorted(offs)[len(offs)//2] if offs else 14.5
    cols['trgt']=[None if v is None else round(max(0,v-baro),2) for v in cols['trgt']]
    cols={k:v for k,v in cols.items() if any(x is not None for x in v)}
    out.append(dict(id=base,ver=ver,c=cols))
json.dump(out,open('app/src/data/samples.json','w'),separators=(',',':'))
print(len(out),os.path.getsize('app/src/data/samples.json'))
