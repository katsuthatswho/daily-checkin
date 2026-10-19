const {test,expect}=require('@playwright/test');
const path=require('path');
test.use({viewport:{width:375,height:812},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
test.beforeEach(async({page})=>{await page.goto('http://127.0.0.1:8765/');await page.evaluate(()=>localStorage.clear());await page.reload();});
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
 await page.locator('[data-g=side] [data-v=Mild]').click();await expect(page.locator('#effectdetails')).toBeVisible();
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
 await page.locator('#kn').fill('Remember this');await page.locator('#sk').click();
 await page.reload();
 await expect(page.locator('[data-g=start] [data-v="2"]')).toHaveClass(/sel/);
 await expect(page.locator('#kn')).toHaveValue('Remember this');
 await page.locator('[data-g=start] [data-v="4"]').click();await page.locator('#sk').click();
 let mine=await page.evaluate(()=>JSON.parse(localStorage.getItem('my_daily_v4')));expect(mine).toHaveLength(1);expect(mine[0].getting_started).toBe('4');
 await page.locator('#pt').click();await page.locator('[data-g=start_obs] [data-v=Same]').click();await page.locator('#pn').fill('Partner note');await page.locator('#sp').click();await page.reload();await page.locator('#pt').click();
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
 expect(result.keys).toContain('daily-checkin-offline-v46');
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
 await expect(page.locator('#partnerdate')).not.toBeEmpty();
 await expect(page.locator('#partnerprogress')).toContainText('A quick look');
 await expect(page.locator('#p .section-kicker')).toHaveCount(2);
 await page.locator('[data-g=start_obs] [data-v=Same]').click();
 await expect(page.locator('#partnerprogress')).toContainText('1 of 7');
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
 await page.locator('#kn').fill('First journal note');
 await page.locator('#sk').click();
 await page.locator('#pt').click();
 await page.locator('[data-g=start_obs] [data-v=Same]').click();
 await page.locator('#pn').fill('Partner observation');
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
 await page.locator('#kn').fill('Edited journal note');
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
 await page.locator('#kn').fill('Doctor note');await page.locator('#sk').click();
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
 await expect(page.locator('#insight-body')).toContainText('Nothing to summarise');
 await page.locator('#kt').click();
 await page.locator('[data-g=medtoday] [data-v=No]').click();
 for(const g of ['start','attention','sidequests','finish','switching','regulation'])await page.locator('[data-g='+g+'] [data-v="2"]').click();
 await page.locator('#kn').fill('<img src=x onerror=alert(1)>');
 await page.locator('#sk').click();
 await page.locator('#pt').click();await page.locator('[data-g=start_obs] [data-v=Same]').click();await page.locator('#sp').click();
 await page.locator('#it').click();
 await expect(page.locator('#insight-body')).toContainText('1 shared date');
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
 await expect(page.locator('#kn')).toHaveValue('<img src=x onerror=alert(1)>');
 expect(errors).toEqual([]);
});

test('headings, date and navigation remain in consistent order across every section',async({page})=>{
 const states=[['k','How was your day?'],['p','What did you notice?'],['insights','The bigger picture.'],['journal-view','Your journal.']];
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
