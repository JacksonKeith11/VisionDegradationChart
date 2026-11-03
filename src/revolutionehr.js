// Reads the open patient's data from RevolutionEHR using the user's existing session.
// Demographics come from the patient header; prescriptions come from intercept.js, which captures
// the app's own response when the patient's Rx page loads. This file never sends requests itself.
(function (root) {
  const prescriptionsByPatient = new Map();
  const waiters = new Map();

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const msg = event.data;
    if (!msg || msg.source !== 'vdc-intercept') return;
    prescriptionsByPatient.set(msg.patientId, msg.prescriptions);
    for (const resolve of waiters.get(msg.patientId) || []) resolve(msg.prescriptions);
    waiters.delete(msg.patientId);
  });

  function currentPatientId() {
    const match = /#\/patients\/patient\/(\d+)/.exec(location.hash);
    return match ? match[1] : null;
  }

  function rxPageHash(patientId) {
    return `#/patients/patient/${patientId}/prescription/eyeglass/eyeglass-prescription-list`;
  }

  function headerText(testId) {
    const el = document.querySelector(`pms-patient-header [data-test-id="${testId}"]`);
    return el ? el.textContent.trim() : '';
  }

  function readDemographics() {
    const idEl = document.querySelector('pms-patient-header [data-test-id="patientHeaderPatientId"]');
    const nameNode = idEl && [...idEl.parentElement.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    const dobMatch = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(headerText('patientHeaderDateOfBirth'));
    if (!dobMatch) throw new Error("Couldn't find the patient's date of birth in the patient header.");
    const [, mm, dd, yyyy] = dobMatch;
    const gender = headerText('patientHeaderGender').toLowerCase();
    return {
      name: nameNode ? nameNode.textContent.trim() : 'patient',
      dob: `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`,
      sex: gender === 'female' ? 'F' : gender === 'male' ? 'M' : null,
    };
  }

  // One exam per date; prescriptions without a sphere value (e.g. plano-only drafts) are skipped per eye in projection.js.
  function toExams(prescriptions) {
    const byDate = new Map();
    for (const p of prescriptions) if (p.date) byDate.set(p.date, { date: p.date, od: p.od, os: p.os });
    return [...byDate.values()];
  }

  // Opens the patient's Rx page, which makes RevolutionEHR load the prescription history.
  function loadPrescriptions(timeoutMs = 20000) {
    const id = currentPatientId();
    if (!id) return Promise.reject(new Error('Open a patient first.'));
    if (prescriptionsByPatient.has(id)) return Promise.resolve(prescriptionsByPatient.get(id));
    return new Promise((resolve, reject) => {
      const list = waiters.get(id) || [];
      list.push(resolve);
      waiters.set(id, list);
      setTimeout(() => reject(new Error("RevolutionEHR didn't return this patient's prescriptions. Open their Rx page and try again.")), timeoutMs);
      if (location.hash !== rxPageHash(id)) location.hash = rxPageHash(id);
    });
  }

  // Switches to the patient's Rx page if the prescriptions haven't been captured yet.
  async function getCurrentPatient() {
    const id = currentPatientId();
    if (!id) throw new Error('Open a patient in RevolutionEHR to see their projection.');
    const prescriptions = await loadPrescriptions();
    const exams = toExams(prescriptions);
    if (exams.length === 0) throw new Error('This patient has no eyeglass prescriptions on record.');
    return { ...readDemographics(), exams };
  }

  root.VDCRevolution = { currentPatientId, getCurrentPatient };
})(globalThis);
