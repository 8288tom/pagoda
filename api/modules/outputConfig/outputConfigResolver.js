const { responseHandler } = require('../../utils/globalHelpers');
const { limitMapping } = require('../../utils/mongoHelper')
const { checkPermissions } = require('../../utils/authorization');
const { ApolloError } = require('apollo-server-lambda');

const outputConfigProjection = { projection: { account_id: 1, name: 1, output: 1, "creationDate.timestamp": 1, "lastModified.timestamp": 1 } };


const resolvers = {
    Query: {
        getOutputConfigs: async (_, { filters, limit = 'LIMIT_25', offset = 0, sort = 1 }, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'outputconfigs', 'read');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)
            // Used for initial load of table in the Frontend
            if (!filters || filters.length === 0) {
                const queryResult = await dataSources.MongoDB.filterCollectionForMultiple("output_config", {}, outputConfigProjection, offset, limitMapping[limit], sort)
                const outputConfigs = queryResult.data.map(config => mergeAndRename(config))
                return { data: outputConfigs, count: queryResult.count }
            }
            const query = {}
            filters.forEach(filter => {
                switch (filter.field) {
                    case "_id":
                        query["_id"] = filter.value;
                        break;
                    case "accountId":
                        query["account_id"] = Number(filter.value)
                        break;
                    default:
                        query[filter.field] = { $regex: filter.value, $options: "i" }
                        break;
                }
            })
            console.log(`${user.email} filtered Output Configs using filter: ${JSON.stringify(filters)}`)
            const queryResult = await dataSources.MongoDB.filterCollectionForMultiple("output_config", query, outputConfigProjection, offset, limitMapping[limit], sort)
            const filteredOutputConfigs = queryResult.data.map(config => mergeAndRename(config))
            return { data: filteredOutputConfigs, count: queryResult.count }
        }
    },
    Mutation: {
        copyOutputConfig: async (_, { _id, newOwner, newName }, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'outputconfigs', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            const copySubject = await dataSources.MongoDB.db.collection('output_config').findOne({ _id });
            if (!copySubject) {
                return responseHandler(false, `Output_config_${_id} was not found.`)
            }
            const region = await dataSources.MongoDB.getAccountRegion(newOwner.toString())
            const newId = await dataSources.CountersAPI.getCounterValue('output_config', region)
            if (typeof newId !== 'number' && newId && !newId.success) {
                return responseHandler(newId.success, newId.message)
            }

            const newOutputConfigDoc = { ...copySubject, _id: String(newId), name: newName, output_config_id: newId, document_key: `output_config_${newId}`, account_id: newOwner }
            const result = await dataSources.MongoDB.insertDocument('output_config', newOutputConfigDoc)
            if (!result.success) {
                return responseHandler(false, result.message)
            }
            console.log(`${user.email} copied output_config ${_id} to account ${newOwner}`)
            return responseHandler(true, `New output_config ID:${newId}`)
        },
        createOutputConfig: async (_, { accountId, input }, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'outputconfigs', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)
            throw new ApolloError('OUTPUT CONFIG CREATION DISABLED FOR DEMO', 403)
            try {
                const response = await dataSources.MetadataAPI.createOutputConfig(accountId, input)
                console.log(`${user.email} created a new Output Config ID:${response?.output_config_id}`)
                return responseHandler(true, `Successfully created Output Config ${response?.output_config_id}`)
            } catch (e) {
                //not throwing an error here because I want to send the error response to the frontend for the user to see
                let error;
                if (e?.extensions?.response?.body?.errors?.[0]?.error_description) {
                    error = e.extensions.response.body.errors[0].error_description;
                } else {
                    error = e;
                }
                console.error(`${user.email} encountered an error while creating Output Config for account ${accountId}: ${JSON.stringify(error)}`)
                return responseHandler(false, error)
            }
        }
    }
}






module.exports = resolvers;


function mergeAndRename(config) {
    const result = {
        ...config,
        accountId: config.account_id,
        creationDate: config?.creationDate?.timestamp,
        lastModified: config?.lastModified?.timestamp,
        // below hasOwnProperty returns bool whether the object has this property (exist)
        output: {
            video: config?.output?.hasOwnProperty('video'),
            gif: config?.output?.hasOwnProperty('gif'),
            jpg: config?.output?.hasOwnProperty('jpg'),
            audio: config?.output?.hasOwnProperty('audio'),
            accessibility: config?.output?.hasOwnProperty('accessibility'),
        }
    };
    return result
}



