const { RESTDataSource } = require('apollo-datasource-rest')
const { OpenAI } = require("openai");
const { ApolloError } = require('apollo-server');
const fetch = require('node-fetch');


class ExternalAPI extends RESTDataSource {
    constructor() {
        super();
        this.openAI = new OpenAI();
    }

    async transcribeAudioFiles(file, language) {
        try {
            const transcription = await this.openAI.audio.transcriptions.create({
                file,
                language,
                model: "whisper-1",
                response_format: 'vtt'
            })
            return transcription
        } catch (e) {
            console.error(`Error sending request to openAI for transcription on file: ${file.name} \n${e}`)
            throw new ApolloError(`Error sending request to openAI for transcription \n${e}`)
        }
    }
    //upload to s3 using presign url (see s3Helper.js)
    async uploadToS3(url, body) {
        return await fetch(url, { //must use fetch instead of this.put to bypass JSON.stringy(body) 
            method: 'PUT',
            headers: {
                'Content-Type': 'application/zip'
            },
            body
        })
    }



}

module.exports = { ExternalAPI }