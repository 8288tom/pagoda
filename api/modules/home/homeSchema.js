const { gql } = require("apollo-server-lambda");

const typeDefs = gql`
    type Query{
        initApp:InitAppResult!
        getElasticResults(env:String!):ElasticResult!
    }

    type DocCount{
        account:Int
        storyboard:Int
        canvas:Int
        scene_library:Int
        imsscene:Int
        workspaces:Int
    }

    type RenderObject{
        companyName:String
        value:Int
    }

    type InitAppResult{
        betaFeatures:[String!]!
        user:Employee!
        docCount:DocCount
    }

    type EnvResult{
        companiesBreakdown:[RenderObject!]
        topBatches:[RenderObject!]
        totalRenders:Int
    }

    type ElasticResult{
        US:EnvResult!
        EU:EnvResult!
    }


`


module.exports = typeDefs;