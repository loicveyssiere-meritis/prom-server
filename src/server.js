const express = require('express');
const assert = require('assert');
const Prom = require("./prom");


const app = express();


// Check env requirements
assert.ok(process.env.PORT, "PORT for server is required");

const port = process.env.PORT;
const metrics = new Prom();

// Routes
app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.get('/metrics', async function (req, res) {
    // Return all metrics the Prometheus exposition format
    console.log("metrics", await metrics.getRegister().metrics());
    res.set('Content-Type', metrics.getRegister().contentType);
    res.send(await metrics.getRegister().metrics());
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})