/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const State = require('./state.js');

/**
 * StateList provides a named virtual container for a set of ledger states.
 * Each state has a unique key which associates it with the container, rather
 * than the container containing a link to the state. This minimizes collisions
 * for parallel transactions on different states.
 */
class StateList {

    /**
     * Store Fabric context for subsequent API access, and name of list
     */
    constructor(ctx, listName) {
        this.ctx = ctx;
        this.name = listName;
        this.supportedClasses = {};

    }

    /**
     * Keys might have " character or spaces. We remove them all for consistency.
     * @param {String} key to fix
     */
    fixKey(key) {
        let fixedKey = key.replace(/"/g,''); // we remove the doble quotes
        fixedKey = fixedKey.replace(/\s/g,''); // we remove spaces
        return fixedKey;
    }

    /**
     * we get the list of brokers stored at contract instantiation.
     * @returns an array of strings with brokers names
     */
    async getBrokers() {
        let result = await this.ctx.stub.getState('brokers');
        let broker = result.toString('utf8');
        let brokers = broker.split(',');
        return brokers;
    }

    /**
     * Add a state to the list. Creates a new state in worldstate with
     * appropriate composite key.  Note that state defines its own key.
     * State object is serialized before writing.
     * @param {CommercialPaper} state the commercial paper to store
     * @param {Arrangement} arrangements the list of arrangements to store privatelly
     */
    async addState(state, arrangements) {      
        let key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());
        key = key.replace(/"/g,''); //we remove all " from the key

        if (arrangements.length > 0){
            const self = this;
            arrangements.forEach(function(arrangement){
                // we generate the key paperId+brokerDealer
                let arrangementyKey =  self.ctx.stub.createCompositeKey(self.name,[arrangement.paperId, arrangement.brokerDealer]);
                arrangementyKey = arrangementyKey.replace(/"/g,'');
                // we store it privatelly with the defined collection        
                self.ctx.stub.putPrivateData(arrangement.getCollection(), arrangementyKey, State.serialize(arrangement));        
              });
        } 
        
        // now we store the public part.        
        let data = State.serialize(state);
        await this.ctx.stub.putState(key, data);
    }

    /**
     * Stored privatelly based on arrangement.allocation the provided arrangement.
     * @param {Arrangement} arrangement the arrangement we want to add to private state database
     */
    async addArrangement(arrangement) {
        // arrangement data validation
        if (!arrangement.collection || !arrangement.paperId || !arrangement.brokerDealer || !arrangement.amount) {
            throw new Error ('Specified arrangement is not complete. All fields are mandatory.');
        }

        // let's validate arrangement doesn't exists already.
        let arrangementyKey =  this.ctx.stub.createCompositeKey(this.name,[arrangement.paperId, arrangement.brokerDealer]);
        arrangementyKey = this.fixKey(arrangementyKey);
        let result = await this.ctx.stub.getPrivateData(arrangement.collection, arrangementyKey);
        
        // TODO we must validate the arrangement doesn't exists
        if (!result) {            
            throw new Error ('Arrangement ' + arrangementyKey.toString() + ' already exists.');
        }

        // we are ready to store it.
        let data = State.serialize(arrangement);
        await this.ctx.stub.putPrivateData(arrangement.collection, arrangementyKey, data);
        return data;
    }
  

    /**
     * Get a state from the list using supplied keys. Form composite
     * keys to retrieve state from world state. State data is deserialized
     * into JSON object before being returned.
     */
    async getState(key) {
        let ledgerKey = this.ctx.stub.createCompositeKey(this.name, State.splitKey(key));
        ledgerKey = ledgerKey.replace(/"/g,'');
        let data = await this.ctx.stub.getState(ledgerKey);
            
        if (data && data.length>0){ // need to validate that is not an empty buffer!!
            let state = State.deserialize(data, this.supportedClasses);
            return state;
        } else {
            return null;
        }
    }

    /**
     * Gets all available arrangements for a specified commercial paper.
     * We are looping on all collations stored at contract instantiation to get private data.
     * Fabric will only execute on those the caller's organization have access.
     * @param {String} paperNumber the commercial paper we are getting the arrangements from
     */
    async getArrangements(paperNumber) {
        let arrangements = [];              
        
        // we get all stored brokers
        let brokers = await this.getBrokers();        
        
        // we looped them to get the arrangements
        for (let index = 0; index < brokers.length; index++) {
            let arrangementKey =  this.ctx.stub.createCompositeKey(this.name,[paperNumber,brokers[index]]);
            arrangementKey = this.fixKey(arrangementKey);            
            let collection = 'collection_' + brokers[index];            
            try {
                //we get private data, might fail if Organization has no access.
                let result = await this.ctx.stub.getPrivateData(collection, arrangementKey);                
                arrangements.push(result.toString('utf8'));
            } catch (e) {
                // error is caused because calling Org has no access to private data using collection
                continue;
            }
        } 
        return arrangements;
    }

    async getCommercialPapers () {
        // commercial paper existance has already been validated.

    }
    
    async getStateByRange(key1, key2){
        let ledgerKey = this.ctx.stub.createCompositeKey(this.name, State.splitKey(key1));
        let ledgerKey2 = this.ctx.stub.createCompositeKey(this.name, State.splitKey(key2));
        
        const iterator = await this.ctx.stub.getStateByRange(ledgerKey, ledgerKey2);            
        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push(Record);
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    /**
     * Update a state in the list. Puts the new state in world state with
     * appropriate composite key.  Note that state defines its own key.
     * A state is serialized before writing. Logic is very similar to
     * addState() but kept separate becuase it is semantically distinct.
     */
    async updateState(state) {
        let key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());
        let data = State.serialize(state);
        await this.ctx.stub.putState(key, data);
    }

    /** Stores the class for future deserialization */
    use(stateClass) {
        this.supportedClasses[stateClass.getClass()] = stateClass;
    }

}

module.exports = StateList;