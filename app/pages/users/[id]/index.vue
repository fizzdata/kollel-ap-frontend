<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const userId = computed(() => route.params.id); // from /user/:id/checks
const api = useApi();
const collegeId = route.query.collegeId; // assuming passed in URL

const checks = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const searchTerm = ref("");
const statusFilter = ref("All");
const userName = ref("");

const fetchList = async () => {
  try {
    loading.value = true;
    const response = await api(`/collage_ap/${collegeId}/checks`);

    if (response?.success) {
      // Filter by userId
      checks.value = (response?.data || []).filter(
        (check) => String(check.id) === String(userId.value)
      );
      userName.value = route.query.name || "Unknown User";
    } else {
      errorMessage.value = response?.msg || "No checks found";
    }
  } catch (err) {
    console.error("Error fetching checks:", err);
    errorMessage.value = "Error loading checks";
  } finally {
    loading.value = false;
  }
};

const filteredChecks = computed(() => {
  return checks.value.filter((check) => {
    const matchesSearch =
      check.c_check_payee
        ?.toLowerCase()
        .includes(searchTerm.value.toLowerCase()) ||
      check.check_memo?.toLowerCase().includes(searchTerm.value.toLowerCase());

    const matchesStatus =
      statusFilter.value === "All" ||
      check.c_check_status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

const columns = [
  { accessorKey: "c_user_name", header: "User Name" },
  { accessorKey: "agreed_amount", header: "Agreed Amount" },
  { accessorKey: "c_check_date", header: "Check Date" },
  { accessorKey: "c_check_amount", header: "Check Amount" },
  { accessorKey: "c_check_status", header: "Check Status" },
  { accessorKey: "c_check_account_year", header: "Account Year" },
  { accessorKey: "check_memo", header: "Check Memo" },
];

onMounted(fetchList);
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center pt-10 w-full">
    <BaseSpinner :show-loader="loading" size="md" />
  </div>

  <div v-else class="max-w-7xl mx-auto p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <NuxtLink
        :to="`/users?id=${collegeId}`"
        class="text-sm text-blue-600 hover:underline"
      >
        ← Back to Users
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="flex flex-col md:flex-row gap-4 mb-6 justify-between">
      <h1 class="text-2xl font-bold">
        Checks for <span class="text-primary">{{ userName }}</span>
      </h1>

      <div class="flex justify-end items-center gap-4">
        <UInput
          v-model="searchTerm"
          icon="i-lucide-search"
          size="md"
          variant="outline"
          placeholder="Search..."
          :ui="{ trailing: 'pe-1' }"
          :disabled="filteredChecks.length === 0"
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

        <USelect
          v-model="statusFilter"
          :items="['All', 'Created', 'Cleared', 'Cancelled']"
          class="w-48"
          :disabled="filteredChecks.length === 0"
        />
      </div>
    </div>

    <!-- Table -->
    <div v-if="loading" class="text-gray-500 italic">Loading...</div>
    <div v-else-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>
    <div v-else-if="filteredChecks.length === 0" class="text-gray-500">
      No checks found.
    </div>

    <div v-else>
      <UTable
        :data="filteredChecks"
        :columns="columns"
        :loading="loading"
        class="flex-1"
      />
    </div>
  </div>
</template>
