const { gql } = require("apollo-server-lambda");

const typeDefs = gql`

    type Query{
        getStorages(limit:LIMIT! offset:Int! sort:Int filters:[FilterInput!]): StorageResult!
        getStorage(id:ID!):Storage
    }
    type StorageResult{
        data:[Storage!]!
        count:Int
    }

    type Mutation{
        createStorage(input:StorageInput!):MutationResponse
        updateStorage(_id:ID! input:StorageInput!):MutationResponse
    }

    input StorageInput{
        accountId:Int!
        type:StorageTypes!
        name:String!
        private:Boolean
        serverUrl:String
        serverPort:String
        uploadDirectory:String
        user:String
        password:String
        secretKey:String
        path:String
        decryption:DecryptionInput
        webAccessUrl:String
    }

    
    type Credentials{
        serverUrl:String
        serverPort:String
        uploadDirectory:String
        user:String
        password:String
        path:String
        secretKey:String
    }

    type Storage{
        _id: ID!
        accountId: Int!
        name: String!
        type:StorageTypes!
        webAccessUrl:String
        credentials:Credentials
        decryption:Decryption
        private:Boolean
        creationDate:Int!

    }

    input DecryptionInput{
        type:String
        key:String
    }

    type Decryption{
        type:String
        key:String
    }

    enum StorageTypes{
        SFTPKEY
        sftpkey     
        SFTP
        sftp
        S3CMD
        s3cmd
        FILE
        file
        idomoo_api
        s3
        s3_compatible
    }

`


module.exports = typeDefs;