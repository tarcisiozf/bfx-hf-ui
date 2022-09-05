const net = require('net')

/**
 * @param {number} port
 * @returns {Promise<boolean>}
 */
const isPortAvailable = (port) => {
  return new Promise((resolve, reject) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          return resolve(false)
        }
        reject(err)
      })
      .once('listening', () => {
        tester.once('close', () => resolve(true))
          .close()
      })
      .listen(port)
  })
}

/**
 * @param {number} start
 * @param {number} end
 * @returns {Promise<number>}
 */
const getPortInRange = async (start, end) => {
  for (let port = start; port <= end; port++) {
    if (await isPortAvailable(port)) {
      return port
    }
  }

  throw new Error(`could not find port available in the range ${start}:${end}`)
}

module.exports = {
  isPortAvailable,
  getPortInRange
}
