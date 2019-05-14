
'use strict';

// Utility class for ledger state
const State = require('./../ledger-api/state.js');

// Enumerate arrangement state values
const arrState = {
    ALLOCATED: 1,
    TRADECREATED: 2,
    SETTLED: 3
};

class Arrangement extends State {

    constructor(obj) {
        super(Arrangement.getClass(), [obj.issuer, obj.paperNumber]);
        Object.assign(this, obj);
    }

    /**
     * Basic getters and setters of the properties of the arrangement
     */

     // commercial paper
     getCommercialPaper() {
         return this.commercialPaper;
     }
     setCommercialPaper(commercialPaper) {
         this.commercialPaper = commercialPaper;
     }

     // broker Dealer
     getBrokerDealer() {
         return this.brokerDealer;
     }
     setBrokerDealer(brokerDealer) {
         this.brokerDealer = brokerDealer;
     }

     // Amount
     getAmount() {
         return this.amount;
     }
     setAmount(amount) {
         this.amoun = amount;
     }

     // arrangement state
     getCurrentState() {
         return this.currentState;
     }
     
     /**
      * Helpers for getting and setting the state of the arrangement
      */
     // ALLOCATED 
     setAllocated() {
         this.currentState = arrState.ALLOCATED;
     }
     isAllocated() {
         return this.currentState === arrState.ALLOCATED;
     }

     // TRADECREATED
     setTradeCreated() {
        this.currentState = arrState.TRADECREATED;
    }
    isTradeCreated() {
        return this.currentState === arrState.TRADECREATED;
    }

    // SETTLED
    setSettled() {
        this.currentState = arrState.SETTLED;
    }
    isSettled() {
        return this.currentState === arrState.SETTLED;
    }


    static fromBuffer(buffer) {
        return Arrangement.deserialize(Buffer.from(JSON.parse(buffer)));
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to commercial paper
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, Arrangement);
    }

    /**
     * Factory method to create an Arrangement object
     */
    static createInstance(commercialPaper, brokerDealer, amount) {
        return new Arrangement({ commercialPaper, brokerDealer, amount});
    }

    static getClass() {
        return 'org.shield.arrangement';
    }
}