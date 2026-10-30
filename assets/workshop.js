/* Big Leap workshop toolkits — shared behavior.
   Live mode: answers POST to a Google Apps Script web app (backend/apps-script.gs) and the
   results wall reads them back. Demo mode (no endpoint): answers stay in this browser. */
(function () {
  var C = window.BL_CONFIG || {};
  var LS = { get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
             set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var store = 'bl_ws_' + (C.session || 'default') + '_';

  function cid() {
    var id = LS.get(store + 'cid', null);
    if (!id) { id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); LS.set(store + 'cid', id); }
    return id;
  }
  function track(event, data) {
    window.dataLayer = window.dataLayer || [];
    var o = { event: event, workshop: C.session }; for (var k in (data || {})) o[k] = data[k];
    window.dataLayer.push(o);
  }
  var live = !!C.endpoint;

  var BL = {
    config: C, live: live, cid: cid, track: track,
    params: new URLSearchParams(location.search),
    group: function () { return LS.get(store + 'group', ''); },
    setGroup: function (g) { var prev = LS.get(store + 'group', null); LS.set(store + 'group', g); track('workshop_group', { group: g }); if (g) BL.moveAnswers(g); },
    /* When someone switches groups, everything they answered themselves comes with them: Group Think,
       friction answers and votes. Each one is re-sent under the new group and readers keep only the newest
       copy (see dedupe in load). Shared group work in steps 2 to 5 (drafts and proposals) stays with the group. */
    moveAnswers: function (g) {
      ['pulse', 'friction', 'moves', 'robot'].forEach(function (activity) {
        var mine = BL.mine(activity), moved = [];
        mine.forEach(function (r) { if (r.group !== g) { r.group = g; r.ts = new Date().toISOString(); moved.push(r); } });
        if (!moved.length) return;
        LS.set(store + 'mine_' + activity, mine);
        moved.forEach(function (row) {
          if (!live) { var all = LS.get(store + 'local', []); all.push(JSON.parse(JSON.stringify(row))); LS.set(store + 'local', all); return; }
          fetch(C.endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(row) })
            .catch(function () { var q = LS.get(store + 'retry', []); q.push(row); LS.set(store + 'retry', q); });
        });
      });
    },
    team: function () { return LS.get(store + 'team', ''); },
    setTeam: function (t) { LS.set(store + 'team', t); },
    groupName: function (id) { var g = (C.groups || []).filter(function (x) { return x.id === id; })[0]; return g ? g.name + ' · ' + g.lead : ''; },
    mine: function (activity) { return LS.get(store + 'mine_' + activity, []); },
    clearMine: function (activity) { LS.set(store + 'mine_' + activity, []); },

    submit: function (activity, payload) {
      var row = { session: C.session, activity: activity, group: BL.group(), team: BL.team(), cid: cid(), ts: new Date().toISOString(), payload: payload };
      var mine = BL.mine(activity); mine.push(row); LS.set(store + 'mine_' + activity, mine);
      track('workshop_submit', { activity: activity });
      if (!live) {
        var all = LS.get(store + 'local', []); all.push(row); LS.set(store + 'local', all);
        return Promise.resolve({ ok: true, demo: true });
      }
      // text/plain + no-cors avoids a CORS preflight, which Apps Script can't answer.
      return fetch(C.endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(row) })
        .then(function () { return { ok: true }; })
        .catch(function () {
          var q = LS.get(store + 'retry', []); q.push(row); LS.set(store + 'retry', q);
          return { ok: false };
        });
    },
    flushRetries: function () {
      if (!live) return;
      var q = LS.get(store + 'retry', []); if (!q.length) return;
      LS.set(store + 'retry', []);
      q.forEach(function (row) {
        fetch(C.endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(row) })
          .catch(function () { var r = LS.get(store + 'retry', []); r.push(row); LS.set(store + 'retry', r); });
      });
    },

    load: function (activity) {
      if (BL.params.get('demo') === '1' && window.BL_DEMO) return Promise.resolve(window.BL_DEMO(activity));
      /* One copy per answer: the same person's identical answer (e.g. re-sent after switching groups) keeps only its newest copy. */
      function dedupe(rows) {
        var keep = {}, key = function (r) { return r.cid + '|' + (r.payload && r.payload._id ? r.payload._id : JSON.stringify(r.payload || {})); };
        rows.forEach(function (r) { var k = key(r); if (!keep[k] || String(r.ts) > String(keep[k].ts)) keep[k] = r; });
        return rows.filter(function (r) { return keep[key(r)] === r; });
      }
      if (!live) {
        return Promise.resolve(dedupe(LS.get(store + 'local', []).filter(function (r) { return r.activity === activity; })));
      }
      var url = C.endpoint + '?session=' + encodeURIComponent(C.session) + '&activity=' + encodeURIComponent(activity) + '&t=' + Date.now();
      return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
        return dedupe((j.rows || []).map(function (r) { if (typeof r.payload === 'string') { try { r.payload = JSON.parse(r.payload); } catch (e) { r.payload = {}; } } return r; }));
      });
    },

    toast: function (msg) {
      var t = document.querySelector('.toast');
      if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
      t.textContent = msg; t.classList.add('show');
      clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2600);
    },
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },

    /* Toggle-group helper: buttons with [data-v] inside a container; single or multi select. */
    choice: function (el, opts) {
      opts = opts || {};
      var btns = Array.prototype.slice.call(el.querySelectorAll('[data-v]'));
      btns.forEach(function (b) {
        b.setAttribute('aria-pressed', 'false'); b.type = 'button';
        b.addEventListener('click', function () {
          if (opts.multi) {
            var on = b.getAttribute('aria-pressed') === 'true';
            var count = btns.filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; }).length;
            if (!on && opts.max && count >= opts.max) { BL.toast('Pick up to ' + opts.max); return; }
            b.setAttribute('aria-pressed', on ? 'false' : 'true');
          } else {
            btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          }
          if (opts.onChange) opts.onChange(BL.val(el, opts.multi));
        });
      });
    },
    val: function (el, multi) {
      var on = Array.prototype.slice.call(el.querySelectorAll('[data-v][aria-pressed="true"]')).map(function (b) { return b.getAttribute('data-v'); });
      return multi ? on : (on[0] || '');
    },
    reset: function (el) { el.querySelectorAll('[data-v]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); },

    chrome: function (label) {
      var top = document.querySelector('.top .tag');
      if (top && label) top.innerHTML = '<b>' + BL.esc(C.client || '') + '</b> · ' + BL.esc(label);
      var m = document.getElementById('mode');
      if (m) {
        m.className = 'mode ' + (live ? 'live' : 'demo');
        m.textContent = live ? 'Live: answers go to the room' : 'Demo mode: answers stay on this device';
      }
      var g = document.getElementById('groupLabel');
      if (g) g.textContent = (BL.group() ? BL.groupName(BL.group()) : 'No group picked yet') + (BL.team() ? ' · ' + BL.team() : '');
      BL.flushRetries();
      if (BL.group()) BL.moveAnswers(BL.group()); /* catch up answers added under an earlier group */
      track('workshop_page_view', { page: location.pathname.split('/').pop() || 'index' });
    }
  };

  /* Shared content used by several pages and the results wall. */
  BL.STAGES = [
    { id: 'aware', n: 1, name: 'Awareness', short: 'They find us', who: 'Usually marketing', ex: 'Ads, search, social media, word of mouth' },
    { id: 'inquiry', n: 2, name: 'Inquiry', short: 'They contact us', who: 'Marketing and customer service', ex: 'A form, a swatch order, a call or an email' },
    { id: 'qualify', n: 3, name: 'Qualification', short: 'We figure out who they are', who: 'Whoever sorts new requests', ex: 'Trade or consumer? How urgent? Who should handle it?' },
    { id: 'opp', n: 4, name: 'Opportunity', short: 'We plan the project with them', who: 'Sales', ex: 'Products, samples, sizes and the quote' },
    { id: 'sale', n: 5, name: 'Sale', short: 'They place the order', who: 'Sales and accounting', ex: 'The order, payment and confirmation' },
    { id: 'handoff', n: 6, name: 'Handoff', short: 'We make it and ship it', who: 'Operations', ex: 'Production, shipping and install dates' },
    { id: 'customer', n: 7, name: 'Customer', short: 'We take care of them', who: 'Customer service', ex: 'Questions, updates, problems with an order' },
    { id: 'repeat', n: 8, name: 'Repeat & referral', short: 'They come back or refer us', who: 'Sales and marketing', ex: 'Reorders, new projects, telling a friend' }
  ];

  BL.BUCKETS = [
    { id: 'data', name: 'Missing or wrong information', hint: 'We can’t find it, it’s out of date, or it lives in someone’s inbox.' },
    { id: 'process', name: 'No clear process', hint: 'Nobody owns it, or it depends on who’s working that day.' },
    { id: 'comm', name: 'Someone wasn’t told', hint: 'The right person finds out late, or not at all.' }
  ];
  /* Step-by-step HubSpot plan for a Friction to Flow proposal. Used by the breakout page and the results wall,
     so proposals shared before plans were saved still show one. HubSpot's standard tools only. */
  var HOW_TRIG = {
    form: 'Trigger: <i>Form submission</i>, and pick the website form.',
    swatch: 'Trigger: the form (or property) that marks a swatch or web order, for example a <i>Swatch request</i> form submission.',
    trade: 'Trigger: the property that marks a trade account as approved changes to <i>Approved</i>.',
    inbox: 'First connect the shared inbox to HubSpot (Settings › Inbox › Connect a channel › Team email) so every email becomes a conversation on the right record. Then trigger on the new conversation.',
    call: 'Trigger: a call is logged on the contact. Calls need to be made or logged in HubSpot for this to work.',
    quote: 'Trigger (deal-based workflow): the deal moves to the stage that means a quote was sent.',
    quiet: 'Trigger: <i>Last activity date</i> is more than 3 days ago (pick the number of days that fits).',
    won: 'Trigger (deal-based workflow): the deal stage becomes <i>Closed won</i>.',
    ship: 'Trigger: the order status changes to shipped or delivered. This needs order status in HubSpot, so check that first.',
    lost: 'Trigger (deal-based workflow): the deal stage becomes <i>Closed lost</i>.'
  };
  var HOW_ACT = {
    owner: ['Assign it to the right person', 'Add the action <i>Rotate record to owner</i> (to share work across a team) or <i>Set property value › Owner</i> (for one person).'],
    task: ['Create a to-do with a due date', 'Add the action <i>Create task</i>. Give it a clear title, assign it to the record owner, and set it due in 1 business day.'],
    notify: ['Let the right person or team know', 'Add the action <i>Send internal notification</i> to the owner or team. Use tokens so it shows the customer’s name and what they need.'],
    reply: ['Email the customer a confirmation or follow-up', 'Write the email first (Marketing › Email › Automated), then add the action <i>Send email</i>. Keep it short and personal.'],
    nurture: ['Add the customer to regular check-in emails', 'Add the action <i>Enroll in another workflow</i> that sends a few spaced-out check-in emails, or add them to a list your team emails.'],
    stage: ['Move it to the next step', 'Add the action <i>Set property value</i> to move the lead, lifecycle or deal stage to the next one.'],
    nudge: ['Remind the person in charge if nothing happens', 'Add a <i>Delay</i> (for example 2 business days), then an <i>If/then branch</i>: if there’s been no activity, create a task or send the owner a reminder.'],
    context: ['Pass the full history to the next team', 'Add a <i>Create task</i> or <i>Send internal notification</i> for the next team, with the key details pulled in as tokens. Make sure emails, calls and notes are logged on the record so the history is there.'],
    reason: ['Record the reason (for example, why we lost)', 'Use a dropdown property such as <i>Closed lost reason</i>, and make it required when a deal moves to that stage (pipeline settings › edit stage properties).'],
    log: ['Save the email or call to the customer’s record', 'Have each person connect their inbox to HubSpot and turn on email logging. Make or log calls from HubSpot so they land on the right record.'],
    sync: ['Update the other system so both match', 'Map the matching fields in the integration settings so both systems stay in step. This one usually needs your HubSpot admin or integration partner.'],
    report: ['Count it in a report', 'Create a report (Reporting › Reports › Create report) that counts these records, and add it to your team’s dashboard.']
  };
  BL.buildPlan = function (v) {
    var f = { trig: v.trig, act: v.act, human: v.human }, st = [], E = BL.esc, arr = function (x) { return [].concat(x || []).filter(Boolean); };
    var fmt = function (m) { return m >= 60 ? (Math.round(m / 6) / 10) + (m === 60 ? ' hr / week' : ' hrs / week') : m + ' min / week'; };
    st.push({ t: 'Agree on the problem and who owns the fix', d: (v.problem ? E(v.problem.replace(/\s+$/, '')) + (/[.!?]$/.test(v.problem.trim()) ? '' : '.') : 'Write the problem in one sentence that everyone agrees on.') + (v.owner ? ' In charge: ' + E(v.owner) + '.' : ' Name one person or team who owns the fix.') });
    st.push({ t: 'Write down today’s number before you change anything', d: v.measText ? 'So you can tell if it worked: ' + E(v.measText) + '.' : 'Pick one number that should get better, such as how fast customers hear back, and write down where it is today.' });
    var trig = arr(f.trig);
    st.push({ t: 'Create the workflow', d: 'In HubSpot go to Automation › Workflows › Create workflow › From scratch. ' + (trig.length ? trig.map(function (t) { return HOW_TRIG[t]; }).join(' Or: ') : 'Then choose the trigger: the event that should start it, such as a form submission, a deal moving to a new stage, or a property changing.') });
    f.act = arr(f.act);
    (f.act || []).forEach(function (a) { var h = HOW_ACT[a]; if (h) st.push({ t: h[0], d: h[1], warn: a === 'sync' || a === 'log' }); });
    if (!(f.act || []).length) st.push({ t: 'Add the actions', d: 'Add what HubSpot should do each time it starts, such as <i>Rotate record to owner</i>, <i>Create task</i> or <i>Send email</i>.' });
    if (f.human) st.push({ t: 'Keep the human part human', d: 'A person still does this: ' + E(f.human) + '. Write it into the team’s routine so it doesn’t get skipped.' });
    st.push({ t: 'Test it, then switch it on', d: 'Run it on a test contact or deal first. Check every action did what you expected, then turn the workflow on.' });
    st.push({ t: 'Check back in 30 days', d: 'Compare against the number you wrote down. Adjust the timing or the wording, and share the result with your team.' + (v.minutes ? ' Target: about ' + fmt(v.minutes).toLowerCase() + ' back.' : '') });
    return st;
  };

  /* Proposed roadmap sequence (staff-facing wording, no figures). */
  BL.ROADMAP = [
    { id: 'p21', when: 'Now – mid Nov', name: 'A clean foundation', what: 'Access and roles, cleaner contact records, email logging and shared inboxes connected.' },
    { id: 'p22', when: 'Mid Nov – mid Dec', name: 'HubSpot and Acumatica in sync', what: 'One reliable connection between the two systems, with a short planned pause to switch over.' },
    { id: 'p23', when: 'Mid Dec – mid Jan', name: 'Phones move into HubSpot', what: 'Calls made and logged in HubSpot, on the right customer record, before Aircall ends.' },
    { id: 'p24', when: 'Mid Jan – mid Feb', name: 'Leads that route themselves', what: 'New inquiries reach the right person, with an owner and a due date, without hand-sorting.' },
    { id: 'p25', when: 'Mid Feb – mid Mar', name: 'One pipeline that matches how we sell', what: 'Clear stages, an obvious next step, and follow-up that does not depend on memory.' },
    { id: 'p3', when: 'Mid Mar – mid Apr', name: 'Reporting we trust', what: 'A short set of dashboards for each team, and marketing connected to sales that close offline.' }
  ];

  BL.TASKS = [
    { id:'log', t:'Logging a customer email into HubSpot' },
    { id:'swatch', t:'Deciding who owns a new swatch order' },
    { id:'rotate', t:'Rotating new trade accounts between reps' },
    { id:'p1', t:'Reminding a rep that an urgent lead is waiting' },
    { id:'note', t:'Writing a personal note to a designer about their project' },
    { id:'copy', t:'Copying order details from one system into another' },
    { id:'fiber', t:'Recommending the right fiber for a busy hotel lobby' },
    { id:'confirm', t:'Sending a “we got your request” confirmation' },
    { id:'quiet', t:'Following up when a quote has gone quiet for a week' },
    { id:'negotiate', t:'Negotiating pricing on a multi-property hospitality project' },
    { id:'weekly', t:'Pulling together the weekly sales numbers' },
    { id:'lapsed', t:'Noticing that a long-time client has gone quiet' },
    { id:'delay', t:'Calling a customer whose delivery is delayed' },
    { id:'focus', t:'Deciding which accounts to focus on this quarter' },
    { id:'ai', t:'Checking an AI-drafted email before it goes to a client' }
  ];

  /* First Moves options, each tied to the proposed roadmap step it would land in. */
  BL.MOVES = [
    { id:'owner', t:'Every new inquiry and swatch order gets an owner automatically', p:'p24' },
    { id:'speed', t:'A clear response standard, with a nudge when it’s missed', p:'p24' },
    { id:'view', t:'One view of a customer: orders, quotes, emails and calls together', p:'p22' },
    { id:'calls', t:'Calls logged to the right customer, automatically', p:'p23' },
    { id:'inbox', t:'Shared inboxes connected, so no inquiry gets lost', p:'p21' },
    { id:'pipeline', t:'A simple pipeline where the next step is always obvious', p:'p25' },
    { id:'followup', t:'Automatic follow-up when a project goes quiet', p:'p25' },
    { id:'handoff', t:'A smooth handoff from sale to delivery, with full context', p:'p25' },
    { id:'source', t:'Seeing which marketing actually brings in customers', p:'p3' },
    { id:'dash', t:'A few simple dashboards each team trusts', p:'p3' }
  ];
  BL.QUESTIONS = [
    { id:'know', t:'What should we know that we don’t know today?' },
    { id:'auto', t:'What should happen automatically that currently needs a person?' },
    { id:'remember', t:'Where does the customer experience depend too much on someone remembering?' }
  ];
  window.BL = BL;
})();
