/* GIFFY effects lab. Every effect is a pure function of t∈[0,1) so GIFs loop perfectly. */
const TAU=Math.PI*2;
function rng(seed){let a=(Math.imul(seed|0,2654435761)>>>0)||1;return function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
const fract=x=>x-Math.floor(x),clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k;
const easeIO=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2,easeOut=x=>1-Math.pow(1-x,3),easeIn=x=>x*x*x;
const backOut=x=>{const c1=2.2,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
const bounceOut=x=>{const n=7.5625,d=2.75;if(x<1/d)return n*x*x;if(x<2/d)return n*(x-=1.5/d)*x+.75;if(x<2.5/d)return n*(x-=2.25/d)*x+.9375;return n*(x-=2.625/d)*x+.984375};
const pick=(r,a)=>a[Math.floor(r()*a.length)];
function hexRgb(h){h=(h||'#000').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16)||0;return[n>>16&255,n>>8&255,n&255]}
function rgba(h,a){const[r,g,b]=hexRgb(h);return`rgba(${r},${g},${b},${a})`}
function mk(w,h){const c=document.createElement('canvas');c.width=Math.max(1,w|0);c.height=Math.max(1,h|0);return c}
const hsl=(h,s,l,a=1)=>`hsla(${h},${s}%,${l}%,${a})`;

/* ---------- shared helpers ---------- */
function bg(ctx,S){const g=ctx.createLinearGradient(0,0,0,S.H);g.addColorStop(0,S.pal.bg[0]);g.addColorStop(1,S.pal.bg[1]);ctx.fillStyle=g;ctx.fillRect(0,0,S.W,S.H)}
function bgCustom(ctx,S,stops){const g=ctx.createLinearGradient(0,0,0,S.H);stops.forEach((c,i)=>g.addColorStop(i/(stops.length-1),c));ctx.fillStyle=g;ctx.fillRect(0,0,S.W,S.H)}
function dim(ctx,S,a,c='0,0,0'){ctx.fillStyle=`rgba(${c},${a})`;ctx.fillRect(0,0,S.W,S.H)}
function txt(ctx,S,a=1,dx=0,dy=0){ctx.globalAlpha=a;ctx.drawImage(S.textC,dx,dy);ctx.globalAlpha=1}
function glow(ctx,S,color,blur,a=1,dx=0,dy=0){ctx.save();ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.globalAlpha=a;ctx.drawImage(S.textC,dx,dy);ctx.restore()}
function about(ctx,S,sx,sy,rot,fn,cx=S.cx,cy=S.cy){ctx.save();ctx.translate(cx,cy);if(rot)ctx.rotate(rot);ctx.scale(sx,sy);ctx.translate(-cx,-cy);fn();ctx.restore()}
function fillWith(ctx,S,painter,a=1){const c=S.tmp,x=S.tmpX;x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-over';x.globalAlpha=1;x.clearRect(0,0,S.W,S.H);painter(x);x.globalCompositeOperation='destination-in';x.drawImage(S.fillMask,0,0);x.globalCompositeOperation='source-over';ctx.globalAlpha=a;ctx.drawImage(S.outlineC,0,0);ctx.drawImage(c,0,0);ctx.globalAlpha=1}
function overlayOnText(ctx,S,painter,a=1){const c=S.tmp,x=S.tmpX;x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-over';x.globalAlpha=1;x.clearRect(0,0,S.W,S.H);painter(x);x.globalCompositeOperation='destination-in';x.drawImage(S.fillMask,0,0);x.globalCompositeOperation='source-over';ctx.globalAlpha=a;ctx.drawImage(c,0,0);ctx.globalAlpha=1}
function glyph(ctx,S,ch,fill,stroke=true){ctx.font=S.fontStr;ctx.textAlign='center';ctx.textBaseline='middle';
  if(stroke&&S.sw){ctx.lineJoin='round';ctx.lineWidth=S.sw;ctx.strokeStyle=S.pal.s;ctx.strokeText(ch,0,0)}
  if(!fill){const g=ctx.createLinearGradient(0,-S.fs*.45,0,S.fs*.45);S.pal.t.forEach((c,i)=>g.addColorStop(S.pal.t.length>1?i/(S.pal.t.length-1):0,c));fill=g}
  ctx.fillStyle=fill;ctx.fillText(ch,0,0)}
function letters(ctx,S,fn){const n=S.chars.length;S.chars.forEach((c,i)=>{if(c.ch===' ')return;const o=fn(c,i,n)||{};if(o.skip)return;ctx.save();ctx.globalAlpha=clamp(o.a??1,0,1);ctx.translate(c.x+(o.dx||0),c.y+(o.dy||0));if(o.r)ctx.rotate(o.r);ctx.scale(o.sx??1,o.sy??1);if(o.shadow){ctx.shadowColor=o.shadow;ctx.shadowBlur=o.blur||12}glyph(ctx,S,o.ch||c.ch,o.fill);ctx.restore()})}
function bolt(r,x1,y1,x2,y2,disp,depth=6){let p=[[x1,y1],[x2,y2]];for(let d=0;d<depth;d++){const q=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;const o=(r()-.5)*disp;q.push([(a[0]+b[0])/2-dy/L*o,(a[1]+b[1])/2+dx/L*o]);q.push(b)}p=q;disp*=.55}return p}
function poly(ctx,p){ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)ctx.lineTo(p[i][0],p[i][1]);ctx.stroke()}
function zap(ctx,p,color,w=3){ctx.save();ctx.lineJoin='round';ctx.lineCap='round';ctx.shadowColor=color;ctx.shadowBlur=w*6;ctx.strokeStyle=color;ctx.lineWidth=w*2;ctx.globalAlpha=.6;poly(ctx,p);ctx.globalAlpha=1;ctx.shadowBlur=w*3;ctx.strokeStyle='#fff';ctx.lineWidth=w*.7;poly(ctx,p);ctx.restore()}
function sparkle(ctx,x,y,r,color='#fff'){if(r<=.3)return;ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=r*2;ctx.beginPath();for(let i=0;i<4;i++){const a=i*TAU/4;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(a+TAU/8)*r*.22,Math.sin(a+TAU/8)*r*.22)}ctx.fill();ctx.restore()}
function heartPath(ctx,x,y,s){ctx.beginPath();ctx.moveTo(x,y+s*.35);ctx.bezierCurveTo(x-s*1.1,y-s*.35,x-s*.45,y-s*1.05,x,y-s*.45);ctx.bezierCurveTo(x+s*.45,y-s*1.05,x+s*1.1,y-s*.35,x,y+s*.35);ctx.closePath()}
function circle(ctx,x,y,r){ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,TAU);ctx.fill()}
function samp(r,arr,n){if(!arr.length)return[];const o=[];for(let i=0;i<n;i++)o.push(arr[Math.floor(r()*arr.length)]);return o}
function spread(arr,n,r){if(!arr.length)return[];const s=[...arr].sort((a,b)=>a[0]-b[0]);const o=[];for(let i=0;i<n;i++){const k=Math.floor((i+.2+r()*.6)/n*s.length);o.push(s[clamp(k,0,s.length-1)])}return o}
function falling(r,n,o={}){const a=[];for(let i=0;i<n;i++)a.push({x:r(),y:r(),k:(o.kmin||1)+Math.floor(r()*(o.kr||2)),s:lerp(o.smin||2,o.smax||5,r()),ph:r()*TAU,rk:(r()<.5?-1:1)*(1+Math.floor(r()*2)),c:o.colors?pick(r,o.colors):null,front:r()<(o.front??.5)});return a}
function drips(ctx,S,t,list,color,hi,glowC){ctx.save();if(glowC){ctx.shadowColor=glowC;ctx.shadowBlur=12}ctx.lineCap='round';
  for(const d of list){const ph=fract(d.o+t);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=d.w;
    if(ph<.72){const L=easeIO(ph/.72)*d.len;ctx.beginPath();ctx.moveTo(d.x,d.y-d.w*.6);ctx.lineTo(d.x,d.y+L);ctx.stroke();circle(ctx,d.x,d.y+L,d.w*.75);
      if(hi){ctx.strokeStyle=hi;ctx.lineWidth=d.w*.22;ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(d.x-d.w*.18,d.y);ctx.lineTo(d.x-d.w*.18,d.y+L);ctx.stroke();ctx.globalAlpha=1}}
    else{const k=(ph-.72)/.28;const stub=d.len*.35*(1-k);ctx.beginPath();ctx.moveTo(d.x,d.y-d.w*.6);ctx.lineTo(d.x,d.y+stub);ctx.stroke();circle(ctx,d.x,d.y+stub,d.w*.6);
      const yy=d.y+d.len+k*k*S.H*.7;ctx.beginPath();ctx.ellipse(d.x,yy,d.w*.6,d.w*.85,0,0,TAU);ctx.fill()}}
  ctx.restore()}
function mkDrips(S,r,n,minL=.3,maxL=1,wmul=1){return spread(S.pts.bottom,n,r).map(p=>({x:p[0],y:p[1],o:r(),len:S.fs*lerp(minL,maxL,r()),w:S.fs*(.045+r()*.05)*wmul}))}
function coat(ctx,S,list,color){ctx.fillStyle=color;for(const p of list)circle(ctx,p[0],p[1]-1,p[2])}
function noiseCanvases(S,n=5,scale=2){if(S._noise)return S._noise;const w=Math.ceil(S.W/scale),h=Math.ceil(S.H/scale);const r=rng(7);S._noise=[];for(let k=0;k<n;k++){const c=mk(w,h),x=c.getContext('2d'),id=x.createImageData(w,h);for(let i=0;i<id.data.length;i+=4){const v=r()*255|0;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255}x.putImageData(id,0,0);S._noise.push(c)}return S._noise}
function noise(ctx,S,t,a){const N=noiseCanvases(S);ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=a;ctx.drawImage(N[Math.floor(t*60)%N.length],0,0,S.W,S.H);ctx.restore()}
function scan(ctx,S,a,off=0,gap=3){ctx.fillStyle=`rgba(0,0,0,${a})`;for(let y=(off%gap+gap)%gap;y<S.H;y+=gap)ctx.fillRect(0,y,S.W,1)}
function stars(ctx,S,list,t){for(const s of list){const tw=.5+.5*Math.sin(TAU*(t*s.k)+s.ph);ctx.fillStyle=`rgba(255,255,255,${.25+tw*.7})`;ctx.fillRect(s.x*S.W,s.y*S.H,s.s*.5,s.s*.5)}}
function moon(ctx,x,y,r,c='#fff6d5'){ctx.save();ctx.shadowColor=c;ctx.shadowBlur=r;ctx.fillStyle=c;circle(ctx,x,y,r);ctx.restore()}
function strips(ctx,S,fnDx,h=2){const b=S.b;for(let y=Math.max(0,b.y0-S.fs*.3|0);y<Math.min(S.H,b.y1+S.fs*.3);y+=h){ctx.drawImage(S.textC,0,y,S.W,h,fnDx(y),y,S.W,h)}}
function strokeLetters(ctx,S,color,w,alphaFn){ctx.save();ctx.font=S.fontStr;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';S.chars.forEach((c,i)=>{if(c.ch===' ')return;ctx.globalAlpha=alphaFn?alphaFn(i):1;ctx.strokeStyle=color;ctx.lineWidth=w;ctx.strokeText(c.ch,c.x,c.y)});ctx.restore()}
function stripePattern(S,stops,P=200,angle=0){const c=mk(P,8),x=c.getContext('2d'),g=x.createLinearGradient(0,0,P,0);stops.forEach((s,i)=>g.addColorStop(i/(stops.length-1),s));x.fillStyle=g;x.fillRect(0,0,P,8);return c}
function patFill(x,S,cvs,shift,angle=-.5){x.save();const p=x.createPattern(cvs,'repeat');x.translate(S.cx,S.cy);x.rotate(angle);x.translate(shift,0);x.fillStyle=p;const R=Math.hypot(S.W,S.H)*.6;x.fillRect(-R-shift,-R*.6,R*2,R*1.2);x.restore()}
function vignette(ctx,S,a=.6){const g=ctx.createRadialGradient(S.W/2,S.H/2,Math.min(S.W,S.H)*.25,S.W/2,S.H/2,Math.max(S.W,S.H)*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${a})`);ctx.fillStyle=g;ctx.fillRect(0,0,S.W,S.H)}
function bug(ctx,x,y,ang,s,t,col,legs=3,ph=0){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.strokeStyle='#111';ctx.lineWidth=Math.max(1,s*.09);ctx.lineCap='round';
  for(let i=0;i<legs;i++){const lx=(i-(legs-1)/2)*s*.42,w=Math.sin(TAU*t*10+i*2+ph)*s*.2;for(const sd of[-1,1]){ctx.beginPath();ctx.moveTo(lx,0);ctx.lineTo(lx+w*sd*.5+s*.1,sd*s*.45);ctx.lineTo(lx+w*sd+s*.05,sd*s*.75);ctx.stroke()}}
  ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(-s*.1,0,s*.55,s*.38,0,0,TAU);ctx.fill();ctx.fillStyle='#111';circle(ctx,s*.5,0,s*.22);
  ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=Math.max(1,s*.05);ctx.beginPath();ctx.moveTo(s*.45,0);ctx.lineTo(-s*.62,0);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(-s*.05,-s*.15,s*.3,s*.1,0,0,TAU);ctx.fill();
  ctx.strokeStyle='#111';ctx.lineWidth=Math.max(1,s*.05);for(const sd of[-1,1]){ctx.beginPath();ctx.moveTo(s*.65,sd*s*.08);ctx.quadraticCurveTo(s*.9,sd*s*.1,s*1,sd*s*.35+Math.sin(TAU*t*4+ph)*s*.08);ctx.stroke()}ctx.restore()}
function walkPath(S,r,steps){const P=S.pts.inside;if(P.length<5)return null;let cur=pick(r,P),ang=r()*TAU;const path=[cur];const st=S.fs*.22;
  for(let i=0;i<steps;i++){ang+=(r()-.5)*1.4;const tx=cur[0]+Math.cos(ang)*st,ty=cur[1]+Math.sin(ang)*st;let best=null,bd=1e9;for(let j=0;j<40;j++){const q=P[Math.floor(r()*P.length)];const d=(q[0]-tx)**2+(q[1]-ty)**2;if(d<bd){bd=d;best=q}}
    ang=Math.atan2(best[1]-cur[1],best[0]-cur[0]);cur=best;path.push(cur)}
  return path.concat(path.slice(1,-1).reverse())}
function along(path,u){const n=path.length;const f=u*n,i=Math.floor(f)%n,j=(i+1)%n,k=f-Math.floor(f);const a=path[i],b=path[j];return[lerp(a[0],b[0],k),lerp(a[1],b[1],k),Math.atan2(b[1]-a[1],b[0]-a[0])]}
function rays(ctx,S,cx,cy,n,rot,color){ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.fillStyle=color;const R=Math.hypot(S.W,S.H);for(let i=0;i<n;i++){const a=i*TAU/n;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*R,Math.sin(a)*R);ctx.lineTo(Math.cos(a+TAU/n/2)*R,Math.sin(a+TAU/n/2)*R);ctx.fill()}ctx.restore()}

/* ---------- the effects ---------- */
const FX=[];const fx=(id,name,em,cat,draw,setup)=>FX.push({id,name,em,cat,draw,setup:setup||(()=>({}))});

/* ===== NATURE ===== */
fx('lightning','Lightning','⚡','Nature',(c,t,S,st)=>{bg(c,S);dim(c,S,.55,'5,5,25');
  let fl=0,act=null;for(const f of st.fl){if(t>=f.t0&&t<f.t0+f.len){const k=(t-f.t0)/f.len;const v=(1-k)*(Math.floor(k*6)%2?0.6:1);if(v>fl){fl=v;act=f}}}
  if(act){const r=rng(act.seed);for(let b=0;b<2;b++){const tg=S.pts.top.length?pick(r,S.pts.top):[S.cx,S.cy];const p=bolt(r,r()*S.W,-5,tg[0],tg[1],S.H*.35,7);zap(c,p,S.pal.a,Math.max(1.5,S.fs*.03));const mid=p[Math.floor(p.length*.4)];zap(c,bolt(r,mid[0],mid[1],mid[0]+(r()-.5)*S.W*.4,mid[1]+S.H*.25,S.H*.15,5),S.pal.a,Math.max(1,S.fs*.018))}}
  glow(c,S,S.pal.a,8+fl*35,1);
  const r=rng(Math.floor(t*30)+3);for(let i=0;i<3;i++){const p=S.pts.edge.length?pick(r,S.pts.edge):null;if(!p)break;const q=[p[0]+(r()-.5)*S.fs*.5,p[1]+(r()-.5)*S.fs*.5];zap(c,bolt(r,p[0],p[1],q[0],q[1],S.fs*.15,4),S.pal.a,1.2)}
  if(fl>0)dim(c,S,fl*.35,'230,240,255')},
  ()=>({fl:[{t0:.06,len:.13,seed:11},{t0:.47,len:.1,seed:23},{t0:.66,len:.08,seed:37}]}));

fx('snow','Snowfall','❄️','Nature',(c,t,S,st)=>{bg(c,S);
  const draw=f=>{const y=fract(f.y+t*f.k)*(S.H+20)-10,x=f.x*S.W+Math.sin(TAU*t+f.ph)*S.W*.03;c.fillStyle=`rgba(255,255,255,${f.front?.95:.6})`;circle(c,x,y,f.s*S.W/400)};
  st.f.filter(f=>!f.front).forEach(draw);txt(c,S);
  c.save();c.shadowColor='rgba(180,220,255,.8)';c.shadowBlur=4;coat(c,S,st.caps,'#fff');c.restore();
  st.f.filter(f=>f.front).forEach(draw)},
  S=>{const r=rng(5);return{f:falling(r,150,{smin:1.2,smax:4.5,front:.45}),caps:S.pts.top.filter((_,i)=>i%2==0).map(p=>[p[0],p[1]+S.fs*.02,S.fs*(.025+r()*.03)])}});

fx('rain','Thunderstorm Rain','🌧️','Nature',(c,t,S,st)=>{bg(c,S);dim(c,S,.45,'10,15,30');
  const flash=t>.7&&t<.76?(1-(t-.7)/.06):0;
  const dr=f=>{const y=fract(f.y+t*f.k*2)*(S.H+40)-20,x=f.x*(S.W+60)-30+y*.18;c.strokeStyle=`rgba(190,215,255,${f.front?.75:.35})`;c.lineWidth=f.front?1.6:1;c.beginPath();c.moveTo(x,y);c.lineTo(x-f.s*1.4*.18,y-f.s*4);c.stroke()};
  st.f.filter(f=>!f.front).forEach(dr);glow(c,S,'rgba(150,190,255,.5)',10);
  c.strokeStyle='rgba(220,235,255,.85)';c.lineWidth=1.2;for(const s of st.sp){const ph=fract(s.o+t*3);if(ph<.35){const k=ph/.35;c.globalAlpha=1-k;c.beginPath();c.ellipse(s.p[0],s.p[1],k*S.fs*.12,k*S.fs*.04,0,Math.PI,TAU);c.stroke();c.fillStyle='#dfeaff';circle(c,s.p[0]-k*S.fs*.1,s.p[1]-k*S.fs*.12+k*k*S.fs*.1,1.4);circle(c,s.p[0]+k*S.fs*.1,s.p[1]-k*S.fs*.12+k*k*S.fs*.1,1.4)}}c.globalAlpha=1;
  st.f.filter(f=>f.front).forEach(dr);if(flash)dim(c,S,flash*.3,'220,230,255')},
  S=>{const r=rng(9);return{f:falling(r,170,{smin:3,smax:6,front:.4}),sp:samp(r,S.pts.top,40).map(p=>({p,o:r()}))}});

fx('underwater','Underwater','🌊','Nature',(c,t,S,st)=>{bgCustom(c,S,['#0a6fa0','#03314f','#011a2b']);
  c.save();c.globalCompositeOperation='lighter';for(let i=0;i<6;i++){const x=S.W*(i/6)+Math.sin(TAU*t+i)*S.W*.05;c.fillStyle=`rgba(120,220,255,${.05+.04*Math.sin(TAU*t*2+i*1.7)})`;c.beginPath();c.moveTo(x,0);c.lineTo(x+S.W*.08,0);c.lineTo(x+S.W*.25,S.H);c.lineTo(x+S.W*.1,S.H);c.fill()}c.restore();
  strips(c,S,y=>Math.sin(y*.05+TAU*t)*S.fs*.06+Math.sin(y*.11-TAU*t*2)*S.fs*.02);
  c.save();c.globalCompositeOperation='lighter';overlayOnText(c,S,x=>{for(let i=0;i<14;i++){x.strokeStyle='rgba(160,240,255,.35)';x.lineWidth=2;x.beginPath();for(let X=0;X<=S.W;X+=10){x.lineTo(X,(i/14)*S.H+Math.sin(X*.04+TAU*t+i)*8)}x.stroke()}},1);c.restore();
  for(const b of st.b){const y=S.H+20-fract(b.y+t*b.k)*(S.H+40),x=b.x*S.W+Math.sin(TAU*t*2+b.ph)*6,r=b.s*S.W/420;c.strokeStyle='rgba(200,245,255,.75)';c.lineWidth=1.2;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();c.fillStyle='rgba(255,255,255,.7)';circle(c,x-r*.35,y-r*.35,r*.25)}
  dim(c,S,.12,'0,90,160')},S=>({b:falling(rng(4),45,{smin:2,smax:9})}));

fx('reflection','Lake Reflection','🏞️','Nature',(c,t,S,st)=>{bg(c,S);const b=S.b,h=b.y1-b.y0,off=Math.min(S.H*.17,h*.45);
  c.save();c.translate(0,-off);txt(c,S);c.restore();const wl=b.y1-off;
  c.fillStyle='rgba(0,40,80,.35)';c.fillRect(0,wl,S.W,S.H-wl);
  for(let y=wl;y<Math.min(S.H,wl+h*1.1);y+=2){const d=y-wl,srcY=b.y1-d;if(srcY<b.y0-S.fs*.2)break;const dx=Math.sin(d*.18-TAU*t*2)*(2+d*.05);c.globalAlpha=.55*(1-d/(h*1.1));c.drawImage(S.textC,0,srcY,S.W,2,dx,y,S.W,2)}c.globalAlpha=1;
  c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1;for(let i=0;i<10;i++){const y=wl+4+i*i*3;if(y>S.H)break;const ph=fract(t*2+i*.37);c.globalAlpha=.4*(1-i/10);c.beginPath();c.moveTo(S.W*ph-40,y);c.lineTo(S.W*ph+40,y);c.stroke()}c.globalAlpha=1});

fx('fire','Inferno','🔥','Nature',(c,t,S,st)=>{bg(c,S);dim(c,S,.55,'20,0,0');
  const fire=a=>{c.save();c.globalCompositeOperation='lighter';for(const p of st.p){const ph=fract(p.o+t*p.k);const y=p.y-ph*p.h,x=p.x+Math.sin(ph*7+p.w+TAU*t)*p.s*.7,r=p.s*(1-ph*.85);c.globalAlpha=(1-ph)*.5*a;c.fillStyle=hsl(55-ph*55,100,lerp(65,40,ph));circle(c,x,y,r)}c.restore()};
  fire(1);glow(c,S,'#ff6a00',18+6*Math.sin(TAU*t*4));fire(.35);
  c.fillStyle='#ffd27a';for(const e of st.e){const ph=fract(e.o+t*e.k);c.globalAlpha=1-ph;circle(c,e.x+Math.sin(ph*9+e.o*9)*10,e.y-ph*S.H*.5,1.4)}c.globalAlpha=1},
  S=>{const r=rng(3),src=S.pts.top.concat(S.pts.inside.filter((_,i)=>i%5==0));return{p:samp(r,src,280).map(q=>({x:q[0],y:q[1],o:r(),k:1+Math.floor(r()*3),h:S.fs*(.35+r()*.8),s:S.fs*(.05+r()*.07),w:r()*TAU})),e:samp(r,S.pts.top,25).map(q=>({x:q[0],y:q[1],o:r(),k:1+Math.floor(r()*2)}))}});

fx('mud','Mud Slide','🟫','Nature',(c,t,S,st)=>{bg(c,S);txt(c,S);
  c.fillStyle='#4a2f17';for(const s of st.spl){circle(c,s[0],s[1],s[2])}
  coat(c,S,st.caps,'#5b3a1c');c.fillStyle='rgba(190,140,90,.5)';for(const p of st.caps)circle(c,p[0]-p[2]*.3,p[1]-p[2]*.45,p[2]*.3);
  drips(c,S,t,st.d,'#5b3a1c','#b08055');
  c.fillStyle='rgba(255,230,190,.8)';for(const b of st.bub){const ph=fract(b.o+t*2);if(ph<.5){c.strokeStyle='rgba(255,230,190,.7)';c.lineWidth=1;c.beginPath();c.arc(b.p[0],b.p[1]-2,ph*S.fs*.08,Math.PI,TAU);c.stroke()}}},
  S=>{const r=rng(12);return{d:mkDrips(S,r,Math.min(26,Math.max(6,S.chars.length*2)),.35,1.1,1.1),caps:S.pts.top.filter((_,i)=>i%2==0).map(p=>[p[0],p[1]+S.fs*.03,S.fs*(.03+r()*.035)]),
    spl:Array.from({length:22},()=>{const p=S.pts.edge.length?pick(r,S.pts.edge):[S.cx,S.cy];return[p[0]+(r()-.5)*S.fs*.6,p[1]+(r()-.5)*S.fs*.6,S.fs*(.01+r()*.025)]}),bub:samp(r,S.pts.top,10).map(p=>({p,o:r()}))}});

fx('lava','Lava Flow','🌋','Nature',(c,t,S,st)=>{bgCustom(c,S,['#1a0000','#3d0700','#7a1500']);
  c.save();c.globalCompositeOperation='lighter';for(const b of st.b){const y=S.H+40-fract(b.y+t*b.k)*(S.H+80);const g=c.createRadialGradient(b.x*S.W,y,0,b.x*S.W,y,b.s*S.W/40);g.addColorStop(0,'rgba(255,120,0,.35)');g.addColorStop(1,'rgba(255,40,0,0)');c.fillStyle=g;circle(c,b.x*S.W,y,b.s*S.W/40)}c.restore();
  fillWith(c,S,x=>{const g=x.createLinearGradient(0,S.b.y0,0,S.b.y1);const p=.5+.5*Math.sin(TAU*t);g.addColorStop(0,'#fff27a');g.addColorStop(.4+p*.2,'#ff8c00');g.addColorStop(1,'#d10000');x.fillStyle=g;x.fillRect(0,0,S.W,S.H);
    x.strokeStyle='rgba(60,0,0,.55)';x.lineWidth=2;for(const cr of st.cr)poly(x,cr.map(q=>[q[0]+Math.sin(TAU*t+q[1]*.05)*2,q[1]]))});
  c.save();c.globalCompositeOperation='lighter';glow(c,S,'#ff4500',20+10*Math.sin(TAU*t*2),.35);c.restore();
  drips(c,S,t,st.d,'#ff5a00','#ffe066','#ff3300')},
  S=>{const r=rng(21);return{b:falling(r,20,{smin:4,smax:9}),d:mkDrips(S,r,Math.min(18,Math.max(5,S.chars.length*1.5|0)),.3,.9),cr:Array.from({length:10},()=>{const p=S.pts.inside.length?pick(r,S.pts.inside):[S.cx,S.cy];return bolt(r,p[0],p[1],p[0]+(r()-.5)*S.fs,p[1]+(r()-.5)*S.fs*.6,S.fs*.2,4)})}});

fx('ice','Frozen Solid','🧊','Nature',(c,t,S,st)=>{bg(c,S);txt(c,S);
  overlayOnText(c,S,x=>{const g=x.createLinearGradient(0,S.b.y0,0,S.b.y1);g.addColorStop(0,'rgba(230,250,255,.75)');g.addColorStop(1,'rgba(120,200,255,.45)');x.fillStyle=g;x.fillRect(0,0,S.W,S.H);
    const p=lerp(-.4,1.4,fract(t))*S.W;const s=x.createLinearGradient(p-60,0,p+60,0);s.addColorStop(0,'rgba(255,255,255,0)');s.addColorStop(.5,'rgba(255,255,255,.9)');s.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=s;x.fillRect(0,0,S.W,S.H)},.85);
  for(const i of st.ic){const g=c.createLinearGradient(i.x,i.y,i.x,i.y+i.len);g.addColorStop(0,'rgba(240,252,255,.95)');g.addColorStop(1,'rgba(150,215,255,.5)');c.fillStyle=g;c.beginPath();c.moveTo(i.x-i.w,i.y-2);c.lineTo(i.x+i.w,i.y-2);c.lineTo(i.x,i.y+i.len);c.fill();
    const ph=fract(i.o+t);if(ph>.6){const k=(ph-.6)/.4;c.fillStyle='rgba(200,240,255,.9)';circle(c,i.x,i.y+i.len+k*k*S.H*.5,2)}}
  coat(c,S,st.caps,'rgba(250,254,255,.95)');
  for(const g of st.gl){const v=Math.pow(Math.max(0,Math.sin(TAU*(t*2+g.o))),6);sparkle(c,g.p[0],g.p[1],v*S.fs*.14,'#e8fbff')}},
  S=>{const r=rng(8);return{ic:spread(S.pts.bottom,Math.min(30,Math.max(8,S.chars.length*3)),r).map(p=>({x:p[0],y:p[1],len:S.fs*(.12+r()*.35),w:S.fs*(.025+r()*.03),o:r()})),caps:S.pts.top.filter((_,i)=>i%3==0).map(p=>[p[0],p[1]+S.fs*.02,S.fs*(.015+r()*.02)]),gl:samp(r,S.pts.inside,22).map(p=>({p,o:r()}))}});

fx('leaves','Autumn Leaves','🍂','Nature',(c,t,S,st)=>{bg(c,S);const d=f=>{const y=fract(f.y+t*f.k)*(S.H+60)-30,x=f.x*S.W+Math.sin(TAU*t*f.k+f.ph)*S.W*.06,s=f.s*S.W/300;c.save();c.translate(x,y);c.rotate(f.ph+TAU*t*f.rk);c.scale(1,Math.cos(TAU*t*f.k+f.ph));c.fillStyle=f.c;c.beginPath();c.moveTo(-s*2,0);c.quadraticCurveTo(0,-s*1.4,s*2,0);c.quadraticCurveTo(0,s*1.4,-s*2,0);c.fill();c.strokeStyle='rgba(60,20,0,.6)';c.lineWidth=.8;c.beginPath();c.moveTo(-s*2.5,0);c.lineTo(s*1.8,0);c.stroke();c.restore()};
  st.f.filter(f=>!f.front).forEach(d);glow(c,S,'rgba(0,0,0,.4)',8);st.f.filter(f=>f.front).forEach(d)},
  ()=>({f:falling(rng(14),40,{smin:2.5,smax:5,colors:['#e85d04','#f48c06','#dc2f02','#ffba08','#9d0208','#bc6c25'],front:.4})}));

fx('sakura','Cherry Blossoms','🌸','Nature',(c,t,S,st)=>{bg(c,S);const d=f=>{const y=fract(f.y+t*f.k)*(S.H+40)-20,x=fract(f.x+t*(f.k%2?1:0))*S.W+Math.sin(TAU*t*2+f.ph)*12,s=f.s*S.W/320;c.save();c.translate(x,y);c.rotate(f.ph+TAU*t*f.rk);c.scale(Math.cos(TAU*t*2+f.ph),1);c.fillStyle=f.c;c.beginPath();c.moveTo(0,-s*1.5);c.quadraticCurveTo(s*1.4,-s*.4,0,s*1.5);c.quadraticCurveTo(-s*1.4,-s*.4,0,-s*1.5);c.fill();c.restore()};
  st.f.filter(f=>!f.front).forEach(d);glow(c,S,'rgba(255,150,200,.6)',10);st.f.filter(f=>f.front).forEach(d)},
  ()=>({f:falling(rng(15),70,{smin:1.5,smax:3.5,colors:['#ffc8dd','#ffafcc','#fde2e4','#ff8fab'],front:.4})}));

fx('sandstorm','Sandstorm','🏜️','Nature',(c,t,S,st)=>{bg(c,S);dim(c,S,.35,'194,154,90');
  const sh=Math.sin(TAU*t*8)*S.fs*.015;glow(c,S,'rgba(80,50,10,.6)',6,1,sh,0);
  for(const p of st.p){const x=fract(p.x+t*p.k)*(S.W+30)-15,y=p.y*S.H+Math.sin(TAU*t*p.k+p.ph)*8;c.fillStyle=`rgba(${p.front?'240,205,150':'200,160,100'},${p.front?.85:.5})`;c.fillRect(x,y,p.s*1.8,p.s*.5)}
  for(let i=0;i<4;i++){const x=fract(i/4+t)*S.W*1.6-S.W*.3;const g=c.createRadialGradient(x,S.H*(.2+i*.2),0,x,S.H*(.2+i*.2),S.W*.35);g.addColorStop(0,'rgba(210,170,110,.28)');g.addColorStop(1,'rgba(210,170,110,0)');c.fillStyle=g;c.fillRect(0,0,S.W,S.H)}},
  ()=>({p:falling(rng(16),320,{smin:.6,smax:2.4,kmin:1,kr:3})}));

fx('smoke','Smoky','💨','Nature',(c,t,S,st)=>{bg(c,S);dim(c,S,.3);const puff=a=>{for(const p of st.p){const ph=fract(p.o+t*p.k);const y=p.y-ph*S.fs*2.2,x=p.x+Math.sin(ph*4+p.o*9)*S.fs*.3,r=S.fs*(.08+ph*.5);const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(200,200,210,${.22*Math.sin(Math.PI*ph)*a})`);g.addColorStop(1,'rgba(200,200,210,0)');c.fillStyle=g;circle(c,x,y,r)}};
  puff(1);txt(c,S);puff(.45)},S=>{const r=rng(17);return{p:samp(r,S.pts.top.concat(S.pts.inside),55).map(q=>({x:q[0],y:q[1],o:r(),k:1+Math.floor(r()*2)}))}});

fx('clouds','Head in the Clouds','☁️','Nature',(c,t,S,st)=>{bgCustom(c,S,['#4facfe','#9fd6ff','#e0f4ff']);
  const cl=(cd,a)=>{const x=fract(cd.x+t*cd.k)*(S.W+cd.s*3)-cd.s*1.5,y=cd.y*S.H;c.fillStyle=`rgba(255,255,255,${a})`;for(const b of cd.b)circle(c,x+b[0]*cd.s,y+b[1]*cd.s,b[2]*cd.s)};
  st.c.filter(q=>!q.front).forEach(q=>cl(q,.9));glow(c,S,'rgba(0,60,140,.35)',14);st.c.filter(q=>q.front).forEach(q=>cl(q,.45))},
  S=>{const r=rng(18);return{c:Array.from({length:9},(_,i)=>({x:r(),y:r(),k:1,s:S.W*(.07+r()*.08),front:i<2,b:Array.from({length:6},()=>[(r()-.5)*2.2,(r()-.5)*.6,.45+r()*.5])}))}});

fx('aurora','Northern Lights','🌌','Nature',(c,t,S,st)=>{bgCustom(c,S,['#000814','#001d3d','#00111f']);stars(c,S,st.s,t);
  c.save();c.globalCompositeOperation='lighter';const bands=[[140,0],[170,1.7],[285,3.1]];
  for(const[h,o] of bands){const g=c.createLinearGradient(0,0,0,S.H*.45);g.addColorStop(0,hsl(h,100,60,0));g.addColorStop(.5,hsl(h,100,60,.22));g.addColorStop(1,hsl(h,100,60,0));c.fillStyle=g;
    for(let x=0;x<S.W;x+=5){const y=S.H*.12+Math.sin(x*.012+TAU*t+o)*S.H*.08+Math.sin(x*.027-TAU*t*2+o)*S.H*.04;c.save();c.translate(x,y);c.fillRect(0,0,5,S.H*.45);c.restore()}}
  c.restore();glow(c,S,'#7cffb2',16+6*Math.sin(TAU*t))},()=>({s:falling(rng(19),70,{smin:2,smax:4})}));

fx('bubbles','Bubble Bath','🫧','Nature',(c,t,S,st)=>{bg(c,S);const dy=Math.sin(TAU*t)*S.fs*.05;
  const bb=b=>{const y=S.H+30-fract(b.y+t*b.k)*(S.H+60),x=b.x*S.W+Math.sin(TAU*t*2+b.ph)*10,r=b.s*S.W/200;const g=c.createRadialGradient(x-r*.3,y-r*.3,r*.1,x,y,r);g.addColorStop(0,'rgba(255,255,255,.05)');g.addColorStop(.8,hsl((b.ph*60+t*360)%360,90,75,.25));g.addColorStop(1,'rgba(255,255,255,.7)');c.fillStyle=g;circle(c,x,y,r);c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.ellipse(x-r*.4,y-r*.45,r*.22,r*.12,-.6,0,TAU);c.fill()};
  st.b.filter(b=>!b.front).forEach(bb);txt(c,S,1,0,dy);st.b.filter(b=>b.front).forEach(bb)},()=>({b:falling(rng(20),34,{smin:2,smax:7,front:.35})}));

fx('sunshine','Sunshine','☀️','Nature',(c,t,S,st)=>{bg(c,S);rays(c,S,S.cx,S.cy,14,TAU/14*t*2,'rgba(255,220,90,.22)');
  const g=c.createRadialGradient(S.cx,S.cy,0,S.cx,S.cy,S.W*.5);g.addColorStop(0,'rgba(255,240,170,.55)');g.addColorStop(1,'rgba(255,200,80,0)');c.fillStyle=g;c.fillRect(0,0,S.W,S.H);
  const s=1+.03*Math.sin(TAU*t*2);about(c,S,s,s,0,()=>glow(c,S,'rgba(255,170,0,.8)',18))});

fx('starfield','Hyperspace','🚀','Sci‑Fi',(c,t,S,st)=>{c.fillStyle='#02010a';c.fillRect(0,0,S.W,S.H);c.save();c.globalCompositeOperation='lighter';const R=Math.hypot(S.W,S.H)*.6;
  for(const s of st.s){const z=fract(s.z+t*s.k);const d0=Math.pow(z,2.2)*R,d1=Math.pow(Math.min(1,z+.06),2.2)*R;c.strokeStyle=`rgba(${s.c},${z})`;c.lineWidth=z*2.5;c.beginPath();c.moveTo(S.W/2+Math.cos(s.a)*d0,S.H/2+Math.sin(s.a)*d0);c.lineTo(S.W/2+Math.cos(s.a)*d1,S.H/2+Math.sin(s.a)*d1);c.stroke()}c.restore();
  const p=1+.04*Math.sin(TAU*t*2);about(c,S,p,p,0,()=>glow(c,S,S.pal.a,20))},()=>{const r=rng(22);return{s:Array.from({length:240},()=>({a:r()*TAU,z:r(),k:1+Math.floor(r()*2),c:pick(r,['255,255,255','160,200,255','255,200,255'])}))}});

fx('tornado','Tornado','🌪️','Nature',(c,t,S,st)=>{bg(c,S);dim(c,S,.35,'40,50,40');const top=S.H*.05,bot=S.H*.95;
  const deb=front=>{for(const d of st.d){const a=d.a+TAU*t*d.k,y=lerp(top,bot,d.h),rad=lerp(S.W*.45,S.W*.06,d.h);if((Math.sin(a)>0)!==front)continue;const x=S.cx+Math.cos(a)*rad+Math.sin(TAU*t+d.h*5)*S.W*.04;c.save();c.translate(x,y);c.rotate(a*3);c.fillStyle=d.c;c.globalAlpha=front?.95:.5;c.fillRect(-d.s,-d.s*.5,d.s*2,d.s);c.restore()}};
  c.strokeStyle='rgba(200,200,190,.15)';c.lineWidth=2;for(let i=0;i<12;i++){const h=i/12,y=lerp(top,bot,h),rad=lerp(S.W*.45,S.W*.06,h);c.beginPath();c.ellipse(S.cx+Math.sin(TAU*t+h*5)*S.W*.04,y,rad,rad*.18,0,0,TAU);c.stroke()}
  deb(false);letters(c,S,(ch,i)=>({r:Math.sin(TAU*t*2+i*.8)*.18,dy:Math.sin(TAU*t*2+i)*S.fs*.06}));deb(true)},
  S=>{const r=rng(23);return{d:Array.from({length:130},()=>({a:r()*TAU,h:r(),k:1+Math.floor(r()*2),s:S.W*(.004+r()*.01),c:pick(r,['#5c4a36','#7a6a55','#3d3328','#8a8a7a','#4f6b3a'])}))}});

/* ===== SPOOKY ===== */
fx('bugs','Bug Infestation','🐞','Spooky',(c,t,S,st)=>{bg(c,S);txt(c,S);for(const b of st.b){if(!b.path)continue;const[x,y,a]=along(b.path,fract(b.o+t));bug(c,x,y,a,b.s,t,b.c,3,b.o*9)}},
  S=>{const r=rng(31);return{b:Array.from({length:Math.min(12,4+S.chars.length)},()=>({path:walkPath(S,r,9),o:r(),s:S.fs*(.15+r()*.08),c:pick(r,['#1b1b1b','#2d6a4f','#6a040f','#3a0ca3','#7f4f24','#b5179e'])}))}});

fx('ants','Ant March','🐜','Spooky',(c,t,S,st)=>{bg(c,S);txt(c,S);const n=26;
  for(const L of st.l){for(let i=0;i<n;i++){const u=fract(i/n+t*L.k*L.dir);const x=u*(S.W+40)-20,yf=X=>L.y+Math.sin(X*L.f+L.ph)*S.fs*.35;const y=yf(x),y2=yf(x+1);let a=Math.atan2(y2-y,1);if(L.dir<0)a+=Math.PI;
    const s=S.fs*.07;c.save();c.translate(x,y);c.rotate(a);c.strokeStyle='#111';c.lineWidth=Math.max(.8,s*.12);for(let j=-1;j<=1;j++){const w=Math.sin(TAU*t*16+i+j)*s*.3;c.beginPath();c.moveTo(j*s*.5,0);c.lineTo(j*s*.5+w,s*.9);c.moveTo(j*s*.5,0);c.lineTo(j*s*.5-w,-s*.9);c.stroke()}
    c.fillStyle='#111';c.beginPath();c.ellipse(-s*.9,0,s*.6,s*.38,0,0,TAU);c.fill();circle(c,0,0,s*.3);circle(c,s*.65,0,s*.35);c.restore()}}},
  S=>{const r=rng(32);return{l:[0,1,2].map(i=>({y:S.b.y0+(S.b.y1-S.b.y0)*(.2+.3*i),f:.02+r()*.02,ph:r()*TAU,k:1,dir:i%2?-1:1}))}});

fx('spiders','Spider Drop','🕷️','Spooky',(c,t,S,st)=>{bg(c,S);dim(c,S,.45);
  c.strokeStyle='rgba(230,230,230,.45)';c.lineWidth=1;for(const[cx,cy,sx] of [[0,0,1],[S.W,0,-1]]){const R=S.W*.32;for(let i=0;i<=6;i++){const a=i/6*Math.PI/2;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+sx*Math.cos(a)*R,cy+Math.sin(a)*R);c.stroke()}for(let k=1;k<=5;k++){c.beginPath();for(let i=0;i<=6;i++){const a=i/6*Math.PI/2,rr=R*k/5*(i%2?.92:1);c.lineTo(cx+sx*Math.cos(a)*rr,cy+Math.sin(a)*rr)}c.stroke()}}
  glow(c,S,'rgba(140,0,0,.7)',14);
  for(const s of st.s){const y=s.y0+(.5-.5*Math.cos(TAU*(t*s.k+s.o)))*s.rng,x=s.x+Math.sin(TAU*t+s.o*5)*3;c.strokeStyle='rgba(230,230,230,.6)';c.beginPath();c.moveTo(s.x,0);c.lineTo(x,y);c.stroke();
    const z=s.s;c.save();c.translate(x,y);c.strokeStyle='#0b0b0b';c.lineWidth=Math.max(1,z*.12);c.lineCap='round';for(let i=0;i<4;i++){const w=Math.sin(TAU*t*6+i)*z*.15;for(const sd of[-1,1]){c.beginPath();c.moveTo(0,(i-1.5)*z*.18);c.lineTo(sd*z*.8,(i-1.5)*z*.45-z*.4+w);c.lineTo(sd*z*1.2,(i-1.5)*z*.55+z*.3+w);c.stroke()}}
    c.fillStyle='#0b0b0b';circle(c,0,z*.15,z*.5);circle(c,0,-z*.45,z*.3);c.fillStyle='#ff1a1a';circle(c,-z*.1,-z*.5,z*.07);circle(c,z*.1,-z*.5,z*.07);c.restore()}},
  S=>{const r=rng(33);return{s:Array.from({length:6},(_,i)=>({x:S.W*(.1+.8*(i+.5)/6)+(r()-.5)*20,y0:S.H*(.1+r()*.15),rng:S.H*(.25+r()*.45),o:r(),k:1,s:S.W*(.022+r()*.015)}))}});

fx('worms','Worm Party','🪱','Spooky',(c,t,S,st)=>{bg(c,S);txt(c,S);
  for(const w of st.w){const e=Math.max(0,Math.sin(TAU*(t+w.o)));c.fillStyle='rgba(30,10,0,.8)';c.beginPath();c.ellipse(w.p[0],w.p[1],S.fs*.07,S.fs*.03,0,0,TAU);c.fill();if(e<.02)continue;
    const L=e*S.fs*.7,pts=[];for(let i=0;i<=10;i++){const k=i/10;pts.push([w.p[0]+Math.sin(k*4+TAU*t*2+w.o*6)*S.fs*.08*k,w.p[1]-k*L])}
    c.lineCap='round';c.lineJoin='round';c.strokeStyle='#e5737f';c.lineWidth=S.fs*.07;poly(c,pts);c.strokeStyle='#ffa3ae';c.lineWidth=S.fs*.025;poly(c,pts.map(q=>[q[0]-S.fs*.012,q[1]]));
    c.strokeStyle='rgba(150,40,60,.6)';c.lineWidth=1;for(let i=2;i<10;i+=2){const q=pts[i];c.beginPath();c.moveTo(q[0]-S.fs*.035,q[1]);c.lineTo(q[0]+S.fs*.035,q[1]);c.stroke()}
    const h=pts[10];c.fillStyle='#000';circle(c,h[0]-S.fs*.015,h[1],1.5);circle(c,h[0]+S.fs*.015,h[1],1.5)}},
  S=>{const r=rng(34);return{w:samp(r,S.pts.top,Math.min(14,4+S.chars.length)).map(p=>({p,o:r()}))}});

fx('blood','Bloody','🩸','Spooky',(c,t,S,st)=>{bg(c,S);dim(c,S,.5,'20,0,0');const fl=.85+.15*Math.sin(TAU*t*3)*Math.sin(TAU*t*7);glow(c,S,'rgba(255,0,0,.6)',12*fl);
  c.fillStyle='#7a0000';for(const s of st.spl)circle(c,s[0],s[1],s[2]);coat(c,S,st.caps,'#8a0000');drips(c,S,t,st.d,'#8a0000','#ff3b3b')},
  S=>{const r=rng(35);return{d:mkDrips(S,r,Math.min(24,Math.max(6,S.chars.length*2)),.4,1.4,.8),caps:S.pts.top.filter((_,i)=>i%3==0).map(p=>[p[0],p[1]+S.fs*.03,S.fs*(.015+r()*.025)]),spl:Array.from({length:30},()=>{const p=S.pts.edge.length?pick(r,S.pts.edge):[S.cx,S.cy];return[p[0]+(r()-.5)*S.fs,p[1]+(r()-.5)*S.fs,S.fs*(.006+r()*.02)]})}});

fx('ghosts','Haunted','👻','Spooky',(c,t,S,st)=>{bg(c,S);dim(c,S,.5,'5,10,20');
  const gh=(g,front)=>{const a=TAU*(t+g.o);if((Math.sin(a)>0)!==front)return;const x=S.cx+Math.cos(a)*S.W*.4,y=S.cy+Math.sin(TAU*(t*2+g.o))*S.H*.28,s=g.s;c.save();c.translate(x,y);c.globalAlpha=front?.85:.45;c.fillStyle='#f4f8ff';c.shadowColor='#bfe7ff';c.shadowBlur=14;c.beginPath();c.arc(0,0,s,Math.PI,0);
    for(let i=0;i<=6;i++){c.lineTo(s-i*s/3,s*1.1+Math.sin(TAU*t*4+i)*s*.15*(i%2?1:-1))}c.closePath();c.fill();c.shadowBlur=0;c.fillStyle='#111';c.beginPath();c.ellipse(-s*.35,-s*.1,s*.15,s*.25,0,0,TAU);c.ellipse(s*.35,-s*.1,s*.15,s*.25,0,0,TAU);c.fill();c.beginPath();c.ellipse(0,s*.4,s*.18,s*.25*(.6+.4*Math.sin(TAU*t*3)),0,0,TAU);c.fill();c.restore()};
  st.g.forEach(g=>gh(g,false));const r=rng(Math.floor(t*20));const a=r()<.12?.35:.9;glow(c,S,'#bfe7ff',14,a*.4,Math.sin(TAU*t*2)*S.fs*.12,0);glow(c,S,'#bfe7ff',18,a,0,Math.sin(TAU*t)*S.fs*.05);st.g.forEach(g=>gh(g,true))},
  S=>{const r=rng(36);return{g:Array.from({length:4},(_,i)=>({o:i/4+r()*.1,s:S.W*(.04+r()*.03)}))}});

fx('fog','Graveyard Fog','🌫️','Spooky',(c,t,S,st)=>{bgCustom(c,S,['#0b0f1a','#1c2333','#2a2f3a']);moon(c,S.W*.8,S.H*.18,S.W*.08);stars(c,S,st.s,t);
  const layer=(L,a)=>{for(const b of L){const x=fract(b.x+t*b.k*b.d)*(S.W+b.r*2)-b.r;const g=c.createRadialGradient(x,b.y*S.H,0,x,b.y*S.H,b.r);g.addColorStop(0,`rgba(200,210,225,${a})`);g.addColorStop(1,'rgba(200,210,225,0)');c.fillStyle=g;c.fillRect(x-b.r,b.y*S.H-b.r,b.r*2,b.r*2)}};
  layer(st.l1,.35);glow(c,S,'rgba(170,200,255,.5)',12);layer(st.l2,.22)},
  S=>{const r=rng(37);const L=n=>Array.from({length:n},()=>({x:r(),y:.3+r()*.7,r:S.W*(.15+r()*.2),k:1,d:r()<.5?1:-1}));return{l1:L(8),l2:L(7),s:falling(r,40)}});

fx('zombie','Zombie Twitch','🧟','Spooky',(c,t,S,st)=>{bg(c,S);dim(c,S,.4,'0,30,0');const r=rng(Math.floor(t*24)+5);
  letters(c,S,()=>({dx:(r()-.5)*S.fs*.08,dy:(r()-.5)*S.fs*.08,r:(r()-.5)*.25,shadow:'#4dff4d',blur:10}));
  drips(c,S,t,st.d,'#5bbf2a','#c6ff7a','#39ff14')},S=>({d:mkDrips(S,rng(38),Math.min(16,Math.max(5,S.chars.length*1.5|0)),.25,.8,.8)}));

fx('eyes','Eyes in the Dark','👀','Spooky',(c,t,S,st)=>{c.fillStyle='#030305';c.fillRect(0,0,S.W,S.H);
  for(const e of st.e){const k=fract(t+e.o)/.07;const open=k<1?Math.abs(2*k-1):1;const lx=Math.cos(TAU*t+e.o*6)*e.s*.25,ly=Math.sin(TAU*t*2+e.o*4)*e.s*.15;
    for(const sd of[-1,1]){const x=e.x+sd*e.s*1.3,y=e.y;c.save();c.translate(x,y);c.scale(1,Math.max(.05,open));c.shadowColor=e.c;c.shadowBlur=e.s;c.fillStyle=e.c;c.beginPath();c.ellipse(0,0,e.s,e.s*.6,0,0,TAU);c.fill();c.shadowBlur=0;c.fillStyle='#000';c.beginPath();c.ellipse(lx,ly,e.s*.18,e.s*.5,0,0,TAU);c.fill();c.restore()}}
  glow(c,S,'rgba(255,255,255,.35)',10,.95)},
  S=>{const r=rng(39);const e=[];let tries=0;while(e.length<14&&tries++<500){const x=r()*S.W,y=r()*S.H,s=S.W*(.012+r()*.018);if(x>S.b.x0-s*3&&x<S.b.x1+s*3&&y>S.b.y0-s*2&&y<S.b.y1+s*2)continue;if(e.some(q=>Math.hypot(q.x-x,q.y-y)<s*5))continue;e.push({x,y,s,o:r(),c:pick(r,['#ffd000','#ff2a2a','#9dff00','#ffae00'])})}return{e}});

fx('static','Static TV','📺','Spooky',(c,t,S,st)=>{c.fillStyle='#111';c.fillRect(0,0,S.W,S.H);noise(c,S,t,.55);const r=rng(Math.floor(t*30));const roll=r()<.15?(r()-.5)*S.fs*.6:0;
  c.save();c.globalAlpha=.9;c.drawImage(S.textC,0,roll);c.restore();noise(c,S,t+.37,.18);scan(c,S,.35,Math.floor(t*30));
  const by=fract(t*1)*S.H*1.2-S.H*.1;c.fillStyle='rgba(255,255,255,.08)';c.fillRect(0,by,S.W,S.H*.08);vignette(c,S,.7)});

fx('vhs','VHS Tape','📼','Spooky',(c,t,S,st)=>{bg(c,S);dim(c,S,.35);const r=rng(Math.floor(t*24)+9);const j=r()<.2?(r()-.5)*S.fs*.15:0;
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.55;c.drawImage(S.tint('#ff0040'),-3+j,0);c.drawImage(S.tint('#00c8ff'),3+j,0);c.restore();txt(c,S,.85,j,0);
  const ty=fract(t)*S.H*1.3-S.H*.15,bh=S.H*.06;if(ty+bh>0&&ty<S.H){const tx=S.tmpX;tx.setTransform(1,0,0,1,0,0);tx.globalCompositeOperation='copy';tx.drawImage(c.canvas,0,0);tx.globalCompositeOperation='source-over';c.drawImage(S.tmp,0,ty,S.W,bh,(r()-.5)*14,ty,S.W,bh);c.fillStyle='rgba(255,255,255,.08)';c.fillRect(0,ty,S.W,bh)}noise(c,S,t,.08);scan(c,S,.22);
  c.font=`bold ${Math.round(S.W*.05)}px "Courier New",monospace`;c.textAlign='left';c.textBaseline='top';c.fillStyle='#fff';c.shadowColor='#000';c.shadowBlur=3;c.fillText('PLAY ▶',S.W*.05,S.H*.05);
  c.textBaseline='bottom';c.fillText('SP  0:00:'+String(Math.floor(t*60)%60).padStart(2,'0'),S.W*.05,S.H*.95);c.shadowBlur=0});

fx('bats','Bat Swarm','🦇','Spooky',(c,t,S,st)=>{bgCustom(c,S,['#1a0b2e','#3c1361','#ff7b00']);moon(c,S.W*.5,S.H*.42,S.W*.22,'#ffe8a3');glow(c,S,'#000',10);
  for(const b of st.b){const x=fract(b.x+t*b.k)*(S.W+80)-40,y=b.y*S.H+Math.sin(TAU*t*b.k*2+b.ph)*S.H*.06,f=Math.sin(TAU*t*8+b.ph),s=b.s;c.save();c.translate(x,y);c.fillStyle='#0a0a0a';
    for(const sd of[-1,1]){c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(sd*s,-s*.6*f-s*.3,sd*s*2,-s*f*.9);c.lineTo(sd*s*1.6,-s*f*.4+s*.2);c.lineTo(sd*s*1.2,-s*f*.3+s*.35);c.lineTo(sd*s*.6,s*.3);c.closePath();c.fill()}c.beginPath();c.ellipse(0,s*.1,s*.3,s*.45,0,0,TAU);c.fill();c.restore()}},
  S=>({b:falling(rng(40),16,{smin:S.W*.015,smax:S.W*.03})}));

fx('quake','Earthquake','💥','Spooky',(c,t,S,st)=>{bg(c,S);const env=Math.pow(Math.max(0,Math.sin(TAU*t)),.5);const r=rng(Math.floor(t*30));const sx=(r()-.5)*S.fs*.12*env,sy=(r()-.5)*S.fs*.12*env;
  c.save();c.translate(sx,sy);txt(c,S);c.strokeStyle='rgba(0,0,0,.85)';c.lineWidth=Math.max(1.5,S.fs*.02);for(const k of st.k)poly(c,k);c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=1;for(const k of st.k)poly(c,k.map(q=>[q[0]+1,q[1]+1]));c.restore();
  c.fillStyle='#6b5a48';for(const d of st.d){const ph=fract(d.o+t*2);circle(c,d.p[0]+sx,d.p[1]+ph*ph*S.H*.6,d.s)}dim(c,S,env*.08,'120,90,60')},
  S=>{const r=rng(41);return{k:Array.from({length:Math.min(10,3+S.chars.length)},()=>{const p=S.pts.inside.length?pick(r,S.pts.inside):[S.cx,S.cy];return bolt(r,p[0],p[1]-S.fs*.4,p[0]+(r()-.5)*S.fs*.4,p[1]+S.fs*.4,S.fs*.25,4)}),d:samp(r,S.pts.bottom,25).map(p=>({p,o:r(),s:S.fs*(.01+r()*.025)}))}});

fx('slime','Toxic Slime','🧪','Spooky',(c,t,S,st)=>{bg(c,S);dim(c,S,.35,'0,25,0');glow(c,S,'#39ff14',16+8*Math.sin(TAU*t*2));coat(c,S,st.caps,'#5cd13a');drips(c,S,t,st.d,'#5cd13a','#d4ff9a','#39ff14');
  for(const b of st.b){const ph=fract(b.o+t*2);if(ph<.8){c.strokeStyle='rgba(200,255,150,.9)';c.fillStyle='rgba(120,255,80,.35)';c.lineWidth=1.2;c.beginPath();c.arc(b.p[0],b.p[1]-2,ph/.8*S.fs*.07,0,TAU);c.fill();c.stroke()}else{c.fillStyle='#c6ff7a';for(let i=0;i<5;i++){const a=i/5*TAU;circle(c,b.p[0]+Math.cos(a)*S.fs*.1*(ph-.8)*5,b.p[1]+Math.sin(a)*S.fs*.1*(ph-.8)*5,1.4)}}}},
  S=>{const r=rng(42);return{d:mkDrips(S,r,Math.min(20,Math.max(6,S.chars.length*2)),.3,1),caps:S.pts.top.filter((_,i)=>i%2==0).map(p=>[p[0],p[1]+S.fs*.03,S.fs*(.02+r()*.03)]),b:samp(r,S.pts.top,12).map(p=>({p,o:r()}))}});

fx('candle','Candlelight','🕯️','Spooky',(c,t,S,st)=>{bg(c,S);const f=.85+.08*Math.sin(TAU*t*7)+.05*Math.sin(TAU*t*13+1)+.02*Math.sin(TAU*t*23);
  txt(c,S);const cs=[[S.W*.12,S.H*.82],[S.W*.88,S.H*.82]];const g=c.createRadialGradient(S.W/2,S.H*.7,S.W*.1*f,S.W/2,S.H*.6,S.W*.75*f);g.addColorStop(0,'rgba(255,150,40,.08)');g.addColorStop(1,'rgba(0,0,0,.88)');c.fillStyle=g;c.fillRect(0,0,S.W,S.H);
  for(const[x,y] of cs){const w=S.W*.05;const cg=c.createLinearGradient(x-w,0,x+w,0);cg.addColorStop(0,'#cdbfa0');cg.addColorStop(.5,'#fff6e0');cg.addColorStop(1,'#bba88a');c.fillStyle=cg;c.fillRect(x-w,y,w*2,S.H);
    const fh=S.W*.07*f,sw=Math.sin(TAU*t*3+x)*w*.2;c.save();c.shadowColor='#ffa500';c.shadowBlur=30;const fg=c.createRadialGradient(x,y-fh*.4,0,x,y-fh*.4,fh);fg.addColorStop(0,'#fff');fg.addColorStop(.4,'#ffd34d');fg.addColorStop(1,'rgba(255,90,0,0)');c.fillStyle=fg;c.beginPath();c.moveTo(x-w*.45,y-2);c.quadraticCurveTo(x-w*.5,y-fh*.6,x+sw,y-fh*1.4);c.quadraticCurveTo(x+w*.5,y-fh*.6,x+w*.45,y-2);c.fill();c.restore()}
  dim(c,S,.06*f,'255,140,40')});

/* ===== FUN ===== */
fx('rainbow','Rainbow Wave','🌈','Fun',(c,t,S)=>{bg(c,S);letters(c,S,(ch,i)=>({dy:Math.sin(TAU*t-i*.5)*S.fs*.12,fill:hsl((i*28-t*360+720)%360,100,60)}))});
fx('bounce','Bouncy Castle','🏀','Fun',(c,t,S)=>{bg(c,S);letters(c,S,(ch,i)=>{const ph=fract(t*2-i*.07),h=Math.abs(Math.sin(Math.PI*ph)),sq=Math.max(0,1-h*5);c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(ch.x,ch.y+S.fs*.5,S.fs*.25*(1-h*.4),S.fs*.05,0,0,TAU);c.fill();return{dy:-h*S.fs*.4+sq*S.fs*.05,sx:1+sq*.25,sy:1-sq*.22}})});
fx('wave','Wavy Gravy','〰️','Fun',(c,t,S)=>{bg(c,S);letters(c,S,(ch,i)=>({dy:Math.sin(TAU*t-i*.45)*S.fs*.18,r:Math.cos(TAU*t-i*.45)*.15}))});
fx('confetti','Confetti Party','🎉','Fun',(c,t,S,st)=>{bg(c,S);const d=f=>{const y=fract(f.y+t*f.k)*(S.H+30)-15,x=f.x*S.W+Math.sin(TAU*t+f.ph)*15,s=f.s*S.W/400;c.save();c.translate(x,y);c.rotate(f.ph+TAU*t*f.rk);c.scale(1,Math.cos(TAU*t*2*f.rk+f.ph));c.fillStyle=f.c;c.fillRect(-s,-s*.6,s*2,s*1.2);c.restore()};
  st.f.filter(f=>!f.front).forEach(d);const p=1+.04*Math.max(0,Math.sin(TAU*t*4));about(c,S,p,p,0,()=>txt(c,S));st.f.filter(f=>f.front).forEach(d)},
  ()=>({f:falling(rng(51),140,{smin:2.5,smax:5,colors:['#ff006e','#ffbe0b','#3a86ff','#8338ec','#06d6a0','#fb5607','#fff'],front:.4})}));
fx('sparkles','Sparkle Magic','✨','Fun',(c,t,S,st)=>{bg(c,S);glow(c,S,S.pal.a,10);overlayOnText(c,S,x=>{const r=rng(Math.floor(t*12)+1);for(let i=0;i<60;i++){x.fillStyle=`rgba(255,255,255,${r()*.6})`;x.fillRect(r()*S.W,r()*S.H,2,2)}});
  for(const g of st.g){const v=Math.pow(Math.max(0,Math.sin(TAU*(t*g.k+g.o))),4);sparkle(c,g.p[0],g.p[1],v*S.fs*g.s,g.c)}},
  S=>{const r=rng(52);return{g:samp(r,S.pts.edge.concat(S.pts.inside),45).map(p=>({p:[p[0]+(r()-.5)*S.fs*.3,p[1]+(r()-.5)*S.fs*.3],o:r(),k:1+Math.floor(r()*2),s:.08+r()*.14,c:pick(r,['#fff','#fff','#fff7b0',S.pal.a])}))}});
fx('disco','Disco Fever','🪩','Fun',(c,t,S,st)=>{c.fillStyle='#07020f';c.fillRect(0,0,S.W,S.H);c.save();c.globalCompositeOperation='lighter';
  for(let i=0;i<8;i++){const a=Math.PI/2+Math.sin(TAU*t+i*.8)*.9,h=(i*45+t*360)%360;c.fillStyle=hsl(h,100,60,.18);c.beginPath();c.moveTo(S.W/2,S.H*.08);c.lineTo(S.W/2+Math.cos(a-.12)*S.H*1.5,S.H*.08+Math.sin(a-.12)*S.H*1.5);c.lineTo(S.W/2+Math.cos(a+.12)*S.H*1.5,S.H*.08+Math.sin(a+.12)*S.H*1.5);c.fill()}
  for(const s of st.s){const x=fract(s.x+t*s.rk*.5)*S.W,y=s.y*S.H;c.fillStyle=hsl((s.ph*57+t*360)%360,100,70,.5);circle(c,x,y,s.s)}c.restore();
  const R=S.W*.07;c.save();c.beginPath();c.arc(S.W/2,S.H*.08,R,0,TAU);c.clip();for(let gy=-R;gy<R;gy+=R/4)for(let gx=-R;gx<R;gx+=R/4){const v=fract(Math.sin((gx*3+gy*7)+Math.floor(t*16)*1.3)*43758);c.fillStyle=`hsl(0,0%,${40+v*60}%)`;c.fillRect(S.W/2+gx+1,S.H*.08+gy+1,R/4-1,R/4-1)}c.restore();
  fillWith(c,S,x=>{const g=x.createLinearGradient(S.b.x0,0,S.b.x1,0);for(let i=0;i<=6;i++)g.addColorStop(i/6,hsl((i*60+t*360)%360,100,62));x.fillStyle=g;x.fillRect(0,0,S.W,S.H)});
  const b=Math.max(0,Math.sin(TAU*t*4));c.save();c.globalCompositeOperation='lighter';glow(c,S,'#fff',20*b,.25*b);c.restore()},()=>({s:falling(rng(53),40,{smin:2,smax:6})}));
fx('hearts','Love Struck','💖','Fun',(c,t,S,st)=>{bg(c,S);const d=h=>{const y=S.H+30-fract(h.y+t*h.k)*(S.H+60),x=h.x*S.W+Math.sin(TAU*t*2+h.ph)*12,s=h.s*S.W/250*(1+.1*Math.sin(TAU*t*4+h.ph));c.fillStyle=h.c;c.globalAlpha=h.front?.95:.5;heartPath(c,x,y,s);c.fill();c.globalAlpha=1};
  st.h.filter(h=>!h.front).forEach(d);const beat=1+.07*Math.pow(Math.max(0,Math.sin(TAU*t*2)),8);about(c,S,beat,beat,0,()=>glow(c,S,'#ff4d8d',14));st.h.filter(h=>h.front).forEach(d)},
  ()=>({h:falling(rng(54),30,{smin:3,smax:8,colors:['#ff4d6d','#ff8fa3','#c9184a','#ff0a54','#ffb3c1'],front:.35})}));
fx('emoji','Emoji Storm','😂','Fun',(c,t,S,st)=>{bg(c,S);const d=e=>{const y=fract(e.y+t*e.k)*(S.H+60)-30,x=e.x*S.W+Math.sin(TAU*t+e.ph)*10;c.save();c.translate(x,y);c.rotate(Math.sin(TAU*t*e.k+e.ph)*.5);c.font=`${Math.round(e.s*S.W/60)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(e.c,0,0);c.restore()};
  st.e.filter(e=>!e.front).forEach(d);glow(c,S,'rgba(0,0,0,.5)',10);st.e.filter(e=>e.front).forEach(d)},
  ()=>({e:falling(rng(55),26,{smin:2,smax:4,colors:['😂','🔥','💯','🎉','😎','🍕','🤪','👽','💀','🦄','🌮','🤖','🙈','⭐'],front:.3})}));
fx('jelly','Jelly Wobble','🍮','Fun',(c,t,S)=>{bg(c,S);const w=Math.sin(TAU*t*2);c.save();c.translate(S.cx,S.b.y1);c.transform(1,0,Math.sin(TAU*t)*.25,1,0,0);c.scale(1+w*.12,1-w*.12);c.translate(-S.cx,-S.b.y1);glow(c,S,'rgba(0,0,0,.35)',10);c.restore()});
fx('pop','Comic POW','💥','Fun',(c,t,S)=>{bg(c,S);c.save();c.translate(S.cx,S.cy);c.rotate(TAU/24*t*2);c.beginPath();const R=Math.max(S.W,S.H)*.75;for(let i=0;i<24;i++){const r=i%2?R*.55:R;c.lineTo(Math.cos(i*TAU/24)*r,Math.sin(i*TAU/24)*r)}c.fillStyle=rgba(S.pal.a,.35);c.fill();c.restore();
  c.fillStyle='rgba(0,0,0,.12)';for(let y=0;y<S.H;y+=10)for(let x=(y/10%2)*5;x<S.W;x+=10)circle(c,x,y,1.6);
  letters(c,S,(ch,i,n)=>{const st=i/n*.35,k=clamp((t-st)/.14,0,1);let s=k<=0?0:backOut(k);if(t>.88)s*=1-easeIn((t-.88)/.12);return s<=.01?{skip:1}:{sx:s,sy:s,r:(1-Math.min(1,k))*.6}})});
fx('fireworks','Fireworks','🎆','Fun',(c,t,S,st)=>{c.fillStyle='#03030c';c.fillRect(0,0,S.W,S.H);c.save();c.globalCompositeOperation='lighter';
  for(const b of st.b){const age=fract(t-b.t0);if(age<.08){const k=age/.08;c.fillStyle=hsl(b.h,100,70);circle(c,b.x,lerp(S.H,b.y,k),2)}else if(age<.6){const k=(age-.08)/.52;for(let i=0;i<b.n;i++){const a=i/b.n*TAU,r=easeOut(k)*b.R;c.fillStyle=hsl(b.h+(i%3)*15,100,lerp(75,50,k),1-k);circle(c,b.x+Math.cos(a)*r,b.y+Math.sin(a)*r+k*k*S.H*.08,lerp(2.4,.8,k))}}}
  c.restore();glow(c,S,S.pal.a,16)},S=>{const r=rng(56);return{b:Array.from({length:6},(_,i)=>({t0:i/6+r()*.05,x:S.W*(.15+r()*.7),y:S.H*(.15+r()*.35),R:S.W*(.15+r()*.12),h:r()*360|0,n:28+Math.floor(r()*16)}))}});
fx('balloons','Balloon Lift','🎈','Fun',(c,t,S,st)=>{bg(c,S);const d=b=>{const y=S.H+60-fract(b.y+t*b.k)*(S.H+140),x=b.x*S.W+Math.sin(TAU*t+b.ph)*10,s=b.s*S.W/220;c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=1;c.beginPath();c.moveTo(x,y+s*1.25);c.bezierCurveTo(x+s*.4,y+s*2,x-s*.4,y+s*2.6,x+Math.sin(TAU*t*2+b.ph)*s*.3,y+s*3.4);c.stroke();
  const g=c.createRadialGradient(x-s*.35,y-s*.4,s*.1,x,y,s*1.2);g.addColorStop(0,'rgba(255,255,255,.8)');g.addColorStop(.25,b.c);g.addColorStop(1,b.c);c.fillStyle=g;c.beginPath();c.ellipse(x,y,s,s*1.2,0,0,TAU);c.fill();c.fillStyle=b.c;c.beginPath();c.moveTo(x,y+s*1.15);c.lineTo(x-s*.15,y+s*1.35);c.lineTo(x+s*.15,y+s*1.35);c.fill()};
  st.b.filter(b=>!b.front).forEach(d);glow(c,S,'rgba(0,0,0,.35)',10);st.b.filter(b=>b.front).forEach(d)},()=>({b:falling(rng(57),16,{smin:3,smax:6,colors:['#ff006e','#ffbe0b','#3a86ff','#8338ec','#06d6a0','#fb5607'],front:.3})}));
fx('candy','Candy Stripes','🍭','Fun',(c,t,S,st)=>{bg(c,S);const P=Math.max(10,S.fs*.35);fillWith(c,S,x=>{x.fillStyle=S.pal.t[0];x.fillRect(0,0,S.W,S.H);x.save();x.translate(S.cx,S.cy);x.rotate(-.6);const off=t*P*2;for(let i=-60;i<60;i++){x.fillStyle=S.pal.a;x.fillRect(i*P+off%P,-S.H*2,P/2,S.H*4);x.fillStyle='rgba(0,0,0,.28)';x.fillRect(i*P+off%P,-S.H*2,P*.12,S.H*4)}x.restore();const g=x.createLinearGradient(0,S.b.y0,0,S.b.y1);g.addColorStop(0,'rgba(255,255,255,.45)');g.addColorStop(.5,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.2)');x.fillStyle=g;x.fillRect(0,0,S.W,S.H)})});
fx('pixel','8‑Bit Arcade','👾','Fun',(c,t,S,st)=>{c.fillStyle='#0b0b1e';c.fillRect(0,0,S.W,S.H);const ps=Math.max(3,Math.round(S.fs/14));c.fillStyle='#1d1d4a';for(let y=0;y<S.H;y+=ps*4)c.fillRect(0,y,S.W,1);
  for(const s of st.s){const x=Math.floor(fract(s.x-t*s.k)*S.W/ps)*ps,y=Math.floor(s.y*S.H/ps)*ps;c.fillStyle=s.c;c.fillRect(x,y,ps,ps)}
  const sm=S.small||(S.small=mk(S.W/ps,S.H/ps)),sx=sm.getContext('2d');sx.clearRect(0,0,sm.width,sm.height);const dy=Math.round(Math.sin(TAU*t*2)*2);sx.drawImage(S.textC,0,dy,sm.width,sm.height);c.imageSmoothingEnabled=false;c.drawImage(sm,0,0,S.W,S.H);c.imageSmoothingEnabled=true;
  if(Math.floor(t*8)%2===0){c.fillStyle='#ffeb3b';c.font=`${Math.round(S.W*.035)}px "Courier New",monospace`;c.textAlign='center';c.fillText('INSERT COIN',S.W/2,S.H*.92)}},()=>({s:falling(rng(58),40,{colors:['#00e5ff','#ff4081','#ffeb3b','#76ff03']})}));
fx('marquee','Broadway Lights','💡','Fun',(c,t,S)=>{bg(c,S);const pad=S.fs*.35,x0=S.b.x0-pad,y0=S.b.y0-pad*.6,x1=S.b.x1+pad,y1=S.b.y1+pad*.6,step=Math.max(10,S.fs*.22);
  c.fillStyle='rgba(120,0,20,.75)';c.beginPath();c.roundRect?c.roundRect(x0,y0,x1-x0,y1-y0,pad*.5):c.rect(x0,y0,x1-x0,y1-y0);c.fill();
  const pts=[];for(let x=x0;x<x1;x+=step)pts.push([x,y0]);for(let y=y0;y<y1;y+=step)pts.push([x1,y]);for(let x=x1;x>x0;x-=step)pts.push([x,y1]);for(let y=y1;y>y0;y-=step)pts.push([x0,y]);
  const on=Math.floor(t*12)%3;pts.forEach((p,i)=>{const lit=i%3===on;c.save();if(lit){c.shadowColor='#ffd60a';c.shadowBlur=12}c.fillStyle=lit?'#fff3b0':'#6b5a20';circle(c,p[0],p[1],step*.22);c.restore()});glow(c,S,'#ffd60a',10)});
fx('spin','Spin Cycle','🌀','Fun',(c,t,S)=>{bg(c,S);letters(c,S,(ch,i)=>{const v=Math.cos(TAU*(t-i*.06));return{sx:Math.abs(v)<.05?.05*Math.sign(v||1):v,fill:v<0?S.pal.a:undefined}})});
fx('typewriter','Typewriter','⌨️','Pro',(c,t,S)=>{bg(c,S);const n=S.chars.length,shown=Math.floor(clamp(t/.65,0,1)*n);letters(c,S,(ch,i)=>i<shown?{}:{skip:1});
  const cur=S.chars[Math.min(shown,n-1)]||{x:S.cx,y:S.cy,w:10};if(Math.floor(t*8)%2===0||t<.65){const x=shown>=n?cur.x+cur.w/2+2:cur.x-cur.w/2;c.fillStyle=S.pal.a;c.fillRect(x,cur.y-S.fs*.42,Math.max(2,S.fs*.06),S.fs*.84)}});

/* ===== WEIRD ===== */
fx('melt','Meltdown','🫠','Weird',(c,t,S)=>{bg(c,S);const m=(1-Math.cos(TAU*t))/2,b=S.b,h=b.y1-b.y0+S.fs*.3,y0=b.y0-S.fs*.15;
  for(let x=Math.max(0,b.x0-S.sw*2|0);x<Math.min(S.W,b.x1+S.sw*2);x+=2){const n=.5+.5*Math.sin(x*.07)*Math.sin(x*.023+1.3);const drop=m*n*S.fs*1.1;c.drawImage(S.textC,x,y0,2,h,x,y0+drop*.25,2,h+drop)}});
fx('wavy','Funhouse Mirror','🪞','Weird',(c,t,S)=>{bg(c,S);strips(c,S,y=>Math.sin(y*.06+TAU*t)*S.fs*.13)});
fx('drunk','Dizzy','🥴','Weird',(c,t,S)=>{bg(c,S);const r=Math.sin(TAU*t)*.12,dx=Math.sin(TAU*t)*S.fs*.1;about(c,S,1,1,r,()=>{txt(c,S,.35,Math.sin(TAU*t*2)*S.fs*.15,0);txt(c,S,1,dx,0)});
  for(let i=0;i<3;i++){const a=TAU*(t*2+i/3);sparkle(c,S.cx+Math.cos(a)*S.fs*.8,S.b.y0-S.fs*.15+Math.sin(a)*S.fs*.18,S.fs*.12,'#ffe14d')}});
fx('sliced','Sliced','🔪','Weird',(c,t,S)=>{bg(c,S);const b=S.b,n=5,h=(b.y1-b.y0+S.fs*.3)/n,y0=b.y0-S.fs*.15;for(let i=0;i<n;i++){const dx=Math.sin(TAU*t+i*1.1)*S.W*.07*(i%2?1:-1)*Math.max(0,Math.sin(TAU*t*2));c.drawImage(S.textC,0,y0+i*h,S.W,h,dx,y0+i*h,S.W,h)}});
fx('chroma','RGB Split','🔴','Weird',(c,t,S)=>{bg(c,S);const d=S.fs*.07;c.save();c.globalAlpha=.85;[['#ff0040',0],['#00ff88',TAU/3],['#2a6bff',TAU*2/3]].forEach(([col,o])=>{c.drawImage(S.tint(col),Math.cos(TAU*t+o)*d,Math.sin(TAU*t+o)*d)});c.restore();txt(c,S)});
fx('hypno','Hypnotize','😵‍💫','Weird',(c,t,S)=>{c.fillStyle=S.pal.bg[0];c.fillRect(0,0,S.W,S.H);c.save();c.translate(S.W/2,S.H/2);c.rotate(TAU/6*t*2);c.fillStyle=rgba(S.pal.a,.55);const R=Math.hypot(S.W,S.H)*.6;
  for(let a=0;a<6;a++){c.beginPath();for(let r=0;r<R;r+=4){const th=a*TAU/6+r*.025;c.lineTo(Math.cos(th)*r,Math.sin(th)*r)}for(let r=R;r>=0;r-=4){const th=a*TAU/6+TAU/12+r*.025;c.lineTo(Math.cos(th)*r,Math.sin(th)*r)}c.fill()}c.restore();const p=1+.08*Math.sin(TAU*t*2);about(c,S,p,p,0,()=>glow(c,S,'rgba(0,0,0,.6)',12))});
fx('echo','Echo Chamber','📣','Weird',(c,t,S)=>{bg(c,S);for(let k=0;k<5;k++){const f=fract(t*2+k/5),s=1+f*.9;c.globalAlpha=(1-f)*.35;about(c,S,s,s,0,()=>c.drawImage(S.textC,0,0))}c.globalAlpha=1;txt(c,S)});
fx('twister','Twister','🌀','Weird',(c,t,S)=>{bg(c,S);for(let k=1;k<=4;k++){c.globalAlpha=.18;about(c,S,1,1,TAU*t*.25+k*TAU/8*Math.sin(TAU*t),()=>c.drawImage(S.textC,0,0))}c.globalAlpha=1;txt(c,S)});
fx('inflate','Balloon Head','🎈','Weird',(c,t,S)=>{bg(c,S);const k=fract(t),s=k<.7?1+easeIO(k/.7)*.35:1+.35*(1-bounceOut((k-.7)/.3));about(c,S,s,s*(1+(s-1)*.3),0,()=>glow(c,S,'rgba(0,0,0,.4)',12*s))});
fx('matrix','The Matrix','💊','Sci‑Fi',(c,t,S,st)=>{c.fillStyle='#000';c.fillRect(0,0,S.W,S.H);const cs=Math.max(10,Math.round(S.W/30));c.font=`${cs}px "Courier New",monospace`;c.textAlign='center';c.textBaseline='top';const tick=Math.floor(t*20);
  for(const col of st.c){const head=fract(col.o+t*col.k)*(S.H+col.L*cs)-col.L*cs*.2;for(let j=0;j<col.L;j++){const y=head-j*cs;if(y<-cs||y>S.H)continue;const r=rng(col.i*999+Math.floor((y/cs))+tick*(j%3===0?1:0));c.fillStyle=j===0?'#e6ffe6':`rgba(0,255,70,${1-j/col.L})`;c.fillText(st.ch[Math.floor(r()*st.ch.length)],col.x,y)}}
  glow(c,S,'#00ff41',18)},S=>{const r=rng(61),cs=Math.max(10,Math.round(S.W/30));return{ch:'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789Z:+<>'.split(''),c:Array.from({length:Math.ceil(S.W/cs)},(_,i)=>({i,x:i*cs+cs/2,o:r(),k:1+Math.floor(r()*2),L:8+Math.floor(r()*14)}))}});
fx('scramble','Decoder','🔣','Sci‑Fi',(c,t,S)=>{bg(c,S);const set='!<>-_\\/[]{}=+*^?#%@$&01ZXQ';letters(c,S,(ch,i,n)=>{const res=.08+i/n*.5;const back=t>.86&&(t-.86)/.14>1-i/n;if(t<res||back){const r=rng(i*31+Math.floor(t*30));return{ch:set[Math.floor(r()*set.length)],fill:S.pal.a,a:.85}}return{}})});
fx('gravity','Gravity Fail','🍎','Weird',(c,t,S)=>{bg(c,S);letters(c,S,(ch,i)=>{const ph=fract(t-i*.035),D=Math.max(0,S.H-ch.y-S.fs*.5);let dy=0,r=0;if(ph<.45){dy=bounceOut(ph/.45)*D;r=Math.sin(i*1.7)*.4*(ph/.45)}else if(ph<.65){dy=D;r=Math.sin(i*1.7)*.4}else{const k=easeIO((ph-.65)/.35);dy=D*(1-k);r=Math.sin(i*1.7)*.4*(1-k)}return{dy,r}})});
fx('shatter','Shatter','💎','Weird',(c,t,S,st)=>{bg(c,S);const e=t<.25?0:Math.pow(Math.sin(Math.PI*(t-.25)/.75),2);for(const q of st.q){c.save();c.translate(q.cx+q.vx*e,q.cy+q.vy*e);c.rotate(q.r*e);c.globalAlpha=1-e*.3;c.drawImage(S.textC,q.x,q.y,q.s,q.s,-q.s/2,-q.s/2,q.s,q.s);c.restore()}},
  S=>{const r=rng(62),s=Math.max(6,Math.round(S.fs*.22)),q=[],m=S.maskData,pad=S.sw+2;for(let y=Math.floor(S.b.y0-pad);y<S.b.y1+pad;y+=s)for(let x=Math.floor(S.b.x0-pad);x<S.b.x1+pad;x+=s){let hit=false;for(let yy=0;yy<s&&!hit;yy+=2)for(let xx=0;xx<s;xx+=2){const X=x+xx,Y=y+yy;if(X>=0&&Y>=0&&X<S.W&&Y<S.H&&m[(Y*S.W+X)*4+3]>40){hit=true;break}}
    if(!hit)continue;const cx=x+s/2,cy=y+s/2,a=Math.atan2(cy-S.cy,cx-S.cx)+(r()-.5)*.6,d=S.fs*(.4+r()*1.2);q.push({x,y,s,cx,cy,vx:Math.cos(a)*d,vy:Math.sin(a)*d,r:(r()-.5)*4})}return{q}});

/* ===== PRO ===== */
fx('static0','Clean & Classy','🖋️','Pro',(c,t,S)=>{bg(c,S);c.save();c.shadowColor='rgba(0,0,0,.35)';c.shadowBlur=S.fs*.12;c.shadowOffsetY=S.fs*.04;c.drawImage(S.textC,0,0);c.restore()});
fx('shine','Shine Sweep','✨','Pro',(c,t,S)=>{bg(c,S);c.save();c.shadowColor='rgba(0,0,0,.3)';c.shadowBlur=S.fs*.1;c.shadowOffsetY=S.fs*.03;c.drawImage(S.textC,0,0);c.restore();
  const k=clamp(t/.55,0,1);if(k<1){overlayOnText(c,S,x=>{const p=lerp(S.b.x0-S.fs*1.2,S.b.x1+S.fs*1.2,easeIO(k));x.save();x.translate(p,S.cy);x.rotate(.35);const g=x.createLinearGradient(-S.fs*.35,0,S.fs*.35,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(-S.fs*.35,-S.H,S.fs*.7,S.H*2);x.restore()})}});
fx('gold','Gold Foil','🏆','Pro',(c,t,S,st)=>{bgCustom(c,S,['#0b0b0b','#1d1810']);const P=Math.max(80,S.W*.6);
  st.p=st.p||stripePattern(S,['#7a5a12','#f9e79f','#c99a2e','#fff6c8','#8d6a1a','#e6c25a','#7a5a12'],Math.round(P));
  c.save();c.shadowColor='rgba(255,200,80,.45)';c.shadowBlur=16;c.drawImage(S.outlineC,0,0);c.restore();fillWith(c,S,x=>patFill(x,S,st.p,t*P,-.5));
  for(const g of st.g){const v=Math.pow(Math.max(0,Math.sin(TAU*(t*2+g.o))),8);sparkle(c,g.p[0],g.p[1],v*S.fs*.13,'#fff6c8')}},S=>{const r=rng(71);return{g:samp(r,S.pts.edge,10).map(p=>({p,o:r()}))}});
fx('chrome','Chrome','🪙','Pro',(c,t,S,st)=>{bg(c,S);const P=Math.max(80,S.W*.7);st.p=st.p||stripePattern(S,['rgba(255,255,255,0)','rgba(255,255,255,0)','rgba(255,255,255,.9)','rgba(255,255,255,0)','rgba(255,255,255,0)'],Math.round(P));
  c.save();c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=S.fs*.1;c.shadowOffsetY=S.fs*.04;c.drawImage(S.outlineC,0,0);c.restore();
  fillWith(c,S,x=>{const g=x.createLinearGradient(0,S.b.y0,0,S.b.y1);g.addColorStop(0,'#ffffff');g.addColorStop(.45,'#9aa4b1');g.addColorStop(.5,'#2f3640');g.addColorStop(.55,'#c7ced8');g.addColorStop(1,'#f4f6f8');x.fillStyle=g;x.fillRect(0,0,S.W,S.H);patFill(x,S,st.p,t*P,-.6)})});
fx('fadeup','Fade Up','🌅','Pro',(c,t,S)=>{bg(c,S);letters(c,S,(ch,i,n)=>{let a=clamp((t*1.7-i/n*.6)/.25,0,1);if(t>.85)a*=1-(t-.85)/.15;return{a,dy:(1-easeOut(a))*S.fs*.35}})});
fx('slidein','Slide In','➡️','Pro',(c,t,S)=>{bg(c,S);letters(c,S,(ch,i,n)=>{let a=clamp((t*1.8-i/n*.5)/.3,0,1);const out=t>.85?easeIn((t-.85)/.15):0;return{a:Math.min(a,1-out),dx:-(1-easeOut(a))*S.W*.25+out*S.W*.25}})});
fx('cascade','Cascade','🪂','Pro',(c,t,S)=>{bg(c,S);letters(c,S,(ch,i,n)=>{const k=clamp((t-i/n*.4)/.3,0,1);if(k<=0)return{skip:1};const out=t>.88?(t-.88)/.12:0;return{dy:-(1-bounceOut(k))*S.fs*1.5,a:1-out}})});
fx('underline','Underline','✏️','Pro',(c,t,S)=>{bg(c,S);txt(c,S);const y=S.b.y1+S.fs*.06,x0=S.b.x0,x1=S.b.x1;let a=0,b=0;if(t<.4){b=easeIO(t/.4)}else if(t<.75){b=1}else{b=1;a=easeIO((t-.75)/.25)}if(b>a){c.strokeStyle=S.pal.a;c.lineCap='round';c.lineWidth=Math.max(3,S.fs*.08);c.beginPath();c.moveTo(lerp(x0,x1,a),y);c.lineTo(lerp(x0,x1,b),y);c.stroke()}});
fx('highlighter','Highlighter','🖍️','Pro',(c,t,S)=>{bg(c,S);const k=t<.45?easeIO(t/.45):t<.85?1:1-easeIO((t-.85)/.15);c.fillStyle=rgba(S.pal.a,.55);S.lines.forEach(L=>{c.save();c.translate(L.x0,L.y);c.rotate(-.015);c.fillRect(-S.fs*.08,-S.fs*.12,(L.w+S.fs*.16)*k,S.fs*.5);c.restore()});txt(c,S)});
fx('spotlight','Spotlight','🔦','Pro',(c,t,S)=>{bg(c,S);txt(c,S);const x=S.cx+Math.cos(TAU*t)*(S.b.x1-S.b.x0)*.45,y=S.cy+Math.sin(TAU*t*2)*(S.b.y1-S.b.y0)*.3,R=S.fs*1.1;
  const g=c.createRadialGradient(x,y,R*.3,x,y,R*1.4);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.72)');c.fillStyle=g;c.fillRect(0,0,S.W,S.H);c.save();c.globalCompositeOperation='lighter';const h=c.createRadialGradient(x,y,0,x,y,R);h.addColorStop(0,'rgba(255,250,220,.25)');h.addColorStop(1,'rgba(255,250,220,0)');c.fillStyle=h;circle(c,x,y,R);c.restore()});
fx('longshadow','Long Shadow','📐','Pro',(c,t,S)=>{bg(c,S);const a=Math.PI/4+Math.sin(TAU*t)*.5,L=S.fs*.6,sh=S.tint('#000');c.globalAlpha=.06;for(let k=1;k<L;k+=1.5)c.drawImage(sh,Math.cos(a)*k,Math.sin(a)*k);c.globalAlpha=1;txt(c,S)});
fx('extrude','3D Block','🧱','Pro',(c,t,S)=>{bg(c,S);const a=Math.PI*.25+Math.sin(TAU*t)*.9,D=S.fs*.18,ex=S.tint(S.pal.s==='#ffffff'||S.pal.s==='#fff'?S.pal.a:S.pal.s);for(let k=D;k>0;k-=1)c.drawImage(ex,Math.cos(a)*k,Math.sin(a)*k);txt(c,S)});
fx('zoom','Zoom In','🔍','Pro',(c,t,S)=>{bg(c,S);let s=1,a=1;if(t<.3){const k=easeOut(t/.3);s=lerp(2.6,1,k);a=k;for(let j=1;j<4;j++){const s2=lerp(s,2.6,j*.15);c.globalAlpha=a*.15;about(c,S,s2,s2,0,()=>c.drawImage(S.textC,0,0))}}else if(t>.85){const k=(t-.85)/.15;s=lerp(1,.6,easeIn(k));a=1-k}c.globalAlpha=a;about(c,S,s,s,0,()=>c.drawImage(S.textC,0,0));c.globalAlpha=1});
fx('softglow','Soft Glow','🌟','Pro',(c,t,S)=>{bg(c,S);const p=.5+.5*Math.sin(TAU*t);glow(c,S,S.pal.a,8+p*26);c.save();c.globalCompositeOperation='lighter';glow(c,S,S.pal.a,30,.12*p);c.restore()});

/* ===== SCI-FI ===== */
fx('neon','Neon Sign','🌃','Sci‑Fi',(c,t,S,st)=>{c.fillStyle='#0b0a10';c.fillRect(0,0,S.W,S.H);c.strokeStyle='rgba(255,255,255,.04)';c.lineWidth=1;const bh=Math.max(10,S.W/24);for(let y=0,r=0;y<S.H;y+=bh,r++){c.beginPath();c.moveTo(0,y);c.lineTo(S.W,y);c.stroke();for(let x=(r%2)*bh;x<S.W;x+=bh*2){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+bh);c.stroke()}}
  const col=S.pal.t[0],bad=st.bad,r=rng(Math.floor(t*24)+2),badOn=r()>.35;const al=i=>i===bad&&!badOn?.15:1;const w=Math.max(2,S.fs*.05);
  c.save();c.shadowColor=S.pal.a;c.shadowBlur=w*8;strokeLetters(c,S,col,w*1.6,al);c.shadowBlur=w*3;strokeLetters(c,S,'#ffffff',w*.5,al);c.restore();
  c.save();c.globalCompositeOperation='lighter';const g=c.createRadialGradient(S.cx,S.cy,0,S.cx,S.cy,S.W*.6);g.addColorStop(0,rgba(S.pal.a,.12));g.addColorStop(1,rgba(S.pal.a,0));c.fillStyle=g;c.fillRect(0,0,S.W,S.H);c.restore()},S=>{const nn=S.chars.map((c,i)=>c.ch!==' '?i:-1).filter(i=>i>=0);return{bad:nn.length>2?nn[Math.floor(nn.length*.6)]:-1}});
fx('hologram','Hologram','🔷','Sci‑Fi',(c,t,S)=>{c.fillStyle='#000a12';c.fillRect(0,0,S.W,S.H);c.save();c.globalCompositeOperation='lighter';const g=c.createLinearGradient(0,S.H,0,S.b.y0);g.addColorStop(0,'rgba(0,229,255,.35)');g.addColorStop(1,'rgba(0,229,255,0)');c.fillStyle=g;c.beginPath();c.moveTo(S.cx-S.W*.08,S.H*.95);c.lineTo(S.b.x0-10,S.b.y0);c.lineTo(S.b.x1+10,S.b.y0);c.lineTo(S.cx+S.W*.08,S.H*.95);c.fill();
  c.fillStyle='rgba(0,229,255,.6)';c.beginPath();c.ellipse(S.cx,S.H*.95,S.W*.1,S.H*.02,0,0,TAU);c.fill();
  const r=rng(Math.floor(t*20)),fl=r()<.15?.4:.85;const tc=S.tint('#00e5ff');c.globalAlpha=fl;const b=S.b;for(let y=Math.max(0,b.y0-S.fs*.2|0);y<b.y1+S.fs*.2;y+=2){const dx=(Math.abs(y-fract(t*2)*S.H)<6)?(r()-.5)*S.fs*.2:0;c.drawImage(tc,0,y,S.W,2,dx,y,S.W,2)}c.restore();
  scan(c,S,.35,Math.floor(t*30),3)});
fx('laser','Laser Scan','🔺','Sci‑Fi',(c,t,S)=>{c.fillStyle='#050208';c.fillRect(0,0,S.W,S.H);const k=t<.5?easeIO(t*2):1-easeIO((t-.5)*2);const ly=lerp(S.b.y0-S.fs*.2,S.b.y1+S.fs*.2,k);
  txt(c,S,.45);c.save();c.beginPath();c.rect(0,ly-S.fs*.15,S.W,S.fs*.3);c.clip();glow(c,S,'#ff1744',14);c.drawImage(S.tint('#ffffff'),0,0);c.restore();
  c.save();c.shadowColor='#ff1744';c.shadowBlur=16;c.fillStyle='#ff1744';c.fillRect(0,ly-1.5,S.W,3);c.fillStyle='#fff';c.fillRect(0,ly-.5,S.W,1);c.restore();
  c.fillStyle='#ffd0d8';const r=rng(Math.floor(t*30));for(const p of S.pts.edge){if(Math.abs(p[1]-ly)<2&&r()<.5){for(let i=0;i<3;i++)circle(c,p[0]+(r()-.5)*12,p[1]+(r()-.5)*12,1.2)}}});
fx('electric','Electrified','⚡','Sci‑Fi',(c,t,S)=>{bg(c,S);dim(c,S,.5,'0,0,20');const r=rng(Math.floor(t*24)+77);const fl=.7+r()*.3;glow(c,S,S.pal.a,14*fl);const E=S.pts.edge;if(E.length<2)return;
  for(let i=0;i<7;i++){const a=pick(r,E);let b=null,bd=1e9;for(let j=0;j<20;j++){const q=pick(r,E);const d=Math.hypot(q[0]-a[0],q[1]-a[1]);if(d>S.fs*.25&&d<bd){bd=d;b=q}}if(!b)continue;zap(c,bolt(r,a[0],a[1],b[0],b[1],bd*.35,5),S.pal.a,Math.max(1,S.fs*.015))}
  if(r()<.4){const a=pick(r,E);zap(c,bolt(r,a[0],a[1],r()<.5?0:S.W,r()*S.H,S.W*.2,6),S.pal.a,Math.max(1,S.fs*.015))}});
fx('synthwave','Synthwave','🌅','Sci‑Fi',(c,t,S)=>{const hz=S.H*.62;bgCustom(c,S,['#0d0221','#2a0845','#7b1e7a']);c.fillStyle='#120020';c.fillRect(0,hz,S.W,S.H-hz);
  const R=S.W*.24,sx=S.W/2,sy=hz-R*.25;c.save();c.beginPath();c.arc(sx,sy,R,0,TAU);c.clip();const g=c.createLinearGradient(0,sy-R,0,sy+R);g.addColorStop(0,'#ffe259');g.addColorStop(1,'#ff2e97');c.fillStyle=g;c.fillRect(sx-R,sy-R,R*2,R*2);c.fillStyle='#2a0845';for(let i=0;i<7;i++){const y=sy+R*.05+fract(i/7-t)*R,h=lerp(1,R*.12,(y-sy)/R);c.fillRect(sx-R,y,R*2,h)}c.restore();
  c.save();c.beginPath();c.rect(0,hz,S.W,S.H-hz);c.clip();c.strokeStyle='#ff2bd6';c.shadowColor='#ff2bd6';c.shadowBlur=8;c.lineWidth=1.5;for(let i=0;i<12;i++){const z=fract(i/12+t);const y=hz+(S.H-hz)*z*z;c.globalAlpha=z;c.beginPath();c.moveTo(0,y);c.lineTo(S.W,y);c.stroke()}c.globalAlpha=1;for(let i=-10;i<=10;i++){c.beginPath();c.moveTo(S.W/2+i*S.W*.03,hz);c.lineTo(S.W/2+i*S.W*.35,S.H);c.stroke()}c.restore();
  glow(c,S,'#00f0ff',18)});
fx('plasma','Plasma','🟣','Sci‑Fi',(c,t,S,st)=>{c.fillStyle='#05000a';c.fillRect(0,0,S.W,S.H);const N=64,p=st.c,x=p.getContext('2d'),id=st.id,d=id.data,T=TAU*t;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const v=Math.sin(i*.2+T)+Math.sin(j*.17-T)+Math.sin((i+j)*.12+T*2)+Math.sin(Math.hypot(i-32,j-32)*.25-T);const h=(v+4)/8;const k=(j*N+i)*4;d[k]=128+127*Math.sin(TAU*h);d[k+1]=128+127*Math.sin(TAU*h+2.1);d[k+2]=128+127*Math.sin(TAU*h+4.2);d[k+3]=255}
  x.putImageData(id,0,0);c.save();c.globalAlpha=.25;c.drawImage(p,0,0,S.W,S.H);c.restore();fillWith(c,S,y=>y.drawImage(p,S.b.x0,S.b.y0-S.fs*.2,S.b.x1-S.b.x0,S.b.y1-S.b.y0+S.fs*.4));glow(c,S,'rgba(255,255,255,.3)',10,.25)},()=>{const c=mk(64,64);return{c,id:c.getContext('2d').createImageData(64,64)}});
fx('radar','Radar Lock','📡','Sci‑Fi',(c,t,S,st)=>{c.fillStyle='#001408';c.fillRect(0,0,S.W,S.H);const R=Math.hypot(S.W,S.H)*.5,cx=S.W/2,cy=S.H/2,A=TAU*t;c.strokeStyle='rgba(0,255,100,.25)';c.lineWidth=1;for(let k=1;k<=5;k++){c.beginPath();c.arc(cx,cy,R*k/5,0,TAU);c.stroke()}c.beginPath();c.moveTo(0,cy);c.lineTo(S.W,cy);c.moveTo(cx,0);c.lineTo(cx,S.H);c.stroke();
  for(let i=0;i<40;i++){const a0=A-i*.02;c.fillStyle=`rgba(0,255,100,${.25*(1-i/40)})`;c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,R,a0-.02,a0);c.fill()}
  for(const b of st.b){const d=fract((A-b.a)/TAU);const v=Math.max(0,1-d*2.5);c.fillStyle=`rgba(120,255,160,${v})`;circle(c,cx+Math.cos(b.a)*b.r*R,cy+Math.sin(b.a)*b.r*R,3)}
  const tv=Math.max(0,1-fract((A-0)/TAU)*1.5);c.save();c.shadowColor='#00ff64';c.shadowBlur=10+tv*20;c.drawImage(S.tint('#3dff8b'),0,0);c.restore()},()=>{const r=rng(81);return{b:Array.from({length:12},()=>({a:r()*TAU,r:.2+r()*.75}))}});
fx('portal','Portal','🌀','Sci‑Fi',(c,t,S,st)=>{c.fillStyle='#04000a';c.fillRect(0,0,S.W,S.H);c.save();c.globalCompositeOperation='lighter';c.translate(S.cx,S.cy);
  for(const p of st.p){const a=p.a+TAU*t*p.k,r=p.r*S.W*.5;c.fillStyle=p.c;circle(c,Math.cos(a)*r,Math.sin(a)*r*.55,p.s)}
  for(let k=0;k<4;k++){c.strokeStyle=k%2?'rgba(0,200,255,.35)':'rgba(190,80,255,.35)';c.lineWidth=3;c.beginPath();c.ellipse(0,0,S.W*(.2+k*.08)*(1+.05*Math.sin(TAU*t*2+k)),S.W*(.11+k*.045),TAU*t/2*(k%2?1:-1)*0,0,TAU);c.stroke()}c.restore();
  const p=1+.05*Math.sin(TAU*t*2);about(c,S,p,p,0,()=>glow(c,S,'#b14dff',22))},()=>{const r=rng(82);return{p:Array.from({length:160},()=>({a:r()*TAU,r:.15+r()*.75,k:(r()<.5?1:2),s:.6+r()*1.8,c:pick(r,['rgba(180,90,255,.7)','rgba(0,200,255,.7)','rgba(255,255,255,.6)'])}))}});
fx('glitch','Glitch','📟','Sci‑Fi',(c,t,S)=>{bg(c,S);const r=rng(Math.floor(t*20)+13);const g=r()<.55;if(!g){txt(c,S);return}
  c.save();c.globalAlpha=.8;c.drawImage(S.tint('#ff0050'),(r()-.5)*S.fs*.12,0);c.drawImage(S.tint('#00f0ff'),(r()-.5)*S.fs*.12,0);c.restore();txt(c,S);
  const tx=S.tmpX;tx.setTransform(1,0,0,1,0,0);tx.globalCompositeOperation='copy';tx.drawImage(c.canvas,0,0);tx.globalCompositeOperation='source-over';for(let i=0;i<6;i++){const y=lerp(S.b.y0-10,S.b.y1+10,r()),h=2+r()*S.fs*.18,dx=(r()-.5)*S.fs*.6;c.drawImage(S.tmp,0,y,S.W,h,dx,y,S.W,h)}
  for(let i=0;i<5;i++){c.fillStyle=pick(r,['#ff0050','#00f0ff','#fff','#000']);c.fillRect(r()*S.W,r()*S.H,r()*S.fs*.4,r()*S.fs*.08)}});

window.GIFFY_FX=FX;
