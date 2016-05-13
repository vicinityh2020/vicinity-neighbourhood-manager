var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.Types.ObjectId;


var gatewayobject = {
    device_id: ObjectId,
    device_rid: String,
    data_sources: [{
      name: String,
      rid: String
    }]
};

module.exports.gatewayobject = mongoose.model('gatewayobject', gatewayobject);
