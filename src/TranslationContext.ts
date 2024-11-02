import type { Message, Pattern } from '@fluent/bundle/esm/ast'
import type { FluentBundle, FluentVariable } from '@fluent/bundle'
import type { Ref } from 'vue-demi'
import { mapBundleSync } from '@fluent/sequence'
import type { TranslationContextOptions } from './types'

import { warn } from './util/warn'
import type { FluentAttributeRecord, FluentMap, FluentVariableRecord } from './util/config'

export interface TranslationWithAttrs<Key extends keyof FluentMap = keyof FluentMap> {
  value: string
  hasValue: boolean
  attributes: FluentAttributeRecord<Key>
}

export class TranslationContext {
  bundles: Ref<Iterable<FluentBundle>>

  constructor(bundles: Ref<Iterable<FluentBundle>>, public options: TranslationContextOptions) {
    this.bundles = bundles
  }

  getBundle(key: string): FluentBundle | null {
    return mapBundleSync(this.bundles.value, key)
  }

  getMessage(bundle: FluentBundle | null, key: string): Message | null {
    const message = bundle?.getMessage(key)

    if (message === undefined) {
      this.options.warnMissing(key)
      return null
    }

    return message
  }

  formatPattern(
    bundle: FluentBundle,
    key: string,
    message: Pattern,
    value?: Record<string, FluentVariable>,
  ): string {
    const errors: Error[] = []
    const formatted = bundle.formatPattern(message, value, errors)

    for (const error of errors)
      warn(`Error when formatting message with key [${key}]`, error)

    return formatted
  }

  private _format<Key extends keyof FluentMap = keyof FluentMap>(
    context: FluentBundle | null,
    message: Message | null,
    value?: FluentVariableRecord<Key>,
  ): string | null {
    if (context === null || message === null || message.value === null)
      return null

    return this.formatPattern(context, message.id, message.value, value)
  }

  format = <Key extends keyof FluentMap = keyof FluentMap>(key: Key, variables: FluentVariableRecord<Key>): string => {
    const context = this.getBundle(key)
    const message = this.getMessage(context, key)
    return this._format(context, message, variables) ?? key
  }

  private _formatAttrs(
    context: FluentBundle | null,
    message: Message | null,
    value?: Record<string, FluentVariable>,
  ): Record<string, string> | null {
    if (context === null || message === null)
      return null

    const result: Record<string, string> = {}
    for (const [attrName, attrValue] of Object.entries(message.attributes))
      result[attrName] = this.formatPattern(context, message.id, attrValue, value)

    return result
  }

  formatAttrs = (key: string, value?: Record<string, FluentVariable>): Record<string, string> => {
    const context = this.getBundle(key)
    const message = this.getMessage(context, key)
    return this._formatAttrs(context, message, value) ?? {}
  }

  formatWithAttrs = <Key extends keyof FluentMap = keyof FluentMap>(key: Key, value?: FluentVariableRecord<Key>): TranslationWithAttrs => {
    const context = this.getBundle(key)
    const message = this.getMessage(context, key)

    const formatValue = this._format(context, message, value)

    return {
      value: formatValue ?? key,
      attributes: this._formatAttrs(context, message, value) ?? {},
      hasValue: formatValue !== null,
    }
  }

  $t = this.format
  $ta = this.formatAttrs
}
