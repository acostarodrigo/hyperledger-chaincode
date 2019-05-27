'use strict';

/**
 * Arrangement class that represents deals between Issuer and a broker.
 */
class Arrangement {
    constructor(paperId, brokerDealer, amount){
        this.paperId = paperId;
        this.brokerDealer = brokerDealer;
        this.amount = amount;
        this.collection = 'collection_' + this.brokerDealer.toLowerCase();
    }

    /**
     * getters and setters
     */
    getBrokerDealer(){
        return this.brokerDealer;
    }
    setBrokerDealer(brokerDealer){
        this.brokerDealer = brokerDealer;
    }
    
    /**
     * the collection Name, that defines the private data is defined as collection + brokerDealer Name
     */
    getCollection(){
        return this.collection;
    }

    getAmount(){
        return this.amount;
    }
    setAmount(amount){
        this.amount = amount;
    }

    getPaperId() {
        return this.paperId;
    }

    /**
     * generates buffer for responses
     */
    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to Arrangement
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, Arrangement);
    }

    static getClass() {
        return 'org.shield.arrangement';
    }
}

module.exports = Arrangement;