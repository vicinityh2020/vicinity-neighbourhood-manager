module.exports.define = function(agenda) {
  agenda.define('write data', function(job){
    console.log("Job %s executed.", job.attrs.name);
  });
}

module.exports.every = function(agenda) {
  agenda.every('10 seconds', 'write data');
}
