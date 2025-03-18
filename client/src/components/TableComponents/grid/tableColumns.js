// "field" key must correspond to the key in the response from the backend
// for example: getAccounts[0].accountType === 'FullService' 
// Then, the key from the response is: "accountType" and the "field" for the column MUST be "accountType" to match.
const columns = {
    accounts: [
        { field: "logo", title: "Logo", width: '75px', filterCell: "filterInput", filterable: false, cell: "logoCell", minResizableWidth: 50 },
        { field: "_id", title: "ID", width: '105px', filterCell: "filterInput", minResizableWidth: 100 },
        { field: "firstName", title: "First name", filterCell: "filterInput", width: '130px', minResizableWidth: 100 },
        { field: "lastName", title: "Last name", filterCell: "filterInput", width: '150px', minResizableWidth: 100 },
        { field: "company", title: "Account name", filterCell: "filterInput", minResizableWidth: 100 },
        { field: "email", title: "Email", filterCell: "filterInput", width: '200px', minResizableWidth: 100 },
        { field: "region", title: "Region", width: '80px', filterCell: "filterDropdown", minResizableWidth: 100 },
        { field: "accountType", title: "Type", filterCell: "filterDropdown", width: '110px', minResizableWidth: 100 },
        { field: "creationDate", title: "Creation date", filterCell: "filterDate", width: '130px', minResizableWidth: 130 },
        { field: "credits", title: "Credits", width: '145px', filterCell: "filterInput", filterable: false, minResizableWidth: 100 },
        { field: "creditsThreshold", title: "Credits threshold", width: '130px', filterCell: "filterInput", filterable: false, minResizableWidth: 100 },
        { field: "userStatus", title: "API calls", width: '90px', filterCell: "filterDropdown", minResizableWidth: 100 },
        // { field: "webAccess", title: "Web access", width: '100px', filterCell: "filterInput" },
        { field: "maxConcurrencyAllowed", width: '110px', title: "Concurrency", filterCell: "filterInput", minResizableWidth: 100 }
    ],
    users: [
        { field: "_id", title: "ID", filterCell: "filterInput", minResizableWidth: 200 },
        { field: "account._id", title: "Main Account ID", filterCell: "filterInput", minResizableWidth: 100 },
        { field: "firstName", title: "First name", filterCell: "filterInput", minResizableWidth: 100 },
        { field: "lastName", title: "Last name", filterCell: "filterInput", minResizableWidth: 100 },
        { field: "email", title: "Email", filterCell: "filterInput", minResizableWidth: 100 },
        // { field: "creationDate", title: "Creation date", filterCell: "filterDate", width: '120px' } // doesn't work properly due to database schema
    ],
    storyboards: [
        { field: "_id", title: "ID", filterCell: "filterInput", width: '130px', minResizableWidth: 100 },
        { field: "accountId", title: "Account ID", filterCell: "filterInput", width: '130px', minResizableWidth: 100 },
        { field: "name", title: "Name", filterCell: "filterInput", minResizableWidth: 100 },
        { field: "hostingPeriod", title: "Hosting period", filterCell: "filterDropdown", minResizableWidth: 100 },
        { field: "creationDate", title: "Creation date", filterCell: "filterDate", width: '130px', minResizableWidth: 130 },
        { field: "lastModified", title: "Last modified", filterCell: "filterInput", filterable: false, minResizableWidth: 100 }
        // { field: "lock", title: "Locked", filterCell: "filterDropdown" }
    ],
    scenelibraries: [
        { field: "_id", title: "ID", filterCell: "filterInput", minResizableWidth: 100 },
        { field: "accountId", title: "Account ID", filterCell: "filterInput", minResizableWidth: 100 },
        { field: "name", title: "Name", filterCell: "filterInput", width: '350px', minResizableWidth: 100 },
        { field: "scenes", title: "Scenes", filterCell: "filterInput", minResizableWidth: 100 },
        { field: "creationDate", title: "Creation date", filterCell: "filterDate", width: '130px', minResizableWidth: 130 }
    ],
    storages: [
        { field: "_id", title: "ID", filterCell: "filterInput", minResizableWidth: 100 },
        { field: "accountId", title: "Account ID", filterCell: "filterInput", minResizableWidth: 100 },
        { field: "type", title: "Type", filterCell: "filterDropdown", width: '100px', minResizableWidth: 100 },
        { field: "name", title: "Name", filterCell: "filterInput", minResizableWidth: 100 },
        { field: "credentials.serverUrl", title: "Server URL", filterCell: "filterInput", filterable: true, minResizableWidth: 100 },
        { field: "credentials.user", title: "User", filterCell: "filterInput", filterable: true, minResizableWidth: 100 },
        { field: "creationDate", title: "Creation date", filterCell: "filterDate", width: '130px', minResizableWidth: 130 }
    ],
    outputconfigs: [
        { field: "_id", title: "ID", filterCell: "filterInput", width: '130px', minResizableWidth: 100 },
        { field: "accountId", title: "Account ID", filterCell: "filterInput", width: '130px', minResizableWidth: 100 },
        { field: "name", title: "Name", filterCell: "filterInput", minResizableWidth: 100 },
        { field: "creationDate", title: "Creation date", filterCell: "filterDate", width: '130px', minResizableWidth: 130 },
        { field: "output.video", title: "Video", filterCell: "filterInput", filterable: false, minResizableWidth: 100 },
        { field: "output.jpg", title: "JPG", filterCell: "filterInput", filterable: false, minResizableWidth: 100 },
        { field: "output.gif", title: "GIF", filterCell: "filterInput", filterable: false, minResizableWidth: 100 },
        { field: "lastModified", title: "Last modified", filterCell: "filterInput", filterable: false, minResizableWidth: 100 }
    ],
    landingpages: [
        { field: "_id", title: "Page ID", filterCell: "filterInput", minResizableWidth: 100 },
        { field: "landingPageId", title: "Published LP ID", filterCell: "filterInput", width: '130px', minResizableWidth: 100 },
        { field: "accountId", title: "Account ID", filterCell: "filterInput", minResizableWidth: 100 },
        { field: "title", title: "Name", filterCell: "filterInput", minResizableWidth: 100 },
        // { field: "createdDate", title: "Creation date", width: '180px', filterable: false },
        { field: "lastModified", title: "Last modified", filterable: false, minResizableWidth: 100 },
        // { field: "lastPublishedDate", title: "Last published", filterable: false },
        { field: "publicUrl", title: "URL", filterCell: "filterInput", minResizableWidth: 100 }
    ]
}



export default columns;