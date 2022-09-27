// helpers
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(delay) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function periodicFixedDelay(delay, f) {
  while (true) {
    // I don't like setInterval ^^
    await sleep(delay);
    f();
  }

}

async function periodicRandomDelay(minDelay, maxDelay, f) {
  while (true) {
    // I don't like setInterval ^^
    const delay = getRandomInt(minDelay, maxDelay);
    await sleep(delay);
    f();
  }
}

module.exports = {
  sleep,
  getRandomInt,
  periodicFixedDelay,
  periodicRandomDelay,
}