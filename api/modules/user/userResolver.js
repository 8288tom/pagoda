const { ObjectId } = require('mongodb');
const { limitMapping } = require('../../utils/mongoHelper')
const { getValues, multipleResultHandler, responseHandler } = require('../../utils/globalHelpers');
const { ApolloError } = require('apollo-server-lambda');
const { checkPermissions } = require('../../utils/authorization');


const OWNER_ID = new ObjectId("63623c364eafa691a25f2e63");
const accountProjection = { projection: { _id: 1, firstName: 1, lastName: 1, email: 1, webAccess: 1, company: 1, region: 1 } }
const accountCredsProjection = { projection: { twoStep: 1 } }
const userRolesFilter = { projection: { email: 1, firstName: 1, lastName: 1, "creationDate.timestamp": 1, roles: { $elemMatch: { roleId: OWNER_ID } } } }



const resolvers = {
    Query: {
        getUser: async (_, args, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'users', 'read');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            const { id: userId } = args;
            const userDocument = await dataSources.MongoDB.filterCollectionForMultiple('user_roles', { _id: new ObjectId(userId) }, userRolesFilter)
            const account = userDocument.data[0].roles[0].entityId;
            if (!account) {
                console.error(`UserID ${userId} account document not found`)
                throw new ApolloError(`User ${userId} account document was not found`, "USER_NOT_FOUND")
            }
            const accountCredentials = await dataSources.MongoDB.db.collection('account_credentials').findOne({ _id: account }, accountCredsProjection);
            if (!accountCredentials) {
                console.error(`Account ${account} account_credentials document not found`)
                throw new ApolloError(`Account ${account}'s account_credentials document was not found`, "CREDENTIALS_NOT_FOUND")
            }
            console.log(`${user.email} opened user_${userId}`)

            return {
                account: account,
                twoStepVerification: accountCredentials.twoStep,
                //assocaited accounts and account is being resolved by User.account resolver

            };
        },
        getUsers: async (_, { filters, limit = 'LIMIT_25', offset = 0, sort = 1 }, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'users', 'read');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)
            // can only request account object without filter, with filter will result an error.
            if (!filters || filters.length === 0) {
                const mongoQuery = { "roles.roleId": OWNER_ID };
                // to find the user_roles document of the user
                const queryResult = await dataSources.MongoDB.filterCollectionForMultiple("user_roles", mongoQuery, userRolesFilter, offset, limitMapping[limit], sort)
                const usersData = queryResult.data.map((user) => (
                    {
                        ...user,
                        creationDate: user.creationDate.timestamp,
                        accountId: user.roles[0].entityId,
                    }
                ))
                return { data: usersData, count: queryResult.count }
            }
            const query = {};
            filters.forEach(filter => {
                switch (filter.field) {
                    case "_id":
                        query["_id"] = new ObjectId(filter.value)
                        break
                    case "account._id":
                        query['roles'] = { $elemMatch: { entityId: filter.value, roleId: OWNER_ID } }
                        break;
                    default:
                        query[filter.field] = { $regex: filter.value, $options: "i" }
                        break
                }
            })
            console.log(`${user.email} filtered Users using filter: ${JSON.stringify(filters)}`)
            const queryResult = await dataSources.MongoDB.filterCollectionForMultiple("user_roles", query, userRolesFilter, offset, limitMapping[limit], sort)
            const filteredUsers = queryResult.data.map((user) => ({
                ...user,
                creationDate: user.creationDate.timestamp,
                accountId: user.roles[0].entityId
            }
            ))
            return { data: filteredUsers, count: queryResult.count }

        }
    },
    User: {
        // to resolve account Schema queries in getUsers and getUser
        account: async (parent, _, { dataSources }) => {
            //getUsers uses parent.accountId, getUser uses parent.account
            const accountId = parent.accountId ? parent.accountId : parent.account;
            const account = await dataSources.MongoDB.db.collection('account').findOne({ _id: accountId.toString() }, accountProjection);
            if (!account) {
                return null
            }
            const accountObject = {
                _id: account._id,
                firstName: account.firstName,
                lastName: account.lastName,
                email: account.email,
                webAccess: account.webAccess
            }

            return accountObject
        },
        // to resolve associatedAccounts in getUser
        associatedAccounts: async (parent, args, { dataSources }, info) => {
            // using info in order to gain access to the user's ID
            const userId = new ObjectId(info.variableValues.id);
            const queryResult = await dataSources.MongoDB.db.collection('user_roles').findOne({ _id: userId }, { projection: { roles: 1 } });
            if (!queryResult) {
                return [{
                    entity: null,
                    entityId: null,
                    roleId: null,
                    company: null
                }]
            }
            const associatedAccounts = queryResult.roles.map(role => ({
                entity: role.entity,
                entityId: role.entityId,
                roleId: role.roleId
            }));
            const associatedAccountsIds = associatedAccounts.map(acc => acc.entityId)
            const getCompanyQuery = { _id: { $in: associatedAccountsIds } }
            const getCompanyProjection = { projection: { company: 1 } }
            const accountIdsCompany = await dataSources.MongoDB.filterCollectionForMultiple('account', getCompanyQuery, getCompanyProjection);
            const companyMap = accountIdsCompany.data.reduce((acc, account) => {
                acc[account._id] = account.company;
                return acc;
            }, {});
            const result = associatedAccounts.map(account => ({
                entity: account.entity,
                entityId: account.entityId,
                roleId: account.roleId,
                company: companyMap[account.entityId] || "not found"
            }));
            return result
        }
    },
    Mutation: {
        updateUser: async (parent, args, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'users', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            const { _id: userId, newEmail, firstName, lastName, webAccess, twoStepVerification, associatedAccounts } = args.input;
            const userDocument = await dataSources.MongoDB.filterCollectionForMultiple('user_roles', { _id: new ObjectId(userId) }, userRolesFilter)
            const accountId = userDocument.data[0].roles[0].entityId;
            const accountsDocQuery = { _id: accountId }
            const userRolesDocQuery = { _id: new ObjectId(userId) }

            // Fields that will be used in $set operator in Mongo update.
            const accountDocFieldsToUpdate = {
                firstName,
                lastName,
                webAccess: webAccess?.toLowerCase()
            }
            const userRolesDocFieldsToUpdate = associatedAccounts?.map((accountId) => {
                return {
                    entity: "account",
                    entityId: accountId.toString(),
                    roleId: new ObjectId("63623c924eafa691a25f2e64")
                }
            })
            // Getting only the fields that were recieved in the request (removing all empty fields)
            const cleanValuesForAccount = getValues(accountDocFieldsToUpdate)
            const updatePromises = [];

            // Validations to check if any values needs to be updated and update if validation passed
            if (Object.keys(cleanValuesForAccount).length > 0) {
                updatePromises.push(dataSources.MongoDB.updateDocument('account', accountsDocQuery, cleanValuesForAccount))
            }
            if (typeof twoStepVerification !== 'undefined') {
                updatePromises.push(dataSources.MongoDB.updateDocument('account_credentials', accountsDocQuery, { 'twoStep': twoStepVerification }))
            }
            if (firstName || lastName) {
                updatePromises.push(dataSources.MongoDB.updateDocument('user_roles', userRolesDocQuery, { firstName, lastName }))
            }

            if ((associatedAccounts && associatedAccounts.length > 0) && !associatedAccounts.includes(Number(accountId))) {
                updatePromises.push(dataSources.MongoDB.addFieldsToDoc('user_roles', userRolesDocQuery, 'roles', userRolesDocFieldsToUpdate))
            }

            if (newEmail) {
                updatePromises.push(dataSources.MongoDB.updateDocument('account_credentials', accountsDocQuery, { 'web.username': newEmail.toLowerCase() }))
                updatePromises.push(dataSources.MongoDB.updateDocument('user_roles', userRolesDocQuery, { email: newEmail.toLowerCase() }))
                updatePromises.push(dataSources.MongoDB.updateDocument('account', accountsDocQuery, { email: newEmail.toLowerCase() }))
            }


            try {
                const result = await Promise.all(updatePromises);
                console.log(`${user.email} updated user_${userId}\n update result: ${JSON.stringify(result)}`)
                return multipleResultHandler(result)
            } catch (e) {
                console.error(e);
                return responseHandler(false, e.message)
            }
        },
        // Used to remove certain values from user's related documents
        removeFromUser: async (parent, args, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'users', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            const { fieldToRemoveFrom, valuesToRemove, _id } = args.input;
            const query = { _id }
            // if fieldToRemoveFrom === 'associatedAccounts' then _id = user_id, otherwise _id=accountId 
            try {
                //removing scene libraries
                if (fieldToRemoveFrom !== 'associatedAccounts') {
                    console.log(`${user.email} removed shared scene libraries from account_ui_${_id}`)
                    return await dataSources.MongoDB.removeFieldsFromArrayInDoc('account_ui', query, fieldToRemoveFrom, valuesToRemove)
                }
                if (fieldToRemoveFrom === 'associatedAccounts') {
                    const userDocument = await dataSources.MongoDB.db.collection('user_roles').findOne({ _id: new ObjectId(_id) }, userRolesFilter)
                    const accountId = userDocument.roles[0].entityId;
                    if (!valuesToRemove.includes(accountId)) {
                        console.log(`${user.email} removed associated accounts from user_roles_${_id}`)
                        return await dataSources.MongoDB.removeFieldsFromArrayInDoc('user_roles', query, 'roles', valuesToRemove)
                    }
                    return responseHandler(false, "Cannot remove owner's account id")
                }
                else {
                    console.error(`Error in removeFromUser, input data: ${args.input}`)
                    return responseHandler(false, 'Something went wrong')
                }
            } catch (e) {
                console.error(e);
                return responseHandler(false, e.message)
            }
        }
    },

}


module.exports = resolvers;