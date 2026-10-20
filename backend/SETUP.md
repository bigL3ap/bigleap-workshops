# Turn on the live results wall (about 5 minutes)

The workshop pages work without this step: they run in **demo mode**, where answers stay on each person's phone. To make answers appear live on the projector, connect a Google Sheet once.

The sheet is already created: **Curran Workshop · Live Results** (in Drive under Curran → RevOps → Curran Workshop · Nov 3, 2026).

1. Open the sheet, then **Extensions → Apps Script**.
2. Delete what's in `Code.gs` and paste in everything from [`apps-script.gs`](apps-script.gs). Save.
3. In the function dropdown, choose **setup** and click **Run**. Approve the permissions prompt. This only lets the script write to this one sheet.
4. Click **Deploy → New deployment**, then the gear icon → **Web app**.
   - Description: `Curran workshop`
   - Execute as: **Me**
   - Who has access: **Anyone**. Phones in the room aren't signed in, so this is required. The script only accepts this workshop's answers.
5. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
6. Paste the URL into `assets/config.js` as the `endpoint` value, then commit. Or send it to Claude to do.

## Rehearse

- Add `?demo=1` to any wall link to see it with sample data, e.g. `curran/wall.html?view=friction&demo=1`.
- Before the session, open the wall, submit a test answer from your phone, and watch it appear within 5 seconds.
- Clear the test rows in the sheet afterwards. Keep the header row.

## During the session

- **Hide one answer** from the wall on the projector: click the × on it. This only hides it on that laptop.
- **Hide an answer everywhere:** type `x` in its `hidden` column in the sheet.
- **Hide answers / Reveal answers** (top right of the wall) blurs everyone's text until you're ready to discuss it.

## After the session

The sheet is the full, anonymous record of what the room said, sorted by activity, group and team. Use it for the follow-up summary and quick-win list.

To stop collecting answers, open Apps Script → **Deploy → Manage deployments** → archive the deployment.
