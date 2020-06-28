const http = require('http');
const runTest = require('./src/runTest');
const { getJson, getOption } = require('./src/util');

const pullJob = function () {
  const options = getOption();
  options.path = '/rpop/0/jobs';
  http.get(options, (res) => {
    if (res.headers['content-type'] === 'application/json; charset=utf-8') {
      getJson(res).then(({ value }) => {
        if (value) {
          console.log('repo num:', value);
          runTest(value).then(pullJob);
        } else {
          console.log('waiting');
          setTimeout(pullJob, 5000);
        }
      });
    }
  });
};

pullJob();
