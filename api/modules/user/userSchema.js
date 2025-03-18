const { gql } = require("apollo-server-lambda");


const typeDefs = gql`
    scalar JSON

    type Query{
        getUser(id:ID!):User!
        getUsers(limit:LIMIT!, offset:Int!, sort:Int, filters:[FilterInput!]):UserResult!
    }
    type UserResult{
        data:[User!]!
        count:Int
    }

    type Mutation{
        updateUser(input:UpdateUserInput!):MutationResponse!
        removeFromUser(input:RemoveValInput!):MutationResponse!
    }

    type AssociatedAccount {
        entity: String
        entityId: String
        roleId: ID
        company: String
    }

    type User {
        _id:ID!
        email:String!
        firstName:String
        lastName:String
        creationDate:Int
        account:Account
        twoStepVerification:Boolean
        webAccess:String
        associatedAccounts:[AssociatedAccount!]!
    }
    
    input UpdateUserInput{
        _id:ID!
        email:String
        newEmail:String
        firstName:String
        lastName:String
        webAccess:String
        twoStepVerification:Boolean
        associatedAccounts:[Int!]
    }
`


module.exports = typeDefs;
