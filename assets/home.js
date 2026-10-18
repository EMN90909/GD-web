/* Scoped, low-overhead interactions for the Wix-reference-inspired homepage. */
let unmount=()=>{};
const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
const ease=n=>1-Math.pow(1-clamp(n),3);
export function mountHome(){
 unmount();
 const home=document.querySelector('.studio-home');
 if(!home)return;
 const clean=[];
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
  sticky.style.setProperty('--sh-word',String(ease((p-.43)/.32)));
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
