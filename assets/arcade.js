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
 const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 function character(){
  const x=player.x,y=ground-player.h-player.y;
  rect(x+7,y,27,27,'#142b1a');rect(x+27,y+7,13,12,'#142b1a');rect(x+1,y+19,12,15,'#142b1a');rect(x+11,y+27,21,10,'#142b1a');
  rect(x+25,y+7,5,5,'#b7ff54');rect(x+3,y+28,8,6,'#142b1a');
  const step=player.y>0?0:Math.floor(frame/9)%2;
  rect(x+12,y+36,8,step?6:12,'#142b1a');rect(x+26,y+36,8,step?12:6,'#142b1a');
 }
 function draw(){
  rect(0,0,W,H,'#b7ff54');
  for(let i=0;i<12;i++){let x=(i*101-frame*.22)% (W+100);if(x<0)x+=W+100;rect(x,47+(i%3)*30,24,4,'#87be55');rect(x+8,43+(i%3)*30,8,4,'#87be55')}
  rect(0,ground,W,5,'#193c1e');
  for(let i=0;i<24;i++){let x=(i*40-frame*(running?speed:0)/24)%W;if(x<0)x+=W;rect(x,ground+18,18,3,'#699c49')}
  obstacles.forEach(o=>{rect(o.x,ground-o.h,o.w,o.h,'#17391e');rect(o.x-7,ground-o.h+15,8,9,'#17391e');rect(o.x+o.w-1,ground-o.h+23,8,9,'#17391e')});
  if(phase!=='dying')character();
  if(phase==='dying'){const elapsed=(performance.now()-deathAt)/1000;ashes.forEach(p=>{const age=elapsed*p.rate;ctx.globalAlpha=Math.max(0,1-age/1.4);rect(p.x+p.vx*elapsed,p.y-p.vy*elapsed-25*elapsed*elapsed,p.s,p.s,p.c)});ctx.globalAlpha=1;}
  ctx.fillStyle='#17391e';ctx.font='bold 18px monospace';ctx.textAlign='left';ctx.fillText('ACELDEN RUN',22,29);ctx.textAlign='right';ctx.fillText(String(Math.floor(score)).padStart(5,'0'),W-22,29);
  if(phase==='failed'||phase==='dying'){ctx.fillStyle='#142b1a';ctx.textAlign='center';ctx.font='bold 42px monospace';ctx.fillText(phase==='failed'?'FAILED':'',W/2,110);if(phase==='failed'){ctx.font='bold 22px monospace';ctx.fillText('SCORE '+String(Math.floor(score)).padStart(5,'0'),W/2,149)}}
 }
 function setPhase(next){phase=next;stage.dataset.state=next;stage.classList.toggle('is-playing',next==='playing');finale?.classList.toggle('arcade-active',['countdown','playing','dying','failed','closing'].includes(next));}
 function reset(){
  clearInterval(countdownTimer);clearTimeout(finishTimer);cancelAnimationFrame(deathRaf);cancelAnimationFrame(raf);running=false;over=false;score=0;speed=280;obstacles=[];spawnIn=1.15;player.y=0;player.vy=0;frame=0;last=0;scoreEl.textContent='00000';setPhase('countdown');
  let count=3;message.textContent=String(count);draw();
  countdownTimer=setInterval(()=>{if(!stage.isConnected){clearInterval(countdownTimer);return}count--;if(count>0){message.textContent=String(count);return}clearInterval(countdownTimer);message.textContent='';running=true;setPhase('playing');last=0;raf=requestAnimationFrame(tick)},1000);
 }
 function jump(){if(phase!=='playing'||!running)return;if(player.y<=0.01)player.vy=jumpVelocity}
 function endGame(){running=false;over=true;cancelAnimationFrame(raf);deathAt=performance.now();const x=player.x+18,y=ground-player.h-player.y+19;ashes=Array.from({length:34},()=>({x:x+(Math.random()-.5)*28,y:y+(Math.random()-.5)*26,vx:(Math.random()-.5)*125,vy:50+Math.random()*135,s:3+Math.random()*6,rate:.65+Math.random()*.65,c:Math.random()>.35?'#17391e':'#588443'}));setPhase('dying');const animate=()=>{if(phase!=='dying')return;draw();if(performance.now()-deathAt<1350)deathRaf=requestAnimationFrame(animate);else{setPhase('failed');draw();finishTimer=setTimeout(()=>{setPhase('closing');finishTimer=setTimeout(()=>{setPhase('over');start.querySelector('strong').textContent='PLAY AGAIN';start.querySelector('small').textContent='SCORE '+Math.floor(score);draw()},1050)},1350)}};animate()}
 function tick(now){if(!running)return;if(!last)last=now;const dt=Math.min((now-last)/1000,.035);last=now;frame++;score+=dt*14;speed=Math.min(520,280+score*.42);player.vy+=gravity*dt;player.y-=player.vy*dt;if(player.y<0){player.y=0;player.vy=0}
  spawnIn-=dt;if(spawnIn<=0){const h=rand(33,63);obstacles.push({x:W+10,w:rand(18,29),h});spawnIn=rand(.95,1.55)*280/speed}
  obstacles.forEach(o=>o.x-=speed*dt);obstacles=obstacles.filter(o=>o.x+o.w>0);
  if(obstacles.some(o=>player.x+player.w-7>o.x&&player.x+7<o.x+o.w&&player.y<o.h-8)){endGame();return}
  scoreEl.textContent=String(Math.floor(score)).padStart(5,'0');draw();raf=requestAnimationFrame(tick)
 }
 const onStart=()=>reset(),onJump=()=>jump(),onCanvas=e=>{e.preventDefault();jump()},onKey=e=>{if(!stage.isConnected||!visible)return;if(['Space','ArrowUp'].includes(e.code)&&!e.repeat&&!(e.target instanceof HTMLElement&&e.target.closest('input,textarea,select,[contenteditable=true]'))){if(phase==='playing'){if(e.code==='Space')e.preventDefault();jump()}}};
 const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;if(!visible&&(running||phase==='countdown')){running=false;clearInterval(countdownTimer);cancelAnimationFrame(raf);setPhase('idle');message.textContent='PRESS START TO PLAY';start.querySelector('strong').textContent='PRESS START';start.querySelector('small').textContent='PLAYER 02 READY'}},{threshold:0});
 start.addEventListener('click',onStart);canvas.addEventListener('pointerdown',onCanvas);window.addEventListener('keydown',onKey);observer.observe(stage);draw();
 cleanup=()=>{running=false;clearInterval(countdownTimer);clearTimeout(finishTimer);cancelAnimationFrame(deathRaf);setPhase('idle');cancelAnimationFrame(raf);observer.disconnect();start.removeEventListener('click',onStart);canvas.removeEventListener('pointerdown',onCanvas);window.removeEventListener('keydown',onKey)};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
document.addEventListener('acelden:page-ready',mount);
})();
