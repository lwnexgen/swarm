function bucketObj(bucketID, windowWidth, windowHeight) {
    this.agents = {};
    this.numAgents = 0;

    this.id = bucketID;
    
    this.winWidth = windowWidth;
    this.winHeight = windowHeight;

    this.bucketWidth = 100;
    this.bucketHeight = 100;

    this.getX = function() {
        if (this.x == undefined) {
            this.x = parseInt(this.id.substring(0, this.id.indexOf(".")));
        }

        return this.x; 
    }

    this.getY = function() {
        if (this.y == undefined) {
            this.y = parseInt(this.id.substring(this.id.indexOf(".") + 1));
        }

        return this.y;
    }

    this.addAgent = function(agent) {
        this.agents[agent.id] = agent;
        this.numAgents++;
    }
    
    this.deleteAgent = function(agent) {
        delete this.agents[agent.id];
        this.numAgents--;
    }

    /*
     * Returns 1 if completely out of scope of window. Returns 0 if partially out of scope of window. Returns -1 if completely within window.
     */
    this.isOutOfBounds = function() {
        return 0;

        var thisX1 = this.getX();
        var thisY1 = this.getY();
        var thisX2 = thisX1 + 100;
        var thisY2 = thisY1 + 100;
        
        var thisPointTL = [thisX1, thisY1];
        var thisPointTR = [thisX2, thisY1];
        var thisPointBL = [thisX1, thisY2];
        var thisPointBR = [thisX2, thisY2];

        var tlInside = checkInsideWindow(thisPointTL);
        var trInside = checkInsideWindow(thisPointTR);
        var blInside = checkInsideWindow(thisPointBL);
        var brInside = checkInsideWindow(thisPointBR);

        if (tlInside && trInside && blInside && brInside) {
            return -1;
        } else if (tlInside || trInside || blInside || brInside) {
            return 0;
        } else {
            return 1;
        }
    }
    
    this.checkInside = function(point) {
        var bucketX1 = this.getX();
        var bucketY1 = this.getY();
        var bucketX2 = bucketX1 + this.bucketWidth;
        var bucketY2 = bucketY1 + this.bucketHeight;
    
        var pointX = point[0];
        var pointY = point[1];
    
        if ((pointX >= winX1)&&(pointY >= bucketY1)&&(pointX <= bucketX2)&&(pointY <= bucketY2)) {
            return true;
        } else {
            return false;
        }
    }

    this.getTop = function(offset) {
        if (this.topLine != undefined) {
            return this.topLine;
        }

        var newX = this.x;
        var newY = this.y;

        if (offset != undefined) {
            newX = this.x - offset.x;
            newY = this.y - offset.y;
        }

        var line = {};
        line.x1 = newX;
        line.y1 = newY;

        line.x2 = newX + this.bucketWidth;
        line.y2 = newY;

        this.topLine = line;

        return line;
    }
    
    this.getRight = function(offset) {
        if (this.rightLine != undefined) {
            return this.rightLine;
        }

        var newX = this.x;
        var newY = this.y;        
        
        if (offset != undefined) {
            newX = this.x - offset.x;
            newY = this.y - offset.y;
        }

        var line = {};
        line.x1 = newX + this.bucketWidth;
        line.y1 = newY;

        line.x2 = newX + this.bucketWidth;
        line.y2 = newY + this.bucketHeight;

        this.rightLine = line;

        return line;
    }

    this.getBottom = function(offset) {
        if (this.bottomLine != undefined) {
            return this.bottomLine;
        }

        var newX = this.x;
        var newY = this.y;

        if (offset != undefined) {
            newX = this.x - offset.x;
            newY = this.y - offset.y;
        }

        var line = {};
        line.x1 = newX;
        line.y1 = newY + this.bucketHeight;

        line.x2 = newX + this.bucketWidth;
        line.y2 = newY + this.bucketHeight;

        this.bottomLine = line;

        return line;
    }

    this.getLeft = function(offset) {
        if (this.leftLine != undefined) {
            return this.leftLine;
        }

        var newX = this.x;
        var newY = this.y;

        if (offset != undefined) {
            newX = this.x - offset.x;
            newY = this.y - offset.y;
        }

        var line = {};
        line.x1 = newX;
        line.y1 = newY;

        line.x2 = newX;
        line.y2 = newY + this.bucketHeight;

        this.leftLine = line;

        return line;
    }
      
    this.neighbors = generateNeighborBucketIDs(this, 100);
    this.outOfBounds = this.isOutOfBounds();
}