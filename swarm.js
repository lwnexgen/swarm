var agents;
var buckets;
var edgeBuckets;
var obstacles;
var trashHeap;

var context;
var maxAgents;

var gooseImage;

var timerID;

var date;
var startTime;
var frames;
var frameRate;

var overallStartTime;

var mousePosition;
var mouseObstacle;

function initCanvas(){
    var canvas = $('#layer1')[0];

    if (canvas.getContext){
        context = canvas.getContext('2d');
        setCanvasSize();
    }

    gooseImage = new Image();
    gooseImage.src = "Goose.png";

    $("#layer1").click(function(event) {
        if (mouseObstacle != undefined) {
            obstacles[mouseObstacle.id] = mouseObstacle;
            
            mouseObstacle = undefined;
        }
    });

    $("#layer1").mousemove(function(event) {
        mousePosition = getPosition(event);

        if (mouseObstacle == undefined) {
            mouseObstacle = new obstacleObj(mousePosition.x, mousePosition.y);    
        } else {
            mouseObstacle.setPosition(mousePosition.x, mousePosition.y);
        }
    });
}

function setCanvasSize() {
    context.canvas.width  = $(window).width() - 50;
    context.canvas.height = $(window).height() - 50;
}

function clearScreen() {
    context.clearRect(0, 0, getWidth(), getHeight())
}

function initSwarm() {
    agents = {};
    buckets = {};
    edgeBuckets = {};
    obstacles = {};
    trashHeap = {};

    frames = 0;
    startTime = undefined;

    if (timerID != undefined) {
        window.clearTimeout(timerID);
    }
    
    numAgents = 0;
    for (var agentNum = 0; agentNum < maxAgents; agentNum++) {
        var xPos = Math.floor(Math.random() * getWidth());
        var yPos = Math.floor(Math.random() * getHeight());
        var tmpAgent = new agentObj(xPos, yPos);
        
        var bucketID = tmpAgent.getBucketID();
        if (buckets[bucketID] == undefined) {
            addBucket(bucketID);
        }
        
        agents[tmpAgent.id] = tmpAgent;
        
        var bucket = buckets[bucketID];
        bucket.addAgent(agents[tmpAgent.id]);
        for (var neighborID in bucket.neighbors) {
            if (buckets[neighborID] == undefined) {
                if (addBucket(neighborID) == false) {
                    delete bucket.neighbors[neighborID];
                }
            }
        }
        
        tmpAgent.bucket = bucket;

        tmpAgent.canvasHeight = context.canvas.height;
        tmpAgent.canvasWidth = context.canvas.width;

        numAgents++;
    }
}

function renderSwarm() {
    for (var agentID in agents) {
        var agent = agents[agentID];

        agent.render(context);

        agent.intersectObject = undefined;
    }

    for (var obstacleID in obstacles) {
        var obstacle = obstacles[obstacleID];

        obstacle.render(context);
    }

    if (mouseObstacle != undefined) {
        mouseObstacle.render(context);
    }
}

function setMaxAgents(max) {
    this.maxAgents = max;
}

function setRuns(runs) {
    this.runs = runs;
}

function getWidth() {
    return context.canvas.width;
}

function getHeight() {
    return context.canvas.height;
}

function clearWindow() {
    context.clearRect(0, 0, getWidth(), getHeight());
}

function initialize() {
    setMaxAgents($('#maxAgents').val());
    initCanvas();
    initSwarm();
    renderSwarm();
 
    date = new Date();
    overallStartTime = date.getTime();
    
    frames = 0;
    timerID = window.setInterval(doFrame, 25);
}

function pause() {
    window.clearTimeout(timerID);
    timerID = undefined;

    date = new Date();
    var elapsedTime = (date.getTime() - overallStartTime) / 1000;
    frameRate = frames / elapsedTime;

    showFramerate();
}

function start() {
    frames = 0;

    date = new Date();
    overallStartTime = date.getTime();
    
    window.clearTimeout(timerID);
    timerID = window.setInterval(doFrame, 25);
}

function doFrame() {
    date = new Date();
    startTime = date.getTime();

    deleteObjects();
    moveSwarm();

    if (timerID != undefined) {
        clearScreen();
        renderSwarm();
    }
    
    if (numAgents == 0) {
        pause();
    } else if (frames % 5 == 0) {
        calculateFramerate();
    }
    
    showFramerate();

    frames++;
}

function deleteObjects() {
    for (var deleteObjectID in trashHeap) {
        delete trashHeap[deleteObjectID];
        delete agents[deleteObjectID];
    }
}

function calculateFramerate() {
    date = new Date();

    var elapsedTime = date.getTime() - startTime;
    frameRate = 1000 / elapsedTime;
}

function showFramerate() {
    context.save();
    context.fillStyle = "#000000";
    context.clearRect(0, 0, 100, 10);
    context.fillText("" + frameRate + " agents: " + Object.keys(agents).length, 10, 10);
    context.restore();
}

function moveSwarm() {
    for (var agentID in agents) {
        var agent = agents[agentID];
        agent.swarm();
    }
}

function setBucket(agent, newBucketID, oldBucketID) {
    var oldBucket = buckets[oldBucketID];
    var newBucket = buckets[newBucketID];
    
    if (newBucket == undefined) {
        if (addBucket(newBucketID) != false) {
            newBucket = buckets[newBucketID];
        } else {
            oldBucket.deleteAgent(agent);
            delete agents[agent.id];
            delete agent;
            
            return;
        }
    }
    
    newBucket.addAgent(agent);
    agent.bucket = newBucket;

    oldBucket.deleteAgent(agent);
    
    agent.updateBucketInfo();
    
    agents[agent.id] = agent;
}

function addBucket(newBucketID) {
    var newBucket = new bucketObj(newBucketID);
    
    if (newBucket.outOfBounds == -1) {
        buckets[newBucketID] = newBucket;
    } else if (newBucket.outOfBounds == 0) {
        buckets[newBucketID] = newBucket;
        edgeBuckets[newBucketID] = buckets[newBucketID];
    } else {
        return false;
    }
}

function checkInsideWindow(point) {
    var winX1 = 0;
    var winY1 = 0;
    var winX2 = getWidth();
    var winY2 = getHeight();
    
    var pointX = point[0];
    var pointY = point[1];
    
    if ((pointX >= winX1)&&(pointY >= winY1)&&(pointX <= winX2)&&(pointY <= winY2)) {
        return true;
    } else {
        return false;
    }
}

function drawBorder(bucket, color, neighbors) {
    context.save();
    
    context.strokeStyle = color;
    context.strokeRect(bucket.getX(), bucket.getY(), bucket.bucketWidth, bucket.bucketHeight);
    context.fillText(bucket.id, bucket.getX() + 5, bucket.getY() + 15);
    
    context.restore();

    if (neighbors == true) {
        for (var neighborID in bucket.neighbors) {
            var neighborBucket = buckets[neighborID];

            if (neighborBucket != undefined) {
                drawBorder(neighborBucket, color);
            }
        }    
    }
}

function findFlock(agent, maxDistance) {
    var flock = new flockObj();
  
    var agentRadius = getAgentRadius(agent, maxDistance);
    
    for (var bucketID in buckets) {
        var bucket = buckets[bucketID];

        if (bucketOverlapsRadius(bucket, agentRadius)) {
            for (var possibleID in bucket.agents) {
                if (possibleID == agent.id) {
                    continue;
                }

                var possible = bucket.agents[possibleID];

                if ((possible != undefined)&&(agentDistance(agent, possible) <= maxDistance)) {
                    flock.agents[possibleID] = possible;
                }
            }
        }
    }

    return flock;
}

function getAgentRadius(agent, radius) {
    var agentRadius = {};

    agentRadius.xLeft = agent.bucket.bucketWidth * Math.floor((agent.x - radius)/agent.bucket.bucketWidth);
    agentRadius.xRight = agent.bucket.bucketWidth * Math.ceil((agent.x + radius)/agent.bucket.bucketWidth);

    agentRadius.yTop = agent.bucket.bucketHeight * Math.floor((agent.y - radius)/agent.bucket.bucketHeight);
    agentRadius.yBottom = agent.bucket.bucketHeight * Math.ceil((agent.y + radius)/agent.bucket.bucketHeight);

    return agentRadius;
}

function bucketOverlapsRadius(bucket, agentRadius) {
    if (((agentRadius.xLeft <= bucket.getX())&&(agentRadius.xRight >= bucket.getX() + bucket.bucketWidth))&&((agentRadius.yTop <= bucket.getY())&&(agentRadius.yBottom >= bucket.getY() + bucket.bucketHeight))) {
        return true;
    }
}

function lineOverlaps(line, offset, radius) {
    line = getOffsetLine(line, offset);

    if ((pointDistance(line.x1, line.y1, 0, 0) < radius)||(pointDistance(line.x2, line.y2, 0, 0) < radius)) {
        return true;
    }

    var dx = line.x2 - line.x1;
    var dy = line.y2 - line.y1;

    var dr = Math.sqrt((dx*dx)+(dy*dy));

    var D = (line.x1 * line.y2) - (line.x2 * line.y1);

    var disc = ((radius * radius)*(dr*dr)) - (D*D);

    return (disc >= 0);
}

function getOffsetLine(line, offset) {
    var newLine = {};

    newLine.x1 = line.x1 - offset.x;
    newLine.x2 = line.x2 - offset.x;

    newLine.y1 = line.y1 - offset.y;
    newLine.y2 = line.y2 - offset.y;

    return newLine;
}

function findClosestAgent(position) {
    var closestDistance;
    var closestAgent;

    for (var flockAgentID in agents) {
        var flockAgent = agents[flockAgentID];

        var distance = pointDistance(position.x, position.y, flockAgent.getX(), flockAgent.getY());
        if ((closestDistance == undefined)||(distance < closestDistance)) {
            closestDistance = distance;
            closestAgent = flockAgent;
        }
    }

    return closestAgent;
}

function generateNeighborBucketIDs(bucket, size) {
    var neighbors = {};
    
    //for now, we want to re-render all surrounding cubes. logic later might clean this up.
    var nId = generateBucketID(bucket.getX(), bucket.getY() + size);
    neighbors[nId] = true;
    
    var neId = generateBucketID(bucket.getX() + size, bucket.getY() + size);
    neighbors[neId] = true;
    
    var nwId = generateBucketID(bucket.getX() - size, bucket.getY() + size);
    neighbors[nwId] = true;
    
    var sId = generateBucketID(bucket.getX(), bucket.getY() - size);
    neighbors[sId] = true;
    
    var seId = generateBucketID(bucket.getX() + size, bucket.getY() - size);
    neighbors[seId] = true;
    
    var swId = generateBucketID(bucket.getX() - size, bucket.getY() - size); 
    neighbors[swId] = true;
    
    var eId = generateBucketID(bucket.getX() + size, bucket.getY());
    neighbors[eId] = true;
    
    var wId = generateBucketID(bucket.getX() - size, bucket.getY());
    neighbors[wId] = true;
    
    return neighbors;    
}

function pickRandomAgent() {
    var result;
    var count = 0;
    for (var agentID in agents) {
        if (Math.random() < 1/++count) {
           result = agents[agentID];
        }
    }

    return result;
}

function getPosition(e) {
    //this section is from http://www.quirksmode.org/js/events_properties.html
    var targ;
    if (!e)
        e = window.event;
    if (e.target)
        targ = e.target;
    else if (e.srcElement)
        targ = e.srcElement;
    if (targ.nodeType == 3) // defeat Safari bug
        targ = targ.parentNode;

    // jQuery normalizes the pageX and pageY
    // pageX,Y are the mouse positions relative to the document
    // offset() returns the position of the element relative to the document
    var x = e.pageX - $(targ).offset().left;
    var y = e.pageY - $(targ).offset().top;

    return {"x": x, "y": y};
};