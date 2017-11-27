const fs = require('fs');
const path = require('path');
const validate = require('./validator');

/*
function openFile(filename) {
  return ;
}
*/

function parseArguments() {
  let arg = process.argv.slice(2);
  if (arg.length === 0) {
    throw "Supply filename";
  }

  let filename = "";
  let token = "";

  filename = arg[0];
  token = arg[1];

  if (!token) {
    throw "Supply token";
  }

  return {filename, token}
}

function run() {
  let arg = parseArguments();

  try {
    validate(fs.readFileSync(arg.filename, "utf8"), arg.token);
  } catch (e) {
    process.stderr.write(e + "\n");
  }
}

run();