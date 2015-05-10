console.log('Im starting');
// Load the SDK and UUID
var uuid = require('node-uuid');
var io = require('socket.io');
 var express = require('express');
 var app = express()
var server = require('http').createServer(app)
  , io = io.listen(server);
// The node.js HTTP server.
var First = true;
var player1;
var player2;
var callList = [];
var unpairedList = [];
// The socket.io WebSocket server, running with the node.js server.

function Client( Socket, Name, Language, Voice )
{
    this.name = Name;
	this.socket = Socket;
	this.call = undefined;
	this.language = Language;
	this.voice = Voice;
}

function Call (Caller, Receiver)
{
	this.status = 'attempting';
	this.caller = Caller;
	this.receiver = Receiver;
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
		for (var i = 0; i < unpairedList.length; i++){
			if (unpairedList[i].socket == socket){
				caller = unpairedList[i];
				break;
			}
		}
		var name = data.name;
		for (var i = 0; i < unpairedList.length; i++){
			if (unpairedList[i].name == data.name){
				receiver = unpairedList[i];
				break;
			}
		}
		callList.push(new Call(caller, receiver));
		receiver.socket.emit("IncomingCall", JSON.stringify({"name": caller.name}));
	});
	socket.on('Answer', function(data){
		for (var i = 0; i < callList.length; i++){
			if(callList[i].receiver.socket == socket){
				callList[i].status = 'connected';
				socket.emit('Connected','');
				callList[i].sender.socket.emit('Connected', '');
				break;
			}
		}
	});
	socket.on('HangUp', function(data){
		for(var i = 0; i < callList[i].length; i++){
			if (callList[i].receiver.socket == socket){
				callList[i].caller.socket.emit("DroppedCall");
				call.delete();
				break;
			}
			else if(callList[i].caller.socket == socket){
				callList[i].receiver.socket.emit("DroppedCall");
				call.delete();
				break;
			}
		}
	})
	socket.on('Message', function(data){
		for (var i = 0; i < callList.length; i++){
			if (socket == callList[i].receiver.socket){
				callList[i].caller.socket.emit('Messasge', data);
				break;
			}
			else if (socket == callList[i].caller.socket){
				callList[i].receiver.socket.emit('Messasge', data);
				break;
			}
		}
	})
});
