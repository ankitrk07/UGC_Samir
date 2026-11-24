import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const baseURL=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3001';
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
const directory='artifacts/theme';
await fs.mkdir(directory,{recursive:true});
const results=[];
try{
 for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:360,height:800}]]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce',colorScheme:'light'});
  await context.addInitScript(()=>localStorage.setItem('trendhive-theme','light'));
  await context.addCookies([{name:'trendhive_session',value:'theme-qa-only',url:baseURL}]);
  await context.route('**/api/backend/**',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Theme QA: backend intentionally isolated.'})}));
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&/hydration|did not match|server html/i.test(m.text()))errors.push(m.text());});
  for(const route of ['/for-brands','/for-creators','/pricing','/login','/signup','/book-call','/contact','/forgot-password','/reset-password','/legal/privacy','/legal/terms','/dashboard-demo','/onboarding','/dashboard']){
   await page.goto(baseURL+route,{waitUntil:'domcontentloaded',timeout:60000});
   await page.evaluate(()=>document.fonts.ready);
   await page.getByRole('button',{name:'Switch to dark mode',exact:true}).first().waitFor({state:'visible'});
   await page.waitForTimeout(500);
   const result=await page.evaluate(()=>{
    const parse=color=>{const match=color.match(/[\d.]+/g);return match?match.map(Number):[0,0,0,0];};
    const blend=(top,bottom)=>{const a=top[3]??1;return [0,1,2].map(i=>top[i]*a+bottom[i]*(1-a));};
    const effectiveBG=el=>{const parents=[];for(let p=el;p;p=p.parentElement)parents.push(p);return parents.reverse().reduce((base,p)=>blend(parse(getComputedStyle(p).backgroundColor),base),[250,249,246]);};
    const luminance=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const lowContrast=[],darkSurfaces=[];
    for(const el of document.querySelectorAll('body *')){
     const s=getComputedStyle(el);
     if(!el.getClientRects().length||s.visibility==='hidden'||s.display==='none'||el.closest('.preloader,.video-card,.directory-photo,.custom-cursor,script,style,[aria-hidden="true"]'))continue;
     const bg=parse(s.backgroundColor);
     if((bg[3]??1)>.9&&Math.max(...bg.slice(0,3))<55)darkSurfaces.push({element:el.className,background:s.backgroundColor});
     const text=Array.from(el.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim();
     if(!text||el.tagName==='OPTION')continue;
     const foreground=blend(parse(s.color),effectiveBG(el));
     const a=luminance(foreground),b=luminance(effectiveBG(el));
     const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
     const large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&Number(s.fontWeight)>=700);
     if(ratio<(large?3:4.5))lowContrast.push({text:text.slice(0,80),element:String(el.className).slice(0,100),ratio:Number(ratio.toFixed(2)),color:s.color,background:effectiveBG(el),large});
    }
    return{theme:document.documentElement.dataset.theme,overflow:document.documentElement.scrollWidth>innerWidth+1,darkSurfaces,lowContrast};
   });
   results.push({device,route,...result,errors:[...errors]});
   console.log(device+' '+route+': '+result.theme+', overflow='+result.overflow+', dark surfaces='+result.darkSurfaces.length+', low contrast='+result.lowContrast.length);
   if(route==='/for-brands'||route==='/dashboard-demo'){
    if(route==='/for-brands'){
     await page.locator('.dashboard-preview').scrollIntoViewIfNeeded();
     await page.waitForSelector('.analytics-panel .chart-container');
     await page.waitForTimeout(1200);await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(300);
    }else await page.waitForTimeout(1200);
    const name=route==='/for-brands'?'brand':'dashboard';
    await page.screenshot({path:directory+'/'+name+'-light-'+device+'.png',animations:'disabled'});
    if(route==='/for-brands'&&device==='desktop')await page.screenshot({path:directory+'/brand-light-full.png',fullPage:true,animations:'disabled'});
    await page.getByRole('button',{name:'Switch to dark mode',exact:true}).first().click();
    await page.waitForTimeout(300);
    await page.screenshot({path:directory+'/'+name+'-dark-'+device+'.png',animations:'disabled'});
    if(route==='/for-brands'&&device==='desktop')await page.screenshot({path:directory+'/brand-dark-full.png',fullPage:true,animations:'disabled'});
    await page.getByRole('button',{name:'Switch to light mode',exact:true}).first().click();
   }
  }
  await context.close();
 }
}finally{await browser.close();await fs.writeFile(directory+'/coverage-report.json',JSON.stringify(results,null,2));}
if(results.some(r=>r.theme!=='light'||r.overflow||r.darkSurfaces.length||r.lowContrast.length||r.errors.length))process.exitCode=1;
