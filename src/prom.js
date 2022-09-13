const prom = require('prom-client');

class Prom {

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
        
    }

    getRegister() {
        return this.register;
    }


}


module.exports = Prom;