<script setup lang="ts">
import { BasePage } from '@typewords/base'
import { APP_NAME } from '@typewords/core/config/env.ts'
import { toSiteURL, withAppBaseURL } from '@typewords/core/utils/base-url'

let title = APP_NAME + ' 新概念英语'
let route = useRoute()
const config = useRuntimeConfig()
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
    <div class="">
      <div class="card-white flex gap-4" v-for="i in 4">
        <NuxtImg :src="withAppBaseURL('/imgs/covers/nce-1.png')" />
        <div>
          <div class="title">新概念英语第一册</div>
        </div>
      </div>
    </div>
  </BasePage>
</template>

<style scoped lang="scss"></style>
