/* Acelden Mini Arcade. Original canvas runner, no third-party game assets. */
(()=>{'use strict';
let cleanup=()=>{};
function mount(){
 cleanup();
 const stage=document.querySelector('#arcade-stage');
 if(!stage)return;
 const canvas=stage.querySelector('canvas'),start=stage.querySelector('.arcade-start'),jumpBtn=stage.querySelector('.arcade-jump'),scoreEl=stage.querySelector('.arcade-score'),message=stage.querySelector('.arcade-message');
 if(!canvas||!start||!scoreEl||!message)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const W=720,H=330,ground=260,player={x:96,y:0,w:37,h:43,vy:0},gravity=1850,jumpVelocity=-690;
 let running=false,over=false,score=0,speed=280,obstacles=[],spawnIn=1,frame=0,raf=0,last=0,visible=true,countdownTimer=0,deathRaf=0,finishTimer=0,phase='idle',deathAt=0,ashes=[];const finale=stage.closest('.contact-finale');
 const rand=(a,b)=>a+Math.random()*(b-a);
 const palettes=[
  {sky:'#b7ff54',ink:'#142b1a',detail:'#699c49',cloud:'#87be55',orb:'#fff9b1',name:'DAY'},
  {sky:'#d9d9d9',ink:'#292929',detail:'#888888',cloud:'#b6b6b6',orb:'#f8f8f8',name:'DAWN'},
  {sky:'#101b12',ink:'#b7ff54',detail:'#416d42',cloud:'#25402a',orb:'#d8ff9e',name:'NIGHT'},
  {sky:'#858f85',ink:'#181f18',detail:'#4e594e',cloud:'#aab5aa',orb:'#f3f4e9',name:'SUNRISE'}
 ];
 const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 const mix=(a,b,t)=>'#'+rgb(a).map((v,i)=>Math.round(v+(rgb(b)[i]-v)*t).toString(16).padStart(2,'0')).join('');
 function world(){
  // Cycle through daylight, monochrome dawn, inverted night and sunrise.
  const segments=[{at:0,p:0},{at:150,p:1},{at:300,p:2},{at:500,p:3},{at:650,p:0}];
  const n=((score%650)+650)%650;
  let i=0;while(i<segments.length-2&&n>=segments[i+1].at)i++;
  const a=segments[i],b=segments[i+1],t=Math.max(0,Math.min(1,(n-a.at)/(b.at-a.at)));
  // Keep each scene legible for a while, then smoothly fade to the next.
  const fade=Math.max(0,Math.min(1,(t-.58)/.38));const x=palettes[a.p],y=palettes[b.p];
  const p={};for(const key of ['sky','ink','detail','cloud','orb'])p[key]=mix(x[key],y[key],fade);
  p.name=fade<.5?x.name:y.name;p.night=a.p===2||b.p===2&&fade>.5;
  return p;
 }
 function hazard(o,ink){
  const y=ground-o.h;
  if(o.type==='bird'){
   const flap=Math.sin(frame*.3+o.x*.02)>0;
   rect(o.x+7,y+9,25,12,ink);rect(o.x+28,y+12,12,5,ink);rect(o.x+2,y+(flap?0:15),16,8,ink);
   rect(o.x+13,y+(flap?3:21),13,8,ink);return;
  }
  if(o.type==='arrow'){
   rect(o.x,y+9,o.w-11,7,ink);
   for(let i=0;i<3;i++){rect(o.x+o.w-15+i*4,y+6-i*4,6,15+i*8,ink)}
   return;
  }
  if(o.type==='spikes'){
   for(let i=0;i<o.w;i+=14){for(let j=0;j<o.h;j+=5){const width=Math.min(13,Math.floor((j+5)*13/o.h));rect(o.x+i+(13-width)/2,ground-j-5,width,5,ink)}}return;
  }
  rect(o.x,y,o.w,o.h,ink);rect(o.x-7,y+15,8,9,ink);rect(o.x+o.w-1,y+23,8,9,ink);
 }
 const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 function character(ink,eye){
  const x=player.x,y=ground-player.h-player.y;
  rect(x+7,y,27,27,ink);rect(x+27,y+7,13,12,ink);rect(x+1,y+19,12,15,ink);rect(x+11,y+27,21,10,'#142b1a');
  rect(x+25,y+7,5,5,eye);rect(x+3,y+28,8,6,'#142b1a');
  const step=player.y>0?0:Math.floor(frame/9)%2;
  rect(x+12,y+36,8,step?6:12,ink);rect(x+26,y+36,8,step?12:6,'#142b1a');
 }
 function draw(){
  const p=world();
  rect(0,0,W,H,p.sky);
  // Pixel sun/moon, horizon and stars follow the world phase.
  const orbX=594,orbY=72,rad=p.night?19:27;
  ctx.fillStyle=p.orb;ctx.beginPath();ctx.arc(orbX,orbY,rad,0,Math.PI*2);ctx.fill();
  if(p.night){ctx.fillStyle=p.sky;ctx.beginPath();ctx.arc(orbX+10,orbY-7,rad*.82,0,Math.PI*2);ctx.fill();
   for(let i=0;i<14;i++)rect(35+(i*127)%W,45+(i*47)%125,3,3,p.orb);
  }else{for(let i=0;i<8;i++){const angle=i*Math.PI/4;rect(orbX+Math.cos(angle)*38-3,orbY+Math.sin(angle)*38-3,7,7,p.orb)}}
  for(let i=0;i<12;i++){let x=(i*101-frame*.22)%(W+100);if(x<0)x+=W+100;rect(x,47+(i%3)*30,24,4,p.cloud);rect(x+8,43+(i%3)*30,8,4,p.cloud)}
  rect(0,ground,W,5,p.ink);
  for(let i=0;i<24;i++){let x=(i*40-frame*(running?speed:0)/24)%W;if(x<0)x+=W;rect(x,ground+18,18,3,p.detail)}
  obstacles.forEach(o=>hazard(o,p.ink));
  if(phase!=='dying')character(p.ink,p.sky);
  if(phase==='dying'){const elapsed=(performance.now()-deathAt)/1000;ashes.forEach(q=>{const age=elapsed*q.rate;ctx.globalAlpha=Math.max(0,1-age/1.4);rect(q.x+q.vx*elapsed,q.y-q.vy*elapsed-25*elapsed*elapsed,q.s,q.s,p.ink)});ctx.globalAlpha=1}
  ctx.fillStyle=p.ink;ctx.font='bold 18px monospace';ctx.textAlign='left';ctx.fillText('ACELDEN RUN',22,29);ctx.textAlign='right';ctx.fillText(String(Math.floor(score)).padStart(5,'0'),W-22,29);
  ctx.textAlign='right';ctx.font='bold 12px monospace';ctx.fillText(p.name+' / LV '+(1+Math.max(0,Math.floor((score-100)/50)+1)),W-20,H-15);
  if(phase==='failed'||phase==='dying'){ctx.fillStyle=p.ink;ctx.textAlign='center';ctx.font='bold 42px monospace';ctx.fillText(phase==='failed'?'FAILED':'',W/2,110);if(phase==='failed'){ctx.font='bold 22px monospace';ctx.fillText('SCORE '+String(Math.floor(score)).padStart(5,'0'),W/2,149)}}
 }
 function setPhase(next){phase=next;stage.dataset.state=next;stage.classList.toggle('is-playing',next==='playing');finale?.classList.toggle('arcade-active',['countdown','playing','dying','failed','closing'].includes(next));}
 function reset(){
  clearInterval(countdownTimer);clearTimeout(finishTimer);cancelAnimationFrame(deathRaf);cancelAnimationFrame(raf);running=false;over=false;score=0;speed=280;obstacles=[];spawnIn=1.15;player.y=0;player.vy=0;frame=0;last=0;scoreEl.textContent='00000';setPhase('countdown');
  let count=3;message.textContent=String(count);draw();
  countdownTimer=setInterval(()=>{if(!stage.isConnected){clearInterval(countdownTimer);return}count--;if(count>0){message.textContent=String(count);return}clearInterval(countdownTimer);message.textContent='';running=true;setPhase('playing');last=0;raf=requestAnimationFrame(tick)},1000);
 }
 function jump(){if(phase!=='playing'||!running)return;if(player.y<=0.01)player.vy=jumpVelocity}
 function endGame(){running=false;over=true;cancelAnimationFrame(raf);deathAt=performance.now();const x=player.x+18,y=ground-player.h-player.y+19;ashes=Array.from({length:34},()=>({x:x+(Math.random()-.5)*28,y:y+(Math.random()-.5)*26,vx:(Math.random()-.5)*125,vy:50+Math.random()*135,s:3+Math.random()*6,rate:.65+Math.random()*.65,c:Math.random()>.35?'#17391e':'#588443'}));setPhase('dying');const animate=()=>{if(phase!=='dying')return;draw();if(performance.now()-deathAt<1350)deathRaf=requestAnimationFrame(animate);else{setPhase('failed');draw();finishTimer=setTimeout(()=>{setPhase('closing');finishTimer=setTimeout(()=>{setPhase('over');start.querySelector('strong').textContent='PLAY AGAIN';start.querySelector('small').textContent='SCORE '+Math.floor(score);draw()},1050)},1350)}};animate()}
 function tick(now){
  if(!running)return;
  if(!last)last=now;
  const dt=Math.min((now-last)/1000,.035);last=now;frame++;
  score+=dt*14;
  // First increase at 100, then another increase for each additional 50 points.
  const tier=score<100?0:1+Math.floor((score-100)/50);
  speed=Math.min(880,280+tier*40);
  player.vy+=gravity*dt;player.y-=player.vy*dt;
  if(player.y<0){player.y=0;player.vy=0}
  spawnIn-=dt;
  if(spawnIn<=0){
   const options=['cactus','cactus','spikes'];
   if(score>=100)options.push('bird');
   if(score>=150)options.push('arrow');
   if(score>=250)options.push('bird','arrow','spikes');
   const type=options[Math.floor(Math.random()*options.length)];
   let h,w;
   if(type==='bird'){h=rand(76,116);w=40}
   else if(type==='arrow'){h=rand(65,100);w=48}
   else if(type==='spikes'){h=rand(24,34);w=rand(29,49)}
   else{h=rand(33,63);w=rand(18,29)}
   obstacles.push({x:W+20,w,h,type});
   // Keep gaps traversable as speed increases.
   spawnIn=rand(1.05,1.6)*280/speed+Math.max(0,(speed-280)/speed)*.35;
  }
  obstacles.forEach(o=>o.x-=speed*dt);obstacles=obstacles.filter(o=>o.x+o.w>0);
  const py=ground-player.h-player.y;
  if(obstacles.some(o=>{const oy=ground-o.h;const top=o.type==='bird'?oy+4:o.type==='arrow'?oy+4:oy;const bottom=o.type==='bird'?oy+29:o.type==='arrow'?oy+26:ground;return player.x+player.w-7>o.x&&player.x+7<o.x+o.w&&py+player.h-5>top&&py+5<bottom})){endGame();return}
  scoreEl.textContent=String(Math.floor(score)).padStart(5,'0');draw();raf=requestAnimationFrame(tick);
 }
 const onStart=()=>reset(),onJump=()=>jump(),onCanvas=e=>{e.preventDefault();jump()},onKey=e=>{if(!stage.isConnected||!visible)return;if(['Space','ArrowUp'].includes(e.code)&&!e.repeat&&!(e.target instanceof HTMLElement&&e.target.closest('input,textarea,select,[contenteditable=true]'))){if(phase==='playing'){if(e.code==='Space')e.preventDefault();jump()}}};
 const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;if(!visible&&(running||phase==='countdown')){running=false;clearInterval(countdownTimer);cancelAnimationFrame(raf);setPhase('idle');message.textContent='PRESS START TO PLAY';start.querySelector('strong').textContent='PRESS START';start.querySelector('small').textContent='PLAYER 02 READY'}},{threshold:0});
 start.addEventListener('click',onStart);canvas.addEventListener('pointerdown',onCanvas);window.addEventListener('keydown',onKey);observer.observe(stage);draw();
 cleanup=()=>{running=false;clearInterval(countdownTimer);clearTimeout(finishTimer);cancelAnimationFrame(deathRaf);setPhase('idle');cancelAnimationFrame(raf);observer.disconnect();start.removeEventListener('click',onStart);canvas.removeEventListener('pointerdown',onCanvas);window.removeEventListener('keydown',onKey)};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
document.addEventListener('acelden:page-ready',mount);
})();
