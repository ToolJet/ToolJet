var spawnSync = require('child_process').spawnSync
const {username} = require('os').userInfo()

console.log("username: ", username);
if (username === 'arpitnath') {
  const result = spawnSync('npx lint-staged', {stdio: 'inherit', shell: true})

  if (result.status !== 0) {
    process.exit(result.status)
  }
}

