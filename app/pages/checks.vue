<script setup>
import { object, string, number } from "yup";
import { CalendarDate } from "@internationalized/date";

const api = useApi();
const toast = useToast();
const loading = ref(false);
const showModal = ref(false);
const isSubmitting = ref(false);
const open = ref(false);
const checks = ref([]);
const showDeleteConfirmModal = ref(false);
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
    ? `/collage_ap/10869442/check/${form.value.id}`
    : `/collage_ap/10869442/check`;
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
    const response = await api(`/collage_ap/10869442/check/${form.value.id}`, {
      method: "DELETE",
    });

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
                onClick: () => deleteCheck(row.original),
              }),
          }
        ),
        // Tooltip with Print Icon Button
        h(
          resolveComponent("UTooltip"),
          { text: "Print" },
          {
            default: () =>
              h(resolveComponent("UButton"), {
                icon: "i-heroicons-printer",
                size: "xs",
                color: "info",
                variant: "soft",
                onClick: () => printCheck(row.original),
              }),
          }
        ),
      ]),
  },
];

// Helper function to convert numbers to words (for the amount in words)
const numberToWords = (num) => {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (num === 0) return "Zero";

  function convertLessThanOneHundred(n) {
    if (n < 20) return ones[n];
    const ten = Math.floor(n / 10);
    const one = n % 10;
    return tens[ten] + (one ? " " + ones[one] : "");
  }

  function convertLessThanOneThousand(n) {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let result = "";
    if (hundred > 0) {
      result += ones[hundred] + " Hundred";
    }
    if (remainder > 0) {
      if (result) result += " and ";
      result += convertLessThanOneHundred(remainder);
    }
    return result;
  }

  const numStr = num.toString().split(".");
  let wholeNumber = parseInt(numStr[0]);
  let result = "";

  if (wholeNumber === 0) {
    result = "Zero";
  } else {
    const billion = Math.floor(wholeNumber / 1000000000);
    wholeNumber %= 1000000000;
    const million = Math.floor(wholeNumber / 1000000);
    wholeNumber %= 1000000;
    const thousand = Math.floor(wholeNumber / 1000);
    wholeNumber %= 1000;

    if (billion > 0) result += convertLessThanOneHundred(billion) + " Billion";
    if (million > 0) {
      if (result) result += " ";
      result += convertLessThanOneHundred(million) + " Million";
    }
    if (thousand > 0) {
      if (result) result += " ";
      result += convertLessThanOneHundred(thousand) + " Thousand";
    }
    if (wholeNumber > 0) {
      if (result) result += " ";
      result += convertLessThanOneThousand(wholeNumber);
    }
  }

  return result + " Dollars";
};

// Format the date
const formatDate = (dateString) => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

// Add this new function to handle printing
const printCheck = (check) => {
  // Create a new window for printing
  const printWindow = window.open("", "_blank");

  // Create the HTML content for the check
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Check #${check.check_id}</title>
      <style>
        @page {
          size: 8.5in 11in;
          margin: 0.5in;
        }
        @media print {
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 0;
            width: 8.5in;
            height: 11in;
          }
          .check {
            border: 2px solid #000;
            padding: 40px 30px;
            max-width: 6.5in;
            min-height: 3in;
            margin: 0 auto;
            position: relative;
          }
          .check-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            font-size: 14px;
          }
          .check-date {
            text-align: right;
          }
          .payee-line {
            display: flex;
            justify-content: space-between;
            margin: 10px 0 40px 0;
            font-size: 16px;
          }
          .amount-line {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            min-height: 24px;
          }
          .amount-in-words {
            flex: 1;
            border-bottom: 1px solid #000;
            margin-right: 20px;
            padding: 0 5px 5px 5px;
          }
          .amount-box {
            border: 1px solid #000;
            padding: 5px 10px;
            min-width: 150px;
            text-align: right;
            font-weight: bold;
          }
          .memo {
            margin: 30px 0 10px 0;
            padding-top: 10px;
            font-size: 14px;
          }
          .signature-line {
            display: inline-block;
            margin-top: 40px;
            border-top: 1px solid #000;
            min-width: 200px;
            text-align: center;
            padding-top: 5px;
          }
          .check-number {
            position: absolute;
            top: 20px;
            right: 40px;
            font-size: 14px;
          }
          .bank-info {
            position: absolute;
            top: 20px;
            left: 30px;
            font-size: 14px;
            font-weight: bold;
          }
        }
      </style>
    </head>
    <body>
      <div class="check">
         <div class="bank-info">
          ${(() => {
            // Use user_id from the check object to find the user
            const user = users.value.find((u) => u.id === check.id);
            return `
              ${user?.c_user_name ? `<div>${user.c_user_name}</div>` : ""}
              ${user?.c_user_address ? `<div>${user.c_user_address}</div>` : ""}
              ${
                user?.c_user_phone
                  ? `<div>Phone: ${user.c_user_phone}</div>`
                  : ""
              }
            `;
          })()}
        </div>

        <div class="check-number">#${check.check_id}</div>

        <div class="check-date">${formatDate(check.c_check_date)}</div>

        <div class="payee-line">
          <div>Pay to the order of: <strong>${
            check.c_check_payee
          }</strong></div>
          <div class="amount-box">$${parseFloat(check.c_check_amount).toFixed(
            2
          )}</div>
        </div>

        <div class="amount-line">
          <div class="amount-in-words">
            ${(() => {
              const amount = parseFloat(check.c_check_amount);
              const dollars = Math.floor(amount);
              const cents = Math.round((amount % 1) * 100);

              const dollarWords = numberToWords(dollars);
              const centWords =
                cents > 0
                  ? ` and ${cents.toString().padStart(2, "0")}/100`
                  : "";

              return `${dollarWords}${centWords} only`;
            })()}
          </div>
        </div>


        ${
          check.check_memo
            ? `<div class="memo"><strong>Memo:</strong> ${check.check_memo}</div>`
            : ""
        }

        <div class="signature-line">
          Authorized Signature
        </div>
      </div>

      <script>
        // Auto-print when the window loads
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }, 250);
        };
      <\/script>
    </body>
    </html>
  `;

  // Write the content to the new window
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
};

const fetchList = async () => {
  try {
    loading.value = true;
    const response = await api("/collage_ap/10869442/checks");
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
    const response = await api(`/collage_ap/10869442/users`); // Call it as a function
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
