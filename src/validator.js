const workdir = "/tmp/";
let all = [];

// vanilla deps
let child_process = require('child_process');

// external deps
let git = require("simple-git/promise")(workdir);
let fsextra = require("fs-extra");
var request = require('sync-request');

function checkFieldsFilled(json) {
  for(let repo in json) {
    if (!json[repo].description) {
      throw repo + " description not filled";
    } else if(!json[repo].git_url) {
      throw repo + " git_url not filled";
    }
  }
}

function github(json) {
  for(let repo in json) {
    let match = json[repo].git_url.match(/github.com\/(.*)\.git$/);
    let url = 'https://api.github.com/repos/' + match[1];
    let buffer = request('GET', url,
      {'headers': {'user-agent': 'dotabap-validator'}});
    let result = JSON.parse(buffer.getBody().toString());
    json[repo].github = result;
  }
}

function countLines(json) {
  for(let repo in json) {
    let cwd = workdir + repo;
    let buffer = child_process.execSync("find -name '*.abap' | xargs cat | wc -l", {cwd: cwd});
    let lines = parseInt(buffer.toString().trim());
    json[repo].lines = lines;
//    console.log(repo + ": \t" + lines + " lines");
  }
}

function cleanup(json) {
  for(let repo in json) {
    let cwd = workdir + repo;
    fsextra.removeSync(cwd);
  }
}

function gitExists(json) {
  for(let repo in json) {
    all.push(git.silent(true)
      .clone(json[repo].git_url, repo)
      .then()
      .catch((err) => console.error(repo + " git failed: ", err)));
  }
}

function validate(file, generate = false) {
  let json = JSON.parse(file);

  checkFieldsFilled(json);

  gitExists(json);

  Promise.all(all).then(() => {
    if (generate) {
      countLines(json);
    }
    cleanup(json);
    if (generate) {
      github(json);
      console.log(JSON.stringify(json, null, ' '));
    }
  });
}

module.exports = validate;