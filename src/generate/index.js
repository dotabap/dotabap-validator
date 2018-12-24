const fs = require("fs");
const validate = require("./validator");

function parseArguments() {
  let arg = process.argv.slice(2);
  if (arg.length === 0) {
    throw "Supply filename";
  }

  let filename = "";
  let token = "";

  filename = arg[0];
  token = arg[1];
  let abap = arg.indexOf("-n") === -1;
//  console.trace(abap);

  return {filename, token, abap};
}

function run() {
  let arg = parseArguments();
  let result;

  result = validate(fs.readFileSync(arg.filename, "utf8"), arg.token, arg.abap);

  if (result.errors.length > 0) {
    for (let error of result.errors) {
      process.stderr.write(error + "\n");
    }
    process.exit(1);
  } else {
    process.stdout.write(JSON.stringify(result.json, null, " ") + "\n");
  }
}

try {
  run();
} catch (e) {
  process.stderr.write(e + "\n");
  process.exit(1);
}