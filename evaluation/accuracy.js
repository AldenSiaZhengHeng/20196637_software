const path = require('path');
const fs = require('fs');
//joining path of directory 
const directoryPath = path.join('intents');
//passsing directoryPath and callback function

const { NlpManager, Language } = require('node-nlp');
const test_data = [
    {input:"i want to upgrade the phone memory",label:"additional_info"},
{input:"i want to upgrade the iphone memory",label:"additional_info"},
{input:"i want to upgrade the memory for iphone",label:"additional_info"},
{input:"quit",label:"action.quit"},
{input:"i want to upgrade the memory for iphone",label:"additional_info"},
{input:"i want to upgrade iphone 14 pro storage",label:"additional_info"},
{input:"hi",label:"greetings.hello"},
{input:"i want to buy item",label:"customer.want_purchase"},
{input:"hi",label:"greetings.hello"},
{input:"I want to refund",label:"user.refund"},
{input:"yup",label:"agreement"},
{input:"i don't want it anymore",label:"action.quit"},
{input:"no",label:"disagreement"},
{input:"i want to refund",label:"user.refund"},
{input:"yes",label:"agreement"},
{input:"what item do you sell",label:"item.list"},
{input:"which one of them has a better camera",label:"item.best_camera"},
{input:"what is the price of iphone 14",label:"item_list_1"},
{input:"what iphone color do you have",label:"additional_info"},
{input:"what iphone color do you have",label:"additional_info"},
{input:"what is the specification of ASUS",label:"additional_info"},
{input:"I want to look at iphone 14",label:"item_list_1"},
{input:"I want an ASUS ROG",label:"add.item_3"},
{input:"I want to remove ",label:"customer.want_purchase"},
{input:"I want to remove the phone from my cart",label:"add.item_1"},
{input:"I want to remove item from my cart",label:"customer_purchase"},
{input:"Remove ASUS ROG Phone 6",label:"remove.item_3"},
{input:"I want to buy a Iphone Pro Max",label:"add.item_1"},
{input:"I want to clean the basket",label:"basket.clean"},
{input:"yes",label:"agreement"},
{input:"I want to buy iphone 14",label:"add.item_1"},
{input:"I want to buy Airpods",label:"customer.want_purchase"},
{input:"no",label:"add.item_1"},
{input:"I want to checkout",label:"customer.checkout"},
{input:"yes",label:"agreement"},
{input:"agree",label:"agreement"},
{input:"i want to buy airpods",label:"customer.want_purchase"},
{input:"i want to upgrade the iphone 14 pro storage.",label:"additional_info"},
{input:"i want to buy airpods",label:"customer.want_purchase"},
{input:"i want to buy phone",label:"customer.want_purchase"},
{input:"clothes",label:"None"},
{input:"i want to buy phone",label:"customer.want_purchase"},
{input:"i want to buy airpods",label:"additional_info"},
{input:"i want to buy phone",label:"customer.want_purchase"},
{input:"iphone 14 pro",label:"add.item_1"},
{input:"quit",label:"action.quit"},
{input:"i want to buy phone",label:"customer.want_purchase"},
{input:"quit",label:"action.quit"},
{input:"i want to buy phone",label:"customer.want_purchase"},
{input:"quit",label:"action.quit"},
{input:"i want to buy airpods",label:"item.extra"},
{input:"i want to buy clothes",label:"customer.want_purchase"},
{input:"clothes",label:"None"},
{input:"quit",label:"action.quit"},
{input:"i want to buy clothes",label:"customer.want_purchase"},
{input:"clothes",label:"None"},
{input:"i want to buy iphone",label:"customer.want_purchase"},
{input:"i want to buy samsung",label:"customer.want_purchase"},
{input:"clothes",label:"None"},
{input:"i want to buy rog",label:"add.item_3"},
{input:"clothes",label:"add.item_1"},
{input:"quit",label:"action.quit"},
{input:"refund",label:"user.refund"},
{input:"yes",label:"agreement"},
{input:"i don't want it anymore",label:"action.quit"},
{input:"hello",label:"greetings.hello"},
{input:"how are you",label:"greetings.hello"},
{input:"i want to know more about iphone",label:"item_list_1"},
{input:"tell me more about rog",label:"item_list_3"},
{input:"i want to buy asus rog phone 6",label:"add.item_3"},
{input:"i want to buy rog",label:"add.item_3"},
{input:"quit",label:"action.quit"},
{input:"check basket",label:"checkBasket"},
{input:"track package",label:"track.purchase"},
{input:"thank you",label:"gratitude"},
{input:"rog phone",label:"item_list_3"},
{input:"asus rog phone 6",label:"item.list"},
{input:"iphone 14 pro",label:"additional_info"},
{input:"tell me more about you",label:"agent.purpose"},
{input:"i want to upgrade the iphone memory",label:"additional_info"},
{input:"item list",label:"item.list"},
{input:"which phone has the best color",label:"item.best_camera"},
{input:"which phone has the largest storage",label:"item.large_storage"},
{input:"i want to buy the phone that has storage between 512gb - 128gb",label:"customer.want_purchase"},
{input:"quit",label:"action.quit"},
{input:"which phone that has storage between 512gb - 128gb",label:"item.large_storage"},
{input:"which phone that has storage between 1gb",label:"item.large_storage"},
{input:"hello",label:"greetings.hello"},
{input:"which phone has storage between 1gb",label:"item.large_storage"},
{input:"i want to know the color of the phone",label:"customer.want_purchase"},
{input:"iphone 14 pro",label:"item_list_1"},
{input:"color",label:"additional_info"},
{input:"what color phone you got",label:"additional_info"},
{input:"what color you have?",label:"additional_info"},
{input:"what color you have for iphone 14 pro",label:"additional_info"},
{input:"rog phone 6",label:"item_list_3"},
{input:"rog",label:"item_list_3"},
{input:"what color do you have?",label:"item.list"},
{input:"which phone has storage between 1gb",label:"item.large_storage"},
{input:"clothes",label:"None"},



];

const nlpManager = new NlpManager({
        languages:['en'],  
        threshold:0.6,
        nlu: { 
            log: false, 
            useNoneFeature: false 
        },
    });
    
const util = require('util');
const readdir = util.promisify(fs.readdir);

// get the intents name created
async function readfile() {
    try {
    const files = await readdir(directoryPath);
    const filenames = files.map(file => file.split('.json')[0]);
    return filenames;
    } catch (err) {
    console.log('Unable to scan directory: ' + err);
    }
}

// async function process() {
//     var filenames = await readfile();
//     console.log(filenames);
// }

// process();

async function calculate(filename){
    // var filename = await readfile();
    var filename = await readfile();
    var correct_predict = 0;
    var count = 0;
    filename.push("None")
    console.log(filename)
	const labels = filename;
    console.log(filename)
	const confusionMatrix = labels.reduce((matrix, label) => {
		matrix[label] = { tp: 0, tn: 0, fp: 0, fn: 0 };
		console.log(label)
		console.log(matrix[label])
		return matrix;
	}, {});
	console.table(confusionMatrix)
	nlpManager.load();
	
	// await nlpManager.train();
    try{
        for(const data of test_data){
            const prediction = await nlpManager.process(data.input);
            count = count + 1;
            console.log(prediction)
            // if(prediction.intent =='None'){
            //     prediction.intent = labels[Math.floor(Math.random()*labels.length)];
            // }
            const label = data.label;
               const isCorrect = prediction.intent === label;
        
        if (isCorrect) {
            confusionMatrix[label].tp++;
            for (let otherLabel of labels) {
                if (otherLabel !== label) {
                    confusionMatrix[otherLabel].tn++;
                }
            }
            correct_predict = correct_predict + 1;
        } else {
            console.log(prediction.intent)
            confusionMatrix[label].fn++;
            confusionMatrix[prediction.intent].fp++;
            for (let otherLabel of labels) {
                if (otherLabel !== label && otherLabel !== prediction.intent) {
                    confusionMatrix[otherLabel].tn++;
                }
            }
        }
        }
    } catch(err){
        console.log(err)
    }

	console.table(confusionMatrix);
    console.log('------------------')
    console.log(correct_predict)
    console.log("count: " +count)
    console.log('------------------')

	for(const label of labels){
		const tp = confusionMatrix[label].tp;
		const fp = confusionMatrix[label].fp;
		const fn = confusionMatrix[label].fn;
		
		const precision = tp / (tp + fp);
		const recall = tp / (tp + fn);
		const f1score = 2 * (precision * recall) / (precision + recall);
		
		console.log(`Label: ${label}`);
		console.log(`Precision: ${precision}`);
		console.log(`Recall: ${recall}`);
		console.log(`F1-score: ${f1score}`);
		console.log();
	}
}

// readfile().then(result=>{
//     calculate(result)
// })
calculate()


