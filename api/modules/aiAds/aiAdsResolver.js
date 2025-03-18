const { ObjectId } = require('mongodb');
const { checkPermissions } = require('../../utils/authorization');
const adDocID = "67b5dff76bab1276479bea67"

const resolvers = {
    Query: {
        getAds: async (_, __, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'aiads', 'read');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)
            const adsDoc = await dataSources.MongoDB.db.collection('system').findOne({ _id: new ObjectId(adDocID) })
            return adsDoc
        }
    },
    Mutation: {
        addStyle: async (_, __, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'aiads', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            return {}
        },
        editStyle: async (_, __, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'aiads', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)
            return {}
        }

    }
}

function getAccountIdsToShare(db) {
    const query = { betaFeatures: { $in: ['aivideo'] } }
}

module.exports = resolvers;