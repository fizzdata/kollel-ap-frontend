<script setup>
import { object, string } from "yup";

const users = ref([]);
const isSubmitting = ref(false);
const showModal = ref(false);
const api = useApi();
const loading = ref(false);
const toast = useToast();

const form = ref({
  name: "",
  email: "",
  phone: "",
  address: "",
  agreed_amount: "",
});

// Validation schema
const schema = object({
  name: string().required("Name is required"),
  email: string().email("Invalid email").required("Email is required"),
  phone: string().required("Phone is required"),
  address: string().required("Address is required"),
  agreed_amount: string().required("Agreed amount is required"),
});

const state = reactive({ ...form.value });

const onSubmit = async (event) => {
  isSubmitting.value = true;

  const endpoint = `/collage_ap/31674439/create/user`;
  const method = "POST";

  try {
    const response = await api(endpoint, {
      method,
      body: event.data,
      headers: {
        "x-csrf-token": "MWKf5MzznFD5yIWb907whODwIIwPcYoyf2YGzFIw",
        "Content-Type": "application/json",
      },
    });

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response.msg || "User created successfully",
        color: "green",
      });
      await fetchUsers();
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
    console.error("Submission error:", error);
    toast.add({
      title: "Error",
      description: "An unexpected error occurred.",
      color: "red",
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
  showModal.value = true;
};

const editUser = (user) => {
  state.name = user.c_user_name;
  //   showModal.value = true;
};

const deleteUser = async (id) => {
  await $fetch(`/api/users/${id}`, { method: "DELETE" });
  toast.add({ title: "Deleted", description: "User deleted", color: "red" });
  await fetchUsers();
};

const columns = [
  { accessorKey: "id", header: "ID" },
  {
    accessorKey: "name",
    header: "Name",
    id: "name",
    cell: ({ row }) =>
      h("div", { class: "flex items-center gap-3" }, [
        h("div", undefined, [
          h(
            "p",
            { class: "font-medium text-highlighted" },
            row.original.c_user_name
          ),
        ]),
      ]),
  },

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
                onClick: () => deleteUser(row.original.id),
              }),
          }
        ),
      ]),
  },
];

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await api(`/collage_ap/31674439/load`); // Call it as a function
    if (response?.success) {
      console.log("🚀 ~ fetchUsers ~ response:", response);
      users.value = response?.c_users;
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchUsers();
});
</script>

<template>
  <div class="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
    <UCard class="w-full">
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">Users</h2>
          <UButton @click="resetForm">+ Add User</UButton>
        </div>
      </template>

      <!-- User Table -->
      <UTable
        :data="users"
        :columns="columns"
        :loading="loading"
        class="flex-1"
      />
    </UCard>
  </div>
  <!-- Modal for Add/Edit -->
  <UModal v-model:open="showModal" :title="'Create User'" :dismissible="false">
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
            label="Create"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
