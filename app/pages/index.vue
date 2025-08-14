<script setup>
import { ref } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const api = useApi();
const route = useRoute();
const currentEvents = ref([]);
const loading = ref(false);
const checks = ref([]);
const calendarRef = ref(null); // reference to calendar
const allChecks = ref([]);
const showEventModal = ref(false);
const selectedCheck = ref(null);
const users = ref([]);
const collegeId = computed(() => route.query.id); // Default to current ID if not in URL
const errorMessage = ref("");
const isValidId = ref(false);

const handleEventClick = (clickInfo) => {
  const eventId = +clickInfo.event.id;

  selectedCheck.value = {
    ...allChecks.value.find((check) => check.id === eventId),
    ...users.value.find((item) => item.id === eventId),
  };

  if (selectedCheck.value) {
    showEventModal.value = true;
  } else {
    console.warn("No matching check found for event ID:", eventId);
  }
};

const handleEvents = (events) => {
  currentEvents.value = events;
};

const calendarOptions = reactive({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay",
  },
  initialView: "dayGridMonth",
  initialEvents: checks,
  editable: false,
  selectable: false,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  eventClick: handleEventClick,
  eventsSet: handleEvents,
});

const totalAmount = computed(() =>
  allChecks.value
    .reduce((sum, item) => sum + parseFloat(item.c_check_amount || 0), 0)
    .toFixed(2)
);

const fetchList = async () => {
  try {
    loading.value = true;
    const response = await api(`/collage_ap/${collegeId.value}/checks`);
    if (response?.success) {
      const events =
        response?.data?.map((item) => ({
          id: item.id,
          title: item.c_user_name,
          start: item.c_check_date,
        })) || [];

      checks.value = events;
      allChecks.value = response?.data;
    } else if (!response?.success) {
      errorMessage.value = response?.msg || "Org not found";
      isValidId.value = false;
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    loading.value = false;
  }
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await api(`/collage_ap/${collegeId.value}/users`); // Call it as a function
    if (response?.success) {
      users.value = response?.c_users;
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
  } finally {
    loading.value = false;
  }
};

// Run again whenever the ID changes
watch(collegeId, async (newId) => {
  if (newId) {
    await fetchUsers();
    await fetchList();
  }
});

onMounted(async () => {
  if (collegeId.value) {
    await fetchUsers();
    await fetchList();
  }
});
</script>

<template>
  <div v-if="loading" class="h-full flex items-center justify-center pt-10">
    <BaseSpinner :show-loader="loading" size="md" />
  </div>

  <div v-else-if="errorMessage">{{ errorMessage }}</div>
  <template v-else>
    <div class="flex flex-col font-sans text-sm max-w-7xl mx-auto p-6 lg:px-8">
      <div class="flex flex-col">
        <div class="flex justify-between items-center pb-5">
          <p class="text-xl font-bold">Checks Calendar View</p>
          <p class="text-base font-medium">Total Amount: ${{ totalAmount }}</p>
        </div>
        <div class="flex-grow overflow-auto">
          <FullCalendar
            ref="calendarRef"
            class="bg-white md:h-[700px] p-2"
            :options="{ ...calendarOptions, weekends: weekendsVisible }"
          >
            <template #eventContent="arg">
              <b>{{ arg.timeText }}</b>
              <i>{{ arg.event.title }}</i>
            </template>
          </FullCalendar>
        </div>
      </div>
    </div>
  </template>
  <UModal v-model:open="showEventModal" :title="'Check Details'">
    <template #body>
      <UCard>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-600">Name</span>
            <p class="text-gray-900">
              {{ selectedCheck.c_user_name || "N/A" }}
            </p>
          </div>
          <div>
            <span class="font-medium text-gray-600">Email</span>
            <p class="text-gray-900">
              {{ selectedCheck.c_user_email || "N/A" }}
            </p>
          </div>
          <div>
            <span class="font-medium text-gray-600">Phone</span>
            <p class="text-gray-900">
              {{ selectedCheck.c_user_phone || "N/A" }}
            </p>
          </div>
          <div>
            <span class="font-medium text-gray-600">Address</span>
            <p class="text-gray-900">
              {{ selectedCheck.c_user_address || "N/A" }}
            </p>
          </div>
          <div>
            <span class="font-medium text-gray-600">Agreed Amount</span>
            <p class="text-gray-900">
              ${{ selectedCheck.agreed_amount || "N/A" }}
            </p>
          </div>
          <div>
            <span class="font-medium text-gray-600">Check Amount</span>
            <p class="text-gray-900">
              ${{ selectedCheck.c_check_amount || "N/A" }}
            </p>
          </div>
          <div>
            <span class="font-medium text-gray-600">Check Date</span>
            <p class="text-gray-900">
              {{ selectedCheck.c_check_date || "N/A" }}
            </p>
          </div>
          <div>
            <span class="font-medium text-gray-600">Check Status</span>
            <p class="text-gray-900">
              {{ selectedCheck.c_check_status || "N/A" }}
            </p>
          </div>
          <div>
            <span class="font-medium text-gray-600">Memo</span>
            <p class="text-gray-900">
              {{ selectedCheck.check_memo || "N/A" }}
            </p>
          </div>
          <div>
            <span class="font-medium text-gray-600">Payee</span>
            <p class="text-gray-900">
              {{ selectedCheck.c_check_payee || "N/A" }}
            </p>
          </div>
          <div>
            <span class="font-medium text-gray-600">Account Year</span>
            <p class="text-gray-900">
              {{ selectedCheck.c_check_account_year }}
            </p>
          </div>
        </div>
      </UCard>
    </template>
  </UModal>
</template>
