# Vision Degradation Chart

A Google Chrome extension for RevolutionEHR that charts the projected myopia progression of the patient you have open. It works inside your existing RevolutionEHR login and adds a **Vision Projection** button to the patient header.

For each eye (OD and OS), the chart plots spherical equivalent (sphere + cylinder ÷ 2) against age:

- **Without treatment** (red) — worsens 0.75 D per year until age 18 for female patients or 22 for male patients, then holds steady. If sex is not recorded, 22 is used.
- **With treatment** (green band) — from no change to 0.25 D worse per year, until the same age.
- **Current trend** (dashed blue) — a best-fit line through the patient's past eyeglass prescriptions, continued to the same age.

Projections start from the patient's most recent eyeglass prescription.

> **Testing version.** This extension is being trialled in the office before wider release. Please report anything that looks wrong or could be improved (see [Feedback](#feedback)).

## Privacy

The extension only runs on RevolutionEHR pages. It reads the patient's name, date of birth, sex and eyeglass prescriptions from the page you are viewing, draws the chart in your browser, and discards the data when the page is closed. It does not store, send, or share patient information anywhere, and it never changes anything in RevolutionEHR.

## Requirements

- Google Chrome on Windows 10/11 or macOS
- A RevolutionEHR login

## Setup on Windows

1. **Download the extension.**
   Go to <https://github.com/JacksonKeith11/VisionDegradationChart>, click the green **Code** button, then click **Download ZIP**.
2. **Extract it to a permanent location.**
   Open your **Downloads** folder, right-click **VisionDegradationChart-main.zip**, choose **Extract All…**, and extract it to your **Documents** folder.
   Chrome loads the extension from this folder every time it starts, so don't delete or move the folder after setup.
3. **Open Chrome's extensions page.**
   In Chrome, type `chrome://extensions` in the address bar and press **Enter**.
4. **Turn on Developer mode.**
   Switch on **Developer mode** in the top-right corner of the page.
5. **Load the extension.**
   Click **Load unpacked** (top-left), browse to **Documents › VisionDegradationChart-main › VisionDegradationChart-main**, and click **Select Folder**.
   Pick the folder that contains the `manifest.json` file. Windows usually creates a folder with the same name inside another one, so you may need to open it twice.
6. **Check it loaded.**
   **Vision Degradation Chart** now appears in the list of extensions with its switch turned on.
7. **Reload RevolutionEHR.**
   If RevolutionEHR is already open, reload the tab (press **F5**) and sign in again.

## Setup on Mac

1. **Download the extension.**
   Go to <https://github.com/JacksonKeith11/VisionDegradationChart>, click the green **Code** button, then click **Download ZIP**.
2. **Move it to a permanent location.**
   Safari and Chrome usually unzip the download automatically. Open **Finder › Downloads**; if you see **VisionDegradationChart-main.zip** rather than a folder, double-click it to unzip it.
   Drag the **VisionDegradationChart-main** folder into your **Documents** folder.
   Chrome loads the extension from this folder every time it starts, so don't delete or move the folder after setup.
3. **Open Chrome's extensions page.**
   In Chrome, type `chrome://extensions` in the address bar and press **Return**.
4. **Turn on Developer mode.**
   Switch on **Developer mode** in the top-right corner of the page.
5. **Load the extension.**
   Click **Load unpacked** (top-left), go to **Documents › VisionDegradationChart-main**, and click **Select**.
   Pick the folder that contains the `manifest.json` file.
6. **Check it loaded.**
   **Vision Degradation Chart** now appears in the list of extensions with its switch turned on.
7. **Reload RevolutionEHR.**
   If RevolutionEHR is already open, reload the tab (press **⌘ R**) and sign in again.

## Using it

1. Sign in to RevolutionEHR in Chrome and open a patient.
2. Click **Vision Projection** in the row of buttons under the patient's name (after **Imaging**).
3. If the patient's prescriptions haven't been loaded yet, RevolutionEHR switches to the patient's **Rx** page to load them, then the chart appears in the middle of the screen.
4. Hover over a blue dot to see the prescription date and value. Close the chart with **×** or the **Esc** key.

The chart is most useful for children and teenagers who are nearsighted and have at least two eyeglass prescriptions a year or more apart. For patients already past the stop age, the with- and without-treatment lines are flat and overlap.

Only eyeglass prescriptions are used; contact lens prescriptions are not included.

## Updating to a new version

1. Download the ZIP again (step 1 of setup).
2. Delete the contents of your existing **VisionDegradationChart-main** folder and replace them with the contents of the new download, keeping the folder in the same place.
3. Go to `chrome://extensions` and click the circular **reload** arrow on **Vision Degradation Chart**.
4. Reload any open RevolutionEHR tabs and sign in again.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| No **Vision Projection** button | Make sure the extension is switched on at `chrome://extensions`, then reload the RevolutionEHR tab. The button only appears once a patient is open. |
| "Manifest file is missing or unreadable" when loading | You selected the wrong folder. Choose the folder that directly contains `manifest.json`. |
| Chrome shows a warning about developer mode extensions | This is expected for extensions installed this way. Dismiss it; don't click **Remove**. |
| The extension shows an error after the folder was moved or deleted | Put the folder back, or remove the extension and repeat setup from step 3. |
| "Couldn't find the patient's date of birth" or the chart never loads | RevolutionEHR may have changed its pages. Please report it (see [Feedback](#feedback)). |
| Reloading RevolutionEHR signs you out | This is normal RevolutionEHR behaviour. Sign in again. |

## Removing it

Go to `chrome://extensions`, click **Remove** on **Vision Degradation Chart**, then delete the **VisionDegradationChart-main** folder.

## Feedback

Please send issues and suggestions to Jackson Keith, or [open an issue on GitHub](https://github.com/JacksonKeith11/VisionDegradationChart/issues). Include what you expected to see and what happened instead. **Don't include patient names or other identifying details** in GitHub issues, because they are public.

---

## For developers

### Preview without RevolutionEHR

`demo.html` renders the chart with fictional sample patients:

```bash
python -m http.server 8765
```

Then open http://localhost:8765/demo.html.

### Layout

| File | Purpose |
| --- | --- |
| `src/projection.js` | Projection math (pure functions) |
| `src/chart.js` | SVG chart rendering |
| `src/intercept.js` | Runs in the page; copies the prescription history when RevolutionEHR loads it |
| `src/revolutionehr.js` | Reads the patient header and the captured prescriptions |
| `src/content.js` | Adds the button and panel to RevolutionEHR pages |

### Patient data

Never commit real patient data. Put any captured pages or responses used for development in `private/`, which is git-ignored.
