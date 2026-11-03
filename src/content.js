// Adds a "Myopia Prediction" button to the patient header's button row and a panel for the chart.
(function () {
  if (document.getElementById('vdc-panel')) return;

  const panel = document.createElement('section');
  panel.id = 'vdc-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <header>
      <h2>Myopia prediction</h2>
      <button type="button" class="vdc-close" aria-label="Close">×</button>
    </header>
    <div class="vdc-body"></div>`;
  const title = panel.querySelector('h2');
  const body = panel.querySelector('.vdc-body');

  function showMessage(text, className) {
    body.replaceChildren();
    const p = document.createElement('p');
    if (className) p.className = className;
    p.textContent = text;
    body.appendChild(p);
    return p;
  }

  async function render() {
    title.textContent = 'Myopia prediction';
    showMessage('Loading patient data…');
    try {
      const patient = await globalThis.VDCRevolution.getCurrentPatient();
      title.textContent = `Myopia prediction — ${patient.name}`;
      globalThis.VDCChart.renderPatient(body, patient);
    } catch (err) {
      showMessage(err.message, 'vdc-error');
    }
  }

  function toggle() {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) render();
  }

  // Mirrors the header's own markup: each button sits in a <maj-button> wrapper, separated by spaces.
  function ensureHeaderButton() {
    if (document.getElementById('vdc-header-button')) return;
    const anchor = document.querySelector('pms-patient-header [data-test-id="imaging-patient-header-button"]');
    const anchorWrapper = anchor && anchor.closest('maj-button');
    if (!anchorWrapper) return;

    const wrapper = document.createElement('maj-button');
    wrapper.className = anchorWrapper.className;
    wrapper.style.display = 'inline-block';
    const button = document.createElement('button');
    button.id = 'vdc-header-button';
    button.type = 'button';
    button.className = anchor.className;
    button.textContent = 'Myopia Prediction';
    button.addEventListener('click', toggle);
    wrapper.appendChild(button);
    anchorWrapper.after(document.createTextNode(' '), wrapper);
  }

  panel.querySelector('.vdc-close').addEventListener('click', () => (panel.hidden = true));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) panel.hidden = true;
  });
  document.body.append(panel);

  // RevolutionEHR re-renders the header when the patient changes and routes with history.pushState,
  // which fires no event a content script can hear. Watch the DOM instead, at most once per frame.
  let lastPatient = globalThis.VDCRevolution.currentPatientId();
  let scheduled = false;
  function onDomChange() {
    scheduled = false;
    ensureHeaderButton();
    const patient = globalThis.VDCRevolution.currentPatientId();
    if (patient !== lastPatient) {
      lastPatient = patient;
      panel.hidden = true;
    }
  }
  new MutationObserver(() => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(onDomChange);
    }
  }).observe(document.body, { childList: true, subtree: true });
  ensureHeaderButton();
})();
