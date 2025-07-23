<script setup>
import { ref } from "vue";
import { Dialog, DialogPanel } from "@headlessui/vue";

const route = useRoute();

const navigation = [
  { name: "Users", href: "/users" },
  { name: "Checks", href: "/checks" },
];

const mobileMenuOpen = ref(false);
</script>

<template>
  <header class="border-b border-gray-200 bg-indigo-600">
    <nav
      class="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
      aria-label="Global"
    >
      <div class="flex lg:flex-1">
        <ULink to="/" class="-m-1.5 p-1.5">
          <span class="font-bold text-white">Kollel App </span>
        </ULink>
      </div>
      <div class="flex lg:hidden">
        <button
          type="button"
          class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          @click="mobileMenuOpen = true"
        >
          <span class="sr-only">Open main menu</span>
          <UIcon name="i-heroicons-bars-3" class="size-6 text-white" />
        </button>
      </div>
      <div class="hidden lg:flex lg:gap-x-8">
        <ULink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="[
            'nav-link text-white hover:text-white font-medium',
            route.path === item.href ? 'font-bold' : '',
          ]"
          >{{ item.name }}
        </ULink>
      </div>
      <!-- <div class="hidden lg:flex lg:flex-1 lg:justify-end">
        <a href="#" class="text-sm/6 font-semibold text-gray-900"
          >Log in <span aria-hidden="true">&rarr;</span></a
        >
      </div> -->
    </nav>
    <Dialog
      class="lg:hidden"
      @close="mobileMenuOpen = false"
      :open="mobileMenuOpen"
    >
      <div class="fixed inset-0 z-50" />
      <DialogPanel
        class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-indigo-600 p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10"
      >
        <div class="flex items-center justify-between">
          <ULink to="/" class="-m-1.5 p-1.5">
            <span class="font-bold text-white">Kollel App </span>
          </ULink>
          <button
            type="button"
            class="-m-2.5 rounded-md p-2.5 text-gray-700"
            @click="mobileMenuOpen = false"
          >
            <span class="sr-only">Close menu</span>
            <UIcon name="i-heroicons-x-mark" class="size-6 text-white" />
          </button>
        </div>
        <div class="mt-6 flow-root">
          <div class="-my-6 divide-y divide-gray-500/10">
            <div class="space-y-2 py-6">
              <ULink
                v-for="item in navigation"
                :key="item.name"
                :to="item.href"
                @click="mobileMenuOpen = false"
                :class="[
                  '-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-gray-50 hover:text-black',
                  route.path === item.href ? 'font-bold' : '',
                ]"
                >{{ item.name }}</ULink
              >
            </div>
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  </header>
</template>

<style scoped>
.nav-link {
  position: relative;
}
.nav-link::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: #ffffff;
  transition: width 0.3s ease;
}
.nav-link:hover::after {
  width: 100%;
  color: white;
}
</style>
