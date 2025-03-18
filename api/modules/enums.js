
const { gql } = require("apollo-server-lambda");

const typeDefs = gql`

enum LIMIT{
    LIMIT_5
    LIMIT_25
    LIMIT_50
    LIMIT_100
    NONE
}
enum FieldsToRemoveOptions{
    betaFeatures
    lp_subdomains
    permissions
    sceneLibrary
    associatedAccounts
    sceneLibraries
}`

module.exports = typeDefs
