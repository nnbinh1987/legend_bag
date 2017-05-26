var MAP_SIZE = 11;

var squareDiv = new Array();
var g_gameScreen = document.getElementById ("GameScreen");
function Init() {
	for (var i=0; i<MAP_SIZE * MAP_SIZE; i++) {
		squareDiv[i] = document.createElement('div');
		squareDiv[i].style.position = "absolute";
		squareDiv[i].style.top = ((i / MAP_SIZE) >> 0) * 60 + "px";
		squareDiv[i].style.left = (i % MAP_SIZE) * 60 + "px";
		squareDiv[i].style.width = "58px";
		squareDiv[i].style.height = "58px";
		squareDiv[i].style.backgroundColor = "#ffffff";
		squareDiv[i].style.border = "1px solid #888888";
		g_gameScreen.appendChild(squareDiv[i]);
	}
}


var GAMESTATE_WAIT_FOR_PLAYER = 0;
var GAMESTATE_COMMENCING = 1;
var COMMAND_SEND_WINNER = 5;

var PLAYER_1 = 1;
var PLAYER_2 = 2;

var ACTION_WAIT = 0;
var ACTION_MOVE = 1;
var ACTION_PICK = 2;
var ACTION_PUT = 3;

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



var playerIndex = 0;
var map = new Array();
var playerPos = new Array();
var turn = PLAYER_1;
var gameState = GAMESTATE_WAIT_FOR_PLAYER;

var packetList = new Array();

function Render() {
	for (var i=0; i<MAP_SIZE * MAP_SIZE; i++) {
		if (map[i] == BLOCK_EMPTY) {
			squareDiv[i].style.backgroundColor = "#ffffff";
		}
		else if (map[i] == BLOCK_PLAYER_1) {
			squareDiv[i].style.backgroundColor = "#0000ff";
		}
		else if (map[i] == BLOCK_PLAYER_2) {
			squareDiv[i].style.backgroundColor = "#ff0000";
		}
		else if (map[i] == BLOCK_PLAYER_12) {
			squareDiv[i].style.backgroundColor = "#ffff00";
		}
		else if (map[i] == BLOCK_OBSTACLE_SOFT) {
			squareDiv[i].style.backgroundColor = "#455555";
		}
		else if (map[i] == BLOCK_OBSTACLE_HARD) {
			squareDiv[i].style.backgroundColor = "#706d48";
		}
		else if (map[i] == BLOCK_BALL) {
			squareDiv[i].style.backgroundColor = "#00ff00";
		}
		else //unknown block
		{
			squareDiv[i].style.backgroundColor = "#ff00ff";
		}
	}
}


function Command (action, dir) {
	if (gameState == GAMESTATE_COMMENCING) {
		var data = "";
		data += String.fromCharCode(COMMAND_SEND_DIRECTION);
		data += String.fromCharCode(action);
		data += String.fromCharCode(dir);
		Send (data);
	}
}

function ConvertCoord (x, y) {
	return y * MAP_SIZE + x;
}


Init();
Render();


function SetPlayerIndex (index) {
	playerIndex = index;
	
	if (playerIndex == PLAYER_1) {
		g_mainDiv.style.backgroundColor = "#003300";
		g_messageDiv.style.color = "#0000ff";
	}
	else if (playerIndex == PLAYER_2) {
		g_mainDiv.style.backgroundColor = "#330000";
		g_messageDiv.style.color = "#ff0000";
	}
	else {
		setInterval (ProcessPacket, 500);
	}
}

function OnMessage (data) {
	packetList.push (data);
	
	// This client is also a player, we render immediatly
	if (playerIndex <= PLAYER_2) {
		ProcessPacket();
	}
	else {
		// This client is just observer, 2 bots will fight in just 50ms
		// We have to slow the whole process down.
	}
}


function ProcessPacket () {
	data = packetList[0];
	
	if (data != null)
	{	
		var gamecommand = data[0].charCodeAt(0);		
		if (gamecommand == COMMAND_SEND_WINNER)
		{
			var winner = data[1].charCodeAt(0);	
			if (playerIndex <= PLAYER_2) {
				if (winner == playerIndex) {
					g_messageDiv.innerHTML = "You win";
				}
				else if (winner == 3) {
					g_messageDiv.innerHTML = "Draw";
				}
				else {
					g_messageDiv.innerHTML = "You lose";
				}
			}
			else {
				if (winner == PLAYER_1) {
					g_messageDiv.innerHTML = "Blue win";
				}
				else if (winner == PLAYER_2) {
					g_messageDiv.innerHTML = "Red win";
				}
				else if (winner == 3){
					g_messageDiv.innerHTML = "Draw";
				} 
				else {
					g_messageDiv.innerHTML = "Bad Draw";
				} 
			}
		}
		else
		{
			var i = 1;
			gameState = data[i].charCodeAt(0); i ++;
			var serverTime = data[i].charCodeAt(0); i ++;
			var p1Stack = data[i].charCodeAt(0); i ++;
			var p2Stack = data[i].charCodeAt(0); i ++;
			var p1Point = data[i].charCodeAt(0); i ++;
			var p2Point = data[i].charCodeAt(0); i ++;
			for (var j=0; j<MAP_SIZE * MAP_SIZE; j++) {
				map[j] = data[i].charCodeAt(0); i ++;
			}
			
			if (gameState == GAMESTATE_WAIT_FOR_PLAYER) {
				g_messageDiv.innerHTML = "Waiting for other player...";
			}
			else if (gameState == GAMESTATE_COMMENCING) {
				if (turn == playerIndex) {
					g_messageDiv.innerHTML = "Your turn";
				}
				else {
					g_messageDiv.innerHTML = "";
				}
			}
			var p1Action = data[i].charCodeAt(0); i ++;
			var p1ActionDir = data[i].charCodeAt(0); i ++;
			var p2Action = data[i].charCodeAt(0); i ++;
			var p2ActionDir = data[i].charCodeAt(0); i ++;
			
		}
		
		packetList.splice (0, 1);
		
		Render();
	}
}


window.onkeyup = function (event) {
	var keycode = event.which;
	if (keycode == 37) {
		Command (ACTION_MOVE, DIRECTION_LEFT);
	}
	else if (keycode == 38) {
		Command (ACTION_MOVE, DIRECTION_UP);
	}
	else if (keycode == 39) {
		Command (ACTION_MOVE, DIRECTION_RIGHT);
	}
	else if (keycode == 40) {
		Command (ACTION_MOVE, DIRECTION_DOWN);
	}
}

Connect();