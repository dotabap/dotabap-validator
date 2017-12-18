const workdir = "/tmp/";

// vanilla deps
const fs = require("fs");
const childProcess = require("child_process");

// external deps
const fsextra = require("fs-extra");
const request = require("sync-request");


function github(result, token) {
  for (let repo in result) {
    const url = "https://api.github.com/repos/" + repo;
    let buffer = request("GET", url,
      {"headers": {"user-agent": "dotabap-validator",
        "Authorization": "token " + token
      }});
    let github = JSON.parse(buffer.getBody().toString());
    result[repo].repo = github;
  }
}

function countLines(json) {
  let result = {};

  for (let repo of json) {
    let cwd = workdir + repo;
    let buffer = childProcess.execSync("find -name '*.abap' | xargs cat | wc -l", {cwd: cwd});
    let lines = parseInt(buffer.toString().trim());

    result[repo] = {};
    result[repo].lines = lines;
  }

  return result;
}

function cleanup(json) {
  for (let repo of json) {
    let cwd = workdir + repo;
    fsextra.removeSync(cwd);
  }
}

function gitExists(json) {
  for (let repo of json) {
    let cwd = workdir + repo;
    fsextra.ensureDirSync(cwd);
    let url = "https://github.com/" + repo + ".git";
    childProcess.execSync("git clone --depth 1 " + url + " " + cwd, {cwd: cwd});
  }
}

/*
function gitLog(json) {
  let out = "";
  for(let repo of json) {
    out = out + childProcess.execSync(
      "git log --pretty=format:\"{\\\"repo\\\": \\\""+repo+"\\\", \\\"commit\\\": \\\"%H\\\", \\\"time\\\": \\\"%ad\\\"},\"",
      {cwd: workdir + repo}) + "\n";
  }
  out = "[" + out.slice(0, -2) + "]";
  console.log(out);
}
*/

function checkFileExists(filename, json) {
  let errors = [];

  for (let repo of json) {
    let check = workdir + repo + "/" + filename;
    try {
      fs.readFileSync(check);
    } catch (e) {
      errors.push(repo + ": " + filename + " not found");
    }
  }

  return errors;
}

function validate(file, token) {
  let json = JSON.parse(file);
  let errors = [];

  gitExists(json);

  let result = countLines(json);

  errors = errors.concat(checkFileExists(".abapgit.xml", json));

  cleanup(json);

  if (token) {
    github(result, token);
  }

  return {json: result, errors};
}

module.exports = validate;