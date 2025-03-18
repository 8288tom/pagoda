import gql from "graphql-tag"
//The order of the queries matter:
//Using the first query in each object to fill the initial state of the table
const queries = {
  accounts: {
    getaccounts: gql`
        query getAccounts($limit: LIMIT!, $offset: Int!, $sort:Int, $filters: [FilterInput!]) {
        getAccounts(limit: $limit, offset: $offset, sort:$sort filters:$filters) {
          data{
            _id
            accountType
            batchDeadline
            company
            credits
            creditsThreshold
            email
            firstName
            lastName
            lpSubDomains
            storageId
            region
            userStatus
            webAccess
            logo
            maxConcurrencyAllowed
            creationDate
          }
          count
            
        }
        }`,
    getaccount: gql`query getAccount($id: ID!){
            getAccount(id: $id) {
              _id
              company
              accountType
              userStatus
              credits
              creditsThreshold
              betaFeatures
              region
              # batchDeadline
              storageId
              hostingPeriod
              # email
              # firstName
              # lastName
              # webAccess
              lpSubDomains
              # logo
              maxConcurrencyAllowed
              skipConcurencyValidation
              sceneLibraries
            }
          }
          `,
    getscenelibraries: gql`query getAccount($id: ID!){
          getAccount(id: $id) {
            _id
            sceneLibraries
          }
        }
        `
  },
  users: {
    getusers: gql`query getUsers($limit:LIMIT! $offset:Int! $sort:Int $filters: [FilterInput!]){
            getUsers(limit:$limit offset:$offset sort:$sort filters:$filters) {
              data{
                _id
                email
                firstName
                lastName,
                # creationDate -- this field is mixed on the Database, a lot of work to take that into account
                account {
                  _id
                }
              }
              count
            }
          }`,
    getuser: gql`query getUser( $id:ID!) {
            getUser( id:$id) {
              account {
                _id
                firstName
                lastName
                email
                webAccess
              }
              twoStepVerification
              associatedAccounts {
                # entity
                entityId
                # roleId
                company
              }
            }
          }`,
    getaccounts: gql`query getUser( $id:ID!) {
      getUser( id:$id) {
        associatedAccounts {
          # entity
          entityId
          # roleId
          company
        }
      }
    }`
  },
  storyboards: {
    getstoryboards: gql`query getStoryboards($limit: LIMIT!, $offset: Int!, $sort:Int $filters: [FilterInput!]){
            getStoryboards(limit:$limit, offset:$offset, sort:$sort, filters:$filters) {
              data{
                accountId
                _id
                creationDate
                hostingPeriod
                lastModified 
                name
                # lock
              }
              count
            }
          }`
  },
  scenelibraries: {
    getscenelibraries: gql`query getSceneLibraries($limit: LIMIT!, $offset: Int!,$sort:Int $filters: [FilterInput!]) {
            getSceneLibraries(limit: $limit, offset: $offset, sort:$sort filters:$filters) {
              data{
                _id
                accountId
                creationDate
                # lastModified
                name
                scenes
                thumbnail
              }
              count
            }
          }`
  },
  storages: {
    getstorages: gql`query getStorages($limit: LIMIT!, $offset: Int!, $sort:Int $filters: [FilterInput!]) {
            getStorages(limit: $limit, offset: $offset,sort:$sort, filters:$filters) {
              data{
                _id
                accountId
              credentials {
                password
                path
                serverPort
                serverUrl
                secretKey
                uploadDirectory
                user
              }
              name
              type
              webAccessUrl
              creationDate
              }
              count
            }
          }
          `,
    getstorage: gql`query getStorage($id:ID!){
            getStorage(id: $id) {
              _id
              accountId
              credentials {
                password
                serverPort
                path
                secretKey
                serverUrl
                uploadDirectory
                user
              }
              private
              name
              type
              webAccessUrl
            }
          }`
  },
  outputconfigs: {
    getoutputconfigs: gql`
        query getOutputConfigs($limit: LIMIT!, $offset: Int!, $sort:Int $filters: [FilterInput!]) {
          getOutputConfigs(limit: $limit, offset: $offset,sort:$sort filters:$filters) {
            data{
              _id
              accountId
              creationDate
              lastModified
              name
              output {
              accessibility
              audio
              gif
              jpg
              video
            }
            }
            count
          }
        }`
  },
  landingpages: {
    getlandingpages: gql`
        query getLandingPages($limit: LIMIT!, $offset: Int!,$sort:Int $filters: [FilterInput!]) {
          getLandingPages(limit: $limit, offset: $offset,sort:$sort filters:$filters) {
            data{
              _id
            accountId
            # createdDate
            isPublished
            landingPageId
            lastModified
            # lastPublishedDate
            publicUrl
            publishedPageKey
            thumbnail
            title
            }
          count
          }
        }`
  },
  admin: {
    getemployees: gql`query getEmployees{
      getEmployees {
        data {
          email
          _id
          permissions {
            name
            read
            write
          }
          isAdmin
        }
        count
      },
    }`,
  },
  home: {
    getelasticresults: gql`query GetElasticResults($env:String!) {
      getElasticResults(env:$env) {
        US{
          companiesBreakdown{
          companyName
          value
        }
        topBatches{
          companyName
          value
        }
        totalRenders
        }
        EU{
          companiesBreakdown{
          companyName
          value
        }
        topBatches{
          companyName
          value
        }
        totalRenders
        }
      }
    }`,
    initapp: gql`query initApp{
      initApp{
        betaFeatures
        docCount {
          account
          storyboard
          canvas
          scene_library
          workspaces
          imsscene
        }
        user{
          permissions{
            name
            read
            write
          }
          isAdmin
        }
      }
    }`
  },
  tools: {
    getuploadurls: gql`query getUploadUrls($filenames:[String!]!){
      getUploadUrls(filenames:$filenames){
        urls
      }
    }`,
    getscenelibrariesfromstoryboard: gql`query getSceneLibrariesFromStoryboard($storyboardId:String!){
      getSceneLibrariesFromStoryboard(storyboardId:$storyboardId){
        sceneLibraries
      }
    }`
  }
}

export default queries;