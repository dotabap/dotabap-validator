const workdir = "/tmp/";
let child_process = require('child_process');
let git = require("simple-git/promise")(workdir);
let fsextra = require("fs-extra");

function fieldsFilled(json) {
  for(let repo in json) {
    if(!json[repo].description) {
      throw repo + " description not filled";
    } else if(!json[repo].git_url) {
      throw repo + " git_url not filled";
    }
  }
}

function cleanup(json) {
  console.log("\n");
  for(let repo in json) {
    let cwd = workdir + repo;
    let res = child_process.execSync("find -name '*.abap' | xargs cat | wc -l", {cwd: cwd});
    console.log(repo + ": \t" + res.toString().trim() + " lines");
    fsextra.removeSync(cwd);
  }
}

function gitExists(json) {
  let all = [];

  for(let repo in json) {
    all.push(git.silent(true)
      .clone(json[repo].git_url, repo)
      .then(() => console.log(repo + ": \tgit ok"))
      .catch((err) => console.error(repo + " git failed: ", err)));
  }

  Promise.all(all).then(() => cleanup(json));
}

function validate(file) {
  let json = JSON.parse(file);

  fieldsFilled(json);
  gitExists(json);
}

module.exports = validate;