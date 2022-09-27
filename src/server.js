const express = require('express');
const assert = require('assert');
const { v4: uuidv4 } = require('uuid');

const Prom = require("./prom");
const scheduler = require("./scheduler");


const app = express();


// Check env requirements
assert.ok(process.env.PORT, "PORT for server is required");

const port = process.env.PORT;
const metrics = new Prom();
const store = {
    control: {
        serviceA: "OK"
    },
    incident: {}
};

// scheduler
async function checkService() {
    let result;
    if (store.control.serviceA === "OK") {
        result = {
            status: 200,
            message: "OK",
            timestamp: Date.now()
        };
        metrics.getRegister().getSingleMetric(metrics.MYAPP_HEALTHCHECK).set({service: "serviceA"}, 1);
    } else {
        result = {
            status: 404,
            message: "Not found",
            timestamp: Date.now()
        };
        metrics.getRegister().getSingleMetric(metrics.MYAPP_HEALTHCHECK).set({service: "serviceA"}, 0);
    }
    
    store["serviceA"] = result;
    console.log(store);
}

async function simulateOneIncident(lag1, lag2, lag3) {
    const id = uuidv4();
    console.log(`A new incident occured with id ${id}`);
    store.incident[id] = {
        id: id,
        status: "temporary",
        timestamp: Date.now()
    }
    scheduler.sleep(scheduler.getRandomInt(1000, lag1));
    store.incident[id].status = "called";
    store.incident[id].timestamp = Date.now();

    scheduler.sleep(scheduler.getRandomInt(1000, lag2));
    store.incident[id].status = "treated";
    store.incident[id].timestamp = Date.now();

    scheduler.sleep(scheduler.getRandomInt(1000, lag3));
    console.log(`End of incident with id ${id}`);
    delete store.incident[id];
}

scheduler.periodicFixedDelay(10 * 1000, checkService);
scheduler.periodicRandomDelay(5 * 1000, 30 * 1000, () => simulateOneIncident(10 * 1000, 60 * 1000, 20 * 1000));

// Routes
app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.get('/set/:key/:value', (req, res) => {
    store.control[req.params.key] = req.params.value;
    res.set('Content-Type', "application/json");
    res.send(store.control);
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