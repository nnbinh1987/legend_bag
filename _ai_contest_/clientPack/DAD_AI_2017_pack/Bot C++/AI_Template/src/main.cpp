#include <ai/Game.h>
#include <ai/AI.h>
#include <time.h>

#include "AStar.h"
// ==================== HOW TO RUN THIS =====================
// Call:
// "AI_Template.exe -h [host] -p [port] -k [key]"
//
// If no argument given, it'll be 127.0.0.1:3011
// key is a secret string that authenticate the bot identity
// it is not required when testing
// ===========================================================

//////////////////////////////////////////////////////////////////////////////////////
//                                                                                  //
//                                    GAME RULES                                    //
//                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////
// - Game board is an array of MAP_SIZExMAP_SIZE blocks                             //
// - 2 players starts at 2 corners of the game board                                //
// - Each player will take turn to move                                             //
// - Player can only move left/right/up/down and stay inside the game board         //
// - The game is over when one of 2 players cannot make a valid move                //
// - In a competitive match:                                                        //
//   + A player will lose if they cannot connect to server within 10 seconds        //
//   + A player will lose if they don't make a valid move within 3 seconds          //
//////////////////////////////////////////////////////////////////////////////////////

// This function is called automatically each turn.
// If it's your turn, remember to call AI_Move() with a valid move before the time is run out.
// See <ai/Game.h> and <ai/AI.h> for supported APIs.

clock_t last_clock = clock();
int iCurrentState = STATE_FIND_BALL;

void SwitchState(int nextState);
void doActionIfCan(int action, int direction);


const std::vector<Position>	directions = {
	//LEFT,       UP,     RIGHT,  DOWN
	{ -1, 0 },{ 0, -1 },{ 1, 0 },{ 0, 1 }
};

int calculateDistance(Position Pos1, Position Pos2)
{
	return abs(Pos1.x - Pos2.x) + abs(Pos1.y - Pos2.y);
}

Position findNearestTarget()
{
	AI *p_ai = AI::GetInstance();
	int * board = p_ai->GetBoard();	// Access block at (x, y) by using board[CONVERT_COORD(x,y)]
	Position myPos = p_ai->GetMyPosition();
	vector<Position> listBall = p_ai->GetListBall();

	if (listBall.size() == 0)
	{
		SwitchState(STATE_WAIT_BALL);
		return myPos;
	}

	int minSteps = 30;
	int nearestBall = 0;

	for (int i = 0; i <listBall.size(); i++)
	{
		if (calculateDistance(listBall[i], myPos) < minSteps)
		{
			minSteps = calculateDistance(listBall[i], myPos);
			nearestBall = i;
		}
	}

	return listBall[nearestBall];
}

Position findNextMove()
{
	return Position(0, 0);
}

int getDerection(Position myPos, Position nexPos)
{
	for (int i = 0; i<=3; i++)
	{
		if (nexPos.x == myPos.x + directions[i].x && nexPos.y == myPos.y + directions[i].y)
		{
			return i + 1; // +1 to fix with define from AI.
		}
	}
}

void behavior_findball()
{	
	AI *p_ai = AI::GetInstance();
	Position myPos = p_ai->GetMyPosition();
	printf("Finding ball.stack = %d", p_ai->GetMyBlockStack());
	Position nrT = findNearestTarget();

	AStar::Generator generator;
	generator.setHeuristic(AStar::Heuristic::euclidean);
	generator.setCollision(p_ai->GetListHardBlock());

	auto path = generator.findPath(myPos, nrT);

	while (path.size() != 0)
	{
		auto nextPos = path.back();
		std::cout << "[" << nextPos.x << "," << nextPos.y << "]";
		path.pop_back();
		if (!(nextPos == myPos))
		{
			int direction = getDerection(myPos, nextPos);			
			if (p_ai->GetBlock(Position(nextPos.x, nextPos.y)) == BLOCK_OBSTACLE_SOFT) // PICK UP
			{
				if (p_ai->GetMyBlockStack() < 3) // CAN PICK UP
				{
					Game::GetInstance()->AI_DoAction(ACTION_PICK, direction);
				}
				else // PUT DOWN IN REVERT DIRECTION					
				{
					int newdir = direction + 2 > 4 ? direction - 2 : direction + 2;
					if (p_ai->GetBlock(getNextPosByDirection(myPos, newdir)) == BLOCK_EMPTY)
					{
						Game::GetInstance()->AI_DoAction(ACTION_PUT, newdir);
					}
					else {

					}
					
				}
				
			}
			else if (p_ai->GetBlock(Position(nextPos.x, nextPos.y)) != BLOCK_OBSTACLE_SOFT) // MOVE
			{
				Game::GetInstance()->AI_DoAction(ACTION_MOVE, direction);
			}			
			return;
		}
		
	}
}

void behavior_waitball()
{
	printf("Waiting ball.");
	AI *p_ai = AI::GetInstance();
	Position myPos = p_ai->GetMyPosition();

	vector<Position> listBall = p_ai->GetListBall();

	if (listBall.size() != 0)
	{
		SwitchState(STATE_FIND_BALL);
		return;
	}
}

void behavior_settrap()
{

}

void behavior_waittotrap()
{

}

void UpdateState(int currentState)
{
	switch (currentState)
	{
	case STATE_IDLE:
		//behavior_idle();
		break;
	case STATE_FIND_BALL:
		behavior_findball();
		break;
	case STATE_WAIT_BALL:
		behavior_waitball();
	case STATE_SET_TRAP:
		behavior_settrap();
	case STATE_WAIT_TO_TRAP:
		behavior_waittotrap();
		break;
	}
}

void SwitchState(int nextState)
{
	iCurrentState = nextState;
}

Position getNextPosByDirection(Position curPos, int direction)
{
	return {curPos.x + directions[direction - 1].x, curPos.y + directions[direction - 1].y };
}

void doActionIfCan(int action, int direction)
{
	AI *p_ai = AI::GetInstance();
	Position myPos = p_ai->GetMyPosition();

	switch (action)
	{
	case ACTION_PUT:
		if (p_ai->GetBlock(getNextPosByDirection(myPos, direction)) == BLOCK_EMPTY)
		{

		}
		break;
	case ACTION_PICK:
		break;
	case ACTION_MOVE:
		break;
	default:
		break;
	}
}

void MakeRandomMove()
{
	AI *p_ai = AI::GetInstance();
	int * board = p_ai->GetBoard();	// Access block at (x, y) by using board[CONVERT_COORD(x,y)]
	Position myPos = p_ai->GetMyPosition();
	Position enemyPos = p_ai->GetEnemyPosition();



	//Just a silly bot with random moves
	vector<int> freeToMoves;
	if (myPos.x > 0 && p_ai->GetBlock(Position(myPos.x - 1, myPos.y)) != BLOCK_OBSTACLE_SOFT)
	{
		freeToMoves.push_back(DIRECTION_LEFT);
	}
	if (myPos.x < MAP_SIZE - 1 && p_ai->GetBlock(Position(myPos.x + 1, myPos.y)) != BLOCK_OBSTACLE_SOFT)
	{
		freeToMoves.push_back(DIRECTION_RIGHT);
	}
	if (myPos.y > 0 && p_ai->GetBlock(Position(myPos.x, myPos.y - 1)) != BLOCK_OBSTACLE_SOFT)
	{
		freeToMoves.push_back(DIRECTION_UP);
	}
	if (myPos.y < MAP_SIZE - 1 && p_ai->GetBlock(Position(myPos.x, myPos.y + 1)) != BLOCK_OBSTACLE_SOFT)
	{
		freeToMoves.push_back(DIRECTION_DOWN);
	}

	int size = freeToMoves.size();
	printf("Free move size = %d", size);
	if (size > 0)
	{
		int direction = freeToMoves[rand() % size];
		LOG("Move: %d\n", direction);

		//Remember to call AI_DoAction() within allowed time
		Game::GetInstance()->AI_DoAction(ACTION_MOVE, direction);
	}
}

void AI_Update()
{ 
	int time_diff = clock() - last_clock;
	printf("Diff %d\n", time_diff);
	last_clock = clock();

	UpdateState(iCurrentState);	

	//MakeRandomMove();
}

////////////////////////////////////////////////////////////
//                DON'T TOUCH THIS PART                   //
////////////////////////////////////////////////////////////

int main(int argc, char* argv[])
{
	srand(clock());
	
#ifdef _WIN32
    INT rc;
    WSADATA wsaData;

    rc = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (rc) {
        printf("WSAStartup Failed.\n");
        return 1;
    }
#endif

	Game::CreateInstance();
	Game * p_Game = Game::GetInstance();
	
	// Create connection
	if (p_Game->Connect(argc, argv) == -1)
	{
		LOG("Failed to connect to server!\n");
		return -1;
	}

	// Set up function pointer
	AI::GetInstance()->Update = &AI_Update;
	
	p_Game->PollingFromServer();

	Game::DestroyInstance();

#ifdef _WIN32
    WSACleanup();
#endif
	return 0;
}