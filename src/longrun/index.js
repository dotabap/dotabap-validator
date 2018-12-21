const longrun = require("./longrun");

function run() {
  let arg = process.argv.slice(2);
  if (arg.length === 0) {
    throw "Supply generated folder";
  }

  const folder = arg[0];
  longrun(folder);
}

try {
  run();
} catch (e) {
  process.stderr.write(e + "\n");
  process.exit(1);
}