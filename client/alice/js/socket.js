var socket = io('http://127.0.0.1:3000');

var aliceConn = {};

var reactor = new Reactor();
reactor.registerEvent('webRTCDataChannel');
