const { responseHandler, multipleResultHandler } = require('../../utils/globalHelpers');
const { limitMapping } = require('../../utils/mongoHelper')
const sceneLibraryProjection = { projection: { accountId: 1, name: 1, thumbnail: 1, scenes: 1, "creationDate.timestamp": 1, "lastModified.timestamp": 1 } };
const { checkPermissions } = require('../../utils/authorization');
const { ApolloError } = require('apollo-server-lambda');

const resolvers = {
    Query: {
        getSceneLibraries: async (_, { filters, limit = 'LIMIT_25', offset = 0, sort = 1 }, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'scenelibraries', 'read');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            if (!filters || filters.length === 0) {
                const queryResult = await dataSources.MongoDB.filterCollectionForMultiple("scene_library", {}, sceneLibraryProjection, offset, limitMapping[limit], sort)
                const sceneLibraries = queryResult.data.map(sl => mergeAndRename(sl))
                return { data: sceneLibraries, count: queryResult.count }
            }

            const query = {}
            filters.forEach(filter => {
                switch (filter.field) {
                    case "_id":
                        query["_id"] = filter.value
                        break;
                    case "accountId":
                        query["accountId"] = Number(filter.value)
                        break;
                    case "scenes":
                        query["scenes"] = { $in: [Number(filter.value)] }
                        break;
                    default:
                        query[filter.field] = { $regex: filter.value, $options: "i" }
                        break;
                }
            })
            console.log(`${user.email} filtered Scene Libraries using filter: ${JSON.stringify(filters)}`)
            const queryResult = await dataSources.MongoDB.filterCollectionForMultiple("scene_library", query, sceneLibraryProjection, offset, limitMapping[limit], sort)
            const filteredSceneLibraries = queryResult.data.map(sl => mergeAndRename(sl))
            return { data: filteredSceneLibraries, count: queryResult.count }
        }
    },
    Mutation: {
        changeSceneLibraryOwner: async (_, { _id, newOwner }, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'scenelibraries', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            const sceneLibraryDoc = await dataSources.MongoDB.db.collection('scene_library').findOne({ _id })

            if (!sceneLibraryDoc) {
                return responseHandler(false, "Scene Library doesn't exist")
            }
            let scenesToChangeOwner;

            if (!sceneLibraryDoc.hidden_scenes) {
                scenesToChangeOwner = [...sceneLibraryDoc.scenes];
            }
            if (sceneLibraryDoc.scenes && sceneLibraryDoc.hidden_scenes) {
                scenesToChangeOwner = [...sceneLibraryDoc.scenes, ...sceneLibraryDoc.hidden_scenes]
            }

            const newSLOwner = await dataSources.MongoDB.updateDocument('scene_library', { _id }, { accountId: newOwner })
            const newWorkspaceOwner = await dataSources.MongoDB.updateDocument('workspaces', { type: 'library', createdFromLibrary: _id }, { owner: newOwner.toString() })

            if (!newWorkspaceOwner.success) {
                console.log(`${user.email} failed updating workspace owner, SL owner was not changed: ${newWorkspaceOwner.message}`)
                return responseHandler(false, `Failed updating workspace owner, SL owner was not changed: ${newWorkspaceOwner.message}`)
            }
            if (!newSLOwner.success) {
                console.log(`${user.email} failed updating scene_library document, Workspace owner changed, scene_library_${_id} and it's scenes were not: ${newSLOwner.message}`)
                return responseHandler(false, `Failed updating scene_library document, Workspace owner changed, scene_library_${_id} and it's scenes were not: ${newSLOwner.message}`)
            }

            const changeOwnerPromises = scenesToChangeOwner.map(sceneId => dataSources.MongoDB.updateDocument(
                'imsscene', { _id: sceneId.toString() }, { 'identifiers.account_id': newOwner }
            ))
            const changeImssceneOwnerResponse = await Promise.all(changeOwnerPromises)
            //Handling errors below
            const results = multipleResultHandler(changeImssceneOwnerResponse)
            //adding response from newSLOwner to the results object
            results.message += ', ' + newSLOwner.message
            console.log(`${user.email} changed Scene Library ${_id}'s owner to ${newOwner}, all of the SL's scenes and it's corresponding workspace owner.\n ${results}`)
            return newSLOwner
        }
    }
}


module.exports = resolvers;


function mergeAndRename(sl) {
    const result = {
        ...sl,
        creationDate: sl.creationDate?.timestamp?.toString(),
        lastModified: sl.lastModified?.timestamp?.toString(),
    };
    return result
}


