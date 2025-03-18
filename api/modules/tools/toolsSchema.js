const { gql } = require("apollo-server-lambda");

const typeDefs = gql`
    type Query{
        getUploadUrls(filenames:[String!]!):getUploadUrlsResult!
        getSceneLibrariesFromStoryboard(storyboardId:String!):getSceneLibrariesResult!
    }

    type Mutation{
        transcribeAudios(input:AudioFilesMetadata!):TranscriptionResult! 
    }

    input AudioFilesMetadata{
        s3folder:String! 
        lang:String!
    }

    type TranscriptionResult {
        zipFileUrl: String!
    }
    
    type getUploadUrlsResult{
        urls:[String!]!
    }
    
    type getSceneLibrariesResult{
        sceneLibraries:[Int!]!
    }
`


module.exports = typeDefs;