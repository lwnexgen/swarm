var hexDigits = "0123456789abcdef";
var maxVelocity = 5;

function agentObj(xPos, yPos, temp) {
    this.move = function(moveVector) {
        var velocityOffset = this.getVector().magnitude - moveVector.magnitude;
        var headingOffset = this.getVector().direction - moveVector.direction;

        velocityOffset = velocityOffset * .5;
        headingOffset = headingOffset * .5;

        var newVector = new vectorObj(this.getVector().direction + headingOffset, this.getVector().magnitude + velocityOffset);
        newVector.setMagnitude(Math.min(this.vector.magnitude, maxVelocity));

        this.x = this.x + newVector.xComponent;
        this.y = this.y + newVector.yComponent;

        //  Erin did this.
        if(this.x > getWidth()){
            this.x = 0;
        }
        if(this.x < 0){
            this.x = getWidth();
        }
        if(this.y > getHeight()){
            this.y = 0;
        }
        if(this.y < 0){
            this.y = getHeight();
        }
        //  End Erin.

        this.vector = newVector;
        
        var newBucketID = generateBucketID(this.x, this.y);
        if (newBucketID != this.bucket.id) {
            setBucket(this, newBucketID, this.bucket.id);
        }

        this.headingLine = this.getHeadingLine(this.vector.magnitude);

        this.offset = this.getOffset();
    }

    this.getHeadingLine = function(scalar) {
        var headingLine = {};

        headingLine.x1 = this.x;
        headingLine.y1 = this.y;
        headingLine.x2 = headingLine.x1 + (this.vector.xComponent * scalar);
        headingLine.y2 = headingLine.y1 + (this.vector.yComponent * scalar);

        return headingLine;
    }

    this.getOffset = function() {
        var offset = {};
        
        offset.x = this.x;
        offset.y = this.y;

        return offset;
    }

    this.renderHeadingLine = function(context) {
        context.beginPath();
        
        context.moveTo(this.x, this.y);
        context.lineTo(this.headingLine.x2, this.headingLine.y2);
        context.closePath();

        context.stroke();   
    }

    this.getVector = function() {
        return this.vector;
    }

    this.getX = function() {
        return this.x;
    }

    this.getY = function() {
        return this.y;
    }
    
    this.generateBucketID = function() {
        return generateBucketID(this.x, this.y);
    }
    
    this.updateBucketInfo = function() {
        this.bucketID = this.generateBucketID();

        if (this.bucket != undefined) {
            this.flock = findFlock(this, this.flockRadius).agents;
        }
    }
    
    this.getBucketID = function() {
        return this.bucketID;    
    }
    
    this.render = function(context, style) {
        if (typeof style != Image) {
            if (style == undefined) {
                context.fillStyle = this.color;    
            } else {
                context.fillStyle = style;
            }
            
            context.beginPath();
            context.arc(this.x, this.y, this.size, 0, Math.PI*2, true);
            context.closePath();
            context.fill();
        } else {
           context.drawImage(image, this.x, this.y); 
        }
    }
    
    this.colorFlock = function(context, color) {
        context.beginPath();
        context.arc(this.x, this.y, this.flockRadius, 0, Math.PI*2, true);
        context.closePath();
        context.stroke();

        this.render(context, "#000000");
        for (var flockMateID in this.flock) {
            var flockMate = this.flock[flockMateID];
            flockMate.render(context, color);
        }
    }

    this.setColor = function(context, color) {
        context.save();
        this.render(context, color);
        context.restore();
    }

    this.swarm = function() {
        this.updateBucketInfo();

        this.optimizeSwarm(this.avoid(), this.flockAlign(), this.flockCenter());
    }

    this.optimizeSwarm = function(avoidVector, alignVector, centerVector) {
        var moveVector = this.vector;
        
        moveVector.add(avoidVector);

        if (this.collision == true) {
            this.move(moveVector);
            return;
        }

        moveVector.add(alignVector);
        //moveVector.add(centerVector);

        this.move(moveVector);
    }

    /*In this demonstration, the green vehicle avoids the gray
    obstacles. The vehicle tries to remain outside of the gray circles, while
    keeping close to its "speed limit." The vehicle wraps around the window
    boundaries. This steering behavior anticipates the vehicle's future path as
    indicated by the white box. The length of the box is a constant time
    multiplied by the current velocity of the vehicle. Any obstacle that
    intersects this box is a potential collision threat. The nearest such threat
    is chosen for avoidance and is marked with a green boundary. To avoid an
    obstacle, a lateral steering force is applied opposite to the obstacle's
    center. In addition, a braking (deceleration) force is applied. (These forces
    vary with urgency, the distance from the tip of the white box to the point of
    potential collision. Steering varies linearly, braking varies quadratically.)
    If avoidance fails and the vehicle overlaps an obstacle, the color of the
    obstacle changes to red. (With these parameters and this crowded environment,
    collisions occur about once every 800 simulation steps.) The vehicle's
    velocity is indicated by a magenta vector, and its steering force is indicated
    by a blue vector.*/

    this.avoid = function() {
        var closestObject;
        var closestDistance;
        var minDistance;
        
        for (var obstacleID in obstacles) {
            if (obstacleID == this.id) {
                continue;
            }

            var obstacle = obstacles[obstacleID];
            
            var distance = agentDistance(this, obstacle);
            minDistance = ((this.size / 2) + (obstacle.size / 2));
            
            if (distance < ((this.size / 2) + (obstacle.size / 2) * 5)) {
                if ((closestDistance == undefined)||(distance < closestDistance)) {
                    closestObject = obstacle;
                    closestDistance = distance;
                }
            }
        }

        for (var flockMateID in this.flock) {
            if (flockMateID == this.id) {
                continue;
            }

            var flockMate = this.flock[flockMateID];
            
            var distance = agentDistance(this, flockMate);
            minDistance = ((this.size / 2) + (flockMate.size / 2));
            
            if (distance < ((this.size / 2) + (flockMate.size / 2) * 5)) {
                this.colorFlock(context, "#FF0000");

                if ((closestDistance == undefined)||(distance < closestDistance)) {
                    closestObject = flockMate;
                    closestDistance = distance;
                }
            } else if ((flockMate.offset != null)&&(this.headingLine != undefined)&&(lineOverlaps(this.headingLine, flockMate.offset, flockMate.size))) {
                if ((closestDistance == undefined)||(distance < closestDistance)) {
                    closestObject = flockMate;
                    closestDistance = distance;
                }
            }    
        }

        if (closestObject != undefined) {
            if (closestDistance < minDistance) {
                this.remove();

                return this.vector;
            }

            var direction = getDirection(this, closestObject);
            var magnitude = this.vector.magnitude * (2);

            var steer = new vectorObj(direction, magnitude);

            this.collision = true;

            return steer.getPerpendicular(direction > (Math.PI / 2) + (2 * Math.PI));
        } else {
            this.collision = false;

            return new vectorObj(0, 0);
        }
    }

    this.flockAlign = function() {
        var averageHeading = 0;
        var averageVelocity = 0;

        var totalFlockMates = 0;

        for (var flockMateID in this.flock) {
            var flockMate = this.flock[flockMateID];

            if (flockMate.getVector() != undefined) {                
                averageHeading = averageHeading + flockMate.getVector().direction;
                averageVelocity = averageVelocity + flockMate.getVector().magnitude;

                totalFlockMates++;
            }
        }

        if (totalFlockMates > 0) {
            averageHeading = averageHeading / totalFlockMates;
            averageVelocity = averageVelocity / totalFlockMates;

            return new vectorObj(averageHeading, averageVelocity);
        }

        return this.vector;
    }

    this.flockCenter = function() {
        return new vectorObj(0, 0);
    }

    this.toString = function() {
        var uuid = this.id;
        var position = "x: " + this.x + " y: " + this.y;
        var heading = "heading: " + this.vector.direction;
        var velocity = "velocity: " + this.vector.magnitude;

        var returnArray = [uuid, position, heading, velocity];

        return returnArray.join("\n");
    }

    this.getCenterPoint = function() {
        return [this.x, this.y];
    }

    this.remove = function() {
        trashHeap[this.id] = this;
    }

    this.id = createUUID();
    
    this.x = xPos;
    this.y = yPos;

    if (temp == undefined) {
        this.color = randomColor();
        
        this.vector = new vectorObj(randomHeading(), (Math.random() * 9) + 1);
        
        this.flockRadius = 75;

        this.size = 5;

        this.updateBucketInfo();
    }
}

function randomHeading() {
    return (Math.random() * Math.PI * 2);
}

function randomColor() {
    var color = ["#"];
    
    for (var i = 1; i <= 6; i++) {
        color[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    
    return color.join("");
}

function createUUID() {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}

function generateBucketID(xPos, yPos) {
    var xPortion = Math.floor(xPos / 100) * 100;
    var yPortion = Math.floor(yPos / 100) * 100;
    
    return xPortion + "." + yPortion;
}

function pointDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
}

function agentDistance(agent1, agent2) {
    return pointDistance(agent1.getX(), agent1.getY(), agent2.getX(), agent2.getY());
}

function findHeading(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1) + (2 * Math.PI);
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function getDirection(object1, object2) {
    var xNormal = object2.getX() - object1.getX();
    var yNormal = object2.getY() - object1.getY();

    return Math.atan2(yNormal, xNormal) + (2 * Math.PI);
}

function vectorObj(direction, magnitude) {
    var xComponent = Math.cos(direction) * magnitude;
    var yComponent = Math.sin(direction) * magnitude;

    this.xComponent = xComponent;
    this.yComponent = yComponent;

    this.magnitude = magnitude;
    this.direction = direction;

    this.add = function(vector) {
        if (vector == undefined) {
            return;
        }

        this.xComponent = this.xComponent + vector.xComponent;
        this.yComponent = this.yComponent + vector.yComponent;

        this.direction = Math.atan2(this.yComponent, this.xComponent) + (2* Math.PI);
        this.magnitude = Math.sqrt((this.xComponent * this.xComponent) + (this.yComponent * this.yComponent));
    }

    this.getUnit = function() {
        return new vectorObj(this.direction, 1);
    }

    this.getOpposite = function() {
        return new vectorObj(this.direction + Math.PI, this.magnitude);  
    }

    this.getPerpendicular = function(direction) {
        var newDirection = this.direction;
        var newMagnitude = this.magnitude;

        if (direction == true) {
            newDirection = newDirection + (Math.PI / 2);
        } else {
            newDirection = newDirection - (Math.PI / 2);
        }

        return new vectorObj(newDirection, newMagnitude);
    }

    this.setMagnitude = function(newMagnitude) {
        var newXComponent = Math.cos(this.direction) * newMagnitude;
        var newYComponent = Math.sin(this.direction) * newMagnitude;

        this.xComponent = newXComponent;
        this.yComponent = newYComponent;

        this.magnitude = Math.sqrt((newXComponent * newXComponent) + (newYComponent * newYComponent));
    }

    this.setDirection = function(newDirection) {
        var newXComponent = Math.cos(newDirection) * this.magnitude;
        var newYComponent = Math.sin(newDirection) * this.magnitude;

        this.xComponent = newXComponent;
        this.yComponent = newYComponent;

        this.direction = Math.atan2(newYComponent, newXComponent) + (2* Math.PI);
    }

    this.render = function(context, xPos, yPos, color) {
        context.save();
        
        context.beginPath();

        if (color == undefined) {
            context.strokeStyle = "#000000";   
        } else {
            context.strokeStyle = color;
        }

        context.moveTo(xPos, yPos);
        context.lineTo(xPos + this.xComponent * 10, yPos + this.yComponent * 10);
        
        context.closePath();
        
        context.stroke();
        
        context.restore();
    }

    this.renderWithPerpendicular = function() {
        this.render(context, 100, 100, "#F00000");
        this.getPerpendicular().render(context, 100, 100);
        this.getPerpendicular(true).render(context, 100, 100);   
    }
}