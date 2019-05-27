/*
* Use this file for functional testing of your smart contract.
* Fill out the arguments and return values for a function and
* use the CodeLens links above the transaction blocks to
* invoke/submit transactions.
* All transactions defined in your smart contract are used here
* to generate tests, including those functions that would
* normally only be used on instantiate and upgrade operations.
* This basic test file can also be used as the basis for building
* further functional tests to run as part of a continuous
* integration pipeline, or for debugging locally deployed smart
* contracts by invoking/submitting individual transactions.
*/
/*
* Generating this test file will also trigger an npm install
* in the smart contract project directory. This installs any
* package dependencies, including fabric-network, which are
* required for this test file to be run locally.
*/

'use strict';

const assert = require('assert');
const fabricNetwork = require('fabric-network');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const os = require('os');
const path = require('path');
const URL = require('url');

describe('org.shield.commercialpaper-papercontract' , () => {

    const homedir = os.homedir();
    const walletPath = path.join(homedir, '.fabric-vscode', 'firstNetworkWallet');
    const gateway = new fabricNetwork.Gateway();
    const wallet = new fabricNetwork.FileSystemWallet(walletPath);
    const identityName = 'rodrigo';
    let connectionProfile;

    before(async () => {
        const connectionProfilePath = path.join(homedir, 'invectorIQ/projects/securitize/sourceCode/chaincode/connectionProfiles', 'firstnetwork_org1.json');
        const connectionProfileContents = await fs.readFile(connectionProfilePath, 'utf8');
        if (connectionProfilePath.endsWith('.json')) {
            connectionProfile = JSON.parse(connectionProfileContents);
        } else if (connectionProfilePath.endsWith('.yaml') || connectionProfilePath.endsWith('.yml')) {
            connectionProfile = yaml.safeLoad(connectionProfileContents);
        };
    });

    beforeEach(async () => {

        const discoveryAsLocalhost = hasLocalhostURLs(connectionProfile);
        const discoveryEnabled = true;

        const options = {
            wallet: wallet,
            identity: identityName,
            discovery: {
                asLocalhost: discoveryAsLocalhost,
                enabled: discoveryEnabled
            }
        };

        await gateway.connect(connectionProfile, options);
    });

    afterEach(async () => {
        gateway.disconnect();
    });

    it('instantiate', async () => {
        // TODO: Update with parameters of transaction
        const args = ["issuer1","USD,EUR,JPN","org2,org3"];

        const response = await submitTransaction('instantiate', args); // Returns buffer of transaction return value
        // TODO: Update with return value of transaction
        // assert.equal(JSON.parse(response.toString()), undefined);
    }).timeout(10000);

    it('getIssuer', async () => {
        // TODO: Update with parameters of transaction
        const args = [];

        const response = await submitTransaction('getIssuer', args); // Returns buffer of transaction return value
        console.log(response.toString('utf8'));
        // TODO: Update with return value of transaction
        // assert.equal(JSON.parse(response.toString()), undefined);
    }).timeout(10000);

    it('getSupportedCurrencies', async () => {
        // TODO: Update with parameters of transaction
        const args = [];

        const response = await submitTransaction('getSupportedCurrencies', args); // Returns buffer of transaction return value
        console.log(response.toString('utf8'));
        // TODO: Update with return value of transaction
        // assert.equal(JSON.parse(response.toString()), undefined);
    }).timeout(10000);

    it('preIssue', async () => {
        // TODO: Update with parameters of transaction
        const args = ["1","1000000","USD","2019-10-10","99"];
        // transient = {"0":"broker:1000"}
        let transient = {
            "0": Buffer.from("org2:1000")
        } 
        const response = await submitWithTransientTransaction('preIssue', args, transient); // Returns buffer of transaction return value
        console.log(response.toString('utf8'));
        // TODO: Update with return value of transaction
        // assert.equal(JSON.parse(response.toString()), undefined);
    }).timeout(100000);

    it('addArrangement', async () => {
        // TODO: Update with parameters of transaction
        const args = ["1"];
        let transient = {
            "0": Buffer.from("org3:500")
        } 
        const response = await submitWithTransientTransaction('addArrangement', args, transient); // Returns buffer of transaction return value
        console.log(response.toString('utf8'))
        // TODO: Update with return value of transaction
        // assert.equal(JSON.parse(response.toString()), undefined);
    }).timeout(10000);

    it('getArrangements', async () => {
        // TODO: Update with parameters of transaction
        const args = ["1"];

        const response = await submitTransaction('getArrangements', args); // Returns buffer of transaction return value
        console.log(response.toString('utf8'));
        // TODO: Update with return value of transaction
        // assert.equal(JSON.parse(response.toString()), undefined);
    }).timeout(10000);


    it('getCommercialPaper', async () => {
        // TODO: Update with parameters of transaction
        const args = ["1"];

        const response = await submitTransaction('getCommercialPaper', args); // Returns buffer of transaction return value
        console.log(Buffer.from(JSON.parse(response.toString('utf8')).data).toString('utf8'));
        // TODO: Update with return value of transaction
        // assert.equal(JSON.parse(response.toString()), undefined);
    }).timeout(10000);









    it('updateCommercialPaper', async () => {
        // TODO: Update with parameters of transaction
        const args = [];

        const response = await submitTransaction('updateCommercialPaper', args); // Returns buffer of transaction return value
        // TODO: Update with return value of transaction
        // assert.equal(JSON.parse(response.toString()), undefined);
    }).timeout(10000);


    it('getCommercialPapers', async () => {
        // TODO: Update with parameters of transaction
        const args = [];

        const response = await submitTransaction('getCommercialPapers', args); // Returns buffer of transaction return value
        // TODO: Update with return value of transaction
        // assert.equal(JSON.parse(response.toString()), undefined);
    }).timeout(10000);


    async function submitTransaction(functionName, args) {
        // Submit transaction
        const network = await gateway.getNetwork('mychannel');
        const contract = await network.getContract('papercontract', 'org.shield.commercialpaper');
        const responseBuffer = await contract.submitTransaction(functionName, ...args);
        return responseBuffer;
    }

    async function submitWithTransientTransaction(functionName, args, transient){        
        const network = await gateway.getNetwork('mychannel');
        const contract = await network.getContract('papercontract', 'org.shield.commercialpaper');
        const result = await contract.createTransaction(functionName)
        .setTransient(transient)
        .submit(...args);

        return result;
    }

    // Checks if URL is localhost
    function isLocalhostURL(url) {
        const parsedURL = URL.parse(url);
        const localhosts = [
            'localhost',
            '127.0.0.1'
        ];
        return localhosts.indexOf(parsedURL.hostname) !== -1;
    }

    // Used for determining whether to use discovery
    function hasLocalhostURLs(connectionProfile) {
        const urls = [];
        for (const nodeType of ['orderers', 'peers', 'certificateAuthorities']) {
            if (!connectionProfile[nodeType]) {
                continue;
            }
            const nodes = connectionProfile[nodeType];
            for (const nodeName in nodes) {
                if (!nodes[nodeName].url) {
                    continue;
                }
                urls.push(nodes[nodeName].url);
            }
        }
        return urls.some((url) => isLocalhostURL(url));
    }

});
