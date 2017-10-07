const fs = require('fs');
const path = require('path');
const validate = require('./validator');

function openFile() {
  let arg = process.argv.slice(2);

  if (arg.length === 0) {
    throw "Supply filename";
  }

  return fs.readFileSync(arg[0], "utf8");
}

function run() {
  try {
    validate(openFile());
  } catch (e) {
    process.stderr.write(e + "\n");
  }
}

run();