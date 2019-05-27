/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('../../ledger-api/state');
// Arrangement Shield class
const Arrangement = require('./arrangement');

// Enumerate commercial paper state values
const cpState = {
    PREISSUE: 1,
    COMMITED: 2,
    OUTSTANDING: 3,
    MATURE: 4,
    REDEEMED: 5
};

/**
 * CommercialPaper class extends State class
 * Class will be used by application and smart contract to define a paper
 */
class CommercialPaper extends State {

    constructor(obj) {
        super(CommercialPaper.getClass(), [obj.issuer, obj.paperNumber]);
        Object.assign(this, obj);
    }

    /**
     * Basic getters and setters
    */

    // Issuer
    getIssuer() {
        return this.issuer;
    }

    getNumber() {
        return this.getNumber;
    }
    
    setIssuer(newIssuer) {
        this.issuer = newIssuer;
    }
    
    // Amount
    getAmount() {
        return this.amount;
    }
    setAmount(amount) {
        this.amount = amount;
    }

    // currency
    getCurrency() {
        return this.currency;
    }
    setCurrency(currency) {
        this.currency = currency;
    }

    // offering date
    getOfferingDate() {
        return this.offeringDate;
    }
    setOfferingDate(offeringDate) {
        this.offeringDate = offeringDate;
    }

    // Issuance date
    getIssuanceDate() {
        return this.issunceDate;
    }
    setIssuanceDate(issuanceDate) {
        this.issanceDate = issuanceDate;
    }

    // Maturity Date
    getMaturityDate() {
        return this.maturityDate;
    }
    setMaturityDate(maturityDate) {
        this.maturityDate = maturityDate;
    }

    // price
    getPrice() {
        return this.price;
    }
    setPrice(price) {
        this.price = price;
    }

    // Arrangements
    getArrangements() {
        return this.arrangements;
    }
    getArrangement(broker){        
        let arrangement = this.arrangements.find(obj => obj.brokerDealer == broker);
        return arrangement;
    }
    addArrangement(arrangement) {
        if (this.arrangements == undefined){
            this.arrangements = [];
        }
        this.arrangements.push(arrangement);
    }

    // ISIN
    getISIN() {
        return this.isin;
    }
    setISIN(isin){
        this.isin = isin;
    }

    // current state
    getCurrentState() {
        return this.currentState;
    }
    

    /**
     * Useful methods to define commercial paper states
     */
    setPreIssue() {
        this.currentState = cpState.PREISSUE;
    }

    setCommited() {
        this.currentState = cpState.COMMITED;
    }

    setOutstanding() {
        this.currentState = cpState.OUTSTANDING;
    }

    setMature() {
        this.currentState = cpState.MATURE;
    }

    setRedeemed() {
        this.currentState = cpState.REDEEMED;
    }

    /**
     * Useful methods to validate current states of the commercial papers
     */
    isPreIssue() {
        return this.currentState === cpState.PREISSUE;
    }

    isCommited() {
        return this.currentState === cpState.COMMITED;
    }

    isOutstanding() {
        return this.currentState === cpState.OUTSTANDING;
    }

    isMature() {
        return this.currentState === cpState.MATURE;
    }

    isRedeemed() {
        return this.currentState === cpState.REDEEMED;
    }

    static fromBuffer(buffer) {
        return CommercialPaper.deserialize(Buffer.from(JSON.parse(buffer)));
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to commercial paper
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, CommercialPaper);
    }

    /**
     * Factory method to create a commercial paper object
     */
    static createInstance(issuer, paperNumber, amount, currency, maturityDate, price) {        
        var now = new Date();
        var data = {
            issuer: issuer,
            paperNumber: paperNumber,
            amount: amount,
            currency: currency,
            issuanceDate: now,
            maturityDate: maturityDate,
            arrangements: [],
            isin: '',
            currentState: '',
            price: price
        }        
        return new CommercialPaper(data);
    }

    static getClass() {
        return 'org.shield.commercialpaper';
    }
}

module.exports = CommercialPaper;
