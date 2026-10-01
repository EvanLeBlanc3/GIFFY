/* GIFFY — tiny hand-rolled GIF89a encoder (median-cut palette + LZW). No internet required. */
(function(){
class BW{constructor(n=1<<20){this.a=new Uint8Array(n);this.n=0}
  grow(k){if(this.n+k>this.a.length){let s=this.a.length*2;while(s<this.n+k)s*=2;const b=new Uint8Array(s);b.set(this.a.subarray(0,this.n));this.a=b}}
  b(v){this.grow(1);this.a[this.n++]=v}
  u16(v){this.b(v&255);this.b((v>>8)&255)}
  str(s){for(let i=0;i<s.length;i++)this.b(s.charCodeAt(i))}
  arr(x){this.grow(x.length);this.a.set(x,this.n);this.n+=x.length}
  out(){return this.a.subarray(0,this.n)}}

function addHist(hist,d){for(let i=0;i<d.length;i+=8){hist[((d[i]>>3)<<10)|((d[i+1]>>3)<<5)|(d[i+2]>>3)]++}}

function paletteFromHist(hist){
  const bins=[];for(let k=0;k<32768;k++)if(hist[k])bins.push(k);
  const ch=(k,a)=>a===0?(k>>10)&31:a===1?(k>>5)&31:k&31;
  function box(list){let mn=[31,31,31],mx=[0,0,0],c=0;
    for(const k of list){c+=hist[k];for(let a=0;a<3;a++){const v=ch(k,a);if(v<mn[a])mn[a]=v;if(v>mx[a])mx[a]=v}}
    const r=[mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2]];const ax=r[0]>=r[1]&&r[0]>=r[2]?0:r[1]>=r[2]?1:2;
    return{list,count:c,range:r[ax],ax}}
  let boxes=[box(bins.length?bins:[0])];
  while(boxes.length<256){
    let bi=-1,bs=-1;const phase2=boxes.length>=160;
    for(let i=0;i<boxes.length;i++){const b=boxes[i];if(b.list.length<2||b.range===0)continue;
      const s=phase2?b.range:b.range*b.count;if(s>bs){bs=s;bi=i}}
    if(bi<0)break;
    const b=boxes[bi];b.list.sort((p,q)=>ch(p,b.ax)-ch(q,b.ax));
    let half=b.count/2,acc=0,cut=1;
    for(let i=0;i<b.list.length;i++){acc+=hist[b.list[i]];if(acc>=half){cut=i+1;break}}
    cut=Math.max(1,Math.min(b.list.length-1,cut));
    boxes.splice(bi,1,box(b.list.slice(0,cut)),box(b.list.slice(cut)));
  }
  const pal=new Uint8Array(768);
  boxes.forEach((b,i)=>{let r=0,g=0,bl=0,c=0;for(const k of b.list){const w=hist[k]||1;r+=((k>>10)&31)*w;g+=((k>>5)&31)*w;bl+=(k&31)*w;c+=w}
    pal[i*3]=Math.min(255,Math.round(r/c*8.22));pal[i*3+1]=Math.min(255,Math.round(g/c*8.22));pal[i*3+2]=Math.min(255,Math.round(bl/c*8.22))});
  return{pal,n:boxes.length};
}

const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>(v/16-.47)*14);
function indexFrame(d,W,H,P,cache,dither){
  const out=new Uint8Array(W*H),pal=P.pal,n=P.n;
  for(let y=0,p=0,i=0;y<H;y++){for(let x=0;x<W;x++,p++,i+=4){
    let r=d[i],g=d[i+1],b=d[i+2];
    if(dither){const o=BAYER[((y&3)<<2)|(x&3)];r+=o;g+=o;b+=o;r=r<0?0:r>255?255:r;g=g<0?0:g>255?255:g;b=b<0?0:b>255?255:b}
    const key=((r>>3)<<10)|((g>>3)<<5)|(b>>3);let ix=cache[key];
    if(ix<0){const R=(key>>10)*8.22,G=((key>>5)&31)*8.22,B=(key&31)*8.22;let best=1e9;ix=0;
      for(let j=0;j<n;j++){const dr=pal[j*3]-R,dg=pal[j*3+1]-G,db=pal[j*3+2]-B;const dd=dr*dr*2+dg*dg*3+db*db*1.5;if(dd<best){best=dd;ix=j}}
      cache[key]=ix}
    out[p]=ix}}
  return out;
}

const TAB=new Int32Array(1<<20),STAMP=new Int32Array(1<<20);let GEN=0;
function lzw(ix,w){
  w.b(8);const clear=256,eoi=257;let size=9,next=258,gen=++GEN;
  const buf=new BW(ix.length);let cur=0,sh=0;
  const emit=c=>{cur|=c<<sh;sh+=size;while(sh>=8){buf.b(cur&255);cur>>>=8;sh-=8}};
  emit(clear);let pre=ix[0];
  for(let i=1;i<ix.length;i++){const k=ix[i],key=(pre<<8)|k;
    if(STAMP[key]===gen){pre=TAB[key];continue}
    emit(pre);
    if(next===4096){emit(clear);next=258;size=9;gen=++GEN}
    else{if(next>=(1<<size))size++;TAB[key]=next++;STAMP[key]=gen}
    pre=k}
  emit(pre);emit(eoi);if(sh>0)buf.b(cur&255);
  const o=buf.out();for(let i=0;i<o.length;i+=255){const n=Math.min(255,o.length-i);w.b(n);w.arr(o.subarray(i,i+n))}
  w.b(0);
}

function start(W,H,P){const w=new BW();w.str('GIF89a');w.u16(W);w.u16(H);w.b(0xF7);w.b(0);w.b(0);w.arr(P.pal);
  w.b(0x21);w.b(0xFF);w.b(11);w.str('NETSCAPE2.0');w.b(3);w.b(1);w.u16(0);w.b(0);return w}
function frame(w,W,H,ix,delay){w.b(0x21);w.b(0xF9);w.b(4);w.b(0x04);w.u16(delay);w.b(0);w.b(0);
  w.b(0x2C);w.u16(0);w.u16(0);w.u16(W);w.u16(H);w.b(0);lzw(ix,w)}
function finish(w){w.b(0x3B);return new Blob([w.out()],{type:'image/gif'})}

window.GIFFYGIF={addHist,paletteFromHist,indexFrame,start,frame,finish};
})();
