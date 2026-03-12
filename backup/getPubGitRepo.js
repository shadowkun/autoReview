const request = require('request')

let opts = {
  url: 'https://api.github.com/users/Sicmatr1x/repos?visibility=all&type=owner',
  headers: {
    'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36`,
  },
}

function getPublicRepo(username) {
  console.log('url=' + opts.url)
  try {
    request(opts, function (error, response, body) {
      console.log('begin')
      if (!error && response.statusCode === 200) {
        console.log('response.statusCode=' + response.statusCode)
        console.log(body)
      } else {
        console.log(response.body)
      }
    })
  } catch (error) {
    console.log('error=', error)
  }
}

module.exports = {
  getPublicRepo: getPublicRepo,
}
