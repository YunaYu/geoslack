// TODO:
// - Check unique token passed by slack for /slack and /coords
// - Expand to infinite users
// - Remove bitly and replace with proper heroku app name

var express = require('express');
var bodyParser = require("body-parser");
var app = express();
var querystring = require('querystring');
var https = require('https');
var config = require('./config');

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// CONFIG from config.js
var host_app_url  = config.host_app.url;
var decay_minutes = config.host_app.decay_minutes;
var slack_incoming_webhook_endpoint = config.slack.incoming_webhook_endpoint;
var mapsize = config.host_app.mapsize;
var maptype = config.host_app.maptype;
var label = config.host_app.label;
var color  = config.host_app.color;

app.get('/', function(request, response) {
  response.render('pages/index')
});

app.get('/findme', function(request, response) {
  let channel = request.query.channel;
  let location = request.query.location;
  console.log(location);
  response.render('pages/findme', {
		channel: channel,
		location: location
	})
});

// When bot is called, reply with link to the app
app.post('/slack', function(request, response) {
	response.send({ "text": "Click me -> " + host_app_url });
});

var people = [];
var pplCtr = 0;

// Called by front-end. Receives the coordinates from HTML5 geolocation
app.post('/coords', function(request, response) {
	const { channel, lat, lng, location } = request.body;
	var latlng = lat + "," + lng;
	var now = new Date();

	// Construct the message to send to Api Gateway
	var attachment = {
		"token": "kHAJJSYGpaAzlPWqrPggP3ax",
		"event": {
		  "text": "Location\n" + latlng + "\n" + location,
		  "channel": channel
		}
	  }

	// Send message/attachment to Slack
	var host = "c2oy2yp8q2.execute-api.us-east-1.amazonaws.com";
	var endpoint = "/Prod";
	doRequest(host, endpoint, 'POST', attachment,
		function(concurData) {
  			console.log(request.body.lat + " " + request.body.lng);
  			response.send(request.body.lat + " " + request.body.lng);
		});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

// UTILS

function doRequest(host, endpoint, method, data, success) {
  var dataString = JSON.stringify(data);
  var headers = {};

  if (method == 'GET') {
    endpoint += '?' + querystring.stringify(data);
  }
  else {
    headers = {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length
    };
  }
  var options = {
    host: host,
    path: endpoint,
    method: method,
    headers: headers
  };

  var req = https.request(options, function(res) {
    res.setEncoding('utf-8');

    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
      console.log(responseString);
      success(responseString);
    });
  });

  req.write(dataString);
  req.end();
}
