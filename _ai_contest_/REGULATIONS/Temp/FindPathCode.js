function FindPathDir()
{

	var map = g_map;
	var listPos = new Array();	
	var listTemp = null;
	
	//pre-process map
	for (var i=0; i<MAP_SIZE*MAP_SIZE; i++)
	{
		if(map[i] == BLOCK_GREEN)
		{
			listPos.push(i);
		}
	}
		
	while(listPos.length > 0)
	{		
		listTemp = listPos;	
		listPos = new Array();
		for(var i=0; i<listTemp.length; i++)
		{ 
			var pos = listTemp[i];
			map[pos] = BLOCK_OBSTACLE_HARD;
			
			var x = pos%MAP_SIZE;
			var y = Math.floor(pos/MAP_SIZE);
			
			if (x > 0)
			{
				if(map[ConvertCoord(x-1, y)] == BLOCK_EMPTY)
				{
					listPos.push(ConvertCoord(x-1, y));
				}
				else if(map[ConvertCoord(x-1, y)] == BLOCK_PLAYER)
				{
					return DIRECTION_RIGHT;
				}
			}
			
			if (y > 0)
			{
				if(map[ConvertCoord(x, y-1)] == BLOCK_EMPTY)
					listPos.push(ConvertCoord(x, y-1));
				else if(map[ConvertCoord(x, y-1)] == BLOCK_PLAYER)
					return DIRECTION_DOWN;
			}	
			
			if (x < MAP_SIZE - 1)
			{					
				if(map[ConvertCoord(x+1, y)] == BLOCK_EMPTY)
					listPos.push(ConvertCoord(x+1, y));
				else if(map[ConvertCoord(x+1, y)] == BLOCK_PLAYER)
					return DIRECTION_LEFT;
			}
			
			if (y < MAP_SIZE - 1)
			{
				if(map[ConvertCoord(x, y+1)] == BLOCK_EMPTY)
					listPos.push(ConvertCoord(x, y+1));
				else if(map[ConvertCoord(x, y+1)] == BLOCK_PLAYER)
					return DIRECTION_UP;
			}
		}
		
	}
	
	return 0;
}