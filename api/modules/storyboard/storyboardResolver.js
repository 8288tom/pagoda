const { limitMapping } = require('../../utils/mongoHelper');
const { overwriteStoryboardDocKeyAndValues, responseHandler } = require('../../utils/globalHelpers')
const { checkPermissions } = require('../../utils/authorization');
const { ApolloError } = require('apollo-server-lambda');

const DOC_TYPE_TO_COLLECTION_MAP = {
    storyboard: 'storyboard',
    storyboard_dialogs: 'storyboard_dialogs',
    interactiveEvent: 'storyboard_interactive_events',
    storyboard_interactive_rules: 'storyboard_interactive_rules',
    storyboard_live_data: 'storyboard_live_data',
    storyboard_moo: 'storyboard_moo',
    storyboard_transcript: 'storyboard_transcript'
};
const storyboardsProjection = { projection: { accountId: 1, 'content.name': 1, 'lastModified.timestamp': 1, 'creationDate.timestamp': 1, videoExpirationTimeOnStorage: 1 } };
const storyboardCollections = ['storyboard', 'storyboard_dialogs', 'storyboard_interactive_events', 'storyboard_interactive_rules', 'storyboard_live_data', 'storyboard_moo', 'storyboard_transcript']

const resolvers = {
    Query: {
        getStoryboards: async (_, { filters, limit = 'LIMIT_25', offset = 0, sort = 1 }, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'storyboards', 'read');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            if (!filters || filters.length === 0) {
                const queryResult = await dataSources.MongoDB.filterCollectionForMultiple("storyboard", {}, storyboardsProjection, offset, limitMapping[limit], sort)
                const storyboards = queryResult.data.map(storyboard => mergeAndRenameSB(storyboard))
                return { data: storyboards, count: queryResult.count }
            }
            const query = {}
            filters.forEach(filter => {
                switch (filter.field) {
                    case "_id":
                        query["_id"] = filter.value;
                        break;
                    case "hostingPeriod":
                        query["videoExpirationTimeOnStorage"] = Number(filter.value);
                        break;
                    case "name":
                        query["content.name"] = { $regex: filter.value, $options: "i" };
                        break;
                    case "lock":
                        query["lock"] = filter.value === 'true' ? Boolean(true) : Boolean(false);
                        break;
                    case "accountId":
                        query.$or = [
                            { accountId: Number(filter.value) },
                            { accountId: filter.value }
                        ];
                        break;
                    default:
                        query[filter.field] = { $regex: filter.value, $options: "i" };
                        break;
                }
            });
            console.log(`${user.email} filtered Storyboards using filter: ${JSON.stringify(filters)}`)
            const queryResult = await dataSources.MongoDB.filterCollectionForMultiple("storyboard", query, storyboardsProjection, offset, limitMapping[limit], sort)
            const filteredStoryboards = queryResult.data.map(storyboard => mergeAndRenameSB(storyboard))
            return { data: filteredStoryboards, count: queryResult.count }
        }
    },
    Mutation: {
        copyStoryboard: async (_, args, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'storyboards', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            const { _id: storyboardId, accountIdToCopy, workspaceId } = args.input;
            if (workspaceId && workspaceId.length !== 8 && workspaceId.length !== 12 && workspaceId.length !== 24) {
                return responseHandler(false, 'Workspace ID must be either 8, 12 or 24 characters long')
            }
            const isWorkspaceOwnedByAccount = await dataSources.MongoDB.isWorkspaceOwnedByAccount(workspaceId, accountIdToCopy)
            if (!isWorkspaceOwnedByAccount) {
                return responseHandler(false, "The workspace you specified isn't owned by the account. Please check your details and try again")
            }

            dataSources.MongoDB.shareSceneLibrariesWithAccount(storyboardId, accountIdToCopy)

            const accountRegion = await dataSources.MongoDB.getAccountRegion(accountIdToCopy.toString())
            const newStoryboardId = await dataSources.CountersAPI.getCounterValue('storyboard', accountRegion)
            if (typeof newStoryboardId !== 'number' && (newStoryboardId && !newStoryboardId.success)) {
                return responseHandler(newStoryboardId.success, newStoryboardId.message)
            }
            //ovewriting fields based on the relevant document (else captures the default fields that need to be modified, the if captures the documents with special conditions)
            let overwriteFields = {};
            overwriteStoryboardDocKeyAndValues(storyboardCollections, overwriteFields, newStoryboardId, accountIdToCopy)

            //adding the newStoryboardId as _id 
            Object.keys(overwriteFields).forEach(key => {
                // adding workspaceId in the root of the document only to the main storyboard doc
                if (overwriteFields[key].document_key === `storyboard_${overwriteFields[key].storyboardId}`) {
                    overwriteFields[key].workspaceId = workspaceId;
                }
                overwriteFields[key]._id = newStoryboardId.toString();
            });
            const response = await copyStoryboardDocs(dataSources.MongoDB.db, storyboardCollections, storyboardId, overwriteFields)
            if (response.length < 1) {
                return responseHandler(false, "Failed copying Storyboard - check logs")
            }
            console.log(`${user.email} copied storyboard_${storyboardId} to ${accountIdToCopy}\nWorkspace: ${workspaceId}, new storyboard_${response[0].insertedId} created`)

            return responseHandler(true, `New Storyboard ID:${response[0].insertedId}.`)
        },
        updateStoryboard: async (_, args, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'storyboards', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            const { storyboardIdToUpdate, storyboardIdToUpdateFrom, perserveName = true } = args.input;
            const response = await updateStoryboardDocs(dataSources.MongoDB, storyboardCollections, storyboardIdToUpdate, storyboardIdToUpdateFrom, perserveName)
            if (response.length < 1) {
                return responseHandler(false, "Failed updating Storyboard - check logs", 400)
            }
            console.log(`${user.email} updated Storyboard ${storyboardIdToUpdate} with Storyboard ${storyboardIdToUpdateFrom}'s content`)
            return responseHandler(true, `Storyboard ${storyboardIdToUpdate} updated with Storyboard ${storyboardIdToUpdateFrom}'s content`)
        }
    }

}


function mergeAndRenameSB(storyboard) {
    const result = {
        _id: storyboard._id,
        thumbnail: storyboard.thumbnail,
        lock: storyboard.lock,
        lastModified: storyboard?.lastModified?.timestamp.toString() || null, //SB docs store int64 in mongo which gql can't handle
        creationDate: storyboard?.creationDate?.timestamp.toString() || null,
        name: storyboard.content.name || '',
        hostingPeriod: storyboard.videoExpirationTimeOnStorage || null,
        accountId: typeof (storyboard.accountId) === 'number' ? storyboard.accountId : Number(storyboard.accountId)
    };
    return result;
}



/**
 * This function gets all relevant SB documents, modifies fields that need to be modified (see here: https://docs.google.com/spreadsheets/d/158VdXxoLHQuNvGjwUqeclBiEda5xYA6QTt9QPgK3oEI/edit?gid=1141975457#gid=1141975457)
 * Then inserts modified docs (with the overwritten fields) to DB under the accountId given in the higher function
 */
async function copyStoryboardDocs(db, collections, originalId, overwriteFields) {
    try {
        //Getting storyboard documents using _id and adding to promises array
        const getStoryboardPromises = collections.map(collection => db.collection(collection).findOne({ _id: originalId }))
        const results = await Promise.all(getStoryboardPromises)
        //Building objects using the docType to easily access documents per type and filtering all the null values
        const storyboardDocs = results.map((storyboardDoc) => (storyboardDoc ? { [storyboardDoc.docType]: storyboardDoc } : null)).filter(Boolean)
        const modifiedStoryboardDocs = [];

        //merging documents and overwriting the fields that need to be overwritten
        storyboardDocs.forEach((doc) => {
            Object.keys(doc).forEach((key) => {
                const document = doc[key];
                if (document.docType === 'interactiveEvent' && overwriteFields['storyboard_interactive_events']) {
                    const modifiedDoc = { ...document, ...overwriteFields['storyboard_interactive_events'] };
                    modifiedStoryboardDocs.push(modifiedDoc);
                }
                else if (document && overwriteFields[document.docType]) {
                    const modifiedDoc = { ...document, ...overwriteFields[document.docType] };
                    modifiedStoryboardDocs.push(modifiedDoc)
                }
            });
        });
        // building promise array to insert new modified SB docs to DB by using the docType to see which doc needs to be inserted to which collection
        const insertPromises = modifiedStoryboardDocs.map((doc) => {
            const collectionName = DOC_TYPE_TO_COLLECTION_MAP[doc.docType];
            if (collectionName) {
                return db.collection(collectionName).insertOne(doc)
            }
            return Promise.resolve() // Returns resolved promise if no collection matched (don't need to copy doc)
        })
        const insertionResults = await Promise.all(insertPromises)
        console.log(`Copy all Storyboard documents finished.\n#Docs inserted to database:${insertionResults.map(result => result.insertedId).length}\nNew Storyboard ID:${overwriteFields.storyboard._id}`)
        return insertionResults
    } catch (e) {
        console.error("Error copying storyboard", e)
        return responseHandler(false, e.message, 400)
    }
}

/**
 * This functions updates a given Storyboard with the content of another Storyboard, it also shared all the SLs of the storyboard
 * that is used to update the given Storyboard (originalId) with the account of the Storyboard that's being updated.
 */
async function updateStoryboardDocs(mongoDBDatasource, collections, originalId, updateFromId, perserveName) {
    try {
        const getStoryboardToUpdateFromPromises = collections.map(collection => mongoDBDatasource.db.collection(collection).findOne({ _id: updateFromId }))
        const getStoryboardToUpdate = collections.map(collection => mongoDBDatasource.db.collection(collection).findOne({ _id: originalId }))
        const storyboardToUpdateFromResults = await Promise.all(getStoryboardToUpdateFromPromises)
        const storyboardToUpdateResults = await Promise.all(getStoryboardToUpdate)


        //Building objects using the docType to easily access documents per type and filtering out all the null values
        const updateFromSBDocs = storyboardToUpdateFromResults.map((storyboardDoc) => (storyboardDoc ? { [storyboardDoc.docType]: storyboardDoc } : null)).filter(Boolean)
        const toUpdateSBDocs = storyboardToUpdateResults.map((storyboardDoc) => (storyboardDoc ? { [storyboardDoc.docType]: storyboardDoc } : null)).filter(Boolean)

        //accountId of the storyboard that's going to be updated
        const accountId = toUpdateSBDocs[0]?.storyboard.accountId
        if (!accountId) {
            return responseHandler(false, "Could not find account id that is the owner of the Storyboard", 400)
        }
        await mongoDBDatasource.shareSceneLibrariesWithAccount(updateFromId, accountId)
        const currentSBName = toUpdateSBDocs[0]?.storyboard.content.name

        // overwriting fields that need to remain the same (with their original values)
        let overwriteFields = {};
        overwriteStoryboardDocKeyAndValues(collections, overwriteFields, originalId, accountId)
        // if perseverName truthy, we keep the originalId's Storyboard Name
        if (perserveName) {
            overwriteFields['storyboard'] = {
                ...overwriteFields['storyboard'],
                content: {
                    name: currentSBName
                }
            }
        }

        let updatedStoryboardDocs = []
        //merging documents and using overwriteFields to overwrite the fields that need to be overwritten
        updateFromSBDocs.forEach((doc) => {
            Object.keys(doc).forEach((key) => {
                const document = doc[key];
                if (document.docType === 'interactiveEvent' && overwriteFields['storyboard_interactive_events']) {
                    const modifiedDoc = { ...document, ...overwriteFields['storyboard_interactive_events'] };
                    updatedStoryboardDocs.push(modifiedDoc);
                }
                else if ((perserveName) && (document.docType === 'storyboard' && overwriteFields['storyboard'])) { //checks if the doc is storyboard, if it is, changing the name
                    const modifiedDoc = {
                        ...document, ...overwriteFields[document.docType], content: {
                            ...document.content,
                            ...overwriteFields[document.docType].content
                        }
                    }
                    updatedStoryboardDocs.push(modifiedDoc)
                }
                else {
                    const modifiedDoc = { ...document, ...overwriteFields[document.docType] };
                    updatedStoryboardDocs.push(modifiedDoc)
                }
            });
        });
        const updatePromises = [];

        //Adding promises to update the Storyboard documents to the updatePromises array
        for (let i = 0; i < updatedStoryboardDocs.length; i++) {
            const collection = DOC_TYPE_TO_COLLECTION_MAP[updatedStoryboardDocs[i].docType]
            const { _id, ...updatePayload } = updatedStoryboardDocs[i];

            console.log(`Updating ${collection}_${originalId}`)
            updatePromises.push(mongoDBDatasource.db.collection(collection).updateOne(
                { _id: originalId },
                { $set: updatePayload },
                { upsert: true }
            ))
        }
        // running the updates concurrently (each update is updating a different collection and document - can be run concurrently)
        const updateResult = await Promise.all(updatePromises)
        console.log(`Update all Storyboard documents finished.\n#Docs modified:${updateResult.map(result => result.modifiedCount)}`)
        return updateResult
    }
    catch (e) {
        console.error("Error updating storyboard", e)
        return responseHandler(false, e.message, 400)
    }
}



module.exports = resolvers;