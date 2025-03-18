const { RESTDataSource } = require('apollo-datasource-rest')
const aws4 = require('aws4');
const { responseHandler } = require('../utils/globalHelpers');
const { ApolloError } = require('apollo-server-lambda');

class CountersAPI extends RESTDataSource {
    constructor() {
        super();
        this.getCounterValue = this.getCounterValue.bind(this); // this line is important in order to maintain the instance of 'this', when passing the context as callback
    }


    signRequest(url, region, body) {
        const { host, pathname, search } = new URL(url);
        const opts = {
            host,
            path: `${pathname}${search}`,
            service: 'execute-api',
            region,
            method: body ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            body: ''
        };

        if (body) {
            const bodyString = JSON.stringify(body);
            opts.body = bodyString;
            opts.headers['Content-Length'] = Buffer.byteLength(bodyString);
        }

        aws4.sign(opts, {
            accessKeyId: process.env.PAGODA_USER_KEY,
            secretAccessKey: process.env.PAGODA_USER_SECRET_KEY
        });
        return opts;
    }

    getEndpointAndRegion(region) {
        if (process.env.NODE_ENV === 'development') {
            return { endpoint: process.env.COUNTER_ENDPOINT_OG, accountRegion: process.env.OG_REGION }
        }

        if (region.toLowerCase() === 'us') {
            return { endpoint: process.env.COUNTER_ENDPOINT_US, accountRegion: process.env.US_REGION }
        }
        if (region.toLowerCase() === 'eu') {
            return { endpoint: process.env.COUNTER_ENDPOINT_EU, accountRegion: process.env.EU_REGION }
        }

    }

    async getAccountCredit(accountId, region) {
        const { endpoint, accountRegion } = this.getEndpointAndRegion(region)
        const url = `${endpoint}/balance?account=${parseInt(accountId)}`;
        const signedRequest = this.signRequest(url, accountRegion);
        try {
            const response = await this.get(url, undefined, { headers: signedRequest.headers })
            return response
        } catch (error) {
            console.error('Error fetching counter value:', error.response ? error.response.data : error.message);
            return responseHandler(false, `Error getting account ${accountId}'s credits:`, error.response ? error.response.data : error.message)
        }
    }

    async updateAccountCredit(id, region, value, requester) {
        const accountId = parseInt(id)
        const valToSetCreditTo = parseInt(value);
        try {
            isNaN(accountId)
            isNaN(valToSetCreditTo)
        } catch (e) {
            console.error(`isNaN failed on: accountId${accountId} || credit value: ${valToSetCreditTo}`)
            return responseHandler(false, e.message)
        }
        const { endpoint, accountRegion } = this.getEndpointAndRegion(region)
        const url = `${endpoint}/balance`

        try {
            var currentAccountCredits = await this.getAccountCredit(accountId, region);
        } catch (e) {
            console.error("Cannot find account's credit in the given region")
            return responseHandler(false, "Cannot find account's credit in the given region ")
        }
        const previousCredits = currentAccountCredits.credits;
        if (previousCredits === valToSetCreditTo) {
            console.log(`Credit update was requested for: ${accountId} by ${requester} but it was not needed.`)
            return responseHandler(true, "No credit update needed")
        }
        const creditsDelta = valToSetCreditTo - previousCredits

        const body = { 'account': accountId, 'delta': creditsDelta }
        const signedRequest = this.signRequest(url, accountRegion, body);

        try {
            const response = await this.post(url, signedRequest.body, { headers: signedRequest.headers })
            console.log(`Credits Update -> ${requester} updated ${accountId}'s credits from: ${previousCredits} to ${response.credits}`)
            return responseHandler(true, `New account credits:${response.credits}`)
        } catch (error) {
            console.error(`${requester} encountered an error updating account ${accountId}'s credits`, error)
            return responseHandler(false, `Error updating account ${accountId}'s credits`, error)
        }
    }

    async getCounterValue(counterType, region) {
        const { endpoint, accountRegion } = this.getEndpointAndRegion(region)
        const url = `${endpoint}/counter?counter_id=${counterType}`;
        const signedRequest = this.signRequest(url, accountRegion);
        try {
            const response = await this.get(url, undefined, { headers: signedRequest.headers })
            return response
        } catch (error) {
            console.error(`Error fetching ${counterType} counter's value:`, error.response ? error.response.data : error.message)
            return responseHandler(false, `Error fetching ${counterType} counter's value:`, error.response ? error.response.data : error.message)
        }
    }

    async encryptAndDecryptStorage(action, secret) {
        let url = process.env.API_ENDPOINT_US
        if (action === 'encrypt') url = url + '/encrypt'
        else url = url + '/decrypt'

        const signedRequest = this.signRequest(url, "us-east-1", { message: secret })

        try {
            const response = await this.post(url, signedRequest.body, { headers: signedRequest.headers })
            return response?.message
        } catch (e) {
            console.error(`Error ${action}ing storage secret`, e?.extensions?.response?.body ? e.extensions.response.body : e)
            throw new ApolloError(`Error ${action}ing storage secret ${e}`)
        }
    }

}

module.exports = { CountersAPI };
