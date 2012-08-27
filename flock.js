function flockObj() {
	this.agents = {};

	this.merge = function(flock) {
		for (var agentID in flock.agents) {
			if (this.agents[agentID] == undefined) {
				this.agents[agentID] = flock.agents[agentID]; 
			}
		}
	}

	this.same = function(flock) {
		var size = 0;
		for (var agentID in flock.agents) {
			if (this.agents[agentID] == undefined) {
				return false;
			}

			size++;
		}

		if (size != Object.keys(this.agents).length) {
			return false;
		}

		return true;
	}
}