#pragma once

#include "Game.h"
#include <ctime>
#include <cstdio>

using namespace std;
using easywsclient::WebSocket;

// Update this value to match with server
const char VERSION = 1;

Game* Game::s_instance = NULL;
std::string Game::host = "127.0.0.1";
unsigned int Game::port = 3011;
unsigned int Game::key = 0;
WebSocket::pointer Game::wsClient = NULL;

clock_t start;

Game::Game()
{
	AI::CreateInstance();
}

Game::~Game()
{
	delete wsClient;
	AI::DestroyInstance();
}

int Game::Connect(int argc, char* argv[])
{
	start = clock();
	
	// Get parameters
	for(int i = 0; i < argc; i++)
	{
		if(strcmp(argv[i], "-h") == 0)
		{
			host = argv[++i];
			if(host == "")
			{
				host = "127.0.0.1";
			}
		}
		else if(strcmp(argv[i], "-p") == 0)
		{
			port = atoi(argv[++i]);
			if(port == 0)
			{
				port = 3011;
			}
		}
		else if(strcmp(argv[i], "-k") == 0)
		{
			key = atoi(argv[++i]);
		}
	}

	std::stringstream connectionString;
	connectionString << "ws://" << host << ":" << port;
	wsClient = WebSocket::from_url(connectionString.str());
    if(!wsClient)
	{
		return -1;
	}
	long connectionTime = clock() - start;
	LOG("Connection time: %ld ms\n", connectionTime);
	AI_Register();
	
	return 0;
}

void Game::PollingFromServer()
{
	// Polling from server every 100 ms
	while (wsClient->getReadyState() != WebSocket::CLOSED) {
      wsClient->poll();
      wsClient->dispatch(&Game::OnMessage);
	  Sleep(100);
    }
}

//void OnMessage(const std::string & data)
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
//- Index: PLAYER_X, PLAYER_O or OBSERVER

//2. Stage message: Send to all client at each step in the game play
//+--------------------+------------+---------+-----------+-----------+-------------------------+
//+        1 byte      |   1 byte   | 1 byte  |  2 bytes  |  2 bytes  | MAP_SIZE*MAP_SIZE bytes |
//+--------------------+------------+---------+-----------+-----------+-------------------------+
//+ COMMAND_SEND_STAGE | Game state | Winner  | Stack p12 | Point p12 |		Game board     	    |
//+--------------------+------------+---------+-----------+-----------+-------------------------+

//3. Winer mesage: Send to each player or observer when end game
//+---------------------+-------+
//+        1 byte       | 1 byte|
//+---------------------+-------+
//+ COMMAND_SEND_WINNER | Winer |
//+---------------------+-------+
//- Winner: 0, PLAYER_X or PLAYER_O

void Game::OnMessage(const std::string & data)
{
	int offset = 0;
	char command = (data.at(offset++));
	char index;
	int gameState;
	int gameTime;
	int stackp1, stackp2;
	int pointp1, pointp2;
	std::vector<Position> listBall, listHard, listSoft;
	int winner;
	int board[MAP_SIZE * MAP_SIZE];
	AI * p_AI;
	Position myPos;
	Position enemyPos;
	switch(command)
	{
	case COMMAND_SEND_INDEX:
		index = data.at(offset++);
		LOG("My index is: %d\n", int(index));
		AI::GetInstance()->SetPlayerIndex(index);
		break;
	case COMMAND_SEND_WINNER:
		winner = data.at(offset);
		if (winner == AI::GetInstance()->GetPlayerIndex())
		{
			LOG("Congratulations! You won!\n");
		}
		else
		{
			LOG("Game over! You lose!\n");
		}
		exit(0);
		break;
	case COMMAND_SEND_STAGE:
		gameState = data.at(offset++);
		winner = data.at(offset++);
		stackp1 = data.at(offset++);
		stackp2 = data.at(offset++);
		pointp1 = data.at(offset++);
		pointp2 = data.at(offset++);
		p_AI = AI::GetInstance();
		
		//update game board
		for(int y = 0; y < MAP_SIZE; y++)
		{
			for(int x = 0; x < MAP_SIZE; x++)
			{
				int idx = CONVERT_COORD(x,y);
				board[idx] = data.at(offset + idx);
				LOG("%d ", board[idx]);

				if(board[idx] == BLOCK_PLAYER_1)
				{
					if(p_AI->GetPlayerIndex() == PLAYER_1)
					{
						myPos = Position(x, y);
					}
					else
					{
						enemyPos = Position(x, y);
					}
				}
				else if(board[idx] == BLOCK_PLAYER_2)
				{
					if(p_AI->GetPlayerIndex() == PLAYER_2)
					{
						myPos = Position(x, y);
					}
					else
					{
						enemyPos = Position(x, y);
					}
				}
				else if (board[idx] == BLOCK_PLAYER_12)
				{
					myPos = Position(x, y);
					enemyPos = Position(x, y);
				}
				else if (board[idx] == BLOCK_OBSTACLE_HARD){
					listHard.push_back(Position(x, y));
				}
				else if (board[idx] == BLOCK_OBSTACLE_SOFT){
					listSoft.push_back(Position(x, y));
				}
				else if (board[idx] == BLOCK_BALL){
					listBall.push_back(Position(x, y));
				}
			}
			LOG("\n");
		}
		//
		int p1action = data.at(offset++);
		int p1actiondir = data.at(offset++);
		int p2action = data.at(offset++);
		int p2actiondir = data.at(offset++);

		LOG("\n");
		LOG("My position: (%d,%d)\n", myPos.x, myPos.y);
		LOG("Enemy position: (%d,%d)\n", enemyPos.x, enemyPos.y);
		//@TODO: set point, stack, gameTime..
		p_AI->SetMyPosition(myPos);
		p_AI->SetEnemyPosition(enemyPos);
		p_AI->SetBoard(board);

		p_AI->SetListBallMap(listBall);
		p_AI->SetListHardBlock(listHard);
		p_AI->SetListSoftBlock(listSoft);

		if (p_AI->GetPlayerIndex() == PLAYER_1)
		{
			p_AI->SetMyBlockStack(stackp1);
			p_AI->SetEnemyBlockStack(stackp2);
			p_AI->SetMyPointScore(pointp1);
			p_AI->SetEnemyPointScore(pointp2);
		}
		else
		{
			p_AI->SetMyBlockStack(stackp2);
			p_AI->SetEnemyBlockStack(stackp1);
			p_AI->SetMyPointScore(pointp2);
			p_AI->SetEnemyPointScore(pointp1);
		}

		p_AI->Update();
		break;
	}
}

//There are 2 types of messages that client need to send to server:
//1. Register messeage: Send back the key from server to authorize your self
//+------------------+------+---------+
//+       1 byte     |1 byte|  1 byte |
//+------------------+------+---------+
//+ COMMAND_SEND_KEY |  Key | VERSION |
//+------------------+------+---------+
//2. Action message: Inform server of your next move
//+-----------------------+------+---------+
//+          1 byte       |1 byte|  1 byte |
//+-----------------------+------+---------+
//+ COMMAND_SEND_ACTION   |Action|  Dir    |
//+-----------------------+------+---------+


void Game::AI_Register()
{
	LOG("Register bot with key %u\n", key);
	std::string data = "";
	data += char(COMMAND_SEND_KEY);
	data += char(key);
	wsClient->send(data);
}

void Game::AI_DoAction(int action, int dir)
{
	LOG("AI_DoAction move: %d\n", dir);
	std::string data = "";
	data += char(COMMAND_SEND_ACTION);
	data += char(action);
	data += char(dir);
	wsClient->send(data);
}