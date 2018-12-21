const fs = require("fs");
const childProcess = require("child_process");
const fsextra = require("fs-extra");
const workdir = "/tmp/dotabap/";

function repoStats(folder, generated) {
  for (const project in generated) {
    const repo = generated[project].repo;
    console.log("Running, " + repo.full_name);

    childProcess.execSync("git clone --depth 1 " + repo.clone_url, {cwd: workdir, stdio: "inherit"});

    const cmd = "abaplint \"" + workdir + repo.name + generated[project].startingFolder +
      "**/*.*\" -t -s > " + folder + "stats/" + repo.full_name.replace("/", "_") + ".json";
    console.dir(cmd);
    childProcess.execSync(cmd, {stdio: "inherit"});

    fsextra.removeSync(workdir + repo.name);
  }
}

function longrun(folder) {
  console.log("Folder: " + folder);
  fsextra.ensureDirSync(workdir);
  const generated = JSON.parse(fs.readFileSync(folder + "generated.json", "utf8"));

  repoStats(folder, generated);
}


module.exports = longrun;