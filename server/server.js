console.log('Im starting');
// Load the SDK and UUID
var uuid = require('node-uuid');
var io = require('socket.io');
var express = require('express');
var app = express();
var server = require('http').createServer(app)
  , io = io.listen(server);
// The node.js HTTP server.
var First = true;
var player1;
var player2;
var callList = [];
var clientList = [];
// The socket.io WebSocket server, running with the node.js server.

function Client( Socket, Name, Language, Gender )
{
    this.name = Name;
	this.socket = Socket;
	this.call = undefined;
	this.language = Language;
	this.gender = Gender;
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
		console.log('New Connection');
		console.log('name', data.name);
		console.log('language', data.language);
		console.log('gender', data.gender);
		var client = new Client(socket, data.name, data.language, data.gender);
		for (var i = 0; i < clientList.length; i++){
			if (clientList[i].name == data.name){
				clientList.splice(i, 1);
			}
		}
		clientList.push(client);
		client.socket.emit('StartConnection', "");
		// else{
		// 	var client = new Client(false, socket);
		// 	var pair = new Pair(client, clientList[0]);
		// 	clientList.shift();
		// 	pairedList.push(pair);
		// 	pair.client1.emit('ConnectionStart', JSON.stringify({'id': 1}));
		// 	pair.client2.emit('ConnectionStart', JSON.stringify({'id': 2}));
		// }
	});
	socket.on('Call', function(data){
		console.log('Somebody is making a call');
		var caller, receiver;
		for (var i = 0; i < clientList.length; i++){
			if (clientList[i].socket == socket){
				caller = clientList[i];
				break;
			}
		}
		var name = data.name;
		for (var i = 0; i < clientList.length; i++){
			if (clientList[i].name == data.name){
				receiver = clientList[i];
				break;
			}
		}
		if (receiver && caller){
			var call = new Call(caller, receiver);
			callList.push(call);
			receiver.call = call;
			caller.call = call;
			receiver.socket.emit("IncomingCall", {"name": caller.name});
		}
		else{
			socket.emit('CallDropped', '');
		}
	});
	socket.on('Answer', function(data){
		console.log('sombody answered the call');
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
		console.log('Somebody hung up');
		for(var i = 0; i < callList[i].length; i++){
			if (callList[i].receiver.socket == socket){
				callList[i].caller.socket.emit("DroppedCall");
				callList[i].caller.call = undefined;
				callList[i].receiver.call = undefined;
				call.delete();
				break;
			}
			else if(callList[i].caller.socket == socket){
				callList[i].receiver.socket.emit("DroppedCall");
				callList[i].caller.call = undefined;
				callList[i].receiver.call = undefined;
				call.delete();
				break;
			}
		}
	});
	socket.on('Message', function(data){
		console.log('got a message', data.content)
		for (var i = 0; i < callList.length; i++){
			if (socket == callList[i].receiver.socket){
				callList[i].caller.socket.emit('Messasge', JSON.stringify({"content":data.content, "lang_from":callList[i].caller.language, "lang_to":callList[i].receiver.language, "gender": callList[i].caller.gender}));
				break;
			}
			else if (socket == callList[i].caller.socket){
				callList[i].receiver.socket.emit('Messasge', JSON.stringify({"content":data.content, "lang_from":callList[i].receiver.language, "lang_to":callList[i].caller.language, "gender": callList[i].receiver.gender}));
				break;
			}
		}
	});
	socket.on('TerminateConnection', function(data){
		console.log('Somebody is terminating the connection');
		for (var i = 0; i < clientList.length; i++){
			if (clientList[i].socket == socket){
				if (clientList[i].call != undefined){
					if (socket == clientList[i].caller.socket){
						clientList[i].receiver.socket.emit('DroppedCall');
					}
					else if (socket == clientList[i].receiver.socket){
						clientList[i].caller.socket.emit('DroppedCall');
					}
					clientList[i].call.caller.call = undefined;
					clientList[i].call.receiver.call = undefined;
					call.delete();
				}
				clientList[i].delete();
				return;
			}
		}
	});
});
