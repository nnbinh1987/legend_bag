// ==================== HOW TO RUN THIS =====================
// Call:
// "node Client.js -h [host] -p [port] -k [key]"
//
// If no argument given, it'll be 127.0.0.1:3011
// key is a secret string that authenticate the bot identity
// it is not required when testing
// ===========================================================


//There are 2 types of messages that client need to send to server:
//1. Register messeage: Send back the key from server to authorize your self
//+------------------+------+
//+       1 byte     |1 byte|
//+------------------+------+
//+ COMMAND_SEND_KEY |  Key |
//+------------------+------+
//2. Action message: Inform server of your next move
//+-----------------------+------+---------+
//+          1 byte       |1 byte|  1 byte |
//+-----------------------+------+---------+
//+ COMMAND_SEND_ACTION   |Action|    Dir  |
//+-----------------------+------+---------+

// Get the host and port from argurment
var host = "127.0.0.1";
var port = 3011;
var key = 0;
for (var i=0; i<process.argv.length; i++) {
	if (process.argv[i] == "-h") {
		host = process.argv[i + 1];
	}
	else if (process.argv[i] == "-p") {
		port = process.argv[i + 1];
	}
	else if (process.argv[i] == "-k") {
		key = process.argv[i + 1];
	}
}
if (host == null) host = "127.0.0.1";
if (port == null) port = 3011;
if (key == null) key = 0;




// ================== BEHIND THE SCENE STUFF =================
// Game definition
var GAMESTATE_WAIT_FOR_PLAYER = 0;
var GAMESTATE_COMMENCING = 1;
var GAMESTATE_END = 2;

var COMMAND_SEND_KEY = 1;
var COMMAND_SEND_INDEX = 2;
var COMMAND_SEND_ACTION = 3;
var COMMAND_SEND_STAGE = 4;
var COMMAND_SEND_WINNER = 5;

var ACTION_WAIT = 0;
var ACTION_MOVE = 1;
var ACTION_PICK = 2;
var ACTION_PUT = 3;

var PLAYER_1 = 1;
var PLAYER_2 = 2;

var BLOCK_EMPTY = 0;
var BLOCK_PLAYER_1 = 1;
var BLOCK_PLAYER_2 = 2;
var BLOCK_PLAYER_12 = 3;
var BLOCK_OBSTACLE_SOFT = 4;
var BLOCK_OBSTACLE_HARD = 5;
var BLOCK_BALL = 6;

var DIRECTION_LEFT = 1;
var DIRECTION_UP = 2;
var DIRECTION_RIGHT = 3;
var DIRECTION_DOWN = 4;

var gameState = GAMESTATE_WAIT_FOR_PLAYER;

var MAP_SIZE = 11;



var g_map = new Array();
var winner = null;
var playerIndex = 0;

var myScorePoint = 0;
var opponentScorePoint = 0;

var myStack = 0;
var opponentStack = 0;

// These are friendly variable for user only
var myPosition = new Position(0, 0);
var opponentPosition = new Position(0, 0);
var g_board = new Array();
for (var i=0; i<MAP_SIZE; i++) {
	g_board[i] = new Array();
	for (var j=0; j<MAP_SIZE; j++) {
		g_board[i][j] = 0;
	}
}

//========//=========//

// Position object
function Position(x, y) {
	this.x = x;
	this.y = y;
}

function GetMyScore(){
	return myScorePoint;
}

function GetOpponentScore(){
	return opponentScorePoint;
}
function GetMyStack(){
	return myStack;
}

function GetOpponentStack(){
	return opponentStack;
}
// When receive a packet from server
function OnUpdatePacket(data, offset) {
	// Update all variable
	var i = offset;
	gameState = data[i].charCodeAt(0); i ++;
	winner = data[i].charCodeAt(0); i ++;
	var p1Stack = data[i].charCodeAt(0); i ++;
	var p2Stack = data[i].charCodeAt(0); i ++;
	var p1Point = data[i].charCodeAt(0); i ++;
	var p2Point = data[i].charCodeAt(0); i ++;
	for (var j=0; j<MAP_SIZE * MAP_SIZE; j++) {
		g_map[j] = data[i].charCodeAt(0); i ++;
	}
	
	var p1Action = data[i].charCodeAt(0); i ++;
	var p1ActionDir = data[i].charCodeAt(0); i ++;
	var p2Action = data[i].charCodeAt(0); i ++;
	var p2ActionDir = data[i].charCodeAt(0); i ++;
	
	//update score
	if (playerIndex == PLAYER_1){
		myScorePoint = p1Point;
		opponentScorePoint = p2Point;
	}
	else //if (playerIndex == PLAYER_2)
	{
		opponentScorePoint = p1Point;
		myScorePoint = p2Point;
	}
	
	//update stack
	if (playerIndex == PLAYER_1){
		myStack = p1Stack;
		opponentStack = p2Stack;
	}
	else //if (playerIndex == PLAYER_2)
	{
		opponentScorePoint = p2Stack;
		myScorePoint = p1Stack;
	}
	
	// If it's player turn, notify them to get their input
	if (gameState == GAMESTATE_COMMENCING) {
		ConvertVariable();
		AI_Update();
	}
	else {
		// Do something while waiting for your opponent
	}
}

// Player need to give a command here
function Command(action, dir) {
	if (gameState == GAMESTATE_COMMENCING) {
		var data = "";
		data += String.fromCharCode(COMMAND_SEND_ACTION);
		data += String.fromCharCode(action);
		data += String.fromCharCode(dir);
		Send (data);
	}
}

// Helper
function ConvertCoord (x, y) {
	return y * MAP_SIZE + x;
}
function ConvertVariable () {
	for (var i=0; i<MAP_SIZE; i++) {
		g_board[i] = new Array();
		for (var j=0; j<MAP_SIZE; j++) {
			g_board[i][j] = g_map[ConvertCoord(i, j)];
			
			if (g_board[i][j] == BLOCK_PLAYER_1) {
				if (playerIndex == PLAYER_1) {
					myPosition.x = i;
					myPosition.y = j;
				}
				else {
					opponentPosition.x = i;
					opponentPosition.y = j;
				}
			}
			else if (g_board[i][j] == BLOCK_PLAYER_2) {
				if (playerIndex == PLAYER_2) {
					myPosition.x = i;
					myPosition.y = j;
				}
				else {
					opponentPosition.x = i;
					opponentPosition.y = j;
				}
			}
			else if (g_board[i][j] == BLOCK_PLAYER_12)
			{
				myPosition.x = i;
				myPosition.y = j;
				opponentPosition.x = i;
				opponentPosition.y = j;
			}
		}
	}
}


// Engine
var socketStatus = 0;
var SOCKET_STATUS_ONLINE = 1;
var SOCKET_STATUS_OFFLINE = 0;


// Start new connection to server
var ws;
try {
	ws = require("./NodeWS");
}
catch (e) {
	ws = require("./../NodeWS");
}

var socket = ws.connect ("ws://" + host + ":" + port, [], function () {
	socketStatus = SOCKET_STATUS_ONLINE;
	
	// Send your key (even if you don't have one)
	var data = "";
	data += String.fromCharCode(COMMAND_SEND_KEY);
	data += String.fromCharCode(key);
	Send (data);
});
socket.on("text", function (data) {
	var command = data[0].charCodeAt(0);
	if (command == COMMAND_SEND_INDEX) {
		// Server send you your index, update it
		playerIndex = data[1].charCodeAt(0);
	}
	else if (command == COMMAND_SEND_STAGE) {
		OnUpdatePacket(data, 1);
	}else if(command == COMMAND_SEND_WINNER){
		var playerWiner = data[1].charCodeAt(0);
	}
});
socket.on("error", function (code, reason) {
	socketStatus = SOCKET_STATUS_OFFLINE;
});

// Send data through socket
function Send(data) {
	if (socketStatus == SOCKET_STATUS_ONLINE) {
		socket.sendText(data);
	}
}
// ===========================================================



//////////////////////////////////////////////////////////////////////////////////////
//                                                                                  //
//                                    GAME RULES                                    //
//                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////
// - Game g_board is an array of MAP_SIZExMAP_SIZE blocks                           //
// - 2 players starts at 2 corners of the game g_board                              //
// - Player can only move left/right/up/down and stay inside the game g_board       //
// - The game is over when time up									                //
// - In a competitive match:                                                        //
//   + A player will lose if they cannot connect to server within 10 seconds        //
//////////////////////////////////////////////////////////////////////////////////////

// ===================== PLAYER'S PART =======================
// Do not modify the code above, you won't be able to 'hack',
// all data sent to server is double checked there.
// Further more, if you cause any damage to the server or
// wrong match result, you'll be disqualified right away.
//
// When it's your turn, function "AI_Update" function will be called.
// To make a action, you must call function "Command" with input is
// the Action and Direction you want to do. The list of the argument here:
//
// - ACTION_WAIT : Do nothing
// - ACTION_MOVE : Moving
// - ACTION_PICK : Pick up a soft block
// - ACTION_PUT	 : Put block from stack
//
// - DIRECTION_LEFT
// - DIRECTION_UP
// - DIRECTION_RIGHT
// - DIRECTION_DOWN
//
// To give the decision, you must certainly consider the current
// g_board state. You can use the following variables:
// * Your position:
// - myPosition.x
// - myPosition.y
// * Your opponent position:
// - opponentPosition.x
// - opponentPosition.y
// * g_board:
// - g_board[x][y]
// "g_board" is a 2D array, which will define g_board status.
// Square with value 0 means empty. SOFT and HARD blocks is where you cannot move to.
// The full list of variable is:
// - BLOCK_EMPTY = 0;
// - BLOCK_PLAYER_1 = 1;
// - BLOCK_PLAYER_2 = 2;
// - BLOCK_PLAYER_12 = 3; // two players same position
// - BLOCK_OBSTACLE_SOFT = 4;
// - BLOCK_OBSTACLE_HARD = 5;
// - BLOCK_BALL = 6;
// Which player you are? You can know it from variable "playerIndex"
// Player 1 have value 1, and player 2 have value 2, but you probably
// don't care about that anyway.
//
// That's pretty much about it. Now, let's start coding.
// ===========================================================

function AI_Update() {
	// This is my testing algorithm, which will pick a random valid move, then move.
	// This array contain which move can I make.
	var suitableAction = new Array();
	var suitableDir = new Array();
	// I check the terrain around to find them
	var x = myPosition.x;
	var y = myPosition.y;
	
	//console.log("mapPlayer >>> "+ playerIndex);
	//console.log("player pos: "+ x + " "+ y);
	//for (var i=0; i<MAP_SIZE; i++) {
	//	console.log(g_map.slice(i*MAP_SIZE, i*MAP_SIZE + MAP_SIZE).toString());
	//}
	
	suitableAction.push(ACTION_MOVE);
	suitableAction.push(ACTION_PICK);
	suitableAction.push(ACTION_PUT);
	var selectAction = (Math.random() * suitableAction.length) >> 0;
	var action = suitableAction[selectAction];
	
	// With each movable square, I pust it to the array
	//if (x > 0 && g_board[x-1][y] != BLOCK_OBSTACLE_HARD && g_board[x-1][y] != BLOCK_OBSTACLE_SOFT) {
		suitableDir.push (DIRECTION_LEFT);
	//}
	//if (x < MAP_SIZE - 1 &&  g_board[x+1][y] != BLOCK_OBSTACLE_HARD &&  g_board[x+1][y] != BLOCK_OBSTACLE_SOFT) {
		suitableDir.push (DIRECTION_RIGHT);
	//}
	//if (y > 0 && g_board[x][y-1] != BLOCK_OBSTACLE_HARD && g_board[x][y-1] != BLOCK_OBSTACLE_SOFT) {
		suitableDir.push (DIRECTION_UP);
	//}
	//if (y < MAP_SIZE - 1 &&  g_board[x][y+1] != BLOCK_OBSTACLE_HARD && g_board[x][y+1] != BLOCK_OBSTACLE_SOFT) {
		suitableDir.push (DIRECTION_DOWN);
	//}
	
	// Choose one of the suitable direction
	var selection = (Math.random() * suitableDir.length) >> 0;
	var dir = suitableDir[selection];	
		
	// Call "Command". Don't ever forget this.
	console.log("Action >>" + action + " >> " + dir);
	Command(action, dir);
	// Command(ACTION_MOVE, dir);
}