const { gql } = require("apollo-server-lambda");

const typeDefs = gql`
    type Query{
        getLandingPages(limit:LIMIT! offset:Int! sort:Int filters:[FilterInput!]):LandingPagesResult!
    }
    type LandingPagesResult{
        data:[LandingPage!]!
        count:Int
    }

    type Mutation{
        copyLandingPage(input:CopyInput!):MutationResponse!
    }

    type LandingPage{
        _id: ID!
        accountId: Int
        title: String
        thumbnail: String
        landingPageId: String
        lastModified: String
        createdDate: String!
        lastPublishedDate: String
        publicUrl: String
        isPublished: Boolean!
        publishedPageKey:String
    }
`


module.exports = typeDefs;