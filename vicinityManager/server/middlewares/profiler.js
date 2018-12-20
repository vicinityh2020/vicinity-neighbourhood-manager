/*
 Measures the metrics consumed by a call.
 Memory (kb)
 CPU (ms)
 Time (ms)
 Returns object
*/

// Constructor
function profiler() {
    this.old_time = new Date();
    this.m0 = process.memoryUsage();
    this.c0 = process.cpuUsage();
}

// Public method
profiler.prototype.stop = function() {
    var measures = {};
    var new_time = new Date();
    var m1 = process.memoryUsage();
    var c1 = process.cpuUsage();
    var usedCPU = process.cpuUsage(this.c0);
    var tCPUFriction = 1000;
    var tFriction = 1;

    measures.diffRAM = bytesToSize(m1.rss - this.m0.rss);
    measures.diffHeapTotal = bytesToSize(m1.heapTotal - this.m0.heapTotal);
    measures.diffHeapUsed = bytesToSize(m1.heapUsed - this.m0.heapUsed);
    measures.diffExternal = bytesToSize(m1.external - this.m0.external);
    measures.diffCPU = addUnit((usedCPU.user + usedCPU.system) / tCPUFriction);
    measures.diffTime = addUnit((new_time - this.old_time) / tFriction);
    // measures.timestamp = addUnit(new_time);
    measures.log = buildLog(measures);

    return measures;
};

// Private FUNCTIONs
function bytesToSize(bytes) {
    if (bytes == 0) return 0;
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2); // + ' Kb';
}

function buildLog(x){
  var y = x.diffRAM + " : " + x.diffHeapTotal + " : " + x.diffHeapUsed + " : " + x.diffExternal + " : " + x.diffCPU + " : " +  x.diffTime;
  return y;
}

function addUnit(x){
  return x; // + ' ms';
}

// Export module
module.exports = profiler;
