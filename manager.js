import { Network } from './network.js';
import { ServerHelper } from './serverActions.js';
import { PurchaseModule } from './purchaseModule.js';

/** @param {NS} ns */
export async function main(ns) {
	//ns.disableLog(ALL);
	var activeNetwork = new Network(ns);
	var servHelper = new ServerHelper(ns);
	var purchaser = new PurchaseModule(ns);
	ns.disableLog('ALL');

	function log(message) {//Don't wanna write ns.tprint all the time
		ns.print(message);
	}

	function loopPrint(obj) { //Tired of trying to get objects to print sanely
		for (var detail of Object.keys(obj)) {
			log(detail + ": " + obj[detail]);
		}
	}

	function openServers(serverList, cracks) { //Loop and crack all servers we can
		for (var serv of serverList) {
			servHelper.penetrate(serv, cracks);
		}
	}

	var curTarget = '';
	var waitTime = 5000;

	while (true) {
		log(purchaser.cash);
		await ns.sleep(waitTime);

		var serverList = activeNetwork.availableNodes; //Get List of servers
		var newTarget = activeNetwork.target; //Determine Target (Done)

		await purchaser.provisionServers(); //Add to the army

		//Get servers needing hacking
		//	Hack as necessary
		if (typeof activeNetwork.vulnerableNodes != 'undefined') {
			log('hacker man ...');
			openServers(activeNetwork.vulnerableNodes, activeNetwork.cracks);
		}

		if (newTarget !== curTarget) { //Update current target if not the same
			curTarget = newTarget;
		}
		if (curTarget === '') { continue; }//Loop to preent use of empty server name
		log("Running hacks against: " + curTarget); //FeedBack is nice

		//Rudamentary hacking logic till more robust algorithim is determined.
		await servHelper.attackServersPrim(
			serverList,
			curTarget
		);

		//Get Time to run
		activeNetwork.update();
	}
}
