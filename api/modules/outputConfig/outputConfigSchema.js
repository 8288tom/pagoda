const { gql } = require("apollo-server-lambda");

const typeDefs = gql`
    scalar JSON

    type Query{
        getOutputConfigs(limit:LIMIT! offset:Int! sort:Int filters:[FilterInput!]): OutputConfigResult!
    }

    type Mutation{
        copyOutputConfig(_id:ID! newOwner:Int! newName:String!):MutationResponse!
        createOutputConfig(accountId:ID! input:OutputConfigInput!):MutationResponse!
    }


    type OutputConfigResult{
        data:[OutputConfigQuery!]!
        count:Int
    }

    type OutputConfigQuery{
        _id: ID!
        accountId: Int
        name: String
        output:OutputBooleanKeys
        creationDate:Int
        lastModified:Int
    }

    type OutputBooleanKeys {
        video: Boolean
        gif: Boolean
        jpg: Boolean
        audio: Boolean
        accessibility: Boolean
    }


    input OutputConfigInput{
        name:String!
        identifiers:Identifiers
        output:OutputObject!

    }

    input Identifiers{
        authorized:[Int!]
        open_to_all:Boolean
    }

    input OutputObject{
        video:[VideoOutput!]
        gif:[GifOutput!]
        jpg:[JpgOutput!]
        audio:[AudioOutput!]
        accessibility:Accessibility
    }



    input VideoOutput{
        format:String!
        height:Int!
        quality:Int
        landing_page_id:Int
        crop_to_ratio:[Int!]
        overlays:[JSON]
        suffix:String
        label:String
    }
    input GifOutput{
        height:Int!
        time:Int!
        fps:Int!
        duration:Int
        loop:Int
        landing_page_id:Int
        color_depth:Int
        crop_to_ratio:[Int!]
        overlays:[JSON]
        suffix:String
        label:String
    }
    input JpgOutput{
        height:Int!
        time:Int!
        crop_to_ratio:[Int!]
        overlays:[JSON]
        suffix:String
        label:String
    }
    input AudioOutput{
        format:String!
        sample_rate:Int
        bit_depth:Int
        bitrate:Int
        channels:String
    }

    input Accessibility{
        caption_languages:[String]
        transcript_languages:[String]
    }


`


module.exports = typeDefs;