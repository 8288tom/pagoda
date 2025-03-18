const { gql } = require("apollo-server-lambda");

const typeDefs = gql`
    scalar JSON

    type Query{
        getAds:Ads!
    }
    type Mutation{
        addStyle(input:addOrEditStylesInput!):MutationResponse!
        editStyle(input:addOrEditStylesInput!):MutationResponse!
    }

    type Ads{
        styles:[JSON!]!
    }

    input addOrEditStylesInput{
        name:String!
        thumbnail:String
        durations:[JSON]!
    }
   
`


module.exports = typeDefs;