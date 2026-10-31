// Only this trusted renderer runs in the sandbox. Scene specs contain data, never code.
export function renderScene(canvasOverride?:HTMLCanvasElement){
  const canvas=canvasOverride??document.querySelector('canvas')!;const ctx=canvas.getContext('2d')!;
  let disposed=false;let data:any=null;let width=960,height=540;let t=0;let last=performance.now();let stopped=false;
  const bodies=Array.from({length:12},(_,i)=>({x:340+(i*47)%430,y:-30-i*55,vx:-12-i*2,vy:25+(i%4)*9,r:4+i%4}));
  let impact=0;
  const colors:Record<string,string>={lime:'#e4ff8c',lilac:'#bda7ff',amber:'#ffad70',cyan:'#8ce5de'};
  const stars=Array.from({length:80},(_,i)=>({x:((i*73.13)%100)/100,y:((i*37.71)%100)/100,r:i%5===0?1.4:.7}));
  const resize=()=>{const d=Math.min(devicePixelRatio||1,2);width=innerWidth;height=innerHeight;canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);};
  addEventListener('resize',resize);resize();
  const dot=(x:number,y:number,r:number,color:string)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
  const ellipse=(x:number,y:number,rx:number,ry:number,rotation:number,color:string)=>{ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);ctx.stroke();};
  const roundRect=(x:number,y:number,w:number,h:number,r:number,fill:string)=>{ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
  function ambientWorld(){
    const l=data.lounge;const mood=l.mood;const motion=l.energy==='quiet'?0:t;
    const palette:Record<string,string[]>={starlight:['#111a32','#2c435e','#687b86'],rain:['#14252b','#3b5c63','#849b96'],aurora:['#0c2028','#294e50','#77a99e'],sunset:['#34223d','#a35c79','#edac83']};
    const c=palette[mood]??palette.starlight;
    const sky=ctx.createLinearGradient(0,0,0,540);sky.addColorStop(0,c[0]);sky.addColorStop(.67,c[1]);sky.addColorStop(1,c[2]);ctx.fillStyle=sky;ctx.fillRect(0,0,960,540);
    // Warm atmospheric bloom is intentionally subtle behind readable overlay copy.
    const halo=ctx.createRadialGradient(690,200,5,690,200,330);halo.addColorStop(0,mood==='sunset'?'#ffdbad38':'#dce1c314');halo.addColorStop(1,'#aee8e000');ctx.fillStyle=halo;ctx.fillRect(0,0,960,540);
    if(mood==='aurora'){
      for(let band=0;band<4;band++){
        ctx.beginPath();for(let x=-20;x<=980;x+=12){const y=145+Math.sin(x/180+motion*.15+band)*58+band*21;x===-20?ctx.moveTo(x,y):ctx.lineTo(x,y);}
        for(let x=980;x>=-20;x-=12){const y=225+Math.sin(x/180+motion*.15+band)*65+band*17;ctx.lineTo(x,y);}
        ctx.closePath();const ribbon=ctx.createLinearGradient(0,90,0,330);ribbon.addColorStop(0,band%2?'#c9b1f41d':'#7ce7bf32');ribbon.addColorStop(.65,'#95d7c716');ribbon.addColorStop(1,'#7ce7bf00');ctx.fillStyle=ribbon;ctx.fill();
      }
    }
    if(mood==='sunset'){
      dot(707,195,62,'#fbd5a1b0');for(let i=0;i<6;i++){ctx.fillStyle=c[1];ctx.globalAlpha=.32;ctx.fillRect(640,180+i*13,137,3+i);ctx.globalAlpha=1;}
      for(let i=0;i<24;i++){const x=i*45,h=30+(i*37)%100;roundRect(x,360-h,35,h,2,'#352a3b');for(let j=0;j<4;j++)if((i+j)%3===0)roundRect(x+10,370-h+j*17,4,5,1,'#ebc39445');}
    }else{
      stars.forEach((s,i)=>{if(s.y<.62)dot(s.x*960,s.y*460,s.r,mood==='rain'?'#b1d4d02a':`rgba(231,231,206,${.2+(Math.sin(motion*.4+i)+1)*.17})`);});
      if(mood!=='rain'){dot(728,149,34,'#f4e4bcbb');dot(715,139,31,c[1]);}
    }
    // Layered landscape and slow water reflections.
    for(let layer=0;layer<3;layer++){
      ctx.beginPath();ctx.moveTo(0,540);for(let x=0;x<=960;x+=16){const y=332+layer*35+Math.sin(x/(160-layer*25)+layer*2.4)*24+Math.sin(x/57+layer)*8;ctx.lineTo(x,y);}ctx.lineTo(960,540);ctx.closePath();ctx.fillStyle=['#172a36','#182d31','#152a28'][layer];if(mood==='sunset')ctx.fillStyle=['#4b3648','#3d3043','#292b37'][layer];ctx.fill();
    }
    const water=ctx.createLinearGradient(0,390,0,540);water.addColorStop(0,'#8ac0bb16');water.addColorStop(1,'#16253000');ctx.fillStyle=water;ctx.beginPath();ctx.moveTo(370,380);ctx.bezierCurveTo(500,440,530,450,350,540);ctx.lineTo(780,540);ctx.bezierCurveTo(580,440,550,420,520,380);ctx.fill();
    for(let i=0;i<15;i++){const y=400+i*9,x=460+Math.sin(i*1.8+motion*.15)*30;ctx.strokeStyle='#c9dfc512';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-i*2,y);ctx.lineTo(x+15+i*3,y);ctx.stroke();}
    // A tiny warm-windowed cabin for a sense of company.
    ctx.fillStyle=mood==='sunset'?'#533641':'#223d35';ctx.beginPath();ctx.moveTo(145,394);ctx.lineTo(145,354);ctx.lineTo(174,333);ctx.lineTo(205,354);ctx.lineTo(205,394);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#6d816b88';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(139,355);ctx.lineTo(174,329);ctx.lineTo(211,355);ctx.stroke();
    roundRect(158,355,12,16,2,'#f9d596');roundRect(182,355,12,16,2,'#f9d596');
    const warm=ctx.createRadialGradient(177,370,5,177,370,70);warm.addColorStop(0,'#ffd69c19');warm.addColorStop(1,'#ffd69c00');ctx.fillStyle=warm;ctx.fillRect(107,300,140,140);
    if(mood==='rain'){
      ctx.fillStyle='#a6c5c40b';ctx.fillRect(0,0,960,540);
      for(let i=0;i<75;i++){const x=(i*73)%980,y=((i*113+motion*80)%620)-40;ctx.strokeStyle=i%3?'#b9ded126':'#def2df42';ctx.lineWidth=i%4===0?1.5:.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+16+i%6);ctx.stroke();}
      ctx.fillStyle='#192a29';ctx.fillRect(0,0,17,540);ctx.fillRect(943,0,17,540);ctx.fillRect(0,516,960,24);ctx.fillStyle='#b5a57b18';ctx.fillRect(0,516,960,2);
      roundRect(795,466,42,44,5,'#c6b799');ellipse(838,483,9,11,0,'#c6b799');ellipse(816,466,20,5,0,'#e4d9bb');
      for(let i=0;i<3;i++){ctx.strokeStyle='#e5e2ca24';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(808+i*7,453);ctx.bezierCurveTo(798+i*8,443,824+i*7,430,812+i*7,416);ctx.stroke();}
    }
    // Fireflies and community-created lanterns. Visual entities stay bounded.
    for(let i=0;i<18;i++){
      const x=90+(i*87)%790+Math.sin(motion*.2+i)*8,y=330+(i*17)%100+Math.cos(motion*.3+i)*7;
      const glow=ctx.createRadialGradient(x,y,0,x,y,7);glow.addColorStop(0,'#e5e3a070');glow.addColorStop(1,'#e5e3a000');ctx.fillStyle=glow;ctx.fillRect(x-7,y-7,14,14);dot(x,y,.8,'#f7edb6');
    }
    for(let i=0;i<Math.min(l.lanterns,18);i++){
      const x=260+(i*91)%540+Math.sin(motion*.22+i)*12,y=300-(i*37)%220+Math.cos(motion*.16+i)*7;
      roundRect(x-4,y-7,9,13,3,'#f4d3a687');dot(x+.5,y+9,1.2,'#ffe3a8');
    }
    const n=Math.min(l.stars,16);ctx.strokeStyle='#b9d8dd4d';ctx.lineWidth=.8;
    for(let i=0;i<n;i++){const x=330+(i*73)%260,y=85+(i*31)%110;dot(x,y,2,'#e9e7c8');if(i){ctx.beginPath();ctx.moveTo(330+((i-1)*73)%260,85+((i-1)*31)%110);ctx.lineTo(x,y);ctx.stroke();}}
  }
  function missionWorld(){
    const kind=data.scene.kind;const accent=colors[data.scene.accent]??colors.lime;
    const sky=ctx.createLinearGradient(74,104,830,430);
    sky.addColorStop(0,kind==='focus'?'#263947':kind==='reactor'?'#3d3434':'#302e4a');
    sky.addColorStop(.6,kind==='focus'?'#1c303b':kind==='reactor'?'#263a35':'#222e42');sky.addColorStop(1,'#162b2c');
    ctx.save();ctx.shadowColor='#0b182855';ctx.shadowBlur=32;ctx.shadowOffsetY=14;roundRect(74,104,812,330,30,sky as any);ctx.restore();
    ctx.save();ctx.beginPath();ctx.roundRect(74,104,812,330,30);ctx.clip();
    const glow=ctx.createRadialGradient(520,250,10,520,250,340);glow.addColorStop(0,accent+'1a');glow.addColorStop(1,accent+'00');ctx.fillStyle=glow;ctx.fillRect(74,104,812,330);
    for(let i=0;i<55;i++){const x=90+(i*137)%780,y=114+(i*61)%290;dot(x,y,i%7===0?1.3:.6,i%3===0?'#e4eac555':'#a9b8c144');}
    // A horizon and a few architectural lights give the cosmic stage a home.
    ctx.fillStyle='#11292880';ctx.beginPath();ctx.moveTo(74,410);ctx.bezierCurveTo(260,362,344,423,500,396);ctx.bezierCurveTo(690,362,795,390,886,371);ctx.lineTo(886,434);ctx.lineTo(74,434);ctx.fill();
    ctx.strokeStyle=accent+'20';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(95,410);ctx.lineTo(866,410);ctx.stroke();
    ctx.textAlign='left';ctx.fillStyle=accent;ctx.font='600 9px sans-serif';ctx.fillText(kind==='focus'?'THE QUIET ORBIT':kind==='reactor'?'A LITTLE CHAOS LAB':'THE MOONKEEPERS',112,146);
    ctx.fillStyle='#f2eedc';ctx.font='600 24px sans-serif';ctx.fillText(kind==='focus'?'One small task.':kind==='reactor'?'Collect the':'One moon.',112,187);ctx.fillText(kind==='focus'?'A little support.':kind==='reactor'?'little sparks.':'All of us.',112,218);
    ctx.fillStyle='#bbcdca';ctx.font='11px sans-serif';
    ctx.fillText(kind==='focus'?'A calm place to finish something.':kind==='reactor'?'Your keyword brings the energy.':'Keep our little corner of space safe.',112,246);
    roundRect(112,274,128,30,15,accent+'16');ctx.fillStyle=accent;ctx.font='600 12px monospace';ctx.fillText(kind==='reactor'?`say ${data.scene.keyword}`:'chat  !shield',124,294);
    const progress=Math.min(1,kind==='reactor'?data.charge/100:(data.round.shields||0)/data.scene.goal);
    ctx.fillStyle='#baccc2';ctx.font='10px sans-serif';ctx.fillText(kind==='reactor'?'COMMUNITY ENERGY':'MADE TOGETHER',112,344);
    roundRect(112,357,135,5,2.5,'#ffffff15');if(progress>0)roundRect(112,357,Math.max(5,135*progress),5,2.5,accent);
    ctx.fillStyle='#e7eddb';ctx.font='600 12px sans-serif';ctx.fillText(kind==='reactor'?`${data.charge}% charged`:`${data.round.shields||0} / ${data.scene.goal} contributions`,112,386);
    ctx.restore();ctx.strokeStyle=accent+'30';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(74,104,812,330,30);ctx.stroke();
  }
  function gardenWorld(){
    const memory=(data.rehearsal?data.demoGarden:data.garden)??{water:0,blooms:[]};
    const blooms=memory.blooms??[];const drops=(memory.water??0)%5;
    const accent=colors[data.scene.accent]??colors.lilac;
    // A self-contained illustrated stage: alpha outside, warm company inside.
    ctx.save();ctx.shadowColor='#102b2740';ctx.shadowBlur=32;ctx.shadowOffsetY=14;
    roundRect(74,104,812,330,30,'#e4ede2');ctx.restore();
    ctx.save();ctx.beginPath();ctx.roundRect(74,104,812,330,30);ctx.clip();
    const sky=ctx.createLinearGradient(0,104,0,434);sky.addColorStop(0,'#edf1df');sky.addColorStop(.52,'#cbded0');sky.addColorStop(1,'#91b4a1');ctx.fillStyle=sky;ctx.fillRect(74,104,812,330);
    const sunshine=ctx.createRadialGradient(774,157,5,774,157,140);sunshine.addColorStop(0,'#fff1c9e0');sunshine.addColorStop(1,'#fff1c900');ctx.fillStyle=sunshine;ctx.fillRect(620,104,266,240);dot(774,157,28,'#fff3d3');
    for(let layer=0;layer<3;layer++){
      ctx.beginPath();ctx.moveTo(400,434);for(let x=400;x<=900;x+=12)ctx.lineTo(x,304+layer*34+Math.sin(x/90+layer*2)*18);ctx.lineTo(900,434);ctx.closePath();ctx.fillStyle=['#a4c2ae','#8bae98','#71997f'][layer];ctx.fill();
    }
    // Left editorial panel keeps instructions readable on any gameplay background.
    const wash=ctx.createLinearGradient(90,0,470,0);wash.addColorStop(0,'#edf1e8');wash.addColorStop(.7,'#edf1e8f0');wash.addColorStop(1,'#edf1e800');ctx.fillStyle=wash;ctx.fillRect(74,104,440,330);
    ctx.textAlign='left';ctx.fillStyle='#526f5a';ctx.font='600 10px sans-serif';ctx.fillText('THE LITTLE GREENHOUSE',112,145);
    ctx.fillStyle='#233f34';ctx.font='600 31px sans-serif';ctx.fillText('A little care.',111,190);ctx.fillText('Something lasting.',111,225);
    ctx.fillStyle='#526957';ctx.font='13px sans-serif';ctx.fillText('A shared garden, grown one hello at a time.',112,255);
    roundRect(112,278,119,32,16,'#244c3c');ctx.fillStyle='#f3f2de';ctx.font='600 13px monospace';ctx.fillText('chat  !water',127,299);
    ctx.fillStyle='#536b59';ctx.font='11px sans-serif';ctx.fillText('Five contributions. One new bloom.',112,333);
    for(let i=0;i<5;i++){dot(119+i*21,354,6,i<drops?'#587e58':'#c3d2be');if(i<drops)dot(117+i*21,352,1.6,'#e9f1cc');}
    ctx.font='600 12px sans-serif';ctx.fillStyle='#355541';ctx.fillText(`${5-drops} to the next flower`,112,385);
    ctx.font='10px sans-serif';ctx.fillStyle='#607762';ctx.fillText(data.rehearsal?'REHEARSAL GARDEN · LIVE BLOOMS STAY SEPARATE':`${memory.water} LIVE CONTRIBUTIONS · ${blooms.length} RECENT BLOOMS`,112,410);
    // Glasshouse, timber frame, and a warm lamp — decoration never counts as blooms.
    ctx.save();ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(487,337);ctx.lineTo(487,217);ctx.quadraticCurveTo(487,181,522,159);ctx.lineTo(620,117);ctx.lineTo(723,160);ctx.quadraticCurveTo(756,178,756,217);ctx.lineTo(756,337);ctx.closePath();
    const glass=ctx.createLinearGradient(490,150,750,340);glass.addColorStop(0,'#f8ffe447');glass.addColorStop(.6,'#e5f4e42c');glass.addColorStop(1,'#8cae9733');ctx.fillStyle=glass;ctx.fill();ctx.strokeStyle='#4b735d';ctx.lineWidth=5;ctx.stroke();
    ctx.lineWidth=2;ctx.strokeStyle='#789780';
    for(const x of [532,577,621,666,711]){ctx.beginPath();ctx.moveTo(x,337);ctx.lineTo(x,151+Math.abs(x-621)*.43);ctx.stroke();}
    for(const y of [215,273]){ctx.beginPath();ctx.moveTo(489,y);ctx.lineTo(754,y);ctx.stroke();}
    ctx.strokeStyle='#f5ffe585';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(509,228);ctx.lineTo(557,189);ctx.moveTo(684,251);ctx.lineTo(729,215);ctx.stroke();
    ctx.strokeStyle='#54715c';ctx.beginPath();ctx.moveTo(620,120);ctx.lineTo(620,176);ctx.stroke();
    const lamp=ctx.createRadialGradient(620,189,1,620,189,43);lamp.addColorStop(0,'#ffe1a380');lamp.addColorStop(1,'#ffe1a300');ctx.fillStyle=lamp;ctx.fillRect(577,146,86,86);
    roundRect(609,177,22,23,7,'#fff0ba');roundRect(611,174,18,5,2,'#8c8061');
    // Greenery belongs to the setting; community flowers are only drawn from memory.
    const leaf=(x:number,y:number,r:number,angle:number,fill:string)=>{ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(0,0,r,r*.36,0,0,Math.PI*2);ctx.fill();ctx.restore();};
    for(let i=0;i<8;i++){const x=493+i*36;ctx.strokeStyle='#6a936b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,207);ctx.quadraticCurveTo(x-10,228,x+Math.sin(t*.4+i)*3,245+(i%3)*8);ctx.stroke();leaf(x-4,226,8,-.6,'#698c62');leaf(x+4,237,9,.5,'#86a476');}
    // Two planting terraces provide room for up to 24 earned flowers.
    roundRect(466,337,310,28,6,'#967559');roundRect(477,360,288,25,5,'#7a614b');
    for(let row=0;row<2;row++){roundRect(478,321+row*35,286,19,7,'#665440');ctx.fillStyle='#8b795b';for(let i=0;i<22;i++)dot(486+i*12,327+row*35+(i%2)*3,.9,'#a0916d');}
    const n=Math.min(24,blooms.length);
    for(let i=0;i<n;i++){
      const row=i<12?0:1;const col=i%12;const x=490+col*23,y=328+row*35,h=23+(i%3)*6;
      ctx.strokeStyle='#496f4a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.sin(t*.5+i)*2,y-h/2,x,y-h);ctx.stroke();leaf(x+4,y-9,6,-.5,'#6e945e');
      const color=({mint:'#b0e1b6',moon:'#c7a9ec',sunset:'#efb28d'} as Record<string,string>)[blooms[i]]??accent;
      for(let k=0;k<5;k++){const a=k*Math.PI*2/5;dot(x+Math.cos(a)*5,y-h+Math.sin(a)*5,4,color);}dot(x,y-h,2.5,'#ffe3a6');
    }
    if(!n){ctx.textAlign='center';ctx.fillStyle='#375744';ctx.font='600 12px sans-serif';roundRect(534,281,171,24,12,'#edf1dfe8');ctx.fillStyle='#375744';ctx.fillText('Your first bloom starts here',620,297);ctx.textAlign='left';}
    // Community decisions become persistent, visible places, never decorative votes.
    const landmarks=memory.landmarks??[];
    if(landmarks.includes('pond')){
      ctx.fillStyle='#6bada8';ctx.beginPath();ctx.ellipse(798,394,49,13,-.12,0,Math.PI*2);ctx.fill();ellipse(798,394,47,11,-.12,'#d9efdc99');
      for(let i=0;i<3;i++){ctx.strokeStyle='#e3f0dd77';ctx.beginPath();ctx.moveTo(774+i*13,391+i*3);ctx.lineTo(789+i*10,391+i*3);ctx.stroke();}dot(820,390,3,'#e9d3a1');
    }
    if(landmarks.includes('nook')){
      roundRect(785,278,60,13,4,'#9e785c');roundRect(790,291,5,23,2,'#806647');roundRect(835,291,5,23,2,'#806647');
      roundRect(783,257,64,15,5,'#b49771');ctx.fillStyle='#f2e5b7';ctx.beginPath();ctx.moveTo(806,277);ctx.lineTo(806,263);ctx.lineTo(817,268);ctx.lineTo(829,263);ctx.lineTo(829,277);ctx.lineTo(817,281);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#8b9b72';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(817,268);ctx.lineTo(817,281);ctx.stroke();
    }
    if(landmarks.includes('lanterns')){
      for(let i=0;i<4;i++){const x=445+i*12,y=335+i*17;ctx.strokeStyle='#54725b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+23);ctx.lineTo(x,y-7);ctx.lineTo(x+10,y-7);ctx.stroke();const light=ctx.createRadialGradient(x+10,y,1,x+10,y,19);light.addColorStop(0,'#ffdda375');light.addColorStop(1,'#ffdda300');ctx.fillStyle=light;ctx.fillRect(x-9,y-19,38,38);roundRect(x+5,y-5,10,13,3,'#ffebaf');}
    }
    // Copper watering can and a short garden path anchor the scene.
    roundRect(790,326,30,29,7,'#b48662');ctx.strokeStyle='#a77b59';ctx.lineWidth=4;ctx.beginPath();ctx.arc(820,338,11,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.beginPath();ctx.moveTo(791,337);ctx.lineTo(775,326);ctx.lineTo(770,330);ctx.stroke();
    for(let i=0;i<3;i++){ctx.fillStyle='#dedfc4';ctx.beginPath();ctx.ellipse(624+i*7,402+i*11,20+i*4,4+i,0,0,Math.PI*2);ctx.fill();}
    for(let i=0;i<8;i++){const x=439+(i*57)%401,y=252+(i*31)%148+Math.sin(t*.45+i)*3;dot(x,y,1.4,'#fff4c7b0');}
    ctx.restore();ctx.restore();
    ctx.strokeStyle='#b9ccb4';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(74,104,812,330,30);ctx.stroke();
  }
  function reactionBursts(){
    const l=data.lounge;if(!l||l.energy==='quiet'||!l.particles||l.intensity<=0)return;
    const reduce=data.settings?.reducedMotion||stopped;const strength=l.energy==='party'?1:l.energy==='balanced'?.7:.42;
    for(const e of l.effects){
      const age=(Date.now()-e.at)/1000;if(age<0||age>5)continue;
      const alpha=Math.max(0,1-age/5);const seed=e.id.charCodeAt(0)+e.id.charCodeAt(5);const n=Math.floor(6+18*l.intensity*strength);
      ctx.save();ctx.globalAlpha=alpha;
      for(let i=0;i<(reduce?1:n);i++){
        const x=180+(seed*17+i*79)%600+(!reduce?Math.sin(i+age)*age*9:0);const y=reduce?175:480-age*(35+(i%4)*17)-((i*31)%100);
        ctx.fillStyle=e.kind==='hearts'?'#f4b4c0':e.kind==='stars'?'#f8dda2':e.kind==='lanterns'?'#edce9a':['#c9b7ec','#efd2a1','#a9d4be'][i%3];
        ctx.save();ctx.translate(x,y);if(!reduce)ctx.rotate(Math.sin(i)*age*.3);
        if(e.kind==='hearts'){
          ctx.beginPath();ctx.moveTo(0,4);ctx.bezierCurveTo(-15,-5,-8,-16,0,-9);ctx.bezierCurveTo(8,-16,15,-5,0,4);ctx.fill();
        }else if(e.kind==='lanterns'){roundRect(-6,-9,12,17,4,'#f6d6a1c4');dot(0,11,1.5,'#ffdb9e');}
        else if(e.kind==='stars'){ctx.font='18px serif';ctx.textAlign='center';ctx.fillText('✦',0,0);}
        else {ctx.fillRect(-3,-6,6,12);}
        ctx.restore();
      }ctx.restore();
    }
  }
  function frame(now:number){
    if(disposed)return;
    const dt=Math.min((now-last)/1000,.05);last=now;
    if(!data){requestAnimationFrame(frame);return;}
    const {scene,charge,round,settings}=data;
    if(!settings?.reducedMotion&&!stopped&&data.lounge?.energy!=='quiet')t+=dt*(data.lounge?.energy==='gentle'?.65:1);
    ctx.clearRect(0,0,width,height);
    const atmospheric=!data.forceScene&&(data.ambientOnly||data.lounge?.showBackground||data.lounge?.break.status!=='idle');
    if(atmospheric){const fills:Record<string,string>={starlight:'#182738',rain:'#1d3438',aurora:'#193735',sunset:'#573649'};ctx.fillStyle=fills[data.lounge.mood]??'#172b2b';ctx.fillRect(0,0,width,height);}
    if(!data.transparent&&!atmospheric){ctx.fillStyle=scene.kind==='garden'?'#243e34':'#1d3031';ctx.fillRect(0,0,width,height);}
    const scale=Math.min(width/960,height/540);ctx.save();ctx.translate(width/2,height/2);ctx.scale(scale,scale);ctx.translate(-480,-270);
    const accent=colors[scene.accent]||colors.lime;
    const active=round.status==='playing';const percent=Math.min(1,(round.shields||0)/scene.goal);
    if(atmospheric){
      ambientWorld();reactionBursts();ctx.restore();requestAnimationFrame(frame);return;
    }
    if(!data.transparent){
      const bg=ctx.createRadialGradient(480,270,20,480,270,580);bg.addColorStop(0,scene.kind==='garden'?'#38584a':'#273d3f');bg.addColorStop(1,scene.kind==='garden'?'#243e34':'#1d3031');ctx.fillStyle=bg;ctx.fillRect(0,0,960,540);
      ctx.strokeStyle='#ffffff05';for(let x=0;x<960;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,540);ctx.stroke();}for(let y=0;y<540;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(960,y);ctx.stroke();}
    }
    if(scene.kind==='garden'){
      gardenWorld();
    }else{
      missionWorld();
      stars.forEach((s,i)=>dot(s.x*960,s.y*540,s.r,`rgba(220,240,220,${.15+(Math.sin(t*.5+i)+1)*.12})`));
      ellipse(480,265,248,138,-.27,accent+'14');ellipse(480,265,310,195,.28,accent+'0b');
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
      if(scene.kind!=='focus'&&(active||charge>=100||scene.kind==='meteor')){
        const step=settings?.reducedMotion||stopped||data.lounge?.energy==='quiet'?0:dt;
        const gravity=scene.gravity==='low'?4:scene.gravity==='high'?35:14;
        ctx.save();ctx.beginPath();ctx.rect(318,112,552,300);ctx.clip();
        for(let i=0;i<bodies.length;i++){
          const b=bodies[i];b.vy+=gravity*step;b.x+=b.vx*step;b.y+=b.vy*step;
          const dx=b.x-cx,dy=b.y-cy,dist=Math.hypot(dx,dy),shieldRadius=percent>0?114:91;
          if(dist<shieldRadius+b.r&&b.vx*dx+b.vy*dy<0){
            const nx=dx/dist,ny=dy/dist,dotProduct=b.vx*nx+b.vy*ny;
            b.vx-=2*dotProduct*nx;b.vy-=2*dotProduct*ny;b.x=cx+nx*(shieldRadius+b.r+1);b.y=cy+ny*(shieldRadius+b.r+1);impact=.8;
          }
          if(b.y>580||b.x<320||b.x>960){b.x=340+(i*47)%430;b.y=-30-(i%3)*50;b.vx=-12-i*2;b.vy=25+(i%4)*9;}
          ctx.strokeStyle='#ffba7050';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x-b.vx*.3,b.y-b.vy*.3);ctx.lineTo(b.x,b.y);ctx.stroke();dot(b.x,b.y,b.r,'#f7bd83');
        }
        impact=Math.max(0,impact-step*2);
        if(impact>0){ctx.strokeStyle=accent+Math.floor(impact*120).toString(16).padStart(2,'0');ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,percent>0?115:93,0,Math.PI*2);ctx.stroke();}
        ctx.restore();
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
      const timerY=451;
      roundRect(386,timerY,188,42,21,'#0b0f0dd9');ctx.strokeStyle=accent+'30';ctx.stroke();
      ctx.fillStyle=accent;ctx.textAlign='center';ctx.font='600 17px monospace';ctx.fillText(`${Math.floor(left/60000).toString().padStart(2,'0')}:${Math.floor(left%60000/1000).toString().padStart(2,'0')}  ·  ${round.shields}/${scene.goal}`,480,timerY+27);
    }else if(round.status==='ended'){
      ctx.fillStyle=accent;ctx.textAlign='center';ctx.font='600 20px sans-serif';ctx.fillText(round.outcome==='saved'?'A little chaos. A community victory.':scene.kind==='garden'?'A little progress stays with us.':scene.kind==='focus'?'Sprint ended. Take a breath.':'One cracked moon. One very good story.',480,468);
    }
    reactionBursts();ctx.textAlign='left';ctx.restore();requestAnimationFrame(frame);
  }
  if(!canvasOverride)addEventListener('message',e=>{
    if(e.source!==parent)return;
    if(e.data?.type==='popforge:state'&&e.data.payload?.scene){data=e.data.payload;stopped=!!data.previewPaused;}
  });
  let lastTap=0;if(!canvasOverride)addEventListener('click',()=>{if(performance.now()-lastTap<500)return;lastTap=performance.now();parent.postMessage({type:'popforge:tap'},'*');});
  if(!canvasOverride)parent.postMessage({type:'popforge:ready'},'*');requestAnimationFrame(frame);
  return {update:(next:any)=>{data=next;stopped=!!next.previewPaused;},dispose:()=>{disposed=true;removeEventListener('resize',resize);}};
}
export const RENDERER_DOCUMENT=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; frame-src 'none'"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent;color-scheme:normal}canvas{display:block;width:100%;height:100%}</style></head><body><canvas aria-label="Animated community scene"></canvas><script>(${renderScene.toString()})()</script></body></html>`;
