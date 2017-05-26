#include "AI.h"
#include <windows.h>

using namespace std;

AI* AI::s_instance = NULL;

AI::AI() : Update (NULL), m_myPosition(Position(0, 0)), m_enemyPosition(Position(0, 0))
{}

int * AI::GetBoard()
{
	return m_board;
}

void AI::SetBoard(int * board)
{
	for(int i = 0; i < MAP_SIZE * MAP_SIZE; i++)
	{
		m_board[i] = board[i];
	}
}

int AI::GetPlayerIndex()
{
	return m_index;
}

void AI::SetPlayerIndex(int idx)
{
	m_index = idx;
}

int AI::GetBlock(Position pos)
{
	if(pos.x < 0 || pos.x >= MAP_SIZE || pos.y < 0 || pos.y >= MAP_SIZE)
	{
		return BLOCK_OUT_OF_BOARD;
	}
	else
	{
		int idx = CONVERT_COORD(pos.x, pos.y);
		return m_board[idx];
	}
}

Position AI::GetMyPosition()
{
	return m_myPosition;
}

void AI::SetMyPosition(Position newPos)
{
	m_myPosition = newPos;
}

Position AI::GetEnemyPosition()
{
	return m_enemyPosition;
}

void AI::SetEnemyPosition(Position newPos)
{
	m_enemyPosition = newPos;
}

void AI::SetListBallMap(std::vector<Position> list){
	m_listBall = list;
}
void AI::SetListHardBlock(std::vector<Position> list){
	m_listHardBlock = list;
}
void AI::SetListSoftBlock(std::vector<Position> list){
	m_listSoftBlock = list;
}

void AI::SetMyBlockStack(int numBlock){
	m_myBlockInStack = numBlock;
}
void AI::SetEnemyBlockStack(int numBlock){
	m_enemyBlockInStack = numBlock;
}
void AI::SetMyPointScore(int score){
	m_myPointScore = score;
}
void AI::SetEnemyPointScore(int score){
	m_enemyPointScore = score;
}

std::vector<Position> AI::GetListBall(){
	return m_listBall;
}
std::vector<Position> AI::GetListHardBlock(){
	return m_listHardBlock;
}
std::vector<Position> AI::GetListSoftBlock(){
	return m_listSoftBlock;
}

int AI::GetMyBlockStack(){
	return m_myBlockInStack;
}
int AI::GetEnemyBlockStack(){
	return m_enemyBlockInStack;
}
int AI::GetMyPoint(){
	return m_myPointScore;
}
int AI::GetEnemyPoint(){
	return m_enemyPointScore;
}
