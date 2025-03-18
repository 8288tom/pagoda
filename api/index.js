require('dotenv').config();
const { ApolloServer, ApolloError } = require('apollo-server-lambda');
const { resolvers, typeDefs } = require("./export");
const { CountersAPI } = require("./datasources/Counters");
const { MongoClient } = require('mongodb');
const { MongoDB } = require('./datasources/MongoDB');
const { Elastic } = require('./datasources/Elastic');
const { ExternalAPI } = require('./datasources/ExternalAPI');
const { MetadataAPI } = require('./datasources/MetadataApi');

const client = new MongoClient(process.env.MONGO_STRING);



const context = async ({ event }) => {
    try {
        const user = {
            email: 'tom.shaked@idomoo.com',
            isAdmin: true,
            permissions: [
                { name: 'accounts', read: true, write: true },
                { name: 'users', read: true, write: true },
                { name: 'storyboards', read: true, write: true },
                { name: 'scenelibraries', read: true, write: true },
                { name: 'storages', read: true, write: true },
                { name: 'outputconfigs', read: true, write: true },
                { name: 'landingpages', read: true, write: true },
                { name: 'tools', read: true, write: true },
                { name:'aiads', read:true, write:true}
            ],
        }
        const userDoc = await client.db(process.env.MONGO_DB).collection('pagoda_users').findOne({ email: user })

        const userObject = {
            email: userDoc.email,
            isAdmin: userDoc.isAdmin,
            permissions: userDoc.permissions
        }
        return { user: userObject };
    } catch (e) {
        console.error("Error in attempting to get user's permissions from Mongo for context", e)
        throw new ApolloError('User is not authenticated', 401)
    }
}

const dataSources = () => ({
    CountersAPI: new CountersAPI,
    MongoDB: new MongoDB(client),
    Elastic: new Elastic,
    ExternalAPI: new ExternalAPI,
    MetadataAPI: new MetadataAPI,
})

const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources,
    debug: false,
    context,
    introspection: true,
    playground: false,
});

exports.handler = server.createHandler({
    cors: {
        origin: '*',
        // credentials: true,
    },
});
