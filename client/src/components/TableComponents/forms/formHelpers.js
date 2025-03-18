import mutations from '@/utils/mutations';


const newSFTPEndpoints = ['sftp-in-us.idomoo.com', 'sftp-ir.idomoo.com', 's-8d4c5dba02cc4e619.server.transfer.us-west-2.amazonaws.com']
const oldSFTPEndpoints = ['sftp-eur.idomoo.com', 'sftp-usa.idomoo.com', 'sftp-k-ir.idomoo.com', 'sftp-k-us.idomoo.com']

const formMap = {
    accounts: { edit: 'AccForm', credits: 'CreditsForm' },
    storages: { edit: 'StorageForm', create: 'StorageForm' },
    users: { edit: 'UserForm' },
    scenelibraries: { changeowner: 'SimpleForm' },
    storyboards: { copy: 'SimpleForm', update: 'SimpleForm' },
    landingpages: { copy: 'SimpleForm' },
    outputconfigs: { copy: 'SimpleForm', create: 'OutputConfigForm' }
}

const storageValidationMessages = {
    user: "User cannot be empty",
    account: "Account must be a number and cannot be empty",
    port: "Port must be a number",
    name: "Name cannot be empty",
    password: "Password cannot be empty",
    secretKey: "Secret Key cannot be empty",
    storageType: "Must choose type"
}
const userValidationMessages = {
    firstName: "First Name cannot be empty",
    lastName: "Last Name cannot be empty",
    email: "Email is invalid"
}

function transformInputStringToArray(val) {
    const seperatedValues = val.split(',')
    let assocAccountArray = [];
    for (let i = 0; i < seperatedValues.length; i++) {
        seperatedValues[i] = parseInt(seperatedValues[i])
    }
    assocAccountArray.push(...seperatedValues)
    return [...new Set(assocAccountArray)]
}

const betaFeaturesOptions = { features: [] };

const hostingPeriodOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 15, 20, 25, 30, 45, 60, 75, 90, 120, 150, 180, 360, 365]


function mapToMutation(formType, action) {
    let mutation;

    switch (formType) {
        case 'scenelibraries':
            mutation = mutations.changeSLOwner;
            break;
        case 'storyboards':
            switch (action) {
                case 'update':
                    mutation = mutations.updateStoryboard;
                    break;
                case 'copy':
                    mutation = mutations.copyStoryboard;
                    break;
                default:
                    console.warn(`Unhandled action for storyboards: ${action}`);
                    break;
            }
            break;
        case 'storages':
            switch (action) {
                case 'edit':
                    mutation = mutations.updateStorage;
                    break;
                case 'create':
                    mutation = mutations.createStorage
                    break;
                default:
                    console.warn(`Unhandled action for storages: ${action}`)
                    break;
            }
            break;
        case 'landingpages':
            mutation = mutations.copyLandingPage;
            break;
        case 'users':
            switch (action) {
                case 'update':
                    mutation = mutations.updateUser
                    break;
                case 'remove':
                    mutation = mutations.removeFromUser;
                    break;
                default:
                    console.warn(`Unhandled action for users: ${action}`)
                    break;
            }
            break;
        case 'accounts':
            switch (action) {
                case 'edit':
                    mutation = mutations.updateAccount
                    break;
                case 'credits':
                    mutation = mutations.updateAccountCredits;
                    break;
                case 'remove':
                    mutation = mutations.removeFromAccount;
                    break;
                default:
                    console.warn(`Unhandled action for accounts: ${action}`)
                    break;
            }
            break;
        case 'outputconfigs':
            switch (action) {
                case 'copy':
                    mutation = mutations.copyOutputConfig
                    break;
                case 'create':
                    mutation = mutations.createOutputConfig;
                    break;
                default:
                    console.warn(`Unhandled action for outputconfigs: ${action}`)
                    break;
            }
            break;
        case 'admin':
            switch (action) {
                case 'update':
                    mutation = mutations.updatePermissions;
                    break;
                case 'delete':
                    mutation = mutations.deleteEmployee;
                    break;
                case 'add':
                    mutation = mutations.addEmployee;
                    break;
                default:
                    console.warn(`Unhandled action for admin: ${action}`);
                    break;
            }
            break;
    }
    return mutation
}

// Helper function to process string of numbers
function getValidArrayOfNumbers(associatedAccounts, asString = false) {
    const accountsUnfiltered = transformInputStringToArray(associatedAccounts);
    const accountIds = accountsUnfiltered.filter((val) => !Number.isNaN(val));
    return asString ? accountIds.map((acc) => acc.toString()) : accountIds;
}
function isValidEmail(email) {
    // Regular expression for basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}
export { formMap, newSFTPEndpoints, oldSFTPEndpoints, storageValidationMessages, userValidationMessages, transformInputStringToArray, mapToMutation, getValidArrayOfNumbers, isValidEmail, betaFeaturesOptions, hostingPeriodOptions }