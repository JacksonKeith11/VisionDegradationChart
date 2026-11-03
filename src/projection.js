// Myopia progression projections. Pure functions, no DOM access.
// All refraction values are spherical equivalent (SE) in diopters; more negative = more myopic.
(function (root) {
  const UNTREATED_RATE = -0.75; // D per year
  const TREATED_RATE_BEST = 0; // D per year
  const TREATED_RATE_WORST = -0.25; // D per year
  const STOP_AGE = { F: 18, M: 22 };
  const DEFAULT_STOP_AGE = 22; // used when sex is unknown; the later stop age is the more conservative projection
  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

  function sphericalEquivalent(sphere, cylinder) {
    return sphere + (cylinder || 0) / 2;
  }

  function ageAt(dob, date) {
    return (new Date(date) - new Date(dob)) / MS_PER_YEAR;
  }

  function stopAgeFor(sex) {
    return STOP_AGE[sex] ?? DEFAULT_STOP_AGE;
  }

  // Least-squares fit of SE against age. Returns null with fewer than two distinct ages.
  function linearFit(points) {
    const n = points.length;
    if (n < 2) return null;
    const meanX = points.reduce((s, p) => s + p.age, 0) / n;
    const meanY = points.reduce((s, p) => s + p.se, 0) / n;
    let num = 0;
    let den = 0;
    for (const p of points) {
      num += (p.age - meanX) * (p.se - meanY);
      den += (p.age - meanX) ** 2;
    }
    if (den === 0) return null;
    const slope = num / den;
    return { slope, intercept: meanY - slope * meanX };
  }

  // Value after progressing at `rate` from (startAge, startSE), stopping at stopAge.
  function progress(startAge, startSE, rate, age, stopAge) {
    const years = Math.max(0, Math.min(age, stopAge) - Math.min(startAge, stopAge));
    return startSE + rate * years;
  }

  // patient: { dob, sex: 'F' | 'M' | other, exams: [{ date, od: {sphere, cylinder}, os: {sphere, cylinder} }] }
  // Returns per-eye series ready to plot, or null for an eye with no measurements.
  function buildProjection(patient) {
    const stopAge = stopAgeFor(patient.sex);
    const result = { stopAge, sexKnown: patient.sex in STOP_AGE, eyes: {} };

    for (const eye of ['od', 'os']) {
      const history = patient.exams
        .filter((e) => e[eye] && Number.isFinite(e[eye].sphere))
        .map((e) => ({
          date: e.date,
          age: ageAt(patient.dob, e.date),
          se: sphericalEquivalent(e[eye].sphere, e[eye].cylinder),
        }))
        .sort((a, b) => a.age - b.age);

      if (history.length === 0) {
        result.eyes[eye] = null;
        continue;
      }

      const last = history[history.length - 1];
      const startAge = history[0].age;
      const endAge = Math.max(stopAge, last.age) + 2;
      const sampleAges = [last.age];
      for (let a = Math.ceil(last.age); a <= endAge; a++) sampleAges.push(a);
      if (stopAge > last.age && !sampleAges.includes(stopAge)) sampleAges.push(stopAge);
      sampleAges.sort((a, b) => a - b);

      const line = (rate) => sampleAges.map((age) => ({ age, se: progress(last.age, last.se, rate, age, stopAge) }));

      const fit = linearFit(history);
      let trend = null;
      if (fit) {
        // Fitted line across the measured range, then continued at the same rate until the stop age.
        const trendAges = [startAge, ...sampleAges];
        trend = {
          slope: fit.slope,
          points: trendAges.map((age) => ({
            age,
            se: fit.intercept + fit.slope * Math.min(age, Math.max(stopAge, last.age)),
          })),
        };
      }

      result.eyes[eye] = {
        history,
        untreated: line(UNTREATED_RATE),
        treatedBest: line(TREATED_RATE_BEST),
        treatedWorst: line(TREATED_RATE_WORST),
        trend,
        range: { startAge, endAge },
      };
    }
    return result;
  }

  const api = { sphericalEquivalent, ageAt, stopAgeFor, linearFit, buildProjection, UNTREATED_RATE, TREATED_RATE_WORST, STOP_AGE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VDCProjection = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
