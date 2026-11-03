// Adds the "Vision projection" button and panel to RevolutionEHR pages.
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
  const body = panel.querySelector('.vdc-body');

  async function open() {
    panel.hidden = false;
    body.textContent = 'Loading patient data…';
    try {
      const patient = await globalThis.VDCRevolution.getCurrentPatient();
      panel.querySelector('h2').textContent = `Vision degradation projection — ${patient.name}`;
      globalThis.VDCChart.renderProjection(body, globalThis.VDCProjection.buildProjection(patient));
    } catch (err) {
      body.innerHTML = '';
      const p = document.createElement('p');
      p.className = 'vdc-error';
      p.textContent = err.message;
      body.appendChild(p);
    }
  }

  launcher.addEventListener('click', () => (panel.hidden ? open() : (panel.hidden = true)));
  panel.querySelector('.vdc-close').addEventListener('click', () => (panel.hidden = true));

  document.body.append(launcher, panel);
})();
