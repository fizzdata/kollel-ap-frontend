<script setup>
const route = useRoute();
const router = useRouter();
const collegeId = computed(() => route.params.id || "10869442"); // Default to current ID if not in URL

const navigation = [
  { name: "Users", href: `/users?id=${collegeId.value}` },
  { name: "Checks", href: `/checks?id=${collegeId.value}` },
];

onMounted(() => {
  if (route.path === "/" && !route.query.id) {
    router.replace(`/?id=${collegeId.value}`);
  }
});
</script>

<template>
  <header class="border-b border-gray-200 bg-indigo-600">
    <nav
      class="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
      aria-label="Global"
    >
      <div class="flex lg:flex-1">
        <ULink :to="`/?id=${collegeId}`" class="-m-1.5 p-1.5">
          <span class="font-bold text-white">Kollel App </span>
        </ULink>
      </div>
      <div class="flex gap-x-4 lg:gap-x-8">
        <ULink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="[
            'nav-link text-white hover:text-white font-medium',
            route.path === item.href ? 'font-bold' : '',
          ]"
        >
          {{ item.name }}
        </ULink>
      </div>
    </nav>
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
