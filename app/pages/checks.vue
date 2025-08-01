<script setup>
import { object, string, number } from "yup";
import { CalendarDate } from "@internationalized/date";

const api = useApi();
const toast = useToast();
const route = useRoute();
const loading = ref(false);
const showModal = ref(false);
const isSubmitting = ref(false);
const open = ref(false);
const checks = ref([]);
const showDeleteConfirmModal = ref(false);
const printLoadingStates = ref({});
const collegeId = computed(() => route.params.id || "10869442"); // Default to current ID if not in URL

// Form state
const form = ref({
  id: null,
  user_id: "",
  payee: "",
  amount: null,
  memo: "",
  date: "",
  year: new Date().getFullYear().toString(),
});

// Users list for dropdown
const users = ref([]);

// Validation schema
const schema = object({
  user_id: string().required("User is required"),
  payee: string().required("Payee is required"),
  amount: number()
    .transform((value) => (isNaN(value) ? undefined : value)) // Transform empty strings to undefined
    .required("Amount is required")
    .positive("Amount must be positive"),
  memo: string().nullable(),
  date: string().required("Date is required"),
  year: string().required("Year is required"),
});

const state = reactive({ ...form.value });

const onSubmit = async (event) => {
  isSubmitting.value = true;

  const endpoint = form.value.id
    ? `/collage_ap/${collegeId.value}/check/${form.value.id}`
    : `/collage_ap/${collegeId.value}/check`;
  const method = form.value.id ? "PUT" : "POST";

  delete event.data.id;

  try {
    const response = await api(endpoint, {
      method: method,
      body: event.data,
    });

    if (response?.success) {
      toast.add({
        title: "Success",
        description:
          response.msg || form.value.id
            ? "Check updated successfully"
            : "Check created successfully",
        color: "success",
        duration: 2000,
      });
      showModal.value = false;
      form.value.id = null;
      resetForm();
      await fetchList();
    } else if (response?._data?.msg) {
      toast.add({
        title: "Failed",
        description: response._data.msg,
        color: "error",
      });
    } else {
      toast.add({
        title: "Unexpected Response",
        description: "Something went wrong. Please try again.",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Error creating check:", error);
    toast.add({
      title: "Error",
      description: "Failed to create check",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
    showModal.value = false;
  }
};

const resetForm = () => {
  Object.assign(form.value, {
    id: null,
    user_id: "",
    payee: "",
    amount: null,
    memo: "",
    date: "",
    year: new Date().getFullYear().toString(),
  });
  Object.assign(state, form.value);
};

const editCheck = (check) => {
  form.value.id = check.check_id;
  state.user_id = check.id;
  state.payee = check.c_check_payee;
  state.amount = check.c_check_amount;
  state.memo = check.check_memo;

  // Convert the YYYY-MM-DD string to a CalendarDate object
  if (check.c_check_date) {
    const [year, month, day] = check.c_check_date.split("-").map(Number);
    state.date = new CalendarDate(year, month - 1, day); // month is 0-indexed in CalendarDate
  } else {
    state.date = "";
  }

  state.year = check.c_check_account_year;

  showModal.value = true;
};

const deleteCheck = (check) => {
  form.value.id = check.check_id;
  showDeleteConfirmModal.value = true;
};

const onDeleteConfirm = async () => {
  if (!form.value.id) return;
  isSubmitting.value = true;

  try {
    const response = await api(
      `/collage_ap/${collegeId.value}/check/${form.value.id}`,
      {
        method: "DELETE",
      }
    );

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response?.msg || "Check deleted successfully",
        color: "success",
        duration: 2000,
      });
      await fetchList();
      form.value.id = null;
      showDeleteConfirmModal.value = false;
    } else {
      toast.add({
        description:
          response?.msg ||
          response?.message ||
          response?._data?.msg ||
          "Failed to delete check. Please try again later.",
        color: "error",
        duration: 2000,
      });
      showDeleteConfirmModal.value = false;
    }
  } catch (error) {
    console.error("Delete failed:", error);
    toast.add({
      title: "Error",
      description: "Something went wrong. Please try again later.",
      color: "error",
      duration: 2000,
    });
  } finally {
    isSubmitting.value = false;
    showDeleteConfirmModal.value = false;
  }
};

const columns = [
  { accessorKey: "c_user_name", header: "User Name" },
  { accessorKey: "agreed_amount", header: "Agreed Amount" },
  { accessorKey: "c_check_date", header: "Check Date" },
  { accessorKey: "c_check_amount", header: "Check Amount" },
  { accessorKey: "c_check_status", header: "Check Status" },
  { accessorKey: "c_check_account_year", header: "Account Year" },
  { accessorKey: "check_memo", header: "Check Memo" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) =>
      h("div", { class: "flex gap-2 items-center" }, [
        // Tooltip with Edit Icon Button
        h(
          resolveComponent("UTooltip"),
          { text: "Edit Check" },
          {
            default: () =>
              h(resolveComponent("UButton"), {
                icon: "i-heroicons-pencil-square",
                size: "xs",
                color: "success",
                variant: "soft",
                onClick: () => editCheck(row.original),
              }),
          }
        ),

        // Tooltip with Delete Icon Button
        h(
          resolveComponent("UTooltip"),
          { text: "Delete Check" },
          {
            default: () =>
              h(resolveComponent("UButton"), {
                icon: "i-heroicons-trash",
                size: "xs",
                color: "error",
                variant: "soft",
                onClick: () => deleteCheck(row.original),
              }),
          }
        ),
        // Tooltip with Print Icon Button
        h(
          resolveComponent("UTooltip"),
          { text: "Print Check" },
          {
            default: () =>
              h(resolveComponent("UButton"), {
                icon: printLoadingStates.value[row.original.check_id]
                  ? "i-heroicons-arrow-path"
                  : "i-heroicons-printer",
                loading: printLoadingStates.value[row.original.check_id],
                size: "xs",
                color: "info",
                variant: "soft",
                onClick: () => printCheck(row.original),
                disabled: printLoadingStates.value[row.original.check_id],
              }),
          }
        ),
      ]),
  },
];

// Add this new function to handle printing
const printCheck = async (check) => {
  try {
    printLoadingStates.value[check.check_id] = true;

    const response = await api(
      `/collage_ap/${collegeId.value}/check/${check.check_id}/print`,
      {
        method: "POST",
      }
    );

    if (response.success && response.pdf) {
      // Create a Blob from the base64 PDF
      const byteCharacters = atob(response.pdf);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // Create a URL for the blob
      const fileURL = URL.createObjectURL(blob);

      // Open the PDF in a new tab
      const newWindow = window.open();
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Check #${check.check_id}</title>
            <style>
              @media print {
                @page { margin: 0; }
                body { 
                  margin: 0;
                  padding: 0;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .no-print { 
                  display: none !important; 
                }
                .print-only { 
                  display: block !important; 
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                }
                iframe { 
                  width: 100%;
                  height: 100%;
                  border: none;
                }
              }
              @media screen {
                body, html { 
                  margin: 0; 
                  padding: 0; 
                  height: 100%;
                  overflow: hidden;
                }
                .print-only {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-only">
              <iframe src="${fileURL}"></iframe>
            </div>
            
            <iframe class="no-print" src="${fileURL}" style="width:100%; height:100vh; border:none;"></iframe>
            
            <script>
              // Auto-print when the PDF is loaded
              window.onload = function() {
                // Optional: Auto-print after a short delay
                // setTimeout(() => window.print(), 500);
              };
            <\/script>
          </body>
        </html>
      `);
      newWindow.document.close();

      // Clean up the URL object when the window is closed
      newWindow.onbeforeunload = function () {
        URL.revokeObjectURL(fileURL);
      };
    } else {
      throw new Error(response?._data?.[0] || "Failed to generate PDF");
    }
  } catch (error) {
    console.error("Print error:", error);
    toast.add({
      description:
        error.message || "Failed to print check. Please try again later.",
      color: "error",
      duration: 5000,
    });
  } finally {
    // Clear loading state when done
    printLoadingStates.value[check.check_id] = false;
  }
};

const fetchList = async () => {
  try {
    loading.value = true;
    const response = await api(`/collage_ap/${collegeId.value}/checks`);
    if (response?.success) {
      checks.value = response?.data || [];
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    loading.value = false;
  }
};

const fetchUsers = async () => {
  try {
    const response = await api(`/collage_ap/${collegeId.value}/users`); // Call it as a function
    if (response?.success) {
      users.value = response?.c_users;
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
  }
};

onMounted(async () => {
  await fetchList();
  await fetchUsers();
});
</script>

<template>
  <div class="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
    <UCard class="w-full">
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">Checks</h2>
          <UButton
            @click="
              () => {
                resetForm();
                showModal = true;
              }
            "
          >
            + Add Check
          </UButton>
        </div>
      </template>

      <UTable
        :data="checks"
        :columns="columns"
        :loading="loading"
        class="flex-1"
      />
    </UCard>
  </div>

  <!-- Add/Edit check modal -->
  <UModal
    v-model:open="showModal"
    :title="form.id ? 'Update Check' : 'Add New Check'"
    :dismissible="false"
  >
    <template #body>
      <UForm :schema="schema" :state="state" @submit="onSubmit">
        <div class="border-b pb-4 border-gray-200">
          <div class="grid md:grid-cols-2 gap-4">
            <UFormField label="User" name="user_id">
              <USelect
                v-model="state.user_id"
                :items="
                  users?.map((u) => ({ value: u.id, label: u.c_user_name }))
                "
                placeholder="Select user"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Payee" name="payee">
              <UInput
                v-model="state.payee"
                placeholder="Enter payee name"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Amount" name="amount">
              <UInput
                v-model="state.amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Date" name="date">
              <UPopover v-model:open="open">
                <UButton
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-calendar"
                  class="w-full"
                >
                  {{ state.date || "Select a date" }}
                </UButton>

                <template #content>
                  <UCalendar
                    v-model="state.date"
                    class="p-2 w-full"
                    @click="open = false"
                  />
                </template>
              </UPopover>
            </UFormField>

            <UFormField label="Year" name="year">
              <UInput v-model="state.year" type="number" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Memo" name="memo" class="mt-4">
            <UTextarea
              v-model="state.memo"
              placeholder="Add any notes..."
              class="w-full"
            />
          </UFormField>
        </div>
        <div class="flex justify-end gap-3 mt-3">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancel"
            @click="showModal = false"
          />
          <UButton
            type="submit"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            :label="form.id ? 'Update' : 'Create'"
          />
        </div>
      </UForm>
    </template>
  </UModal>

  <UModal
    v-model:open="showDeleteConfirmModal"
    title="Confirm Delete"
    :dismissible="false"
  >
    <template #body>
      <p class="text-sm text-gray-600 border-b pb-4 border-gray-200">
        Are you sure you want to delete this check? This action cannot be
        undone.
      </p>

      <div class="flex justify-end gap-2 mt-3">
        <UButton
          color="neutral"
          variant="outline"
          @click="showDeleteConfirmModal = false"
        >
          Cancel
        </UButton>
        <UButton
          color="error"
          variant="solid"
          @click="onDeleteConfirm"
          :loading="isSubmitting"
          :disabled="isSubmitting"
        >
          Delete
        </UButton>
      </div>
    </template>
  </UModal>
</template>
