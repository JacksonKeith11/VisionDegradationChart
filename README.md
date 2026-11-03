# Vision Degradation Chart

A Chrome extension for RevolutionEHR that charts projected myopia progression for the open patient. It uses the user's own logged-in session; no patient data leaves the browser.

For each eye (OD and OS) it plots spherical equivalent (sphere + cylinder/2) against age:

- **Without treatment** — worsens 0.75 D per year until age 18 (female) or 22 (male), then holds steady. If sex is not recorded, 22 is used.
- **With treatment** — a shaded band from no change to 0.25 D worse per year, until the same stop age.
- **Current trend** — a least-squares line through the patient's past refractions, continued to the stop age.

Projections start from the patient's most recent exam.

## Install (unpacked)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose this folder.
3. Open a patient in RevolutionEHR and click **Vision Projection** in the patient header's button row (next to Imaging).

## Preview without RevolutionEHR

`demo.html` renders the chart with fictional sample patients:

```bash
python -m http.server 8765
```

Then open http://localhost:8765/demo.html.

## Layout

| File | Purpose |
| --- | --- |
| `src/projection.js` | Projection math (pure functions) |
| `src/chart.js` | SVG chart rendering |
| `src/intercept.js` | Runs in the page; copies the prescription history when RevolutionEHR loads it |
| `src/revolutionehr.js` | Reads the patient header and the captured prescriptions |
| `src/content.js` | Adds the button and panel to RevolutionEHR pages |

## Patient data

Never commit real patient data. Put any captured pages or responses used for development in `private/`, which is git-ignored.
