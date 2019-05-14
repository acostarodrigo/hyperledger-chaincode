'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('./../ledger-api/statelist.js');

const Arrangement = require('./arrangement');

class ArrangementList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.shield.arrangementlist');
        this.use(Arrangement);
    }

    async addArrangement(arrangement) {
        return this.addState(arrangement);
    }

    async getArrangement(arrangementKey) {
        return this.getState(arrangementKey);
    }

    async updateArrangement(arrangement) {
        return this.updateState(arrangement);
    }
}


module.exports = ArrangementList;