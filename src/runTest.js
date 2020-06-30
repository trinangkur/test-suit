const https = require('https');
const { exec, execSync } = require('child_process');
const { getJson, getOption } = require('./util');

const userUpdationData = (userName, userDetails) =>
  JSON.stringify({
    tableName: 'users',
    fields: {
      [userName]: JSON.stringify(userDetails),
    },
  });

const getUserDetails = function (userName) {
  return new Promise((resolve, rejects) => {
    const options = getOption();
    options.path = `/getField/0/users/${userName}`;
    https.get(options, (res) => {
      if (res.headers['content-type'] === 'application/json; charset=utf-8') {
        getJson(res).then(({ value }) => {
          resolve(JSON.parse(value));
        });
      }
    });
  });
};

const runExec = function ({ link, sha, pushedAt }) {
  return new Promise((resolve) => {
    exec(
      `rm -rf suit && git clone ${link} suit && cd suit && git checkout ${sha} && npm install && npm test`,
      (err) => {
        execSync('rm -rf suit');
        resolve({ sha, pushedAt, status: err === null });
      }
    );
  });
};

const addLog = function (userName, repoName, log) {
  return new Promise((resolve, reject) => {
    getUserDetails(userName).then((userDetails) => {
      userDetails[repoName].push(log);
      const options = getOption();
      options.method = 'POST';
      options.path = '/setTable/0';
      options.headers['Content-Type'] = 'application/json; charset=utf-8';
      const request = https.request(options, (res) => {
        getJson(res).then(resolve);
      });
      request.end(userUpdationData(userName, userDetails));
    });
  });
};

const runTest = function (jobDetails) {
  const { repoName, userName } = jobDetails;
  console.log('running test for-->', jobDetails);
  return new Promise((resolve, reject) => {
    runExec(jobDetails)
      .then(addLog.bind(null, userName, repoName))
      .then(resolve);
  });
};

module.exports = runTest;
