/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('../../ledger-api/statelist.js');

const CommercialPaper = require('./paper.js');



class PaperList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.shield.commercialpaperlist');
        this.use(CommercialPaper);
    }

    /**
     * We split the commercial paper into separate Arrangements and paper data.
     * Arrangements must be stored encrypted and calls different shim functions
     * @param {CommercialPaper} paper 
     */
    async addPaper(paper, arrangement) {       
        return this.addState(paper, arrangement);
    }

    /**
     * gets the commercial paper with all available arrangements
     * @param {key} paperKey with issuer + number
     */
    async getPaper(paperKey) {
        let commercialPaper = await this.getState(paperKey);
        if (commercialPaper){
            let arrangements = await this.getArrangementsOfPaper(commercialPaper.paperNumber);
            commercialPaper.arrangements = arrangements;
        }
                
        return commercialPaper;
    }

    async getPapers(key1, key2){
        return this.getStateByRange(key1, key2);
    }

    async updatePaper(paper) {
        return this.updateState(paper);
    }

    async getArrangementsOfPaper (paperNumber){
        return this.getArrangements(paperNumber);
    }

    async addArrangements(arrangement){
        return this.addArrangement(arrangement);
    }
}


module.exports = PaperList;