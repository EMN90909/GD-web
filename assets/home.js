/* Scoped, low-overhead interactions for the Wix-reference-inspired homepage. */
let unmount=()=>{};
const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
const ease=n=>1-Math.pow(1-clamp(n),3);
export function mountHome(){
 unmount();
 const home=document.querySelector('.studio-home');
 if(!home)return;
 home.classList.add('sh-animated');
 const clean=[];
 const orbit=home.querySelector('.sh-service-sequence');
 const orbitCards=orbit?[...orbit.querySelectorAll('[data-orbit-card]')]:[];
 const orbitStage=orbit?.querySelector('.sh-ring-stage');
 const orbitProgress=orbit?.querySelector('.sh-orbit-progress');
 const orbitMeter=orbitProgress?.querySelector('span');
 const orbitCount=orbit?.querySelector('.sh-orbit-count');
 const orbitRing=orbit?.querySelector('.sh-ring-track');
 let orbitActive=-1;
 if(orbitCards.length>1&&!prefersReduced.matches)orbit.classList.add('sh-orbit-ready');
 function updateOrbit(){
  if(!orbit?.classList.contains('sh-orbit-ready')||!orbitStage)return;
  const bounds=orbit.getBoundingClientRect();
  const travel=Math.max(1,bounds.height-window.innerHeight);
  const progress=clamp(-bounds.top/travel);
  const position=progress*(orbitCards.length-1);
  const focus=Math.min(orbitCards.length-1,Math.max(0,Math.round(position)));
  const radiusX=Math.min(orbitStage.clientWidth*(window.innerWidth<761?.30:.29),365);
  const radiusY=Math.min(orbitStage.clientHeight*(window.innerWidth<761?.27:.28),155);
  orbitCards.forEach((card,i)=>{
   const theta=(i-position)*(2*Math.PI/orbitCards.length);
   const front=Math.cos(theta);
   const depth=(front+1)/2;
   const x=Math.sin(theta)*radiusX;
   const y=-front*radiusY;
   const scale=.69+depth*.31;
   card.style.transform='translate3d(calc(-50% + '+x.toFixed(1)+'px),calc(-50% + '+y.toFixed(1)+'px),0) scale('+scale.toFixed(3)+')';
   card.style.opacity=(.39+depth*.61).toFixed(3);
   card.style.zIndex=String(Math.round(depth*50)+1);
  });
  orbitRing?.style.setProperty('--orbit-rotation',(-position*360/orbitCards.length).toFixed(1)+'deg');
  orbitMeter?.style.setProperty('transform','scaleX('+(1+position)/(orbitCards.length)+')');
  if(focus!==orbitActive){
   orbitActive=focus;
   orbitCards.forEach((card,i)=>card.setAttribute('aria-pressed',String(i===focus)));
   if(orbitCount)orbitCount.textContent=String(focus+1).padStart(2,'0')+' / '+String(orbitCards.length).padStart(2,'0');
   orbitProgress?.setAttribute('aria-valuenow',String(focus+1));
  }
 }
 if(orbitCards.length>1&&!prefersReduced.matches){
  const buttons=orbitCards.map((card,i)=>{
   const click=()=>{
    const sectionTop=orbit.getBoundingClientRect().top+window.scrollY;
    const range=Math.max(0,orbit.offsetHeight-window.innerHeight);
    window.scrollTo({top:sectionTop+(i/(orbitCards.length-1))*range,behavior:'smooth'});
   };
   card.addEventListener('click',click);
   return ()=>card.removeEventListener('click',click);
  });
  clean.push(...buttons);
 }
 
 const hero=home.querySelector('.sh-hero');
 const sticky=home.querySelector('.sh-hero-sticky');
 const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let raf=0;
 function update(){
  raf=0;
  if(!hero?.isConnected||prefersReduced.matches)return;
  const rect=hero.getBoundingClientRect();
  const travel=Math.max(1,rect.height-window.innerHeight);
  const p=clamp(-rect.top/travel);
  sticky.style.setProperty('--sh-main',String(ease(p/.39)));
  sticky.style.setProperty('--sh-left',String(ease((p-.12)/.38)));
  sticky.style.setProperty('--sh-right',String(ease((p-.21)/.36)));
  // The name is visible on arrival; scrolling moves it only along Y.
  // Fade starts before the rising wordmark can obscure the main heading.
  const wordProgress=clamp(p/.78);
  const wordRise=Math.round(wordProgress*Math.min(window.innerHeight*.72,700));
  const wordOpacity=1-ease((p-.18)/.46);
  sticky.style.setProperty('--sh-word-rise',wordRise+'px');
  sticky.style.setProperty('--sh-word-opacity',String(wordOpacity));
  updateOrbit();
 }
 const schedule=()=>{if(!raf)raf=window.requestAnimationFrame(update)};
 if(!prefersReduced.matches){
   window.addEventListener('scroll',schedule,{passive:true});
   window.addEventListener('resize',schedule,{passive:true});
   clean.push(()=>{window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);window.cancelAnimationFrame(raf)});
   update();
 }
 const reveals=home.querySelectorAll('.sh-reveal');
 if('IntersectionObserver' in window && !prefersReduced.matches){
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('sh-in');observer.unobserve(entry.target)}})},{threshold:.1,rootMargin:'0px 0px -25px 0px'});
  reveals.forEach(el=>observer.observe(el));
  clean.push(()=>observer.disconnect());
 }else reveals.forEach(el=>el.classList.add('sh-in'));
 const quotes=[
  ['“We build places to play, systems to explore, and ideas worth remembering.”','THE ACELDEN MINDSET / 01'],
  ['“Start with something people want to play. Build the next world from there.”','THE ACELDEN MINDSET / 02']
 ];
 let active=0;
 const quoteEl=home.querySelector('[data-sh-quote]'),source=home.querySelector('[data-sh-quote-source]'),count=home.querySelector('[data-sh-count]');
 const show=i=>{active=(i+quotes.length)%quotes.length;if(quoteEl)quoteEl.textContent=quotes[active][0];if(source)source.textContent=quotes[active][1];if(count)count.textContent=String(active+1).padStart(2,'0')+' / 02'};
 const prev=home.querySelector('[data-sh-prev]'),next=home.querySelector('[data-sh-next]');
 const goPrev=()=>show(active-1),goNext=()=>show(active+1);
 prev?.addEventListener('click',goPrev);
 next?.addEventListener('click',goNext);
 clean.push(()=>{prev?.removeEventListener('click',goPrev);next?.removeEventListener('click',goNext)});
 unmount=()=>{clean.forEach(fn=>fn());unmount=()=>{}};
 window.__aceldenHomeCleanup=unmount;
}
export function unmountHome(){unmount();window.__aceldenHomeCleanup=null}
