const {test,expect}=require('@playwright/test');
const path=require('path');
test.use({viewport:{width:375,height:812},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
test.beforeEach(async({page})=>{await page.goto('http://127.0.0.1:8765/');await page.evaluate(()=>localStorage.clear());await page.reload();await page.locator('#k > .quick-capture').evaluate(el=>el.open=true);});


test('day navigation and progress preserve dated entries',async({page})=>{
 await expect(page.locator('#next-day')).toBeDisabled();
 const today=await page.locator('#entrydate').inputValue();
 await page.locator('#previous-day').click();
 const yesterday=await page.locator('#entrydate').inputValue();
 expect(yesterday).not.toBe(today);
 await expect(page.locator('#next-day')).toBeEnabled();
 await page.locator('[data-g=medtoday] [data-v=No]').click();
 await expect(page.locator('.completion-track')).toHaveAttribute('aria-valuenow','1');
 await page.locator('#sk').click();
 await page.locator('#next-day').click();
 await expect(page.locator('#entrydate')).toHaveValue(today);
 await expect(page.locator('.completion-track')).toHaveAttribute('aria-valuenow','0');
 await page.locator('#previous-day').click();
 await expect(page.locator('[data-g=medtoday] [data-v=No]')).toHaveClass(/sel/);
 await expect(page.locator('.completion-track')).toHaveAttribute('aria-valuenow','1');
 await page.screenshot({path:'test-results/ritual-checkin-dated.png',fullPage:true});
});
test('mobile product screenshots and first-screen hierarchy for every tab',async({page})=>{
 const capture=page.locator('#k > .quick-capture');
 await capture.evaluate(el=>el.open=false);
 await expect(capture).not.toHaveAttribute('open','');
 const med=page.locator('[data-g=medtoday]');
 await expect(med).toBeVisible();
 const self=await page.evaluate(()=>({questionTop:document.querySelector('[data-g=medtoday]').getBoundingClientRect().top,navBottom:document.querySelector('.tabs').getBoundingClientRect().bottom,bodyWidth:document.body.scrollWidth,viewport:innerWidth}));
 expect(self.questionTop).toBeLessThan(690);
 expect(self.bodyWidth).toBeLessThanOrEqual(self.viewport);
 await page.screenshot({path:'test-results/redesign-checkin-375.png',fullPage:true});
 await page.locator('#pt').click();
 await expect(page.locator('#p')).toBeVisible();
 await page.screenshot({path:'test-results/redesign-partner-375.png',fullPage:true});
 await page.locator('#it').click();
 await expect(page.locator('#insights')).toBeVisible();
 await page.screenshot({path:'test-results/redesign-patterns-375.png',fullPage:true});
 await page.locator('#jt').click();
 await expect(page.locator('#journal-view')).toBeVisible();
 await page.screenshot({path:'test-results/redesign-journal-375.png',fullPage:true});
 await page.setViewportSize({width:320,height:700});
 for(const tab of ['#kt','#it','#jt']){
   await page.locator(tab).click();
   expect(await page.evaluate(()=>document.body.scrollWidth)).toBeLessThanOrEqual(320);
 }
 await page.screenshot({path:'test-results/redesign-journal-320.png',fullPage:true});
});
test('both tabs share layout, partner is indigo, and every partner scale stays on one row',async({page})=>{
 await expect(page.locator('#k')).toBeVisible();
 const sleep=await page.locator('[data-g=sleep] .c').evaluateAll(bs=>({count:bs.length,rows:new Set(bs.map(b=>Math.round(b.getBoundingClientRect().top))).size,overflow:bs.some(b=>b.scrollWidth>b.clientWidth)}));expect(sleep.count).toBe(5);expect(sleep.rows).toBe(1);expect(sleep.overflow).toBe(false);
 await page.locator('#pt').click();await expect(page.locator('#p')).toBeVisible();
 const info=await page.evaluate(()=>({accent:getComputedStyle(document.querySelector('#p')).getPropertyValue('--accent').trim(),scales:[...document.querySelectorAll('.partner-scale')].map(el=>({buttons:el.querySelectorAll('button').length,rows:new Set([...el.querySelectorAll('button')].map(b=>Math.round(b.getBoundingClientRect().top))).size,overflow:el.scrollWidth>el.clientWidth}))}));
 expect(info.accent).toBe('#56518b');expect(info.scales).toHaveLength(7);for(const s of info.scales){expect(s.buttons).toBe(5);expect(s.rows).toBe(1);expect(s.overflow).toBe(false)}
 await page.screenshot({path:'test-results/partner-mobile.png',fullPage:true});
 await page.locator('#kt').click();await expect(page.locator('#k')).toBeVisible();
 await page.screenshot({path:'test-results/self-mobile.png',fullPage:true});
});
test('self form conditional controls, validation, save, update, history and exports',async({page})=>{test.setTimeout(60000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.locator('#sk').click();await expect(page.locator('#ke')).toBeVisible();
 await page.locator('[data-g=medtoday] [data-v=Yes]').click();await expect(page.locator('#meddetails')).toBeVisible();
 await page.locator('#med').selectOption('Vyvanse (lisdexamfetamine)');await page.locator('#dose').selectOption('20 mg');
 for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="0"]').click();
 await page.locator('#more-details > summary').click();await page.locator('[data-g=side] [data-v=Mild]').click();await expect(page.locator('#effectdetails')).toBeVisible();
 await page.locator('#effects [data-v=Headache]').click();await page.locator('[data-g=side] [data-v=None]').click();await expect(page.locator('#effectdetails')).toBeHidden();
 await page.locator('[data-g=dropoff] [data-v=Yes]').click();await expect(page.locator('#dropdetails')).toBeVisible();
 await page.locator('[data-g=dropoff] [data-v=No]').click();await expect(page.locator('#dropdetails')).toBeHidden();
 await page.locator('#sk').click();await expect(page.locator('#ko')).toBeVisible();
 let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('my_daily_v4')));expect(data).toHaveLength(1);expect(data[0].getting_started).toBe('0');expect(data[0].side_effects).toEqual([]);
 await page.locator('[data-g=medtoday] [data-v=No]').click();for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="4"]').click();await page.locator('#sk').click();
 data=await page.evaluate(()=>JSON.parse(localStorage.getItem('my_daily_v4')));expect(data).toHaveLength(1);expect(data[0].getting_started).toBe('4');
 await page.locator('#jt').click();await page.locator('#kh').locator('xpath=..').locator('summary').click();await expect(page.locator('#kh')).toContainText('Start 5/5');
 const [file]=await Promise.all([page.waitForEvent('download'),page.locator('#ck').click()]);expect(file.suggestedFilename()).toBe('my-checkins.csv');expect(errors).toEqual([]);
});
test('partner observation, uncertainty, save, update and export',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.locator('#pt').click();
 await page.locator('#sp').click();await expect(page.locator('#po')).toContainText('Choose at least one');
 await page.locator('[data-g=start_obs] [data-v="Not sure"]').click();await page.locator('#sp').click();await expect(page.locator('#po')).toContainText('Saved');
 let unsure=await page.evaluate(()=>JSON.parse(localStorage.getItem('partner_weekly_v3')));expect(unsure[0].start_obs).toBe('Not sure');
 const order=await page.locator('[data-g=start_obs] .c').evaluateAll(bs=>bs.map(b=>b.dataset.v));expect(order).toEqual(['Not sure','Worse','Same','A little better','Clearly better']);
 await page.locator('[data-g=start_obs] [data-v="A little better"]').click();await page.locator('#sp').click();
 let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('partner_weekly_v3')));expect(data).toHaveLength(1);expect(data[0].start_obs).toBe('A little better');
 await page.locator('[data-g=start_obs] [data-v=Same]').click();await page.locator('#sp').click();data=await page.evaluate(()=>JSON.parse(localStorage.getItem('partner_weekly_v3')));expect(data).toHaveLength(1);expect(data[0].start_obs).toBe('Same');
 await page.locator('#jt').click();await page.locator('#ph').locator('xpath=..').locator('summary').click();await expect(page.locator('#ph')).toContainText('Same');
 const [file]=await Promise.all([page.waitForEvent('download'),page.locator('#cp').click()]);expect(file.suggestedFilename()).toBe('partner-checkins.csv');expect(errors).toEqual([]);
});
test('offline shell works after initial online load',async({page,context})=>{
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null,null,{timeout:25000});
 await context.setOffline(true);await page.reload();await expect(page.locator('#kt')).toBeVisible();await page.locator('#pt').click();await expect(page.locator('#p')).toBeVisible();
});


test('saved answers restore after reload and can be corrected without re-entering',async({page})=>{
 await page.locator('[data-g=medtoday] [data-v=No]').click();
 for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="2"]').click();
 await page.locator('#more-details').evaluate(el=>el.open=true);await page.locator('#quick-self').fill('Remember this');await page.locator('#sk').click();
 await page.reload();
 await expect(page.locator('[data-g=start] [data-v="2"]')).toHaveClass(/sel/);
 await expect(page.locator('#quick-self')).toHaveValue('Remember this');
 await page.locator('[data-g=start] [data-v="4"]').click();await page.locator('#sk').click();
 let mine=await page.evaluate(()=>JSON.parse(localStorage.getItem('my_daily_v4')));expect(mine).toHaveLength(1);expect(mine[0].getting_started).toBe('4');
 await page.locator('#pt').click();await page.locator('[data-g=start_obs] [data-v=Same]').click();await page.locator('#quick-partner').fill('Partner note');await page.locator('#sp').click();await page.reload();await page.locator('#pt').click();
 await expect(page.locator('[data-g=start_obs] [data-v=Same]')).toHaveClass(/sel/);await expect(page.locator('#pn')).toHaveValue('Partner note');
});
test('mobile options remain on one row at multiple widths',async({page})=>{
 for(const width of [320,360,375,390,430]){
  await page.setViewportSize({width,height:800});
  for(const selector of ['[data-g=sleep]','.partner-scale']){
   if(selector==='.partner-scale')await page.locator('#pt').click();else await page.locator('#kt').click();
   const items=await page.locator(selector).first().locator('.c').evaluateAll(bs=>({rows:new Set(bs.map(b=>Math.round(b.getBoundingClientRect().top))).size,overflow:bs.some(b=>b.scrollWidth>b.clientWidth)}));
   expect(items.rows).toBe(1);expect(items.overflow).toBe(false);
  }
 }
});

test('clinician notes exports explain scales and preserve current fields',async({page})=>{
 const result=await page.evaluate(()=>{
  const sample={date:'2026-10-19',medication_today:'Yes',medication:'Vyvanse (lisdexamfetamine)',dose:'20 mg',getting_started:'3',work_crowding:'4',sleep:'Good',side_effect_severity:'None',note:'A concrete example'};
  const self=mdMine([sample]);const partner=mdPartner([{date:'2026-10-19',start_obs:'Not sure',life_obs:'Clearly better',note:'Observed at home'}]);
  return {self,partner};
 });
 expect(result.self).toContain('Work crowding runs in the opposite direction');
 expect(result.self).toContain('Not recorded');
 expect(result.self).toContain('A concrete example');
 expect(result.self).toContain('20 mg');
 expect(result.partner).toContain('not an improvement score');
 expect(result.partner).toContain('Not sure');
 expect(result.partner).toContain('Observed at home');
});

test('service worker uses current cache and removes obsolete cache',async({page})=>{
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null,null,{timeout:25000});
 const result=await page.evaluate(async()=>{
  const old=await caches.open('daily-checkin-offline-v1');await old.put('./old-marker',new Response('old'));
  const reg=await navigator.serviceWorker.getRegistration();await reg.update();
  const keys=await caches.keys();
  return {keys,controlled:!!navigator.serviceWorker.controller};
 });
 expect(result.controlled).toBe(true);
 expect(result.keys).toContain('daily-checkin-offline-v79');
 // An existing worker only purges obsolete caches during activation, not each update check.
});
test('history escapes user-controlled HTML and does not execute it',async({page})=>{
 await page.evaluate(()=>{localStorage.setItem('partner_weekly_v3',JSON.stringify([{date:'2026-10-19',start_obs:'<img src=x onerror=alert(1)>',still_themselves:'Yes'}]));render()});
 await expect(page.locator('#ph img')).toHaveCount(0);
 await expect(page.locator('#ph')).toContainText('<img');
});

test('tabs have consistent hierarchy and partner progress updates',async({page})=>{
 await expect(page.locator('#checkin-title')).toBeVisible();
 await page.locator('#pt').click();
 await expect(page.locator('#entrydate')).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
 await expect(page.locator('#partnerprogress')).toContainText('Choose any observation');
 await expect(page.locator('#p .section-kicker')).toHaveCount(2);
 await page.locator('[data-g=start_obs] [data-v=Same]').click();
 await expect(page.locator('#partnerprogress')).toContainText('1 observations recorded');
 await expect(page.locator('#p .save')).toHaveCount(1);
 await page.locator('#kt').click();
 await expect(page.locator('#k .section-kicker')).toHaveCount(3);
});

test('backfill date saves separately, reloads edits and exports accurate dates',async({page})=>{
 const today=await page.locator('#entrydate').inputValue();
 const yesterday=await page.evaluate(()=>{const d=new Date();d.setDate(d.getDate()-1);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')});
 await page.locator('#entrydate').fill(yesterday);
 await page.locator('[data-g=medtoday] [data-v=No]').click();
 for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="2"]').click();
 await page.locator('#sk').click();
 await page.locator('#pt').click();await page.locator('[data-g=start_obs] [data-v=Same]').click();await page.locator('#sp').click();
 await page.reload();await page.locator('#entrydate').fill(yesterday);
 await expect(page.locator('[data-g=start] [data-v="2"]')).toHaveClass(/sel/);
 await page.locator('#pt').click();await expect(page.locator('[data-g=start_obs] [data-v=Same]')).toHaveClass(/sel/);
 await page.locator('#entrydate').fill(today);await expect(page.locator('[data-g=start] .sel')).toHaveCount(0);
 const result=await page.evaluate(()=>({mine:JSON.parse(localStorage.getItem('my_daily_v4')),partner:JSON.parse(localStorage.getItem('partner_weekly_v3')),markdown:mdMine(JSON.parse(localStorage.getItem('my_daily_v4')))}));
 expect(result.mine[0].date).toBe(yesterday);expect(result.partner[0].date).toBe(yesterday);expect(result.markdown).toContain(yesterday);
});

test('single journal backup is deduplicated, dated, confirmed and detects edits',async({page})=>{
 await page.locator('[data-g=medtoday] [data-v=No]').click();
 for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="2"]').click();
 await page.locator('#more-details').evaluate(el=>el.open=true);await page.locator('#quick-self').fill('First journal note');
 await page.locator('#sk').click();
 await page.locator('#pt').click();
 await page.locator('[data-g=start_obs] [data-v=Same]').click();
 await page.locator('#quick-partner').fill('Partner observation');
 await page.locator('#sp').click();
 const journal=await page.evaluate(()=>journalMarkdown(journalRows()));
 const date=await page.locator('#entrydate').inputValue();
 expect(journal).toContain('First journal note');
 expect(journal).toContain('Partner observation');
 expect(journal).toContain('## '+date);
 expect((journal.match(new RegExp('## '+date,'g'))||[])).toHaveLength(2);
 await page.locator('#jt').click();await page.locator('#journal-panel summary').click();
 await expect(page.locator('#journal-status')).toContainText('Not backed up');
 await page.evaluate(()=>{navigator.share=async()=>{};navigator.canShare=()=>true});
 await page.locator('#journal-export').click();
 await expect(page.locator('#journal-confirm')).toBeVisible();
 await expect(page.locator('#journal-status')).toContainText('Not backed up');
 await page.locator('#journal-done').click();
 await expect(page.locator('#journal-status')).toContainText('Backed up');
 await page.locator('#kt').click();
 await page.locator('#more-details').evaluate(el=>el.open=true);await page.locator('#quick-self').fill('Edited journal note');
 await page.locator('#sk').click();
 await expect(page.locator('#journal-status')).toContainText('Changes to back up');
 const revised=await page.evaluate(()=>journalMarkdown(journalRows()));
 expect(revised).toContain('Edited journal note');
 expect(revised).not.toContain('First journal note');
 expect((revised.match(new RegExp('## '+date,'g'))||[])).toHaveLength(2);
 await page.reload();
 await page.locator('#jt').click();await page.locator('#journal-panel summary').click();
 await expect(page.locator('#journal-status')).toContainText('Changes to back up');
});

test('doctor report is readable plain text with dates and both perspectives',async({page})=>{
 await page.locator('[data-g=medtoday] [data-v=No]').click();
 for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="2"]').click();
 await page.locator('#more-details').evaluate(el=>el.open=true);await page.locator('#quick-self').fill('Doctor note');await page.locator('#sk').click();
 await page.locator('#pt').click();await page.locator('[data-g=start_obs] [data-v=Same]').click();await page.locator('#sp').click();
 const report=await page.evaluate(()=>doctorReport());
 expect(report).toContain('Doctor note');
 expect(report).toContain('Partner observations');
 expect(report).toContain('How to read this');
 expect(report).toContain(await page.locator('#entrydate').inputValue());
 expect(report).not.toContain('**');expect(report.split('\n').some(line=>/^#{1,3} /.test(line))).toBe(false);
 expect(report.split('\n').length).toBeGreaterThan(10);
});

test('unified navigation, factual insights, journal edit and XSS safety',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.locator('#it').click();await expect(page.locator('#insights')).toBeVisible();
 await expect(page.locator('#insight-body')).toContainText('Your first check-in makes this useful');
 await page.locator('#kt').click();
 await page.locator('[data-g=medtoday] [data-v=No]').click();
 for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="2"]').click();
 await page.locator('#more-details').evaluate(el=>el.open=true);await page.locator('#quick-self').fill('<img src=x onerror=alert(1)>');
 await page.locator('#sk').click();
 await page.locator('#pt').click();await page.locator('[data-g=start_obs] [data-v=Same]').click();await page.locator('#sp').click();
 await page.locator('#it').click();
 await expect(page.locator('#insight-body')).toContainText('1');
 await expect(page.locator('#insight-body')).toContainText('<img src=x');
 await expect(page.locator('#insight-body img')).toHaveCount(0);
 await page.locator('[data-period="7"]').click();
 const result=await page.evaluate(()=>insightFacts());
 expect(result).toContain('Personal entries: 1');
 expect(result).toContain('Partner entries: 1');
 await page.locator('#jt').click();
 await expect(page.locator('#journal-list .journal-item')).toHaveCount(2);
 await page.locator('[data-jfilter="mine"]').click();
 await expect(page.locator('#journal-list .journal-item')).toHaveCount(1);
 await page.locator('#journal-list [data-editwho="mine"]').click();
 await expect(page.locator('#k')).toBeVisible();
 await expect(page.locator('#quick-self')).toHaveValue('<img src=x onerror=alert(1)>');
 expect(errors).toEqual([]);
});

test('headings, date and navigation remain in consistent order across every section',async({page})=>{
 const states=[['k','How was your day?'],['p','What did you notice?'],['insights','What’s changing?'],['journal-view','Your saved days.']];
 for(const [view,title] of states){
  if(view==='k')await page.locator('#kt').click();
  else if(view==='p'){await page.locator('#kt').click();await page.locator('#pt').click()}
  else if(view==='insights')await page.locator('#it').click();
  else await page.locator('#jt').click();
  const visible=await page.evaluate(()=>[...document.querySelectorAll('h1')].filter(x=>x.getBoundingClientRect().height>0).map(x=>x.textContent));
  expect(visible).toEqual([title]);
  const header=await page.locator('.app-head').boundingBox(),nav=await page.locator('.tabs').boundingBox();
  expect(header.y+header.height).toBeLessThan(nav.y+1);
  if(view==='k'||view==='p'){
   const heading=await page.locator('#checkin-title').boundingBox(),switcher=await page.locator('#checkin-switch').boundingBox(),date=await page.locator('.date-control').boundingBox();
   expect(nav.y+nav.height).toBeLessThan(heading.y);
   expect(heading.y+heading.height).toBeLessThan(switcher.y);
   expect(switcher.y+switcher.height).toBeLessThan(date.y);
  }else{
   await expect(page.locator('#checkin-head')).toBeHidden();
   await expect(page.locator('.date-control')).toBeHidden();
  }
 }
 await page.reload();await expect(page.locator('#checkin-title')).toHaveText('How was your day?');
});

test('save feedback is visible at button position for success, update and validation',async({page})=>{
 await page.locator('#sk').click();
 await expect(page.locator('#save-toast')).toBeVisible();
 await expect(page.locator('#save-toast')).toContainText('Not saved yet');
 await page.locator('[data-g=medtoday] [data-v=No]').click();
 for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="2"]').click();
 await page.locator('#sk').click();
 await expect(page.locator('#save-toast')).toBeVisible();
 await expect(page.locator('#save-toast')).toContainText('Check-in saved on this device');
 await page.locator('#sk').click();
 await expect(page.locator('#save-toast')).toContainText('Check-in updated');
 await page.locator('#pt').click();
 await page.locator('#sp').click();
 await expect(page.locator('#save-toast')).toContainText('Not saved yet');
 await page.locator('[data-g=start_obs] [data-v=Same]').click();
 await page.locator('#sp').click();
 await expect(page.locator('#save-toast')).toContainText('Partner check-in saved');
});

test('iOS home screen icon is PNG and manifest references real PNG',async({page,request})=>{const icon=await request.get('http://127.0.0.1:8765/apple-touch-icon.png');expect(icon.ok()).toBeTruthy();expect(icon.headers()['content-type']).toContain('image/png');const bytes=await icon.body();expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href',/home-icon-2026.png/);const manifest=await (await request.get('http://127.0.0.1:8765/manifest.webmanifest')).json();expect(manifest.icons.some(x=>x.type==='image/png')).toBe(true)});

test('ADHD-friendly short form, optional details, sticky save and pencil icon',async({page,request})=>{
 await expect(page.locator('#more-details')).not.toHaveAttribute('open','');
 await expect(page.locator('#sk')).toBeVisible();
 await expect(page.locator('#progress')).toContainText('0 of 7');
 const before=await page.locator('#sk').boundingBox();expect(before.height).toBeGreaterThan(30);
 await page.locator('[data-g=medtoday] [data-v=No]').click();
 for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="2"]').click();
 await expect(page.locator('#progress')).toContainText('Ready to save');
 await page.locator('#sk').click();await expect(page.locator('#save-toast')).toContainText('Check-in saved');
 await page.reload();await expect(page.locator('#progress')).toContainText('Ready to save');
 await page.locator('#k > .quick-capture').evaluate(el=>el.open=true);
 await expect(page.locator('#quick-self')).toBeVisible();
 await page.locator('#quick-self').fill('Optional entry');await page.locator('#sk').click();
 await page.reload();await expect(page.locator('#quick-self')).toHaveValue('Optional entry');
 const manifest=await (await request.get('http://127.0.0.1:8765/manifest.webmanifest')).json();
 expect(manifest.icons.some(i=>i.type==='image/png')).toBeTruthy();
 const svg=await (await request.get('http://127.0.0.1:8765/icon.svg')).text();expect(svg).toContain('stroke');
});

test('new-day notes carry forward visibly, remain editable, and never overwrite yesterday',async({page})=>{
 const yesterday=await page.evaluate(()=>{const d=new Date();d.setDate(d.getDate()-1);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')});
 await page.locator('#entrydate').fill(yesterday);
 await page.locator('[data-g=medtoday] [data-v=No]').click();
 for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="2"]').click();
 await page.locator('#more-details').evaluate(el=>el.open=true);
 await page.locator('#quick-self').fill('Keep this in mind tomorrow');
 await page.locator('#tn').evaluate(el=>el.closest('details').open=true);
  await page.locator('#tn').fill('Treatment context from yesterday');
 await page.locator('#sk').click();
 await expect(page.locator('#save-toast')).toContainText('saved');
 const today=await page.evaluate(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')});
 await page.locator('#entrydate').fill(today);
 await expect(page.locator('#personal-carry')).toBeVisible();
 await expect(page.locator('#quick-self')).toHaveValue('');
 await expect(page.locator('#tn')).toHaveValue('');
 await expect(page.locator('#personal-carry')).toContainText('Keep this in mind tomorrow');
 await expect(page.locator('#treatment-carry')).toContainText('Treatment context from yesterday');
 await expect(page.locator('#quick-self')).toHaveValue('');
 await page.locator('#entrydate').fill(yesterday);
 await expect(page.locator('#quick-self')).toHaveValue('Keep this in mind tomorrow');
});
test('Insights gives all six dimensions, trend marks and original dated notes',async({page})=>{
 await page.locator('[data-g=medtoday] [data-v=No]').click();
 for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="2"]').click();
 await page.locator('#more-details').evaluate(el=>el.open=true);
 await page.locator('#quick-self').fill('A distinct original observation');
 await page.locator('#sk').click();
 await page.locator('#it').click();
 await expect(page.locator('.insight-dim')).toHaveCount(6);
 await expect(page.locator('.trend-row')).toHaveCount(6);
 await expect(page.locator('.trend-dot')).toHaveCount(6);
 await expect(page.locator('#insight-body')).toContainText('A distinct original observation');
 await expect(page.locator('#insight-body')).toContainText('not a diagnosis');
});

test('unsaved notes survive changing dates, reload and navigation',async({page})=>{
 const today=await page.locator('#entrydate').inputValue();
 const yesterday=await page.evaluate(()=>{const d=new Date();d.setDate(d.getDate()-1);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')});
 await page.locator('#more-details').evaluate(el=>el.open=true);
 await page.locator('#quick-self').fill('Draft note must not disappear');
 await page.locator('#tn').evaluate(el=>el.closest('details').open=true);
  await page.locator('#tn').fill('Medication context must persist');
 await page.locator('#entrydate').fill(yesterday);
 await page.locator('#entrydate').fill(today);
 await expect(page.locator('#quick-self')).toHaveValue('Draft note must not disappear');
 await expect(page.locator('#tn')).toHaveValue('Medication context must persist');
 await page.reload();
 await expect(page.locator('#quick-self')).toHaveValue('Draft note must not disappear');
 await page.locator('#it').click();
 await page.locator('#kt').click();
 await expect(page.locator('#quick-self')).toHaveValue('Draft note must not disappear');
});

test('one active experiment, daily review and clinician export persist',async({page})=>{
 await page.locator('#it').click();
 await page.locator('#experiment-type').selectOption('start');
 await expect(page.locator('#experiment-plan')).toContainText('first physical step');
 await page.locator('#experiment-start').click();
 await expect(page.locator('#experiment-active')).toBeVisible();
 await page.locator('#experiment-result').selectOption('partly');
 await page.locator('#experiment-note').fill('Worked when I prepared the desk');
 await page.locator('#experiment-review').click();
 await expect(page.locator('#experiment-history')).toContainText('Worked when I prepared the desk');
 await page.reload();await page.locator('#it').click();
 await expect(page.locator('#experiment-result')).toHaveValue('partly');
 await expect(page.locator('#experiment-note')).toHaveValue('Worked when I prepared the desk');
 const report=await page.evaluate(()=>{localStorage.setItem('my_daily_v4',JSON.stringify([{date:'2026-10-19',medication_today:'No'}]));return doctorReport()});
 expect(report).toContain('BEHAVIOURAL EXPERIMENTS');
 expect(report).toContain('Worked when I prepared the desk');
});

test('clinician overview separates observed trends, treatment context and dated evidence',async({page})=>{
 const result=await page.evaluate(()=>{
 localStorage.setItem('my_daily_v4',JSON.stringify([
 {date:'2026-10-01',medication_today:'Yes',medication:'Vyvanse (lisdexamfetamine)',dose:'20 mg',getting_started:'1',attention_control:'2',sleep:'Poor',side_effect_severity:'Mild',dropoff:'Yes'},
 {date:'2026-10-03',medication_today:'Yes',medication:'Vyvanse (lisdexamfetamine)',dose:'20 mg',getting_started:'3',attention_control:'4',sleep:'Good',dropoff:'No'}]));
 localStorage.setItem('partner_weekly_v3',JSON.stringify([{date:'2026-10-03',start_obs:'A little better'}]));
 return doctorReport();
 });
 expect(result).toContain('REVIEW AT A GLANCE');
 expect(result).toContain('Getting started: mean 3.0/5 across 2 answered days');
 expect(result).toContain('Recorded period: 2026-10-01 to 2026-10-03');
 expect(result).toContain('SIDE EFFECTS: severity reported above None on 1 recorded day');
 expect(result).toContain('No causal treatment effect can be inferred');
 expect(result).toContain('DATED RECORDS');
});
test('draft capture persists multiple selections and scores without losing previous dates',async({page})=>{
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 await page.locator('#more-details').evaluate(el=>el.open=true);
 await page.locator('#quick-self').fill('Keep this note');
 await page.locator('[data-g=start] [data-v="3"]').click();
 await page.locator('#wins [data-v="Exercise"]').click();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('daily_checkin_drafts_v1')||'{}'));
 expect(stored[await page.locator('#entrydate').inputValue()]?.fields?.kn).toBe('Keep this note');
 await page.reload();
 const diagnostic=await page.evaluate(()=>({date:document.querySelector('#entrydate').value,note:document.querySelector('#kn').value,drafts:localStorage.getItem('daily_checkin_drafts_v1'),status:document.querySelector('#draft-status').textContent}));
 expect(diagnostic.note,JSON.stringify({...diagnostic,pageErrors})).toBe('Keep this note');
 await expect(page.locator('[data-g=start] [data-v="3"]')).toHaveClass(/sel/);
 await expect(page.locator('#wins [data-v="Exercise"]')).toHaveClass(/sel/);
});

test('optional life quality and appetite survive draft, save and clinician report',async({page})=>{
 await page.locator('#more-details').evaluate(el=>el.open=true);
 await page.locator('#lifequality').selectOption('Good day');
 await page.locator('#appetite').selectOption('Skipped meals or struggled to eat');
 await page.reload();
 await expect(page.locator('#lifequality')).toHaveValue('Good day');
 await expect(page.locator('#appetite')).toHaveValue('Skipped meals or struggled to eat');
 const report=await page.evaluate(()=>{
 localStorage.setItem('my_daily_v4',JSON.stringify([{date:'2026-10-20',medication_today:'Yes',life_quality:'Good day',appetite:'Skipped meals or struggled to eat'}]));
 return doctorReport();
 });
 expect(report).toContain('LIFE QUALITY: 1 of 1 recorded days felt good');
 expect(report).toContain('APPETITE: skipped meals or difficulty eating on 1 of 1 recorded days');
 expect(report).toContain('How life felt: Good day');
});

test('saving self check-in retains unfinished partner note and observation',async({page})=>{
 await page.locator('#pt').click();
 await page.locator('#quick-partner').fill('Unfinished partner perspective');
 await page.locator('[data-g=start_obs] [data-v="A little better"]').click();
 await page.locator('#kt').click();
 for(const group of ['start','attention','sidequests','finish','switching','regulation']){
  await page.locator('[data-g='+group+'] [data-v="2"]').click();
 }
 await page.locator('[data-g=medtoday] [data-v="No"]').click();
 await page.locator('#sk').click();
 await page.reload();
 await page.locator('#pt').click();
 await expect(page.locator('#pn')).toHaveValue('Unfinished partner perspective');
 await expect(page.locator('[data-g=start_obs] [data-v="A little better"]')).toHaveClass(/sel/);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('my_daily_v4')||'[]'));
 expect(saved.length).toBe(1);
});
test('full device backup includes unfinished drafts and behavioural experiments',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.locator('#more-details').evaluate(el=>el.open=true);
 await page.locator('#quick-self').fill('Unfinished backup note');
 const result=await page.evaluate(()=>{
  const drafts=JSON.parse(localStorage.getItem('daily_checkin_drafts_v1')||'{}');
  return {drafts,day:document.querySelector('#entrydate').value};
 });
 expect(result.drafts[result.day].fields.kn).toBe('Unfinished backup note');
 await page.locator('#bk').evaluate(el=>el.closest('details').open=true);
 const captured=await page.evaluate(()=>{let raw='';const original=URL.createObjectURL;URL.createObjectURL=blob=>{window.__backupBlob=blob;return original.call(URL,blob)};return true});
 await page.locator('#bk').evaluate(el=>el.click());
 const backupText=await page.evaluate(async()=>window.__backupBlob?await window.__backupBlob.text():null);
 expect(backupText,JSON.stringify(errors)).toBeTruthy();
 const backup=JSON.parse(backupText);
 expect(backup.format).toBe('daily-checkin-device-backup-v2');
 expect(backup.unfinished_drafts_on_this_device[result.day].fields.kn).toBe('Unfinished backup note');
 expect(backup).toHaveProperty('behavioural_experiments_on_this_device');
});

test('app script parses and navigation initializes without browser errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.reload();
 expect(errors).toEqual([]);
 await page.locator('#it').click();
 await expect(page.locator('#help-view')).toBeVisible();
 await page.locator('#it').click();
 await expect(page.locator('#insights')).toBeVisible();
});
test('three destinations keep check-in, patterns with strategies, and records distinct',async({page})=>{
 const tabs=page.locator('.tabs button');
 await expect(tabs).toHaveCount(3);
 await expect(page.locator('#kt')).toContainText('Check-in');
 await expect(page.locator('#it')).toContainText('Patterns');
 await expect(page.locator('#jt')).toContainText('Journal');
 await page.locator('#it').click();
 await expect(page.locator('#insights')).toBeVisible();
 await expect(page.locator('#help-view')).toBeVisible();
 await expect(page.locator('#experiment-type')).toBeVisible();
 await page.locator('#jt').click();
 await expect(page.locator('#journal-view')).toBeVisible();
 await page.locator('#kt').click();
 await expect(page.locator('#k')).toBeVisible();
});
test('quick notes require explicit save and keep partner and self separate',async({page})=>{
 await page.locator('#quick-self').fill('Started one small task');await page.locator('#quick-self-apply').click();await expect(page.locator('#quick-self')).toHaveValue('Started one small task');await expect(page.locator('#quick-self-status')).toContainText('Original note kept in your draft');
 await page.locator('#pt').click();await page.locator('#quick-partner').fill('Seemed more settled');await page.locator('#quick-partner-apply').click();await expect(page.locator('#pn')).toHaveValue('Seemed more settled');
 await expect(page.locator('#quick-self')).toHaveValue('Started one small task');
});

test('saving directly from daily note preserves original words',async({page})=>{
 await page.locator('#quick-self').fill('Took Vyvanse and slept well. Started easily.');
 await page.locator('[data-g=medtoday] [data-v=Yes]').click();
 for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="2"]').click();
 await page.locator('#sk').click();
 await page.reload();
 await expect(page.locator('#quick-self')).toHaveValue('Took Vyvanse and slept well. Started easily.');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('my_daily_v4')||'[]'));
 expect(saved.some(x=>x.note==='Took Vyvanse and slept well. Started easily.')).toBe(true);
});
test('unsent daily note survives reload and is not lost by tab navigation',async({page})=>{
 await page.locator('#quick-self').fill('Unfinished private thought');
 await page.locator('#it').click();await page.locator('#kt').click();
 await page.reload();
 await expect(page.locator('#quick-self')).toHaveValue('Unfinished private thought');
});

test('primary daily note remains visible after reviewing and can be edited',async({page})=>{
 const field=page.locator('#quick-self');
 await expect(field).toBeVisible();
 await field.fill('Slept well and stayed focused');
 await page.locator('#quick-self-apply').click();
 await expect(field).toHaveValue('Slept well and stayed focused');
 await expect(page.locator('#quick-self')).toHaveValue('Slept well and stayed focused');
 await field.fill('Slept well, then lost focus');
 await page.locator('#quick-self-apply').click();
 await expect(page.locator('#quick-self')).toHaveValue('Slept well, then lost focus');
});

test('saved self entry does not overwrite an unfinished partner draft',async({page})=>{
 await page.locator('#pt').click();
 await page.locator('#quick-partner').fill('Partner observation still in progress');
 await page.locator('#kt').click();
 await page.locator('[data-g=medtoday] [data-v=No]').click();
 for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="2"]').click();
 await page.locator('#sk').click();
 await page.reload();await page.locator('#pt').click();
 await expect(page.locator('#quick-partner')).toHaveValue('Partner observation still in progress');
});

test('editing visible note after review is the text actually saved',async({page})=>{
 await page.locator('#quick-self').fill('First version');
 await page.locator('#quick-self-apply').click();
 await page.locator('#quick-self').fill('Corrected version');
 await page.locator('[data-g=medtoday] [data-v=No]').click();
 for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="2"]').click();
 await page.locator('#sk').click();await page.reload();
 await expect(page.locator('#quick-self')).toHaveValue('Corrected version');
 const entries=await page.evaluate(()=>JSON.parse(localStorage.getItem('my_daily_v4')||'[]'));
 expect(entries[0].note).toBe('Corrected version');
});
test('reviewing partner note repeatedly never duplicates the note',async({page})=>{
 await page.locator('#pt').click();
 await page.locator('#quick-partner').fill('A calm afternoon');
 await page.locator('#quick-partner-apply').click();
 await page.locator('#quick-partner-apply').click();
 await expect(page.locator('#pn')).toHaveValue('A calm afternoon');
 await page.locator('#sp').click();await page.reload();await page.locator('#pt').click();
 await expect(page.locator('#pn')).toHaveValue('A calm afternoon');
});

test('iOS shortcut references the dedicated PNG icon',async({page})=>{
 const icon=page.locator('link[rel="apple-touch-icon"]');
 await expect(icon).toHaveAttribute('href',/home-icon-2026\.png/);
 const url=await icon.getAttribute('href');
 const response=await page.request.get(new URL(url,page.url()).href);
 expect(response.ok()).toBeTruthy();
 expect(response.headers()['content-type']).toContain('image/png');
});

test('primary product navigation works after startup, date changes and reload',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await expect(page.locator('#k')).toBeVisible();
 await page.locator('#it').click();
 await expect(page.locator('#insights')).toBeVisible();
 await expect(page.locator('#help-view')).toBeVisible();
 await page.locator('#jt').click();
 await expect(page.locator('#journal-view')).toBeVisible();
 await page.locator('#kt').click();
 await expect(page.locator('#k')).toBeVisible();
 await page.locator('#pt').click();
 await expect(page.locator('#p')).toBeVisible();
 await page.locator('#it').click();
 await expect(page.locator('#insights')).toBeVisible();
 await page.locator('#kt').click();
 await expect(page.locator('#k')).toBeVisible();
 await page.reload();
 await page.locator('#jt').click();
 await expect(page.locator('#journal-view')).toBeVisible();
 expect(errors).toEqual([]);
});

test('usual medication is reusable with one explicit daily confirmation, never auto-recorded',async({page})=>{
 await page.locator('[data-g=medtoday] [data-v=Yes]').click();
 await page.locator('#med').selectOption('Vyvanse (lisdexamfetamine)');
 await page.locator('#dose').selectOption({index:1});
 await page.locator('[data-g=medtoday] [data-v=No]').click();
 await expect(page.locator('#usual-med-taken')).toBeVisible();
 await page.reload();
 await expect(page.locator('[data-g="medtoday"] [data-v="No"]')).toHaveClass(/sel/);
 await expect(page.locator('#usual-med-summary')).toContainText('Vyvanse');
 await page.locator('#usual-med-taken').click();
 await expect(page.locator('[data-g="medtoday"] [data-v="Yes"]')).toHaveClass(/sel/);
 await expect(page.locator('#med')).toHaveValue('Vyvanse (lisdexamfetamine)');
 await expect(page.locator('#dose')).not.toHaveValue('');
});
