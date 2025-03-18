

/**
 * Verifies user permissions.
 * @param {String} email - Email of the user given from context inherited from authroizer
 * @param {Array} permissions - Array of objects with the name of the entity, read and write (bool) values;
 * @param {String} resolverType - accounts/users/scenelibraries/outputconfigs....
 * @param {String} permissionType - should be either 'read' or 'write' to determine the permission on the resource.
 * @returns {Boolean}
 */
function checkPermissions(email, permissions, resolverType, permissionType) {
    if (!email) {
        console.log(`${email} not found, user is not authenticated`)
        console.log(`${email} not found, user tried to access resolvers: ${resolverType} Permission: ${permissionType}`)
        return false
    }
    const userResourcePermission = permissions.filter((permission) => permission.name === resolverType)[0]
    if (!userResourcePermission[permissionType.toLowerCase()]) {
        console.log(`${email} is not allowed to access the requested resource`);
        return false;
    }
    return true;
}


module.exports = { checkPermissions }