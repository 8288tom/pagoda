<template>
    <div class="table-container">
        <div class="flex">
            <TableActionButtons
                @onButtonClick="openForm"
                :buttontype="tabletype"
                :clickable="areButtonsClickable"
            />
            <div class="right-side">
                <KButton
                    :svg-icon="arrowRotateCcwIcon"
                    :rounded="'large'"
                    :fill-mode="'outline'"
                    :theme-color="'secondary'"
                    @click="refreshItems"
                    :disabled="loader"
                >
                </KButton>
                <DropDownButton
                    :svg-icon="exportIcon"
                    :items="exportOptions"
                    :text-field="'actionName'"
                    :text="'Export'"
                    @itemclick="onExportItemClick"
                    :rounded="'medium'"
                    :theme-color="'secondary'"
                    :fill-mode="'outline'"
                    :disabled="loader"
                >
                </DropDownButton>
            </div>
        </div>
        <pdfexport ref="gridPdfExport" :fileName="`${tabletype}_${currentDate}`">
            <Grid
                style="height: 76dvh; min-width: 100%"
                :data-items="tableItems"
                :total="totalDocs"
                :filterable="true"
                :filter="filter"
                :columns="tableColumns"
                :skip="skip"
                :loader="loader"
                :pageable="pageable"
                :page-size="pageSizeValue"
                :take="pageSizeValue"
                :selected-field="'selected'"
                :resizable="true"
                @filterchange="filterChange"
                @pagechange="pageChangeHandler"
                @rowclick="onRowClick"
                @rowdblclick="onRowDblClick"
                @columnreorder="columnReorder"
            >
                <template v-slot:filterInput="{ props }">
                    <FilterInput
                        :grid-props="props"
                        :send-filtered-query="sendFilteredQuery"
                        :loading="loader"
                    />
                </template>

                <template v-slot:filterDropdown="{ props }">
                    <FilterDropdown
                        :grid-props="props"
                        :table-type="tabletype"
                        :send-filtered-query="sendFilteredQuery"
                        :loading="loader"
                    />
                </template>

                <template v-slot:filterDate>
                    <FilterDate
                        @changeSort="updateSort"
                        :send-filtered-query="sendFilteredQuery"
                        :loading="loader"
                    />
                </template>

                <template v-slot:logoCell="{ props }">
                    <CellLogo :grid-props="props" />
                </template>
            </Grid>
        </pdfexport>
    </div>
    <TableDialog
        v-if="selectedButton && tabletype"
        v-model:visible="showDialog"
        :action-type="selectedButton"
        :form-type="tabletype"
        :data="queryResultSingle"
        :selected-id="selectedID"
    >
        <component
            :is="getFormComponent"
            :action-type="selectedButton"
            :form-type="tabletype"
            :selected-id="selectedID"
            :form-data="selectedButton !== 'create' ? queryResultSingle : {}"
            v-model:visible="showDialog"
            @refetchList="handleFormChange"
        />
    </TableDialog>
    <GitSvgLink style="margin:auto;" text="You can see the frontend code by clicking the logo! ---->" link="https://github.com/8288tom/pagoda/tree/main/client/src/components/TableComponents"></GitSvgLink>

</template>

<script>
import { ref, computed, onUnmounted, onMounted, onBeforeUnmount } from "vue";
import GitSvgLink from "@/components/misc/GitSvgLink.vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import { Grid } from "@progress/kendo-vue-grid";
import { Input, Checkbox } from "@progress/kendo-vue-inputs";
import { SvgIcon } from "@progress/kendo-vue-common";
import {
    searchIcon,
    exportIcon,
    filePdfIcon,
    fileExcelIcon,
    arrowRotateCcwIcon,
} from "@progress/kendo-svg-icons";
import { useQuery } from "@vue/apollo-composable";
import { GridPdfExport } from "@progress/kendo-vue-pdf";
import { saveExcel } from "@progress/kendo-vue-excel-export";
import TableActionButtons from "./TableActionButtons";
import TableDialog from "./DialogWindow";
import { formMap } from "../forms/formHelpers";
import { useApolloClient } from "@vue/apollo-composable";
import queries from "@/utils/queries";
import columns from "@/components/TableComponents/grid/tableColumns";
import { normalizeTimestamp } from "@/utils/generalUtilities";
import { showNotification } from "@/utils/contextHelpers";
import { Button as KButton, DropDownButton } from "@progress/kendo-vue-buttons";
import {
    AccForm,
    UserForm,
    SimpleForm,
    StorageForm,
    CreditsForm,
    OutputConfigForm,
} from "../forms/export.js";
import {
    FilterInput,
    FilterDropdown,
    FilterDate,
    CellLogo,
} from "./CellsAndFilters/export";

export default {
    name: "TableView",
    components: {
        Grid,
        KInput: Input,
        SvgIcon,
        Checkbox,
        GitSvgLink,
        KButton,
        TableActionButtons,
        TableDialog,
        AccForm,
        UserForm,
        StorageForm,
        CreditsForm,
        SimpleForm,
        OutputConfigForm,
        pdfexport: GridPdfExport,
        FilterInput,
        FilterDropdown,
        FilterDate,
        CellLogo,
        DropDownButton,
    },
    props: {
        tabletype: { required: true, type: String }, // accounts/users/storyboards/scenelibraries/storages/outputconfigs/landingpages
    },
    setup(props) {
        const { client: apolloClient } = useApolloClient();
        const store = useStore();
        const route = useRoute();

        const exportOptions = [
            { actionName: "Excel", svgIcon: fileExcelIcon },
            { actionName: "PDF", svgIcon: filePdfIcon },
        ];
        const queryKeySingular = `get${props.tabletype.slice(0, -1)}`;
        const formQuery = queries[props.tabletype]
            ? queries[props.tabletype][queryKeySingular]
            : null;

        const currentDateIso = new Date();
        const currentDate = currentDateIso.toLocaleDateString();
        // Reactive references
        const loader = ref(false);
        const filter = ref(null);
        const queryResultsList = ref([]);
        const queryResultSingle = ref("");
        const selectedID = ref("");
        const selectedEmail = ref("");
        const showDialog = ref(false);
        const selectedButton = ref("");
        const tableColumns = ref(columns[props.tabletype]);

        // Table Query variables
        const limit = ref(
            localStorage.tableLimit ? `LIMIT_${localStorage.tableLimit}` : "LIMIT_25"
        );
        const sort = ref(1);
        const queryFilter = ref([]);
        const gridPdfExport = ref(null);

        //Pagination variables
        const skip = ref(0);
        const pageSizeValue = ref(
            localStorage.tableLimit ? parseInt(localStorage.tableLimit) : 25
        );
        const queryKeyPlural = `get${props.tabletype}`;
        const listQuery = queries[props.tabletype]
            ? queries[props.tabletype][queryKeyPlural]
            : null;
        const totalDocs = ref(0);

        // eslint-disable-next-line
        const { result: listResult, refetch } = useQuery(listQuery, {
            limit: limit.value,
            offset: skip.value,
            sort: sort.value,
            id: null,
        });

        onMounted(() => {
            document.addEventListener("keydown", handleKeyDownEnter);
            if (queryResultsList.value.length === 0) {
                queryResultsList.value = [];
                sendUnfilteredQuery();
            }
        });
        onBeforeUnmount(() => {
            document.removeEventListener("keydown", handleKeyDownEnter);
        });
        onUnmounted(() => {
            queryResultSingle.value = {};
        });

        const tableItems = computed(() => {
            const result = queryResultsList.value.map((item) => {
                return {
                    ...item,
                    creationDate: item.creationDate
                        ? new Date(
                              normalizeTimestamp(Number(item.creationDate))
                          ).toLocaleDateString()
                        : item.creationDate,
                    lastModified: item.lastModified
                        ? new Date(
                              normalizeTimestamp(Number(item.lastModified))
                          ).toLocaleDateString()
                        : item.lastModified,
                    selected: item._id === selectedID.value,
                };
            });
            return result;
        });

        const pageable = computed(() => {
            return {
                pageSizes: [25, 50, 100],
                type: "numeric",
                previousNext: true,
                buttonCount: 5,
            };
        });

        const areButtonsClickable = computed(() => {
            return Boolean(selectedID.value && !loader.value);
        });

        const getFormComponent = computed(() => {
            let actionType;
            selectedButton.value === "change owner"
                ? (actionType = "changeowner")
                : (actionType = selectedButton.value);
            return formMap[props.tabletype][actionType] || null;
        });

        async function pageChangeHandler(ev) {
            if (loader.value) return;
            if (ev.event.value) {
                limit.value = `LIMIT_${ev.event.value}`;
                localStorage.setItem("tableLimit", JSON.stringify(ev.event.value));
                pageSizeValue.value = ev.event.value;
            }
            skip.value = ev.page.skip;
            sendUnfilteredQuery();
        }

        function filterChange(ev) {
            filter.value = ev.filter;
            let field = ev.filter.filters[0].field;
            let value = ev.filter.filters[0].value;
            const fieldIndex = queryFilter.value.findIndex(
                (queryObj) => queryObj.field === field
            ); //look for the field
            if (value === null || value === "") {
                queryFilter.value.splice(fieldIndex, 1); // Remove the filter if cleared
                route.params.filter = null;
            } else if (fieldIndex !== -1) {
                queryFilter.value[fieldIndex].value = value; // Update the value if it exists
            } else {
                queryFilter.value.push({ field, value }); // Otherwise, add the new filter
            }
        }

        async function sendUnfilteredQuery() {
            try {
                loader.value = true;
                store.commit("setLoading");
                const { data } = await refetch({
                    limit: limit.value,
                    offset: skip.value,
                    sort: sort.value,
                });
                const firstKey = Object.keys(data)[0];
                queryResultsList.value = data[firstKey].data;
                totalDocs.value = data ? data[firstKey].count : 0;
                loader.value = false;
                store.commit("setLoading");
            } catch (e) {
                console.error(`Error fetching data at pageChangeHandler ${e.message}`);
                showNotification(
                    store,
                    false,
                    undefined,
                    `Error fetching data for table ${e.message}`
                );
                loader.value = false;
                store.commit("setLoading");
            }
        }

        async function sendFilteredQuery() {
            try {
                loader.value = true;
                selectedID.value = "";
                selectedEmail.value = "";
                store.commit("setLoading");
                const { data } = await refetch({
                    limit: limit.value,
                    offset: 0,
                    sort: sort.value,
                    filters: queryFilter.value,
                });
                skip.value = 1;
                const firstKey = Object.keys(data)[0];
                queryResultsList.value = data ? data[firstKey].data : [];
                totalDocs.value = data ? data[firstKey].count : 0;
                loader.value = false;
                store.commit("setLoading");
            } catch (e) {
                console.error(`Error fetching data at sendFilteredQuery ${e}`);
                loader.value = false;
                store.commit("setLoading");
                showNotification(
                    store,
                    false,
                    undefined,
                    `Error fetching data for filteredQuery ${e.message}`
                );
            }
        }
        async function openFormRequest(query) {
            try {
                loader.value = true;
                const { data } = await apolloClient.query({
                    query,
                    variables: { id: selectedID.value },
                    fetchPolicy: "no-cache",
                });
                queryResultSingle.value = Object.values(data)[0];
                showDialog.value = true;
                loader.value = false;
            } catch (e) {
                console.error("Error loading single item", e);
                showNotification(store, false, undefined, e.message);
                showDialog.value = false;
                loader.value = false;
            }
        }

        async function refreshItems() {
            if (queryFilter.value.length > 0) {
                return sendFilteredQuery();
            }
            sendUnfilteredQuery();
        }

        async function handleFormChange() {
            queryFilter.value.length > 0 ? sendFilteredQuery() : sendUnfilteredQuery();
        }

        async function openForm(selectedButtonText) {
            queryResultSingle.value = {};
            selectedButton.value = selectedButtonText.toLowerCase();
            //condition to when we need data from the backend to open the form
            if (
                ["storages", "users", "accounts"].includes(props.tabletype) &&
                (selectedButton.value === "edit" || selectedButton.value === "credits")
            ) {
                openFormRequest(formQuery);
            } else {
                showDialog.value = true;
            }
        }

        function onExportItemClick(e) {
            e.item.actionName.toLowerCase() === "excel" ? exportExcel() : exportPDF();
        }

        function exportPDF() {
            gridPdfExport.value.save(tableItems.value);
        }

        function exportExcel() {
            saveExcel({
                data: tableItems.value,
                fileName: `${props.tabletype}_${currentDate}`,
                columns: tableColumns.value,
            });
        }
        function updateSort() {
            sort.value = -sort.value;
        }

        function columnReorder(options) {
            tableColumns.value = options.columns;
        }

        function onRowClick(ev) {
            if (props.tabletype === "users") {
                selectedEmail.value = ev.dataItem.email;
            }
            selectedID.value = ev.dataItem._id;
        }

        function onRowDblClick() {
            const actionMapByTableType = {
                accounts: "credits",
                users: "edit",
                storages: "edit",
                storyboards: "copy",
                outputconfigs: "copy",
                landingpages: "copy",
                scenelibraries: "change owner",
            };
            selectedButton.value = actionMapByTableType[props.tabletype];
            if (["storages", "users", "accounts"].includes(props.tabletype)) {
                openFormRequest(formQuery);
            } else {
                showDialog.value = true;
            }
        }

        function handleKeyDownEnter(e) {
            if (
                e.key === "Enter" &&
                route.path.split("/")[1] === props.tabletype &&
                !showDialog.value
            ) {
                //this validation is needed in order to not send requests for other open tabs
                sendFilteredQuery();
            }
        }

        return {
            loader,
            filter,
            tableColumns,
            filterChange,
            sendFilteredQuery,
            pageChangeHandler,
            pageSizeValue,
            pageable,
            skip,
            searchIcon,
            exportIcon,
            selectedID,
            tableItems,
            onRowClick,
            onRowDblClick,
            openForm,
            showDialog,
            selectedButton,
            getFormComponent,
            queryResultSingle,
            gridPdfExport,
            handleFormChange,
            totalDocs,
            updateSort,
            columnReorder,
            exportOptions,
            onExportItemClick,
            currentDate,
            areButtonsClickable,
            arrowRotateCcwIcon,
            refreshItems,
            GitSvgLink
        };
    },
};
</script>

<style scoped>
.right-side {
    margin-left: auto;
}

.right-side .k-dropdown-button {
    margin-left: 10px;
}

:deep(.k-input-outline) {
    background-color: var(--kendo-color-surface-primary, #fff) !important;
}

:deep(.k-pager-numbers .k-selected),
:deep(.k-loader-container) {
    z-index: 1;
}

:deep(.k-table-row) {
    cursor: pointer;
}

:deep(.k-filter-row) {
    cursor: auto;
}
</style>
