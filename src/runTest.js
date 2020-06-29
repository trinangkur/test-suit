const https = require('https');
const { exec } = require('child_process');
const { getJson, getOption } = require('./util');

const repoUpdationData = (id, repoDetails) =>
  JSON.stringify({
    tableName: 'repos',
    fields: {
      [id]: JSON.stringify(repoDetails),
    },
  });

const getRepoDetails = function (id) {
  return new Promise((resolve, rejects) => {
    const options = getOption();
    options.path = `/getField/0/repos/${id}`;
    https.get(options, (res) => {
      if (res.headers['content-type'] === 'application/json; charset=utf-8') {
        getJson(res).then(({ value }) => {
          resolve(JSON.parse(value));
        });
      }
    });
  });
};

const runExec = function ({ link, sha, repoId, pushedAt }) {
  return new Promise((resolve) => {
    exec(
      `rm -rf suit && git clone ${link} suit && cd suit && git checkout ${sha} && npm install && npm test && cd .. && rm -rf suit`,
      (err) => {
        resolve({ repoId, log: { sha, isPassing: err === null, pushedAt } });
      }
    );
  });
};

const informDB = function (id, message, log) {
  return new Promise((resolve, reject) => {
    getRepoDetails(id).then((repoDetails) => {
      repoDetails.status = message;
      if (log) {
        repoDetails.logs.push(log);
        repoDetails.lastPushed = log.pushedAt;
        repoDetails.lastSha = log.sha;
      }
      const options = getOption();
      options.method = 'POST';
      options.path = '/setTable/0';
      options.headers['Content-Type'] = 'application/json; charset=utf-8';
      const request = https.request(options, (res) => {
        getJson(res).then(resolve);
      });
      request.end(repoUpdationData(id, repoDetails));
    });
  });
};

const runTest = function (jobDetails) {
  console.log('running test for-->', jobDetails);
  return new Promise((resolve, reject) => {
    informDB(jobDetails.repoId, 'pending')
      .then(() => runExec(jobDetails))
      .then(({ repoId, log }) => {
        const message = log.isPassing ? 'passed' : 'failed';
        informDB(repoId, message, log).then(resolve);
      });
  });
};

module.exports = runTest;
