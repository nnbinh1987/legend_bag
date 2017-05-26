import java.io.IOException;
import java.io.PrintStream;
import java.net.URI;
import javax.websocket.ContainerProvider;
import javax.websocket.DeploymentException;
import javax.websocket.RemoteEndpoint.Basic;
import javax.websocket.Session;
import javax.websocket.WebSocketContainer;

public class Game {
	private static Game instance = null;
	private char m_gameState = Client.GAMESTATE_WAIT_FOR_PLAYER;

	public static Game getInstance() {
		if (instance == null) {
			instance = new Game();
		}
		return instance;
	}

	public char getGameState()
	{
		return m_gameState;
	}

	public void setGameState(char gameState)
	{
		m_gameState = gameState;
	}	

	String host = "127.0.0.1";
	int port = -1;
	char key = '\000';

	int Connect(String[] paramArrayOfString) {
		for (int i = 0; i < paramArrayOfString.length; i++) {
			if (paramArrayOfString[i].equals("-h")) {
				this.host = paramArrayOfString[(i + 1)];
			} else if (paramArrayOfString[i].equals("-p")) {
				this.port = Integer.parseInt(paramArrayOfString[(i + 1)]);
			} else if (paramArrayOfString[i].equals("-k")) {
				this.key = ((char)Integer.parseInt(paramArrayOfString[(i + 1)]));
			}
		}
		if (this.host == null) {
			this.host = "127.0.0.1";
		}
		if (this.port == -1) {
			this.port = 3011;
		}
		WebSocketContainer localWebSocketContainer = ContainerProvider.getWebSocketContainer();

		String str = "ws://" + this.host + ":" + this.port;
		System.out.println("Connecting to " + str);
		try {
			Client.getInstance().session = localWebSocketContainer.connectToServer(WebsocketClientEndpoint.class, URI.create(str));
		} catch (DeploymentException localDeploymentException) {
			System.out.println("Cannot connect to server. Please contact admin! Error details:");
			localDeploymentException.printStackTrace();
			return -1;
		} catch (IOException localIOException) {
			System.out.println("Cannot connect to server. Please contact admin! Error details:");
			localIOException.printStackTrace();
			return -2;
		}
		return 0;
	}

	void AI_Register() {
		System.out.println("Register bot with key " + this.key);
		String str = "";
		str = str + String.valueOf(Client.COMMAND_SEND_KEY);
		str = str + String.valueOf(this.key);
		try {
			Client.getInstance().session.getBasicRemote().sendText(str);
		} catch (IOException localIOException) {
			System.out.println("Failed to register with server! Error details:");
			localIOException.printStackTrace();
		}
	}

	void PollingFromServer() {
		while (Client.getInstance().session.isOpen()) {
			try {
				Thread.sleep(100L);
			} catch (InterruptedException localInterruptedException) {
				Thread.currentThread().interrupt();
			}
		}
	}

	public void AI_DoAction(int paramIntAction, int paramIntDir) {
		if(m_gameState != Client.GAMESTATE_COMMENCING)
		{
			return;
		}
		m_gameState = Client.GAMESTATE_WAIT_FOR_PLAYER;
		String str = "";
		str = str + String.valueOf(Client.COMMAND_SEND_ACTION);
		str = str + String.valueOf((char)paramIntAction);
		str = str + String.valueOf((char)paramIntDir);
		try {
			//Client.LOG(str);
			Client.getInstance().session.getBasicRemote().sendText(str);
		} catch (IOException localIOException) {
			System.out.println("Failed to send message to server! Error details:");
			localIOException.printStackTrace();
		}
	}
}