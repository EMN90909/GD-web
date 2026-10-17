/* Acelden Mini Arcade. Original canvas runner, no third-party game assets. */
(()=>{'use strict';
let cleanup=()=>{};
function mount(){
 cleanup();
 const stage=document.querySelector('#arcade-stage');
 if(!stage)return;
 const canvas=stage.querySelector('canvas'),ctx=canvas.getContext('2d'),start=stage.querySelector('.arcade-start'),jumpBtn=stage.querySelector('.arcade-jump'),scoreEl=stage.querySelector('.arcade-score'),message=stage.querySelector('.arcade-message');
 if(!ctx)return;
 const W=720,H=330,ground=260,player={x:96,y:0,w:37,h:43,vy:0},gravity=1850,jumpVelocity=-690;
 let running=false,over=false,score=0,speed=280,obstacles=[],spawnIn=1,frame=0,raf=0,last=0,visible=true;
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
  character();
  ctx.fillStyle='#17391e';ctx.font='bold 18px monospace';ctx.textAlign='left';ctx.fillText('ACELDEN RUN',22,29);ctx.textAlign='right';ctx.fillText(String(Math.floor(score)).padStart(5,'0'),W-22,29);
  if(over){rect(0,0,W,H,'#b7ff5477');ctx.fillStyle='#142b1a';ctx.textAlign='center';ctx.font='bold 34px monospace';ctx.fillText('GAME OVER',W/2,115);ctx.font='bold 17px monospace';ctx.fillText('PRESS START TO RETRY',W/2,150)}
 }
 function reset(){running=true;over=false;score=0;speed=280;obstacles=[];spawnIn=1.15;player.y=0;player.vy=0;frame=0;last=0;stage.classList.add('is-playing');start.querySelector('strong').textContent='RESTART';start.querySelector('small').textContent='PLAY AGAIN';message.textContent='';scoreEl.textContent='00000';cancelAnimationFrame(raf);raf=requestAnimationFrame(tick)}
 function jump(){if(!running){reset();return}if(player.y<=0.01){player.vy=jumpVelocity}}
 function tick(now){if(!running)return;if(!last)last=now;const dt=Math.min((now-last)/1000,.035);last=now;frame++;score+=dt*14;speed=Math.min(520,280+score*.42);player.vy+=gravity*dt;player.y-=player.vy*dt;if(player.y<0){player.y=0;player.vy=0}
  spawnIn-=dt;if(spawnIn<=0){const h=rand(33,63);obstacles.push({x:W+10,w:rand(18,29),h});spawnIn=rand(.95,1.55)*280/speed}
  obstacles.forEach(o=>o.x-=speed*dt);obstacles=obstacles.filter(o=>o.x+o.w>0);
  if(obstacles.some(o=>player.x+player.w-7>o.x&&player.x+7<o.x+o.w&&player.y<o.h-8)){running=false;over=true;stage.classList.remove('is-playing');start.querySelector('strong').textContent='TRY AGAIN';start.querySelector('small').textContent='SCORE '+Math.floor(score);draw();return}
  scoreEl.textContent=String(Math.floor(score)).padStart(5,'0');draw();raf=requestAnimationFrame(tick)
 }
 const onStart=()=>reset(),onJump=()=>jump(),onCanvas=()=>jump(),onKey=e=>{if(!stage.isConnected||!visible)return;if(['Space','ArrowUp'].includes(e.code)&&!e.repeat&&!(e.target instanceof HTMLElement&&e.target.closest('input,textarea,select,[contenteditable=true]'))){if(running||document.activeElement===start||document.activeElement===jumpBtn){e.preventDefault();jump()}}};
 const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;if(!visible&&running){running=false;stage.classList.remove('is-playing');start.querySelector('strong').textContent='RESUME';start.querySelector('small').textContent='PRESS TO PLAY';cancelAnimationFrame(raf)}},{threshold:0});
 start.addEventListener('click',onStart);jumpBtn.addEventListener('click',onJump);canvas.addEventListener('pointerdown',onCanvas);window.addEventListener('keydown',onKey);observer.observe(stage);draw();
 cleanup=()=>{running=false;cancelAnimationFrame(raf);observer.disconnect();start.removeEventListener('click',onStart);jumpBtn.removeEventListener('click',onJump);canvas.removeEventListener('pointerdown',onCanvas);window.removeEventListener('keydown',onKey)};
}
document.addEventListener('DOMContentLoaded',mount);
window.addEventListener('hashchange',()=>setTimeout(mount,80));
})();
