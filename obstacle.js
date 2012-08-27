function obstacleObj(xPos, yPos, geometry) {
	this.setPosition = function(xPos, yPos) {
		this.x = xPos;
		this.y = yPos;
	}

	this.render = function(context) {
		if (this.geometry != undefined) {
			this.render(this.geometry);
		} else {
			context.beginPath();
        	context.arc(this.x, this.y, this.size, 0, Math.PI*2, true);
        	context.closePath();
        	context.stroke();
		}
	}

	this.getX = function() {
		return this.x;
	}

	this.getY = function() {
		return this.y;
	}

	this.id = createUUID();
	this.x = xPos;
	this.y = yPos;
	this.size = 50;

	if (geometry != undefined) {
		this.geometry = geometry;
	}
}