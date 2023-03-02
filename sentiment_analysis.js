const { PorterStemmer, SentimentAnalyzer, WordTokenizer } = require("natural")
const { removeStopwords } = require("stopword");


class sentiment_analysis{
    constructor(){
        this.analyzer = new SentimentAnalyzer("English", PorterStemmer, "afinn");
        this.tokenizer = new WordTokenizer();
    } 


    getSentiment(user_utterance){
        console.log("User utterance:" + user_utterance);
        const filteredText = user_utterance
            .replace("n't", " not")
            .replace("'s", " is")
            .replace("'re", " are")
            .replace("'ve", " have")
            .replace("'d", " would")
            .replace("'ll", " will")
            .replace("'m", " am")
            .replace(/[^a-zA-Z\s]+/g, "");    
    
        console.log(`filteredText = ${filteredText}`);

        const tokens = this.tokenizer.tokenize(filteredText);
        console.log(`tokens = ${tokens}`);
    
        const filteredTokens = removeStopwords(tokens).map((token) =>
            token.toLowerCase()
        );
        console.log(`filteredTokens = ${filteredTokens}`);
    
        const score = this.analyzer.getSentiment(filteredTokens);
        console.log(`score = ${score}/5`);
    
        const percent = Math.round((score / 5) * 100);
        console.log(`percent = ${percent}`);
    
        if (score > 0) {
            console.log( percent, "sentiment: positive ");
            var result = {score:percent, feeling: "positive"};
            return result;
        } else if (score < 0) {
            console.log( percent, "sentiment: negative ");
            var result = {score:percent, feeling: "negative"};
            return result;
        } else {
            console.log( percent, "sentiment: neutral ");
            var result = {score:percent, feeling: "neutral"};
            return result;
        }
        
    }
}

module.exports = sentiment_analysis
