<script setup lang="ts">
import { APP_NAME, GITHUB, Origin } from '@typewords/core/config/env.ts'
import { BaseIcon } from '@typewords/base'
import { getSystemTheme, listenToSystemThemeChange, setTheme, swapTheme } from '@typewords/core/hooks/theme.ts'
import ChannelIcons from '@typewords/core/components/channel-icons/ChannelIcons.vue'
import { usePlayBeep, usePlayCorrect, usePlayKeyboardAudio } from '@typewords/core/hooks/sound.ts'

definePageMeta({ layout: 'empty' })

let theme = $ref('light')

onMounted(() => {
  listenToSystemThemeChange(val => {
    if (theme === val) return
    theme = val
    setTheme(theme)
  })
  theme = getSystemTheme()
  setTheme(theme)
  startTypingAnimation()
  startCounterAnimation()
})

function toggleTheme() {
  theme = swapTheme((theme === 'auto' ? getSystemTheme() : theme) as any)
  setTheme(theme)
}

const { locales, setLocale, locale } = useI18n()

const typingWords = ['abandon', 'persevere', 'eloquent', 'diligent', 'profound', 'innovation']
let typingDisplay = $ref('')
let typingCursor = $ref(true)

function startTypingAnimation() {
  let wordIdx = 0
  let charIdx = 0
  let deleting = false
  function tick() {
    const word = typingWords[wordIdx]
    if (!deleting) {
      charIdx++
      typingDisplay = word.slice(0, charIdx)
      if (charIdx === word.length) {
        deleting = true
        setTimeout(tick, 1600)
        return
      }
    } else {
      charIdx--
      typingDisplay = word.slice(0, charIdx)
      if (charIdx === 0) {
        deleting = false
        wordIdx = (wordIdx + 1) % typingWords.length
      }
    }
    setTimeout(tick, deleting ? 60 : 100)
  }
  setInterval(() => {
    typingCursor = !typingCursor
  }, 530)
  tick()
}

// ── 首屏打字 Demo（PC 端，轻量自包含，不依赖 store）──
const demoWords = [
  {
    word: 'persevere',
    phonetic: '/ˌpɜːrsɪˈvɪər/',
    trans: 'v. 坚持不懈，锲而不舍',
    examples: [
      { en: 'You must persevere if you want to succeed.', zh: '如果你想成功，就必须坚持不懈。' },
      { en: 'She persevered through years of hardship.', zh: '她在多年的艰辛中坚持了下来。' },
    ],
  },
  {
    word: 'eloquent',
    phonetic: '/ˈeləkwənt/',
    trans: 'adj. 雄辩的，有说服力的',
    examples: [
      { en: 'He gave an eloquent speech at the ceremony.', zh: '他在典礼上发表了一篇雄辩的演讲。' },
      { en: 'Her eloquent writing moved the audience deeply.', zh: '她极具感染力的文字深深打动了观众。' },
    ],
  },
  {
    word: 'diligent',
    phonetic: '/ˈdɪlɪdʒənt/',
    trans: 'adj. 勤勉的，勤奋的',
    examples: [
      { en: 'A diligent student always finishes homework on time.', zh: '勤奋的学生总是按时完成作业。' },
      { en: 'He was diligent in his research and rarely took breaks.', zh: '他研究工作勤勤恳恳，很少休息。' },
    ],
  },
  {
    word: 'profound',
    phonetic: '/prəˈfaʊnd/',
    trans: 'adj. 深刻的，意义深远的',
    examples: [
      { en: 'Reading widely has a profound effect on vocabulary.', zh: '广泛阅读对词汇量有深远的影响。' },
      { en: 'The discovery had a profound impact on modern science.', zh: '这一发现对现代科学产生了深远的影响。' },
    ],
  },
]
let demoIdx = $ref(0)
let demoInput = $ref('')
let demoWrong = $ref('')
let demoDone = $ref(false)
let demoShake = $ref(false)

const demoWord = $computed(() => demoWords[demoIdx])
const demoRemain = $computed(() => demoWord.word.slice(demoInput.length + demoWrong.length))

function demoNextWord() {
  demoDone = false
  demoInput = ''
  demoWrong = ''
  demoIdx = (demoIdx + 1) % demoWords.length
}

function onDemoKey(e: KeyboardEvent) {
  if (demoDone) {
    if (e.code === 'Space') {
      e.preventDefault()
      demoNextWord()
    }
    return
  }
  if (e.key.length !== 1) return
  e.preventDefault()
  const target = demoWord.word
  const pos = demoInput.length
  if (demoWrong) return
  if (e.key.toLowerCase() === target[pos].toLowerCase()) {
    demoInput += e.key
    demoWrong = ''
    playDemoKeyboard()
    if (demoInput.length === target.length) {
      demoDone = true
      playDemoCorrect()
    }
  } else {
    demoWrong = e.key
    demoShake = true
    playDemoBeep()
    setTimeout(() => {
      demoWrong = ''
      demoShake = false
    }, 500)
  }
}

function onDemoBackspace(e: KeyboardEvent) {
  if (e.code === 'Backspace') {
    e.preventDefault()
    if (demoWrong) {
      demoWrong = ''
      return
    }
    demoInput = demoInput.slice(0, -1)
  }
}

let demoFocused = $ref(false)

const demoCardRef = $ref<HTMLElement | null>(null)

function focusDemoCard() {
  demoCardRef?.focus()
}

const playDemoKeyboard = usePlayKeyboardAudio()
const playDemoBeep = usePlayBeep()
const playDemoCorrect = usePlayCorrect()

let statValues = $ref([0, 0, 0, 0])
const statTargets = [7, 50, 3, 100]
function startCounterAnimation() {
  const duration = 1800
  const startTime = performance.now()
  function step(now: number) {
    const p = Math.min((now - startTime) / duration, 1)
    const e = 1 - Math.pow(1 - p, 3)
    statValues = statTargets.map(t => Math.round(e * t))
    if (p < 1) requestAnimationFrame(step)
  }
  const observer = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting) {
        requestAnimationFrame(step)
        observer.disconnect()
      }
    },
    { threshold: 0.3 }
  )
  const el = document.querySelector('.js-stats-bar')
  if (el) observer.observe(el)
}

let faqOpen = $ref<number | null>(null)
const faqs = [
  {
    q: '数据存储在哪里？',
    a: '所有数据优先保存在本地浏览器（IndexedDB / localStorage），完全离线可用。如需跨设备同步，可在设置中配置自己的 Supabase 实例，实现双向云端同步。',
  },
  {
    q: '支持哪些平台？',
    a: '支持所有现代浏览器（Web 端），同时提供 VSCode 扩展版，可在编写代码的同时练习单词，无需切换窗口。',
  },
  {
    q: '和其他单词软件有什么不同？',
    a: '核心差异在于「打字输入」与「FSRS 间隔复习算法」的结合。不是简单点击选择，而是真正键入单词，配合 7 种练习模式递进阶段，有效加深肌肉记忆与拼写能力。',
  },
  {
    q: '如何添加自定义词库或文章？',
    a: '在「单词」模块可新建自定义词典并手动添加单词；在「文章」模块可添加自定义书籍和文章（支持本地音频）。完全自由，不依赖任何平台。',
  },
]
function toggleFaq(i: number) {
  faqOpen = faqOpen === i ? null : i
}

const honors = [
  { icon: '⭐', num: '7k+', label: 'GitHub Stars', sub: '持续获得全球开发者认可' },
  { icon: '🔥', num: '10w+', label: '累计用户', sub: '选择 TypeWords 提升英语' },
  { icon: '💬', num: '100+', label: '社区贡献者', sub: '共同完善项目词库' },
  { icon: '📦', num: '50+', label: '内置词库', sub: '覆盖从小学到 GRE 全场景' },
]
const stats = [
  { suffix: '', label: '种练习模式' },
  { suffix: '+', label: '内置词库' },
  { suffix: '', label: '端支持（Web/VSCode）' },
  { suffix: '%', label: '免费开源' },
]

let mobileMenuOpen = $ref(false)
</script>

<template>
  <div class="hw min-h-screen overflow-x-hidden font-sans" :class="theme" id="wrapper">
    <!-- NAV -->
    <header class="sticky top-0 z-100 backdrop-blur-md border-b border-[var(--hw-border)] bg-[var(--hw-bg-nav)]">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-8 h-15 flex items-center gap-8">
        <!-- Logo -->
        <div
          class="text-[1.1rem] font-semibold shrink-0 bg-gradient-to-r from-[#bd34fe] to-[#41d1ff] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]"
        >
          {{ APP_NAME }}
        </div>
        <!-- Desktop nav links -->
        <nav class="hidden md:flex gap-7">
          <NuxtLink
            to="/words"
            class="font-medium text-[var(--hw-text-2)] no-underline hover:text-[var(--hw-text)] transition-colors duration-150"
            >单词</NuxtLink
          >
          <NuxtLink
            to="/articles"
            class="text-[.88rem] font-medium text-[var(--hw-text-2)] no-underline hover:text-[var(--hw-text)] transition-colors duration-150"
            >文章</NuxtLink
          >
          <NuxtLink
            to="/doc"
            class="text-[.88rem] font-medium text-[var(--hw-text-2)] no-underline hover:text-[var(--hw-text)] transition-colors duration-150"
            >资料</NuxtLink
          >
          <NuxtLink
            to="/help"
            class="text-[.88rem] font-medium text-[var(--hw-text-2)] no-underline hover:text-[var(--hw-text)] transition-colors duration-150"
            >帮助</NuxtLink
          >
        </nav>
        <!-- Actions -->
        <div class="ml-auto flex items-center gap-2 text-[var(--hw-text-2)]">
          <!-- Lang -->
          <div class="relative group">
            <div class="more w-10 rounded-r-lg h-full center box-border transition-all duration-300">
              <IconPhTranslate />
            </div>
            <div
              class="space-y-2 absolute z-200 right-0 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 pointer-events-none group-hover:pointer-events-auto"
            >
              <div
                class="bg-[var(--hw-bg-card)] border border-[var(--hw-border)] rounded-lg shadow-[var(--hw-shadow-md)] p-3 space-y-1"
              >
                <div
                  v-for="loc in locales"
                  :key="loc.code"
                  @click="setLocale(loc.code)"
                  class="px-3 py-1.5 rounded text-[.88rem] text-[var(--hw-text-2)] cursor-pointer whitespace-nowrap hover:bg-[var(--hw-bg)] hover:text-[var(--hw-text)] transition-colors duration-100"
                >
                  {{ loc.name }}
                </div>
              </div>
            </div>
          </div>
          <!-- Theme toggle -->
          <BaseIcon :title="$t('toggle_theme')" @click="toggleTheme">
            <IconFluentWeatherMoon16Regular v-if="theme === 'light'" />
            <IconFluentWeatherSunny16Regular v-else />
          </BaseIcon>
          <!-- GitHub -->
          <a
            class="flex gap-2 relative text-[var(--hw-text-2)] no-underline"
            :href="GITHUB"
            target="_blank"
            aria-label="Github project address"
          >
            <BaseIcon class="z-1" title="Github" noBg>
              <IconSimpleIconsGithub />
            </BaseIcon>
            <NuxtImg
              class="z-0 shrink-0 h-8 -ml-4"
              :src="`https://img.shields.io/github/stars/zyronon/typing-word?style=flat-square&label=%20&color=${theme === 'light' ? 'white' : 'black'}`"
            />
          </a>
          <!-- Mobile menu button -->
          <button
            class="flex md:hidden items-center justify-center w-8 h-8 rounded-lg bg-transparent text-[var(--hw-text-2)] cursor-pointer"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <span class="text-[1.2rem] leading-none">☰</span>
          </button>
        </div>
      </div>
      <!-- Mobile dropdown menu -->
      <div
        v-show="mobileMenuOpen"
        class="md:hidden border-t border-[var(--hw-border)] bg-[var(--hw-bg-card)] px-4 py-3 flex flex-col gap-3 text-lg"
      >
        <NuxtLink to="/words" class="font-medium text-[var(--hw-text-2)] no-underline py-1" @click="mobileMenuOpen = false">单词</NuxtLink>
        <NuxtLink to="/articles" class="font-medium text-[var(--hw-text-2)] no-underline py-1" @click="mobileMenuOpen = false">文章</NuxtLink>
        <NuxtLink to="/doc" class="font-medium text-[var(--hw-text-2)] no-underline py-1" @click="mobileMenuOpen = false">资料</NuxtLink>
        <NuxtLink to="/help" class="font-medium text-[var(--hw-text-2)] no-underline py-1" @click="mobileMenuOpen = false">帮助</NuxtLink>
      </div>
    </header>

    <main>
      <!-- ══════════════════ HERO ══════════════════ -->
      <section class="relative overflow-hidden px-4 sm:px-8 py-14 sm:py-18 min-h-[92vh] flex items-center">
        <!-- Gradient mesh background -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            class="absolute top-[-10rem] left-1/2 -translate-x-[65%] w-[52rem] h-[52rem] rounded-full"
            style="background: radial-gradient(circle, rgba(124,58,237,.13) 0%, transparent 65%)"
          ></div>
          <div
            class="absolute top-[-4rem] right-0 translate-x-[25%] w-[40rem] h-[40rem] rounded-full"
            style="background: radial-gradient(circle, rgba(37,99,235,.10) 0%, transparent 65%)"
          ></div>
          <div
            class="absolute bottom-[-6rem] left-0 -translate-x-[20%] w-[32rem] h-[32rem] rounded-full"
            style="background: radial-gradient(circle, rgba(16,185,129,.07) 0%, transparent 65%)"
          ></div>
        </div>

        <!-- PC 两栏 / 手机单栏 -->
        <div class="relative z-1 max-w-[1200px] mx-auto w-full flex flex-col lg:flex-row items-center gap-10 lg:gap-14">

          <!-- ── Left: 文字区 ── -->
          <div class="flex-1 text-center lg:text-left">

            <!-- Social proof badge -->
            <div class="flex justify-center lg:justify-start mb-5">
              <a
                :href="GITHUB"
                target="_blank"
                class="inline-flex items-center gap-2 text-[1rem] font-semibold text-[#7c3aed] no-underline px-3.5 py-1.5 rounded-full border border-[rgba(124,58,237,.3)] bg-[rgba(124,58,237,.06)] hover:bg-[rgba(124,58,237,.12)] transition-all duration-150 cursor-pointer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" class="shrink-0">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                8k+ GitHub Stars · 开源免费
              </a>
            </div>

            <!-- Title -->
            <h1
              class="hero-title text-[clamp(3rem,8vw,5.5rem)] mt-0 leading-[1.08] mb-4 bg-gradient-to-r from-[#bd34fe] via-[#7c3aed] to-[#41d1ff] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]"
            >
              {{ APP_NAME }}
            </h1>

            <!-- Core value headline -->
            <p class="text-[clamp(1.1rem,2.5vw,1.35rem)] text-[var(--hw-text)] font-semibold mb-3 leading-[1.5]">
              打字记单词，科学间隔复习
            </p>
            <p class="text-[clamp(.9rem,2vw,1.05rem)] text-[var(--hw-text-2)] mb-6 leading-[1.75] max-w-[520px] mx-auto lg:mx-0">
              不再靠死记硬背——<strong class="text-[var(--hw-text)] font-semibold">键入单词</strong>强化肌肉记忆，
              <strong class="text-[var(--hw-text)] font-semibold">记忆曲线算法</strong>自动安排复习时机，
              配合 <strong class="text-[var(--hw-text)] font-semibold">7 种递进模式</strong>，让每个单词真正刻进脑子里。
            </p>

            <!-- Core value pills -->
            <div class="flex gap-2 justify-center lg:justify-start flex-wrap mb-6">
              <span class="value-pill value-pill--purple">⌨️ 打字输入，肌肉记忆</span>
              <span class="value-pill value-pill--blue">🧠 记忆曲线算法间隔复习</span>
              <span class="value-pill value-pill--green">🆓 完全免费 · 无需注册</span>
            </div>

            <!-- Perks inline -->
            <div class="flex gap-4 sm:gap-6 justify-center lg:justify-start flex-wrap mb-7">
              <div class="flex items-center gap-1.5 text-[.85rem] text-[var(--hw-text-2)]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#7c3aed] shrink-0 opacity-80"></span>7 种练习模式
              </div>
              <div class="flex items-center gap-1.5 text-[.85rem] text-[var(--hw-text-2)]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#2563eb] shrink-0 opacity-80"></span>50+ 内置词库
              </div>
              <div class="flex items-center gap-1.5 text-[.85rem] text-[var(--hw-text-2)]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0 opacity-80"></span>数据本地离线
              </div>
              <div class="flex items-center gap-1.5 text-[.85rem] text-[var(--hw-text-2)]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#d97706] shrink-0 opacity-80"></span>Web + 小程序 + VsCode
              </div>
            </div>

            <!-- 手机端不支持提示 Banner -->
            <div class="block sm:hidden mb-3">
              <div class="flex items-center gap-3 bg-[rgba(234,179,8,.08)] border border-[rgba(234,179,8,.35)] text-[#92400e] rounded-xl px-4 py-3 leading-[1.6] text-left">
                <span class="text-[.84rem]">⚠️ 网站专为<strong>键盘输入</strong>设计，手机体验不佳。手机用户建议扫描页面中的<strong>小程序二维码</strong>使用。</span>
              </div>
            </div>

             <div class="mini-qr-card w-full box-border mb-3 flex sm:hidden">
              <NuxtImg src="/imgs/mini.png" alt="微信小程序二维码" class="w-24 h-24 rounded-xl shrink-0 border border-[var(--hw-border)]" />
              <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                <div class="text-lg font-semibold text-[var(--hw-text)]">微信小程序</div>
                <div class="text-sm text-[var(--hw-text-3)] leading-[1.5]">手机用户扫码体验完整功能，随时随地学英语</div>
              </div>
            </div>

            <!-- CTA buttons -->
            <div class="flex gap-3 justify-center lg:justify-start flex-col sm:flex-row items-stretch sm:items-center flex-wrap">
              <button
                class="inline-flex items-center justify-center gap-2 px-7 h-12 rounded-xl font-semibold text-[.97rem] text-white bg-gradient-to-r from-[#7c3aed] to-[#2563eb] border-none shadow-[0_4px_20px_rgba(124,58,237,.32)] cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(124,58,237,.42)] transition-all duration-200 sm:w-auto"
                @click="navigateTo('/words')"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="shrink-0"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
                立即开始练习
              </button>
              <a
                class="inline-flex items-center justify-center gap-2 px-7 h-12 rounded-xl font-semibold text-[.97rem] text-[var(--hw-text)] bg-transparent border border-solid border-[var(--hw-border)] no-underline hover:bg-[rgba(124,58,237,.06)] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all duration-200 sm:w-auto"
                :href="GITHUB"
                target="_blank"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" class="shrink-0"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
                查看源码
              </a>
            </div>


            <!-- 网站地址 -->
            <div class="flex justify-center lg:justify-start mt-4">
              <a
                :href="Origin"
                target="_blank"
                class="inline-flex items-center gap-1.5 text-[var(--hw-text-3)] no-underline hover:text-[#7c3aed] transition-colors duration-150"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 opacity-50"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                {{ Origin }}
              </a>
            </div>
          </div>

          <!-- ── Right: Demo 卡片 + 小程序码 ── -->
          <div class="hidden lg:flex flex-col items-center gap-4 w-[450px] shrink-0">

            <!-- 打字 Demo 卡片 -->
            <div class="w-full relative group/demo">

              <!-- 未 focus 时的引导覆盖层 -->
              <div
                v-if="!demoFocused"
                class="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl cursor-pointer"
                style="background: rgba(0,0,0,0)"
                @click="focusDemoCard()"
              >
                <!-- 引导文字，带脉冲抖动效果 -->
                <div class="demo-click-guide">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h4"/>
                  </svg>
                  <span>点击卡片，开始打字体验</span>
                </div>
                <div class="demo-bounce-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                </div>
              </div>

              <!-- Demo 主卡片 -->
              <div
                ref="demoCardRef"
                class="bg-[var(--hw-bg-card)] border-2 rounded-2xl shadow-[var(--hw-shadow-lg)] overflow-hidden outline-none transition-all duration-250"
                :class="demoFocused
                  ? 'border-[#7c3aed] shadow-[0_0_0_4px_rgba(124,58,237,.14),var(--hw-shadow-lg)]'
                  : 'border-[var(--hw-border)] demo-idle-border'"
                tabindex="0"
                @focus="demoFocused = true"
                @blur="demoFocused = false"
                @keydown="onDemoKey"
                @keydown.backspace="onDemoBackspace"
              >
                <!-- 顶栏 -->
                <div class="flex items-center gap-1.5 px-4 py-3 border-b border-[var(--hw-border)] bg-[var(--hw-bg)]">
                  <span class="w-3 h-3 rounded-full bg-[#ff5f57]"></span>
                  <span class="w-3 h-3 rounded-full bg-[#febc2e]"></span>
                  <span class="w-3 h-3 rounded-full bg-[#28c840]"></span>
                  <span class="ml-3 text-[.78rem] text-[var(--hw-text-3)] font-mono">TypeWords — 单词练习</span>
                  <div class="ml-auto">
                    <span
                      class="text-[.68rem] px-2 py-0.5 rounded-full font-semibold transition-all duration-200"
                      :class="demoFocused
                        ? 'bg-[rgba(16,185,129,.12)] text-[#059669]'
                        : 'bg-[rgba(124,58,237,.08)] text-[#7c3aed]'"
                    >{{ demoFocused ? '● 输入中' : '○ 点击激活' }}</span>
                  </div>
                </div>

                <!-- 内容区 -->
                <div
                  class="px-8 py-5 flex flex-col items-center gap-1 cursor-text"
                  @click="focusDemoCard()"
                >
                  <!-- 音标 -->
                  <div class="text-[1rem] text-[var(--hw-text-3)] tracking-widest">{{ demoWord.phonetic }}</div>
                  <!-- 单词打字区 -->
                  <div
                    class="text-[3rem] leading-none tracking-widest min-h-[3.8rem] flex items-center en-article-family"
                    :class="{ 'demo-shake': demoShake }"
                  >
                    <span class="text-[#16a34a]">{{ demoInput }}</span>
                    <span class="text-[rgba(239,68,68,.85)]">{{ demoWrong }}</span>
                    <span class="text-[var(--hw-text-3)]">{{ demoRemain }}</span>
                  </div>
                  <!-- 释义 -->
                  <div class="text-[.9rem] text-[var(--hw-text-2)] mt-1">{{ demoWord.trans }}</div>
                  <!-- 例句 -->
                  <div class="w-full mt-3 border-t border-[var(--hw-border)] pt-3 flex flex-col gap-1.5">
                    <div class="text-[.72rem] font-bold tracking-[.06em] uppercase text-[var(--hw-text-3)]">例句</div>
                    <div v-for="(ex, ei) in demoWord.examples" :key="ei" class="text-[.82rem] leading-[1.6] flex flex-col gap-0.5">
                      <div class="italic text-[var(--hw-text-2)]">
                        <span class="text-[#7c3aed] font-bold not-italic mr-1">{{ ei + 1 }}.</span>{{ ex.en }}
                      </div>
                      <div class="text-[.78rem] text-[var(--hw-text-3)] not-italic pl-3.5">{{ ex.zh }}</div>
                    </div>
                  </div>
                  <!-- 完成提示 / 状态文字 -->
                  <div class="h-12 flex justify-end flex-col">
                    <div v-if="demoDone" class="mt-3 flex flex-col items-center gap-1">
                      <div class="text-[1.1rem] text-[#16a34a] font-bold">✓ 完成！</div>
                      <div class="text-sm text-blue-5">
                        按 <kbd class="inline-flex items-center justify-center px-1.5 h-5 bg-[var(--hw-bg)] border border-[var(--hw-border)] rounded text-[.72rem] font-mono">Space</kbd> 切换下一个
                      </div>
                    </div>
                    <div v-else-if="demoFocused" class="mt-3 text-sm text-[var(--hw-text-3)]">按下键盘，逐字输入单词，输错会标红</div>
                  </div>
                  <!-- 进度点 -->
                  <div class="flex gap-1.5 mt-2">
                    <span
                      v-for="(_, i) in demoWords"
                      :key="i"
                      class="w-1.5 h-1.5 rounded-full transition-colors duration-200"
                      :class="i === demoIdx ? 'bg-[#7c3aed]' : 'bg-[var(--hw-border)]'"
                    ></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── 小程序码 — 独立卡片（不再混入 CTA 按钮旁） ── -->
            <div class="mini-qr-card w-full box-border flex">
              <NuxtImg src="/imgs/mini.png" alt="微信小程序二维码" class="w-24 h-24 rounded-xl shrink-0 border border-[var(--hw-border)]" />
              <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                <div class="text-lg font-semibold text-[var(--hw-text)]">微信小程序</div>
                <div class="text-sm text-[var(--hw-text-3)] leading-[1.5]">手机用户扫码体验完整功能，随时随地学英语</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════ SHOWCASE ══════════════════ -->
      <section class="py-20 sm:py-24 px-4 sm:px-8 bg-[var(--hw-bg-card)] border-t border-b border-[var(--hw-border)]">
        <div class="max-w-[1100px] mx-auto flex flex-col gap-20 sm:gap-24">
          <!-- Words practice -->
          <div class="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-10 md:gap-16 items-center">
            <div>
              <div class="section-label mb-4">单词练习</div>
              <h2 class="text-[clamp(1.4rem,3vw,1.8rem)] font-bold mb-3 text-[var(--hw-text)]">科学分阶，让记忆更持久</h2>
              <p class="text-[var(--hw-text-2)] text-[1rem] leading-[1.75] mb-6">
                跟写 → 听写 → 默写，三重递进式练习。FSRS 间隔复习算法自动安排复习时机，不再靠死记硬背。
              </p>
              <ul class="list-none p-0 m-0 mb-7 flex flex-col gap-2.5">
                <li class="flex items-start gap-2 text-[.95rem] text-[var(--hw-text-2)] leading-[1.6]">
                  <span class="text-[#7c3aed] font-bold shrink-0 mt-[.05rem]">✓</span> 7 种练习模式：跟写 / 听写 / 自测 / 默写 / 随机复习…
                </li>
                <li class="flex items-start gap-2 text-[.95rem] text-[var(--hw-text-2)] leading-[1.6]">
                  <span class="text-[#7c3aed] font-bold shrink-0 mt-[.05rem]">✓</span> FSRS 智能调度，复习词自动浮出
                </li>
                <li class="flex items-start gap-2 text-[.95rem] text-[var(--hw-text-2)] leading-[1.6]">
                  <span class="text-[#7c3aed] font-bold shrink-0 mt-[.05rem]">✓</span> 错词自动进入循环，打乱重练
                </li>
                <li class="flex items-start gap-2 text-[.95rem] text-[var(--hw-text-2)] leading-[1.6]">
                  <span class="text-[#7c3aed] font-bold shrink-0 mt-[.05rem]">✓</span> Tab 跳过 / ` 标已掌握 / Ctrl+R 随机默写
                </li>
              </ul>
              <button
                class="inline-flex items-center justify-center px-5 h-10 rounded-lg font-semibold text-[.9rem] text-[var(--hw-text)] bg-transparent border border-solid border-[var(--hw-border)] cursor-pointer hover:border-[#7c3aed] hover:text-[#7c3aed] hover:bg-[rgba(124,58,237,.06)] transition-all duration-150"
                @click="navigateTo('/words')"
              >
                去练单词 →
              </button>
            </div>
            <div class="rounded-2xl overflow-hidden shadow-[var(--hw-shadow-lg)] border border-[var(--hw-border)] md:order-last order-first">
              <NuxtImg src="/imgs/words.png" class="w-full block" alt="单词练习截图" />
            </div>
          </div>
          <!-- Article practice -->
          <div class="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-10 md:gap-16 items-center">
            <div class="rounded-2xl overflow-hidden shadow-[var(--hw-shadow-lg)] border border-[var(--hw-border)]">
              <NuxtImg src="/imgs/articles.png" class="w-full block" alt="文章练习截图" />
            </div>
            <div>
              <div class="section-label mb-4">文章练习</div>
              <h2 class="text-[clamp(1.4rem,3vw,1.8rem)] font-bold mb-3 text-[var(--hw-text)]">沉浸式阅读，强化语感</h2>
              <p class="text-[var(--hw-text-2)] text-[1rem] leading-[1.75] mb-6">
                内置常见书籍，也可自由添加文章。跟打 + 默写双模式，支持边听边打，强化输出记忆。
              </p>
              <ul class="list-none p-0 m-0 mb-7 flex flex-col gap-2.5">
                <li class="flex items-start gap-2 text-[.95rem] text-[var(--hw-text-2)] leading-[1.6]">
                  <span class="text-[#7c3aed] font-bold shrink-0 mt-[.05rem]">✓</span> 内置 NCE、常见名著等书籍
                </li>
                <li class="flex items-start gap-2 text-[.95rem] text-[var(--hw-text-2)] leading-[1.6]">
                  <span class="text-[#7c3aed] font-bold shrink-0 mt-[.05rem]">✓</span> 跟打 + 默写双模式
                </li>
                <li class="flex items-start gap-2 text-[.95rem] text-[var(--hw-text-2)] leading-[1.6]">
                  <span class="text-[#7c3aed] font-bold shrink-0 mt-[.05rem]">✓</span> 支持边听音频边默写
                </li>
                <li class="flex items-start gap-2 text-[.95rem] text-[var(--hw-text-2)] leading-[1.6]">
                  <span class="text-[#7c3aed] font-bold shrink-0 mt-[.05rem]">✓</span> 可自定义添加任意文章
                </li>
              </ul>
              <button
                class="inline-flex items-center justify-center px-5 h-10 rounded-lg font-semibold text-[.9rem] text-[var(--hw-text)] bg-transparent border border-solid border-[var(--hw-border)] cursor-pointer hover:border-[#7c3aed] hover:text-[#7c3aed] hover:bg-[rgba(124,58,237,.06)] transition-all duration-150"
                @click="navigateTo('/articles')"
              >
                去练文章 →
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════ STATS BAR ══════════════════ -->
      <section class="js-stats-bar py-14 px-4 sm:px-8 bg-[var(--hw-bg-card)] border-t border-b border-[var(--hw-border)]">
        <div class="max-w-[900px] mx-auto flex items-center justify-center flex-wrap gap-0">
          <div v-for="(item, i) in stats" :key="i" class="flex-1 min-w-40 text-center px-6 py-4">
            <div class="text-[clamp(2rem,4vw,3rem)] font-black leading-[1.1] mb-1.5 bg-gradient-to-r from-[#bd34fe] to-[#41d1ff] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
              {{ statValues[i] }}{{ item.suffix }}
            </div>
            <div class="text-[.88rem] text-[var(--hw-text-3)] leading-[1.4]">{{ item.label }}</div>
          </div>
        </div>
      </section>

      <!-- ══════════════════ FEATURE GRID ══════════════════ -->
      <section class="py-20 px-4 sm:px-8">
        <div class="max-w-[1100px] mx-auto">
          <div class="text-center mb-12">
            <div class="section-label">核心特性</div>
            <h2 class="section-h2">一切，都是为了让你真正记住</h2>
            <p class="section-desc">TypeWords 不是又一个单词 App，而是一套以「打字输入」为核心的英语记忆系统。</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div class="feature-card">
              <span class="text-[2rem] mb-3.5 block">🧠</span>
              <div class="text-[1rem] font-bold text-[var(--hw-text)] mb-2">FSRS 智能复习</div>
              <div class="text-[.9rem] text-[var(--hw-text-2)] leading-[1.7]">基于科学间隔重复算法自动调度复习词，好不好记它帮你决定，效率最大化。</div>
            </div>
            <div class="feature-card">
              <span class="text-[2rem] mb-3.5 block">📚</span>
              <div class="text-[1rem] font-bold text-[var(--hw-text)] mb-2">海量内置词库</div>
              <div class="text-[.9rem] text-[var(--hw-text-2)] leading-[1.7]">从小学到 GRE/GMAT/SAT/IELTS，内置数十套词典，一键切换，开箱即用。</div>
            </div>
            <div class="feature-card">
              <span class="text-[2rem] mb-3.5 block">⌨️</span>
              <div class="text-[1rem] font-bold text-[var(--hw-text)] mb-2">7 种练习模式</div>
              <div class="text-[.9rem] text-[var(--hw-text-2)] leading-[1.7]">跟写、听写、自测、默写、随机复习等模式自由组合，打字输入强化肌肉记忆。</div>
            </div>
            <div class="feature-card">
              <span class="text-[2rem] mb-3.5 block">🆓</span>
              <div class="text-[1rem] font-bold text-[var(--hw-text)] mb-2">完全免费开源</div>
              <div class="text-[.9rem] text-[var(--hw-text-2)] leading-[1.7]">100% 开源可审查，完全免费使用，支持私有部署，没有任何隐藏收费。</div>
            </div>
            <div class="feature-card">
              <span class="text-[2rem] mb-3.5 block">⚙️</span>
              <div class="text-[1rem] font-bold text-[var(--hw-text)] mb-2">高度自定义</div>
              <div class="text-[.9rem] text-[var(--hw-text-2)] leading-[1.7]">自定义词典与文章、快捷键、键盘音效、每日学习数量，打造专属学习计划。</div>
            </div>
            <div class="feature-card">
              <span class="text-[2rem] mb-3.5 block">☁️</span>
              <div class="text-[1rem] font-bold text-[var(--hw-text)] mb-2">数据本地优先</div>
              <div class="text-[.9rem] text-[var(--hw-text-2)] leading-[1.7]">数据默认存本地，离线可用。可配置自己的 Supabase 实现跨设备云端同步。</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════ SHORTCUTS ══════════════════ -->
      <section class="py-20 px-4 sm:px-8 bg-[var(--hw-bg-card)] border-t border-b border-[var(--hw-border)]">
        <div class="max-w-[900px] mx-auto">
          <div class="text-center mb-12">
            <div class="section-label">快捷键</div>
            <h2 class="section-h2">为键盘流玩家设计</h2>
            <p class="section-desc">全程键盘操作，不需要鼠标，专注练习不分心。</p>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div class="shortcut-item">
              <div class="flex items-center gap-1.5 flex-wrap"><kbd class="kbd-key">Tab</kbd></div>
              <div class="text-[.88rem] text-[var(--hw-text-2)]">跳过当前单词</div>
            </div>
            <div class="shortcut-item">
              <div class="flex items-center gap-1.5 flex-wrap"><kbd class="kbd-key">Esc</kbd></div>
              <div class="text-[.88rem] text-[var(--hw-text-2)]">显示当前单词</div>
            </div>
            <div class="shortcut-item">
              <div class="flex items-center gap-1.5 flex-wrap">
                <kbd class="kbd-key">Ctrl</kbd><span class="text-[.75rem] text-[var(--hw-text-3)]">+</span><kbd class="kbd-key">R</kbd>
              </div>
              <div class="text-[.88rem] text-[var(--hw-text-2)]">随机打乱默写</div>
            </div>
            <div class="shortcut-item">
              <div class="flex items-center gap-1.5 flex-wrap">
                <kbd class="kbd-key">Shift</kbd><span class="text-[.75rem] text-[var(--hw-text-3)]">+</span><kbd class="kbd-key">→</kbd>
              </div>
              <div class="text-[.88rem] text-[var(--hw-text-2)]">跳过当前练习阶段</div>
            </div>
            <div class="shortcut-item">
              <div class="flex items-center gap-1.5 flex-wrap"><kbd class="kbd-key">`</kbd></div>
              <div class="text-[.88rem] text-[var(--hw-text-2)]">标记 / 取消已掌握</div>
            </div>
            <div class="shortcut-item">
              <div class="flex items-center gap-1.5 flex-wrap">
                <kbd class="kbd-key">Ctrl</kbd><span class="text-[.75rem] text-[var(--hw-text-3)]">+</span><kbd class="kbd-key">P</kbd>
              </div>
              <div class="text-[.88rem] text-[var(--hw-text-2)]">播放单词发音</div>
            </div>
          </div>
          <p class="text-center text-[.85rem] text-[var(--hw-text-3)] m-0">所有快捷键均可在设置中自定义。</p>
        </div>
      </section>

      <!-- ══════════════════ HONORS ══════════════════ -->
      <section class="py-20 px-4 sm:px-8">
        <div class="max-w-[1100px] mx-auto">
          <div class="text-center mb-12">
            <div class="section-label">备受认可</div>
            <h2 class="section-h2">开源社区与用户的选择</h2>
            <p class="section-desc">获得全球开发者持续关注，成为越来越多英语学习者的首选工具</p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            <div
              v-for="item in honors"
              :key="item.label"
              class="bg-[var(--hw-bg-card)] border border-[var(--hw-border)] rounded-2xl p-7 text-center hover:-translate-y-1 hover:shadow-[var(--hw-shadow-md)] transition-all duration-200 cursor-default"
            >
              <div class="text-[2rem] mb-3">{{ item.icon }}</div>
              <div class="text-[2rem] font-black leading-[1.1] mb-1 bg-gradient-to-r from-[#bd34fe] to-[#41d1ff] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">{{ item.num }}</div>
              <div class="text-[.95rem] font-bold text-[var(--hw-text)] mb-1">{{ item.label }}</div>
              <div class="text-[.82rem] text-[var(--hw-text-3)] leading-[1.5]">{{ item.sub }}</div>
            </div>
          </div>
          <div class="text-center">
            <div class="text-[.78rem] font-semibold tracking-[.06em] uppercase text-[var(--hw-text-3)] mb-4">曾获推荐 / 上榜</div>
            <div class="flex gap-3 justify-center flex-wrap">
              <span class="inline-flex items-center gap-1.5 text-[.85rem] font-semibold text-[var(--hw-text-2)] px-4 py-2 rounded-full border border-[var(--hw-border)] bg-[var(--hw-bg-card)] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors duration-150 cursor-default"><span>🐙</span> GitHub 趋势榜</span>
              <span class="inline-flex items-center gap-1.5 text-[.85rem] font-semibold text-[var(--hw-text-2)] px-4 py-2 rounded-full border border-[var(--hw-border)] bg-[var(--hw-bg-card)] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors duration-150 cursor-default"><span>💬</span> V2EX 热搜</span>
              <span class="inline-flex items-center gap-1.5 text-[.85rem] font-semibold text-[var(--hw-text-2)] px-4 py-2 rounded-full border border-[var(--hw-border)] bg-[var(--hw-bg-card)] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors duration-150 cursor-default"><span>🏆</span> Gitee GVP</span>
              <span class="inline-flex items-center gap-1.5 text-[.85rem] font-semibold text-[var(--hw-text-2)] px-4 py-2 rounded-full border border-[var(--hw-border)] bg-[var(--hw-bg-card)] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors duration-150 cursor-default"><span>📰</span> 少数派推荐</span>
              <span class="inline-flex items-center gap-1.5 text-[.85rem] font-semibold text-[var(--hw-text-2)] px-4 py-2 rounded-full border border-[var(--hw-border)] bg-[var(--hw-bg-card)] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors duration-150 cursor-default"><span>⭐</span> GitCode G-Star</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════ CTA ══════════════════ -->
      <section class="py-20 px-4 sm:px-8 text-center bg-[var(--hw-bg-card)] border-t border-[var(--hw-border)]">
        <div class="max-w-[600px] mx-auto">
          <h2 class="text-[clamp(1.6rem,4vw,2.2rem)] font-black text-[var(--hw-text)] mb-3">现在开始，敲出你的英语能力</h2>
          <p class="text-[var(--hw-text-2)] text-[1rem] mb-8">免费、开源、无需注册，打开即用。</p>
          <div class="flex gap-3 justify-center flex-wrap flex-col sm:flex-row items-stretch sm:items-center">
            <button
              class="inline-flex items-center justify-center px-8 h-12 rounded-lg font-semibold text-[1rem] text-white bg-gradient-to-r from-[#7c3aed] to-[#2563eb] border-none shadow-[0_4px_16px_rgba(124,58,237,.28)] cursor-pointer hover:-translate-y-px hover:opacity-90 transition-all duration-150 sm:w-auto"
              @click="navigateTo('/words')"
            >
              开始单词练习
            </button>
            <a
              class="inline-flex items-center justify-center px-8 h-12 rounded-lg font-semibold text-[1rem] text-[var(--hw-text)] bg-transparent border border-solid border-[var(--hw-border)] no-underline hover:bg-[rgba(124,58,237,.06)] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all duration-150 sm:w-auto"
              :href="GITHUB"
              target="_blank"
            >查看源码 →</a>
          </div>
        </div>
      </section>

      <!-- ══════════════════ FAQ ══════════════════ -->
      <section class="py-20 px-4 sm:px-8">
        <div class="max-w-[720px] mx-auto">
          <div class="text-center mb-12">
            <div class="section-label">常见问题</div>
            <h2 class="section-h2">你可能想知道的</h2>
          </div>
          <div class="flex flex-col gap-3">
            <div
              v-for="(item, i) in faqs"
              :key="i"
              class="bg-[var(--hw-bg-card)] border border-[var(--hw-border)] rounded-lg overflow-hidden transition-colors duration-150 faq-item"
              :class="{ 'border-[#7c3aed]': faqOpen === i }"
            >
              <button
                class="w-full flex items-center justify-between px-5 py-4 bg-transparent border-none cursor-pointer text-[.97rem] font-semibold text-[var(--hw-text)] text-left gap-4 hover:bg-[rgba(124,58,237,.1)] hover:text-[#7c3aed] transition-colors duration-100"
                @click="toggleFaq(i)"
              >
                <span>{{ item.q }}</span>
                <span class="text-[1.1rem] font-light text-[var(--hw-text-3)] shrink-0 leading-none">{{ faqOpen === i ? '−' : '+' }}</span>
              </button>
              <div
                class="faq-answer px-5 text-[.92rem] text-[var(--hw-text-2)] leading-[1.75]"
                :class="{ 'faq-open': faqOpen === i }"
              >
                {{ item.a }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- ══════════════════ FOOTER ══════════════════ -->
    <footer class="border-t border-[var(--hw-border)] pt-14 px-4 sm:px-8 pb-0">
      <div class="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 pb-12 border-b border-[var(--hw-border)]">
        <!-- Brand -->
        <div class="max-w-[280px]">
          <span class="text-[1.1rem] font-semibold bg-gradient-to-r from-[#bd34fe] to-[#41d1ff] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] block mb-2">{{ APP_NAME }}</span>
          <p class="text-[.88rem] text-[var(--hw-text-3)] mb-5 leading-[1.6]">打字练英语，一次敲击，一点进步。</p>
          <ChannelIcons type="horizontal" :share="false" />
        </div>
        <!-- Nav columns -->
        <div class="flex gap-12 flex-wrap">
          <div class="flex flex-col gap-2.5">
            <div class="text-[.8rem] font-bold tracking-[.06em] uppercase text-[var(--hw-text-3)] mb-1">功能</div>
            <NuxtLink to="/words" class="footer-link">单词练习</NuxtLink>
            <NuxtLink to="/articles" class="footer-link">文章练习</NuxtLink>
            <NuxtLink to="/fsrs" class="footer-link">FSRS 数据</NuxtLink>
          </div>
          <div class="flex flex-col gap-2.5">
            <div class="text-[.8rem] font-bold tracking-[.06em] uppercase text-[var(--hw-text-3)] mb-1">支持</div>
            <NuxtLink to="/help" class="footer-link">帮助文档</NuxtLink>
            <NuxtLink to="/feedback" class="footer-link">反馈问题</NuxtLink>
            <NuxtLink to="/doc" class="footer-link">学习资料</NuxtLink>
          </div>
          <div class="flex flex-col gap-2.5">
            <div class="text-[.8rem] font-bold tracking-[.06em] uppercase text-[var(--hw-text-3)] mb-1">项目</div>
            <a :href="GITHUB" target="_blank" class="footer-link">GitHub</a>
            <NuxtLink to="/setting" class="footer-link">设置</NuxtLink>
          </div>
        </div>
      </div>
      <!-- Footer bottom -->
      <div class="max-w-[1100px] mx-auto py-5 flex items-center gap-4 flex-wrap">
        <template v-if="locale === 'zh'">
          <a
            href="https://beian.mps.gov.cn/#/query/webSearch?code=51015602001426"
            target="_blank"
            class="text-[.8rem] text-[var(--hw-text-3)] no-underline hover:text-[var(--hw-text-2)] transition-colors duration-150"
          >川公网安备51015602001426号</a>
          <a
            href="https://beian.miit.gov.cn/"
            class="text-[.8rem] text-[var(--hw-text-3)] no-underline hover:text-[var(--hw-text-2)] transition-colors duration-150"
            target="_blank"
          >蜀ICP备2025157466号-2</a>
        </template>
        <span class="text-[.8rem] text-[var(--hw-text-3)] ml-auto">© 2026 {{ APP_NAME }}. All rights reserved.</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* CSS 变量主题令牌 */
.hw {
  --hw-bg: #f4f5f7;
  --hw-bg-card: #ffffff;
  --hw-bg-nav: rgba(244, 245, 247, 0.88);
  --hw-border: #e2e4e8;
  --hw-text: #0d0d0d;
  --hw-text-2: #555e6e;
  --hw-text-3: #585d66;
  --hw-shadow-sm: 0 1px 4px rgba(0, 0, 0, 0.06);
  --hw-shadow-md: 0 4px 20px rgba(0, 0, 0, 0.09);
  --hw-shadow-lg: 0 12px 48px rgba(0, 0, 0, 0.11);
  background: var(--hw-bg);
  color: var(--hw-text);
}
.hw.dark {
  --hw-bg: #0e1217;
  --hw-bg-card: #171d26;
  --hw-bg-nav: rgba(14, 18, 23, 0.92);
  --hw-border: #2a3140;
  --hw-text: #e8eaf0;
  --hw-text-2: #8a93a8;
  --hw-text-3: #72839f;
  --hw-shadow-sm: 0 1px 4px rgba(0, 0, 0, 0.35);
  --hw-shadow-md: 0 4px 20px rgba(0, 0, 0, 0.45);
  --hw-shadow-lg: 0 12px 48px rgba(0, 0, 0, 0.55);
}

@font-face {
  font-family: 'Garamond';
  font-style: italic;
  font-weight: 700;
  font-display: swap;
  src: url(https://fonts.gstatic.com/l/font?kit=XoHg2Y_-T6Oo88RDZSQPp2sshj3I9QTcqzw&skey=509bbab0bec2784f&v=v18) format('woff2');
}

/* Hero 标题艺术字体 */
.hero-title {
  font-family: Garamond, Georgia, 'Times New Roman', serif;
  font-style: italic;
  letter-spacing: 0.08em;
}

/* 核心价值 pill */
.value-pill {
  @apply inline-flex items-center gap-1.5 text-[.78rem] font-bold tracking-[.03em] px-3.5 py-1.5 rounded-full border;
}
.value-pill--purple {
  @apply border-[rgba(124,58,237,.35)] text-[#7c3aed] bg-[rgba(124,58,237,.07)];
}
.value-pill--blue {
  @apply border-[rgba(37,99,235,.35)] text-[#2563eb] bg-[rgba(37,99,235,.07)];
}
.value-pill--green {
  @apply border-[rgba(16,185,129,.35)] text-[#059669] bg-[rgba(16,185,129,.07)];
}

/* 区块标签胶囊 */
.section-label {
  @apply inline-block text-[.72rem] font-bold tracking-[.07em] uppercase px-3 py-1 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#2563eb] text-white mb-3;
}
/* 区块标题 h2 */
.section-h2 {
  @apply text-[clamp(1.5rem,3vw,2rem)] font-bold mb-2.5 text-[var(--hw-text)];
}
/* 区块描述段落 */
.section-desc {
  @apply text-[var(--hw-text-2)] text-[1rem] mx-auto max-w-[520px] leading-[1.75];
}
/* 特性卡片 */
.feature-card {
  @apply bg-[var(--hw-bg-card)] border border-[var(--hw-border)] rounded-2xl p-7 hover:-translate-y-1 hover:shadow-[var(--hw-shadow-md)] transition-all duration-200 cursor-default;
}
/* 快捷键容器 item */
.shortcut-item {
  @apply bg-[var(--hw-bg)] border border-[var(--hw-border)] rounded-lg px-6 py-5 flex flex-col gap-2.5;
}
/* kbd 按键样式 */
.kbd-key {
  @apply inline-flex items-center justify-center min-w-8 h-7 px-2 bg-[var(--hw-bg-card)] border border-[var(--hw-border)] border-b-2 rounded text-[.78rem] font-mono font-semibold text-[var(--hw-text)] shadow-[0_1px_2px_rgba(0,0,0,.08)];
}
/* Footer 导航链接 */
.footer-link {
  @apply text-[.88rem] text-[var(--hw-text-2)] no-underline hover:text-[var(--hw-text)] transition-colors duration-150;
}

/* 打字光标 blink */
.typing-cursor { opacity: 1; transition: opacity 0.1s; }
.typing-cursor.blink { opacity: 0; }

/* 打字 Demo 输错抖动 */
.demo-shake {
  animation: demo-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
@keyframes demo-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

/* Demo 卡片空闲时边框呼吸动画 */
.demo-idle-border {
  animation: demo-border-pulse 2.4s ease-in-out infinite;
}
@keyframes demo-border-pulse {
  0%, 100% { border-color: var(--hw-border); }
  50% { border-color: rgba(124, 58, 237, 0.45); }
}

/* 点击引导文字 — 抖动 + 脉冲 */
.demo-click-guide {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: .88rem;
  font-weight: 600;
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.09);
  border: 1.5px solid rgba(124, 58, 237, 0.35);
  border-radius: 999px;
  padding: 8px 18px;
  cursor: pointer;
  animation: guide-attention 1.8s ease-in-out infinite;
  backdrop-filter: blur(4px);
}
@keyframes guide-attention {
  0%, 100% { transform: translateY(0) scale(1); box-shadow: 0 0 0 0 rgba(124,58,237,0); }
  30% { transform: translateY(-3px) scale(1.03); box-shadow: 0 4px 16px rgba(124,58,237,.18); }
  60% { transform: translateY(0) scale(1); box-shadow: 0 0 0 0 rgba(124,58,237,0); }
  80% { transform: translateY(-2px) scale(1.01); }
}

/* 引导箭头弹跳 */
.demo-bounce-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(124, 58, 237, 0.6);
  margin-top: 6px;
  animation: arrow-bounce 1.4s ease-in-out infinite;
}
@keyframes arrow-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.6; }
  50% { transform: translateY(5px); opacity: 1; }
}

/* 小程序码卡片 */
.mini-qr-card {
  @apply items-center gap-3 bg-[var(--hw-bg-card)] border border-[var(--hw-border)] rounded-xl px-4 py-3 shadow-[var(--hw-shadow-sm)] hover:border-[rgba(124,58,237,.4)] hover:shadow-[var(--hw-shadow-md)] transition-all duration-200;
}

/* FAQ 高度过渡 */
.faq-answer {
  max-height: 0;
  overflow: hidden;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
  transition: max-height 0.3s ease, padding 0.3s ease, opacity 0.25s;
}
.faq-answer.faq-open {
  max-height: 14rem;
  padding-bottom: 1.25rem;
  opacity: 1;
}
</style>
