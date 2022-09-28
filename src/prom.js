const prom = require('prom-client');

class Prom {

    // Define metrics names
    MYAPP_HEALTHCHECK = "myapp_healthcheck"
    MYAPP_INCIDENT_STATUS_OLD = "myapp_incident_status_old"
    MYAPP_INCIDENT_STATUS = "myapp_incident_status"
    MYAPP_INCIDENT_TIMING = "myapp_incident_timing"

    registry = null;
    default_prefix = "prefix_";
    defaultGcDurationBuckets = [0.001, 0.01, 0.1, 1, 2, 5];


    constructor(_default=true) {
        this.register = new prom.Registry();
        prom.collectDefaultMetrics({
            registry: this.register,
            prefix: this.default_prefix,
            gcDurationBuckets: this.defaultGcDurationBuckets,
            eventLoopMonitoringPrecision: 10,
            labels: { IS_DEFAULT: true}
        });

        // set Third party check
        const myapp_healthcheck = new prom.Gauge({
            name: this.MYAPP_HEALTHCHECK,
            help: 'Health check for third party',
            labelNames: ['service']
        });

        const mapp_incident_status_old = new prom.Gauge({
            name: this.MYAPP_INCIDENT_STATUS_OLD,
            help: 'Number of ongoing incident',
            labelNames: ['status']
        })

        const myapp_incident_status = new prom.Gauge({
            name: this.MYAPP_INCIDENT_STATUS,
            help: 'Number of ongoing incident',
            labelNames: ['status']
        });

        const myapp_incident_timing = new prom.Summary({
            name: this.MYAPP_INCIDENT_TIMING,
            help: 'Time duration of incident'
        })

        // registring metrics
        this.register.registerMetric(myapp_healthcheck);
        this.register.registerMetric(mapp_incident_status_old);
        this.register.registerMetric(myapp_incident_status);
        this.register.registerMetric(myapp_incident_timing);
        
    }

    getRegister() {
        return this.register;
    }

}


module.exports = Prom;