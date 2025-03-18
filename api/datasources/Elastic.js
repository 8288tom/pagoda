
const { DataSource } = require('apollo-datasource')
const { ApolloError } = require('apollo-server-lambda');
const { Client } = require('@elastic/elasticsearch');
const INDEX_US = process.env.ELASTIC_INDEX_US;
const INDEX_EU = process.env.ELASTIC_INDEX_EU;
const ELASTIC_NODE_EU = process.env.ELASTIC_ENDPOINT_EU;
const ELASTIC_NODE_US = process.env.ELASTIC_ENDPOINT_US;




class Elastic extends DataSource {
    constructor() {
        super();
        this.USclient = new Client({
            node: ELASTIC_NODE_US,
            auth: {
                apiKey: process.env.ELASTIC_KEY_US
            },
            ssl: {
                rejectUnauthorized: false
            },
        });;
        this.EUclient = new Client({
            node: ELASTIC_NODE_EU,
            auth: {
                apiKey: process.env.ELASTIC_KEY_EU
            },
            ssl: {
                rejectUnauthorized: false
            },
        })
    }

    async searchDataUS(body) {
        try {
            const response = await this.USclient.search({
                index: INDEX_US,
                body
            }
            )
            return response.aggregations['0'];
        } catch (error) {
            console.error("Elastic query error", error);
            throw new ApolloError("Failed to fetch data from ElasticUS")
        }
    }
    async searchDataEU(body) {
        try {
            const response = await this.EUclient.search({
                index: INDEX_EU,
                body
            }
            )
            return response.aggregations['0'];
        } catch (error) {
            console.error("Elastic query error", error);
            throw new ApolloError("Failed to fetch data from ElasticEU")
        }
    }
}



module.exports = { Elastic }


