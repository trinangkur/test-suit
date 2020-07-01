const client = require('redis').createClient(process.env.REDIS_URL);
const { exec, execSync } = require('child_process');

const getUserDetails = function (userName) {
  return new Promise((resolve, rejects) => {
    client.hget('users', userName, (err, userDetails) => {
      resolve(JSON.parse(userDetails));
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
      userDetails = userDetails || {};
      userDetails[repoName] || (userDetails[repoName] = []);
      userDetails[repoName].push(log);
      client.hset('users', userName, JSON.stringify(userDetails), resolve);
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

const pullJob = function () {
  client.brpop('jobs', 4, (err, job) => {
    if (job) {
      console.log('got job -->', job[1]);
      runTest(JSON.parse(job[1])).then(pullJob);
    } else {
      console.log("didn't got any job");
      pullJob();
    }
  });
};

pullJob();
