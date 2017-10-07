const workdir = "/tmp/";
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
  for(let repo in json) {
    fsextra.removeSync(workdir + repo);
  }
}

function gitExists(json) {
  let all = [];

  for(let repo in json) {
    all.push(git.silent(true)
      .clone(json[repo].git_url, repo)
      .then(() => console.log(repo + ": git ok"))
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