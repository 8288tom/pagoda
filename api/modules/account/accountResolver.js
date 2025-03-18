const { limitMapping } = require('../../utils/mongoHelper')
const { multipleResultHandler, responseHandler } = require('../../utils/globalHelpers')
const { ApolloError } = require('apollo-server-lambda');
const { checkPermissions } = require('../../utils/authorization');
const accountUiFilter = { projection: { creditsThreshold: 1, betaFeatures: 1, sceneLibraries: 1 } };
const accountFilter = { projection: { firstName: 1, lastName: 1, company: 1, email: 1, fullService: 1, status: 1, webAccess: 1, region: 1, batchDeadline: 1, storageId: 1, videoExpirationTimeOnStorage: 1, lp_subdomains: 1, logo: 1, maxConcurrencyAllowed: 1, skipConcurencyValidation: 1, "creationDate.timestamp": 1 } }
const resolvers = {
    Query: {
        //Used to open Account Edit Form
        getAccount: async (_, args, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'accounts', 'read');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            const { id } = args;
            try {
                const [account, accountUi] = await Promise.all([
                    dataSources.MongoDB.db.collection('account').findOne({ _id: id },),
                    dataSources.MongoDB.db.collection('account_ui').findOne({ _id: id }, accountUiFilter)
                ]);
                if (!account) {
                    console.error(`${id} account doc not found`)
                    throw new ApolloError(`${id} account doc not found`, "ACCOUNT_NOT_FOUND")
                }
                if (!accountUi) {
                    console.error(`${id} accountUI doc not found`)
                    throw new ApolloError(`${id} accountUI doc not found`, "ACCOUNT_UI_NOT_FOUND")
                }

                const accountCredits = await dataSources.CountersAPI.getAccountCredit(id, account.region ? account.region : "us")
                if (account && accountUi && accountCredits) {
                    var fullAccountDoc = mergeAndRenameAcc(account, accountUi, accountCredits.credits)
                }
                console.log(`${user.email} opened account_${id}`)
                return fullAccountDoc
            } catch (e) {
                console.error("Failed getting account data", e)
                throw new ApolloError(`Failed getting account data: ${e.message}`)
            }
        },
        getAccounts: async (_, { filters, limit = 'LIMIT_25', offset = 0, sort = 1 }, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'accounts', 'read');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            if (filters && filters.length > 0) {
                const query = {};
                console.log(`${user.email} filtered Accounts using filter: ${JSON.stringify(filters)}`)
                filters.forEach(filter => {
                    switch (filter.field) {
                        case "_id":
                            query["_id"] = filter.value
                            break
                        case "accountType":
                            query["fullService"] = { $regex: filter.value, $options: "i" }
                            break
                        case "maxConcurrencyAllowed":
                            query[filter.field] = Number(filter.value)
                            break
                        case "userStatus":
                            query['status'] = { $regex: filter.value, $options: "i" }
                            break;
                        default:
                            query[filter.field] = { $regex: filter.value, $options: "i" }
                            break
                    }
                })
                return getAccountsData(query)
            }
            else return getAccountsData({})


            async function getAccountsData(query) {
                try {
                    const accounts = await dataSources.MongoDB.filterCollectionForMultiple("account", query, accountFilter, offset, limitMapping[limit], sort)
                    if (!accounts) throw new ApolloError(`accounts doc not found`, "ACCOUNTS_NOT_FOUND")
                    // creating an object with the accountId and its region
                    const accountIdsAndRegion = accounts.data.map((account) => {
                        return { _id: account?._id, region: account.region ? account.region : "us" }
                    })
                    // Querying Dynamo to get the requested accounts credits
                    const accountsCredits = await Promise.all(
                        accountIdsAndRegion.map(async (account) => {
                            return await dataSources.CountersAPI.getAccountCredit(account._id, account.region)
                        })
                    )
                    let accountsArray;
                    accountsArray = accountIdsAndRegion.map((obj) => obj._id)
                    const thresholdQuery = { _id: { $in: accountsArray } }
                    const accountCreditsThreshold = await dataSources.MongoDB.filterCollectionForMultiple("account_ui", thresholdQuery, { projection: { creditsThreshold: 1 } })
                    if (!accountCreditsThreshold) throw new ApolloError(`Accounts credit threshold not found`, "ACCOUNTS_CREDITTHRESHOLD_NOT_FOUND")

                    const accountsData = accounts.data.map((account) => {
                        //Changing credits to String due to GQL 32 bit limitation
                        const matchedAccount = accountsCredits.find(acc => acc.account?.toString() === account._id)
                        //matching accountUI doc to account doc
                        const creditsThresholdValue = accountCreditsThreshold.data.find(accountUi => accountUi._id.toString() === account._id.toString());

                        return mergeAndRenameAcc(account, creditsThresholdValue, matchedAccount?.credits?.toString())
                    })
                    return { data: accountsData, count: accounts.count }
                }
                catch (e) {
                    console.error("Failed getting accounts data", e)
                    throw new ApolloError(`Failed getting accounts data: ${e.message}`)
                }
            }
        }

    },
    Account: {
        logo: (parent) => {
            if (!parent.logo) {
                const firstNameInitial = parent.firstName ? parent.firstName.charAt(0) : '';
                const lastNameInitial = parent.lastName ? parent.lastName.charAt(0) : '';
                return firstNameInitial.toUpperCase() + lastNameInitial.toUpperCase();
            }
            return parent.logo
        }
    },
    Mutation: {
        updateAccount: async (_, args, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'accounts', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)
            const { _id, company, accountType, userStatus, betaFeatures, region, storageId, hostingPeriod, maxConcurrencyAllowed, skipConcurencyValidation, lp_subdomains, sceneLibraries } = args.input;
            const query = { _id }


            //Fields that will be used in $set operator in Mongo update.
            const accountDocFieldsToUpdate = {
                company,
                fullService: accountType,
                status: userStatus,
                region: region?.toLowerCase(),
                videoExpirationTimeOnStorage: hostingPeriod,
                storageId,
                maxConcurrencyAllowed,
                skipConcurencyValidation
            }
            const isAccountNeedUpdate = Boolean(company || accountType || userStatus || region || hostingPeriod || storageId || maxConcurrencyAllowed || skipConcurencyValidation)


            const updatePromises = [];
            // Validations to check if any values need to be updated and update if validation is passed
            if (isAccountNeedUpdate) {
                updatePromises.push(dataSources.MongoDB.updateDocument('account', query, accountDocFieldsToUpdate))
            }

            // if (lp_subdomains && lp_subdomains.length >= 0) {
            //     updatePromises.push(dataSources.MongoDB.addFieldsToDoc('account', query, 'lp_subdomains', lp_subdomains))
            // }

            if (betaFeatures && betaFeatures.length >= 0) {
                console.log("This is the betaFeatures to update", betaFeatures)
                updatePromises.push(dataSources.MongoDB.updateDocument('account_ui', query, { betaFeatures: betaFeatures }))
            }
            if (sceneLibraries && sceneLibraries.length > 0) {
                const addSharedSLToAccount = sceneLibraries.map(sceneLibrary => dataSources.MongoDB.addFieldsToDoc('workspaces', { type: 'library', createdFromLibrary: sceneLibrary }, 'sharedWithAccounts', [_id]))
                const addToAccountUiArray = dataSources.MongoDB.addFieldsToDoc('account_ui', query, 'sceneLibraries', sceneLibraries)
                await Promise.all(addSharedSLToAccount, addToAccountUiArray)
                return addToAccountUiArray
            }

            try {
                const result = await Promise.all(updatePromises);
                console.log(`${user.email} updated account_${_id}\n update result:${JSON.stringify(result)}`)
                return multipleResultHandler(result)
            } catch (e) {
                console.error(`${user.email} encountered an error during update account ${e}`);
                return responseHandler(false, e.message)
            }
        },
        updateCredits: async (_, args, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'accounts', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)
            throw new ApolloError("CREDITS UPDATE DISABLED FOR DEMO")

            const { _id, region = 'us', newCredits: newCreditsValue, creditsThreshold } = args.input

            const updatePromises = [];
            if (creditsThreshold && creditsThreshold.length > 0) {
                const thresholdVal = parseInt(creditsThreshold)
                updatePromises.push(dataSources.MongoDB.updateDocument('account_ui', { _id }, { creditsThreshold: thresholdVal }))
            }
            if (newCreditsValue && newCreditsValue.length > 0) {
                updatePromises.push(await dataSources.CountersAPI.updateAccountCredit(_id, region, newCreditsValue, user.email))
            }

            try {
                const result = await Promise.all(updatePromises);
                return multipleResultHandler(result)
            } catch (e) {
                console.error(e);
                return responseHandler(false, e.message)
            }
        },
        removeFromAccount: async (_, args, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'accounts', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)

            const { fieldToRemoveFrom, valuesToRemove, _id } = args.input;
            const query = { _id }
            try {
                let result;
                if (fieldToRemoveFrom === 'betaFeatures') {
                    result = await dataSources.MongoDB.removeFieldsFromArrayInDoc('account_ui', query, fieldToRemoveFrom, valuesToRemove)
                    console.log(`${user.email} updated account ${_id}'s betaFeatures, removed: ${valuesToRemove}`)
                }
                if (fieldToRemoveFrom === 'sceneLibraries') {
                    const removeSharedSLFromAccount = valuesToRemove.map(sceneLibrary => dataSources.MongoDB.removeFieldsFromArrayInDoc('workspaces', { type: 'library', createdFromLibrary: sceneLibrary }, 'sharedWithAccounts', [_id]))
                    await Promise.all(removeSharedSLFromAccount)
                    result = await dataSources.MongoDB.removeFieldsFromArrayInDoc('account_ui', query, fieldToRemoveFrom, valuesToRemove)
                    console.log(`${user.email} updated account ${_id}'s shared sceneLibraries, removed: ${valuesToRemove}`)
                }
                else result = await dataSources.MongoDB.removeFieldsFromArrayInDoc('account', query, fieldToRemoveFrom, valuesToRemove)

                if (!result.success) {
                    return responseHandler(false, result.message)
                }

                return responseHandler(true, result.message ? result.message : `Successfully removed ${valuesToRemove} from ${_id}`)
            }
            catch (e) {
                console.error(`${user.email} encountered an error trying to remove ${fieldToRemoveFrom}:${valuesToRemove} from ${_id}. `);
                return responseHandler(false, e.message)
            }
        }
    }
}


function mergeAndRenameAcc(account, accountUi, accountCredits) {
    const result = {
        _id: account._id,
        firstName: account.firstName,
        lastName: account.lastName,
        company: account.company,
        credits: accountCredits ? accountCredits : null,
        email: account.email,
        hostingPeriod: account.videoExpirationTimeOnStorage,
        lpSubDomains: account.lp_subdomains ? account.lp_subdomains : [],
        accountType: account.fullService,
        storage: account.storage,
        userStatus: account.status,
        creditsThreshold: accountUi ? accountUi.creditsThreshold : null,
        betaFeatures: accountUi ? accountUi.betaFeatures : [],
        sceneLibraries: accountUi ? accountUi.sceneLibraries : [],
        region: account.region,
        batchDeadline: account.batchDeadline,
        storageId: account.storageId,
        maxConcurrencyAllowed: account.maxConcurrencyAllowed,
        webAccess: account.webAccess,
        skipConcurencyValidation: account.skipConcurencyValidation,
        logo: account.logo,
        creationDate: account?.creationDate?.timestamp || null
    };

    return result;
}

module.exports = resolvers;


