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
    const startTime = Date.now();

    metrics.getRegister().getSingleMetric(metrics.MYAPP_INCIDENT_STATUS).labels("temporary").inc(1);
    store.incident[id] = {
        id: id,
        status: "temporary",
        startedAt: Date.now(),
        timestamp: Date.now()
    }

    metrics.getRegister().getSingleMetric(metrics.MYAPP_INCIDENT_STATUS).labels("temporary").dec(1);
    metrics.getRegister().getSingleMetric(metrics.MYAPP_INCIDENT_STATUS).labels("called").inc(1);

    await scheduler.sleep(scheduler.getRandomInt(1000, lag1));
    store.incident[id].status = "called";
    store.incident[id].timestamp = Date.now();

    metrics.getRegister().getSingleMetric(metrics.MYAPP_INCIDENT_STATUS).labels("called").dec(1);
    metrics.getRegister().getSingleMetric(metrics.MYAPP_INCIDENT_STATUS).labels("treated").inc(1);

    await scheduler.sleep(scheduler.getRandomInt(1000, lag2));
    store.incident[id].status = "treated";
    store.incident[id].timestamp = Date.now();

    metrics.getRegister().getSingleMetric(metrics.MYAPP_INCIDENT_STATUS).labels("treated").dec(1);

    await scheduler.sleep(scheduler.getRandomInt(1000, lag3));
    console.log(`End of incident with id ${id}`);
    const endTime = Date.now();
    delete store.incident[id];

    // Observe time
    metrics.getRegister().getSingleMetric(metrics.MYAPP_INCIDENT_TIMING).observe(endTime - startTime);
}

scheduler.periodicFixedDelay(10 * 1000, checkService);
scheduler.periodicRandomDelay(30 * 1000, 120 * 1000, () => simulateOneIncident(10 * 1000, 120 * 1000, 30 * 1000));


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
    
    let counts = {
        temporary: 0,
        called: 0,
        treated: 0
    }
    // for (let status of ['temporary', 'called', 'treated']) {
    //     metrics.getRegister().getSingleMetric(metrics.MYAPP_INCIDENT_STATUS_OLD).labels(status).set(0);
    // }
    // for (let [key, incident] of Object.entries(store.incident)) {
    //     metrics.getRegister().getSingleMetric(metrics.MYAPP_INCIDENT_STATUS_OLD).labels(incident.status).inc(1);
    // }
    for (let [key, incident] of Object.entries(store.incident)) {
        counts[incident.status] += 1;
    }

    for (let [key, value] of Object.entries(counts)) {
        metrics.getRegister().getSingleMetric(metrics.MYAPP_INCIDENT_STATUS_OLD).labels(key).set(value);
    }
    


    console.log("metrics", await metrics.getRegister().metrics());
    res.set('Content-Type', metrics.getRegister().contentType);
    res.send(await metrics.getRegister().metrics());
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})