/* GIFFY app brain */
(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const FX=window.GIFFY_FX,G=window.GIFFYGIF;

/* ---------- fonts ---------- */
const SYS=[
 ['Helvetica Bold','"Helvetica Neue",Helvetica,Arial,sans-serif','800'],['Avenir Heavy','"Avenir Next",Avenir,sans-serif','800'],['Futura','Futura,"Trebuchet MS",sans-serif','700'],
 ['Impact-ish','"Avenir Next Condensed","Arial Narrow",sans-serif','900'],['Arial Rounded','"Arial Rounded MT Bold","Arial Rounded MT",sans-serif','700'],['Gill Sans','"Gill Sans","Gill Sans MT",sans-serif','700'],
 ['Optima','Optima,Candara,sans-serif','700'],['Trebuchet','"Trebuchet MS",sans-serif','700'],['Verdana','Verdana,sans-serif','700'],
 ['Georgia','Georgia,serif','700'],['Didot','Didot,"Bodoni 72",serif','700'],['Bodoni','"Bodoni 72",Didot,serif','700'],['Baskerville','Baskerville,"Baskerville Old Face",serif','700'],
 ['Palatino','Palatino,"Palatino Linotype",serif','700'],['Hoefler','"Hoefler Text",Garamond,serif','700'],['Rockwell','Rockwell,"Courier New",serif','700'],
 ['Copperplate','Copperplate,"Copperplate Gothic Light",serif','700'],['Typewriter','"American Typewriter","Courier New",serif','700'],['Courier','"Courier New",Courier,monospace','700'],
 ['Menlo','Menlo,Consolas,monospace','700'],['Marker Felt','"Marker Felt","Comic Sans MS",cursive','700'],['Chalkduster','Chalkduster,"Comic Sans MS",cursive','400'],
 ['Chalkboard','"Chalkboard SE","Comic Sans MS",cursive','700'],['Noteworthy','Noteworthy,"Comic Sans MS",cursive','700'],['Bradley Hand','"Bradley Hand","Segoe Print",cursive','700'],
 ['Snell Roundhand','"Snell Roundhand","Brush Script MT",cursive','700'],['Zapfino','Zapfino,"Brush Script MT",cursive','400'],['Savoye','"Savoye LET","Brush Script MT",cursive','400'],
 ['Party LET','"Party LET","Comic Sans MS",cursive','400'],['Papyrus 🙃','Papyrus,fantasy','700'],['Academy','"Academy Engraved LET",serif','400']
].map(([n,css,w])=>({id:'s:'+n,name:n,css,w,web:false}));
const WEB=[
 ['Bangers'],['Creepster'],['Nosifer'],['Eater'],['Butcherman'],['Frijole'],['Metal Mania'],['Rubik Glitch'],['Rubik Wet Paint'],['Rubik Beastly'],['Rubik Puddles'],
 ['Pacifico'],['Lobster'],['Shrikhand'],['Luckiest Guy'],['Fredoka','600'],['Permanent Marker'],['Bungee'],['Bungee Shade'],['Monoton'],['Faster One'],['Fascinate'],['Rampart One'],
 ['Press Start 2P'],['VT323'],['Silkscreen'],['Orbitron','900'],['Audiowide'],['Black Ops One'],['Righteous'],['Bebas Neue'],['Anton'],['Abril Fatface'],['Playfair Display','900'],
 ['Cinzel Decorative','900'],['UnifrakturMaguntia'],['Special Elite']
].map(([n,w])=>({id:'w:'+n,name:n,css:`"${n}",sans-serif`,w:w||'400',web:true,fam:n}));
const FONTS=[...WEB,...SYS];
function webFontURL(f){const fam=f.fam.replace(/ /g,'+');return`https://fonts.googleapis.com/css2?family=${fam}${f.w!=='400'?':wght@'+f.w:''}&display=swap`}
const linkLoads={};
function ensureLink(f){if(!f.web)return Promise.resolve();if(linkLoads[f.id])return linkLoads[f.id];
  linkLoads[f.id]=new Promise(res=>{const l=document.createElement('link');l.rel='stylesheet';l.href=webFontURL(f);l.onload=()=>res();l.onerror=()=>res();document.head.appendChild(l);setTimeout(res,6000)});return linkLoads[f.id]}
async function loadFont(f){try{await ensureLink(f);await Promise.race([document.fonts.load(`${f.w} 40px ${f.css.split(',')[0]}`,'GIFFYgiffy'),new Promise(r=>setTimeout(r,5000))])}catch(e){}
  if(f.web){f.ok=webOk(f);markFont(f)}}
function webOk(f){try{return[...document.fonts].some(ff=>ff.family.replace(/["']/g,'')===f.fam&&ff.status==='loaded')}catch(e){return false}}
function markFont(f){const el=document.querySelector(`[data-font="${CSS.escape(f.id)}"] .cloud`);if(el)el.textContent=f.ok?'':'☁️'}

/* ---------- palettes ---------- */
const PALS=[
 ['Steel','#1c1f24','#3a3f47',['#ffffff','#8d99ae'],'#0b0c0e','#c0c7d1'],['Classic','#111111','#222222',['#ffffff','#dddddd'],'#000000','#ffd400'],
 ['Fire','#1a0500','#3d0c00',['#ffe259','#ff5f1f'],'#3d0000','#ff9a00'],['Ice','#021526','#03346e',['#ffffff','#9be7ff'],'#003459','#bdf3ff'],
 ['Toxic','#0b1a00','#173d00',['#d4ff00','#39ff14'],'#0a2a00','#7cff00'],['Blood','#0a0000','#2b0000',['#ff1a1a','#8a0000'],'#000000','#ff0000'],
 ['Bubblegum','#ffd6ec','#ffb3d9',['#ff3ea5','#a100ff'],'#ffffff','#ff7ad9'],['Ocean','#00334e','#005f86',['#e0fbfc','#7fdbff'],'#001f3f','#00d4ff'],
 ['Sunset','#2b1055','#ff7e5f',['#fff3b0','#ffb347'],'#3b0a45','#ffcc00'],['Synthwave','#120038','#3a0066',['#00f0ff','#ff00e6'],'#1b0033','#ff2bd6'],
 ['Gold','#0d0d0d','#1f1a0e',['#fff1a8','#c99a2e'],'#3d2b00','#ffd700'],['Mint','#e8fff6','#b8f2e0',['#00a676','#006d4e'],'#ffffff','#00e6a8'],
 ['Grape','#1d0033','#3c096c',['#e0aaff','#9d4edd'],'#10002b','#c77dff'],['Forest','#071a0b','#1b4332',['#d8f3dc','#95d5b2'],'#081c15','#52b788'],
 ['Mud','#2b1a0e','#4a2f1a',['#e6c79c','#a0703c'],'#1a0f05','#8b5a2b'],['Corporate','#f5f7fa','#e4e9f0',['#0a2540','#1f4e8c'],'#ffffff','#0070f3'],
 ['Midnight','#000814','#001d3d',['#ffd60a','#ffc300'],'#000000','#ffd60a'],['Paper','#fbf7ef','#efe6d2',['#222222','#444444'],'#ffffff','#d62828'],
 ['Rainbow','#111111','#1b1b1b',['#ff004c','#ffb400','#00e05a','#00b3ff','#a100ff'],'#000000','#ffffff'],['Ghost','#0f1416','#202a2e',['#f0f4f5','#aab8bd'],'#050708','#9fe7ff'],
 ['Cotton Candy','#a0e7ff','#ffc8f0',['#ffffff','#fff0fb'],'#ff5fb7','#ffffff'],['Matrix','#000000','#001400',['#b6ff9e','#00ff41'],'#001a00','#00ff41'],
 ['Royal','#10002b','#240046',['#ffd700','#ffb703'],'#000000','#e0aaff'],['Halloween','#120800','#2a1200',['#ff9100','#ff5e00'],'#000000','#8cff00'],
 ['Barbie','#ff4fa3','#ff85c0',['#ffffff','#ffe0f0'],'#b5005b','#ffffff'],['Lime','#000000','#111111',['#ccff00','#a6ff00'],'#000000','#ffffff'],
 ['Arcade','#000000','#0a0a2a',['#ffeb3b','#ff5722'],'#3f00ff','#00e5ff'],['Peach','#ffe5d9','#ffcad4',['#f4845f','#c9184a'],'#ffffff','#ff8fab'],
 ['Neon Blue','#00010d','#000a2e',['#ffffff','#4cc9f0'],'#03045e','#4cc9f0'],['Lava Lamp','#3a0ca3','#f72585',['#fefae0','#ffd166'],'#3a0ca3','#ffd166'],
 ['Swamp','#1b2a1b','#2f3e1f',['#c5d86d','#7a9a01'],'#0f160f','#a7c957'],['Noir','#000000','#000000',['#ffffff','#ffffff'],'#000000','#ff1744']
].map(([name,b1,b2,t,s,a])=>({id:name,name,bg:[b1,b2],t,s,a}));

/* ---------- state ---------- */
const SIZES={sq:{W:400,H:400,label:'Square'},wide:{W:480,H:270,label:'Wide'},tall:{W:288,H:512,label:'Story'},big:{W:600,H:600,label:'Big Sq'}};
const DEF={text:'GIFFY',font:'w:Bangers',fx:'lightning',pal:'Steel',size:'sq',dur:2,scale:1,outline:true,dither:true,custom:{t1:'#ffffff',t2:'#c0c7d1',bg1:'#111111',bg2:'#333333',s:'#000000',a:'#ffd400'},cat:'All'};
let state=Object.assign({},DEF,JSON.parse(localStorage.getItem('giffy')||'{}'));state.custom=Object.assign({},DEF.custom,state.custom||{});
const save=()=>localStorage.setItem('giffy',JSON.stringify(state));
const pal=()=>state.pal==='Custom'?{id:'Custom',name:'Custom',bg:[state.custom.bg1,state.custom.bg2],t:[state.custom.t1,state.custom.t2],s:state.custom.s,a:state.custom.a}:(PALS.find(p=>p.id===state.pal)||PALS[0]);
const curFont=()=>FONTS.find(f=>f.id===state.font)||FONTS[0];
const curFx=()=>FX.find(f=>f.id===state.fx)||FX[0];

/* ---------- scene ---------- */
let S=null,FXST={};
function buildScene(){
  const{W,H}=SIZES[state.size]||SIZES.sq,f=curFont(),P=pal();
  let lines=(state.text||'').split('\n').map(s=>s.replace(/\s+$/,'')).filter((s,i,a)=>s.length||a.length===1).slice(0,4);if(!lines.length||!lines.join('').trim())lines=['GIFFY'];
  const mc=document.createElement('canvas').getContext('2d');mc.font=`${f.w} 100px ${f.css}`;
  const maxW=Math.max(1,...lines.map(l=>mc.measureText(l).width));
  let fs=Math.min(W*.84/maxW*100,H*.6/(lines.length*1.15))*state.scale;fs=Math.max(8,Math.min(fs,H*.9));
  const fontStr=`${f.w} ${fs.toFixed(1)}px ${f.css}`;mc.font=fontStr;
  const lh=fs*1.15,tot=lh*lines.length,top=H/2-tot/2,sw=state.outline?Math.max(2,fs*.07):0;
  const chars=[],L=[];let x0=W,x1=0;
  lines.forEach((ln,li)=>{const w=mc.measureText(ln).width,sx=W/2-w/2,y=top+lh*(li+.5);x0=Math.min(x0,sx);x1=Math.max(x1,sx+w);L.push({x0:sx,y,w,text:ln});
    [...ln].forEach((ch,i,arr)=>{const pre=mc.measureText(arr.slice(0,i).join('')).width,cw=mc.measureText(ch).width;chars.push({ch,x:sx+pre+cw/2,y,w:cw,li})})});
  const b={x0,x1,y0:top,y1:top+tot};
  const mkC=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c};
  const drawLines=(x,fill,stroke)=>{x.font=fontStr;x.textAlign='left';x.textBaseline='middle';x.lineJoin='round';L.forEach(l=>{if(stroke&&sw){x.lineWidth=sw;x.strokeStyle=stroke;x.strokeText(l.text,l.x0,l.y)}if(fill){x.fillStyle=fill;x.fillText(l.text,l.x0,l.y)}})};
  const textC=mkC(),tx=textC.getContext('2d');const g=tx.createLinearGradient(0,b.y0+lh*.1,0,b.y1-lh*.1);P.t.forEach((c,i)=>g.addColorStop(P.t.length>1?i/(P.t.length-1):0,c));drawLines(tx,null,P.s);drawLines(tx,g,null);
  const outlineC=mkC();drawLines(outlineC.getContext('2d'),null,P.s);
  const fillMask=mkC();drawLines(fillMask.getContext('2d'),'#fff',null);
  const mask=mkC(),mx=mask.getContext('2d',{willReadFrequently:true});drawLines(mx,'#fff','#fff');const md=mx.getImageData(0,0,W,H).data;
  const st=Math.max(2,Math.round(fs/20)),A=(x,y)=>x<0||y<0||x>=W||y>=H?0:md[(y*W+x)*4+3];const pts={inside:[],top:[],bottom:[],edge:[]};
  for(let y=0;y<H;y+=st)for(let x=0;x<W;x+=st){if(A(x,y)<128)continue;pts.inside.push([x,y]);const up=A(x,y-st)<128,dn=A(x,y+st)<128;if(up)pts.top.push([x,y]);if(dn)pts.bottom.push([x,y]);if(up||dn||A(x-st,y)<128||A(x+st,y)<128)pts.edge.push([x,y])}
  const tmp=mkC(),tints={};
  S={W,H,fs,fontStr,sw,pal:P,chars,lines:L,b,cx:(b.x0+b.x1)/2,cy:(b.y0+b.y1)/2,textC,outlineC,fillMask,maskData:md,pts,tmp,tmpX:tmp.getContext('2d'),
    tint(col){if(tints[col])return tints[col];const c=mkC(),x=c.getContext('2d');x.drawImage(mask,0,0);x.globalCompositeOperation='source-in';x.fillStyle=col;x.fillRect(0,0,W,H);return tints[col]=c}};
  setupFx();
  cv.width=W;cv.height=H;cv.style.aspectRatio=`${W}/${H}`;
}
function setupFx(){const e=curFx();try{FXST=e.setup(S)||{}}catch(err){console.error(err);FXST={}}}
function render(ctx,t){ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;ctx.shadowColor='rgba(0,0,0,0)';ctx.shadowOffsetX=ctx.shadowOffsetY=0;ctx.imageSmoothingEnabled=true;ctx.clearRect(0,0,S.W,S.H);
  try{curFx().draw(ctx,t,S,FXST)}catch(err){console.error(err);ctx.fillStyle='#222';ctx.fillRect(0,0,S.W,S.H);ctx.drawImage(S.textC,0,0)}}

/* ---------- preview ---------- */
const cv=$('#cv'),cx=cv.getContext('2d');let t0=performance.now(),paused=false;
function loop(now){if(!paused&&S){const t=((now-t0)/(state.dur*1000))%1;render(cx,t)}requestAnimationFrame(loop)}
let rebuildTimer=0;function rebuild(){clearTimeout(rebuildTimer);rebuildTimer=setTimeout(async()=>{await loadFont(curFont());buildScene()},60)}

/* ---------- UI ---------- */
const CATS=['All','Nature','Spooky','Fun','Weird','Pro','Sci‑Fi'];
function renderCats(){$('#cats').innerHTML=CATS.map(c=>`<button class="chip ${state.cat===c?'on':''}" data-cat="${c}">${c}</button>`).join('')}
function renderFx(){const list=FX.filter(f=>state.cat==='All'||f.cat===state.cat);$('#fxgrid').innerHTML=list.map(f=>`<button class="tile ${f.id===state.fx?'on':''}" data-fx="${f.id}"><span class="em">${f.em}</span><span>${f.name}</span></button>`).join('');$('#fxCount').textContent=`${FX.length} effects`}
function renderFonts(){$('#fontlist').innerHTML=`<div class="sub">☁️ Fancy web fonts — download once, then they work offline</div>`+WEB.map(fontBtn).join('')+`<div class="sub">📱 Built into your iPhone — always offline</div>`+SYS.map(fontBtn).join('')}
const fontBtn=f=>`<button class="fontbtn ${f.id===state.font?'on':''}" data-font="${f.id}" style="font-family:${f.css.replace(/"/g,"'")};font-weight:${f.w}">${f.name}<span class="cloud"></span></button>`;
function renderPals(){$('#pals').innerHTML=PALS.map(p=>`<button class="sw ${p.id===state.pal?'on':''}" data-pal="${p.id}" style="background:linear-gradient(${p.bg[0]},${p.bg[1]})"><b style="background:linear-gradient(${p.t.join(',')});-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:.5px ${p.s}">Aa</b><i>${p.name}</i></button>`).join('')+
  `<button class="sw ${state.pal==='Custom'?'on':''}" data-pal="Custom" style="background:conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)"><b style="color:#fff;-webkit-text-stroke:1px #000">🎨</b><i>Custom</i></button>`;
  for(const k of['t1','t2','bg1','bg2','s','a'])$('#c_'+k).value=state.custom[k];$('#custom').classList.toggle('hidden',state.pal!=='Custom')}
function renderSettings(){$$('[data-size]').forEach(b=>b.classList.toggle('on',b.dataset.size===state.size));$$('[data-dur]').forEach(b=>b.classList.toggle('on',+b.dataset.dur===state.dur));
  $('#scale').value=state.scale;$('#outline').checked=state.outline;$('#dither').checked=state.dither;$('#fxBadge').textContent=`${curFx().em} ${curFx().name} · ${curFont().name}`}
function renderAll(){renderCats();renderFx();renderFonts();renderPals();renderSettings();FONTS.filter(f=>f.web&&f.ok!==undefined).forEach(markFont)}

document.addEventListener('click',e=>{const b=e.target.closest('button,[data-tab]');if(!b)return;const d=b.dataset;
  if(d.cat){state.cat=d.cat;renderCats();renderFx()}
  else if(d.fx){state.fx=d.fx;setupFx();renderFx();renderSettings();t0=performance.now();buzz()}
  else if(d.font){state.font=d.font;$$('.fontbtn').forEach(x=>x.classList.toggle('on',x.dataset.font===d.font));renderSettings();rebuild()}
  else if(d.pal){state.pal=d.pal;renderPals();rebuild()}
  else if(d.size){state.size=d.size;renderSettings();rebuild()}
  else if(d.dur){state.dur=+d.dur;renderSettings();t0=performance.now()}
  else if(d.tab){$$('[data-tab]').forEach(x=>x.classList.toggle('on',x===b));$$('.panel').forEach(p=>p.classList.toggle('hidden',p.id!=='p_'+d.tab));$('#scroller').scrollTop=0}
  save()});
$('#txt').value=state.text;$('#txt').addEventListener('input',e=>{state.text=e.target.value;save();rebuild()});
$('#scale').addEventListener('input',e=>{state.scale=+e.target.value;save();rebuild()});
$('#outline').addEventListener('change',e=>{state.outline=e.target.checked;save();rebuild()});
$('#dither').addEventListener('change',e=>{state.dither=e.target.checked;save()});
for(const k of['t1','t2','bg1','bg2','s','a'])$('#c_'+k).addEventListener('input',e=>{state.custom[k]=e.target.value;save();if(state.pal==='Custom')rebuild()});
$('#surprise').addEventListener('click',()=>{const r=a=>a[Math.floor(Math.random()*a.length)];state.fx=r(FX).id;state.pal=r(PALS).id;state.font=r(FONTS).id;save();renderAll();rebuild();t0=performance.now();toast(r(['🎲 Chaos delivered.','🎲 The dice have spoken.','🎲 You asked for this.','🎲 Fresh weirdness, hot out of the oven.']))});
$('#dlfonts').addEventListener('click',async()=>{if(!navigator.onLine){toast('📡 Need internet for this one (just once!)');return}toast('⬇️ Kidnapping fonts for offline use…');await Promise.all(WEB.map(loadFont));const n=WEB.filter(f=>f.ok).length;toast(`✅ ${n}/${WEB.length} web fonts saved for offline`)});
function buzz(){if(navigator.vibrate)navigator.vibrate(8)}
let toastT;function toast(m){const el=$('#toast');el.textContent=m;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),2200)}

/* ---------- export ---------- */
const QUIPS=['Teaching pixels to dance…','Bribing the LZW goblins…','Herding 256 colors into a pen…','Feeding the hamster wheel…','Applying maximum pizzazz…','Untangling lightning bolts…','Polishing every single frame…','Convincing bugs to hold still…'];
let lastBlob=null,lastURL=null;
$('#make').addEventListener('click',async()=>{if(!S)return;const btn=$('#make');btn.disabled=true;paused=true;openSheet('work');
  try{const{W,H}=S,delay=6,N=Math.max(8,Math.round(state.dur*100/delay));const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});
    const hist=new Uint32Array(32768);const prog=(p,q)=>{$('#bar').style.width=(p*100).toFixed(0)+'%';if(q)$('#quip').textContent=q};
    for(let i=0;i<N;i++){render(x,i/N);G.addHist(hist,x.getImageData(0,0,W,H).data);if(i%3===0){prog(i/N*.35,QUIPS[(i/3|0)%QUIPS.length]);await new Promise(r=>setTimeout(r,0))}}
    const P=G.paletteFromHist(hist),cache=new Int16Array(32768).fill(-1),w=G.start(W,H,P);
    for(let i=0;i<N;i++){render(x,i/N);const ix=G.indexFrame(x.getImageData(0,0,W,H).data,W,H,P,cache,state.dither);G.frame(w,W,H,ix,delay);if(i%2===0){prog(.35+i/N*.65,i%8===0?QUIPS[(i/2|0)%QUIPS.length]:null);await new Promise(r=>setTimeout(r,0))}}
    lastBlob=G.finish(w);if(lastURL)URL.revokeObjectURL(lastURL);lastURL=URL.createObjectURL(lastBlob);prog(1);
    $('#result').src=lastURL;$('#meta').textContent=`${W}×${H} · ${N} frames · ${(lastBlob.size/1024).toFixed(0)} KB`;openSheet('done');celebrate()}
  catch(err){console.error(err);toast('😵 Something exploded: '+err.message);closeSheet()}
  finally{btn.disabled=false;paused=false}});
function fname(){return'giffy-'+(state.text||'gif').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,24)+'-'+Date.now().toString(36)+'.gif'}
function fileObj(){return new File([lastBlob],fname(),{type:'image/gif'})}
$('#saveBtn').addEventListener('click',()=>{if(!lastBlob)return;const f=fileObj();if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f]}).then(()=>toast('📸 Off it goes!')).catch(e=>{if(e.name!=='AbortError')toast('Long-press the GIF → “Save to Photos”')})}else{toast('Long-press the GIF → “Save to Photos”');download()}});
$('#copyBtn').addEventListener('click',async()=>{if(!lastBlob)return;const canGif=window.ClipboardItem&&ClipboardItem.supports&&ClipboardItem.supports('image/gif');
  if(canGif){try{await navigator.clipboard.write([new ClipboardItem({'image/gif':lastBlob})]);toast('📋 Copied! Paste it anywhere.');return}catch(e){}}
  const f=fileObj();if(navigator.canShare&&navigator.canShare({files:[f]})){toast('Tap “Copy” in the share sheet 👇');navigator.share({files:[f]}).catch(()=>{})}else toast('Long-press the GIF → “Copy”')});
function download(){const a=document.createElement('a');a.href=lastURL;a.download=fname();document.body.appendChild(a);a.click();a.remove()}
$('#dlBtn').addEventListener('click',()=>lastBlob&&download());
$('#closeBtn').addEventListener('click',closeSheet);
function openSheet(mode){$('#sheet').classList.remove('hidden');$('#work').classList.toggle('hidden',mode!=='work');$('#done').classList.toggle('hidden',mode!=='done');if(mode==='work'){$('#bar').style.width='0%';$('#quip').textContent=QUIPS[0]}}
function closeSheet(){$('#sheet').classList.add('hidden')}
function celebrate(){const box=$('#confetti');box.innerHTML='';for(let i=0;i<40;i++){const s=document.createElement('i');s.style.left=Math.random()*100+'%';s.style.background=`hsl(${Math.random()*360},100%,60%)`;s.style.animationDelay=Math.random()*.4+'s';s.style.transform=`rotate(${Math.random()*360}deg)`;box.appendChild(s)}setTimeout(()=>box.innerHTML='',2200)}

/* ---------- boot ---------- */
document.addEventListener('touchstart',()=>{},{passive:true});
if(navigator.onLine)WEB.forEach(ensureLink);
renderAll();loadFont(curFont()).then(()=>{buildScene();requestAnimationFrame(loop)});
if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',()=>{WEB.forEach(f=>{f.ok=webOk(f);markFont(f)})});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
window.__giffy={get S(){return S},get ST(){return FXST},render,FX,state,buildScene,setFx(id){state.fx=id;setupFx()}};
})();
