console.log('Im starting');
// Load the SDK and UUID
var uuid = require('node-uuid');
var io = require('socket.io');
var express = require('express');
var app = express()
  , server = require('http').createServer(app)
  , io = io.listen(server);
// The node.js HTTP server.
var First = true;
var player1;
var player2;
var callList = [];
var unpairedList = [];
// The socket.io WebSocket server, running with the node.js server.

function Client( Socket, Name )
{
    this.name = Name;
	this.socket = Socket;
}

function Call (_client1, _client2)
{
	this.status = 'attempting';
	this.client1 = _client1;
	this.client2 = _client2;
}

server.listen(1357);
io.on('connection', function(socket){
	console.log('new connection');
	socket.on('StartConnection', function (data) 
	{
		console.log('start');
		console.log('name', name);
			unpairedList.push(new Client(socket, data.name));
			player1.socket.emit('Hello', "");
		// else{
		// 	var client = new Client(false, socket);
		// 	var pair = new Pair(client, unpairedList[0]);
		// 	unpairedList.shift();
		// 	pairedList.push(pair);
		// 	pair.client1.emit('ConnectionStart', JSON.stringify({'id': 1}));
		// 	pair.client2.emit('ConnectionStart', JSON.stringify({'id': 2}));
		// }
	});
	socket.on('Call', function(data){
		var caller, receiver;
		for (var i = 0 i < unpairedList.length; i++){
			if (unpairedList[i].socket == socket){
				caller = unpairedList[i];
			}
		}
		var name = data.name;
		for (var i = 0 ; i < unpairedList.length; i++){
			if (unpairedList[i].name == data.name){
				receiver = unpairedList[i];
			}
		}
	})


});