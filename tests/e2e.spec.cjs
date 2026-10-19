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
