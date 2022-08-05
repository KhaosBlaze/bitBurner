/** @param {NS} ns */
export class Network {
	log(message) {
		this.ns.print(message);
	}

	getNetworkNodes() {
		this.log("Retrieving all nodes");
		var visited = {};
		var stack = [];
		var origin = this.ns.getHostname();
		stack.push(origin);
		var count = 0;
		while(stack.length > 0) {
			var node = stack.pop();
			if(!visited[node]) {
				visited[node] = node;
				count++;
				var neighbors= this.ns.scan(node);
				for(var i = 0; i < neighbors.length; i++) {
					var child = neighbors[i];
					if(visited[child]) {
						continue;
					}
					stack.push(child);
				}
			}
		}
		return Object.keys(visited);
	}

	getAllServers2(root = 'home', found = []) {
    	found.push(root);
    	for (const server of root == 'home' ?
				this.ns.scan(root) : this.ns.scan(root).slice(1)) this.getAllServers2(server, found);
    	return found;
	}

	targetToHack() {
		this.log("Determining Target ...")
		if(this.ns.getHackingLevel() < 40) {
			return "n00dles";
		}
		var highestMoney = 0;
		var target = '';
		var servers = this.filterPrivateServs(this.availableNodes);
		for (var serv of servers) {
			if(this.ns.getServerRequiredHackingLevel(serv) > (this.ns.getHackingLevel() * .25 )) {
				continue;
			}
			if(typeof serv != "undefined"){
				var nodeMaxCash = this.ns.getServerMaxMoney(serv);
				if(highestMoney < nodeMaxCash) {
					highestMoney = nodeMaxCash;
					target = serv;
				}
			}
		}
		return target;
	}

	filterPrivateServs(nodes = null) {//Only look at non private servers
		if(!nodes) {
			nodes = this.nodes;
		}
		return nodes.filter( (node) => {
			if(node.substring(0,5) == "pserv"){
				return false;
			} else if(node == "home" || node == "CSEC") {
				return false;
			} else {
				return true;
			}
		});
	}

	hackableServers() {//Give list of servers to attack with
		return this.nodes.filter( (node) => { return this.canHack(node); })
	}

	determineVulnerableNodes(nodes) {//Server List to crack open
		if(nodes) {
			var numHax = this.hax;
			this.log("Hax Available: " + numHax);
			return nodes.filter( (node) => {
				//this.ns.tprint(numHax);
				return this.needsHacked(node, this.hax);
			});
		}
	}

	canHack(node) {
		if(this.ns.hasRootAccess(node)) {
			return true;
		}
	}

	needsHacked(node, numHax) {
		if(this.canHack(node)) {
			return false;
		}
		//this.ns.tprint(node + " " + numHax);
		if(this.hax >= this.ns.getServerNumPortsRequired(node)){
			return true;
		}
	}

	availableHacks() {
		return Object.keys(this.cracks).filter( (file) => {
			return this.ns.fileExists(file, "home");
		}).length ?? 0;
	}

	get nodes() {
		return this._nodes;
	}

	get vulnerableNodes() {
		return this._vulnerableNodes;
	}

	get availableNodes() {
		return this._availableNodes;
	}

	get target() {
		return this._target;
	}

	get hax() {
		return this._hax;
	}

	get cracks() {
		return this._cracks;
	}

	set nodes(nodes) {
		this._nodes = nodes;
	}

	set vulnerableNodes(nodes) {
		this._vulnerableNodes = nodes;
	}

	set availableNodes(nodes) {
		this._availableNodes = nodes;
	}

	set target(target) {
		this._target = target;
	}

	set hax(hacks) {
		this._hax = hacks;
	}

	set cracks(cracks) {
		this._cracks = cracks;
	}

	constructor(ns) {
		this.ns = ns;
		this.cracks = {
			"BruteSSH.exe": this.ns.brutessh,
			"FTPCrack.exe": this.ns.ftpcrack,
			"relaySMTP.exe": this.ns.relaysmtp,
			"HTTPWorm.exe": this.ns.httpworm,
			"SQLInject.exe": this.ns.sqlinject
		};
		this.hax = this.availableHacks();
		this.nodes = this.getNetworkNodes();
		this.vulnerableNodes = this.determineVulnerableNodes(this.nodes);
		this.availableNodes = this.hackableServers();
		this.target = this.targetToHack();
	}

	update() {
		this.nodes = this.getNetworkNodes();
		this.hax = this.availableHacks();
		this.vulnerableNodes = this.determineVulnerableNodes();
		this.availableNodes = this.hackableServers();
		this.target = this.targetToHack();
	}


}
