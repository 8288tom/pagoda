<template>
  <div class="action-header flex">
    <KInput
      v-model="inputValue"
      :rounded="'large'"
      :placeholder="'email@idomoo.com'"
      :label="'Search or Add'"
      :style="{ width: '220px' }"
    />

    <KButton
      :fill-mode="'outline'"
      class="action-buttons"
      @click="searchEmail"
      :disabled="isLoading"
      :svg-icon="searchIcon"
      >Search
    </KButton>
    <KButton
      :fill-mode="'outline'"
      class="action-buttons"
      @click="addUser"
      :disabled="isLoading || !isEmail"
      :svg-icon="plusIcon"
      >Add User
    </KButton>
    <div class="button-loader-container">
      <Loader :size="'medium'" :type="'converging-spinner'" v-if="isLoading"></Loader>
    </div>
  </div>
  <div class="expansion-wrapper">
    <div>
      <ExpansionPanel
        v-for="(panel, index) in userData"
        :title="panel.email"
        :subtitle="'Click to edit and view permissions'"
        :expanded="expanded[panel._id]"
        :tab-index="index"
        :key="panel._id"
        @action="(ev) => controlPanel(ev, panel._id)"
      >
        <Reveal :appear="expanded[panel._id]">
          <ExpansionPanelContent v-if="expanded[panel._id]">
            <div class="grid-wrapper">
              <Grid
                :columns="gridColumns"
                :data-items="panel.permissions"
                :edit-field="'inEdit'"
                @itemchange="itemChange"
              >
              </Grid>
            </div>

            <Checkbox
              class="grid-buttons"
              :checked="panel.isAdmin"
              :label="'Is Admin'"
              @change="isAdminChange"
            >
            </Checkbox>
            <KButton
              @click="savePermissions"
              :fill-mode="'outline'"
              class="grid-buttons"
              :disabled="isLoading"
              :svg-icon="checkIcon"
              >Save</KButton
            >
            <KButton
              @click="deleteUser"
              :fill-mode="'outline'"
              class="grid-buttons"
              :disabled="isLoading"
              :svg-icon="minusIcon"
              :theme-color="'error'"
            >
              Delete</KButton
            >
          </ExpansionPanelContent>
        </Reveal>
      </ExpansionPanel>
    </div>
  </div>
</template>

<script>
import { ExpansionPanel, ExpansionPanelContent } from "@progress/kendo-vue-layout";
import { Reveal } from "@progress/kendo-vue-animation";
import { Grid } from "@progress/kendo-vue-grid";
import { ref, onMounted, computed } from "vue";
import queries from "@/utils/queries";
import { useQuery } from "@vue/apollo-composable";
import { Button as KButton } from "@progress/kendo-vue-buttons";
import { useApolloClient } from "@vue/apollo-composable";
import { mapToMutation } from "@/components/TableComponents/forms/formHelpers";
import { showNotification } from "@/utils/contextHelpers";
import { useStore } from "vuex";
import { isValidEmail } from "@/components/TableComponents/forms/formHelpers";
import { Input as KInput, Checkbox } from "@progress/kendo-vue-inputs";
import { filterBy } from "@progress/kendo-data-query";
import { Loader } from "@progress/kendo-vue-indicators";
import { searchIcon, plusIcon, minusIcon, checkIcon } from "@progress/kendo-svg-icons";
export default {
  components: {
    ExpansionPanel,
    ExpansionPanelContent,
    Reveal,
    Grid,
    KInput,
    Checkbox,
    KButton,
    Loader,
  },
  setup() {
    const expanded = ref([]);
    const userData = ref([]);
    const editItem = ref(undefined);
    const editId = ref(null);
    const editField = ref(undefined);
    const inputValue = ref("");
    const templateDoc = ref([]);
    const isLoading = ref(false);
    const store = useStore();
    const { client: apolloClient } = useApolloClient();
    const query = queries.admin.getemployees;
    let originalUserData; //used by filterBy in order to preserve all users for filterting, gets updated by getUsers;

    const gridColumns = [
      { field: "name", title: "Type", editable: false },
      { field: "read", title: "Read", editable: true, editor: "boolean" },
      { field: "write", title: "Write", editable: true, editor: "boolean" },
    ];
    //eslint-disable-next-line
    const { result, refetch } = useQuery(query);

    onMounted(async () => {
      getUsers();
    });

    const openedUserId = computed(() => {
      return Object.keys(expanded.value)[0];
    });
    const isEmail = computed(() => {
      if (inputValue.value) return isValidEmail(inputValue.value);
      return false;
    });

    function updateUiToCheckboxs() {
      userData.value.forEach((user) =>
        user.permissions.forEach((permission) => (permission.inEdit = true))
      );
    }

    function searchEmail() {
      if (inputValue.value === "") getUsers();
      userData.value = originalUserData;
      const filterResult = filterBy(userData.value, {
        logic: "or",
        filters: [{ field: "email", operator: "contains", value: inputValue.value }],
      });
      userData.value = filterResult;
    }

    function controlPanel(event, itemId) {
      let expandedItems = expanded.value.slice();
      userData.value.forEach((user) =>
        user.permissions.forEach((permission) => (permission.inEdit = true))
      );
      //eslint-disable-next-line
      expandedItems = expandedItems.map((element) => (element = false));
      expandedItems[itemId] = !expanded.value[itemId];
      expanded.value = expandedItems;
    }
    function itemChange(e) {
      e.dataItem[e.field] = e.value;
    }

    function isAdminChange(e) {
      const openUserObject = userData.value.find((obj) => obj._id === openedUserId.value);
      openUserObject.isAdmin = e.value;
    }

    async function addUser() {
      const variables = {
        input: { email: inputValue.value.toLowerCase(), ...templateDoc.value },
      };
      try {
        controlPanel(undefined, openedUserId.value);
        isLoading.value = true;
        const { data } = await apolloClient.mutate({
          mutation: mapToMutation("admin", "add"),
          variables,
          fetchPolicy: "no-cache",
        });
        if (!data.addEmployee.success) {
          isLoading.value = false;
          showNotification(store, false, undefined, data.addEmployee.message);
          return;
        }
        showNotification(store, true, data.addEmployee.message);
        await getUsers();
        isLoading.value = false;
      } catch (e) {
        isLoading.value = false;
        showNotification(store, false, undefined, `Error adding user ${e.message}`);
      }
    }

    async function deleteUser() {
      const variables = { input: { _id: openedUserId.value } };
      try {
        isLoading.value = true;
        const { data } = await apolloClient.mutate({
          mutation: mapToMutation("admin", "delete"),
          variables,
          fetchPolicy: "no-cache",
        });
        if (!data.deleteEmployee.success) {
          isLoading.value = false;
          showNotification(store, false, undefined, data.deleteEmployee.message);
          return;
        }
        showNotification(store, true, data.deleteEmployee.message);
        await getUsers();
        isLoading.value = false;
      } catch (e) {
        isLoading.value = false;
        showNotification(store, false, undefined, `Error deleting user ${e.message}`);
      }
    }

    async function savePermissions() {
      const originalUserObject = userData.value.find(
        (obj) => obj._id === openedUserId.value
      );
      const userObject = JSON.parse(JSON.stringify(originalUserObject));
      userObject.permissions.forEach((permission) => {
        delete permission.inEdit;
      });
      delete userObject.email;
      const variables = { input: userObject };

      try {
        isLoading.value = true;
        const { data } = await apolloClient.mutate({
          mutation: mapToMutation("admin", "update"),
          variables,
          fetchPolicy: "no-cache",
        });
        if (!data.updatePermissions.success) {
          isLoading.value = false;
          showNotification(store, false, undefined, data.updatePermissions.message);
          return;
        }
        controlPanel(undefined, openedUserId.value);

        showNotification(store, true, data.updatePermissions.message);
        isLoading.value = false;
      } catch (e) {
        isLoading.value = false;
        console.error("Error submitting form", e);
        showNotification(store, false, undefined, `Error submitting form ${e.message}`);
      }
    }
    async function getUsers() {
      try {
        isLoading.value = true;
        await refetch();
        updateUiToCheckboxs();
        const formattedData = JSON.parse(JSON.stringify(result.value.getEmployees.data)); // json manipulation to prevent object is not exstensible errors
        const cleanedData = formattedData.map((user) => {
          delete user.__typename;
          user.permissions.forEach((permission) => delete permission.__typename);
          return user;
        });
        const template = cleanedData.find(
          (obj) => obj._id === "671897ecbaf8b45cfa6973ba"
        ); // finding template for the pagoda_users collection
        if (template) {
          delete template.email;
          delete template._id;
          delete template.isAdmin;
          templateDoc.value = template;
          const templateIndex = cleanedData.indexOf(template);
          cleanedData.splice(templateIndex, 1);
        }
        originalUserData = cleanedData;
        userData.value = cleanedData;
        isLoading.value = false;
      } catch (e) {
        isLoading.value = false;

        console.error(e);
        showNotification(store, false, undefined, e.message);
      }
    }

    return {
      expanded,
      userData,
      editField,
      editItem,
      editId,
      gridColumns,
      controlPanel,
      savePermissions,
      deleteUser,
      inputValue,
      isValidEmail,
      addUser,
      isEmail,
      searchEmail,
      isAdminChange,
      isLoading,
      itemChange,
      searchIcon,
      plusIcon,
      minusIcon,
      checkIcon,
    };
  },
};
</script>

<style scoped>
.expansion-wrapper,
.grid-wrapper {
  margin: auto;
  width: 70%;
  overflow-y: auto;
  padding-bottom: 10px;
}

.action-header {
  margin: auto;
  align-items: center;
  justify-content: center;
}

.action-buttons {
  position: relative;
  top: 10px;
}

.action-buttons,
.grid-buttons {
  margin-left: 20px;
}

.expansion-wrapper {
  margin-top: 30px;
  height: 650px;
}

.checkbox-admin {
  position: relative;
  top: 22px;
}

.button-loader-container {
  margin-bottom: 20px;
}

:deep(.k-checkbox-md) {
  display: flex;
  width: 18px;
  height: 18px;
  margin: auto;
}

:deep(.k-expander-title),
:deep(.k-focus),
:deep(.k-floating-label) {
  color: var(--dark-400);
  box-shadow: none;
  text-transform: none;
}

:deep(.k-table-td),
:deep(.k-header) {
  text-align: center;
  justify-content: center;
  font-size: 15px;
  margin-left: auto;
}
</style>
