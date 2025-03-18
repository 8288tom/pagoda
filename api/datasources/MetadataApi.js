const { RESTDataSource } = require('apollo-datasource-rest');
const fetch = require('node-fetch');
const { ApolloError } = require('apollo-server-lambda');
const EUEndpoint = 'https://eur-api.idomoo.com/api/v3';
const USEndpoint = 'https://usa-api.idomoo.com/api/v3'


class MetadataAPI extends RESTDataSource {
    constructor() {
        super();
        this.token = null;
        this.baseURL = null;
        this.accountId = null;
    }
    //runs before every request sent in this class
    async willSendRequest(request) {
        const accountId = this.accountId;
        if (this.token) return;

        if (!accountId) {
            throw new ApolloError("Account ID is required to generate token");
        }

        if (!this.baseURL) {
            const region = await this.context.dataSources.MongoDB.getAccountRegion(accountId.toString());
            this.baseURL = region === 'us' ? USEndpoint : EUEndpoint;
        }
        if (!this.token) {
            const key = await this.context.dataSources.MongoDB.getApiKey(accountId);
            this.token = await this.fetchAuthToken(accountId, key);
        }
        request.headers.set('Authorization', `Bearer ${this.token}`);
    }

    async fetchAuthToken(accountId, key) {
        const authUrl = `${this.baseURL}/oauth/token`;
        const response = await fetch(
            authUrl, {
            method: 'POST',
            headers: {
                Authorization: 'Basic ' + Buffer.from(`${accountId}:${key}`).toString('base64'),
            },
        }
        )
        if (!response.ok) throw new ApolloError(`Failed to fetch auth token ${response.statusText}`)
        const data = await response.json();
        if (data && data.access_token) {
            return data.access_token
        }
    }


    async createOutputConfig(accountId, body) {
        this.accountId = accountId;
        try {
            return this.post('/output_configs', body)
        } catch (e) {
            console.error("Error creating output config in datasource:", e)
            return new ApolloError(e)
        } //datasource handles errors automatically
    }

    // async didEncounterError(error) {
    //     console.error(`Error encountered during MetadataAPI operation: ${JSON.stringify(error.extensions.response.body.errors)}`)
    // }
}

module.exports = { MetadataAPI }