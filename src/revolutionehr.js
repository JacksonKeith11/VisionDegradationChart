// Reads the open patient's data from RevolutionEHR using the user's existing session.
// Must resolve to: { name, dob, sex: 'F' | 'M' | null, exams: [{ date, od: {sphere, cylinder}, os: {sphere, cylinder} }] }
//
// TODO: implement once RevolutionEHR's page structure and data requests have been inspected.
(function (root) {
  async function getCurrentPatient() {
    throw new Error("Reading patient data from RevolutionEHR isn't implemented yet.");
  }

  root.VDCRevolution = { getCurrentPatient };
})(globalThis);
