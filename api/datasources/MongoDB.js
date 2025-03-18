const { DataSource } = require('apollo-datasource')
const { ObjectId } = require('mongodb');
const { extractPalUrls, responseHandler } = require('../utils/globalHelpers')
const { ApolloError } = require('apollo-server-lambda');

class MongoDB extends DataSource {
    constructor(client) {
        super();
        this.client = client;
        this.db = this.client.db(process.env.MONGO_DB);
    }
    /**
     * Filters a MongoDB collection based on the provided query and options.
     * @param {String} collection 'accounts' 
     * @param {Object} query {_id:id} 
     * @param {Object} Projection { projection: { accountId: 1, name: 1, thumbnail: 1...}}
     * @param {Number} skip 25
     * @param {Number} limit 25/50/75/100
     * @param {Number} sort 1 || -1
     * @returns {Object} {data: [data...], count:Int} 
     */
    async filterCollectionForMultiple(collection, query, projection, skip, limit, sort) {
        try {
            // DEBUG console.log(`collection: ${collection} ||  query:${JSON.stringify(query)} || Projection:${JSON.stringify(projection)} || skip:${skip} || limit:${limit} || sort: ${sort}`)
            let cursor = this.db.collection(collection).find(query, projection)
            if (sort) {
                cursor = cursor.sort({ "creationDate.timestamp": sort })
            }
            //Using typeof in case I need to send 0 in the arguments.
            if (typeof skip !== 'undefined') {
                cursor = cursor.skip(skip);
            }
            if (typeof limit !== 'undefined' && limit !== null) {
                cursor = cursor.limit(limit);
            } else cursor = cursor.limit(100);

            // console.time('toArray')
            const queryResultArray = await cursor.toArray();
            // console.timeEnd('toArray')
            const numOfDocs = await this.db.collection(collection).countDocuments(query);
            return { data: queryResultArray, count: numOfDocs };
        } catch (e) {
            console.error(`Error during filterCollectionForMultiple: ${e}`);
            throw new ApolloError(`Error during filterCollectionForMultiple ${e}`)
        }
    }

    /**
     * Updates a MongoDB Document using $SET operator (if doesn't exist - add, if exists - add to existing).
     * @param {String} collection 
     * @param {Object} query {_id:id} 
     * @param {Object} updateFields {field1:value1, field2:value2...}
     * @returns {Object} {success: Boolean, message: String}
     */
    async updateDocument(collection, query, updateFields) {
        try {
            const updateResult = await this.db.collection(collection).updateOne(query, { $set: updateFields });

            if (updateResult.matchedCount === 0) {
                console.log(`Document not found for ${collection}_${query._id ? query._id : JSON.stringify(query)}`);
                return responseHandler(false, `Document not found for ${collection}_${query._id ? query._id : JSON.stringify(query)}`, 400)
            }
            if (updateResult.modifiedCount > 0) {
                console.log(`${collection}_${query._id ? query._id : JSON.stringify(query)} updated successfully: ${JSON.stringify(updateFields)}`);
                return responseHandler(true, `Update successful for ${collection}_${query._id ? query._id : JSON.stringify(query)}`)
            }
            console.log(`No changes written to ${collection}_${query._id ? query._id : JSON.stringify(query)}`);
            return responseHandler(true, `No changes written to ${collection}_${query._id ? query._id : JSON.stringify(query)}`)
        } catch (e) {
            console.error(`Error during updateDocument: ${e}`);
            throw new ApolloError(`Error in updateDocument ${e.message}`)
        }
    }
    /**
     *  Updates a MongoDB Document's fields by adding to an existing array - field must be an array.
     *  If collection is user_roles we're using $push instead of $addToSet to preserve owner position on doc.
     * @param {String} collection 'user_roles' || 'workspaces' ... 
     * @param {Object} query {_id:id} 
     * @param {String} fieldToAppendTo field's value must be an Array
     * @param {Array} elements ['1105',2,'test'....]
     * @returns {Object} {success: Boolean, message: String}
     */
    async addFieldsToDoc(collection, query, fieldToAppendTo, elements) {
        const detailedLog = fieldToAppendTo === 'sharedWithAccounts' ?
            `where type is ${query.type} and createdFromLibrary is: ${query.createdFromLibrary}`
            : `with ID: ${query._id}`;
        try {
            let updateResult
            updateResult = await this.db.collection(collection).updateOne(
                query,
                { $addToSet: { [fieldToAppendTo]: { $each: elements } } }
            );
            // console.log(`Attempting to add to array ${fieldToAppendTo} in Doc: "${collection}" ${detailedLog}.`)

            if (!updateResult.modifiedCount) {
                console.log(`No changes written to ${collection} ${detailedLog} or document was not found.`)
                return responseHandler(false, `No changes written to ${collection} ${detailedLog} or document was not found.`)
            }
            console.log(`Add to array ${fieldToAppendTo}: ${elements} in Doc: "${collection}" ${detailedLog} was successfull`)
            return responseHandler(true, `'${JSON.stringify(elements)}' was added successfully to ${fieldToAppendTo} in ${collection} ${detailedLog}`)
        } catch (e) {
            console.error("Failed at addFieldsToDoc", e.message)
            throw new ApolloError(`Error in addFieldsToDoc ${e.message}`)
        }
    }
    /**
     * @param {String} collection 'user_roles' || 'workspaces' ... 
     * @param {Object} query {_id:id} 
     * @param {String} fieldToRemoveFrom field's value must be an Array
     * @param {Array} elements ['1105',2,'test'....]
     * @returns {Object} {success: Boolean, message: String}
     */
    async removeFieldsFromArrayInDoc(collection, query, fieldToRemoveFrom, elements) {
        const detailedLog = fieldToRemoveFrom === 'sharedWithAccounts' ?
            `where type is ${query.type} and createdFromLibrary is: ${query.createdFromLibrary}`
            : `with ID: ${query._id}`;
        try {
            let updateResult
            if (collection !== 'user_roles') {
                updateResult = await this.db.collection(collection).updateOne(
                    query,
                    { $pull: { [fieldToRemoveFrom]: { $in: elements } } }
                )
                // console.log(`Attempting to remove fields from ${collection} ${detailedLog}`);
            }
            else if (collection === 'user_roles') {
                query = { _id: new ObjectId(query._id) }
                updateResult = await this.db.collection(collection).updateOne(
                    query,
                    { $pull: { [fieldToRemoveFrom]: { entityId: { $in: elements } } } });
                // console.log(`Attempting to remove accounts from user_roles user:${query._id} -> Accounts: ${elements}.`);
            }
            else throw new ApolloError("Error in removeFieldsFromArrayInDoc")


            if (updateResult.modifiedCount === 0) {
                console.log(`No changes written to ${collection}_${query._id}`)
                return responseHandler(false, `No changes written to ${collection}_${query._id}`)
            }
            if (updateResult.modifiedCount > 0) {
                console.log(`${elements} removed successfully from ${collection} with ID: ${query._id}`)
                return responseHandler(true, `${elements} removed successfully from ${collection}_${query._id}`)
            }
        } catch (e) {
            console.error("Error at removeFieldsFromArrayInDoc", e.message)
            throw new ApolloError(`Error in removeFieldsFromArrayInDoc ${e.message}`)
        }
    }
    /**
     * @param {String} collection 'user_roles' || 'workspaces' ... 
     * @param {Object} doc {MONGODB_DOCUMENT} 
     * @returns {Object} {success: Boolean, message: String}
     */
    async insertDocument(collection, doc) {
        try {
            const insert = await this.db.collection(collection).insertOne(doc)
            console.log(`Inserted document: ${collection}_${doc._id} to Mongo`)
            return responseHandler(true, `New ${collection} ID: ${insert.insertedId}`)
        } catch (e) {
            console.error(`Error inserting document: ${collection}_${doc._id} to Mongo`)
            return responseHandler(false, e.message)
        }
    }

    /**
     * Get SceneIDs out of Storyboard document using aggregate
     * @param {String} storyboardId '115501' ... 
     * @returns {Array} Unique array of scenes [11213,55043,12312....]
     */
    async getSceneIdsFromStoryboard(storyboardId) {
        // Using aggregate instead of storyboardDoc from the parent function in order to offload consumption
        const pipeline = [
            { $match: { _id: storyboardId } },
            { $unwind: "$content.sequences" },
            { $unwind: "$content.sequences.rules" },
            { $unwind: "$content.sequences.rules.scenes" },
            {
                $project: {
                    _id: 0,
                    sceneId: "$content.sequences.rules.scenes.id"
                }
            }
        ]
        try {
            const result = await this.db.collection("storyboard").aggregate(pipeline).toArray();
            const sceneArray = result.map(obj => obj.sceneId)
            const removeDuplicates = (array) => [...new Set(array)]
            return removeDuplicates(sceneArray)
        } catch (e) {
            console.error(`Error during getSceneIdsFromStoryboard: ${e}`)
            throw new ApolloError(`Error in getSceneIdsFromStoryboard ${e}`)
        }
    }

    /**
     * Getting Scene Libraries out of Storyboard document.
     * In order to get the SLs used for Assets and for IDMs there are 3 queries to the database to get documents:
     * 2 for Storyboards and 1 for Scene Library
     * @param {String} storyboardId '115501' ... 
     * @returns {Array} Unique array of scene libraries [6570, 6530....]
     */
    async getSceneLibrariesFromStoryboard(storyboardId) {
        try {
            const sceneIds = await this.getSceneIdsFromStoryboard(storyboardId)
            const sceneLibrariesFromScenes = await this.filterCollectionForMultiple('scene_library', { scenes: { $in: sceneIds } }, { _id: 1 })
            const sceneLibraryIDsFromScenes = sceneLibrariesFromScenes.data.map(obj => obj._id)

            const storyboardDoc = await this.db.collection('storyboard').findOne({ _id: storyboardId }, { content: 1 }) //retrieve SB document
            const sceneLibraryIDsFromStoryboard = await extractPalUrls(storyboardDoc) //extracting all SL ids from SB document that are in: "pal://....."

            const allSceneLibraryIds = Array.from(new Set([...sceneLibraryIDsFromStoryboard, ...sceneLibraryIDsFromScenes]));
            console.log(`Extracting all scene libraries in storyboard_${storyboardId}\n Scene libraries: ${allSceneLibraryIds}`)
            return allSceneLibraryIds
        } catch (e) {
            throw new ApolloError(`Error in getSceneLibrariesFromStoryboard:${e}`)
        }

    }


    /**
     * Sharing SLs from a given Storyboard to an account (account_ui)
     * @param {String} storyboardId '125320'  
     * @param {Number || String} accountIdToShare '11506' || 11506 
     */
    async shareSceneLibrariesWithAccount(storyboardId, accountIdToShare) {
        const accountId = accountIdToShare.toString();
        const sceneLibraries = await this.getSceneLibrariesFromStoryboard(storyboardId.toString())
        this.addFieldsToDoc('account_ui', { _id: accountId }, 'sceneLibraries', sceneLibraries)
        const addToSharedWithAccountsPromise = sceneLibraries.map((sceneLibrary) => {
            return this.addFieldsToDoc('workspaces', { type: 'library', createdFromLibrary: sceneLibrary }, 'sharedWithAccounts', [accountId])
        })
        await Promise.all(addToSharedWithAccountsPromise);
    }

    /**
  * Sharing Scene Library to an array of accounts (account_ui)
  * @param {String} sceneLibrary '125320'  
  * @param {Array} accountIds ['11506','11005']  
  */
    async shareSceneLibraryWithAccounts(sceneLibrary, accountIds) {
        try {
            const addToSceneLibrary = accountIds.map((accountId) => {
                return this.addFieldsToDoc('account_ui', {}, 'sceneLibraries', sceneLibrary)
            })
            await Promise.all(addToSceneLibrary)
        } catch (e) {
            console.error("Error sharing scene library with accounts", e)
            throw new ApolloError("Error sharing scene library with accounts:", e)
        }
    }

    /**
     * @param {String} _id '115501' ... 
     * @returns {String} 'us' || 'eu'
     */
    async getAccountRegion(_id) {
        try {
            const account = await this.db.collection('account').findOne({ _id }, { projection: { region: 1 } })
            if (!account) throw new ApolloError(`account_${_id} not found`)
            if (!account.region) account.region = 'us'

            return account.region.toLowerCase()
        } catch (e) {
            console.error("Error getting account region", e)
            throw new ApolloError(`account_${_id} not found`)
        }
    }
    /**
    * @param {String} collection 'accounts' 
    * @param {Objec} query {_id:'11005'} 
    * @returns {Boolean} 
    */
    async isDocExist(collection, query) {
        try {
            const doc = await this.db.collection(collection).findOne(query)
            if (doc) return true
            else return false
        } catch (e) {
            console.error(`Error searching for doc ${collection}_${query} `, e)
            throw new ApolloError(`Error searching for doc ${e.message}`)
        }
    }
    /**
 * @param {String} workspaceId '66e7e9bc1bf7726bf050bfc4' 
 * @param {String || Number} accountId '11005' || 11005
 * @returns {Boolean} 
 */
    async isWorkspaceOwnedByAccount(workspaceId, accountId) {
        try {
            const result = await this.db.collection('workspaces').findOne({ _id: new ObjectId(workspaceId) })
            if (result && result?.owner === accountId.toString()) return true;
            else return false;
        } catch (e) {
            console.error("Error looking for owner of workspace", e)
            throw new ApolloError(`Error looking for owner of workspace ${e.message}`)
        }
    }

    async getEstimatedDocCountForCollections(collections) {
        try {
            const returnObject = collections.reduce((acc, item) => {
                acc[item] = 0;
                return acc
            }, {})
            const promiseArray = collections.map(collection => this.db.collection(collection).estimatedDocumentCount());
            const resultArray = await Promise.all(promiseArray);
            collections.forEach((collection, index) => {
                returnObject[collection] = resultArray[index];
            })
            return returnObject
        } catch (e) {
            console.error("Error getting estimatedDocCount for the following collections:", collections)
            throw new ApolloError(`Error getting estimatedDocCount for the following collections: ${collections}`)
        }
    }

    async getApiKey(accountId) {
        try {
            const apiObj = await this.db.collection('account_credentials').findOne({ _id: accountId.toString() }, { projection: { 'api.secretKey': 1 } })
            return apiObj.api.secretKey
        } catch (e) {
            console.error("Error fetching account cred key")
            throw new ApolloError(`Error fetching account's API key for ${accountId}`)
        }
    }


}



module.exports = { MongoDB };