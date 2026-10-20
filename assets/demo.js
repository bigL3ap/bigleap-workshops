/* Sample answers for rehearsal and slide previews. Only used when a page is opened with ?demo=1.
   Clearly labelled "Sample data" on the wall. Not real responses. */
window.BL_DEMO = function (activity) {
  var G = ['a', 'b', 'c'], T = ['Sales', 'Marketing', 'Operations & fulfillment', 'Customer service', 'Leadership'];
  var n = 0;
  function row(p, i) { n++; return { cid: 'demo' + n, ts: '2026-11-03T09:' + (40 + (n % 19)) + ':00Z', group: G[i % 3], team: T[i % 5], activity: activity, payload: p }; }
  var D = {
    pulse: function () {
      var w = ['clunky','scattered','manual','fine','clunky','overwhelming','improving','clicks','scattered','hopeful','clunky','messy','okay','busy','manual','duplicated','getting-there','scattered','slow','clunky','fragmented','manual'];
      var s = [2,2,1,3,2,1,4,2,2,3,2,1,3,2,2,1,4,2,3,2,2,1];
      return w.map(function (x, i) { return row({ word: x, score: s[i] }, i); });
    },
    friction: function () {
      var f = [
        ['inquiry','process',3,'Swatch orders come in and nobody is sure whose they are, so follow-up waits.'],
        ['inquiry','comm',2,'Inquiries land in different inboxes and get forwarded around before anyone answers.'],
        ['qualify','process',3,'Deciding who gets a lead is a judgment call every time, so it depends on who is triaging.'],
        ['qualify','process',2,'Trade approvals get rotated between reps by hand.'],
        ['opp','data',3,'The quote is in Acumatica, the emails are in Outlook, so nobody sees the whole project.'],
        ['opp','process',3,'When a project stalls there is no defined next step, so it just sits.'],
        ['sale','data',2,'Two systems show different versions of the same customer.'],
        ['handoff','comm',3,'Project details reach operations by email, and sometimes not at all.'],
        ['customer','comm',2,'Customers repeat their story when they call a different person.'],
        ['repeat','data',2,'We don’t notice when a good client has gone quiet.'],
        ['aware','data',2,'Marketing can’t tell which campaigns turn into offline sales.'],
        ['inquiry','data',1,'Phone calls create contacts with no name, just a number.'],
        ['qualify','comm',2,'Sales doesn’t know what the customer already did with marketing.'],
        ['opp','comm',2,'Following up depends on someone remembering to do it.'],
        ['handoff','process',2,'Nobody owns the moment between “order placed” and “in production”.']
      ];
      return f.map(function (x, i) { return row({ stage: x[0], bucket: x[1], hurt: x[2], text: x[3], lost: ['time'] }, i); });
    },
    fixit: function () {
      return [
        { problem:'Swatch orders come in and sales doesn’t always know, so follow-up waits.', trigText:'A swatch or web order comes in', actText:['Assign the right owner','Create a task with a due date','Alert the right person or team'], owner:'Sales', human:'a personal note about their project', measText:'Faster first response', phases:['p24'] },
        { problem:'Handoffs to the next team depend on an email or someone’s memory.', trigText:'A project is won or an order is placed', actText:['Package the history for the next team','Create a task with a due date'], owner:'Operations & fulfillment', human:'', measText:'Handoffs without repeat questions', phases:['p25'] },
        { problem:'We can’t see which marketing creates customers.', trigText:'A project is won or an order is placed', actText:['Update the other system so both match','Count it in a dashboard'], owner:'Marketing', human:'decide where to spend next quarter', measText:'Which marketing drove the sale', phases:['p22','p3'] },
        { problem:'Quotes go quiet and nobody notices for weeks.', trigText:'Nothing happens for a few days', actText:['Remind the owner if it goes quiet','Move it to the next stage'], owner:'Sales', human:'a check-in call', measText:'Every project has a next step', phases:['p25'] }
      ].map(function (p, i) { return row(p, i); });
    },
    robot: function () {
      var out = [], ids = ['log','swatch','rotate','p1','note','copy','fiber','confirm','quiet','negotiate','weekly','lapsed','delay','focus','ai'];
      var lean = { log:'r', swatch:'r', rotate:'r', p1:'r', note:'h', copy:'r', fiber:'h', confirm:'r', quiet:'b', negotiate:'h', weekly:'r', lapsed:'b', delay:'h', focus:'h', ai:'h' };
      var M = { r:'robot', h:'human', b:'both' };
      var own = [['Matching order emails to the right customer',90],['Copying inquiry details into a new email',60],['Updating deal stages at the end of the month',45],['Building my weekly numbers',120],['Looking up past orders before a call',60],['Chasing who owns a lead',30]];
      var inst = ['More time with designers on new projects','Visiting key accounts','Following up on the big hospitality bids','Actually calling people back the same day'];
      for (var i = 0; i < 18; i++) {
        var s = {}; ids.forEach(function (id, j) { var base = M[lean[id]]; s[id] = ((i + j) % 6 === 0) ? 'both' : ((i + j) % 9 === 0 ? (base === 'robot' ? 'human' : 'robot') : base); });
        out.push(row({ sorts: s, own: i < 6 ? [{ text: own[i][0], minutes: own[i][1] }] : [], instead: i < 4 ? inst[i] : '' }, i));
      }
      return out;
    },
    moves: function () {
      var picks = [['owner','view','followup'],['owner','speed','handoff'],['view','calls','source'],['owner','pipeline','followup'],['inbox','owner','view'],['source','dash','view'],['handoff','view','owner'],['speed','owner','followup'],['view','pipeline','handoff'],['owner','inbox','followup']];
      var a = [
        { know:'Which customers are about to reorder', auto:'Assigning swatch orders', remember:'Following up on samples' },
        { know:'What a customer already asked marketing', auto:'Logging emails', remember:'Handing a project to operations' },
        { know:'Which campaigns lead to real orders', auto:'Weekly reporting', remember:'Checking in after delivery' }
      ];
      return picks.map(function (p, i) { return row({ votes: p, other: i === 2 ? 'Clear inventory availability in HubSpot' : '', answers: a[i] || {} }, i); });
    }
  };
  return D[activity] ? D[activity]() : [];
};
