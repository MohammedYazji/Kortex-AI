// The will looking for a browser-specific variable called self the absolute millisecond the app opens. React Native doesn't have self, causing an instant fatal error: "self is not defined".

// This file runs exactly one line of code: global.self = global; essentially tricking the library into thinking it's inside Google Chrome, before finally loading the real transformers code.

if (typeof self === "undefined") {
  global.self = global;
}

module.exports = require("@xenova/transformers/dist/transformers.js");
