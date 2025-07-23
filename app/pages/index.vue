<script setup>
import { ref } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { INITIAL_EVENTS, createEventId } from "./../common/common";

const currentEvents = ref([]);
const weekendsVisible = ref(true);

const handleWeekendsToggle = () => {
  weekendsVisible.value = !weekendsVisible.value;
};

const handleDateSelect = (selectInfo) => {
  const title = prompt("Please enter a new title for your event");
  const calendarApi = selectInfo.view.calendar;

  calendarApi.unselect();

  if (title) {
    calendarApi.addEvent({
      id: createEventId(),
      title,
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
    });
  }
};

const handleEventClick = (clickInfo) => {
  if (
    confirm(
      `Are you sure you want to delete the event '${clickInfo.event.title}'`
    )
  ) {
    clickInfo.event.remove();
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
  initialEvents: INITIAL_EVENTS,
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: weekendsVisible.value,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventsSet: handleEvents,
});
</script>

<template>
  <div
    class="flex flex-col md:flex-row min-h-[calc(100vh-73px)] font-sans text-sm max-w-7xl mx-auto"
  >
    <div class="w-full md:w-1/3 bg-indigo-50 border-r border-blue-200">
      <div class="p-6 space-y-6">
        <div>
          <h2 class="text-lg font-semibold">Instructions</h2>
          <ul class="list-disc list-inside text-gray-600">
            <li>Select dates and you will be prompted to create a new event</li>
            <li>Drag, drop, and resize events</li>
            <li>Click an event to delete it</li>
          </ul>
        </div>

        <div>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              class="form-checkbox"
              :checked="weekendsVisible"
              @change="handleWeekendsToggle"
            />
            <span class="text-sm text-gray-700">Toggle weekends</span>
          </label>
        </div>

        <div>
          <h2 class="text-lg font-semibold mb-2">
            All Events ({{ currentEvents.length }})
          </h2>
          <ul class="space-y-1 text-gray-700">
            <li v-for="event in currentEvents" :key="event.id">
              <b>{{ event.startStr }}</b> <i>{{ event.title }}</i>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="flex-grow p-6 overflow-auto">
      <FullCalendar
        class="max-w-7xl mx-auto bg-white p-2"
        :options="{ ...calendarOptions, weekends: weekendsVisible }"
      >
        <template #eventContent="arg">
          <b>{{ arg.timeText }}</b>
          <i>{{ arg.event.title }}</i>
        </template>
      </FullCalendar>
    </div>
  </div>
</template>
