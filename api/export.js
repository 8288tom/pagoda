const storyboardResolver = require('./modules/storyboard/storyboardResolver')
const storyboardSchema = require('./modules/storyboard/storyboardSchema')
const accountSchema = require('./modules/account/accountSchema')
const accountResolver = require('./modules/account/accountResolver')
const userSchema = require('./modules/user/userSchema')
const userResolver = require('./modules/user/userResolver')
const landingPageSchema = require('./modules/landingPage/landingPageSchema')
const landingPageResolver = require('./modules/landingPage/landingPageResolver')
const storageSchema = require('./modules/storage/storageSchema')
const storageResolver = require('./modules/storage/storageResolver')
const outputConfigSchema = require('./modules/outputConfig/outputConfigSchema')
const outputConfigResolver = require('./modules/outputConfig/outputConfigResolver')
const sceneLibrarySchema = require('./modules/sceneLibrary/scenelibrarySchema')
const sceneLibraryResolver = require('./modules/sceneLibrary/scenelibraryResolver')
const adminResolver = require('./modules/adminstration/adminResolver');
const adminSchema = require('./modules/adminstration/adminSchema');
const homeSchema = require('./modules/home/homeSchema')
const homeResolver = require('./modules/home/homeResolver')
const toolsSchema = require('./modules/tools/toolsSchema')
const toolsResolver = require('./modules/tools/toolsResolver')
const aiAdsSchema = require('./modules/aiAds/aiAdsSchema')
const aiAdsResolver = require('./modules/aiAds/aiAdsResolver')

const enums = require('./modules/enums')

const globalSchema = require('./modules/globalSchema')

const resolvers = [storyboardResolver, accountResolver, userResolver, landingPageResolver, storageResolver, outputConfigResolver, sceneLibraryResolver, adminResolver, homeResolver, toolsResolver, aiAdsResolver]
const typeDefs = [globalSchema, enums, storyboardSchema, accountSchema, userSchema, landingPageSchema, storageSchema, outputConfigSchema, sceneLibrarySchema, adminSchema, homeSchema, toolsSchema, aiAdsSchema]

module.exports.resolvers = resolvers;
module.exports.typeDefs = typeDefs;

