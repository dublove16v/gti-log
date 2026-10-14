"""Build jobs seed from verified receipt totals. Never invent amounts."""
import json

# Each job: date, title, category, vendor, orderRef, cost, notes, zone
# Categories match original: intake, manifold, turbo, fuel, chassis, brakes, exhaust, cabin, service, tune, other
jobs=[]
def j(date,title,cat,vendor,ref,cost,notes,zone,warranty=False,parts=""):
    jobs.append(dict(id=f"{date}-{ref or title[:20]}".lower().replace(" ","-").replace("/","-")[:48],
      date=date,title=title,category=cat,vendor=vendor,orderRef=ref or "",
      cost=cost,labor=None,mileage=None,warranty=warranty,notes=notes,parts=parts,zone=zone))

# --- FCP ---
j("2020-02-23","Coolant temp sensor","service","FCP Euro","R910622530",17.69,
  "Meyle coolant temperature sensor. Source: FCP order R910622530, email 2020-02-23.","service",parts="Meyle 059919501A")
j("2020-10-16","Oil change kit (Liqui Moly)","service","FCP Euro","R520873606",53.83,
  "Liqui Moly oil service kit. Source: FCP R520873606, 2020-10-16.","service")
j("2021-04-23","Koni Sport strut kit","chassis","FCP Euro","R846778750",547.69,
  "Koni Sport front strut kit. Source: FCP R846778750, 2021-04-23.","chassis",parts="Koni Sport")
j("2021-05-18","Lemforder control arms ×2","chassis","FCP Euro","R025972058",182.88,
  "Lemforder control arms. Source: FCP R025972058, 2021-05-18.","chassis")
j("2021-05-24","Meyle tie rods + APR lug bolts","chassis","FCP Euro","R945177380",80.48,
  "Meyle tie rods ×2 and APR lug bolts. Source: FCP R945177380, 2021-05-24.","chassis")
j("2021-11-26","Oil change kit","service","FCP Euro","R757228316",56.15,
  "Oil service kit. Source: FCP R757228316, 2021-11-26.","service")
j("2022-05-04","APR lug bolt kit","chassis","FCP Euro","R060770205",45.77,
  "APR lug bolt kit. Source: FCP R060770205, 2022-05-04.","chassis")
j("2022-05-28","Turbo oil line gaskets","turbo","FCP Euro","R279544801",10.28,
  "Turbo oil line gaskets. Source: FCP R279544801, 2022-05-28.","turbo")
j("2022-07-22","Timing chain kit","service","FCP Euro","R780877697",539.61,
  "Timing chain kit. Source: FCP R780877697, 2022-07-22.","service")
j("2022-11-03","Oil kit + cabin filter + cam follower","service","FCP Euro","R203476459",97.99,
  "Oil kit, Hengst cabin filter, INA cam follower. Source: FCP R203476459, 2022-11-03.","service")
j("2023-01-11","Behr expansion tank","service","FCP Euro","R420711985",21.89,
  "Behr coolant expansion tank. Source: FCP R420711985, 2023-01-11.","service")
j("2023-02-17","Rein breather hose","intake","FCP Euro","R443375492",44.33,
  "Rein crankcase breather hose. Source: FCP R443375492, 2023-02-17.","intake")
j("2023-03-22","Oil change kit","service","FCP Euro","R626952131",68.66,
  "Oil service kit. Source: FCP R626952131, 2023-03-22.","service")
j("2023-03-27","Febi oil filler cap","service","FCP Euro","R625918525",16.25,
  "Febi oil filler cap. Source: FCP R625918525, 2023-03-27.","service")
j("2023-05-15","Vaico intake manifold + DSG kit","manifold","FCP Euro","R198243062",397.55,
  "Vaico intake manifold, DSG service kit, flap valve hose. Later returned (email 2025-10-01). Source: FCP R198243062, 2023-05-15.","manifold",warranty=True)
j("2023-08-21","Reinz oil separator gasket","intake","FCP Euro","R676558185",15.18,
  "Reinz oil separator gasket. Source: FCP R676558185, 2023-08-21.","intake")
j("2023-08-27","HJS exhaust clamp","exhaust","FCP Euro","R608398097",35.92,
  "HJS exhaust clamp. Source: FCP R608398097, 2023-08-27.","exhaust")
j("2023-09-01","Vaico crankcase vent seal","intake","FCP Euro","R590991084",33.69,
  "Vaico crankcase vent seal. Source: FCP R590991084, 2023-09-01.","intake")
j("2024-06-07","Lemforder shock mount kit","chassis","FCP Euro","R588723816",61.57,
  "Lemforder shock mount kit. Source: FCP R588723816, 2024-06-07.","chassis")
j("2025-02-01","Oil kit + cam follower kit","service","FCP Euro","R029510761",102.55,
  "Oil kit and cam follower kit. Source: FCP R029510761, 2025-02-01.","service")
j("2025-03-13","Lemforder control arm kit","chassis","FCP Euro","R483976123",268.28,
  "Lemforder control arm kit. Return processed 2025-06-04. Source: FCP R483976123, 2025-03-13.","chassis",warranty=True)
j("2025-04-03","Oil change kit","service","FCP Euro","R449794182",66.11,
  "Oil service kit. Source: FCP R449794182, 2025-04-03.","service")
j("2025-04-08","NGK plugs + Bosch coils + coolant","service","FCP Euro","R495278914",184.95,
  "NGK 2669 plugs ×4, Bosch coils ×4, Zerex coolant. Source: FCP R495278914, 2025-04-08.","service",parts="NGK 2669, Bosch coils")
j("2025-05-22","Mann fuel filter","fuel","FCP Euro","R201372052",41.13,
  "Mann fuel filter (John asked about filter on V1.10). Source: FCP R201372052, 2025-05-22.","fuel")
j("2025-05-31","ATE parking brake cables ×2","brakes","FCP Euro","R694444904",26.78,
  "ATE parking brake cables (pickup). Source: FCP R694444904, 2025-05-31.","brakes")
j("2025-07-19","Pierburg N75 + Lemforder dogbone","turbo","FCP Euro","R895932043",63.91,
  "Pierburg N75 boost solenoid, Lemforder dogbone mount and hardware. Source: FCP R895932043, 2025-07-19.","turbo",parts="Pierburg N75")
j("2025-08-23","Elring intake manifold kit + oil","manifold","FCP Euro","R939846338",389.36,
  "Elring intake manifold kit + oil kit. Return processed 2026-09-18 (amount unknown). Source: FCP R939846338, 2025-08-23.","manifold",warranty=True)
j("2025-10-11","Delphi LPFP assembly","fuel","FCP Euro","R360722889",305.63,
  "Delphi low-pressure fuel pump assembly + union nut + seal. Replaced after rail pressure drop (John, Oct 6). Source: FCP R360722889, 2025-10-11.","fuel",parts="Delphi LPFP")
j("2025-11-10","Bremi MAF sensor","intake","FCP Euro","R551817060",107.40,
  "Bremi MAF after P0101/P2178. Source: FCP R551817060, 2025-11-10.","intake",parts="Bremi MAF")
j("2025-11-12","Elring intercooler O-ring","turbo","FCP Euro","R437987727",14.76,
  "Elring intercooler O-ring. Source: FCP R437987727, 2025-11-12.","turbo")
j("2026-03-26","ATE ABS sensor","brakes","FCP Euro","R004145751",35.08,
  "ATE ABS wheel speed sensor. Source: FCP R004145751, 2026-03-26.","brakes")
j("2026-03-30","FAG wheel bearing","chassis","FCP Euro","R133626665",74.84,
  "FAG wheel bearing. Source: FCP R133626665, 2026-03-30.","chassis")
j("2026-04-18","Febi intake manifold","manifold","FCP Euro","R832120973",302.02,
  "Febi intake manifold. Return processed 2026-05-28. Source: FCP R832120973, 2026-04-18.","manifold",warranty=True)
j("2026-06-08","FAG wheel bearing + Rein coolant pipe","chassis","FCP Euro","R598910105",116.68,
  "FAG wheel bearing and Rein coolant pipe. Source: FCP R598910105, 2026-06-08.","chassis")
j("2026-06-29","Pierburg DV + oil kit","turbo","FCP Euro","R739742685",145.93,
  "Pierburg diverter valve + oil kit. Source: FCP R739742685, 2026-06-29.","turbo")
j("2026-08-10","Oil separator bolts ×10","intake","FCP Euro","R786358610",21.15,
  "Oil separator bolts. Source: FCP R786358610, 2026-08-10.","intake")
j("2026-08-14","Febi door lock","cabin","FCP Euro","R796204839",82.43,
  "Febi door lock actuator. Source: FCP R796204839, 2026-08-14.","cabin")
j("2026-08-18","Febi intake manifold (P2015)","manifold","FCP Euro","R667475545",317.96,
  "Febi intake manifold for P2015 chase (flaps / N316). Source: FCP R667475545, 2026-08-18.","manifold",parts="Febi FEB-177035")
j("2026-09-24","Mann fuel filter + DSG service kit","fuel","FCP Euro","R576702433",180.80,
  "Mann fuel filter + DSG service kit (filter didn't fix high STFT). Source: FCP R576702433, 2026-09-24.","fuel")
j("2026-10-05","Control arm hardware kit","chassis","FCP Euro","R430218168",268.26,
  "Control arm hardware kit only ($268.26). T-shirt excluded. Order total was $317.20. Source: FCP R430218168, 2026-10-05.","chassis")

# --- Stratified ---
j("2023-03-18","Stock-turbo flash tune","tune","Stratified","46128",100.00,
  "Mk6 GTI flash tune (stock turbo). Source: Stratified order 46128, 2023-03-18.","tune")
j("2023-08-28","Tune modification update","tune","Stratified","47872",75.00,
  "Flash tune mod update. Source: Stratified 47872, 2023-08-28.","tune")
j("2024-02-22","4-bar MAP + CTS mount + DSG tune","tune","Stratified","49261",834.98,
  "4-bar MAP $60 + CTS transmission mount $119.99 + DSG tune with RTD $654.99. Source: Stratified 49261, 2024-02-22.","tune",parts="4-bar MAP, CTS mount, DSG RTD")
j("2024-04-12","Tune update + decal","tune","Stratified","49793",80.00,
  "Flash update $75 + vinyl decal $5. Source: Stratified 49793, 2024-04-12.","tune")
j("2025-04-02","ProTune (Order 52541)","tune","Stratified","52541",475.00,
  "Mk6 GTI Stratified ProTune — John Degrano. Live remote dyno: no. Source: Stratified 52541, 2025-04-02.","tune")

# --- ECS ---
j("2021-03-30","Hatch pop kit","cabin","ECS Tuning","688-063-126",72.28,
  "Hatch pop kit. Source: ECS 688-063-126, 2021-03-30.","cabin")
j("2022-04-01","GFB DV+ diverter valve kit","turbo","ECS Tuning","684-899-319",219.01,
  "DV kit + GFB DV+. Source: ECS 684-899-319, 2022-04-01.","turbo",parts="GFB DV+")
j("2023-09-15","Subframe locking collars + torque arm","chassis","ECS Tuning","432-629-300",144.05,
  "Subframe locking collars + torque arm insert. Source: ECS 432-629-300, 2023-09-15.","chassis")
j("2024-02-22","Drivetrain mount hardware","chassis","ECS Tuning","297-991-253",66.98,
  "Drivetrain mount hardware. Source: ECS 297-991-253, 2024-02-22.","chassis")

# --- RockAuto (GTI only) ---
j("2021-03-30","Mevotech wheel bearing + front end","chassis","RockAuto","170899713",405.88,
  "Mevotech wheel bearing + front end kit. Source: RockAuto 170899713, 2021-03-30.","chassis")
j("2024-03-10","PowerStop brake kit CRK5667","brakes","RockAuto","267080701",125.26,
  "PowerStop CRK5667 brake kit. Source: RockAuto 267080701, 2024-03-10.","brakes")
j("2026-08-04","URO door lock actuator","cabin","RockAuto","355644062",79.63,
  "URO door lock actuator. Source: RockAuto 355644062, 2026-08-04.","cabin")

# --- eBay ---
j("2023-02-15","Walnut blaster adapter","manifold","eBay","ebay-walnut",10.64,
  "Walnut-blast adapter for intake valves. Source: eBay email 2023-02-15.","manifold")
j("2023-02-24","Black badges","cabin","eBay","ebay-badges",44.65,
  "Black emblems/badges. Source: eBay email 2023-02-24.","cabin")
j("2023-06-01","Headliner","cabin","eBay","ebay-headliner",85.07,
  "Headliner. Source: eBay email 2023-06-01.","cabin")
j("2024-02-02","License plate holder","cabin","eBay","ebay-plate",49.56,
  "License plate holder. Source: eBay email 2024-02-02.","cabin")
j("2024-02-21","Engine mount","chassis","eBay","ebay-emount",74.45,
  "Engine mount. Source: eBay email 2024-02-21.","chassis")
j("2024-02-23","CTS front-mount intercooler","turbo","eBay","ebay-fmic",319.05,
  "CTS FMIC. Source: eBay email 2024-02-23.","turbo",parts="CTS FMIC")
j("2025-08-13","Silicone intercooler hose","turbo","eBay","ebay-ichose",78.70,
  "Silicone intercooler hose (split hose caused overboost). Source: eBay email 2025-08-13.","turbo")
j("2026-03-10","Driver rocker panel","chassis","eBay","ebay-rocker",165.10,
  "Driver rocker panel (listed for 4dr Golf). Source: eBay email 2026-03-10.","chassis")
j("2026-04-08","Rear center console","cabin","eBay","ebay-console",56.37,
  "Rear center console (MK5 Jetta / 1K platform listing). Source: eBay email 2026-04-08.","cabin")
j("2026-04-24","Console cap","cabin","eBay","ebay-concap",15.90,
  "Console cap. Source: eBay email 2026-04-24.","cabin")
j("2026-05-15","Rear air duct","cabin","eBay","ebay-duct",26.59,
  "Rear air duct. Source: eBay email 2026-05-15.","cabin")
j("2026-06-10","Poly rear bushing kit","chassis","eBay","ebay-bush",148.78,
  "Polyurethane rear bushing kit. Source: eBay email 2026-06-10.","chassis")

# --- Other ---
j("2024-02-24","CTS billet FMIC connector","turbo","UroTuning","20704348",56.38,
  "CTS billet FMIC connector. Source: UroTuning 20704348, 2024-02-24.","turbo")
j("2026-08-20","Whiteline rear endlinks","chassis","FB Marketplace","fb-endlinks",61.26,
  "Whiteline adjustable rear sway bar endlinks. Source: FB Marketplace email 2026-08-20.","chassis")
j("2023-02-27","WeatherTech side window deflectors","cabin","WeatherTech","1923436538",132.88,
  "Deflectors for 2011 GTI. Source: WeatherTech 1923436538, 2023-02-27.","cabin")
j("2024-07-13","Koni rear shocks ×2","chassis","Summit Racing","8698380",None,
  "Koni rear shocks ×2. Price not in email — cost left blank. Source: Summit 8698380, 2024-07-13.","chassis",parts="Koni")
j("2026-05-21","TIF bumper plate","cabin","Amazon","amz-tif",12.75,
  "TIF bumper plate. Source: Amazon email 2026-05-21.","cabin")
j("2026-03-05","Rear wiper","cabin","Amazon","amz-wiper",9.94,
  "Rear wiper blade. Source: Amazon email 2026-03-05.","cabin")


# --- UroTuning (named items only) ---
j("2022-04-22","Beri-Backer Mk6 GTI rear diffuser","cabin","UroTuning","20432263",193.75,"Rear diffuser for the Mk6 GTI. Source: UroTuning 20432263, 2022-04-22.","exhaust")
j("2022-09-16","Lamin-X tail light covers","cabin","UroTuning","20495030",85.55,"Lamin-X GTI (10-14) tail light covers, gunsmoke. Source: UroTuning 20495030, 2022-09-16.","cabin")
j("2023-02-15","Valve cover kit + injector install kit","manifold","UroTuning","20552607",106.26,"Valve cover kit and fuel injector installation kit (2.0T). Source: UroTuning 20552607, 2023-02-15.","manifold")
j("2023-02-23","CTS downpipe + O2 spacers + side splitters","exhaust","UroTuning","20556745",767.77,"CTS Turbo Mk5/Mk6 high-flow-cat downpipe $424.99, O2 sensor spacers x2, Ventus Mk6 GTI side splitters $175. Source: UroTuning 20556745, 2023-02-23.","exhaust",parts="CTS downpipe")
j("2023-03-13","NGK 2668 plugs + small parts","service","UroTuning","20565120",179.47,"NGK BKR8EIX (2668) plugs set of 4 plus three items the email lists without names. Source: UroTuning 20565120, 2023-03-13.","service")
j("2023-04-18","Aluminum oil + coolant caps","service","UroTuning","20581394",27.10,"Audi R8-style aluminum oil cap and coolant cap. Source: UroTuning 20581394, 2023-04-18.","service")
j("2023-08-21","Intake manifold plug & boost tap","manifold","UroTuning","20631707",27.60,"2.0T intake manifold plug and boost tap (vacuum/boost gauge port). Source: UroTuning 20631707, 2023-08-21.","manifold")
j("2023-12-28","XForce exhaust cutout VK13","exhaust","UroTuning","20683470",254.57,"XForce cutout kit — the 3\" cutout. Source: UroTuning 20683470, 2023-12-28.","exhaust")
j("2024-01-29","CTS K04-X hybrid turbo","turbo","UroTuning","20694052",1682.85,"CTS Turbo K04-X hybrid turbo (scratch & dent). Source: UroTuning 20694052, 2024-01-29.","turbo",parts="CTS K04X")


# --- Private sales per Luke (no receipt) ---
PS="Private sale, per Luke; no receipt. Date and price unknown."
j("","APR carbon intake","intake","Facebook Marketplace","private-apr-intake",None,PS,"intake",parts="APR carbon intake")
j("","IE catch can","intake","Craigslist","private-ie-catchcan",None,PS,"intake",parts="Integrated Engineering catch can")
j("","COBB Accessport","tune","VWVortex","private-accessport",None,PS,"tune",parts="COBB Accessport")
j("","Brembo brakes (probably)","brakes","VWVortex","private-brembo",None,PS+" Luke says 'probably' VWVortex.","brakes",parts="Brembo")

# Deduplicate ids
seen={}; out=[]
for x in jobs:
    i=x['id']; n=0
    while i in seen: n+=1; i=f"{x['id']}-{n}"
    seen[i]=1; x['id']=i; out.append(x)
total=sum(x['cost'] for x in out if x['cost'] is not None)
print(len(out), round(total,2), sum(1 for x in out if x['warranty']))
json.dump(out,open('app/src/data/jobs.json','w'),indent=2)
