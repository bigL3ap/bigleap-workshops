# Big Leap workshops

Interactive, mobile-first toolkits used during live Big Leap client workshops. Participants scan a QR code on a slide; answers appear on a results wall on the projector.

**Live site:** https://bigl3ap.github.io/bigleap-workshops/ (noindex; anyone with the link can view)

## Curran × Big Leap RevOps workshop (Nov 3, 2026, Seattle)

| Page | Used for | Link |
|---|---|---|
| `curran/index.html` | Participant hub: pick your group and team, see all activities and what happens next | [open](https://bigl3ap.github.io/bigleap-workshops/curran/) |
| `curran/pulse.html` | Warm-up: one word + "system works for me" scale | [open](https://bigl3ap.github.io/bigleap-workshops/curran/pulse.html) |
| `curran/map.html` | Journey × systems explorer (presenter) | [open](https://bigl3ap.github.io/bigleap-workshops/curran/map.html) |
| `curran/friction.html` | Breakout 1: Friction Finder | [open](https://bigl3ap.github.io/bigleap-workshops/curran/friction.html) |
| `curran/fixit.html` | Fix-It Builder: trigger → automation → owner → measure | [open](https://bigl3ap.github.io/bigleap-workshops/curran/fixit.html) |
| `curran/robot.html` | Human or Robot? task sort + hours handed back | [open](https://bigl3ap.github.io/bigleap-workshops/curran/robot.html) |
| `curran/first-moves.html` | Closing: three-dot vote + three questions | [open](https://bigl3ap.github.io/bigleap-workshops/curran/first-moves.html) |
| `curran/wall.html?view=…` | Results wall for the projector (`pulse`, `friction`, `fixit`, `robot`, `moves`) | [open](https://bigl3ap.github.io/bigleap-workshops/curran/wall.html) |

- **Live results:** see [backend/SETUP.md](backend/SETUP.md). Until an endpoint is set in `assets/config.js`, pages run in demo mode.
- **Rehearsal:** add `?demo=1` to a wall link for sample data (labelled on screen).
- **Groups, facilitators, teams:** edit `assets/config.js`.
- **Shared content** (journey stages, roadmap steps, tasks, first moves): `assets/workshop.js`.
- **Privacy:** answers are anonymous by design. No names or emails are collected; a random device id is used only to group one person's answers.
- **Tracking:** pages push `workshop_*` events to `dataLayer`. QR links carry `utm_source=workshop&utm_medium=qr&utm_campaign=curran-nov26`.

Brand: Raleway / Open Sans (self-hosted, OFL), navy `#143D55`, blue `#3187B5`, red `#EA4335`, matching bigleap.com and the DIY Toolkits site.
