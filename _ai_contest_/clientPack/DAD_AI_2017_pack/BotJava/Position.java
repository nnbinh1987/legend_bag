public class Position {
	public int x;
	public int y;

	public Position() {
		this.x = -1;
		this.y = -1;
	}

	public Position(int paramInt1, int paramInt2) {
		this.x = paramInt1;
		this.y = paramInt2;
	}

	public void set(int paramInt1, int paramInt2) {
		this.x = paramInt1;
		this.y = paramInt2;
	}
}