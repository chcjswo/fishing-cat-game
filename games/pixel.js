// ===== 낚시냥 — detailed scenery + pixel foreground renderer =====
(function(){
const PW = 160, PH = 256;
const THEMES = {
  day:    { sky:['#9fe3fb','#b8ecfc','#d0f4fd','#e6fafd'], sea:['#6ff0e6','#3edad4','#1fc0bf','#0fa3a8'], deep:'#0b8c93', foam:'#ffffff', cloud:['#ffffff','#dbeef4'], sun:'#fff6b0', sunRim:'#ffe060', deck:['#f2c160','#e2a94a','#c98c35'], wood:['#b87a3c','#8e5a28','#5e3a18'] },
  sunset: { sky:['#ff8f6a','#ffa877','#ffc488','#ffe1a6'], sea:['#6fcad8','#46adc8','#2d8fb2','#1e7196'], deep:'#175b80', foam:'#ffe9d0', cloud:['#ffd9c6','#f4b0a0'], sun:'#ffdf70', sunRim:'#ff9a40', deck:['#e7a95a','#d08f44','#b0732f'], wood:['#a4683a','#7c4b25','#4f2e14'] },
  night:  { sky:['#10163a','#18214d','#212e63','#2c3d7a'], sea:['#2c78a6','#20618e','#174b76','#10385d'], deep:'#0b2a48', foam:'#9fd4ff', cloud:['#3b4a86','#2e3a6e'], sun:'#fffbe0', sunRim:'#d9dcff', deck:['#b88a52','#9c7242','#7a5731'], wood:['#7d5634','#5d3e22','#3a2512'] },
};
const R = (ctx,c,x,y,w=1,h=1)=>{ ctx.fillStyle=c; ctx.fillRect(x,y,w,h); };

function sky(ctx,t,top,bottom,time,theme){
  const n=t.sky.length, bh=(bottom-top)/n;
  for(let i=0;i<n;i++){
    const y0=Math.round(top+i*bh), y1=Math.round(top+(i+1)*bh);
    R(ctx,t.sky[i],0,y0,PW,y1-y0);
    if(i<n-1){ // dither transition
      for(let x=0;x<PW;x++){ if((x)%2===0) R(ctx,t.sky[i+1],x,y1-2); if((x+1)%2===0) R(ctx,t.sky[i],x,y1+1); }
    }
  }
  if(theme==='night'){
    const stars=[[12,20],[30,48],[52,14],[70,38],[96,22],[120,50],[140,16],[150,60],[22,78],[88,70],[110,84],[64,90],[134,92],[40,64]];
    stars.forEach(([x,y],i)=>{ const on=((time*2+i)|0)%3!==0; R(ctx,on?'#ffffff':'#8fa0e0',x,y); if(on&&i%4===0){R(ctx,'#b8c4ff',x-1,y);R(ctx,'#b8c4ff',x+1,y);R(ctx,'#b8c4ff',x,y-1);R(ctx,'#b8c4ff',x,y+1);} });
  }
}
function disc(ctx,cx,cy,r,c){ for(let y=-r;y<=r;y++){ const w=Math.round(Math.sqrt(r*r-y*y)); R(ctx,c,cx-w,cy+y,w*2+1,1);} }
function sun(ctx,t,theme){
  if(theme==='day'){ disc(ctx,128,34,11,t.sunRim); disc(ctx,128,34,9,t.sun); R(ctx,'#fff',123,29,3,2); }
  else if(theme==='sunset'){ disc(ctx,80,96,20,t.sunRim); disc(ctx,80,96,17,t.sun); }
  else { disc(ctx,124,30,9,t.sunRim); disc(ctx,124,30,8,t.sun); disc(ctx,128,27,7,t.sky[0]); }
}
function cloud(ctx,x,y,w,c){
  const [a,b]=c; x=Math.round(x);
  R(ctx,b,x+2,y+8,w-4,3);
  R(ctx,a,x,y+4,w,5); R(ctx,a,x+3,y+1,Math.round(w*.4),4); R(ctx,a,x+Math.round(w*.45),y-1,Math.round(w*.35),6);
  R(ctx,a,x+1,y+3,w-2,1);
  R(ctx,b,x,y+8,w,1);
}
function sea(ctx,t,top,bottom,time){
  R(ctx,t.sky[t.sky.length-1],0,top,PW,8); R(ctx,t.deep,0,top+8,PW,bottom-top-8);
  const layers=4;
  for(let i=0;i<layers;i++){
    const base=top+ i*17, r=8+i, per=r*2, dir=i%2?1:-1;
    const off=Math.round(Math.sin(time*(0.9+i*.25)+i)*5*dir);
    for(let x=0;x<PW;x++){
      const lx=((x+off+i*5)%per+per)%per - r;
      const h=Math.round(Math.sqrt(Math.max(0,r*r-lx*lx))*0.55);
      const y0 = base - h + 4;
      R(ctx,t.sea[i],x,y0,1,bottom-y0);
      if(i===0){ R(ctx,t.foam,x,y0,1,2); }
      else if(Math.abs(lx)<r-2 && h>=Math.round(r*.55)-1){ /* crest highlight */ R(ctx,t.sea[i-1],x,y0,1,1); }
    }
  }
  // sparkle glints
  for(let k=0;k<6;k++){ const gx=((k*37+Math.floor(time*6)*3)%PW), gy=top+10+((k*23)%60); if(((time*3+k)|0)%2) { R(ctx,t.foam,gx,gy,2,1);} }
}
function rail(ctx,t,top){
  const [w0,w1,w2]=t.wood;
  // top bar
  R(ctx,w2,0,top,PW,8); R(ctx,w0,0,top+1,PW,5); R(ctx,'rgba(255,255,255,.35)',0,top+1,PW,1); R(ctx,w1,0,top+5,PW,1);
  // balusters
  for(let x=4;x<PW;x+=14){
    const y0=top+8;
    const prof=[3,3,4,5,5,4,3,2,2,3,4,5,5,4,3,3,3,4,4,4,3,3,3,3,3,3];
    prof.forEach((hw,j)=>{ R(ctx,w2,x+3-hw,y0+j,hw*2+2,1); R(ctx,w0,x+4-hw,y0+j,hw*2,1); R(ctx,w1,x+3+hw-1,y0+j,1,1); R(ctx,'rgba(255,255,255,.35)',x+4-hw,y0+j,1,1); });
  }
  const by=top+34;
  R(ctx,w2,0,by,PW,7); R(ctx,w0,0,by+1,PW,4); R(ctx,w1,0,by+4,PW,1);
}
function deck(ctx,t,top,bottom){
  const [d0,d1,d2]=t.deck;
  R(ctx,d0,0,top,PW,bottom-top);
  const rows=[top, top+11, top+23, top+34, top+46];
  rows.forEach((y,i)=>{
    R(ctx,d2,0,y,PW,1); R(ctx,'rgba(255,255,255,.28)',0,y+1,PW,1);
    const off=i%2?0:22;
    for(let x=off; x<PW; x+=44){ R(ctx,d2,x,y,1,12); R(ctx,d1,x+1,y+1,1,11); }
    // nails
    for(let x=off+4; x<PW; x+=44){ R(ctx,d1,x,y+4); R(ctx,d1,x+36,y+4); }
  });
  R(ctx,'rgba(0,0,0,.18)',0,top,PW,3);
}

class PixelBG {
  constructor(canvas){ this.c=canvas; this.ctx=canvas.getContext('2d'); this.resize(0); this.theme='day'; this.t=0; this.clouds=[[20,56,34],[96,72,28],[130,40,22],[60,86,40]]; this.last=0; this.fever=false; }
  // extra: 게임 높이에 더해진 px(4의 배수). 늘어난 만큼 하늘·바다를 키우고 난간·부두는 아래로 내린다.
  resize(extra){ this.e=extra/4; this.c.width=PW*4; this.c.height=(PH+this.e)*4; this.ctx.scale(4,4); if(this.theme) this.draw(this.t); }
  loadBackground(src){
    this.backgrounds ||= new Map();
    if(!this.backgrounds.has(src)){
      const image=new Image();
      image.onload=()=>{ if(this.background===image) this.draw(this.t); };
      image.src=src;
      this.backgrounds.set(src,image);
    }
    return this.backgrounds.get(src);
  }
  setTheme(k,background,pixelated=false){ this.theme=k; this.pixelated=!!pixelated; this.c.style.imageRendering=this.pixelated?'pixelated':'auto'; this.background=background?this.loadBackground(background):null; this.draw(this.t); }
  draw(time){
    this.t=time;
    const ctx=this.ctx, t=THEMES[this.theme], e=this.e;
    if(this.background?.complete && this.background.naturalWidth){
      // Preserve scenery detail; the foreground still uses the original pixel grid.
      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      ctx.imageSmoothingEnabled=!this.pixelated;
      ctx.imageSmoothingQuality='high';
      // 비율을 유지한 채 세로를 채우고 넘치는 좌우는 가운데 기준으로 잘라낸다.
      const img=this.background, dh=(213+e)*4, dw=dh*img.naturalWidth/img.naturalHeight;
      ctx.drawImage(img,(PW*4-dw)/2,0,dw,dh);
      ctx.restore();
    } else {
    sky(ctx,t,0,104+e,time,this.theme);
    if(!this.fever) sun(ctx,t,this.theme);
    this.clouds.forEach(([x,y,w],i)=>{ const xx=((x - time*(2+i*.7))%(PW+60)+PW+60)%(PW+60)-40; cloud(ctx,xx,y,w,t.cloud); });
    // gulls
    if(this.theme!=='night'){ [[0,62,1],[1,74,.7]].forEach(([i,y,s])=>{ const gx=((time*14*s+i*90)%(PW+20))-10; const up=((time*5+i)|0)%2; R(ctx,'#4a5a6a',Math.round(gx),y,1,1); R(ctx,'#4a5a6a',Math.round(gx)-2,y-(up?1:-1)+ (up?0:0),2,1); R(ctx,'#4a5a6a',Math.round(gx)+1,y-(up?1:-1),2,1); R(ctx,'#4a5a6a',Math.round(gx)-3,y-(up?2:0),1,1); R(ctx,'#4a5a6a',Math.round(gx)+3,y-(up?2:0),1,1); }); }
    sea(ctx,t,100+e,212+e,time);
    }
    rail(ctx,t,175+e);
    deck(ctx,t,213+e,PH+e);
  }
  start(){ const t0=performance.now(); this.draw(0); setInterval(()=>{ try{ this.draw((performance.now()-t0)/1000); }catch(e){ console.error(e); } }, 90); }
}

/* title background: sky + sparkles + sea + rock */
// extra: 게임 높이에 더해진 px. 하늘을 늘리고 반짝이는 절반, 바다·바위는 전부 아래로 내린다.
function drawTitle(canvas, extra=0){
  const e=extra/4;
  canvas.width=PW; canvas.height=PH+e; const ctx=canvas.getContext('2d');
  const t={sky:['#a8e2f3','#bde9f5','#cfeff7','#dff5f9']};
  sky(ctx,t,0,PH+e,0,'day');
  const sp=[[14,86],[140,96],[18,30],[146,12],[76,120],[6,150],[120,140]];
  sp.forEach(([x,y],i)=>{ y+=Math.round(e/2); const s=i%2?2:3; R(ctx,'#ffffff',x-s,y,s*2+1,1); R(ctx,'#ffffff',x,y-s,1,s*2+1); R(ctx,'#ffffff',x-1,y-1,3,3); });
  ctx.translate(0,e);
  // sea
  const sc=['#6ff0e6','#3edad4','#1fc0bf','#0fa3a8'];
  for(let i=0;i<4;i++){ const base=184+i*14, r=9+i;
    for(let x=0;x<PW;x++){ const lx=((x+i*7)%(r*2))-r; const h=Math.round(Math.sqrt(Math.max(0,r*r-lx*lx))*.5); const y0=base-h+3; R(ctx,sc[i],x,y0,1,PH-y0); if(i===0)R(ctx,'#fff',x,y0); } }
  // rock
  const rk=['#f6e0a0','#e5c77c','#b8994e','#7a6232'];
  R(ctx,rk[3],0,174,120,82); R(ctx,rk[0],0,176,116,80); R(ctx,rk[1],0,186,116,70);
  for(let y=176;y<256;y++){ R(ctx,rk[3],116+Math.floor((y-176)/9),y,2,1); }
  R(ctx,rk[2],0,186,116,1);
  [[14,190,8],[40,200,10],[66,188,7],[96,194,9],[24,220,12],[58,232,9],[92,226,10]].forEach(([x,y,l])=>{ for(let k=0;k<l;k++) R(ctx,rk[2],x+(k>>1),y+k); });
}

/* pixel arrow svg (w=13 cols x 15 rows) */
function gridSVG(rows, pal){
  const h=rows.length, w=rows[0].length; let s='';
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){ const ch=rows[y][x]; if(ch!=='.'&&pal[ch]) s+=`<rect x="${x}" y="${y}" width="1.05" height="1.05" fill="${pal[ch]}"/>`; }
  return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${s}</svg>`;
}
function arrowSVG(dir){
  const rows=17, cols=15, fill=[];
  for(let y=0;y<rows;y++){ const d=Math.abs(y-8); const len=cols-Math.round(d*cols/8.5); fill.push([...Array(cols)].map((_,x)=>x<len)); }
  const g=[];
  for(let y=0;y<rows;y++){ let r=''; for(let x=0;x<cols;x++){
    if(!fill[y][x]){ r+='.'; continue; }
    const edge=!fill[y-1]?.[x]||!fill[y+1]?.[x]||!fill[y][x-1]||!fill[y][x+1];
    r+= edge?'o': (y<6?'h':(y>11?'s':'m')); }
    g.push(dir>0?r:[...r].reverse().join(''));
  }
  return gridSVG(g,{o:'#5a140e',h:'#ff9a86',m:'#f0604f',s:'#c63a2d'});
}
const HEART=[
'.oo...oo.',
'ommo.ommo',
'ommmommmo',
'ommmmmmmo',
'ommmmmmso',
'.ommmmso.',
'..ommso..',
'...oso...',
'....o....'];
function heartIcon(on){ return gridSVG(HEART, on?{o:'#4a0c1a',h:'#ff9fb2',w:'#fff',m:'#f03a5c',s:'#b81f3e'}:{o:'#6b5f4a',h:'#d6ccb4',w:'#e6dfcc',m:'#c9bda0',s:'#a89a7c'}); }

const BIGHEART=[
'..ooo...ooo..',
'.ommmo.ommmo.',
'ommmmmommmmmo',
'ommmmmmmmmmmo',
'ommmmmmmmmmmo',
'ommmmmmmmmmso',
'.ommmmmmmmso.',
'..ommmmmmso..',
'...ommmmso...',
'....ommso....',
'.....oso.....',
'......o......'];
function heartItem(){ return gridSVG(BIGHEART,{o:'#4a0c1a',m:'#e8283f',s:'#b3162b'}); }
/* crisp pixel star: rasterised 5-point polygon → outline + highlight + shade */
const STAR_ROWS = (()=>{
  const N=19, c=N/2, R=9.2, r=3.9, pts=[];
  for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?r:R; pts.push([c+Math.cos(a)*rr, c+0.6+Math.sin(a)*rr]); }
  const inside=(x,y)=>{ let o=false; for(let i=0,j=pts.length-1;i<pts.length;j=i++){ const [xi,yi]=pts[i],[xj,yj]=pts[j]; if(((yi>y)!==(yj>y)) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) o=!o; } return o; };
  const f=[...Array(N)].map((_,y)=>[...Array(N)].map((_,x)=>inside(x+.5,y+.5)));
  return f.map((row,y)=>row.map((v,x)=>{
    if(!v) return '.';
    if(!f[y-1]?.[x]||!f[y+1]?.[x]||!row[x-1]||!row[x+1]) return 'o';
    const up=!f[y-2]?.[x], dn=!f[y+2]?.[x];
    if(up && x<=c) return 'h';
    if(dn || (x>c+1 && !row[x+2])) return 's';
    return 'm';
  }).join(''));
})();
function starIcon(on){
  return gridSVG(STAR_ROWS, on ? {o:'#4a2a06',h:'#fff3a0',m:'#ffc928',s:'#e08a12'} : {o:'#8a7c5e',h:'#ece4cf',m:'#d9ccaa',s:'#bfb190'});
}
window.PIX = { heartItem, starIcon, PixelBG, drawTitle, arrowSVG, heartIcon, gridSVG, THEMES };
})();
