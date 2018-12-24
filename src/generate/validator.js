const workdir = "/tmp/dotabap/";

// vanilla deps
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

// external deps
const fsextra = require("fs-extra");
const request = require("sync-request");
const abaplint = require("abaplint");

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

function listFiles(dir, ignore) {
  let files = fs.readdirSync(dir);
  let result = [];

  for (let file of files) {
    if (file.charAt(0) === "."
        || file === "package.devc.xml"
        || file === "LICENSE"
        || file === "LICENSE.md"
        || file === "zmarkdown_tests.abap" // todo, temporary workaround
        || file === "README.md") {
      continue;
    }
    let stat = fs.lstatSync(dir + file);
    if (stat.isDirectory()) {
      result = result.concat(listFiles(dir + file + path.sep, ignore));
    } else if (stat.isFile()) {
      if (ignore && ignore.indexOf("/" + file) >= 0) {
// this is not completely correct, as the path is ignored
        continue;
      }
      result.push({path: dir, name: file});
    }
  }

  return result;
}

function checkFileDuplicates(result) {
  let errors = [];
  let allFiles = [];

  for (let repo in result) {
    let files = listFiles(workdir + repo + result[repo].startingFolder, result[repo].ignoreFiles);

    for (let file of files) {
      if (allFiles.indexOf(file.name) >= 0) {
        errors.push("Duplicate filename, " + repo + ": " + file.name);
      } else {
        allFiles.push(file.name);
      }
    }
  }

  return errors;
}

function analyzeFiles(json) {
  let result = {};

  for (let repo of json) {
    result[repo] = {};
    let cwd = workdir + repo;
    let dotabap = null;

    let buffer = childProcess.execSync("find -name '*.abap' | xargs cat | wc -l", {cwd: cwd});
    let lines = parseInt(buffer.toString().trim());
    result[repo].lines = lines;

    try {
      dotabap = fs.readFileSync(cwd + "/.abapgit.xml");
    } catch (e) {
// ignore
    }

    if (dotabap) {
      let found = dotabap.toString().match(/<STARTING_FOLDER>([\w/]+)<\/STARTING_FOLDER>/);
      if (found) {
        result[repo].startingFolder = found[1];
      }

// argh
      let ignore = dotabap.toString().match(/<IGNORE>([\w.<>\/\s]+)<\/IGNORE>/);
      if (ignore) {
        result[repo].ignoreFiles = [];
        const ignoreFiles = ignore[1].match(/<item>([\w./]+)<\/item>/g);
        for (let ignoreFile of ignoreFiles) {
          result[repo].ignoreFiles.push(ignoreFile.substring(6, ignoreFile.length - 7));
        }
      }
    }
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
  fsextra.ensureDirSync(workdir);
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

function parse(result) {
  for (let repo in result) {
    process.stderr.write("Parsing " + repo + "\n");
    let afiles = [];

    let files = listFiles(workdir + repo + result[repo].startingFolder, result[repo].ignoreFiles);

    for (let file of files) {
      const buf = fs.readFileSync(file.path + file.name, "utf8");
      afiles.push(new abaplint.MemoryFile(file.name, buf));
    }

    let config = abaplint.Config.getDefault();

    /*
    let count = 0;
    for (let issue of new abaplint.Registry(config).addFiles(afiles).findIssues()) {
      if (issue.getCode() === "parser_error") {
        count = count + 1;
      }
    }
    */

    config.setVersion(abaplint.Version.Cloud);
    let cloud = 0;
    for (let issue of new abaplint.Registry(config).addFiles(afiles).findIssues()) {
      if (issue.getCode() === "parser_error"
          || issue.getCode() === "cloud_types"
          || issue.getCode() === "generic") {
        cloud = cloud + 1;
      }
    }

    result[repo].parsing = {
      version: abaplint.Registry.abaplintVersion(),
//      issues: count,
      cloud: cloud
    };
  }
}

function validate(file, token, abap = true) {
  let json = JSON.parse(file);
  let errors = [];

  gitExists(json);
  let result = analyzeFiles(json);

  if (abap) {
    errors = errors.concat(checkFileExists(".abapgit.xml", json));
    errors = errors.concat(checkFileDuplicates(result));
    parse(result);
  }

  cleanup(json);

  if (token) {
    github(result, token);
  } else {
    console.log("no token, skipping");
  }

  return {json: result, errors};
}

module.exports = validate;
