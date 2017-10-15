const fs = require('fs');
const path = require('path');
const validate = require('./validator');

function openFile(filename) {
  return ;
}

function parseArguments() {
  let arg = process.argv.slice(2);
  if (arg.length === 0) {
    throw "Supply filename";
  }

  let filename = "";
  let generate = false;
  let log = false;

  if (arg[0] === '-g') {
    generate = true;
    filename = arg[1];
  } else if (arg[0] === '-l') {
    log = true;
    filename = arg[1];
  } else {
    filename = arg[0];
  }

  return {filename: filename, generate: generate, log: log}
}

function run() {
  let arg = parseArguments();

  try {
    validate(fs.readFileSync(arg.filename, "utf8"), arg.generate, arg.log);
  } catch (e) {
    process.stderr.write(e + "\n");
  }
}

run();