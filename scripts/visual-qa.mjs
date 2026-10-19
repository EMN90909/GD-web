import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const ORIGIN='http://127.0.0.1:8765';
await mkdir('artifacts/ui-qa', {recursive:true});
const screenshots=[];
const errors=[];
let failures=0;
const browser=await chromium.launch({headless:true, args:['--no-sandbox']});

async function check(label, fn){
 try {await fn();console.log('PASS '+label)}
 catch(error){failures++;console.error('FAIL '+label+' :: '+(error?.stack||error))}
}
function attachErrors(page,label){
 page.on('pageerror', e=>errors.push(label+' pageerror: '+e.message));
 page.on('console', e=>{if(e.type()==='error') errors.push(label+' console: '+e.text())});
}
async function makePage(name,viewport,reducedMotion='no-preference'){
 const page=await browser.newPage({viewport,reducedMotion,deviceScaleFactor:1});
 attachErrors(page,name);
 await page.goto(ORIGIN+'/',{waitUntil:'load',timeout:30000});
 await page.evaluate(()=>document.fonts.ready);
 return page;
}
async function shot(page,name){
 const dest='artifacts/ui-qa/'+name+'.png';
 await page.screenshot({path:dest,fullPage:false,animations:'disabled'});
 screenshots.push(dest);
}
async function orbitCheck(page,viewName){
 const section=page.locator('#home-services');
 assert.equal(await section.count(),1);
 assert.equal(await page.locator('[data-orbit-card]').count(),4);
 const ready=await section.evaluate(e=>e.classList.contains('sh-orbit-ready'));
 assert.equal(ready,true,'carousel must pin for motion-enabled users');
 const bounds=await section.evaluate(e=>({top:e.getBoundingClientRect().top+scrollY,height:e.offsetHeight,view:innerHeight}));
 const range=Math.max(1,bounds.height-bounds.view);
 for(const [fraction,index] of [[0,1],[.34,2],[.68,3],[1,4]]){
  await page.evaluate(y=>scrollTo(0,y),bounds.top+range*fraction);
  await page.waitForTimeout(150);
  const now=Number(await page.locator('.sh-orbit-progress').getAttribute('aria-valuenow'));
  assert.equal(now,index,'orbit progress should match scroll position');
  assert.equal(await page.locator('.sh-orbit-card[aria-pressed="true"]').count(),1);
  if(fraction===.34) await shot(page,viewName+'-orbit');
  if(fraction===.68){
   const top=await page.locator('.sh-orbit-pin').evaluate(e=>e.getBoundingClientRect().top);
   assert(Math.abs(top)<=3, 'orbit should remain pinned during rotation: top='+top);
  }
 }
 await page.evaluate(y=>scrollTo(0,y),bounds.top+range+window.innerHeight*.5);
 await page.waitForTimeout(150);
 const portfolio=await page.locator('.sh-portfolio').evaluate(e=>e.getBoundingClientRect());
 assert(portfolio.top<window.innerHeight,'portfolio must appear after orbit releases');
 await shot(page,viewName+'-portfolio');
 // Pointer and keyboard interaction without scroll interception
 await page.evaluate(y=>scrollTo(0,y),bounds.top+range*.4);
 await page.waitForTimeout(100);
 await page.locator('[data-orbit-card="3"]').click({force:true});
 await page.waitForFunction(()=>document.querySelector('.sh-orbit-progress')?.getAttribute('aria-valuenow')==='4',null,{timeout:3500});
 const count=await page.locator('.sh-orbit-progress').getAttribute('aria-valuenow');
 assert.equal(count,'4','click should select the requested card');
}
for(const [name,viewport] of [
 ['desktop-wide',{width:1440,height:900}],
 ['desktop-laptop',{width:1366,height:768}],
 ['mobile',{width:390,height:844}],
 ['mobile-small',{width:360,height:740}],
]){
 const page=await makePage(name,viewport);
 await check(name+' hero and viewport',async()=>{
  const mark=page.locator('.sh-giant-mark');
  assert.equal(await mark.count(),1);
  const r=await mark.boundingBox();
  assert(r&&r.width>0,'wordmark visible');
  assert(r.x>=-5&&r.x+r.width<=viewport.width+5,'wordmark should fit '+JSON.stringify(r));
  assert(r.y>=-5&&r.y<viewport.height,'wordmark should start in viewport');
  const rootOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+6);
  assert(!rootOverflow,'unexpected page horizontal overflow');
  await shot(page,name+'-hero');
 });
 await check(name+' scroll carousel',()=>orbitCheck(page,name));
 await page.close();
}
const page=await makePage('secondary-pages',{width:1366,height:768});
await check('React Spring on About page',async()=>{
 await page.goto(ORIGIN+'/#/about',{waitUntil:'load',timeout:30000});
 await page.locator('.about-media').first().waitFor();
 await page.waitForFunction(()=>!!document.querySelector('.about-media.acelden-spring-surface'),{timeout:20000});
 const media=page.locator('.about-media').first();
 await media.scrollIntoViewIfNeeded();
 await media.hover();
 await page.waitForTimeout(350);
 const transform=await media.evaluate(e=>e.style.transform);
 assert(transform.includes('translate3d'),'hover should add spring transform');
 await shot(page,'about-spring');
});
await check('Founder reveal and spring compatibility',async()=>{
 await page.goto(ORIGIN+'/#/team',{waitUntil:'load'});
 await page.locator('.founder-frame').first().waitFor();
 await page.waitForFunction(()=>!!document.querySelector('.founder-frame.acelden-spring-surface'),{timeout:20000});
 const portrait=page.locator('.founder-visual').first();
 await portrait.scrollIntoViewIfNeeded();
 await portrait.click();
 assert.equal(await portrait.getAttribute('aria-expanded'),'true');
 await shot(page,'founder-spring');
});
await check('Project cards receive spring motion',async()=>{
 await page.goto(ORIGIN+'/#/projects',{waitUntil:'load'});
 await page.locator('.engine-showcase-art').first().waitFor();
 await page.waitForFunction(()=>!!document.querySelector('.engine-showcase-art.acelden-spring-surface'),{timeout:20000});
});
await check('Normal navigation to services and contact',async()=>{
 await page.goto(ORIGIN+'/#/services',{waitUntil:'load'});
 await page.locator('.services-page .service').first().waitFor();
 await page.waitForFunction(()=>!!document.querySelector('.services-page .service.acelden-spring-surface'),{timeout:20000});
 await page.goto(ORIGIN+'/#/contact',{waitUntil:'load'});
 await page.locator('.contact-form-motion').waitFor();
 await page.waitForFunction(()=>!!document.querySelector('.contact-form-motion.acelden-spring-surface'),{timeout:20000});
});
await page.close();
const fromAbout = await makePage('from-about',{width:1366,height:768});
await check('Secondary entry route loads carousel CSS when returning Home',async()=>{
 await fromAbout.goto(ORIGIN+'/about.html',{waitUntil:'load'});
 await fromAbout.locator('.nav .logo').click();
 await fromAbout.locator('#home-services.sh-orbit-ready').waitFor({timeout:20000});
 await fromAbout.waitForFunction(()=>{
  const node=document.querySelector('.sh-orbit-pin');
  return node && getComputedStyle(node).position==='sticky' &&
    !!document.querySelector('link[href="assets/orbit.css"]');
 },null,{timeout:20000});
 const orbitCSS=await fromAbout.locator('.sh-orbit-card').first().evaluate(
  el=>getComputedStyle(el).position
 );
 assert.equal(orbitCSS,'absolute','the carousel should be fully styled after navigation');
 await shot(fromAbout,'return-home-orbit');
});
await fromAbout.close();
const rm=await makePage('reduced-motion',{width:390,height:844},'reduce');
await check('Reduced motion renders cards without scroll pinning',async()=>{
 assert.equal(await rm.locator('.sh-service-sequence.sh-orbit-ready').count(),0);
 const cards=rm.locator('[data-orbit-card]');
 assert.equal(await cards.count(),4);
 for(let i=0;i<4;i++) assert(await cards.nth(i).isVisible());
 await rm.goto(ORIGIN+'/#/about',{waitUntil:'load'});
 await rm.locator('.about-media').first().waitFor();
 assert.equal(await rm.locator('.acelden-spring-surface').count(),0);
});
await rm.close();
await browser.close();
await writeFile('artifacts/ui-qa/report.json',JSON.stringify({screenshots,errors,failures},null,2));
console.log(JSON.stringify({screenshots,errors,failures}));
if(errors.length){console.error('Browser errors: '+errors.join('\\n'));failures++;}
if(failures)process.exit(1);
