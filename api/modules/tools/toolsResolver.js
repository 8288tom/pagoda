const { generatePresignedUrl, checkAndCreateFolder, listAndGetObjectsFromBucket } = require("../../utils/s3Helper")
const { streamToBuffer } = require('../../utils/globalHelpers');
const { ApolloError } = require('apollo-server-lambda');
const { File } = require('node:buffer');
const JSZip = require('jszip');
const { checkPermissions } = require('../../utils/authorization');

const { v4: uuidv4 } = require('uuid');
const BUCKET = "t.idomoo.com"

const resolvers = {
    Query: {
        getUploadUrls: async (_, { filenames }, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'tools', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)
            throw new ApolloError('TRANSCRIPTION DISABLED FOR DEMO', 403)

            const urlsPromises = []

            const folderHash = uuidv4();
            const checkAndCreate = await checkAndCreateFolder(BUCKET, folderHash);

            if (!checkAndCreate.success) {
                throw new ApolloError(checkAndCreate.message)
            }

            for (const filename in filenames) {
                urlsPromises.push(generatePresignedUrl(BUCKET, filenames[filename], folderHash, false))
            }

            try {
                const presignedUrlsArray = await Promise.all(urlsPromises)
                console.log(`${user.email} uploading ${filenames.length} files to ${BUCKET}/${folderHash}/`)
                return { urls: presignedUrlsArray }
            } catch (e) {
                console.error("Error creating presignedUrls", e)
                throw new ApolloError("Error creating presignedUrls", e)
            }
        },
        getSceneLibrariesFromStoryboard: async (_, { storyboardId }, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'tools', 'read');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)
            try {
                const sceneLibrariesArr = await dataSources.MongoDB.getSceneLibrariesFromStoryboard(storyboardId.toString())
                const sceneLibrariesInt = sceneLibrariesArr.map(sl => parseInt(sl))
                return { sceneLibraries: sceneLibrariesInt }
            } catch (e) {
                console.error("Error extracting Scene Library IDs from Storyboard", e)
                throw new ApolloError("Error extracting Scene Library IDs from Storyboard - check logs")
            }

        }
    },
    Mutation: {
        transcribeAudios: async (_, { input }, { dataSources, user }) => {
            const isAuthorized = checkPermissions(user.email, user.permissions, 'tools', 'write');
            if (!isAuthorized) throw new ApolloError('User is not authorized', 403)
            throw new ApolloError('TRANSCRIPTION DISABLED FOR DEMO', 403)


            const { s3folder, lang } = input;

            const audioFilesDataArray = await listAndGetObjectsFromBucket(BUCKET, s3folder);
            const transcriptionPromises = [];
            const transcFileNames = []

            for (const audio of audioFilesDataArray) {
                const fileNameWithExtension = audio.metadata.filename;
                const regex = new RegExp(/\.[^/.]+$/);
                const fileName = fileNameWithExtension.replace(regex, "") + '-' + lang;

                const fileBuffer = await streamToBuffer(audio.body);
                const file = new File([fileBuffer], fileNameWithExtension, { type: audio.type });

                transcriptionPromises.push(dataSources.ExternalAPI.transcribeAudioFiles(file, lang));
                transcFileNames.push(fileName);
            }

            try {
                const transcriptionData = await Promise.all(transcriptionPromises);
                const formattedTranscriptions = await modifyTranscription(transcriptionData)

                const zip = new JSZip();
                for (let i = 0; i < formattedTranscriptions.length; i++) {
                    zip.file(`${transcFileNames[i]}.txt`, formattedTranscriptions[i]) //matching filenames to transcription
                }
                const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
                const uploadUrl = await generatePresignedUrl(BUCKET, "transcriptions.zip", s3folder, true)

                const uploadResponse = await dataSources.ExternalAPI.uploadToS3(uploadUrl, zipContent);

                if (uploadResponse.statusText !== 'OK') {
                    console.error("Failed to upload zip to S3", uploadResponse)
                    throw new ApolloError("Failed upload zip to S3")
                }

                console.log(`${user.email} used transcription on ${transcFileNames.length} audio files`)
                return { zipFileUrl: `https://s3.us-east-1.amazonaws.com/${BUCKET}/${s3folder}/transcriptions.zip` }
            } catch (e) {
                console.error("Error creating transcriptions", e)
                throw new ApolloError("Error creating transcriptions", e)
            }
        }
    }

}


async function modifyTranscription(rawTranscriptionArray) {
    return rawTranscriptionArray.map((string) => {
        const lines = string.split('\n');
        const modifiedLines = lines.slice(2).map(line => line.includes('-->') ? '//' + line : line);
        return modifiedLines.join('\n')
    })
}

module.exports = resolvers