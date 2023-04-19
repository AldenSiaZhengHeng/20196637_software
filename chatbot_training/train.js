const fs = require("fs");
const { NlpManager } = require("node-nlp");

// const manager = new NlpManager({ languages: ['en'], forceNer:true, classifier:'nb'});
const manager = new NlpManager({
	languages: ['en'],
	forceNER: true,
	nlu:{
		log:true
	},
	ner: {
		builtins: [],
		threshold: 0.6
	}
	// threshold: 0.8
	// classifier: {
//   type: 'svm',
//   kernelType: 'linear',
//   C: 1.0,
// },
});

// manager.addCorpus("./corpus.json");
const files = fs.readdirSync("./intents");

for (const file of files) {
	let data = fs.readFileSync(`./intents/${file}`);
	data = JSON.parse(data);

	const intent = file.replace(".json", "");

	for (const question of data.questions) {
		manager.addDocument("en", question, intent);
	}

	for (const answer of data.answers) {
		manager.addAnswer("en", intent, answer);
	}
	manager.addNamedEntityText('phone','phone',['en'],['phone'])
	manager.addNamedEntityText('iphone','iphone 14 pro',['en'],['Iphone 14 pro','Iphone'])
	manager.addNamedEntityText('samsung','samsung s22',['en'],['Samsung S22', 'samsung'])
	manager.addNamedEntityText('rog', 'ASUS ROG Phone 6',['en'],['asus rog phone 6', 'rog phone','rog'])
	manager.addNamedEntityText('sim_card','Sim card',['en'],['sim card','Sim Card','SIM CARD'])
	manager.addNamedEntityText('phone_case','phone Case',['en'],['phone case','Phone Case','PHONE CASE'])
	manager.addNamedEntityText('color','color',['en'],['color'])
	manager.addNamedEntityText('processor','processor',['en'],['processor'])
	manager.addNamedEntityText('memory','memory',['en'],['memory'])
	manager.addNamedEntityText('upgrade','upgrade',['en'],['upgrade'])
	

	// manager.addCorpus("corpus.json")

	// manager.addNamedEntityText(
	// 	'doctor',
	// 	'alden',
	// 	['en'],
	// 	['Alden', 'alden']
	// )

}

// const trainingOptions = {
// 	epochs: 50,
// 	learningRate: 0.1,
// 	lossThresh: 0.1,
// 	onEpoch: (epoch, loss) => {
// 	  console.log(`Epoch ${epoch} completed with a loss of ${loss}`);
// 	},
//   };


(async () => {
	await manager.train();
	manager.save();
})();
