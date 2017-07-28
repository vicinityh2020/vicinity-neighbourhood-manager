
// Global variables and definitions

var mysql = require('mysql');
var logger = require('../../middlewares/logger');

// Public functions

function sendQuery(org){

 orgForeign = org.toString() + '_foreignDevices';
 orgOwn = org.toString() + '_ownDevices';
 
 var connection = mysql.createConnection(
      {
        host     : '138.201.156.73',
        user     : 'openfireRemote',
        password : 'VicinityOpenfireXMPP0',
        database : 'openfire',
      }
  );

  var qryString = "UPDATE ofGroupProp SET propValue=? WHERE groupName LIKE ? AND name LIKE 'sharedRoster.groupList'";
	
  connection.connect(ifError);

  /* Begin transaction */
  connection.beginTransaction(function(err) {
    if (err) { throw err; }
    connection.query( qryString , [ orgForeign, orgOwn ] , function(err, result) {
      if (err) {
        connection.rollback(function() {
          throw err;
        });
      }

      connection.query(qryString , [ orgOwn, orgForeign ], function(err, result) {
        logger.debug("UPDATE ofGroupProp SET propValue=" + orgOwn + " WHERE groupName LIKE " + orgForeign + " AND name LIKE 'sharedRoster.groupList'");
	if (err) {
          connection.rollback(function() {
            throw err;
          });
        }
        connection.commit(function(err) {
          if (err) {
            connection.rollback(function() {
              throw err;
            });
          }
          logger.debug('Transaction Complete.');
          connection.end();
        });
      });
    });
  });
  /* End transaction */

}

// Private functions

function ifError(err){
  if(err){
    logger.debug('Error connecting to Db');
    throw err;
  }
  logger.debug('Connection established');
}

// Export functions

module.exports.sendQuery = sendQuery;
