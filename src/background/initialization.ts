import { storage, openURL } from '@/_helpers/browser-api'
import checkUpdate from '@/_helpers/check-update'
import { mergeConfig } from '@/app-config/merge-config'
import appConfigFactory, { AppConfig } from '@/app-config'
import { getAppConfig, setAppConfig } from '@/_helpers/config-manager'
import { init as initMenus, openPDF, openGoogle, openYoudao } from './context-menus'
import { init as initPdf } from './pdf-sniffer'

getAppConfig().then(config => {
  initMenus(config.contextMenus)
  initPdf(config.pdfSniff)
})

browser.runtime.onInstalled.addListener(onInstalled)
browser.runtime.onStartup.addListener(onStartup)
browser.notifications.onClicked.addListener(genClickListener('https://github.com/crimx/crx-saladict/wiki'))
if (browser.notifications.onButtonClicked) {
  // Firefox doesn't support
  browser.notifications.onButtonClicked.addListener(genClickListener('https://github.com/crimx/crx-saladict/releases'))
}

browser.commands.onCommand.addListener(command => {
  switch (command) {
    case 'toggle-active':
      getAppConfig().then(config => {
        setAppConfig({
          ...config,
          active: !config.active,
        })
      })
      break
    case 'open-google':
      openGoogle()
      break
    case 'open-youdao':
      openYoudao()
      break
    case 'open-pdf':
      openPDF()
      break
  }
})

function onInstalled ({ reason, previousVersion }: { reason: string, previousVersion?: string }) {
  // merge config on installed
  return storage.sync.get('config')
    .then(({ config }: { config: AppConfig }) => {
      if (!process.env.DEV_BUILD) {
        if (config && config.dicts) {
          // got previous config
          const base = mergeConfig(config)
          return storage.sync.set({ config: base })
            .then(() => base)
        }
      }
      return storage.sync.clear() // local get cleared by database
        .then(() => {
          if (!process.env.DEV_BUILD) {
            openURL('https://github.com/crimx/crx-saladict/wiki/Instructions')
          }
          return appConfigFactory()
        })
    })
    .then(config => {
      if (reason === 'update') {
        // ignore patch updates
        if (!previousVersion || previousVersion.replace(/[^.]*$/, '') !== browser.runtime.getManifest().version.replace(/[^.]*$/, '')) {
          showNews()
        }
      }
      initMenus(config.contextMenus)
      initPdf(config.pdfSniff)
      storage.local.set({ lastCheckUpdate: Date.now() })
    })
}

function onStartup (): void {
  // check update every week
  storage.local.get<{ lastCheckUpdate: number }>('lastCheckUpdate')
    .then(({ lastCheckUpdate }) => {
      const today = Date.now()
      if (!lastCheckUpdate || !(today - lastCheckUpdate < 7 * 24 * 60 * 60 * 1000)) {
        checkUpdate().then(({ info, isAvailable }) => {
          storage.local.set({ lastCheckUpdate: today })
          if (isAvailable) {
            browser.notifications.create('update', {
              type: 'basic',
              iconUrl: browser.runtime.getURL(`static/icon-128.png`),
              title: '沙拉查词',
              message: (`可更新至【${info.tag_name}】`
              ),
              buttons: [{ title: '查看更新' }],
            })
          }
        })
      }
    })
}

function genClickListener (url: string) {
  return function clickListener (notificationId: string) {
    if (!/^(oninstall|update)$/.test(notificationId)) { return }
    openURL(url)
    browser.notifications.getAll()
      .then(notifications => {
        Object.keys(notifications).forEach(id => browser.notifications.clear(id))
      })
  }
}

function showNews () {
  return fetch('https://api.github.com/repos/crimx/crx-saladict/releases/latest')
    .then(r => r.json())
    .then(data => {
      if (data && data.tag_name) {
        browser.notifications.create('oninstall', {
          type: 'basic',
          iconUrl: browser.runtime.getURL(`static/icon-128.png`),
          title: `沙拉查词 Saladict【${data.tag_name}】`,
          message: data.body.match(/^\d+\..+/gm).join('\n'),
          buttons: [{ title: '查看更新' }],
        })
      }
    })
}
