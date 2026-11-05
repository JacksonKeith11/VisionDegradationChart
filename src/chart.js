// Renders a projection (from projection.js) as inline SVG. No external libraries:
// Manifest V3 extensions can't load remote code, and the chart is simple enough to draw directly.
(function (root) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const W = 520;
  const H = 320;
  const M = { top: 16, right: 16, bottom: 40, left: 52 };
  const COLORS = { untreated: '#c0392b', treated: '#1e8449', trend: '#1f5fbf', grid: '#d9dde3', text: '#333' };

  function el(name, attrs, parent) {
    const node = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
  }

  function niceTicks(min, max, step) {
    const ticks = [];
    for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(+v.toFixed(2));
    return ticks;
  }

  function renderEye(title, data, stopAge) {
    const wrap = document.createElement('figure');
    wrap.className = 'vdc-eye';
    const caption = document.createElement('figcaption');
    caption.textContent = title;
    wrap.appendChild(caption);

    if (!data) {
      const p = document.createElement('p');
      p.textContent = 'No refraction history for this eye.';
      wrap.appendChild(p);
      return wrap;
    }

    const all = [...data.history, ...data.untreated, ...data.treatedBest, ...data.treatedWorst, ...(data.trend ? data.trend.points : [])];
    const xMin = Math.floor(data.range.startAge);
    const xMax = Math.ceil(data.range.endAge);
    let yMin = Math.floor(Math.min(...all.map((p) => p.se)) * 2) / 2 - 0.5;
    let yMax = Math.ceil(Math.max(...all.map((p) => p.se)) * 2) / 2 + 0.5;
    const yStep = yMax - yMin > 8 ? 2 : yMax - yMin > 4 ? 1 : 0.5;

    const x = (age) => M.left + ((age - xMin) / (xMax - xMin)) * (W - M.left - M.right);
    // Flipped axis: more myopic (more negative) is higher, so worsening lines go up.
    const y = (se) => M.top + ((se - yMin) / (yMax - yMin)) * (H - M.top - M.bottom);
    const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.age).toFixed(1)},${y(p.se).toFixed(1)}`).join('');

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `${title} projected spherical equivalent by age` });

    for (const t of niceTicks(yMin, yMax, yStep)) {
      el('line', { x1: M.left, x2: W - M.right, y1: y(t), y2: y(t), stroke: COLORS.grid }, svg);
      el('text', { x: M.left - 6, y: y(t) + 4, 'text-anchor': 'end', 'font-size': 11, fill: COLORS.text }, svg).textContent = t.toFixed(2);
    }
    const xStep = xMax - xMin > 15 ? 2 : 1;
    for (const t of niceTicks(xMin, xMax, xStep)) {
      el('text', { x: x(t), y: H - M.bottom + 16, 'text-anchor': 'middle', 'font-size': 11, fill: COLORS.text }, svg).textContent = t;
    }
    el('text', { x: (M.left + W - M.right) / 2, y: H - 6, 'text-anchor': 'middle', 'font-size': 12, fill: COLORS.text }, svg).textContent = 'Age (years)';
    el('text', { x: 14, y: (M.top + H - M.bottom) / 2, 'text-anchor': 'middle', 'font-size': 12, fill: COLORS.text, transform: `rotate(-90 14 ${(M.top + H - M.bottom) / 2})` }, svg).textContent = 'SE (D), more myopic ↑';

    if (stopAge >= xMin && stopAge <= xMax) {
      el('line', { x1: x(stopAge), x2: x(stopAge), y1: M.top, y2: H - M.bottom, stroke: '#888', 'stroke-dasharray': '3 3' }, svg);
      el('text', { x: x(stopAge) - 4, y: H - M.bottom - 6, 'text-anchor': 'end', 'font-size': 10, fill: '#666' }, svg).textContent = `progression stops (${stopAge})`;
    }

    // Treatment band: area between the best (0/yr) and worst (-0.25/yr) cases.
    const band = path(data.treatedBest) + data.treatedWorst.slice().reverse().map((p) => `L${x(p.age).toFixed(1)},${y(p.se).toFixed(1)}`).join('') + 'Z';
    el('path', { d: band, fill: COLORS.treated, 'fill-opacity': 0.18 }, svg);
    el('path', { d: path(data.treatedBest), fill: 'none', stroke: COLORS.treated, 'stroke-width': 1.5 }, svg);
    el('path', { d: path(data.treatedWorst), fill: 'none', stroke: COLORS.treated, 'stroke-width': 1.5 }, svg);
    el('path', { d: path(data.untreated), fill: 'none', stroke: COLORS.untreated, 'stroke-width': 2 }, svg);
    if (data.trend) el('path', { d: path(data.trend.points), fill: 'none', stroke: COLORS.trend, 'stroke-width': 2, 'stroke-dasharray': '6 4' }, svg);

    for (const p of data.history) {
      const dot = el('circle', { cx: x(p.age), cy: y(p.se), r: 3.5, fill: COLORS.trend }, svg);
      el('title', {}, dot).textContent = `${p.date}: ${p.se.toFixed(2)} D (age ${p.age.toFixed(1)})`;
    }

    wrap.appendChild(svg);
    const note = document.createElement('p');
    note.className = 'vdc-note';
    note.textContent = data.trend
      ? `Historical trend: ${data.trend.slope.toFixed(2)} D/yr from ${data.history.length} exams.`
      : 'Only one exam on record, so there is no historical trend yet.';
    const lastAge = data.history[data.history.length - 1].age;
    if (lastAge >= stopAge) {
      note.textContent += ` The last exam was at age ${Math.floor(lastAge)}, after progression is expected to stop (${stopAge}), so the with- and without-treatment projections are flat and overlap.`;
    }
    wrap.appendChild(note);
    return wrap;
  }

  function legend() {
    const ul = document.createElement('ul');
    ul.className = 'vdc-legend';
    for (const [color, label, dash] of [
      [COLORS.untreated, 'Without treatment (age-based rate)', ''],
      [COLORS.treated, 'With treatment (0 to −0.25 D/yr)', ''],
      [COLORS.trend, 'Current trend from history', '6 4'],
    ]) {
      const li = document.createElement('li');
      li.innerHTML = `<svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="${color}" stroke-width="3" stroke-dasharray="${dash}"/></svg>`;
      li.appendChild(document.createTextNode(label));
      ul.appendChild(li);
    }
    return ul;
  }

  const fmtRate = (r) => `${r < 0 ? '−' : ''}${Math.abs(r).toFixed(2)}`;

  function bandLabel(b) {
    if (b.from === 0) return `to age ${b.to - 1}`;
    if (b.to === Infinity) return `age ${b.from}+`;
    return `ages ${b.from}–${b.to - 1}`;
  }

  // One line listing the without-treatment rates used for this patient.
  function rateSummary(projection) {
    const p = document.createElement('p');
    p.className = 'vdc-rates';
    const who = [];
    if (projection.sexKnown) who.push(projection.stopAge === 18 ? 'female' : 'male');
    if (projection.asian) who.push('Asian');
    const prefix = who.length ? `Without-treatment rates (${who.join(', ')})` : 'Without-treatment rates';
    p.textContent = `${prefix}: ` + projection.bands.map((b) => `${fmtRate(b.rate)} D/yr ${bandLabel(b)}`).join(' · ') + '.';
    return p;
  }

  function renderProjection(container, projection) {
    container.replaceChildren();
    container.appendChild(legend());
    container.appendChild(rateSummary(projection));
    if (!projection.sexKnown) {
      const warn = document.createElement('p');
      warn.className = 'vdc-warn';
      warn.textContent = `Patient sex isn't recorded as female or male, so the faster (female) rate is used and progression is assumed to continue until age ${projection.stopAge}.`;
      container.appendChild(warn);
    }
    const row = document.createElement('div');
    row.className = 'vdc-eyes';
    row.appendChild(renderEye('Right eye (OD)', projection.eyes.od, projection.stopAge));
    row.appendChild(renderEye('Left eye (OS)', projection.eyes.os, projection.stopAge));
    container.appendChild(row);
  }

  // Patient options (the Asian checkbox) above the chart; changing them redraws the chart.
  function renderPatient(container, patient) {
    container.replaceChildren();
    const controls = document.createElement('div');
    controls.className = 'vdc-controls';
    const label = document.createElement('label');
    const asian = document.createElement('input');
    asian.type = 'checkbox';
    label.append(asian, ` Asian (progresses ${Math.abs(root.VDCProjection.ASIAN_EXTRA_RATE).toFixed(2)} D/yr faster)`);
    controls.appendChild(label);
    const chart = document.createElement('div');
    container.append(controls, chart);

    const draw = () => renderProjection(chart, root.VDCProjection.buildProjection(patient, { asian: asian.checked }));
    asian.addEventListener('change', draw);
    draw();
  }

  root.VDCChart = { renderProjection, renderPatient };
})(globalThis);
