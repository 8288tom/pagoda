
const { gql } = require("apollo-server-lambda");

const typeDefs = gql`
scalar JSON

type MutationResponse{
    success:Boolean!
    message:String
    data:JSON
}

input CopyInput{
    _id:ID!
    accountIdToCopy:Int!
    workspaceId:ID
}

input FilterInput {
    field: String!
    value: String!
}

input RemoveValInput{
        _id:ID! # If trying to remove associatedAccounts: id=userId (from user_roles), for anything else: id=accountId
        fieldToRemoveFrom: FieldsToRemoveOptions!,
        valuesToRemove:[String!]!
    }

`

module.exports = typeDefs
