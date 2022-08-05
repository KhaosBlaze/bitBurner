/** @param {NS} ns */
export class PurchaseModule {
	constructor(ns) {
		this.ns = ns;
		this.scripts = [
			"grow.js",
			"hack.js",
			"weaken.js"
		];
		this.currentServers = this.ns.getPurchasedServers() ?? [];
		this.cash = this.currentCash();
	}

	update() {
		this.currentServers = this.ns.getPurchasedServers() ?? [];
		this.cash = this.currentCash();
	}

	async provision(serverName, ram) {
		this.log("Attempting to purchase: " + serverName + " with " + ram + "GB.")
		if(this.ns.serverExists(serverName)) {
			this.ns.killall(serverName);
			this.ns.deleteServer(serverName);
		}
		this.ns.purchaseServer(serverName, ram);
	}

	log(message) {
		this.ns.print(message);
	}

	currentCash() {
		return this.ns.getServerMoneyAvailable("home") * .1;
	}

	getDesiredRam(availableMoney){
		var ram = 1;
		while(availableMoney > this.ns.getPurchasedServerCost(ram*2)) {
			ram *= 2;
		}
		return ram;
	}

	getMinRam(){
		var severs = this.currentServers;
		//this.ns.tprint("Crash here?");
		var min = this.ns.getServerMaxRam(severs[0]);
		if(this.currentServers.length === 1) {
			return min;
		}
		for(var i = 1; i < severs.length; i++) {
			///this.ns.tprint("Or here?");
			var servMin = this.ns.getServerMaxRam(severs[i]);
			if(servMin < min) {
				min = servMin;
			}
		}
		return min;
	}

	getCurrentServers() {
		return this.ns.getPurchasedServers();
	}

	needToAddServers() {
		if(this.currentServers.length < 24) { return true; }
		return false;
	}

	async provisionServers() {
		var servers = this.currentServers;
		var targetRam = this.getDesiredRam(this.cash);
		this.log("Current Servers: " + servers);

		if ( this.needToAddServers() ) {
			if(targetRam > 2) {
				for (var i = servers.length; i < 25; i++) {
					var serverName = "pserv-" + i;
					this.provision(serverName, targetRam);
				}
			}
		}

		if (this.currentServers.length === 0) {
			this.log("No servers");
			return;
		}

		var ramCost = this.ns.getPurchasedServerCost(targetRam);//Save us some processing
		if (targetRam < 2 || this.cash < 500000 || targetRam < this.getMinRam()) {
			this.log("Return 2");
			return;
		}

		for (var serv of servers) {
			var ram = this.ns.getServerMaxRam(serv);
			this.log("Current Server: " + serv);
			if(ram < targetRam || targetRam < 2) {
				this.log("Upgrading to " + targetRam + "GB servers.\n" +
					"Cost Per Server: " + ramCost);
				var moneyAvail = this.currentCash();
				if (moneyAvail > ramCost) {
					this.log("Reprovisioning: ");
					await this.provision(serv, targetRam);
				}
			} else {
				this.log(serv + " DoEsN't NeEd UpGrAdEd");
			}
		}
		this.update();
	}
}
