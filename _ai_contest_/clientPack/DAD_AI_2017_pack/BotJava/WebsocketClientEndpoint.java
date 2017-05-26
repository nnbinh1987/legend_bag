import java.io.IOException;
import java.io.PrintStream;
import javax.websocket.ClientEndpoint;
import javax.websocket.CloseReason;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;

@ClientEndpoint
public class WebsocketClientEndpoint {
	@OnOpen
	public void onOpen(Session paramSession) {
		System.out.println("Connected to endpoint: " + paramSession.getRequestURI());
	}

	@OnClose
	public void onClose(Session paramSession, CloseReason paramCloseReason)
	throws IOException {
		System.out.println(paramCloseReason.toString());
	}

//@OnMessage
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
//+ COMMAND_SEND_STAGE | Game state | Winner  | Stack p12 | Point p12 |   Game board          |
//+--------------------+------------+---------+-----------+-----------+-------------------------+

//3. Winer mesage: Send to each player or observer when end game
//+---------------------+-------+
//+        1 byte       | 1 byte|
//+---------------------+-------+
//+ COMMAND_SEND_WINNER | Winer |
//+---------------------+-------+
//- Winner: 0, PLAYER_X or PLAYER_O

	@OnMessage
	public void onMessage(String message) {
		int i = 0;
		int j = message.charAt(i++);

		int[][] board = new int[Client.MAP_SIZE][Client.MAP_SIZE];
		switch (j) {
		case Client.COMMAND_SEND_INDEX:
			Client.LOG("COMMAND_SEND_INDEX\n");
			int k = message.charAt(i++);
			System.out.println("My index is: " + k);
			AI.getInstance().setPlayerIndex(k);
			break;

		case Client.COMMAND_SEND_WINNER:
			Client.LOG("COMMAND_SEND_WINNER\n");

			int i1 = message.charAt(i);
			if (i1 == AI.getInstance().getPlayerIndex()) {
				System.out.println("Congratulations! You won!\n");
			} else {
				System.out.println("Game over! You lose!\n");
			}
			System.exit(0);
			break;
		case Client.COMMAND_SEND_STAGE:
			Client.LOG("COMMAND_SEND_STAGE\n");

			Position myPosition = new Position();
			Position enemyPosition = new Position();

			int gameState = message.charAt(i++);
			int winner = message.charAt(i++);
			int stackP1 = message.charAt(i++);
			int stackP2 = message.charAt(i++);
			int pointP1 = message.charAt(i++);
			int pointP2 = message.charAt(i++);

			for (int x = 0; x < Client.MAP_SIZE; x++) {
				for (int y = 0; y < Client.MAP_SIZE; y++) {
					int i4 = Client.CONVERT_COORD(x, y);
					board[x][y] = message.charAt(i + i4);

					Client.LOG(board[x][y] + " ");

					if (board[x][y] == Client.BLOCK_PLAYER_1) {
						if (AI.getInstance().getPlayerIndex() == Client.PLAYER_1) {
							myPosition.set(x, y);
						} else {
							enemyPosition.set(x, y);
						}
					} else if (board[x][y] == Client.BLOCK_PLAYER_2) {
						if (AI.getInstance().getPlayerIndex() == Client.PLAYER_1) {
							enemyPosition.set(x, y);
						} else {
							myPosition.set(x, y);
						}
					} else if (board[x][y] == Client.BLOCK_PLAYER_12) {
						enemyPosition.set(x, y);
						myPosition.set(x, y);
					}
				}
				Client.LOG("\n");
			}
			
			int p1Action = message.charAt(i++);
			int p1ActionDir = message.charAt(i++);
			int p2Action = message.charAt(i++);
			int p2ActionDir = message.charAt(i++);

			PlayerInfos myInfos;
			PlayerInfos enemyInfos;
			if(AI.getInstance().getPlayerIndex() == Client.PLAYER_1)
			{
				myInfos = new PlayerInfos(myPosition, stackP1, pointP1, p1Action, p1ActionDir);
				enemyInfos = new PlayerInfos(enemyPosition, stackP2, pointP2, p2Action, p2ActionDir);
			}
			else
			{
				myInfos = new PlayerInfos(myPosition, stackP2, pointP2, p2Action, p2ActionDir);
				enemyInfos = new PlayerInfos(enemyPosition, stackP1, pointP1, p1Action, p1ActionDir);	
			}

			Client.LOG("My infos: " + myInfos);
			Client.LOG("Enemy infos: " + enemyInfos);

			AI.getInstance().setMyInfos(myInfos);
			AI.getInstance().setEnemyInfos(enemyInfos);
			AI.getInstance().setBoard(board);
			//@TODO: set point, stack, gameTime..
			Game.getInstance().setGameState((char)gameState);
			if (gameState == Client.GAMESTATE_COMMENCING) {
				Client.getInstance().AI_Update();
			}

			Client.LOG("\n");

		}
	}

	@OnError
	public void onError(Throwable paramThrowable) {
		paramThrowable.printStackTrace();
	}
}
