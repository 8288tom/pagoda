const { gql } = require("apollo-server-lambda");

const typeDefs = gql`
    type Query{
        getSceneLibraries(limit:LIMIT! offset:Int! sort:Int filters:[FilterInput!]):SceneLibraryResult!
    }
    type SceneLibraryResult{
        data:[SceneLibrary!]!
        count:Int
    }
    type Mutation{
        changeSceneLibraryOwner(_id:ID! newOwner:Int!):MutationResponse!
    }

    type SceneLibrary{
        _id: ID!
        accountId: Int!
        name: String
        creationDate:String
        lastModified:String
        thumbnail:String
        scenes:[Int]
    }

`


module.exports = typeDefs;