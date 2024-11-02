import './types/volar'
import type { FluentBundle, FluentResource, FluentVariable } from '@fluent/bundle'
import { isVue3, shallowRef } from 'vue-demi'
import type { FluentVueOptions } from './types'

import type { InstallFunction, Vue, Vue2, Vue3, Vue3Component } from './types/typesCompat'
import type { TranslationWithAttrs } from './TranslationContext'
import { TranslationContext } from './TranslationContext'
import { createVue2Directive, createVue3Directive } from './vue/directive'
import { createComponent } from './vue/component'
import { getContext, getMergedContext } from './getContext'
import { RootContextSymbol } from './symbols'
import { resolveOptions } from './util/options'
import type { FluentAttributeRecord, FluentMap, FluentVariableRecord } from './util/config'

export { useFluent } from './composition'

export * from './util/config'

export interface FluentVue {
  /** Current negotiated fallback chain of languages */
  bundles: Iterable<FluentBundle>

  format: <Key extends keyof FluentMap = keyof FluentMap>(key: Key, variables?: FluentVariableRecord<Key>) => string

  formatAttrs: <Key extends keyof FluentMap = keyof FluentMap>(key: Key, variables?: FluentVariableRecord<Key>) => FluentAttributeRecord<Key>

  formatWithAttrs: <Key extends keyof FluentMap = keyof FluentMap>(key: Key, variables?: FluentVariableRecord<Key>) => TranslationWithAttrs<Key>

  mergedWith: (extraTranslations?: Record<string, FluentResource>) => TranslationContext

  $t: <Key extends keyof FluentMap = keyof FluentMap>(key: Key, variables?: FluentVariableRecord<Key>) => string
  $ta: <Key extends keyof FluentMap = keyof FluentMap>(key: Key, variables?: FluentVariableRecord<Key>) => FluentAttributeRecord<Key>

  install: InstallFunction
}

/**
 * Creates FluentVue instance that can be used on a Vue app.
 *
 * @param options - {@link FluentVueOptions}
 */
export function createFluentVue(options: FluentVueOptions): FluentVue {
  const bundles = shallowRef(options.bundles)

  const resolvedOptions = resolveOptions(options)

  const rootContext = new TranslationContext(bundles, resolvedOptions)

  return {
    get bundles() {
      return bundles.value
    },
    set bundles(value) {
      bundles.value = value
    },

    mergedWith: (extraTranslations?: Record<string, FluentResource>) => {
      return getMergedContext(rootContext, extraTranslations)
    },

    format: rootContext.format.bind(rootContext),
    formatAttrs: rootContext.formatAttrs.bind(rootContext),
    formatWithAttrs: rootContext.formatWithAttrs.bind(rootContext),

    $t: rootContext.format.bind(rootContext),
    $ta: rootContext.formatAttrs.bind(rootContext),

    install(vue) {
      if (isVue3) {
        const vue3 = vue as Vue3

        vue3.provide(RootContextSymbol, rootContext)

        vue3.config.globalProperties[resolvedOptions.globalFormatName] = function (
          key: string,
          value?: Record<string, FluentVariable>,
        ) {
          return getContext(rootContext, this as Vue3Component).format(key, value as any)
        }
        vue3.config.globalProperties[resolvedOptions.globalFormatAttrsName] = function (
          key: string,
          value?: Record<string, FluentVariable>,
        ) {
          return getContext(rootContext, this as Vue3Component).formatAttrs(key, value)
        }

        vue3.directive(resolvedOptions.directiveName, createVue3Directive(rootContext))
      }
      else {
        const vue2 = vue as Vue2

        vue2.mixin({
          provide() {
            return {
              [RootContextSymbol as symbol]: rootContext,
            }
          },
        })

        vue2.prototype[resolvedOptions.globalFormatName] = function (key: string, value?: Record<string, FluentVariable>) {
          return getContext(rootContext, this).format(key, value as any)
        }
        vue2.prototype[resolvedOptions.globalFormatAttrsName] = function (key: string, value?: Record<string, FluentVariable>) {
          return getContext(rootContext, this).formatAttrs(key, value)
        }

        vue2.directive(resolvedOptions.directiveName, createVue2Directive(rootContext))
      }

      (vue as Vue).component(resolvedOptions.componentName, createComponent(resolvedOptions, rootContext))
    },
  }
}
