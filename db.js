var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'www.db4free.net',
  user     : 'siew',
  password : '123456',
  database : 'correlation2'
});

/*var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'siew',
  password : '12345',
  database : 'correlation2'
}); */

connection.connect(function(err) {
    if (err) {
    console.error('error connecting: ' + err.stack);
    return;
}});

module.exports = connection;
