// Only this trusted renderer runs in the sandbox. Scene specs contain data, never code.
function renderScene(){
  const canvas=document.querySelector('canvas')!;const ctx=canvas.getContext('2d')!;
  let data:any=null;let width=960,height=540;let t=0;let last=performance.now();let stopped=false;
  const bodies=Array.from({length:12},(_,i)=>({x:100+(i*71)%790,y:-30-i*55,vx:-12-i*2,vy:25+(i%4)*9,r:4+i%4}));
  let impact=0;
  const colors:Record<string,string>={lime:'#e4ff8c',lilac:'#bda7ff',amber:'#ffad70',cyan:'#8ce5de'};
  const stars=Array.from({length:80},(_,i)=>({x:((i*73.13)%100)/100,y:((i*37.71)%100)/100,r:i%5===0?1.4:.7}));
  const resize=()=>{const d=Math.min(devicePixelRatio||1,2);width=innerWidth;height=innerHeight;canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);};
  addEventListener('resize',resize);resize();
  const dot=(x:number,y:number,r:number,color:string)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
  const ellipse=(x:number,y:number,rx:number,ry:number,rotation:number,color:string)=>{ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);ctx.stroke();};
  const roundRect=(x:number,y:number,w:number,h:number,r:number,fill:string)=>{ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
  function frame(now:number){
    const dt=Math.min((now-last)/1000,.05);last=now;
    if(!data){requestAnimationFrame(frame);return;}
    const {scene,charge,round,settings}=data;
    if(!settings?.reducedMotion&&!stopped)t+=dt;
    ctx.clearRect(0,0,width,height);
    const scale=Math.min(width/960,height/540);ctx.save();ctx.translate(width/2,height/2);ctx.scale(scale,scale);ctx.translate(-480,-270);
    const accent=colors[scene.accent]||colors.lime;
    const active=round.status==='playing';const percent=Math.min(1,(round.shields||0)/scene.goal);
    if(!data.transparent){
      const bg=ctx.createRadialGradient(480,270,20,480,270,580);bg.addColorStop(0,'#1e2521');bg.addColorStop(1,'#111613');ctx.fillStyle=bg;ctx.fillRect(0,0,960,540);
      ctx.strokeStyle='#ffffff05';for(let x=0;x<960;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,540);ctx.stroke();}for(let y=0;y<540;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(960,y);ctx.stroke();}
    }
    stars.forEach((s,i)=>dot(s.x*960,s.y*540,s.r,`rgba(220,240,220,${.15+(Math.sin(t*.5+i)+1)*.12})`));
    ellipse(480,265,248,138,-.27,accent+'14');ellipse(480,265,310,195,.28,accent+'0b');
    if(scene.kind==='garden'){
      ellipse(480,365,210,47,0,accent+'35');
      const n=5+Math.floor(percent*16);
      for(let i=0;i<n;i++){
        const x=325+(i*57)%320,y=330+(i*31)%70,h=60+(i%4)*18;
        ctx.strokeStyle='#6eaa7d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.sin(t+i)*5,y-h/2,x,y-h);ctx.stroke();
        const bx=x,by=y-h;for(let k=0;k<5;k++){const a=k*Math.PI*2/5+t*.1;dot(bx+Math.cos(a)*10,by+Math.sin(a)*10,9,i%2?accent:'#d2b5ff');}dot(bx,by,5,'#ffe19c');
        ctx.fillStyle='#6eaa7d';ctx.beginPath();ctx.ellipse(x+9,y-h/2,13,5,-.5,0,Math.PI*2);ctx.fill();
      }
      dot(685,160,28,accent+'12');ctx.font='27px sans-serif';ctx.fillText('✦',675,170);
    }else{
      const cx=480,cy=245,r=scene.kind==='focus'?76:91;
      const glow=ctx.createRadialGradient(cx,cy,5,cx,cy,200);glow.addColorStop(0,accent+'20');glow.addColorStop(1,accent+'00');ctx.fillStyle=glow;ctx.fillRect(cx-200,cy-200,400,400);
      ctx.save();ctx.translate(cx,cy);ctx.rotate(-.2+Math.sin(t*.4)*.06);
      const planet=ctx.createRadialGradient(-32,-35,8,15,20,r*1.2);planet.addColorStop(0,'#e5edbd');planet.addColorStop(.55,'#acb693');planet.addColorStop(1,'#576450');
      dot(0,0,r,planet as any);
      for(let i=0;i<11;i++){
        const a=i*2.399,rad=Math.sqrt(i/11)*r*.8,x=Math.cos(a)*rad,y=Math.sin(a)*rad;
        dot(x+1,y+2,7+(i%3)*5,'#49574426');ellipse(x,y,7+(i%3)*5,6+(i%3)*4,0,'#f2f6cd24');
      }
      if(round.outcome==='lost'){
        ctx.strokeStyle='#30392d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-10,-86);ctx.lineTo(8,-40);ctx.lineTo(-8,-10);ctx.lineTo(16,20);ctx.lineTo(3,86);ctx.stroke();
      }
      ctx.restore();
      // Orbiting reactor rings.
      ctx.save();ctx.translate(cx,cy);ctx.rotate(-.35);
      ellipse(0,0,150,42,0,accent+'90');ellipse(0,0,159,46,0,accent+'24');
      ctx.restore();
      for(let i=0;i<5;i++){
        const a=t*(scene.gravity==='low'?.2:scene.gravity==='high'?.65:.35)+i*Math.PI*2/5;
        const x=cx+Math.cos(a)*200,y=cy+Math.sin(a)*90;
        ctx.save();ctx.translate(x,y);ctx.rotate(t*.2+i);roundRect(-9,-9,18,18,4,accent+'c0');ctx.restore();
      }
      if(active||charge>=100||scene.kind==='meteor'){
        const step=settings?.reducedMotion||stopped?0:dt;
        const gravity=scene.gravity==='low'?4:scene.gravity==='high'?35:14;
        for(let i=0;i<bodies.length;i++){
          const b=bodies[i];b.vy+=gravity*step;b.x+=b.vx*step;b.y+=b.vy*step;
          const dx=b.x-cx,dy=b.y-cy,dist=Math.hypot(dx,dy),shieldRadius=percent>0?114:91;
          if(dist<shieldRadius+b.r&&b.vx*dx+b.vy*dy<0){
            const nx=dx/dist,ny=dy/dist,dotProduct=b.vx*nx+b.vy*ny;
            b.vx-=2*dotProduct*nx;b.vy-=2*dotProduct*ny;b.x=cx+nx*(shieldRadius+b.r+1);b.y=cy+ny*(shieldRadius+b.r+1);impact=.8;
          }
          if(b.y>580||b.x<0||b.x>960){b.x=140+(i*71)%700;b.y=-30-(i%3)*50;b.vx=-12-i*2;b.vy=25+(i%4)*9;}
          ctx.strokeStyle='#ffba7050';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x-b.vx*.3,b.y-b.vy*.3);ctx.lineTo(b.x,b.y);ctx.stroke();dot(b.x,b.y,b.r,'#f7bd83');
        }
        impact=Math.max(0,impact-step*2);
        if(impact>0){ctx.strokeStyle=accent+Math.floor(impact*120).toString(16).padStart(2,'0');ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,percent>0?115:93,0,Math.PI*2);ctx.stroke();}
      }
      if(percent>0||round.outcome==='saved'){
        ctx.strokeStyle=accent;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(cx,cy,114,-Math.PI*.95,Math.PI*(-.95+1.9*Math.max(percent,.1)));ctx.stroke();
      }
      // Tiny mascot spacecraft.
      ctx.save();ctx.translate(718+Math.sin(t*.7)*9,330+Math.cos(t*.5)*12);ctx.rotate(-.13);
      roundRect(-22,-34,44,58,9,'#d2d7bd');roundRect(-14,-25,28,21,5,'#252f2b');
      dot(-5,-15,2,accent);dot(6,-15,2,accent);roundRect(-5,4,10,3,1,'#6e7b69');
      ctx.fillStyle='#9ba68d';ctx.beginPath();ctx.moveTo(-22,7);ctx.lineTo(-36,30);ctx.lineTo(-14,21);ctx.fill();ctx.beginPath();ctx.moveTo(22,7);ctx.lineTo(36,30);ctx.lineTo(14,21);ctx.fill();
      dot(0,35,6+Math.sin(t*9)*2,'#e4ff8c80');ctx.restore();
    }
    if(active||round.status==='paused'){
      const left=round.status==='paused'?round.remaining:Math.max(0,round.deadline-Date.now());
      roundRect(386,395,188,42,21,'#0b0f0dd9');ctx.strokeStyle=accent+'30';ctx.stroke();
      ctx.fillStyle=accent;ctx.textAlign='center';ctx.font='600 17px monospace';ctx.fillText(`${Math.floor(left/60000).toString().padStart(2,'0')}:${Math.floor(left%60000/1000).toString().padStart(2,'0')}  ·  ${round.shields}/${scene.goal}`,480,422);
    }else if(round.status==='ended'){
      ctx.fillStyle=accent;ctx.textAlign='center';ctx.font='600 20px sans-serif';ctx.fillText(round.outcome==='saved'?'A little chaos. A community victory.':'One cracked moon. One very good story.',480,414);
    }
    ctx.textAlign='left';ctx.restore();requestAnimationFrame(frame);
  }
  addEventListener('message',e=>{
    if(e.source!==parent)return;
    if(e.data?.type==='popforge:state'&&e.data.payload?.scene){data=e.data.payload;stopped=!!data.previewPaused;}
  });
  parent.postMessage({type:'popforge:ready'},'*');requestAnimationFrame(frame);
}
export const RENDERER_DOCUMENT=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; frame-src 'none'"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}canvas{display:block;width:100%;height:100%}</style></head><body><canvas aria-label="Animated community scene"></canvas><script>(${renderScene.toString()})()</script></body></html>`;
