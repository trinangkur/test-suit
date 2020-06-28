const getOption = () => ({
  headers: {
    'st-key': 'st123',
  },
  host: 'st-redis.herokuapp.com',
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

module.exports = { getOption, getJson };
