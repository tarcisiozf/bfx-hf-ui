const { app } = require('electron') // eslint-disable-line
const fs = require('fs')
const path = require('path')
const { fork } = require('child_process')
// const logger = require('electron-log')
const HFUIApplication = require('./lib/app')
const {
  LOG_PATH,
  LOG_PATH_DS_BITFINEX,
  LOG_PATH_API_SERVER,
  SCRIPT_PATH_DS_BITFINEX,
  SCRIPT_PATH_API_SERVER,
  LOCAL_STORE_CWD,
} = require('./constants')
const { getPortInRange } = require('./utils/ports')

const REQUIRED_PATHS = [LOCAL_STORE_CWD, LOG_PATH]

REQUIRED_PATHS.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
})

const SCRIPT_SPAWN_ENVS = {
  ELECTRON_RUN_AS_NODE: '1',
}

const dsLogStream = fs.openSync(LOG_PATH_DS_BITFINEX, 'a')
const apiLogStream = fs.openSync(LOG_PATH_API_SERVER, 'a')

const startApp = async () => {
  const [apiPort, dsPort] = await Promise.all([
    getPortInRange(45000, 45100),
    getPortInRange(23521, 23600)
  ])

  const childDSProcess = fork(path.resolve(SCRIPT_PATH_DS_BITFINEX), [], {
    env: {
      ...SCRIPT_SPAWN_ENVS,
      port: apiPort
    },
    stdio: [null, dsLogStream, dsLogStream, 'ipc'],
  })

  const childAPIProcess = fork(path.resolve(SCRIPT_PATH_API_SERVER), [], {
    env: {
      ...SCRIPT_SPAWN_ENVS,
      port: dsPort
    },
    stdio: [null, apiLogStream, apiLogStream, 'ipc'],
  })

  return new HFUIApplication({
    app,
    onExit: () => {
      childAPIProcess.kill('SIGKILL')
      childDSProcess.kill('SIGKILL')
    },
  })
}

startApp().catch(err => {
  console.log(err)
  process.exit(1)
})
