const http = require('http');
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
    http.get(options, (res) => {
      if (res.headers['content-type'] === 'application/json; charset=utf-8') {
        getJson(res).then(({ value }) => {
          resolve(JSON.parse(value));
        });
      }
    });
  });
};

const runExec = function (link) {
  return new Promise((resolve) => {
    exec(
      `rm -rf suit && git clone ${link} suit && cd suit && npm install && npm test && cd .. && rm -rf suit`,
      (err) => {
        resolve(err === null);
      }
    );
  });
};

const informDB = function (id, message) {
  return new Promise((resolve, reject) => {
    getRepoDetails(id).then((repoDetails) => {
      repoDetails.status = message;
      const options = getOption();
      options.method = 'POST';
      options.path = '/setTable/0';
      options.headers['Content-Type'] = 'application/json; charset=utf-8';
      const request = http.request(options, (res) => {
        getJson(res).then(resolve);
      });
      request.end(repoUpdationData(id, repoDetails));
    });
  });
};

const runTest = function (id) {
  return new Promise((resolve, reject) => {
    getRepoDetails(id)
      .then((data) => {
        return informDB(id, 'pending').then(() => data.link);
      })
      .then(runExec)
      .then((status) => {
        const message = status ? 'passed' : 'failed';
        informDB(id, message).then(resolve);
      });
  });
};

module.exports = runTest;
