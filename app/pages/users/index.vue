<script setup>
import { object, string } from "yup";

const api = useApi();
const route = useRoute();
const users = ref([]);
const isSubmitting = ref(false);
const showModal = ref(false);
const loading = ref(false);
const toast = useToast();
const showDeleteConfirmModal = ref(false);
const collegeId = computed(() => route.query.id);
const errorMessage = ref("");
const searchTerm = ref("");
const isValidId = ref(false);

const form = ref({
  id: null,
  name: "",
  email: "",
  phone: "",
  address: "",
  agreed_amount: "",
});

// Validation schema
const schema = object({
  name: string().required("Name is required"),
  email: string().email("Invalid email").nullable(),
  phone: string().nullable(),
  address: string().nullable(),
  agreed_amount: string().nullable(),
});

const state = reactive({ ...form.value });

const onSubmit = async (event) => {
  isSubmitting.value = true;

  const endpoint = state.id
    ? `/collage_ap/${collegeId.value}/user/${state.id}`
    : `/collage_ap/${collegeId.value}/user`;
  const method = state.id ? "PUT" : "POST";

  delete event.data.id;
  try {
    const response = await api(endpoint, {
      method: method,
      body: event.data,
    });

    if (response?.success) {
      showModal.value = false;
      toast.add({
        title: "Success",
        description: response?.msg
          ? response?.msg
          : state.id
          ? "User updated successfully"
          : "User created successfully",
        color: "success",
        duration: 2000,
      });
      state.id = null;
      await fetchUsers();
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
    console.error("Submission error:", error);
    toast.add({
      title: "Error",
      description: "An unexpected error occurred.",
      color: "error",
    });
  } finally {
    showModal.value = false;
    resetForm();
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  Object.assign(form.value, {
    id: null,
    name: "",
    email: "",
    phone: "",
    address: "",
    agreed_amount: "",
  });

  Object.assign(state, form.value);
};

const editUser = (user) => {
  form.value.id = user.id;
  state.id = user.id;
  state.name = user.c_user_name;
  state.email = user.c_user_email;
  state.phone = user.c_user_phone;
  state.agreed_amount = user.agreed_amount;
  state.address = user.c_user_address;
  showModal.value = true;
};

const deleteUser = (user) => {
  form.value.id = user.id;
  state.id = user.id;
  state.name = user.c_user_name;
  showDeleteConfirmModal.value = true;
};

const onDeleteConfirm = async () => {
  if (!state.id) return;
  isSubmitting.value = true;

  try {
    const response = await api(
      `/collage_ap/${collegeId.value}/user/${state.id}`,
      {
        method: "DELETE",
      }
    );

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response?.msg || "User deleted successfully",
        color: "success",
        duration: 2000,
      });
      await fetchUsers();

      state.id = "";
      state.name = "";
      showDeleteConfirmModal.value = false;
    } else {
      toast.add({
        description:
          response?.msg ||
          response?.message ||
          response?._data?.msg ||
          "Failed to delete user. Please try again later.",
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
  {
    accessorKey: "c_user_name",
    header: "Name",
    cell: ({ row }) =>
      h(
        resolveComponent("NuxtLink"),
        {
          to: `/users/${row.original.id}?collegeId=${collegeId.value}&name=${row.original.c_user_name}`, // dynamic route to user detail page
          class: "text-primary hover:underline cursor-pointer",
        },
        () => row.original.c_user_name
      ),
  },
  { accessorKey: "c_user_email", header: "Email" },
  { accessorKey: "c_user_phone", header: "Phone No." },
  { accessorKey: "c_user_address", header: "Address" },
  { accessorKey: "agreed_amount", header: "Agreed Amount" },
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
                onClick: () => editUser(row.original),
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
                onClick: () => deleteUser(row.original),
              }),
          }
        ),
      ]),
  },
];

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await api(`/collage_ap/${collegeId.value}/users`); // Call it as a function
    if (response?.success) {
      isValidId.value = true;

      users.value = response?.c_users;
    } else if (!response?.success) {
      isValidId.value = false;

      errorMessage.value = response?.msg || "Org not found";
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
  } finally {
    loading.value = false;
  }
};

// Add computed property to filter users based on search term
const filteredUsers = computed(() => {
  if (!searchTerm.value) return users.value;

  const term = searchTerm.value.toLowerCase();
  return users.value.filter((user) => {
    return (
      user.c_user_name?.toLowerCase().includes(term) ||
      user.c_user_email?.toLowerCase().includes(term) ||
      user.c_user_phone?.includes(term)
    );
  });
});

// Run again whenever the ID changes
watch(collegeId, async (newId) => {
  if (newId) {
    await fetchUsers();
  }
});

onMounted(async () => {
  if (collegeId.value) {
    await fetchUsers();
  }
});
</script>

<template>
  <div class="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
    <div v-if="loading" class="flex items-center justify-center pt-10 w-full">
      <BaseSpinner :show-loader="loading" size="md" />
    </div>
    <UCard v-else-if="isValidId" class="w-full">
      <template #header>
        <div
          class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
        >
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold">Users</h2>
            <UButton
              color="primary"
              icon="i-lucide-plus"
              class="flex sm:hidden"
              @click="
                () => {
                  resetForm();
                  showModal = true;
                }
              "
            >
              Add User
            </UButton>
          </div>

          <div class="flex justify-end items-center gap-4">
            <UInput
              v-model="searchTerm"
              icon="i-lucide-search"
              size="md"
              variant="outline"
              placeholder="Search..."
              class="w-full sm:w-fit"
              :ui="{ trailing: 'pe-1' }"
            >
              <template v-if="searchTerm?.length" #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  icon="i-lucide-circle-x"
                  aria-label="Clear input"
                  @click="searchTerm = ''"
                />
              </template>
            </UInput>
            <UButton
              color="primary"
              icon="i-lucide-plus"
              class="sm:flex hidden"
              @click="
                () => {
                  resetForm();
                  showModal = true;
                }
              "
            >
              Add User
            </UButton>
          </div>
        </div>
      </template>

      <!-- User Table -->
      <UTable
        :data="filteredUsers"
        :columns="columns"
        :loading="loading"
        class="flex-1"
      />
    </UCard>

    <div v-else>{{ errorMessage }}</div>
  </div>
  <!-- Modal for Add/Edit -->
  <UModal
    v-model:open="showModal"
    :title="form.id ? 'Edit User' : 'Create User'"
    :dismissible="false"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="grid md:grid-cols-2 gap-4 border-b pb-4 border-gray-200">
          <UFormField label="Name" name="name">
            <UInput
              v-model="state.name"
              placeholder="Enter Name"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Email" name="email">
            <UInput
              v-model="state.email"
              placeholder="Enter Email"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Phone" name="phone">
            <UInput
              v-model="state.phone"
              placeholder="Enter Phone Number"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Address" name="address">
            <UInput
              v-model="state.address"
              placeholder="Enter Address"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Agreed Amount" name="agreed_amount">
            <UInput
              v-model="state.agreed_amount"
              type="number"
              placeholder="Enter Agreed Amount"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
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
        Are you sure you want to delete this
        <strong> {{ state && state.name }}</strong>
        user? This action cannot be undone.
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
