// Loads the browser modules into Node in page order (they attach to globalThis.AE).
require('../assets/js/linalg.js');
require('../assets/js/testbed.js');
require('../assets/js/attribution.js');
module.exports = globalThis.AE;
