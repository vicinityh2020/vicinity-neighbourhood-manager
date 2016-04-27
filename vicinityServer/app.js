var express = require('express');

var app = express();

app.get('/', function(req, res){
  res.send('Hello world!');
});

app.listen(4000, function (){
  console.log("Example app listenig on port 3000");
});
