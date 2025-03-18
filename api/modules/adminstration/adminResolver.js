const { ApolloError } = require("apollo-server-lambda");
const { responseHandler } = require("../../utils/globalHelpers");
const { ObjectId } = require('mongodb');

const employeesFilter = { projection: { email: 1, permissions: 1, isAdmin: 1 } }
const collectionName = 'pagoda_users'

const resolvers = {
    Query: {
        getEmployees: async (_, args, { dataSources, user }) => {
            if (!user.isAdmin) throw new ApolloError('User is not authorized', 403)
            const employees = await dataSources.MongoDB.filterCollectionForMultiple(collectionName, {}, employeesFilter)
            return employees;
        }
    },
    Mutation: {
        addEmployee: async (_, args, { dataSources, user }) => {
            if (!user.isAdmin) throw new ApolloError('User is not authorized', 403)
            const { email, permissions } = args.input;
            if (permissions.length < 1) {
                throw new ApolloError('Atleast one permission must be given')
            }

            const employeeExist = await dataSources.MongoDB.isDocExist(collectionName, { email })
            if (employeeExist) {
                return responseHandler(false, 'Employee already exists with the given email')
            }

            const docToInsert = {
                type: 'user',
                email,
                permissions,
                isAdmin: false
            }
            const insertResponse = await dataSources.MongoDB.insertDocument(collectionName, docToInsert);
            if (insertResponse.success) console.log(`${user.email} added ${docToInsert.email} to ${collectionName}`);
            return insertResponse
        },
        deleteEmployee: async (_, args, { dataSources, user }) => {
            if (!user.isAdmin) throw new ApolloError('User is not authorized', 403)

            const { _id } = args.input;

            try {
                const deleteResponse = await dataSources.MongoDB.db.collection(collectionName).deleteOne({ _id: new ObjectId(_id) })
                if (deleteResponse.deletedCount === 0) {
                    console.log(`Document delete operation failed for ${collectionName}_${_id}. Response:`, deleteResponse)
                    return responseHandler(false, 'Document delete operation failed')
                }
                console.log(`${user.email} deleted ${_id} doc from ${collectionName}`)
            } catch (e) {
                console.error("Error deleting employee - check logs", e)
                throw new ApolloError('Error deleting employee')
            }

            return responseHandler(true, "Employee deleted successfully")
        },
        updatePermissions: async (_, args, { dataSources, user }) => {
            if (!user.isAdmin) throw new ApolloError('User is not authorized', 403)

            const { _id, permissions, isAdmin } = args.input;
            const idExist = await dataSources.MongoDB.isDocExist(collectionName, { _id: new ObjectId(_id) })
            if (!idExist) return responseHandler(false, `could not find doc in Database with ${_id}`);
            const fieldsToUpdate = {
                permissions,
                isAdmin
            }
            const updateOperation = await dataSources.MongoDB.updateDocument(collectionName, { _id: new ObjectId(_id) }, fieldsToUpdate)
            console.log(`${user.email} updated permissions for pagoda_user ${_id} with the following permissions:${JSON.stringify(permissions)}`)
            return updateOperation
        },
        addPermissionToDB: async (_, args, { dataSources, user }) => {
            if (!user.isAdmin) throw new ApolloError('user is not authorized', 403);
            const { permissionName } = args.input;
            const objectToAddToPermissions = { name: permissionName, read: false, write: false }
            const response = await dataSources.MongoDB.db.collection('pagoda_users').updateMany({}, { $addToSet: { permissions: { ...objectToAddToPermissions } } })
            if (response.modifiedCount) {
                console.log(`${user.email} Added permissions type successfully, update result: ${response}`)
                return { success: true, message: `Updated successfully ${response.modifiedCount} documents` }
            }
            else {
                return { success: false, message: `Something went wrong: ${response}` }
            }
        }
    }
}


module.exports = resolvers;
