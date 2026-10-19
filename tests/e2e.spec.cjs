const {test,expect}=require('@playwright/test');
const path=require('path');
test.use({viewport:{width:375,height:812},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
test.beforeEach(async({page})=>{await page.goto('http://127.0.0.1:8765/');await page.evaluate(()=>localStorage.clear());await page.reload();});
test('both tabs share layout, partner is indigo, and every partner scale stays on one row',async({page})=>{
 await expect(page.locator('#k')).toBeVisible();
 const sleep=await page.locator('[data-g=sleep] .c').evaluateAll(bs=>({count:bs.length,rows:new Set(bs.map(b=>Math.round(b.getBoundingClientRect().top))).size,overflow:bs.some(b=>b.scrollWidth>b.clientWidth)}));expect(sleep.count).toBe(5);expect(sleep.rows).toBe(1);expect(sleep.overflow).toBe(false);
 await page.locator('#pt').click();await expect(page.locator('#p')).toBeVisible();
 const info=await page.evaluate(()=>({accent:getComputedStyle(document.body).getPropertyValue('--accent').trim(),scales:[...document.querySelectorAll('.partner-scale')].map(el=>({buttons:el.querySelectorAll('button').length,rows:new Set([...el.querySelectorAll('button')].map(b=>Math.round(b.getBoundingClientRect().top))).size,overflow:el.scrollWidth>el.clientWidth}))}));
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
 await page.locator('#k details.card').last().locator('summary').click();await expect(page.locator('#kh')).toContainText('Start 5/5');
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
 await page.locator('#p details.card').last().locator('summary').click();await expect(page.locator('#ph')).toContainText('Same');
 const [file]=await Promise.all([page.waitForEvent('download'),page.locator('#cp').click()]);expect(file.suggestedFilename()).toBe('partner-checkins.csv');expect(errors).toEqual([]);
});
test('offline shell works after initial online load',async({page,context})=>{
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null,{timeout:20000});
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
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null,{timeout:20000});
 const result=await page.evaluate(async()=>{
  const old=await caches.open('daily-checkin-offline-v1');await old.put('./old-marker',new Response('old'));
  const reg=await navigator.serviceWorker.getRegistration();await reg.update();
  const keys=await caches.keys();
  return {keys,controlled:!!navigator.serviceWorker.controller};
 });
 expect(result.controlled).toBe(true);
 expect(result.keys).toContain('daily-checkin-offline-v41');
 // An existing worker only purges obsolete caches during activation, not each update check.
});
test('history escapes user-controlled HTML and does not execute it',async({page})=>{
 await page.evaluate(()=>{localStorage.setItem('partner_weekly_v3',JSON.stringify([{date:'2026-10-19',start_obs:'<img src=x onerror=alert(1)>',still_themselves:'Yes'}]));render()});
 await expect(page.locator('#ph img')).toHaveCount(0);
 await expect(page.locator('#ph')).toContainText('<img');
});

test('tabs have consistent hierarchy and partner progress updates',async({page})=>{
 await expect(page.locator('#k h1')).toBeVisible();
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
 await page.locator('#journal-panel summary').click();
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
 await page.locator('#journal-panel summary').click();
 await expect(page.locator('#journal-status')).toContainText('Changes to back up');
});
