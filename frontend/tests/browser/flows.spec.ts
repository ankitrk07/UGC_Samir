import {test,expect} from '@playwright/test';
test('brand experience has every section and stays inside a 360px viewport',async({page})=>{
 await page.route('**/api/backend/stats',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Statistics unavailable.'})}));
 await page.goto('/for-brands');
 await expect(page.getByRole('heading',{level:1})).toContainText('creators.');
 await expect(page.getByRole('heading',{level:1})).not.toContainText('250K');
 await expect(page.getByRole('heading',{name:/Small world/})).toBeAttached();
 await page.setViewportSize({width:360,height:800});
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBeTruthy();
});
test('login validates before sending and reports service failures',async({page})=>{
 await page.goto('/login');
 await page.getByRole('button',{name:/Log in to my hive/}).click();
 await expect(page.getByText('Use a valid email address.')).toBeVisible();
 await page.route('**/api/backend/auth/login',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Test service unavailable.'})}));
 await page.getByLabel('Work email').fill('jordan@example.com');
 await page.getByLabel('Password',{exact:true}).fill('Password123');
 await page.getByRole('button',{name:/Log in to my hive/}).click();
 await expect(page.getByRole('alert').filter({hasText:'Test service unavailable.'})).toContainText('Test service unavailable.');
});
test('demo dashboard filters and creates a local campaign',async({page})=>{
 await page.goto('/dashboard-demo');
 await expect(page.getByText('Everything here is illustrative demo data.',{exact:false})).toBeVisible();
 if(await page.getByRole('button',{name:'Toggle dashboard menu'}).isVisible())await page.getByRole('button',{name:'Toggle dashboard menu'}).click();
 await page.getByRole('navigation',{name:'Dashboard'}).getByRole('button',{name:/Campaigns/}).click();
 await page.getByRole('textbox',{name:'Search campaigns'}).fill('The everyday edit');
 await expect(page.getByRole('row').filter({hasText:'The everyday edit'})).toHaveCount(1);
 await page.getByRole('button',{name:'New campaign',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await dialog.getByLabel('Campaign name').fill('A very good campaign');
 await dialog.getByLabel('The brief').fill('A practical product, a human story, and the people who will actually use it.');
 await dialog.getByRole('button',{name:'Create demo campaign'}).click();
 await expect(page.getByRole('button',{name:/^A very good campaign/})).toBeVisible();
});
test('pricing toggle updates the amount',async({page})=>{
 await page.goto('/pricing');
 await expect(page.getByText('$199',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:/Annually/}).click();
 await expect(page.getByText('$159',{exact:true})).toBeVisible();
});
test('dashboard requires a session',async({page})=>{
 await page.goto('/dashboard');
 await expect(page).toHaveURL(/\/login/);
});
test('creator application requires one social profile',async({page})=>{
 await page.goto('/for-creators#apply');
 await page.getByLabel('Your name').fill('Jordan Creator');
 await page.getByLabel('Email',{exact:true}).fill('jordan@example.com');
 await page.getByLabel('Where are you based?').selectOption('India');
 await page.getByLabel('Your corner of the internet').selectOption('Lifestyle');
 await page.getByRole('button',{name:'Count me in'}).click();
 await expect(page.getByText('Add at least one social handle.')).toBeVisible();
});
