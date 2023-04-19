// This file contain the function to process the intent file created and learn the intent and answer with NLP, NLU and NLG with NLPManager

const fs = require("fs");
const { NlpManager } = require("node-nlp");

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
});

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
	
}

(async () => {
	await manager.train();
	manager.save();
})();
