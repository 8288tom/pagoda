const { getCurrentDateFormat, responseHandler, getValues } = require('../../utils/globalHelpers');
const { limitMapping } = require('../../utils/mongoHelper')
const storageProjection = { projection: { accountId: 1, name: 1, type: 1, webAccessUrl: 1, credentials: 1, decryption: 1, object_acl: 1, "creationDate.timestamp": 1 } };
const { ApolloError } = require('apollo-server-lambda');
const { checkPermissions } = require('../../utils/authorization');


const resolvers = {
    Query: {
        getStorages: async (_, { filters, limit = 'LIMIT_25', offset = 0, sort = 1 }, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'storages', 'read');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            if (!filters || filters.length === 0) {
                const queryResult = await dataSources.MongoDB.filterCollectionForMultiple("storage", {}, storageProjection, offset, limitMapping[limit], sort)
                const finalData = queryResult.data.map((storage) => renameStorage(storage))
                return { data: finalData, count: queryResult.count }
            }
            const query = {}
            filters.forEach(filter => {
                switch (filter.field) {
                    case "accountId":
                        query["accountId"] = Number(filter.value)
                        break;
                    case "_id":
                        query["_id"] = filter.value
                        break;
                    case "type":
                        query["type"] = filter.value
                        break;
                    default:
                        query[filter.field] = { $regex: filter.value, $options: "i" }
                        break;
                }
            })
            console.log(`${user.email} filtered Storages using filter: ${JSON.stringify(filters)}`)
            const queryResult = await dataSources.MongoDB.filterCollectionForMultiple("storage", query, storageProjection, offset, limitMapping[limit], sort)
            const finalData = queryResult.data.map((storage) => renameStorage(storage))
            return { data: finalData, count: queryResult.count }
        },
        getStorage: async (_, { id }, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'storages', 'read');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            try {
                const storage = await dataSources.MongoDB.db.collection('storage').findOne({ _id: id }, storageProjection)
                if (storage.object_acl) {
                    storage.private = true;
                }
                const storageType = storage.type.toLowerCase();

                // code was commented out to disable decryption for demo purposes

                // based on the storage type I'm getting the password/secretKey
                // decrypting the secret and setting the value in the correct key depending on the storageType
                // if (storage?.credentials?.encrypted) {
                //     const secret = storageType === 'sftp' ? storage.credentials.password : storage.credentials.secretKey;
                //     const decryptedSecret = await dataSources.CountersAPI.encryptAndDecryptStorage('decrypt', secret)
                //     storageType === 'sftp' ? storage.credentials.password = decryptedSecret : storage.credentials.secretKey = decryptedSecret
                // }

                console.log(`${user.email} opened storage_${id}`)
                return storage
            } catch (e) {
                console.error(`Error getting storageId ${id}: ${e}`)
                throw new ApolloError(`Error getting storageId ${id}: ${e}`)
            }
        }
    },
    Mutation: {
        createStorage: async (_, args, { dataSources, user: pagodaUser }) => {
            const isAuthorized = checkPermissions(pagodaUser.email, pagodaUser.permissions, 'storages', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            const { accountId, type, name, private, serverUrl, serverPort, uploadDirectory, user, password, secretKey, path, decryption, webAccessUrl } = args.input;
            const region = await dataSources.MongoDB.getAccountRegion(accountId.toString())
            if (!region && !region.success) {
                return region
            }
            const newStorageId = await dataSources.CountersAPI.getCounterValue('storage', region)
            if (typeof newStorageId !== 'number') {
                return responseHandler(newStorageId.success, newStorageId.message)
            }
            let secretToEncrypt;
            // only encrypting type sftp or type s3cmd.
            if (type === 'sftp') {
                if (password) {
                    secretToEncrypt = password;
                }
                else {
                    secretToEncrypt = secretKey
                }
            } else if (type === 's3cmd') {
                secretToEncrypt = secretKey
            } else secretToEncrypt = null;
            
            //This line was added to disable encryption for demo purposes.
            secretToEncrypt=false;

            const credentials = {
                serverUrl,
                secretKey,
                user,
                password,
                path,
                uploadDirectory,
                serverPort
            };

            try {
                // if secretToEncrypt is not falsy we are encrypting, otherwise we are leaving as is
                let passwordOrSecretKey;
                if (secretToEncrypt) {
                    passwordOrSecretKey = await dataSources.CountersAPI.encryptAndDecryptStorage("encrypt", secretToEncrypt)
                }

                if (type === 'sftp') credentials.password = passwordOrSecretKey
                if (type === 's3cmd') credentials.secretKey = passwordOrSecretKey



                let newStorageObject = storageTemplate(null, accountId, type, name, credentials, decryption, webAccessUrl)
                //merging template with updated _ids
                newStorageObject = {
                    ...newStorageObject,
                    _id: String(newStorageId),
                    storageId: Number(newStorageId),
                    creationDate: getCurrentDateFormat(),
                    document_key: `storage_${newStorageId}`,
                }
                if (typeof private !== 'undefined' && type === 's3cmd') {
                    private ? newStorageObject.object_acl = "private" : newStorageObject.object_acl = "public-read"
                }
                console.log(`${pagodaUser.email} created storage_${newStorageId}`)

                const result = await dataSources.MongoDB.insertDocument('storage', newStorageObject) //handling errors within insertDocument
                return result
            } catch (e) {
                console.error(`${pagodaUser.email} encountered an error creating storage`, e)
                return responseHandler(false, e.message)
            }
        },
        updateStorage: async (_, { _id, input }, { dataSources, user: pagodaUser }) => {
            const isAuthorized = checkPermissions(pagodaUser.email, pagodaUser.permissions, 'storages', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            try {
                const { accountId, type, name, private, serverUrl, serverPort, uploadDirectory, user, password, secretKey, path, decryption, webAccessUrl } = input;
                const originalStorageDoc = await dataSources.MongoDB.db.collection('storage').findOne({ _id })
                if (!originalStorageDoc) {
                    return responseHandler(false, "Could not find storage: ", _id)
                }

                const credentials = {
                    ...originalStorageDoc.credentials,
                    serverUrl,
                    secretKey,
                    user,
                    password,
                    path,
                    uploadDirectory,
                    serverPort
                }
                //This code was commented out to disable encryption for demo purposes.
                // if (originalStorageDoc.credentials.encrypted) {
                //     const secret = type === 'sftp' ? credentials.password : credentials.secretKey;
                //     const encryptedSecret = await dataSources.CountersAPI.encryptAndDecryptStorage('encrypt', secret)
                //     type === 'sftp' ? credentials.password = encryptedSecret : credentials.secretKey = encryptedSecret
                // }


                let newStorageObject = storageTemplate(originalStorageDoc, accountId, type, name, credentials, decryption, webAccessUrl)
                //adds object_acl if type s3cmd, deletes if the type was changed from s3cmd
                if (typeof private !== 'undefined' && type === 's3cmd') {
                    private ? newStorageObject.object_acl = "private" : newStorageObject.object_acl = "public-read"
                } else delete newStorageObject.object_acl

                const fieldsToUpdate = getValues(newStorageObject)
                const updateResult = await dataSources.MongoDB.updateDocument('storage', { _id }, fieldsToUpdate)
                console.log(`${pagodaUser.email} edited storage_${_id}\n edit result: ${JSON.stringify(updateResult)}`)
                return updateResult
            } catch (e) {
                console.error(`${pagodaUser.email} encountered an error updating storage ${_id}`, e)
                throw new ApolloError(`Error during updateStorage`, e)
            }
        }

    }
}

function storageTemplate(originalDoc, accountId, type, name, credentials, decryption, webAccessUrl) {
    const baseObject = originalDoc ? { ...originalDoc } : {};
    const modifiedStorageDoc = {
        ...baseObject,
        docType: originalDoc ? baseObject.docType : "storage",
        accountId,
        type: type.toLowerCase(),
        name,
        credentials: {
            ...credentials,
            serverUrl: credentials.serverUrl || null,
            serverPort: credentials.serverPort || null,
            uploadDirectory: credentials.uploadDirectory || null,
            user: credentials.user || null,
            password: credentials.password || null,
            secretKey: credentials.secretKey || null,
            path: credentials.path || null,
        },
        decryption: decryption || { type: null, key: null },
        webAccessUrl: webAccessUrl || null
    }
    if ((type.toLowerCase() === 'sftp' || type.toLowerCase() === 's3cmd') && (credentials.secretKey || credentials.password)) {
        modifiedStorageDoc.credentials.encrypted = true;
    }
    return modifiedStorageDoc
}

function renameStorage(storage) {
    const result = {
        ...storage,
        creationDate: storage?.creationDate?.timestamp || 0
    };

    return result;
}




module.exports = resolvers;