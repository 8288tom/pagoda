const { ApolloError } = require("apollo-server-lambda");
const elasticQueries = require('./elasticQueries.json');


const resolvers = {
    Query: {
        initApp: async (_, args, { dataSources, user }) => {
            if (!user.email) throw new ApolloError('User not found', 400);
            const betaFeatures = dataSources.MongoDB.filterCollectionForMultiple('beta_features', {}, { projection: { beta_features: 1 } });
            const pagodaUser = dataSources.MongoDB.filterCollectionForMultiple('pagoda_users', { type: 'user', email: user.email });
            const docCount = dataSources.MongoDB.getEstimatedDocCountForCollections(['account', 'storyboard', 'canvas', 'scene_library', 'workspaces', 'imsscene'])
            const result = await Promise.all([betaFeatures, pagodaUser, docCount]);
            const resultObject = { betaFeatures: result[0].data[0].beta_features, user: result[1].data[0], docCount: result[2] }
            return resultObject
        },
        getElasticResults: async (_, args, { dataSources, user }) => {
            if (!user.email) throw new ApolloError('User not found', 400);
            const { env } = args;

            if (env.toLowerCase() === 'us') {
                const companiesUS = dataSources.Elastic.searchDataUS(elasticQueries.rendersByCompany)
                const totalRendersUS = dataSources.Elastic.searchDataUS(elasticQueries.totalRenders)
                const topBatchesByCompanyUS = dataSources.Elastic.searchDataUS(elasticQueries.topBatches)
                const result = await Promise.all([companiesUS, topBatchesByCompanyUS, totalRendersUS])
                const formattedCompaniesUS = formatResult(result[0])
                const formattedBatchesUS = formatResult(result[1]);
                return {
                    US: {
                        companiesBreakdown: formattedCompaniesUS,
                        topBatches: formattedBatchesUS,
                        totalRenders: result[2].value
                    },
                    EU: {}
                }
            }
            if (env.toLowerCase() === 'eu') {
                const companiesEU = dataSources.Elastic.searchDataEU(elasticQueries.rendersByCompany)
                const totalRendersEU = dataSources.Elastic.searchDataEU(elasticQueries.totalRenders)
                const topBatchesByCompanyEU = dataSources.Elastic.searchDataEU(elasticQueries.topBatches)
                const result = await Promise.all([companiesEU, topBatchesByCompanyEU, totalRendersEU])
                const formattedCompaniesEU = formatResult(result[0])
                const formattedBatchesEU = formatResult(result[1]);
                return {
                    EU: {
                        companiesBreakdown: formattedCompaniesEU,
                        topBatches: formattedBatchesEU,
                        totalRenders: result[2].value
                    },
                    US: {}
                }
            }

            else throw new ApolloError("Env doesn't exist")
        }

    }
}

function formatResult(elasticResponse) {
    return elasticResponse.buckets.map((item) => {
        const value = item['1'].value;
        const companyName = item.key;
        return { companyName, value }
    })

}

module.exports = resolvers;