const os = require('os');
const originalCpus = os.cpus;

os.cpus = () => {
  const cpus = originalCpus();
  if (cpus && cpus.length > 0) {
    return cpus;
  }
  // Mock 2 cores so concurrency is > 1
  return [
    { model: 'Generic CPU 1', speed: 2000, times: {} },
    { model: 'Generic CPU 2', speed: 2000, times: {} }
  ];
};
