const { limitMapping } = require('../../utils/mongoHelper')
const { makeId, responseHandler, buildNewPublicUrl } = require('../../utils/globalHelpers')
const { checkAndCreateFolder, copyFolderContents } = require('../../utils/s3Helper')
const { v4: uuidv4 } = require('uuid');
const landingPageProjection = { projection: { "idmAccount.accountId": 1, title: 1, previewThumbnail: 1, landingPageId: 1, lastModified: 1, createdDate: 1, lastPublishedDate: 1, publicUrl: 1, isPublished: 1, publishedPageKey: 1 } };
const { checkPermissions } = require('../../utils/authorization');
const { ApolloError } = require("apollo-server-lambda");

const resolvers = {
    Query: {
        getLandingPages: async (_, { filters, limit, offset = 0, sort = 1 }, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'landingpages', 'read');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            // Used for initial load of table in the Frontend
            if (!filters || filters.length === 0) {
                const queryResponse = await dataSources.MongoDB.filterCollectionForMultiple("canvas", {}, landingPageProjection, offset, limitMapping[limit], sort)
                const landingPages = queryResponse.data.map(lp => mergeAndRenameLP(lp));
                return { data: landingPages, count: queryResponse.count }
            }
            const query = {}
            filters.forEach(filter => {
                // id:string, accountId:Number, title:String,landingPageId:'landing_page_xxx',publishedPageKey:String,isPublished:Boolean,publicUrl:String
                switch (filter.field) {
                    case "landingPageId":
                        query['landingPageId'] = `landing_page_${filter.value}`
                        break
                    case "accountId":
                        query['accountId'] = Number(filter.value)
                        break
                    case "isPublished":
                        query['isPublished'] = filter.value === 'true' ? Boolean(true) : Boolean(false)
                        break
                    default:
                        query[filter.field] = { $regex: filter.value, $options: "i" }
                        break
                }
            })
            console.log(`${user.email} filtered Landing Pages entity using filter: ${JSON.stringify(filters)}`)
            const queryResponse = await dataSources.MongoDB.filterCollectionForMultiple("canvas", query, landingPageProjection, offset, limitMapping[limit], sort)
            const filteredLandingPages = queryResponse.data.map(lp => mergeAndRenameLP(lp));
            return { data: filteredLandingPages, count: queryResponse.count }
        }
    },
    Mutation: {
        copyLandingPage: async (_, args, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'landingpages', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)
            const { _id, accountIdToCopy, workspaceId } = args.input;
            const newPublishedPageKey = makeId(8);
            const bucket = "idomoo.cloud"


            if (workspaceId && workspaceId.length !== 8 && workspaceId.length !== 12 && workspaceId.length !== 24) {
                return responseHandler(false, 'Workspace ID must be either 8, 12 or 24 characters long')
            }
            const isWorkspaceOwnedByAccount = await dataSources.MongoDB.isWorkspaceOwnedByAccount(workspaceId, accountIdToCopy)
            if (!isWorkspaceOwnedByAccount) {
                return responseHandler(false, "The workspace you specified isn't owned by the account. Please check your details and try again")
            }

            const copyCanvasSubject = await dataSources.MongoDB.db.collection('canvas').findOne({ _id });
            const copyAssetDoc = await dataSources.MongoDB.db.collection('assets').findOne({ type: 'page', canvasId: _id }, { projection: { _id: 0 } });
            copyCanvasSubject.workspaceId = workspaceId;

            if (!copyCanvasSubject) {
                return responseHandler(false, "Canvas document not found");
            }

            const { accountId, publishedPageKey: oldPublishedPageKey, isPublished, landingPageId: lpIDString } = copyCanvasSubject
            const region = await dataSources.MongoDB.getAccountRegion(accountIdToCopy.toString())

            // aggregating all copy subjects into one object to easily pass arguments between resolver and helper
            const copySubjects = {
                canvas: copyCanvasSubject,
                asset: copyAssetDoc
            }

            //If landingPage is published, copying S3 and Mongo doc
            if (isPublished) {
                const landingPageId = lpIDString.split('_')[2];
                const copyLPSubject = await dataSources.MongoDB.db.collection('landing_page').findOne({ _id: landingPageId })
                if (!copyLPSubject) {
                    return responseHandler(false, "Landing Page document not found");
                }
                copySubjects['lp'] = copyLPSubject //adding to aggregated copySubjects object

                // Inserting new LP and Canvas docs to mongo and changing necessary fields
                const monogoCopyResult = await insertPageRelatedDocs(dataSources.MongoDB.db, dataSources.CountersAPI, region, copySubjects, accountIdToCopy, newPublishedPageKey)
                // console.log("This is copy result:", monogoCopyResult)
                if (!monogoCopyResult.success) {
                    return responseHandler(false, "Adding new Canvas to Mongo failed")
                }
                const destinationS3Path = `my.idomoo.cloud/${accountIdToCopy}/${newPublishedPageKey}/`
                const copySubjectS3Path = `my.idomoo.cloud/${accountId}/${oldPublishedPageKey}/`

                //Checking if S3 account folder exists, creates one with the accountId if it doesn't exist
                const isFolderExist = await checkAndCreateFolder(bucket, `my.idomoo.cloud/${accountIdToCopy}/`)
                if (!isFolderExist.success) {
                    return responseHandler(isFolderExist.success, isFolderExist.message)
                }
                //Creating hashed directory for the code to be copied into
                const createHashedLPDirectory = await checkAndCreateFolder(bucket, destinationS3Path)
                if (!createHashedLPDirectory.success) {
                    return responseHandler(createHashedLPDirectory.success, createHashedLPDirectory.message)
                }
                const copyS3ObjectsResult = await copyFolderContents(bucket, copySubjectS3Path, destinationS3Path)
                if (!copyS3ObjectsResult.success) {
                    return responseHandler(copyS3ObjectsResult.success, copyS3ObjectsResult.message)
                }
                console.log(`${user.email} copied canvas doc ${_id} to account:${accountIdToCopy}. New LP ID:${monogoCopyResult.data.insertedLPId}`)
                return responseHandler(true, `New LP ID: ${monogoCopyResult.data.insertedLPId}`)
            }
            else { // If canvas doc is not published
                const monogoCopyResult = await insertPageRelatedDocs(dataSources.MongoDB.db, dataSources.CountersAPI, region, copySubjects, accountIdToCopy)
                if (!monogoCopyResult.success) {
                    return responseHandler(false, "Adding new Canvas to Mongo failed")
                }
                console.log(`${user.email} copied canvas doc ${_id} to account:${accountIdToCopy}.`)
                return responseHandler(true, `New Canvas ID: ${monogoCopyResult.data}`)
            }
        }
    }

}


async function insertPageRelatedDocs(db, countersAPI, region, copySubjects, accountIdToCopyTo, newPublishedPageKey) {
    const newCanvasId = `${uuidv4()}`
    let newCanvasDoc = createNewCanvasDocObject(copySubjects.canvas, newCanvasId, accountIdToCopyTo);
    if (newPublishedPageKey && copySubjects.lp) {
        let newLPId = await countersAPI.getCounterValue('landing_page', region)
        if (typeof newLPId !== 'number') { // error validation for getCounterValue
            return { success: false }
        }
        newLPId.toString();
        const newPublicUrl = buildNewPublicUrl(copySubjects.canvas.publicUrl, newPublishedPageKey);

        newCanvasDoc = { ...newCanvasDoc, landingPageId: `landing_page_${newLPId}`, publishedPageKey: newPublishedPageKey, publicUrl: newPublicUrl };

        const newLPDoc = createNewLPDocObject(copySubjects.lp, newLPId, accountIdToCopyTo, newPublishedPageKey);
        try {
            const insertCanvasPromise = db.collection('canvas').insertOne(newCanvasDoc)
            const insertLPPromise = db.collection('landing_page').insertOne(newLPDoc)
            const insertResults = await Promise.all([insertCanvasPromise, insertLPPromise])

            const insertedCanvasId = insertResults[0].insertedId
            const insertedLPId = insertResults[1].insertedId
            console.log("Added new LP document to Mongo with ID:", insertedLPId)
            console.log("Added new Canvas document to Mongo with ID:", insertedCanvasId)
            if (insertedLPId && insertedCanvasId)
                return { success: true, data: { insertedCanvasId, insertedLPId } }
        } catch (e) {
            console.error(e)
            return { success: false, message: `Insertion to Mongo failed, ${e.message}` }
        }
    }
    else {
        try {
            const insertResult = await db.collection('canvas').insertOne(newCanvasDoc);
            if (insertResult.insertedId) {
                return { success: true, data: insertResult.insertedId }
            }
        } catch (e) {
            console.error(e)
            return { success: false, message: `Insertion to Mongo failed, ${e.message}` }
        }
    }
}

function createNewCanvasDocObject(copyCanvasSubject, newCanvasId, accountIdToCopyTo) {
    return {
        ...copyCanvasSubject,
        _id: newCanvasId,
        id: newCanvasId,
        accountId: accountIdToCopyTo,
        idmAccount: { accountId: accountIdToCopyTo, accountName: copyCanvasSubject.idmAccount.accountName }
    };
}


function createNewLPDocObject(copyLPSubject, newLPId, accountIdToCopyTo, newPublishedPageKey) {
    return {
        ...copyLPSubject,
        _id: newLPId.toString(),
        landingPageId: newLPId.toString(),
        urlPrefix: `https://my.idomoo.cloud/${accountIdToCopyTo}/${newPublishedPageKey}/index.html?url=&lt;VIDEO_URL&gt;`,
        accountId: accountIdToCopyTo
    };
}

function mergeAndRenameLP(lp) {
    const result = {
        _id: lp._id,
        accountId: lp?.idmAccount?.accountId,
        title: lp.title,
        thumbnail: lp.previewThumbnail,
        landingPageId: lp.landingPageId?.split('_')[2],
        publicUrl: lp.publicUrl,
        isPublished: lp.isPublished,
        lastModified: lp.lastModified?.timestamp?.toString(),
        createdDate: lp.createdDate,
        lastPublishedDate: lp.lastPublishedDate?.toString(),
        publishedPageKey: lp.publishedPageKey
    };
    return result;
}




module.exports = resolvers;