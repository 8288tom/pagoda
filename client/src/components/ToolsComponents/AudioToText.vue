<template>
  <Card class="audio-to-text-card shadow">
    <CardTitle>Audio To Text     
    </CardTitle>
    <CardBody>
      <ComboBox
        :data-items="languages"
        v-model="lang"
        :allow-custom="true"
        :required="true"
        :label="'Language'"
        :fill-mode="null"
        class="custom-dropdown flex"
        :validityStyles="false"
      >
      </ComboBox>
      <p>
        Make sure to use a
        <a
          href="https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes#Table"
          target="_blank"
          >ISO-639-1</a
        >
        supported format like in the options above.
      </p>
      <Upload
        :multiple="true"
        :autoUpload="false"
        :restrictions="{
          allowedExtensions: ['.wav', '.mp3'],
          maxFileSize: 10000000, //10mb each file
        }"
        @add="onSelectAudioFiles"
        :validate-file="setValidationMessage"
        :showFileList="true"
        :withCredentials="false"
        :disabled="isUploadDisabled"
        :showActionButtons="false"
      >
      </Upload>

      <div class="status" v-show="status">
        {{ status }}
      </div>
      <div class="errors-container flex" v-if="errorMessages.length > 0">
        <div class="errors flex">
          <div class="flex" v-for="(message, index) in errorMessages" :key="index">
            <span>{{ message.name }}</span>
            <span>{{ message.validation }}</span>
          </div>
        </div>
      </div>
    </CardBody>
    <CardSubtitle>
      <p>
        Select the two-letter abbreviation to append the text file
        ("audio1-<strong>de</strong>.txt"). Upload the audio files to genereate txt files
        with caption timing.
      </p>
      <p>
        It is your responsibility to ensure the output captions are correct, accurate and
        up to Idomoo's standards.
      </p>

      <p><br /><strong>Up to 20MB total</strong></p>

      <span
        >See supported languages
        <a
          target="_blank"
          rel="noreferrer"
          href="https://github.com/openai/whisper#available-models-and-languages"
          >here.</a
        >
      </span>
      <br>
      <GitSvgLink class="svg" text="Click the logo to see the component's backend code!" link="https://github.com/8288tom/pagoda/blob/main/api/modules/tools/toolsResolver.js"></GitSvgLink>
    </CardSubtitle>
  </Card>
</template>

<script setup>
import { Card, CardTitle, CardBody, CardSubtitle } from "@progress/kendo-vue-layout";
import GitSvgLink from "../misc/GitSvgLink.vue";
import { Upload } from "@progress/kendo-vue-upload";
import { ref, computed } from "vue";
import { useApolloClient } from "@vue/apollo-composable";
import { useStore } from "vuex";
import { showNotification } from "@/utils/contextHelpers";
import { ComboBox } from "@progress/kendo-vue-dropdowns";
import queries from "@/utils/queries";
import mutations from "@/utils/mutations";
const languages = ["en", "de", "cn", "fr", "jp", "ro", "ar", "he", "ru", "th", "sp"];

const { client: apolloClient } = useApolloClient();
const uploadQuery = queries.tools.getuploadurls;
const store = useStore();
const lang = ref(null);
const status = ref(null);
const files = ref([]);
const errorMessages = ref([]);
const fileNames = ref([]);
const uploadUrls = ref([]);
const uploadFolder = ref("");

async function onSelectAudioFiles(e) {
  errorMessages.value = [];
  let accFileSizes = null;
  for (let i = 0; i < e.affectedFiles.length; i++) {
    if (e.affectedFiles[i].validationErrors[0]) {
      errorMessages.value.push({
        name: e.affectedFiles[i].name,
        validation: e.affectedFiles[i].validationErrors[0],
      });
    } else {
      accFileSizes += e.affectedFiles[i].size;
      files.value = e.affectedFiles;
    }
  }

  if (errorMessages.value.length > 0) return 0;
  if (accFileSizes > 20000000) {
    //20mb
    errorMessages.value = [
      { name: "All of the files", validation: `Size exceeded 20MB` },
    ];
    return 0;
  } else {
    const uploadedFileNames = e?.affectedFiles.map((file) => file.name);
    fileNames.value = uploadedFileNames;
    return await getUploadUrls();
  }
}

function setValidationMessage(file) {
  file.validationErrors = file.validationErrors || [];
}

async function getUploadUrls() {
  try {
    status.value = "Uploading...";
    const { data } = await apolloClient.query({
      query: uploadQuery,
      variables: { filenames: fileNames.value },
    });
    if (data) {
      uploadUrls.value = data.getUploadUrls.urls;
      const folderString = data.getUploadUrls.urls[0].split("/")[4];
      uploadFolder.value = folderString;
      await uploadFiles();
    }
  } catch (e) {
    clearState();
    console.error("Failed getting uploadUrls", e);
    showNotification(store, false, undefined, e.message);
  }
}

async function uploadFiles() {
  try {
    const uploadPromises = files.value.map((file, index) => {
      const rawFile = file.getRawFile();
      const presignedUrl = uploadUrls.value[index];
      return fetch(presignedUrl, {
        method: "PUT",
        body: rawFile,
        headers: {
          "Content-Type": rawFile.type,
        },
      }).then((response) => {
        if (!response.ok) {
          showNotification(
            store,
            false,
            undefined,
            `Upload failed for file ${file.name}: ${response.statusText}`
          );
          throw new Error(`Upload failed for file ${file.name}: ${response.statusText}`);
        }
      });
    });

    await Promise.all(uploadPromises);
    await transcribeFiles();
  } catch (error) {
    console.error("Error uploading files:", error);
    clearState();
    showNotification(store, false, undefined, error.message);
  }
}

async function transcribeFiles() {
  status.value = "Transcribing files...";
  const variables = {
    input: {
      s3folder: uploadFolder.value,
      lang: lang.value || "en",
    },
  };
  try {
    const { data } = await apolloClient.mutate({
      mutation: mutations.transcribeAudios,
      variables,
      fetchPolicy: "no-cache",
    });
    if (data?.transcribeAudios?.zipFileUrl) {
      return await downloadFiles(data.transcribeAudios.zipFileUrl);
    }
  } catch (e) {
    showNotification(store, false, undefined, `${e.message}`);
    console.error(e);
    clearState();
  }
}

async function downloadFiles(url) {
  try {
    status.value = "Downloading zipped files...";
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Failed to GET file from S3:", response.statusText);
      showNotification(store, false, undefined, response.statusText);
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "transcriptions.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke the URL to free up memory
    window.URL.revokeObjectURL(downloadUrl);
    clearState();
    return;
  } catch (e) {
    console.error("Failed to download file:", e);
    showNotification(store, false, undefined, e.message);
  }
}

function clearState() {
  status.value = null;
  files.value = [];
  fileNames.value = [];
  uploadUrls.value = [];
  uploadFolder.value = "";
}

const isUploadDisabled = computed(() => {
  return !(lang.value && !status.value);
});
</script>

<style scoped>
.k-card-subtitle {
  font-size: 15px;
  text-align: left;
}

.audio-to-text-card {
  padding: 10px;
  width: 540px;
}

.custom-dropdown {
  margin-bottom: 20px;
}

.errors-container {
  flex-direction: column;
  border: 1px solid #77777735;
  max-height: 100px;
  overflow-y: auto;
  overflow-x: hidden;
}
.svg{
    padding-left:15px;

  }
  
.errors {
  color: var(--alert-500);
  flex-direction: column;
  flex-wrap: wrap;
  align-content: baseline;

  div {
    padding: 0 20px;
    width: 100%;
    margin-top: 5px;
    justify-content: space-between;

    span:first-child {
      padding-right: 50px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

}
</style>
