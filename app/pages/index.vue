<script setup>
import { ref } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const api = useApi();
const route = useRoute();
const currentEvents = ref([]);
const checks = ref([]);
const calendarRef = ref(null); // reference to calendar
const allChecks = ref([]);
const showEventModal = ref(false);
const selectedCheck = ref(null);
const users = ref([]);
const collegeId = computed(() => route.query.id);
const errorMessage = ref("");
const currentDateRange = ref({ start: "", end: "" });
const isFetching = ref(false);
const currentViewDate = ref(new Date());

const totalAmount = computed(() =>
  allChecks.value
    .reduce((sum, item) => sum + parseFloat(item.c_check_amount || 0), 0)
    .toFixed(2)
);

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

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const handleDates = async (dateInfo) => {
  try {
    let startDate, endDate;

    if (dateInfo.view.type === "dayGridMonth") {
      // Month view → whole month
      const viewDate = new Date(dateInfo.view.currentStart);
      viewDate.setDate(15);
      const startOfMonth = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth() + 1,
        0
      );
      startDate = formatDate(startOfMonth);
      endDate = formatDate(endOfMonth);
    } else {
      // Week or Day view → use the visible range directly
      startDate = formatDate(dateInfo.start);
      endDate = formatDate(dateInfo.end);
    }

    // Update the current view date (middle of visible range)
    currentViewDate.value = new Date(dateInfo.view.currentStart);
    isFetching.value = true;
    currentDateRange.value = { start: startDate, end: endDate };

    if (collegeId.value) {
      const response = await api(
        `/collage_ap/${collegeId.value}/checks?start_date=${startDate}&end_date=${endDate}`
      );

      if (response?.success) {
        const events =
          response?.data?.map((item) => ({
            id: item.id,
            title: item.c_user_name,
            start: item.c_check_date,
          })) || [];

        await nextTick();
        const calendarApi = calendarRef.value?.getApi();
        if (calendarApi) {
          calendarApi.removeAllEvents();
          calendarApi.addEventSource(events);
        }

        checks.value = events;
        allChecks.value = response?.data || [];
      } else {
        errorMessage.value = response?.msg || "Failed to load calendar events";
      }
    }
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    errorMessage.value = "Error loading calendar events";
  } finally {
    isFetching.value = false;
  }
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
  datesSet: (dateInfo) => {
    handleDates(dateInfo);
  },
});

const fetchUsers = async () => {
  try {
    const response = await api(`/collage_ap/${collegeId.value}/users`); // Call it as a function
    if (response?.success) {
      users.value = response?.c_users;
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
  } finally {
  }
};

watch(collegeId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    const today = new Date();

    // Start of current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // End of current month
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Create a dateInfo-like object so handleDates() works without changes
    const dateInfo = {
      view: {
        type: "dayGridMonth",
        currentStart: startOfMonth,
      },
      start: startOfMonth,
      end: endOfMonth,
    };

    handleDates(dateInfo);
  }
});

onMounted(async () => {
  if (collegeId.value) {
    await fetchUsers();
  }
});
</script>

<template>
  <!-- <div v-if="errorMessage">{{ errorMessage }}</div> -->

  <div class="flex flex-col font-sans text-sm max-w-7xl mx-auto p-6 lg:px-8">
    <div class="flex flex-col">
      <div
        class="flex justify-between sm:items-center flex-col sm:flex-row pb-5"
      >
        <p class="text-xl font-bold">Checks Calendar View</p>
        <p class="text-base font-medium">
          Total Amount: ${{ isFetching ? "0.00" : totalAmount }}
        </p>
      </div>
      <span v-if="isFetching" class="text-green-600 text-center mb-2 font-bold">
        Retrieving check info, please wait...
      </span>
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

<style>
.fc-direction-ltr .fc-toolbar > * > :not(:first-child) {
  margin-top: 0;
}

@media (max-width: 508px) {
  .fc-direction-ltr .fc-toolbar > * > :not(:first-child) {
    margin-top: 10px;
  }
}
</style>
