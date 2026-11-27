import cv2, numpy as np, json, math, heapq, os, random, sys
from PIL import Image, ImageDraw, ImageFont
SP="/tmp/claude-0/-home-user-Pokemart/621c8e0b-5f3d-5059-829e-adcee8a33e95/scratchpad"
OUT=sys.argv[1]
LW,LH,SC=135,240,8          # logical size, upscale
MPP=1.6                      # metres per logical px
TILT=0.78
A=(14.4290,120.9366); B=(14.3844,120.9769)   # Imus centre, SM Molino (Nominatim)
lat0,lon0=A
def proj(lat,lon): return ((lon-lon0)*111320*math.cos(math.radians(lat0)), -(lat-lat0)*110574)
a=proj(*A); b=proj(*B); v=(b[0]-a[0],b[1]-a[1]); phi=math.pi/2-math.atan2(v[1],v[0])
def rot(p): 
    x,y=p; return (x*math.cos(phi)-y*math.sin(phi), x*math.sin(phi)+y*math.cos(phi))
# ---------- route ----------
real=os.path.exists(f"{SP}/roads.json"); roads=[]; route=None
if real:
    d=json.load(open(f"{SP}/roads.json")); adj={}; 
    for w in d['elements']:
        g=[proj(p['lat'],p['lon']) for p in w.get('geometry',[])]; roads.append([rot(p) for p in g])
        for p,q in zip(g,g[1:]):
            L=math.dist(p,q); adj.setdefault(p,[]).append((q,L)); adj.setdefault(q,[]).append((p,L))
    nodes=list(adj); sn=lambda p:min(nodes,key=lambda n:math.dist(n,p))
    s,t=sn(a),sn(b); dist={s:0}; prev={}; pq=[(0,s)]
    while pq:
        dd,u=heapq.heappop(pq)
        if u==t: break
        if dd>dist.get(u,1e18): continue
        for w2,L in adj[u]:
            nd=dd+L
            if nd<dist.get(w2,1e18): dist[w2]=nd; prev[w2]=u; heapq.heappush(pq,(nd,w2))
    if t in prev or s==t:
        path=[t]
        while path[-1]!=s: path.append(prev[path[-1]])
        route=[rot(p) for p in path[::-1]]
if route is None:
    real=False; ra=rot(a); rb=rot(b); n=40; route=[]
    for i in range(n+1):
        u=i/n; route.append((ra[0]+(rb[0]-ra[0])*u+90*math.sin(u*math.pi*2.2), ra[1]+(rb[1]-ra[1])*u))
# extend route with straight lead-in / lead-out
def _ext(p,q,m=320):
    L=math.dist(p,q); return (p[0]+(p[0]-q[0])/L*m, p[1]+(p[1]-q[1])/L*m)
PAD=320
route=[_ext(route[0],route[1])]+route+[_ext(route[-1],route[-2])]
seg=[0]
for p,q in zip(route,route[1:]): seg.append(seg[-1]+math.dist(p,q))
TOT=seg[-1]; CORE=TOT-2*PAD
def _at_abs(s):
    for i in range(1,len(seg)):
        if seg[i]>=s:
            u=(s-seg[i-1])/max(seg[i]-seg[i-1],1e-9); p,q=route[i-1],route[i]
            return (p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u),math.atan2(q[1]-p[1],q[0]-p[0])
    return route[-1],math.pi/2
def at(s):
    s=max(0,min(1,s))*CORE+PAD
    for i in range(1,len(seg)):
        if seg[i]>=s:
            u=(s-seg[i-1])/max(seg[i]-seg[i-1],1e-9); p,q=route[i-1],route[i]
            return (p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u),math.atan2(q[1]-p[1],q[0]-p[0])
    return route[-1],math.pi/2
# ---------- palette (Gen5-ish: saturated, outlined) ----------
def bgr(c): return (c[2],c[1],c[0])
INK=bgr((38,40,64)); GR=bgr((126,206,108)); GR2=bgr((110,190,98)); GR3=bgr((146,222,124))
ROAD=bgr((100,106,128)); ROAD2=bgr((88,94,116)); CURB=bgr((226,218,196)); LINE=bgr((250,226,120))
WATER=bgr((92,168,230)); WATER2=bgr((140,200,246)); TREE1=bgr((46,140,86)); TREE2=bgr((72,172,104)); TRUNK=bgr((120,84,58))
WALLS=[bgr(c) for c in [(250,228,190),(196,224,246),(246,184,170),(206,236,196),(240,210,240)]]
ROOFS=[bgr(c) for c in [(220,86,76),(80,120,200),(238,164,60),(70,160,140)]]
def shade(c,f): return tuple(int(max(0,min(255,x*f))) for x in c)
def S(p,cx,cy): # world(rotated) -> logical screen
    return ((p[0]-cx)/MPP+LW/2, (p[1]-cy)/MPP*TILT+LH/2+8)
def poly(img,pts,col,outline=True):
    P=np.array(pts,np.int32); cv2.fillPoly(img,[P],col)
    if outline: cv2.polylines(img,[P],True,INK,1)
# ---------- objects ----------
def building(img,x,y,w,d,h,wall,roof,sign=None):  # x,y = front-left ground corner (screen)
    dx,dy=int(d*0.45),int(d*0.5)
    front=[(x,y),(x+w,y),(x+w,y-h),(x,y-h)]
    side=[(x+w,y),(x+w+dx,y-dy),(x+w+dx,y-dy-h),(x+w,y-h)]
    top=[(x,y-h),(x+w,y-h),(x+w+dx,y-dy-h),(x+dx,y-dy-h)]
    cv2.ellipse(img,(int(x+w/2+dx),int(y+1)),(int(w*.7),3),0,0,360,shade(GR,.82),-1)
    poly(img,front,wall); poly(img,side,shade(wall,.78)); poly(img,top,roof)
    cv2.line(img,(x+dx,y-dy-h),(x+w+dx,y-dy-h),shade(roof,1.18),1)
    for wy in range(int(y-h+4),int(y-6),9):
        for wx in range(int(x+3),int(x+w-5),8):
            cv2.rectangle(img,(wx,wy),(wx+3,wy+4),bgr((120,180,236)),-1); cv2.rectangle(img,(wx,wy),(wx+3,wy+4),INK,1)
    cv2.rectangle(img,(int(x+w/2-2),int(y-6)),(int(x+w/2+2),int(y)),TRUNK,-1)
def tree(img,x,y):
    cv2.ellipse(img,(x+1,y+1),(5,2),0,0,360,shade(GR,.8),-1)
    cv2.rectangle(img,(x-1,y-5),(x+1,y),TRUNK,-1)
    for (ox,oy,r,c) in [(0,-12,6,TREE1),(-3,-9,5,TREE1),(3,-9,5,TREE1),(0,-14,4,TREE2)]:
        cv2.circle(img,(x+ox,y+oy),r,c,-1)
    cv2.circle(img,(x,y-12),7,INK,1)
def sprite(img,x,y,back=False):   # x,y = feet centre
    cv2.ellipse(img,(x,y),(5,2),0,0,360,shade(GR,.78),-1)
    for lx in (x-3,x+1): cv2.rectangle(img,(lx,y-7),(lx+2,y-1),bgr((70,100,190)),-1); cv2.rectangle(img,(lx,y-7),(lx+2,y-1),INK,1)
    cv2.rectangle(img,(x-4,y-14),(x+4,y-6),bgr((236,70,64)),-1); cv2.rectangle(img,(x-4,y-14),(x+4,y-6),INK,1)
    cv2.rectangle(img,(x-4,y-11),(x+4,y-10),bgr((250,250,250)),-1)
    cv2.rectangle(img,(x-7,y-12),(x-4,y-5),bgr((250,200,60)),-1); cv2.rectangle(img,(x-7,y-12),(x-4,y-5),INK,1)
    cv2.circle(img,(x,y-19),5,bgr((250,214,176)),-1)
    cv2.ellipse(img,(x,y-21),(6,4),0,180,360,bgr((70,44,44)),-1)
    cv2.circle(img,(x,y-19),5,INK,1)
    if not back: cv2.circle(img,(x-2,y-19),1,INK,-1); cv2.circle(img,(x+2,y-19),1,INK,-1)
    else: cv2.ellipse(img,(x,y-20),(5,5),0,0,360,bgr((70,44,44)),-1); cv2.circle(img,(x,y-19),5,INK,1)
def jeep(img,cx,cy,ang,rider=True):
    # footprint (len 11m→ ~7px wide,20 long) rotated; body extruded up 5px
    Lh,Wh=19,8; ca,sa=math.cos(ang-math.pi/2),math.sin(ang-math.pi/2)
    def R(px,py): return (cx+px*ca-py*sa, cy+(px*sa+py*ca)*TILT)
    base=[R(-Wh,-Lh),R(Wh,-Lh),R(Wh,Lh),R(-Wh,Lh)]
    cv2.ellipse(img,(int(cx),int(cy+3)),(11,6),0,0,360,shade(ROAD,.7),-1)
    low=[(x,y) for x,y in base]; up=[(x,y-6) for x,y in base]
    poly(img,low,bgr((190,150,40)))
    for i in range(4): poly(img,[low[i],low[(i+1)%4],up[(i+1)%4],up[i]],bgr((230,180,50)))
    poly(img,up,bgr((250,210,70)))
    stripe=[R(-Wh,-Lh+9),R(Wh,-Lh+9),R(Wh,-Lh+12),R(-Wh,-Lh+12)]; poly(img,[(x,y-6) for x,y in stripe],bgr((230,70,64)),False)
    stripe2=[R(-Wh,-Lh+15),R(Wh,-Lh+15),R(Wh,-Lh+18),R(-Wh,-Lh+18)]; poly(img,[(x,y-6) for x,y in stripe2],bgr((70,110,200)),False)
    ws=[R(-Wh+1,-Lh+2),R(Wh-1,-Lh+2),R(Wh-1,-Lh+7),R(-Wh+1,-Lh+7)]; poly(img,[(x,y-6) for x,y in ws],bgr((150,210,250)))
    if rider:
        hx,hy=R(0,Lh-8); cv2.circle(img,(int(hx),int(hy-9)),3,bgr((250,214,176)),-1); cv2.circle(img,(int(hx),int(hy-11)),3,bgr((70,44,44)),1)
# ---------- scene ----------
def scene(s, title, sub, you=None, jeep_on=False, rider=True, extra=None):
    (cx,cy),ang=at(s)
    img=np.zeros((LH,LW,3),np.uint8); img[:]=GR
    ys,xs=np.mgrid[0:LH,0:LW]; img[((xs+ys)%7==0)&(xs%2==0)]=GR2; img[((xs*3+ys*5)%41==0)]=GR3
    def ribbon(pts,w,col,line=True):
        sp=[S(p,cx,cy) for p in pts]; P=np.array(sp,np.int32)
        cv2.polylines(img,[P],False,CURB,int(w+4)); cv2.polylines(img,[P],False,col,int(w))
        if line:
            for i in range(0,len(sp)-1):
                (x1,y1),(x2,y2)=sp[i],sp[i+1]; L=math.dist(sp[i],sp[i+1]); n=max(1,int(L//9))
                for k in range(n):
                    u0,u1=k/n,(k+.45)/n; cv2.line(img,(int(x1+(x2-x1)*u0),int(y1+(y2-y1)*u0)),(int(x1+(x2-x1)*u1),int(y1+(y2-y1)*u1)),LINE,1)
    # nearby real roads (if any)
    if real:
        for r in roads:
            if any(abs(p[0]-cx)<260 and abs(p[1]-cy)<400 for p in r): ribbon(r,6,ROAD2,False)
    else:  # schematic cross streets
        for off in (-0.04,0.05):
            (px,py),an=at(s+off); nx,ny=-math.sin(an),math.cos(an)
            ribbon([(px-nx*260,py-ny*260),(px+nx*260,py+ny*260)],6,ROAD2,False)
    # water + bridge (schematic landmark)
    water=extra=="bridge"
    if water:
        (px,py),an=at(s); nx,ny=-math.sin(an),math.cos(an); tx,ty=math.cos(an),math.sin(an)
        pts=[(px+nx*300-tx*28,py+ny*300-ty*28),(px-nx*300-tx*28,py-ny*300-ty*28),(px-nx*300+tx*28,py-ny*300+ty*28),(px+nx*300+tx*28,py+ny*300+ty*28)]
        P=np.array([S(p,cx,cy) for p in pts],np.int32); cv2.fillPoly(img,[P],WATER); cv2.polylines(img,[P],True,INK,1)
        for k in range(-14,15,5):
            q=S((px+nx*k*14-tx*8,py+ny*k*14-ty*8),cx,cy); cv2.line(img,(int(q[0]),int(q[1])),(int(q[0]+8),int(q[1])),WATER2,1)
    ribbon(route,13,ROAD)
    if water:
        a1=S((px-tx*30,py-ty*30),cx,cy); a2=S((px+tx*30,py+ty*30),cx,cy)
        cv2.line(img,(int(a1[0]),int(a1[1])),(int(a2[0]),int(a2[1])),CURB,15); cv2.line(img,(int(a1[0]),int(a1[1])),(int(a2[0]),int(a2[1])),ROAD,11)
    # procedural scenery along the route, painter-sorted
    items=[]; water_s=(.55*CORE+PAD) if water else None
    for i in range(int(TOT//26)):
        sd=(i*26-PAD)/CORE; (px,py),an=at(min(max(sd,-.4),1.4)) if False else (lambda ss:(lambda q:q)(_at_abs(ss)))(i*26)
        if abs(py-cy)>230 or abs(px-cx)>140: continue
        rng=random.Random(i*7919+13)
        for side in (-1,1):
            nx,ny=-math.sin(an)*side,math.cos(an)*side
            w=rng.randint(12,20); d=rng.randint(9,14); h=rng.randint(14,30)
            off=11+w*MPP*0.5*abs(nx)+d*MPP*.3+rng.random()*6; kind=rng.random()
            gx,gy=px+nx*off,py+ny*off
            if water_s is not None and abs(i*26-water_s)<70: continue
            sx,sy=S((gx,gy),cx,cy)
            if kind<.62: items.append((sy,'b',int(sx-w/2),int(sy),w,d,h,rng.choice(WALLS),rng.choice(ROOFS)))
            else: items.append((sy,'t',int(sx),int(sy)))
    for it in sorted(items,key=lambda t:t[0]):
        if it[1]=='b': building(img,*it[2:])
        else: tree(img,it[2],it[3])
    # mall
    if s>=0.82:
        (px,py),an=at(1.0); gx,gy=px+22,py-30
        mx,my=S((gx,gy),cx,cy); mw,md,mh=62,22,34
        if my<LH+60:
            building(img,int(mx-4),int(my),mw,md,mh,bgr((250,204,176)),bgr((214,70,70)))
            cv2.rectangle(img,(int(mx+mw/2-6),int(my-12)),(int(mx+mw/2+6),int(my)),bgr((140,200,244)),-1); cv2.rectangle(img,(int(mx+mw/2-6),int(my-12)),(int(mx+mw/2+6),int(my)),INK,1)
            cv2.rectangle(img,(int(mx+2),int(my-mh-9)),(int(mx+mw-6),int(my-mh-2)),bgr((60,100,200)),-1); cv2.rectangle(img,(int(mx+2),int(my-mh-9)),(int(mx+mw-6),int(my-mh-2)),INK,1)
    if jeep_on:
        jx,jy=S((cx,cy),cx,cy); jeep(img,jx,jy,ang,rider)
    if you:
        yx,yy=you; sprite(img,yx,yy,back=(extra=="back"))
    return img
def hud(img,title,sub,idx,n,tag=None):
    big=cv2.resize(img,(LW*SC,LH*SC),interpolation=cv2.INTER_NEAREST)
    im=Image.fromarray(cv2.cvtColor(big,cv2.COLOR_BGR2RGB)); d=ImageDraw.Draw(im)
    ft=ImageFont.load_default(size=58); fs=ImageFont.load_default(size=34); fx=ImageFont.load_default(size=26)
    d.rounded_rectangle([40,40,1040,250],radius=18,fill=(250,250,252),outline=(38,40,64),width=8)
    d.rounded_rectangle([54,54,1026,236],radius=12,outline=(120,126,160),width=3)
    d.text((80,70),title,fill=(38,40,64),font=ft); d.text((80,150),sub,fill=(90,94,120),font=fs)
    d.rounded_rectangle([40,1760,1040,1792],radius=8,fill=(250,250,252),outline=(38,40,64),width=5)
    d.rounded_rectangle([46,1766,46+int(988*idx/(n-1)),1786],radius=5,fill=(236,70,64))
    d.text((40,1810),"IMUS DISTRICT",fill=(250,250,252),font=fx,stroke_width=3,stroke_fill=(38,40,64)); d.text((700,1810),"SM MOLINO",fill=(250,250,252),font=fx,stroke_width=3,stroke_fill=(38,40,64))
    note=("Real OSM road network" if real else "Schematic route - real endpoints, placeholder scenery")+"  |  © OpenStreetMap contributors"
    d.text((40,1870),note,fill=(250,250,252),font=ImageFont.load_default(size=22),stroke_width=2,stroke_fill=(38,40,64))
    return im
frames=[
 (0.00,"1. PICK-UP","Imus district - you wait at the stop",dict(you=(55,150))),
 (0.02,"2. BOARD","Flag down a jeepney - Para po!",dict(you=(55,150),jeep_on=True,rider=False)),
 (0.30,"3. EN ROUTE","Riding along the highway",dict(jeep_on=True)),
 (0.55,"4. LANDMARK","River crossing (placeholder landmark)",dict(jeep_on=True,extra="bridge")),
 (0.88,"5. ALMOST THERE","SM Molino ahead",dict(jeep_on=True)),
 (1.00,"6. DROP-OFF","SM Molino - you made it!",dict(you=(58,170),extra="back")),
]
ims=[]
for i,(s,t,sub,kw) in enumerate(frames):
    img=scene(s,t,sub,**kw); im=hud(img,t,sub,i,len(frames)); im.save(f"{OUT}/0{i+1}_{t.split('. ')[1].lower().replace(' ','_').replace('-','')}.png"); ims.append(im)
sheet=Image.new("RGB",(6*370+10,660),(30,30,44))
for i,im in enumerate(ims): sheet.paste(im.resize((360,640)),(10+i*370,10))
sheet.save(f"{OUT}/contact_sheet.png"); print("real roads:",real)
