const http = require('http');

const getOption = () => ({
  headers: {
    'st-key': 'st123',
  },
  host: 'st-redis.herokuapp.com',
  // protocol: 'https',
  // port: 443,
});

const getJson = function (res) {
  return new Promise((resolve, reject) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      resolve(JSON.parse(data));
    });
  });
};

const pullJob = function () {
  const options = getOption();
  options.path = '/rpop/0/jobs';
  http.get(options, (res) => {
    if (res.headers['content-type'] === 'application/json; charset=utf-8') {
      getJson(res).then((data) => {
        console.log(data);
        if (data.value) {
          console.log('value-->', data.value);
          pullJob();
        } else {
          setTimeout(pullJob, 5000);
        }
      });
    }
  });
};

pullJob();
