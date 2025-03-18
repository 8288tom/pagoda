const { gql } = require("apollo-server-lambda");

const typeDefs = gql`
    type Query{
        getAccount(id:ID!):Account!
        getAccounts(limit:LIMIT! offset:Int! sort:Int filters:[FilterInput!]):AccountResults!
    }

    type AccountResults{
        data:[Account!]!
        count:Int
    }

    type Mutation{
        updateAccount(input:UpdateAccountInput):MutationResponse!
        updateCredits(input:UpdateAccountCredits):MutationResponse!
        removeFromAccount(input:RemoveValInput):MutationResponse!
    }

    input UpdateAccountCredits{
        _id:ID!
        newCredits:String
        region:String
        creditsThreshold:String
    }

    input UpdateAccountInput{
        _id:ID!
        company:String
        accountType:String
        userStatus:String
        betaFeatures:[String]
        region:String
        skipConcurencyValidation:Boolean
        lp_subdomains:[String]
        sceneLibraries:[String!]
        storageId:Int
        hostingPeriod:Int
        maxConcurrencyAllowed:Int
    }

    type Account {
        _id:ID!
        company:String
        betaFeatures:[String!]
        userStatus:String
        batchDeadline:Int
        accountType:String
        credits:String
        creditsThreshold:Int
        region:String
        storageId:Int
        hostingPeriod:Int
        firstName:String
        lastName:String
        email:String!
        webAccess:String
        lpSubDomains:[String!]
        maxConcurrencyAllowed:Int
        logo:String
        skipConcurencyValidation:Boolean
        creationDate:Int
        sceneLibraries:[String!]!
    }
`


module.exports = typeDefs;