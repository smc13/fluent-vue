import { watchEffect } from 'vue-demi'
import type { Vue2Directive, Vue3Directive, VueDirectiveBinding } from '../types/typesCompat'
import type { TranslationContext } from '../TranslationContext'

import { warn } from '../util/warn'
import { getContext } from '../getContext'
import { isAttrNameLocalizable } from './dom'

function translate(el: HTMLElement, fluent: TranslationContext, binding: VueDirectiveBinding): void {
  const key = binding.arg

  if (key === undefined) {
    warn('v-t directive is missing arg with translation key')
    return
  }

  const translation = fluent.formatWithAttrs(key, binding.value)

  if (translation.hasValue)
    el.textContent = translation.value

  const allowedAttrs = Object.keys(binding.modifiers)
  for (const [attr, attrValue] of Object.entries(translation.attributes)) {
    if (isAttrNameLocalizable(attr, el, allowedAttrs))
      el.setAttribute(attr, attrValue)
    else
      warn(`Attribute '${attr}' on element <${el.tagName.toLowerCase()}> is not localizable. Remove it from the translation. Translation key: ${key}`)
  }
}

export function createVue3Directive(rootContext: TranslationContext): Vue3Directive {
  return {
    mounted(el, binding) {
      watchEffect(() => {
        const context = getContext(rootContext, binding.instance)
        translate(el, context, binding)
      })
    },

    updated(el, binding) {
      const context = getContext(rootContext, binding.instance)
      translate(el, context, binding)
    },

    getSSRProps(binding) {
      const context = getContext(rootContext, binding.instance)
      const key = binding.arg
      if (key === void 0) {
        warn('v-t directive is missing arg with translation key')
        return {}
      }
      const translation = context.formatWithAttrs(key, binding.value)
      const allowedAttrs = Object.keys(binding.modifiers)
      const attrs: Record<string, string> = {}
      for (const [attr, attrValue] of Object.entries(translation.attributes)) {
        // Vue 3 does not expose the element in the binding object
        // so we can't check if the attribute is allowed
        // we assume that all attributes are allowed
        // this could lead to SSR hydration mismatches if translation
        // contains attributes that are not allowed
        // There is a runtime warning in the browser console in case translation contains not allowed attributes
        if (isAttrNameLocalizable(attr, {} as HTMLElement, allowedAttrs))
          attrs[attr] = attrValue
      }

      // TODO: Include textContent when https://github.com/vuejs/core/issues/8112 is resolved
      return attrs
    },
  }
}

export function createVue2Directive(rootContext: TranslationContext): Vue2Directive {
  return {
    bind(el, binding, vnode) {
      const context = getContext(rootContext, vnode.context)
      translate(el, context, binding)
    },

    update(el, binding, vnode) {
      const context = getContext(rootContext, vnode.context)
      translate(el, context, binding)
    },
  }
}
