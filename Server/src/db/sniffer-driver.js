// Sniff the calls to the DB.
const debug = require('debug')('sniffer')

const driversList = []

debug()

const handler = {
  get: function(target, prop, receiver) {
    // Add Driver?
    if (prop == 'addDriver') {
      return (driver) => driversList.push(driver)
    }

    // Process call
    console.log('get')
    console.log(target, prop, receiver)
    let value = Reflect.get(...arguments);
    console.log(value)
    
    // Return function that will be called
    return async function (algo) {
      // console.log(...arguments);
      debug(...arguments)
      // Store the result of calling different drivers
      const result = []
      for (let driver of driversList) {
        result.push( await driver[prop](...arguments) )
      }
      // ! :-) Call observable to add response
      // The observable mix the request route 
      // with the driver result
      debug(result)
      // Send first value
      return result[0]
      // return driversList[0][prop](...arguments)
    }
  },
}


const sniffer = new Proxy({}, handler);


// add driver to list
module.exports = sniffer