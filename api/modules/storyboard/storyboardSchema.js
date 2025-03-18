const { gql } = require("apollo-server-lambda");

const typeDefs = gql`

    type Query{
        getStoryboards(limit:LIMIT! offset:Int! sort:Int filters:[FilterInput!]): StoryboardResult!
    }
    type StoryboardResult{
        data:[Storyboard!]!
        count:Int
    }
    type Mutation{
        copyStoryboard(input:CopyInput!):MutationResponse!
        updateStoryboard(input:UpdateStoryboardInput!):MutationResponse!
    }

    input UpdateStoryboardInput{
        storyboardIdToUpdate:ID!
        storyboardIdToUpdateFrom:ID!
        perserveName:Boolean
    }

    type Storyboard{
        _id:ID!
        accountId:Int!
        hostingPeriod:Int
        name:String
        lastModified: String
        creationDate: String
        lock: Boolean
    }
`


module.exports = typeDefs;