/**
 * Big Leap workshop results — Google Apps Script web app.
 *
 * Receives anonymous answers from the workshop pages (POST) and serves them back to the
 * results wall (GET). Setup steps are in backend/SETUP.md.
 *
 * Sheet columns: received_at | session | activity | group | team | client_id | client_ts | payload | hidden
 * To pull an answer off the wall for everyone, type x in its "hidden" column.
 */
var SHEET_NAME = 'responses';
var ALLOWED_SESSIONS = ['curran-nov26'];          // add future workshop sessions here
var ALLOWED_ACTIVITIES = ['pulse', 'friction', 'fixit', 'robot', 'moves'];
var MAX_PAYLOAD = 6000;

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['received_at', 'session', 'activity', 'group', 'team', 'client_id', 'client_ts', 'payload', 'hidden']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(s, n) { return String(s == null ? '' : s).slice(0, n || 80); }

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (ALLOWED_SESSIONS.indexOf(d.session) < 0) return json_({ ok: false, error: 'session' });
    if (ALLOWED_ACTIVITIES.indexOf(d.activity) < 0) return json_({ ok: false, error: 'activity' });
    var payload = JSON.stringify(d.payload || {});
    if (payload.length > MAX_PAYLOAD) return json_({ ok: false, error: 'too large' });
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet_().appendRow([new Date(), d.session, d.activity, clean_(d.group, 10), clean_(d.team, 40), clean_(d.cid, 40), clean_(d.ts, 40), payload, '']);
    } finally { lock.releaseLock(); }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  var session = (e.parameter && e.parameter.session) || '';
  var activity = (e.parameter && e.parameter.activity) || '';
  if (ALLOWED_SESSIONS.indexOf(session) < 0) return json_({ rows: [] });
  var values = sheet_().getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var v = values[i];
    if (v[1] !== session) continue;
    if (activity && v[2] !== activity) continue;
    if (String(v[8]).trim()) continue;                // hidden by a facilitator
    rows.push({ activity: v[2], group: v[3], team: v[4], cid: v[5], ts: v[6], payload: v[7] });
  }
  return json_({ rows: rows });
}

/** Run once from the editor to create the sheet tab and check permissions. */
function setup() { sheet_(); }
