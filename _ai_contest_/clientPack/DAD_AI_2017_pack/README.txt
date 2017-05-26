* Version: 1.3

* Version: 1.3

* Changelog:
- Fix [C++] get block stack and score
- Update Gameserver: 15 balls and SOFT BLOCK < 50
- Fix Gameserver Do Action

* Version: 1.2
* Changelog:
- Fix map respond from server


* Version: 1.1
* Changelog:
- Fix C++ template
- [C++] Add functions get/set information

* Change log:
- 1.0: First version

* How to use:
- Install NodeJS: https://nodejs.org/download/
- You can code in Javascript (for NodeJS), C++ or Java
- Run fastest if you can. Be careful! If you take too much time, you may miss your turn.
- How to build:
	+ Javascript: No need to build. Bot file: Client.js
	+ C++: Use build mode that match your compiler version. E.g. You use VS2012, then you should build using 2012_Debug or 2012_Release. Bot file: AI_Template.exe
	+ Java: Run #build.bat (Use jdk 1.6.0_18 or later). Bot file: Client.jar
- Copy your bot file to Arena folder, and rename it as P1. (P1.exe, P1.js or P1.jar)
- Run P1-vs-You.bat to fight with your own bot for testing purpose
- If you want to play against someone else, copy their bot to Arena folder and rename it as P2. (P2.exe, P2.js or P2.jar)
- Run P1-vs-P2.bat
- Cross platform is OK (for example, P1.exe vs P2.js)

GAMEPLAY:
	There are 2 players, starting at 2 corners of the game board (North-West and South-East corners).
	There are OBSTACLE blocks (<50) and 15 BALL spawn points placed randomly on the game board, which are symmetric in pairs over the center point.
	There are two types of OBSTACLE block: HARD block and SOFT block.
	A player can only move left/right/up/down 1 block and stay inside the game board.
	A player cannot move to:
	- OBSTACLE blocks (both HARD & SOFT blocks)
	The game is over when time up. (120s)

GAME RULES:
(1) Each player will control his character to move an pick up balls on the map. One ball = one score point.
(2) Player can pick up the SOFT block next to him, maximum SOFT blocks each player can hold in stack is [3] blocks.
(3) The BALL spawn can't pick up. Player only pick up the ball on it.
(4) Player can put down the blocks - picked up in (2)- at a position of game board (cells next to him). The SOFT blocks put down will become HARD block, and it will not able to pick up again.
(5) Player can't put down blocks at: opponent position, on the ball, other OBSTACLE blocks.
(6) After 30s ball picked up, the spawn point will spawn the new ball at that position, if have any object (block, player) on that position, the ball will not spawn until that position is empty.

TECHNICAL MECHANISIM:
- The game actually run at 2 loops per second.
- The map size is 11 x 11.
- The coordinate of each object is the position of it on map.
- The order of command actions will be execute on game server: PUT - MOVE - PICK
	

Object stats: (all stats can be changed for balance on each new version)
- Normal game duration: 2 minutes (120 seconds or 240 loops).
