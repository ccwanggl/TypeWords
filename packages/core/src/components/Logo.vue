<script setup lang="ts">
import { useSettingStore } from '../stores/setting.ts'
import { withAppBaseURL } from '../utils/base-url'

const settingStore = useSettingStore()
const darkLogoSrc = withAppBaseURL('/imgs/logo/logo-text-white.png')
const lightLogoSrc = withAppBaseURL('/imgs/logo/logo-text-black.png')

function goHome() {
  location.href = withAppBaseURL('/')
}
</script>

<template>
  <div class="center mb-2" @click="goHome">
    <img v-show="settingStore.theme === 'dark'" :src="darkLogoSrc" alt="" />
    <img v-show="settingStore.theme !== 'dark'" :src="lightLogoSrc" alt="" />
  </div>
</template>

<style scoped lang="scss">
img {
  cursor: pointer;
  height: 2rem;
}
</style>
