// One-click "Run sample" for every tool. build.js injects each function into its
// page as window.demoSample; the shell's Run sample button calls it. Each one drives
// the page's own controls, so the output is exactly what a user would get.
module.exports = {
  'onboarding-decks': async function () {
    var sel = document.getElementById('empSelect');
    var opt = [].filter.call(sel.options, function (o) { return o.value === 'Jordan Avery'; })[0] || sel.options[0];
    if (opt) { sel.value = opt.value; onEmpChange(); }
    await wait(500);
    var b = document.querySelector('.board'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  'audience-tracker': async function () {
    location.hash = ''; route(); await wait(700);
    var pick = function (name) { return [].filter.call(document.querySelectorAll('.card.link'), function (c) { return c.textContent.indexOf(name) >= 0; })[0] || document.querySelector('.card.link'); };
    var a = pick('Northwind'); if (a) a.click(); await wait(800);
    var c = pick('Maple Motors'); if (c) c.click();
  },

  'taxonomy': async function () {
    var i = document.getElementById('searchInput');
    i.value = 'luxury travel'; i.dispatchEvent(new Event('input'));
    await doSearch();
  },

  'survey-conversion': async function () {
    await useSample(document.querySelector('[onclick^="useSample"]'));
    await wait(300);
    document.getElementById('runBtn').click();
  },

  'streamed-media': async function () {
    document.getElementById('sampleBtn').click(); await wait(300);
    await run();
  },

  'ca-geo': async function () {
    useSampleFSAs(); loadFSAs(); await wait(1200);
    confirmAndNext(); await wait(400);
    goToMap(); await wait(800);
    var ds = document.getElementById('mapDataset'); ds.value = 'Demographics'; ds.dispatchEvent(new Event('change'));
    await wait(1000);
    selectTrait('Households Income $125,000 and Over', 'Households Income $125,000 and Over');
  },

  'ca-geo-fsaldu': async function () {
    var $ = function (id) { return document.getElementById(id); };
    var has = function (sel, v) { return [].some.call($(sel).options, function (o) { return o.value === v; }); };
    if (!connected) $('btn-connect').click();
    await until(function () { return has('db', 'DEMO_WAREHOUSE'); });
    $('db').value = 'DEMO_WAREHOUSE'; await $('db').onchange();
    $('sch').value = 'CLIENT_DATA'; await $('sch').onchange();
    $('tbl').value = 'CLIENT_CRM_CUSTOMERS'; await $('tbl').onchange();
    $('label').value = 'CRM customers';
    $('btn-check').click(); await wait(1400);
    $('btn-run').click();
    $('c-run').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  'us-geo': async function () {
    var r = await fetch('/us-geo/api/demo-sample?seg=1');
    setFile(new File([await r.blob()], 'Sample_Export_Outdoor_Adventure_Seekers.xlsx'));
    await fetchPreviewStats();
    document.getElementById('dSample').click(); await wait(2500);
    document.getElementById('dRun').click();
  },

  'cross-impute': async function () {
    await useSample(); await wait(300);
    document.getElementById('runBtn').click();
  },

  'dmp-insights': async function () {
    await useSample(); await wait(500);
    document.getElementById('runBtn').click();
  },

  '1p-modeling': async function () {
    var $ = function (id) { return document.getElementById(id); };
    if (!$('dbSelect').value) { await doConnect(); await wait(800); }
    $('dbSelect').value = 'DEMO_WAREHOUSE'; await loadSchemas('COMPANY_DATA'); await wait(300);
    await openPreview('HOUSEHOLD_ATTRIBUTES'); setAsBase();
    $('schemaSelect').value = 'CLIENT_DATA';
    await openPreview('CLIENT_CRM_CUSTOMERS'); setAsClient();
    $('schemaSelect').value = 'COMPANY_DATA';
    await testJoin();
    await trainLookalike();
    await previewDistribution();
    $('lkResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
