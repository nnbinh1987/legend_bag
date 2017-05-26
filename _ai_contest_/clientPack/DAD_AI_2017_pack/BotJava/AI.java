public class AI {
	private static AI instance = null;
	private int[][] m_board = new int[Client.MAP_SIZE][Client.MAP_SIZE];
	private int m_index;
	PlayerInfos m_myInfos;
	PlayerInfos m_enemyInfos;

	public static AI getInstance() {
		if (instance == null) {
			instance = new AI();
		}
		return instance;
	}

	public int[][] getBoard() {
		return this.m_board;
	}

	void setBoard(int[][] board) {
		for (int i = 0; i < Client.MAP_SIZE; i++) {
			for (int j = 0; j < Client.MAP_SIZE; j++) {
				this.m_board[i][j] = board[i][j];
			}
		}
	}

	public int getPlayerIndex() {
		return this.m_index;
	}

	void setPlayerIndex(int paramInt) {
		this.m_index = paramInt;
	}

	public int getBlock(Position paramPosition) {
		if ((paramPosition.x < 0) || (paramPosition.x >= Client.MAP_SIZE) || (paramPosition.y < 0) || (paramPosition.y >= Client.MAP_SIZE)) {
			return -1;
		}
		return this.m_board[paramPosition.x][paramPosition.y];
	}

	public PlayerInfos getMyInfos() {
		return this.m_myInfos;
	}

	void setMyInfos(PlayerInfos myInfos) {
		this.m_myInfos = myInfos;
	}

	public PlayerInfos getEnemyInfos() {
		return this.m_enemyInfos;
	}

	void setEnemyInfos(PlayerInfos enemyInfos) {
		this.m_enemyInfos = enemyInfos;
	}
}