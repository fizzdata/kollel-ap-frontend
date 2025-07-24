<script setup>
import { object, string, number } from "yup";
import { DateFormatter, getLocalTimeZone } from "@internationalized/date";

const api = useApi();
const toast = useToast();
const loading = ref(false);
const showModal = ref(false);
const isSubmitting = ref(false);
const open = ref(false);
const checks = ref([]);
const df = new DateFormatter("en-US", {
  dateStyle: "medium",
});

// Form state
const form = ref({
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
  memo: string(),
  date: string().required("Date is required"),
  year: string().required("Year is required"),
});

const state = reactive({ ...form.value });

const onSubmit = async (event) => {
  isSubmitting.value = true;

  try {
    const response = await api(`/collage_ap/31674439/create/check`, {
      method: "POST",
      body: event.data,
      header: {
        "x-csrf-token": "MWKf5MzznFD5yIWb907whODwIIwPcYoyf2YGzFIw",
      },
    });

    if (response?.success) {
      toast.add({
        title: "Success",
        description: "Check created successfully",
        color: "green",
      });
      showModal.value = false;
      resetForm();
      await fetchList();
    } else if (response?._data?.message) {
      toast.add({
        title: "Failed",
        description: response._data.message,
        color: "red",
      });
    } else {
      toast.add({
        title: "Unexpected Response",
        description: "Something went wrong. Please try again.",
        color: "red",
      });
    }
  } catch (error) {
    console.error("Error creating check:", error);
    toast.add({
      title: "Error",
      description: "Failed to create check",
      color: "red",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  Object.assign(form.value, {
    user_id: "",
    payee: "",
    amount: null,
    memo: "",
    date: "",
    year: new Date().getFullYear().toString(),
  });
  Object.assign(state, form.value);
  showModal.value = true;
};

const fetchList = async () => {
  try {
    loading.value = true;
    const response = await api("/collage_ap/31674439/load");
    if (response?.success) {
      users.value = response.c_users || [];
      checks.value = response?.transaction || [];
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    loading.value = false;
  }
};

const editCheck = (check) => {
  console.log("🚀 ~ editCheck ~ check:", check);
};

const deleteCheck = (check) => {
  console.log("🚀 ~ deleteCheck ~ check:", check);
};

const columns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "c_user_name", header: "User Name" },
  { accessorKey: "agreed_amount", header: "Agreed Amount" },
  { accessorKey: "c_check_date", header: "Check Date" },
  { accessorKey: "c_check_amount", header: "Check Amount" },
  { accessorKey: "c_check_status", header: "Check Status" },
  { accessorKey: "c_check_account_year", header: "Account Year" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) =>
      h("div", { class: "flex gap-2 items-center" }, [
        // Tooltip with Edit Icon Button
        h(
          resolveComponent("UTooltip"),
          { text: "Edit User" },
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
          { text: "Delete User" },
          {
            default: () =>
              h(resolveComponent("UButton"), {
                icon: "i-heroicons-trash",
                size: "xs",
                color: "error",
                variant: "soft",
                onClick: () => deleteCheck(row.original.id),
              }),
          }
        ),
      ]),
  },
];

onMounted(async () => {
  await fetchList();
});
</script>

<template>
  <div class="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
    <UCard class="w-full">
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">Checks</h2>
          <UButton @click="resetForm">+ Add Check</UButton>
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
    :title="'Add New Check'"
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
                  {{
                    state.date
                      ? df.format(state.date.toDate(getLocalTimeZone()))
                      : "Select a date"
                  }}
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
            label="Save Check"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
