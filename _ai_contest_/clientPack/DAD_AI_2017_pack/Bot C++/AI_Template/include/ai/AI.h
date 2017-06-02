#pragma once

#include "defines.h"
#include <cstdio>
#include <iostream>
#include <vector>

/// @struct Position struct.
/// @brief Describe location of a block.
struct Position
{
	int x;
	int y;
	Position() : x(0), y(0) {}
	Position(int _x, int _y) : x(_x), y(_y) {}
	Position operator =(Position pos) { x = pos.x; y = pos.y; return *this; }
	bool operator == (const Position& coordinates_) { return (x == coordinates_.x && y == coordinates_.y); }
};

/// @class AI class.
/// @brief Main entity of the game.
class AI
{
private:
	/// AI instance.
	static AI* s_instance;

	/// Game board, described by an array of MAP_SIZExMAP_SIZE integers.
	int m_board[MAP_SIZE * MAP_SIZE];

	/// Index of the player, either @e PLAYER_1 or @e PLAYER_2
	int m_index;

	/// Current position of the player.
	/// @see Position
	Position m_myPosition;

	/// Current position of the player's enemy.
	/// @see Position
	Position m_enemyPosition;

	std::vector<Position> m_listBall;
	std::vector<Position> m_listHardBlock;
	std::vector<Position> m_listSoftBlock;

	int m_myBlockInStack;
	int m_enemyBlockInStack;
	int m_myPointScore;
	int m_enemyPointScore;

	void SetListBallMap(std::vector<Position> list);
	void SetListHardBlock(std::vector<Position> list);
	void SetListSoftBlock(std::vector<Position> list);

	void SetMyBlockStack(int numBlock);
	void SetEnemyBlockStack(int numBlock);

	void SetMyPointScore(int score);
	void SetEnemyPointScore(int score);

	/// Set value for game board.
	/// @param board pointer to array of MAP_SIZExMAP_SIZE integers.
	/// @return No return value.
	void SetBoard(int * board);

	/// Set index of the player.
	/// @param idx Either @e PLAYER_1 or @e PLAYER_2.
	/// @return No return value.
	void SetPlayerIndex(int idx);

	/// Set current position of the player.
	/// @param newPos New position to be set.
	/// @see Position
	/// @return No return value.
	void SetMyPosition(Position newPos);

	/// Set current position of the player.
	/// @param newPos New position to be set.
	/// @see Position
	/// @return No return value.
	void SetEnemyPosition(Position newPos);


public:
	friend class Game;

	static void CreateInstance()
	{
		if (s_instance == NULL)
			s_instance = new AI();
	}

	static AI* GetInstance()
	{
		return s_instance;
	}

	static void DestroyInstance()
	{
		if (s_instance)
		{
			delete s_instance;
			s_instance = NULL;
		}
	}

	AI();

	/// Function pointer for AI
	void(*Update)();

	/// Function to get information of entire game board.
	/// @return Pointer to a 1-dimension array of MAP_SIZExMAP_SIZE integers, describing types of the blocks in the whole game board.\n
	/// Then you can access element at (x,y) by using board[CONVERT_COORD(x,y)].
	/// @see GetBlock()
	int * GetBoard();

	/// Function to get type of a block at specific position.
	/// @param pos specify the position of the block to check.
	/// @see Position
	/// @return Type of the block at pos in the game board.\n
	/// Block type can be one of these:\n
	/// @e BLOCK_OUT_OF_BOARD: this block is outside of the game board.\n
	/// @e BLOCK_EMPTY: this block is empty, players can occupy it.\n
	/// @e BLOCK_PLAYER_1: this block is currently occupied by Player 1\n
	/// @e BLOCK_PLAYER_2: this block is currently occupied by Player 2\n
	/// @e BLOCK_PLAYER_12: this block is currently occupied by Player 2\n
	int GetBlock(Position pos);

	/// Function to get index of current player
	/// @return Index of your bot, can be either @e PLAYER_1 or @e PLAYER_2
	int GetPlayerIndex();

	/// Function to get current position of the player.
	/// @return Current position of the player in the game board.
	/// @see Position
	/// @return No return value.
	Position GetMyPosition();

	/// Function to get current position of the enemy.
	/// @return Current position of the enemy in the game board.
	/// @see Position
	/// @return No return value.
	Position GetEnemyPosition();

	//
	std::vector<Position> GetListBall();
	std::vector<Position> GetListHardBlock();
	std::vector<Position> GetListSoftBlock();

	int GetMyBlockStack(); //return current block in stack
	int GetEnemyBlockStack(); //return current block in stack
	int GetMyPoint();//return player point
	int GetEnemyPoint();//return opposite  point
};