require('dotenv').config({ path: './.env-dev' });
const { ApolloServer } = require('apollo-server');
const { resolvers, typeDefs } = require("./export");
const { CountersAPI } = require("./datasources/Counters");
const { MongoClient } = require('mongodb');
const { MongoDB } = require('./datasources/MongoDB');
const { MetadataAPI } = require('./datasources/MetadataApi');
const { Elastic } = require('./datasources/Elastic');
const { ExternalAPI } = require('./datasources/ExternalAPI');
const client = new MongoClient(process.env.MONGO_STRING);




const context = () => {
    return {
        user: {
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
    }
}

let mongoDBInstance;
const dataSources = () => ({
    CountersAPI: new CountersAPI,
    MongoDB: mongoDBInstance || (mongoDBInstance = new MongoDB(client)),
    Elastic: new Elastic(),
    MetadataAPI: new MetadataAPI,
    ExternalAPI: new ExternalAPI
})

const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources,
    context,
    introspection: true,
    playground: true
});

server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});
