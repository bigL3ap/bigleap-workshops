const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 2 });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/curran/breakout.html?demo=1', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(700);
  await p.evaluate(() => {
    BL.group = () => 'a';
    BL.submit = () => Promise.resolve();
    const ga = document.getElementById('groupAsk'); if (ga) { ga.hidden = true; ga.style.display = 'none'; }
    document.querySelector('[data-go="3"]').click();
  });
  await p.waitForTimeout(500);

  console.log('step rail:', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('#steps button')].map(b => b.textContent.trim()))));
  console.log('step 3 heading:', await p.evaluate(() => document.querySelector('#s3 h2').textContent));
  console.log('trigger is free text:', await p.evaluate(() => !!document.getElementById('trigtext') && !document.getElementById('trig')));
  console.log('custom action field:', await p.evaluate(() => !!document.getElementById('actother')));
  console.log('custom measure field:', await p.evaluate(() => !!document.getElementById('measother')));

  // fill everything in, including the custom entries
  await p.fill('#trigtext', 'A designer emails asking for three swatches');
  await p.evaluate(() => document.querySelector('#act [data-v]').click());
  await p.fill('#actother', 'Flag the order for the install team');
  await p.evaluate(() => document.querySelector('#own [data-v]').click());
  await p.fill('#measother', 'No designer waits more than a day');
  await p.evaluate(() => document.querySelector('#meas [data-v]').click());
  await p.waitForTimeout(300);

  // step 4 should offer the custom action as a sortable part
  await p.evaluate(() => document.querySelector('[data-go="4"]').click());
  await p.waitForTimeout(400);
  console.log('\nstep 4 sortable parts:', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('#sorter .t')].map(x => x.textContent))));

  // step 5 proposal should show the free text and both custom entries
  await p.evaluate(() => document.querySelector('[data-go="5"]').click());
  await p.waitForTimeout(500);
  const prop = await p.evaluate(() => document.getElementById('prop').innerText);
  console.log('\n--- proposal ---\n' + prop);
  console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no js errors');
  await b.close();
})();
