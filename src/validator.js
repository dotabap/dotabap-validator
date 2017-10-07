const workdir = "/tmp/";
let all = [];

// vanilla deps
let child_process = require('child_process');

// external deps
let git = require("simple-git/promise")(workdir);
let fsextra = require("fs-extra");
var request = require('sync-request');

function github(result) {
  for(let repo in result) {
    let url = 'https://api.github.com/repos/' + repo;
    let buffer = request('GET', url,
      {'headers': {'user-agent': 'dotabap-validator',
        "Authorization": "token blah"
      }});
    let github = JSON.parse(buffer.getBody().toString());
    result[repo].repo = github;
  }
}

function countLines(json) {
  let result = {};

  for(let repo of json) {
    let cwd = workdir + repo;
    let buffer = child_process.execSync("find -name '*.abap' | xargs cat | wc -l", {cwd: cwd});
    let lines = parseInt(buffer.toString().trim());

    result[repo] = {};
    result[repo].lines = lines;
//    console.log(repo + ": \t" + lines + " lines");
  }

  return result;
}

function cleanup(json) {
  for(let repo of json) {
    let cwd = workdir + repo;
    fsextra.removeSync(cwd);
  }
}

function gitExists(json) {
  for(let repo of json) {
    all.push(git.silent(true)
      .clone("https://github.com/" + repo + ".git", repo)
      .then()
      .catch((err) => console.error(repo + " git failed: ", err)));
  }
}

function validate(file, generate = false) {
  let json = JSON.parse(file);

  gitExists(json);

  Promise.all(all).then(() => {
    let result;
    if (generate) {
      result = countLines(json);
    }
    cleanup(json);
    if (generate) {
      github(result);
      console.log(JSON.stringify(result, null, ' '));
    }
  });
}

module.exports = validate;