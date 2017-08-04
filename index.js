//var http = require('http');
var process = require('child_process');
var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var exec = require('exec');
var $ = require("jquery");
 
app.use(express.static(__dirname + '/node_modules'));  
app.use(express.static(__dirname + '/css'));
app.use(express.static(__dirname + '/js'));
app.use(express.static(__dirname + '/fonts'));
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
}); 
app.get('/index.html', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});
app.get('/live_cpu.html', function(req, res,next) {  
    res.sendFile(__dirname + '/live_cpu.html');
});
app.get('/users.html', function(req, res,next) {  
    res.sendFile(__dirname + '/users.html');
});
app.get('/debit.html', function(req, res,next) {  
    res.sendFile(__dirname + '/debit.html');
});
app.get('/services.html', function(req, res,next) {  
    res.sendFile(__dirname + '/services.html');
});
app.get('/git.html', function(req, res,next) {  
    res.sendFile(__dirname + '/git.html');
});

server.listen(8080, function(){
  console.log("Server started listening on *:8080");
});

io.on('connection', function(client) {  
	console.log('Client connected...');
	client.on('join', function(data) {		
		var html = "<table class='table table-striped table-bordered'><col width='70%'><col>";
		process.execFile('/home/telest/MyServer/bash/cpu_usage.sh', function(err, out, code) {
			if (err instanceof Error){
				throw err;
			}
			var cpu_info = JSON.parse(out);
			cpu_info.forEach(function(element){
				var exploded = element[0].split(":");
				html += "<tr><td>" + exploded[0] + "</td><td>" + exploded[1] + "</td></tr>";
			});
			html += "</table>";
			client.emit("serverInfo", html);
		});
	});
	
	client.on('live', function(data) {
		live_cpu();
	});
	
	client.on('user', function(data) {
		var html = "<table class='table table-striped table-bordered'><col width='30%'><col>";
		process.execFile('/home/telest/MyServer/bash/get_users.sh', function(err, out, code) {
			if (err instanceof Error){
				throw err;
			}
			var cpu_info = JSON.parse(out);
			cpu_info.forEach(function(element){
				var exploded = element[0].split(":");
				html += "<tr><td>" + exploded[0] + "</td><td><button onclick='suppr(\"" + exploded[0] + "\")'>Supprimer</button></td></tr>";
			});
			html += "</table>";
			client.emit("user", html);
		});
	});
	
	client.on('create_user', function(data) {
		process.execFile('/home/telest/MyServer/bash/create.sh',[data], function(err, out, code) {
			if (err instanceof Error){
				throw err;
			}
		});
	});
	
	client.on('delete_user', function(data) {
		console.log(data);
		process.execFile('/home/telest/MyServer/bash/delete.sh',[data], function(err, out, code) {
			if (err instanceof Error){
				throw err;
			}
		});
	});
	
	client.on('ip', function(data) {		
		live_debit();
	});
	
	client.on('serv', function(data) {
		process.execFile('/home/telest/MyServer/bash/serv.sh', function(err, out, code) {
			if (err instanceof Error){
				throw err;
			}
			var serv_info = JSON.parse(out);
			client.emit("serv_rep", serv_info);
		});
	});
	
	client.on('create_git', function(data) {
		process.execFile('/home/telest/MyServer/bash/git.sh', [data[0], data[1]], function(err, out, code) {
			if (err instanceof Error){
				throw err;
			}
		});
	});
	
	function live_cpu(){
		exec(['top', '-b', '-d1', '-n1'], function(err, out, code) {
				if (err instanceof Error)
					throw err;
				
				var result = out.replace(new RegExp("\n", 'g'), "<br/>\n");
				var resultServerInfo= result.substr(0, result.indexOf( "<br/>\n<br/>\n"));
				var resultServerProcessus= result.substr(result.indexOf( "<br/>\n<br/>\n")+14, result.length);
				resultServerProcessus= "<span class='col-xs-1'>"
										+resultServerProcessus.replace(new RegExp(" ", 'g'), "</span><span class='col-xs-1'>")
															  .replace(new RegExp("\n", 'g'), "</span>\n<span class='col-xs-1'>")
										+"</span>";
				resultServerProcessus= resultServerProcessus.replace(new RegExp("<span class='col-xs-1'></span>", 'g'), "");
				client.emit("serverInfo", resultServerInfo);
				client.emit("serverProcessus", resultServerProcessus);
			});
		setTimeout(function(){
			live_cpu();
		},1000);
	}
	
	function live_debit(){
		process.execFile('/home/telest/MyServer/bash/debit.sh', function(err, out, code) {
			if (err instanceof Error){
				throw err;
			}
			var cpu_info = JSON.parse(out);
			client.emit("debit", cpu_info[2]);
		});
		setTimeout(function(){
			live_debit();
		},1000);
	}
});