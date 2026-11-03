// Adds the "Vision projection" button and panel to RevolutionEHR patient pages.
(function () {
  if (document.getElementById('vdc-launcher')) return;

  const launcher = document.createElement('button');
  launcher.id = 'vdc-launcher';
  launcher.type = 'button';
  launcher.textContent = 'Vision projection';

  const panel = document.createElement('section');
  panel.id = 'vdc-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <header>
      <h2>Vision degradation projection</h2>
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

  async function render(allowNavigation) {
    title.textContent = 'Vision degradation projection';
    showMessage('Loading patient data…');
    try {
      const patient = await globalThis.VDCRevolution.getCurrentPatient({ allowNavigation });
      if (!patient) {
        const p = showMessage("This patient's prescriptions haven't been loaded yet. ");
        const load = document.createElement('button');
        load.type = 'button';
        load.textContent = 'Open Rx page and load';
        load.addEventListener('click', () => render(true));
        p.appendChild(load);
        return;
      }
      title.textContent = `Vision degradation projection — ${patient.name}`;
      globalThis.VDCChart.renderProjection(body, globalThis.VDCProjection.buildProjection(patient));
    } catch (err) {
      showMessage(err.message, 'vdc-error');
    }
  }

  function syncVisibility() {
    const onPatient = Boolean(globalThis.VDCRevolution.currentPatientId());
    launcher.hidden = !onPatient;
    if (!onPatient) panel.hidden = true;
  }

  launcher.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) render(false);
  });
  panel.querySelector('.vdc-close').addEventListener('click', () => (panel.hidden = true));
  window.addEventListener('hashchange', syncVisibility);

  document.body.append(launcher, panel);
  syncVisibility();
})();
