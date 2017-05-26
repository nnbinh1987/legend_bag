// ================== HOW TO USE MAZE RUNNER ===================
// Call:
// "node server.js -p [port] -k [key1] [key2] -r replayFilename"
//
// If no argument given, gameID will be 0, port will be 3011
// =============================================================

//Handle the message received from server
//+-------------------------------+
//+ Type of message | Actual data |
//+-------------------------------+
//There are 3 types of mesages from server:
//1. Index mesage: Send to each player or observer when connected
//+--------------------+-------+
//+        1 byte      | 1 byte|
//+--------------------+-------+
//+ COMMAND_SEND_INDEX | Index |
//+--------------------+-------+
//- Index: PLAYER_1, PLAYER_2 or OBSERVER
//2. Stage message: Send to all client at each step in the game play
//+--------------------+------------+---------+-----------+-----------+-------------------------+-------------------------+
//+        1 byte      |   1 byte   | 1 byte  |  2 bytes  |  2 bytes  | MAP_SIZE*MAP_SIZE bytes |       4 bytes           |
//+--------------------+------------+---------+-----------+-----------+-------------------------+-------------------------+
//+ COMMAND_SEND_STAGE | Game state | Winner  | Stack p12 | Point p12 |		Game board     	    | P12 Action & Direction  |
//+--------------------+------------+---------+-----------+-----------+-------------------------+-------------------------+
//3. Winer mesage: Send to each player or observer when end game
//+---------------------+-------+
//+        1 byte       | 1 byte|
//+---------------------+-------+
//+ COMMAND_SEND_WINNER | Winer |
//+---------------------+-------+

// Require filesystem
var fs = require('fs');

// Get the listening port from argurment
var isCompetitive = false;
var listeningPort = 3011;
var key1 = 0;
var key2 = 0;

var replayFilename = "";
var player1Name = "Player 1";
var player2Name="Player 2";

for (var i=0; i<process.argv.length; i++) {
	if (process.argv[i] == "-p") {
		listeningPort = process.argv[i + 1];
	}
	else if (process.argv[i] == "-k") {
		key1 = process.argv[i + 1];
		key2 = process.argv[i + 2];
	}
	else if (process.argv[i] == "-r") {
		replayFilename = process.argv[i + 1];
	}
	else if (process.argv[i] == "-n") {
		player1Name = process.argv[i + 1];
		player2Name = process.argv[i + 2];
	}
}

if (listeningPort == null || listeningPort == 0) {
	listeningPort = 3011;
}

if (key1 == null) key1 = 0;
if (key2 == null) key2 = 0;

if (key1 != 0 && key2 != 0) {
	isCompetitive = true;
}

// THE GAME ITSELF
var CONNECTING_TIME = 10000;
var THINKING_TIME = 500;
var MATCH_TIME_LOOP = 240;

var GAMESTATE_WAIT_FOR_PLAYER = 0;
var GAMESTATE_COMMENCING = 1;
var GAMESTATE_END = 2;

var COMMAND_SEND_KEY = 1;
var COMMAND_SEND_INDEX = 2;
var COMMAND_SEND_ACTION = 3;
var COMMAND_SEND_STAGE = 4;
var COMMAND_SEND_WINNER = 5;
var COMMAND_SEND_NAME = 6;

var ACTION_WAIT = 0;
var ACTION_MOVE = 1;
var ACTION_PICK = 2;
var ACTION_PUT = 3;

var PLAYER_1 = 1;
var PLAYER_2 = 2;

var PLAYER_STACK_SIZE = 3;

var BLOCK_EMPTY = 0;
var BLOCK_SOFT = 1;
var BLOCK_HARD = 2;
var BLOCK_PLAYER_1 = 1;
var BLOCK_PLAYER_2 = 2;
var BLOCK_PLAYER_12 = 3;
var BLOCK_OBSTACLE_SOFT = 4;
var BLOCK_OBSTACLE_HARD = 5;
var BLOCK_BALL = 6;

//temp value, use on server only
var BLOCK_OBSTACLE_PICKED = 7;
var BLOCK_OBSTACLE_PUT = 8;
var BLOCK_BALL_PICKED = 9;
var BLOCK_BALL_COOLDOWN = 69;
var BLOCK_PLAYER_1_TRAIL = 10;
var BLOCK_PLAYER_2_TRAIL = 11;

var DIRECTION_LEFT = 1;
var DIRECTION_UP = 2;
var DIRECTION_RIGHT = 3;
var DIRECTION_DOWN = 4;

var MAP_SIZE = 11;
var MAP_DATA_SIZE = MAP_SIZE*MAP_SIZE;
var MAP_SIZE_HALF = 6;

var NUM_BLOCK_OBSTACLE = 20;
var NUM_SPAWN_BALL = 7;

var g_map = new Array();
var g_ball_map = new Array();
var g_playerPos = new Array();
var g_playerAction = new Array();
var g_playerActionDir = new Array();
var g_playerPoint = new Array();
var g_playerStack = new Array();

var gameState = GAMESTATE_WAIT_FOR_PLAYER;
var timeOutTimer = null;
var gameInterval = null;
var g_gameTimeLoop = 0;
var player1Index = -1;
var player2Index = -1;

var replayData = new Array();

// Position object
function Position(x, y) {
	this.x = x;
	this.y = y;
}

// Generate a random g_map
function GenerateMap() {
	// Set all block to empty
	for (var i=0; i<MAP_SIZE * MAP_SIZE; i++) {
		g_map[i] = BLOCK_EMPTY;
		g_ball_map[i] = BLOCK_EMPTY;
	}
	
	var midPos = MAP_SIZE * MAP_SIZE_HALF - MAP_SIZE_HALF;
	var numObstacle = (Math.random() * 5) >> 0
	numObstacle += NUM_BLOCK_OBSTACLE;
	// Random obstacles on just one side
	for (var i=0; i < numObstacle; i++) {
		// Find a random block, but not around starting point
		var OK = false;
		while (!OK) {
			block = (Math.random() * midPos) >> 0;
			if (block ==  0 || block ==  1 || block ==  2
			||  block == 10 || block == 11 || block == 12
			||  block == 20 || block == 21 || block == 22
			||  g_map[block] == BLOCK_OBSTACLE_SOFT) {
				// Avoid block too near to the starting point.
				// It might block one player entirely
			}
			else {
				OK = true;
			}
		}
		
		// Assign to that block
		g_map[block] = BLOCK_OBSTACLE_SOFT;
		
		// Assign opposite block
		g_map[MAP_SIZE * MAP_SIZE - 1 - block] = BLOCK_OBSTACLE_SOFT;
	}
	
	// Random poin ball on just one side
	
	// Point ball at mid
	g_map[MAP_SIZE * MAP_SIZE_HALF - MAP_SIZE_HALF] = BLOCK_BALL;
	
	for (var i=0; i<NUM_SPAWN_BALL; i++) {
		// Find a random block, but not around starting point
		var OK = false;
		while (!OK) {
			block = (Math.random() * midPos) >> 0;
			if (block ==  0 || block ==  1
			||  block == 10 || block == 11
			||  block == 20 || block == 21
			||  g_map[block] == BLOCK_BALL) {
				// Avoid block too near to the starting point.
				// It might block one player entirely
			}
			else {
				OK = true;
			}
		}
				
		// Assign to that blockma
		g_map[block] = BLOCK_BALL;
		g_ball_map[block] = BLOCK_BALL;
		
		// Assign opposite block
		g_map[MAP_SIZE * MAP_SIZE - 1 - block] = BLOCK_BALL;
		g_ball_map[MAP_SIZE * MAP_SIZE - 1 - block] = BLOCK_BALL;
	}
	
	// Player 1 status
	g_playerPos[PLAYER_1] = new Position (0, 0);
	g_playerAction[PLAYER_1] = ACTION_WAIT;
	g_playerActionDir[PLAYER_1] = DIRECTION_DOWN;
	g_playerPoint[PLAYER_1] = 0;
	g_playerStack[PLAYER_1] = 0;
	g_map[0] = BLOCK_PLAYER_1;

	// Player 2 status
	g_playerPos[PLAYER_2] = new Position (MAP_SIZE - 1, MAP_SIZE - 1);
	g_playerAction[PLAYER_2] = ACTION_WAIT;
	g_playerActionDir[PLAYER_2] = DIRECTION_LEFT;
	g_playerPoint[PLAYER_2] = 0;
	g_playerStack[PLAYER_2] = 0;
	g_map[MAP_SIZE * MAP_SIZE - 1] = BLOCK_PLAYER_2;
}

// Init a totally new game
function InitGame() {
	// Generate a random g_map
	GenerateMap();

	// Now if this is a competitive game, we won't accept bot that doesn't connect
	if (isCompetitive == true) {
		timeOutTimer = setTimeout (ConnectionTimeOut, CONNECTING_TIME);
	}
}

// Enough player have connected, let's start the game
function StartGame () {
	if (gameState == GAMESTATE_WAIT_FOR_PLAYER) {
		gameState = GAMESTATE_COMMENCING;
		Broadcast();
		
		if (isCompetitive == true) {
			//clear timeout connecting before start
			if(timeOutTimer != null) clearTimeout(timeOutTimer)
			gameInterval = setInterval (GameUpdate, THINKING_TIME);
		}
		else {
            //clear timeout connecting before start
            if(timeOutTimer != null) clearTimeout(timeOutTimer)
            gameInterval = setInterval (GameUpdate, THINKING_TIME * 10);
        }
	}
}

// Command given
function Command (player, action,  dir) {
	if (gameState == GAMESTATE_COMMENCING)
	{
		g_playerAction[player] = action;
		g_playerActionDir[player] = dir;
	}
}

function GameUpdate (){
	if(g_playerAction[PLAYER_1] == ACTION_PUT && g_playerStack[PLAYER_1] > 0)
	{
		var posAction = GetPosWithDir(PLAYER_1, g_playerActionDir[PLAYER_1]);
		if(posAction != null && g_map[ConvertCoord(posAction.x, posAction.y)] == BLOCK_EMPTY)
		{
			g_map[ConvertCoord(posAction.x, posAction.y)] = BLOCK_OBSTACLE_PUT;		
			g_playerStack[PLAYER_1]--;
		}
	}
	
	if(g_playerAction[PLAYER_2] == ACTION_PUT && g_playerStack[PLAYER_2] > 0)
	{
		var posAction = GetPosWithDir(PLAYER_2, g_playerActionDir[PLAYER_2]);
		if(posAction != null 
		&& (g_map[ConvertCoord(posAction.x, posAction.y)] == BLOCK_EMPTY 
		|| g_map[ConvertCoord(posAction.x, posAction.y)] == BLOCK_OBSTACLE_PUT)) //player 2 can put same pos with player 1
		{
			g_map[ConvertCoord(posAction.x, posAction.y)] = BLOCK_OBSTACLE_PUT;
			g_playerStack[PLAYER_2]--;			
		}
	}
	
	//clone maps	
	var g_map_p1 = g_map.slice(0, MAP_DATA_SIZE);
	var g_map_p2 = g_map.slice(0, MAP_DATA_SIZE);
	g_map_p1[ConvertCoord(g_playerPos[PLAYER_2].x, g_playerPos[PLAYER_2].y)] = BLOCK_EMPTY;
	g_map_p1[ConvertCoord(g_playerPos[PLAYER_1].x, g_playerPos[PLAYER_1].y)] = PLAYER_1;
	g_map_p2[ConvertCoord(g_playerPos[PLAYER_1].x, g_playerPos[PLAYER_1].y)] = BLOCK_EMPTY;
	g_map_p2[ConvertCoord(g_playerPos[PLAYER_2].x, g_playerPos[PLAYER_2].y)] = PLAYER_2;	
	
	if(g_playerAction[PLAYER_1] == ACTION_MOVE)
	{
		//update move P1
		var nextPosMove = MoveChecker(PLAYER_1, g_playerActionDir[PLAYER_1]);
		if(nextPosMove != null)
		{
			if(g_map_p1[ConvertCoord(nextPosMove.x, nextPosMove.y)] == BLOCK_BALL)
			{
				g_playerPoint[PLAYER_1]++;
				g_ball_map[ConvertCoord(nextPosMove.x, nextPosMove.y)] = BLOCK_BALL_COOLDOWN;
			}
			g_map_p1[ConvertCoord(g_playerPos[PLAYER_1].x, g_playerPos[PLAYER_1].y)] = BLOCK_EMPTY;
			g_map_p1[ConvertCoord(nextPosMove.x, nextPosMove.y)] = BLOCK_PLAYER_1;			
			g_playerPos[PLAYER_1] = nextPosMove;
			
		}
	}
	else //WAIT
	{
		//: DoNothing
	}
	
	
	//update for player 20
	if(g_playerAction[PLAYER_2] == ACTION_MOVE)
	{
		//update move P2
		var nextPosMove = MoveChecker(PLAYER_2, g_playerActionDir[PLAYER_2]);
		if(nextPosMove != null)
		{
			if(g_map_p2[ConvertCoord(nextPosMove.x, nextPosMove.y)] == BLOCK_BALL)
			{
				g_playerPoint[PLAYER_2]++;
				g_ball_map[ConvertCoord(nextPosMove.x, nextPosMove.y)] = BLOCK_BALL_COOLDOWN;
			}
			g_map_p2[ConvertCoord(g_playerPos[PLAYER_2].x, g_playerPos[PLAYER_2].y)] = BLOCK_EMPTY;
			g_map_p2[ConvertCoord(nextPosMove.x, nextPosMove.y)] = BLOCK_PLAYER_2;			
			g_playerPos[PLAYER_2] = nextPosMove;			
		}
	}
	else //WAIT
	{
		//: DoNothing
	}
	
	if(g_playerAction[PLAYER_1] == ACTION_PICK){
		//update pick
		var posSoftBlock = GetPosWithDir(PLAYER_1, g_playerActionDir[PLAYER_1], g_map_p1);
		if(posSoftBlock != null)
		{
			if (g_map_p1[ConvertCoord(posSoftBlock.x, posSoftBlock.y)] == BLOCK_OBSTACLE_SOFT && g_playerStack[PLAYER_1] < PLAYER_STACK_SIZE){
				g_playerStack[PLAYER_1]++;
				g_map_p1[ConvertCoord(posSoftBlock.x, posSoftBlock.y)] = BLOCK_OBSTACLE_PICKED;	
			}
		else if (g_map_p1[ConvertCoord(posSoftBlock.x, posSoftBlock.y)] == BLOCK_BALL //have ball
			&& g_map_p2[ConvertCoord(posSoftBlock.x, posSoftBlock.y)] == BLOCK_PLAYER_2) //p2 not move here
			{
				//g_playerPoint[PLAYER_1]++;
				//g_ball_map[ConvertCoord(posSoftBlock.x, posSoftBlock.y)] = BLOCK_BALL_COOLDOWN;
			}
		}
	}
	
	if(g_playerAction[PLAYER_2] == ACTION_PICK) {
		//update pick
		var posSoftBlock = GetPosWithDir(PLAYER_2, g_playerActionDir[PLAYER_2], g_map_p2);
		if(posSoftBlock != null)
		{
			if(g_map_p2[ConvertCoord(posSoftBlock.x, posSoftBlock.y)] == BLOCK_OBSTACLE_SOFT && g_playerStack[PLAYER_2] < PLAYER_STACK_SIZE){
				g_playerStack[PLAYER_2]++;
				g_map_p2[ConvertCoord(posSoftBlock.x, posSoftBlock.y)] = BLOCK_OBSTACLE_PICKED;	
			}
		else if (g_map_p2[ConvertCoord(posSoftBlock.x, posSoftBlock.y)] == BLOCK_BALL //have ball
			&& g_map_p1[ConvertCoord(posSoftBlock.x, posSoftBlock.y)] == BLOCK_PLAYER_1) //p1 not move here
		{
			//g_playerPoint[PLAYER_2]++;
			//g_ball_map[ConvertCoord(posSoftBlock.x, posSoftBlock.y)] = BLOCK_BALL_COOLDOWN;
			}
		}
	}
	
	//update map after players do action
	for (var i=0; i<MAP_SIZE * MAP_SIZE; i++) {
		
		if(g_map_p1[i] == BLOCK_PLAYER_1 && g_map_p2[i] == BLOCK_PLAYER_2)
		{
			g_map[i] = BLOCK_PLAYER_12;
		}
		else if(g_map_p1[i] == BLOCK_OBSTACLE_PUT || g_map_p2[i] == BLOCK_OBSTACLE_PUT)
		{
			g_map[i] = BLOCK_OBSTACLE_HARD;
		}
		else if(g_map_p1[i] == BLOCK_OBSTACLE_PICKED || g_map_p2[i] == BLOCK_OBSTACLE_PICKED)
		{
			g_map[i] = BLOCK_EMPTY;
		}
		else
		{
			g_map[i] = (g_map_p1[i] & g_map_p2[i]);
		}
		
		if(g_map_p1[i] == BLOCK_PLAYER_1 && g_map[i] != BLOCK_PLAYER_12)
		{
			g_map[i] = BLOCK_PLAYER_1;
		}
		
		if(g_map_p2[i] == BLOCK_PLAYER_2 && g_map[i] != BLOCK_PLAYER_12)
		{
			g_map[i] = BLOCK_PLAYER_2;
		}
		
		//update cool down ball respawn
		if(g_ball_map[i] > BLOCK_BALL_PICKED)
			g_ball_map[i]--;
		else if(g_ball_map[i] == BLOCK_BALL_PICKED && g_map[i] == BLOCK_EMPTY)
		{
			g_ball_map[i] = BLOCK_BALL;
			g_map[i] = BLOCK_BALL;
		}
	}	
		
	//finish gameLoop, notify player for next action
	Broadcast();
		
	//reset player action
	g_playerAction[PLAYER_1] = ACTION_WAIT;
	g_playerAction[PLAYER_2] = ACTION_WAIT;
	
	g_gameTimeLoop++;
	if(g_gameTimeLoop > MATCH_TIME_LOOP)
	{
		clearInterval(gameInterval);
		var w = GetWinner();
		EndGame(w);
	}
}

function GetWinner()
{
	var thewinner = 0;
	if(g_playerPoint[PLAYER_1] == g_playerPoint[PLAYER_2]){
		thewinner = 3; //draw
	}
	else if(g_playerPoint[PLAYER_1] > g_playerPoint[PLAYER_2]){
		thewinner = 1;
	}
	else if(g_playerPoint[PLAYER_1] < g_playerPoint[PLAYER_2]){
		thewinner = 2;
	}
	return thewinner;
}

// Player move, return next pos if player can move with direction
function MoveChecker(player, dir){
	if (dir == DIRECTION_LEFT) {
		if (g_playerPos[player].x > 0 
		&& (g_map[ConvertCoord(g_playerPos[player].x-1, g_playerPos[player].y)] != BLOCK_OBSTACLE_HARD 
			&& g_map[ConvertCoord(g_playerPos[player].x-1, g_playerPos[player].y)] != BLOCK_OBSTACLE_SOFT
			&& g_map[ConvertCoord(g_playerPos[player].x-1, g_playerPos[player].y)] != BLOCK_OBSTACLE_PUT))
		{
			return new Position (g_playerPos[player].x-1, g_playerPos[player].y);
		}
	}
	else if (dir == DIRECTION_UP) {
		if (g_playerPos[player].y > 0
		&& (g_map[ConvertCoord(g_playerPos[player].x, g_playerPos[player].y-1)] != BLOCK_OBSTACLE_HARD 
			&& g_map[ConvertCoord(g_playerPos[player].x, g_playerPos[player].y-1)] != BLOCK_OBSTACLE_SOFT
			&& g_map[ConvertCoord(g_playerPos[player].x, g_playerPos[player].y-1)] != BLOCK_OBSTACLE_PUT))
		{
			return new Position (g_playerPos[player].x, g_playerPos[player].y-1);
		}
	}
	else if (dir == DIRECTION_RIGHT) {
		if (g_playerPos[player].x < MAP_SIZE - 1
		&& (g_map[ConvertCoord(g_playerPos[player].x+1, g_playerPos[player].y)] != BLOCK_OBSTACLE_HARD 
			&& g_map[ConvertCoord(g_playerPos[player].x+1, g_playerPos[player].y)] != BLOCK_OBSTACLE_SOFT
			&& g_map[ConvertCoord(g_playerPos[player].x+1, g_playerPos[player].y)] != BLOCK_OBSTACLE_PUT))
		{
			return new Position (g_playerPos[player].x+1, g_playerPos[player].y);
		}
	}
	else if (dir == DIRECTION_DOWN) {
		if (g_playerPos[player].y < MAP_SIZE - 1
		&& (g_map[ConvertCoord(g_playerPos[player].x, g_playerPos[player].y+1)] != BLOCK_OBSTACLE_HARD 
			&& g_map[ConvertCoord(g_playerPos[player].x, g_playerPos[player].y+1)] != BLOCK_OBSTACLE_SOFT
			&& g_map[ConvertCoord(g_playerPos[player].x, g_playerPos[player].y+1)] != BLOCK_OBSTACLE_PUT))
		{
			return new Position (g_playerPos[player].x, g_playerPos[player].y+1);
		}
	}
	return null;
}

//return pos with dir of action
function GetPosWithDir(player, dir){
	if (dir == DIRECTION_LEFT) {
		if (g_playerPos[player].x > 0)
		{
			return new Position (g_playerPos[player].x-1, g_playerPos[player].y);
		}
	}
	else if (dir == DIRECTION_UP) {
		if (g_playerPos[player].y > 0)
		{
			return new Position (g_playerPos[player].x, g_playerPos[player].y-1);
		}
	}
	else if (dir == DIRECTION_RIGHT) {
		if (g_playerPos[player].x < MAP_SIZE - 1)
		{
			return new Position (g_playerPos[player].x+1, g_playerPos[player].y);
		}
	}
	else if (dir == DIRECTION_DOWN) {
		if (g_playerPos[player].y < MAP_SIZE - 1)
		{
			return new Position (g_playerPos[player].x, g_playerPos[player].y+1);
		}
	}
	return null;
}

// Player pick soft obstacle, return next pos of the obstacle if player can pick up it with direction
function PickBlockCheck(player, dir, g_map_){
	if (dir == DIRECTION_LEFT) {
		if (g_playerPos[player].x > 0 
			&& (g_map_[ConvertCoord(g_playerPos[player].x-1, g_playerPos[player].y)] == BLOCK_OBSTACLE_SOFT
				|| g_map_[ConvertCoord(g_playerPos[player].x-1, g_playerPos[player].y)] == BLOCK_BALL)
			)
		{
			return new Position (g_playerPos[player].x-1, g_playerPos[player].y);
		}
	}
	else if (dir == DIRECTION_UP) {
		if (g_playerPos[player].y > 0
			&& (g_map_[ConvertCoord(g_playerPos[player].x, g_playerPos[player].y-1)] == BLOCK_OBSTACLE_SOFT
				|| g_map_[ConvertCoord(g_playerPos[player].x, g_playerPos[player].y-1)] == BLOCK_BALL)
			)
		{
			return new Position (g_playerPos[player].x, g_playerPos[player].y-1);
		}
	}
	else if (dir == DIRECTION_RIGHT) {
		if (g_playerPos[player].x < MAP_SIZE - 1
			&& (g_map_[ConvertCoord(g_playerPos[player].x+1, g_playerPos[player].y)] == BLOCK_OBSTACLE_SOFT
				|| g_map_[ConvertCoord(g_playerPos[player].x+1, g_playerPos[player].y)] == BLOCK_BALL)
			)
		{
			return new Position (g_playerPos[player].x+1, g_playerPos[player].y);
		}
	}
	else if (dir == DIRECTION_DOWN) {
		if (g_playerPos[player].y < MAP_SIZE - 1
			&& (g_map_[ConvertCoord(g_playerPos[player].x, g_playerPos[player].y+1)] == BLOCK_OBSTACLE_SOFT
				|| g_map_[ConvertCoord(g_playerPos[player].x, g_playerPos[player].y+1)] == BLOCK_BALL)
			)
		{
			return new Position (g_playerPos[player].x, g_playerPos[player].y+1);
		}
	}
	return null;
}

function ConnectionTimeOut() {
	// If after a while, 2 bots don't show up, (or one of them)
	for (var i=0; i<2; i++) {
		if (socketList[i] != null) {
			if (socketList[i].index == 1) {	
				EndGame (PLAYER_1);
				return;
			}
			else if (socketList[i].index == 2) {	
				EndGame (PLAYER_2);
				return;
			}
		}
	}
	
	// If 2 bots doesn't show up, it's a draw.
	EndGame (0);
}

function EndGame (winner) {
	// Game end, there is a winner
	gameState = GAMESTATE_END;

	var data = "";
	data += String.fromCharCode(COMMAND_SEND_WINNER);
	data += String.fromCharCode(winner);
	
	AddToReplay(data);
	
	// Send the data to all socket
	for (var i=0; i<socketList.length; i++) {
		if (socketStatus[i] == SOCKET_STATUS_ONLINE) {
			socketList[i].sendText(data);
		}
	}
	
	// Save to replay
	setTimeout(function() {
		SaveReplay();
	}, 2000);
}

function ConvertCoord (x, y) {
	return y * MAP_SIZE + x;
}


var SOCKET_STATUS_ONLINE = 1;
var SOCKET_STATUS_OFFLINE = 0;

var socketList = new Array();
var socketStatus = new Array();

var ws = require("./../NodeWS");
var server = ws.createServer(function (socket) {
	// Detect to see if this socket have already connected before
	for (var i=0; i<socketList.length; i++) {
		if (socketList[i] == socket) {	
			socketStatus[i] = SOCKET_STATUS_ONLINE;
            return;
        }
	}
	
	// This socket is new
	var index = socketList.length;
	socketList[index] = socket;
	socketStatus[index] = SOCKET_STATUS_ONLINE;
	
	// Receive a text
    socket.on("text", function (data) {
		if(data[0] == null || data[1] == null) {
			return;
		}
		var command = data[0].charCodeAt(0);
		var argument1 = data[1].charCodeAt(0);
		var argument2 = 0;
		if (data[2] != null) {
			argument2 = data[2].charCodeAt(0);
		}
		
		// First, if we receive an indexing command
		if (command == COMMAND_SEND_KEY) {
			if (socket.index == null) {
				// Get the key
				var key = argument1;

                if (isCompetitive == false) {
                    // If this is not a competitive match
                    // We just provide index according to
                    // connection order
                    for (var i=0; i<socketList.length; i++) {
                        if (socketList[i] == socket) {
                            socket.index = i + 1;
                        }
                    }
                }
                else {
                    // We compare the key
                    if (key == key1) {
                        player1Index = socket.index = 1;
                    }
                    else if (key == key2) {
                        player2Index = socket.index = 2;
                    }
                    else {
                        // This is observer case
                        socket.index = 3;
                    }
                }
				
				// Send index to client
				var data = "";
				data += String.fromCharCode(COMMAND_SEND_INDEX);
				data += String.fromCharCode(socket.index);
				
				socket.sendText(data);
			}
			
			// If two players are ready, we start the game.
            if (gameState == GAMESTATE_WAIT_FOR_PLAYER && player1Index != -1 && player2Index != -1) {
				StartGame();
            }
        }
        else if (command == COMMAND_SEND_ACTION) {
            // If we receive a command, move
            Command (socket.index, argument1, argument2);
        }
        else if( command == COMMAND_SEND_NAME){
            var data = "";
            data += String.fromCharCode(COMMAND_SEND_NAME);
            data += player1Name + "_" + player2Name;
            socket.sendText(data);
        }
    });
	
	// This socket disconnected
    socket.on("close", function (code, reason) {
        for (var i=0; i<socketList.length; i++) {
			if (socketList[i] == socket) {
				socketStatus[i] = SOCKET_STATUS_OFFLINE;
			}
		}
    });
	
	// Error is treated same as disconnected
	socket.on("error", function (code, reason) {
        for (var i=0; i<socketList.length; i++) {
			if (socketList[i] == socket) {
				socketStatus[i] = SOCKET_STATUS_OFFLINE;
			}
		}
    });
		 
}).listen(listeningPort);

function Broadcast () {
	var data = "";
	data += String.fromCharCode(COMMAND_SEND_STAGE);
	data += String.fromCharCode(gameState);
	data += String.fromCharCode(0);
	data += String.fromCharCode(g_playerStack[PLAYER_1]);
	data += String.fromCharCode(g_playerStack[PLAYER_2]);
	data += String.fromCharCode(g_playerPoint[PLAYER_1]);
	data += String.fromCharCode(g_playerPoint[PLAYER_2]);
	for (var i=0; i<MAP_SIZE * MAP_SIZE; i++) {
		data += String.fromCharCode(g_map[i]);
	}
	data += String.fromCharCode(g_playerAction[PLAYER_1]);
	data += String.fromCharCode(g_playerActionDir[PLAYER_1]);
	data += String.fromCharCode(g_playerAction[PLAYER_2]);
	data += String.fromCharCode(g_playerActionDir[PLAYER_2]);
	AddToReplay(data);
	
	// Send the data to all socket
	for (var i=0; i<socketList.length; i++) {
		if (socketStatus[i] == SOCKET_STATUS_ONLINE) {
			socketList[i].sendText(data);
		}
	}
}

function CloseServer() {
	for (var i=0; i<socketList.length; i++) {
		if (socketStatus[i] == SOCKET_STATUS_ONLINE) {
			socketList[i].close (1000, "Game end!");
		}
	}
	console.log(GetWinner());
	process.exit(0);
}

function AddToReplay(data) {
	if (replayFilename != null) {
		replayData.push(data);
	}
}

function SaveReplay() {
	if (replayFilename != null) {
		var replayString = "";
		for (var i = 0; i < replayData.length; i++)
			replayString += replayData[i];
			
		fs.writeFile(replayFilename, replayString, function(err) {
			if(err) {
			}
			CloseServer();
		});
	}
	else {
		CloseServer();
	}
}

InitGame();