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

function statementStats(folder, generated) {
  const files = fs.readdirSync(folder + "stats");
  let result = [];
  let total = [];
  for (const filename of files) {
    const stats = JSON.parse(fs.readFileSync(folder + "stats/" + filename, "utf8"));
    total = total.concat(stats.statementTypes);
  }

  // todo, dont do it like this
  for (const i of total) {
    let found = false;
    for (const r of result) {
      if (r.type === i.type) {
        found = true;
        break;
      }
    }
    if (found === false) {
      result.push({type: i.type, count: 0});
    }
  }

  for (const r of result) {
    for (const i of total) {
      if (r.type === i.type) {
        r.count = r.count + i.count;
      }
    }
  }

  result.sort((a, b) => {
    if (a.count > b.count) {
      return -1;
    } else if (a.count < b.count) {
      return 1;
    } else {
      return 0;
    }
  });

  fs.writeFileSync(folder + "statement_types.json", JSON.stringify(result, null, 2));
}

function longrun(folder) {
  console.log("Folder: " + folder);
  fsextra.ensureDirSync(workdir);
  const generated = JSON.parse(fs.readFileSync(folder + "generated.json", "utf8"));

  repoStats(folder, generated);
  statementStats(folder, generated);
}


module.exports = longrun;