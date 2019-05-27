'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// Shield specific classes
const CommercialPaper = require('./paper.js');
const PaperList = require('./paperlist.js');
const Arrangement = require('./arrangement');


/**
 * A custom context provides easy access to list of all commercial papers
 */
class CommercialPaperContext extends Context {

    constructor() {
        super();
        // All papers are held in a list of papers
        this.paperList = new PaperList(this);
    }

}


/**
 * Define commercial paper smart contract by extending Fabric Contract class
 *
 */
class CommercialPaperContract extends Contract {

    constructor() {
        // Unique name when multiple contracts per chaincode file
        super('org.shield.commercialpaper');
    }

    /**
     * Define a custom context for commercial paper
    */
    createContext() {
        return new CommercialPaperContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx, issuer, supportedCurrencies, brokers) {
        // we are storing the issuer for this commercial paper.
        if (!issuer){
            throw new Error ('Issuer must be provided.');
        }
        if (!supportedCurrencies){
            throw new Error ('Supported currencies must be suplied.');
        }
        
        await ctx.stub.putState('issuer',Buffer.from(issuer));        
        await ctx.stub.putState('supportedCurrencies',Buffer.from(supportedCurrencies));
        await ctx.stub.putState('brokers',Buffer.from(brokers));
    }

    /**
     * gets the issuer defined for this commercial paper. Can't be changed.
     * @param {Context} ctx transaction context
     */
    async getIssuer(ctx){
        let response = await ctx.stub.getState('issuer');
        return response.toString('utf8');
    }

    /**
     * Gets the list of supported currencies for the contract
     * @param {Context} ctx transaction context
     */
    async getSupportedCurrencies(ctx) {
        let response =  await ctx.stub.getState('supportedCurrencies');
        let supportedCurrencies = response.toString('utf8').split(',');        
        return supportedCurrencies;
    }
    
    /**
     * 
     * @param {Context} ctx the transaction context
     * @param {Integer} paperNumber paper number for this issuer
     * @param {Integer} amount 
     * @param {Currency} currency supported currency on shield
     * @param {String} maturityDate the date the commercial paper will be mature
     * @param {Integer} price the price of the commercial paper, represented as a percentage
     */
    async preIssue(ctx, paperNumber, amount, currency, maturityDate, price) {        
        // **** Input parameter validations ***** 

        // we validate currency is supported
        let supportedCurrencies = await this.getSupportedCurrencies(ctx);
        if (supportedCurrencies.indexOf(currency) == -1){
            throw new Error ('Currency ' + currency + ' is not supported.')
        }
        // we validate numeric inputs
        if (amount <= 0 || price <= 0){
            throw new Error ('Amount and price must be possitive values greater than zero.');
        }
        
        // we validate maturity date
        var now = new Date();
        if (maturityDate < now) {
            throw new Error ("Maturity date can't be in the past.");
        }
        
        // we get the issuer
        let issuer = await this.getIssuer(ctx);
        
        // we must validate this is not a duplicate ID
        let paperKey = CommercialPaper.makeKey([issuer, paperNumber]);        
        let paper = await ctx.paperList.getPaper(paperKey);
        if (paper){
            throw new Error ('Duplicated commercial paper with id ' + paperKey + '. Specify another number.');
        }
        
        // we validate transient data
        // format is: {[key: value] where value is string brokerDealer:amount}
        let transient = ctx.stub.getTransient();        
        let arrangements = [];
        if (transient.size > 0){
            // todo this can be improved. send a map that iterates on each key, and make a broker the key
            for (var i = 0; i<transient.size; i++){
                // we get the values and validate they have data
                var value = transient.get(i.toString());
                var data = value.toString('utf8').split(':');
                if (!data[0] || !data[1]){
                    throw new Error ('Provided arrangement must contain both broker dealer and amount values.');
                }
                let arrangement = new Arrangement(paperNumber, data[0], data[1]);

                // todo validate arrangement doesn't exists already
                // TODO validate that the sum of amount of arrangements is equal or less than paper value
                arrangements.push(arrangement);
            }
        }

        // create a new instance of the paper
        paper = CommercialPaper.createInstance(issuer, paperNumber, amount, currency, maturityDate, price);

        // CurrentState is set to preissued.
        paper.setPreIssue();
    
        // Add the paper to the list of all commercial papers in the ledger world state
        await ctx.paperList.addPaper(paper, arrangements);
        
        // Must return a serialized paper to caller of smart contract and we add the arrangements
        // which have been stored privatelly.
        paper.arrangaments = arrangements;
        return paper.toBuffer();
    }

    async addArrangement(ctx, paperNumber) {
        // we validate transient data
        // format is: {[key: value] where value is string brokerDealer:amount}
        let transient = ctx.stub.getTransient();        
        if (transient.size == 0){
            throw new Error ('Arrangement data must be sent privatelly on a transient object. None was provided.');
        }

        // we get the issuer
        let issuer = await this.getIssuer(ctx);

        // Retrieve the current paper using key fields provided
        let paperKey = CommercialPaper.makeKey([issuer, paperNumber]);
        let paper = await ctx.paperList.getPaper(paperKey);

        // we are only allowing adding arrangement on the 
        if (!paper.isPreIssue()){
            throw new Error ('Commercial paper must be in PreIssue state to add new arrangements.');
        }

        // we validate transient data
        // format is: {[key: value] where value is string brokerDealer:amount}
        
        for (var i = 0; i<transient.size; i++){
            // we get the values and validate they have data
            var value = transient.get(i.toString());
            var data = value.toString('utf8').split(':');
            if (!data[0] || !data[1]){
                throw new Error ('Provided arrangement must contain both broker dealer and amount values.');
            }
            let arrangement = new Arrangement(paperNumber, data[0], data[1]);

            // TODO validate that the sum of amount of arrangements is equal or less than paper value

            // todo validate arrangement doesn't exists already            
            paper.addArrangement(arrangement);

             // Update the paper
            await ctx.paperList.addArrangements(arrangement);
        }
        
        // Must return a serialized paper to caller of smart contract
        return paper.toBuffer();
    }

    /**
     * Updates a commercial paper with the new one.
     * @param {Context} ctx transaction context
     * @param {CommercialPaper} commercialPaper the commercial paper to update
     */
    async updateCommercialPaper(ctx, commercialPaper) {
        let paperKey = CommercialPaper.makeKey([issuer, paperNumber]);
        let paper = await ctx.paperList.getPaper(paperKey);

        // if the commercial paper is in PreIssue state, we allow any change, except the currency type
        if (commercialPaper.isPreIssue()){
            // we need to verify currency hasn't changed.
            if (paper.getCurrency !== commercialPaper.getCurrency) {
                throw new Error ('Currency change is not allowed while paper is in PreIssue state.');
            }
        }

        // todo add more validations on the state change

        // we are ready to update the commercial paper
        await ctx.paperList.updatePaper(commercialPaper);
        return commercialPaper.toBuffer();
    }

    
    //**** Queries ****/

     /**
     * gets a single commercial paper
     * @param {Context} ctx 
     * @param {String} issuer issuer of the paper
     * @param {Integer} paperNumber number of the paper
     */
    async getCommercialPaper(ctx, paperNumber) {
        // we get the issuer
        let issuer = await this.getIssuer(ctx);

        let paperKey = CommercialPaper.makeKey([issuer, paperNumber]);
        let paper = await ctx.paperList.getPaper(paperKey);
        if (paper) {
            return paper.toBuffer();        
        } else {
            return null;
        }
    }

     /**
     * gets all commercial papers
     * @param {Context} ctx 
     * @param {String} issuer issuer of the paper
     * @param {Integer} paperNumber number of the paper
     */
    async getCommercialPapers(ctx) {
         // we get the issuer
         let issuer = await this.getIssuer(ctx);
         let paperKey = CommercialPaper.makeKey([issuer, "0"]);
         let paperKey1 = CommercialPaper.makeKey([issuer, "10"]);
         return ctx.paperList.getPapers(paperKey,paperKey1);
    }
   

    /**
     * Gets all arrangements from an specific commercial paper.
     * @param {Context} ctx transaction context
     * @param {String} paperNumber paper number you want to get the arrangements from
     */
    async getArrangements(ctx, paperNumber){
        // paper number must be supplied.
        if (!paperNumber) {
            throw new Error ('Paper number must be supplied.');
        }
         // we validate we have a paper with this number
         let issuer = await this.getIssuer(ctx);
         let paperKey = CommercialPaper.makeKey([issuer, paperNumber]);
         let paper = await ctx.paperList.getPaper(paperKey);

         if (!paper) {
             throw new Error ('There is no commercial paper with ID ' + paperNumber);
         }
        
         // lets get the arrangements from private data
        let results = await ctx.paperList.getArrangementsOfPaper(paperNumber);
        return results;
    }
}

module.exports = CommercialPaperContract;
