/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('./../ledger-api/state.js');

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
    getIssuer() {
        return this.issuer;
    }

    setIssuer(newIssuer) {
        this.issuer = newIssuer;
    }

    getOwner() {
        return this.owner;
    }

    setOwner(newOwner) {
        this.owner = newOwner;
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
    isPreIssued() {
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
    static createInstance(issuer, paperNumber, issueDateTime, maturityDateTime, faceValue) {
        return new CommercialPaper({ issuer, paperNumber, issueDateTime, maturityDateTime, faceValue });
    }

    static getClass() {
        return 'org.papernet.commercialpaper';
    }
}

module.exports = CommercialPaper;
