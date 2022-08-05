/** @param {NS} ns */
export class ServerHelper {
	constructor(ns) {
		this.ns = ns;
		this.scriptRam = 1.75;
	}

	log(message){
		this.ns.tprint(message);
	}

	threadCalc(ram) {
		//return Math.min(Math.floor(ram / this.scriptRam), 200);
		return Math.floor(ram / this.scriptRam);
	}

	async penetrate(node, hacks){
		if (this.ns.getServerNumPortsRequired(node) <= Object.keys(hacks).length){
			for (var file of Object.keys(hacks)) {
				if(this.ns.fileExists(file, "home")) {
					var script = hacks[file];
					script(node);
				}
			}
			this.log("Nuking " + node);
			this.ns.nuke(node);
		}
	}

	async attackServersPrim(nodes, target){
		var action = this.determineAction(target);
		for (var node of nodes) {
			var nodeDeets = this.serverDeets(node);
			var threads = 0;
			if(nodeDeets.percent == 0) { //Max out that Ram usage
				threads = this.threadCalc(nodeDeets.max);
			} else if (nodeDeets.avail > this.scriptRam) { //Squeeze in as much as possible
				threads = this.threadCalc(nodeDeets.avail);
			}

			if(node == "home") {
				threads = Math.floor(threads * .75);
			}
			if(threads > 0) { //Do the thing if we've got the ram available.
				await this.doAction(target, node, action, threads);
			}
			action = this.determineAction(target);
		}
	}

	async attackServersThreaded(nodes, target) {
		var actionR = this.determineActionRatio(target)

	}

	async doAction(target, server, action, threads) {
		if(!this.ns.fileExists(action + '.js', server)) {
			await this.ns.scp(action + '.js', server);
		}
		await this.ns.exec(action + '.js', server, threads, target);
	}

	targetServerDeets(node) {
		var maxMoney = this.ns.getServerMaxMoney(node);
		var moneyAvail = this.ns.getServerMoneyAvailable(node);
		var secLevel = this.ns.getServerSecurityLevel(node);
		var minSecLevel = this.ns.getServerMinSecurityLevel(node);
		// var weakentime = this.ns.getWeakenTime(node);
		// var hackTime = this.ns.getHackTime(node);
		// var growTime = this.ns.getGrowTime(node);
		return {
			monMax: maxMoney,
			monAvail: moneyAvail,
			secCur: secLevel,
			secMin: minSecLevel,
		}
	}

	serverDeets(node) {
		var ramMax = this.ns.getServerMaxRam(node);
		var ramCur = this.ns.getServerUsedRam(node);
		var ramAvail = ramMax - ramCur;
		var ramPercent = ramCur / ramMax * 100.0;
		return {
			max: ramMax,
			cur: ramCur,
			avail: ramAvail,
			percent: ramPercent
		}
	}

	determineAction(target) {
		var deetObj = this.targetServerDeets(target);
		if(deetObj.secCur > deetObj.secMin + 5) {
			return 'weaken';
		} else if (deetObj.monMax * .75 > deetObj.monAvail) {
			return 'grow';
		} else {
			return 'hack';
		}
	}

	determineActionRatio(target) {
		var deetObj = this.targetServerDeets(target);
		var adjustedDeets = {
			secTarget: deetObj.secMin + 5,
			secRatio: deetObj.secMin / deetOjb.secCur,
			moneyTarget: deetObj.monMax * .75,
			moneyRatio: deetObj.monAvail / deetObj.monMax
		}
	}
}
