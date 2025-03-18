const { gql } = require("apollo-server-lambda");

const typeDefs = gql`
    type Query{
        initApp:InitAppResult!
        getEmployees:EmployeesResult!
    }

    type Mutation{
        addEmployee(input:AddEmployee):MutationResponse!
        deleteEmployee(input:DeleteEmployee):MutationResponse!
        updatePermissions(input:UpdatePermissions):MutationResponse!
        addPermissionToDB(input:AddPermissionsToDb):MutationResponse!
    }

    input AddEmployee{
        email:String!
        permissions:[PermissionInput!]!
    }
    
    input DeleteEmployee{
        _id:ID!
    }

    input UpdatePermissions{
        _id:ID!
        permissions:[PermissionInput!]!
        isAdmin:Boolean
    }
    input AddPermissionsToDb{
        permissionName:String!
    }

    type Employee{
        _id:ID!
        email:String!
        permissions:[Permission!]!
        isAdmin:Boolean
    }
    type Permission{
        name:String
        read:Boolean!
        write:Boolean!
    }
    type EmployeesResult{
        data:[Employee!]!
        count:Int
    }
    type DocCount{
        account:Int
        storyboard:Int
        canvas:Int
        scene_library:Int
        imsscene:Int
        workspaces:Int

    }

    type InitAppResult{
        betaFeatures:[String!]!
        user:Employee!
        docCount:DocCount
    }

    input PermissionInput{
        name:String!
        read:Boolean!
        write:Boolean!
    }
`


module.exports = typeDefs;