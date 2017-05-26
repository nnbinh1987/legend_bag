public class PlayerInfos
{
	private Position m_position;
	private int m_stack;
	private int m_point;
	private int m_action;
	private int m_actionDir;

	public PlayerInfos(Position pos, int stack, int point, int action, int actionDir)
	{
		m_position = pos;
		m_stack = stack;
		m_point = point;
		m_action = action;
		m_actionDir = actionDir;
	}

	public Position getPosition()
	{
		return m_position;
	}

	public int getStack()
	{
		return m_stack;
	}

	public int getPoint()
	{
		return m_point;
	}

	public int getAction()
	{
		return m_action;
	}

	public int getActionDir()
	{
		return m_actionDir;
	}

	public String toString()
	{
		String ret = "";
		ret += "position(" + m_position.x + "," + m_position.y + ")\n";
		ret += "stack(" + m_stack + ")\n";
		ret += "point(" + m_point + ")\n";
		ret += "action(" + m_action + ")\n";
		ret += "action dir(" + m_actionDir + ")\n";
		return ret;
	}
}