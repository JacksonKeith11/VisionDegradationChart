// Runs in the page's own JavaScript context (manifest "world": "MAIN") so it can see RevolutionEHR's requests.
// It only listens: when the app loads a patient's eyeglass prescription history, the refraction values are
// copied and handed to the content script. No requests are sent and nothing is modified.
(function () {
  const RX_HISTORY = /\/prescription\/eyeglass\/findEyeglassPrescriptionHistoryByPatientId\/(\d+)/;

  function pickEye(eye) {
    return eye ? { sphere: eye.sphere, cylinder: eye.cylinder } : null;
  }

  function forward(url, text) {
    const match = RX_HISTORY.exec(url);
    if (!match) return;
    let rows;
    try {
      rows = JSON.parse(text);
    } catch {
      return;
    }
    if (!Array.isArray(rows)) return;
    const prescriptions = rows.map((r) => ({
      date: r.startDate,
      status: r.eyeglassPrescriptionStatus,
      od: pickEye(r.od),
      os: pickEye(r.os),
    }));
    window.postMessage({ source: 'vdc-intercept', patientId: match[1], prescriptions }, location.origin);
  }

  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.addEventListener('load', () => {
      if (this.status === 200 && (this.responseType === '' || this.responseType === 'text')) forward(String(url), this.responseText);
    });
    return open.apply(this, arguments);
  };

  const fetch0 = window.fetch;
  window.fetch = function (input) {
    const promise = fetch0.apply(this, arguments);
    const url = String(input && input.url ? input.url : input);
    if (RX_HISTORY.test(url)) {
      promise.then((r) => r.ok && r.clone().text().then((t) => forward(url, t))).catch(() => {});
    }
    return promise;
  };
})();
