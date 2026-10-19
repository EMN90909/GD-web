// Static-host-friendly client-side navigation. Hash routes work without rewrite rules.
(()=>{const routes={'/':'index.html','/about':'about.html','/team':'team.html','/contact':'contact.html','/privacy':'privacy.html','/work':'projects.html','/projects':'projects.html','/services':'services.html'};let generation=0;let dispose=()=>{};const pageCache=new Map();function path(){const h=location.hash;return h.startsWith('#/')?h.slice(1).split('?')[0]:'/'}function convertLinks(){document.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href');if(h==='index.html')a.setAttribute('href','#/');else if(h==='team.html')a.setAttribute('href','#/team');else if(h==='contact.html')a.setAttribute('href','#/contact');else if(h==='about.html'||h==='index.html#about')a.setAttribute('href','#/about');else if(h==='index.html#work'||h==='projects.html')a.setAttribute('href','#/projects');else if(h==='index.html#services')a.setAttribute('href','#/services')})}async function route(){const p=path(),file=routes[p]||'index.html';const id=++generation;dispose();dispose=()=>{};document.body.classList.add('route-transition');try{if(!pageCache.has(file)){const response=await fetch(file);if(!response.ok)throw Error('Page '+response.status);pageCache.set(file,new DOMParser().parseFromString(await response.text(),'text/html'))}if(id!==generation)return;const doc=pageCache.get(file);document.querySelector('main')?.replaceWith(doc.querySelector('main').cloneNode(true));document.title=doc.title;convertLinks();const menu=document.querySelector('.links');menu?.classList.remove('open');document.querySelector('.menu')?.setAttribute('aria-expanded','false');initPage();const anchor=null;if(anchor)document.getElementById(anchor)?.scrollIntoView({behavior:'instant'});else window.scrollTo({top:0,behavior:'instant'});requestAnimationFrame(()=>document.body.classList.remove('route-transition'))}catch(e){document.body.classList.remove('route-transition');console.error('Navigation failed',e);if(file!=='index.html')location.href=file}}function initPage(){const clean=[];document.querySelectorAll('.reveal').forEach(el=>el.classList.remove('in'));if('IntersectionObserver'in window){const ob=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');ob.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>ob.observe(el));clean.push(()=>ob.disconnect())}else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());const scene=document.querySelector('.ink-scene');if(scene){if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver'in window))scene.classList.add('ink-active');else{const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){scene.classList.add('ink-active');io.disconnect()}},{threshold:.2});io.observe(scene);clean.push(()=>io.disconnect())}}const stack=document.querySelector('.founder-stack');if(stack){const sections=[...stack.querySelectorAll('.founder-section')];const disposers=[];sections.forEach(section=>{const target=section.querySelector('.founder-visual');const show=()=>{section.classList.add('is-revealed');target.setAttribute('aria-expanded','true')};const hide=()=>{section.classList.remove('is-revealed');target.setAttribute('aria-expanded','false')};const enter=()=>{if(matchMedia('(hover:hover) and (pointer:fine)').matches)show()};const leave=()=>{if(matchMedia('(hover:hover) and (pointer:fine)').matches)hide()};const toggle=()=>section.classList.contains('is-revealed')?hide():show();const key=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}};target.addEventListener('pointerenter',enter);target.addEventListener('pointerleave',leave);target.addEventListener('click',toggle);target.addEventListener('keydown',key);disposers.push(()=>{target.removeEventListener('pointerenter',enter);target.removeEventListener('pointerleave',leave);target.removeEventListener('click',toggle);target.removeEventListener('keydown',key)})});const outside=e=>{if(!e.target.closest('.founder-visual'))sections.forEach(s=>{s.classList.remove('is-revealed');s.querySelector('.founder-visual').setAttribute('aria-expanded','false')})};document.addEventListener('pointerdown',outside);disposers.push(()=>document.removeEventListener('pointerdown',outside));clean.push(()=>disposers.forEach(fn=>fn()))}dispose=()=>clean.forEach(fn=>fn());document.dispatchEvent(new CustomEvent('acelden:page-ready'))}document.querySelector('.menu')?.addEventListener('click',e=>{const n=document.querySelector('.links'),open=n.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open))});// Every navigation swaps <main> but retains the current document <head>.
// Home can therefore be entered from a secondary URL with neither homepage
// stylesheet present. Load both before mounting the carousel/hero JS.
const homeStyleLoads = new Map();
function ensureHomeStylesheet(href) {
 if(homeStyleLoads.has(href)) return homeStyleLoads.get(href);
 const existing = [...document.querySelectorAll('link[rel="stylesheet"]')]
   .find(link => link.getAttribute('href') === href);
 if(existing) {
   const ready = Promise.resolve(true);
   homeStyleLoads.set(href, ready);
   return ready;
 }
 const promise = new Promise(resolve => {
   const link = document.createElement('link');
   link.rel = 'stylesheet';
   link.href = href;
   link.onload = () => resolve(true);
   link.onerror = () => { console.warn('Failed to load Acelden stylesheet:', href); resolve(false); };
   document.head.appendChild(link);
 });
 homeStyleLoads.set(href, promise);
 return promise;
}
let homeNavigationToken = 0;
document.addEventListener('acelden:page-ready', () => {
 const token = ++homeNavigationToken;
 const home = document.querySelector('.studio-home');
 if(!home) { window.__aceldenHomeCleanup?.(); return; }
 Promise.all([
   ensureHomeStylesheet('assets/home.css'),
   ensureHomeStylesheet('assets/orbit.css')
 ]).then(styles => {
   // A slow connection must not mount Home effects on a different route.
   if(!styles.every(Boolean) || token !== homeNavigationToken ||
      document.querySelector('.studio-home') !== home) return null;
   return import('./home.js');
 }).then(module => {
   if(module && token === homeNavigationToken &&
      document.querySelector('.studio-home') === home) module.mountHome();
 }).catch(error => console.error('Homepage animation failed:', error));
});
/* React Spring runs only on secondary routes. It is optional and never
   blocks normal site navigation if the CDN is unavailable. */
let springNavigationToken = 0;
document.addEventListener('acelden:page-ready', () => {
 const token = ++springNavigationToken;
 window.__aceldenSpringUnmount?.();
 if (document.querySelector('.studio-home') ||
     matchMedia('(prefers-reduced-motion: reduce)').matches) return;
 // Do not load React or React Spring on static legal/auxiliary pages without
 // any enhanced surfaces. The rest of the website stays dependency-free.
 if (!document.querySelector('.about-media,.about-chapter .pill,.about-text-link,.founder-frame,.engine-showcase-art,.projects-roadmap .service,.projects-copy .pill,.services-page .service,.services-outro .pill,.contact-form-motion,.value-grid article,.editorial-art,.page-section .btn,.page-hero .btn,.privacy-end a')) return;
 if (!document.querySelector('link[data-acelden-spring]')) {
   const sheet = document.createElement('link');
   sheet.rel = 'stylesheet';
   sheet.href = 'assets/page-spring.css';
   sheet.setAttribute('data-acelden-spring', '');
   document.head.appendChild(sheet);
 }
 import('./page-spring.js').then(mod => {
   if (token !== springNavigationToken || document.querySelector('.studio-home')) return;
   mod.mountPageSpring();
 }).catch(error => console.warn('Optional React Spring enhancements unavailable:', error));
});
convertLinks();initPage();window.addEventListener('hashchange',route);if(location.hash.startsWith('#/'))route()})();