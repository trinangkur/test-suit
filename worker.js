const https = require('https');
const runTest = require('./src/runTest');
const { getJson, getOption } = require('./src/util');

const pullJob = function () {
  const options = getOption();
  options.path = '/rpop/0/jobs';
  https.get(options, (res) => {
    if (res.headers['content-type'] === 'application/json; charset=utf-8') {
      getJson(res).then(({ value }) => {
        if (value) {
          runTest(JSON.parse(value)).then(pullJob);
        } else {
          console.log('waiting');
          setTimeout(pullJob, 5000);
        }
      });
    }
  });
};

pullJob();
