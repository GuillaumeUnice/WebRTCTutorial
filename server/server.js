var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname);

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

// start the server if `$ node server.js`
if (require.main === module) {
  //app.start();
  app.io = require('socket.io')(app.start());
  app.io.on('connection', function(socket){
  	console.log('a user connected');

  	socket.on('CHAT_MESSAGE', function(msg){
    	console.log('CHAT_MESSAGE: ' + msg);
    	app.io.emit('CHAT_MESSAGE', msg);
  	});

    /* ALICE message type */
    socket.on('ASK_WEB_RTC', function(msg){
    	console.log('ASK_WEB_RTC: ' + msg);
    	app.io.emit('ASK_WEB_RTC', msg);
  	});

    socket.on('CANDIDATE_WEB_RTC_ALICE', function(msg){
    	console.log('CANDIDATE_WEB_RTC_ALICE: ' + msg);
    	app.io.emit('CANDIDATE_WEB_RTC_ALICE', msg);
  	});
    
    /* BOB message type */
    socket.on('CANDIDATE_WEB_RTC_BOB', function(msg){
    	console.log('CANDIDATE_WEB_RTC_BOB: ' + msg);
    	app.io.emit('CANDIDATE_WEB_RTC_BOB', msg);
  	});

    socket.on('RESPONSE_WEB_RTC', function(msg){
    	console.log('RESPONSE_WEB_RTC: ' + msg);
    	app.io.emit('RESPONSE_WEB_RTC', msg);
  	});

  	socket.on('disconnect', function(){
  		console.log('user disconnected');
  	});
  });
}
