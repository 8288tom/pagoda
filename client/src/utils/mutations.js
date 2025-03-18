import gql from "graphql-tag";

const mutations = {
    copyStoryboard: gql`
        mutation copyStoryboard($input: CopyInput!) {
            copyStoryboard(input: $input) {
                success
                message
            }
        }
    `,
    copyLandingPage: gql`
        mutation copyLandingPage($input: CopyInput!) {
            copyLandingPage(input: $input) {
                success
                message
            }
        }
    `,
    updateStoryboard: gql`
        mutation updateStoryboard($input: UpdateStoryboardInput!) {
            updateStoryboard(input: $input) {
                success
                message
            }
        }
    `,
    changeSLOwner: gql`
        mutation changeSceneLibraryOwner($_id: ID!, $newOwner: Int!) {
            changeSceneLibraryOwner(_id: $_id, newOwner: $newOwner) {
                success
                message
            }
        }
    `,
    createOutputConfig: gql`
        mutation createOutputConfig($accountId:ID!, $input:OutputConfigInput!){
            createOutputConfig(accountId:$accountId, input:$input){
                success
                message
            }
        }
    `,
    copyOutputConfig: gql`
        mutation copyOutputConfig($_id: ID!, $newOwner: Int!, $newName:String!) {
        copyOutputConfig(_id: $_id, newOwner: $newOwner, newName:$newName) {
                success
                message
            }
        }
   `,
    createStorage: gql`
    mutation createStorage($input: StorageInput!){
        createStorage(input: $input) {
                success
                message
        }
    }
   `,
    updateStorage: gql`
    mutation updateStorage($_id:ID! $input:StorageInput!){
        updateStorage(_id:$_id, input:$input){
            success
            message
        }
    }
   `,
    updateUser: gql`
        mutation UpdateUser($input: UpdateUserInput!) {
            updateUser(input: $input) {
                success
                message
            }
    }`,
    removeFromUser: gql`
        mutation removeFromUser($input: RemoveValInput!) {
            removeFromUser(input: $input) {
                success
                message
        }
      }`,
    updateAccount: gql`
        mutation updateAccount($input:UpdateAccountInput){
            updateAccount(input:$input){
                success
                message
            }
      }`,
    updateAccountCredits: gql`
        mutation updateCredits($input:UpdateAccountCredits){
            updateCredits(input:$input){
                success
                message
            }
        }
        `,
    removeFromAccount: gql`
        mutation removeFromAccount($input:RemoveValInput!){
            removeFromAccount(input:$input){
                success
                message
            }
        }
    `,
    updatePermissions: gql`
        mutation updatePermissions($input:UpdatePermissions){
            updatePermissions(input:$input){
                success
                message
            }
        }
    `,
    deleteEmployee: gql`
        mutation deleteEmployee($input:DeleteEmployee){
            deleteEmployee(input:$input){
                success
                message
            }
    }`,
    addEmployee: gql`
        mutation Mutation($input: AddEmployee) {
            addEmployee(input: $input) {
                success
                message
            }   
}`,
    transcribeAudios: gql`
    mutation transcribeAudios($input:AudioFilesMetadata!){
        transcribeAudios(input: $input){
            zipFileUrl
        }
    }`
};


export default mutations;
