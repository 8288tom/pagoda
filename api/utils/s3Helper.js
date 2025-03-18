// const { fromEnv } = require("@aws-sdk/credential-provider-env");
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, CopyObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { responseHandler } = require('../utils/globalHelpers');
const { ApolloError } = require("apollo-server");

const s3Client = new S3Client({
    region: 'us-east-1',
    credentials: {
        secretAccessKey: process.env.PAGODA_USER_SECRET_KEY,
        accessKeyId: process.env.PAGODA_USER_KEY
    },
    logger: {
        warn: () => { }

    }
});


async function checkAndCreateFolder(bucket, folderPath) {
    if (!folderPath.endsWith('/')) {
        folderPath += '/';
    }
    if (!bucket || !folderPath) {
        return responseHandler(false, "Bucket or Path for folder is missing")
    }

    const params = {
        Bucket: bucket,
        Prefix: folderPath,
        Delimiter: '/',
        MaxKeys: 100
    };

    try {
        const data = await s3Client.send(new ListObjectsV2Command(params));
        // Checks if directory doesn't exist, create empty directory if it does not
        if (data.KeyCount === 0) {
            //The potential folder that will be created are with the accountID and provided hash
            console.log("Folder does not exist, creating folder at:", folderPath)
            const data = await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: folderPath, Body: '' }))
            return responseHandler(true, "Folder created successfully")
        }
        //Checks if directory exists and has children
        if (data.CommonPrefixes?.length > 0 || data.KeyCount >= 1) {
            return responseHandler(true, "Folder exist")
        }
        //In case both validations fail, return below
        return responseHandler(false, "Folder does not exist and was not created")

    } catch (e) {
        console.error("Error checking/creating folder in S3", e.message);
        return responseHandler(false, e.message)
    }
}

async function copyFolderContents(bucket, sourceFolderPath, destinationFolderPath) {
    // console.log(`Source copy path:${sourceFolderPath}, Destination copy path:${destinationFolderPath}`)

    //Validation + formatting paths
    if (!bucket || !sourceFolderPath || !destinationFolderPath) {
        return responseHandler(false, "Bucket or folder paths are missing");
    }
    if (!sourceFolderPath.endsWith('/')) {
        sourceFolderPath += '/';
    }
    if (!destinationFolderPath.endsWith('/')) {
        destinationFolderPath += '/';
    }


    const listParams = {
        Bucket: bucket,
        Prefix: sourceFolderPath,
    };

    try {
        // List all objects in the source directory
        const listData = await s3Client.send(new ListObjectsV2Command(listParams));
        if (listData.KeyCount === 0) {
            console.log(`Source folder is empty or does not exist, s3 path: ${sourceFolderPath}`)
            return responseHandler(false, `Source folder is empty or does not exist. Check with support about this path:${sourceFolderPath}`);
        }

        // Copy objects to the destination directory
        const copyPromises = listData.Contents.map(async (object) => {
            const copyParams = {
                Bucket: bucket,
                CopySource: `${bucket}/${object.Key}`,
                Key: object.Key.replace(sourceFolderPath, destinationFolderPath),
                MetadataDirective: 'COPY', // Preserve metadata and permissions
                ACL: 'public-read'
            };
            await s3Client.send(new CopyObjectCommand(copyParams));
        });

        // Wait for all copy operations to complete
        await Promise.all(copyPromises);
        console.log(`Copying objects from: ${sourceFolderPath} to ${destinationFolderPath}`)
        return responseHandler(true, "Folder contents copied successfully");
    } catch (e) {
        console.error("Error copying folder contents in S3", e);
        return responseHandler(false, e.message);
    }
}

async function generatePresignedUrl(bucket, filename, folderName, isPublic) {
    try {
        const command = new PutObjectCommand({ Bucket: bucket, ACL: isPublic ? 'public-read' : 'private', Key: `${folderName}/${filename}`, Metadata: { filename } });
        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (e) {
        throw new ApolloError(`Error generating presignedUrl for ${filename}.\n${e}`)
    }
}

async function listAndGetObjectsFromBucket(bucket, folderName) {
    const data = await s3Client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: folderName }))
    const contents = data.Contents || [];
    if (contents.length === 0) {
        // Handle case where there are no objects
        return [];
    }

    const s3KeysArray = contents.map(obj => obj.Key)
    s3KeysArray.shift() //remove first item because it's just a prefix (folder name)
    const audioFilesPromises = [];

    for (const key in s3KeysArray) {
        audioFilesPromises.push(s3Client.send(new GetObjectCommand({ Bucket: bucket, Prefix: folderName, Key: s3KeysArray[key] })))
    }
    try {
        const s3Response = await Promise.all(audioFilesPromises);
        return s3Response.map(res => (
            { body: res.Body, type: res.ContentType, metadata: res.Metadata }
        ))
    } catch (e) {
        throw new ApolloError(`Error retrieving some or all of the objects from S3 ${e}`)
    }
}







module.exports = { checkAndCreateFolder, copyFolderContents, generatePresignedUrl, listAndGetObjectsFromBucket }