<script setup lang="ts">
import { BasePage } from '@typewords/base'
import About from '@typewords/core/components/About.vue'
import { APP_NAME } from '@typewords/core/config/env.ts'
import { toSiteURL } from '@typewords/core/utils/base-url'

let route = useRoute()
const config = useRuntimeConfig()
let title = APP_NAME + ' 反馈'
useSeoMeta({
  title: title,
  description: title,
  ogTitle: title,
  ogDescription: title,
  ogUrl: toSiteURL(route.fullPath, config.public.origin, config.app.baseURL),
  twitterTitle: title,
  twitterDescription: title,
})
</script>

<template>
  <BasePage>
    <div class="center">
      <div class="card-white w-2/3 center-col pb-20">
        <About />
      </div>
    </div>
  </BasePage>
</template>

<style scoped lang="scss"></style>
