import type { DefineComponent, FunctionDirective, PropType } from 'vue-demi'
import type { FluentVariable } from '@fluent/bundle'
import type { FluentAttributeRecord, FluentMap, FluentVariableRecord } from '../util/config'

type ComponentType = DefineComponent<{
  /**
   * The key of the translation.
   */
  path: {
    type: StringConstructor
    required: true
  }
  /**
   * Arguments to pass to the translation.
   */
  args: {
    type: PropType<Record<string, FluentVariable>>
    default: () => Record<string, FluentVariable>
  }
  /**
   * The tag to use as a root element.
   */
  tag: {
    type: StringConstructor
    default: 'span'
  }
  /**
   * Whether to render translation as html.
   */
  html: {
    type: BooleanConstructor
    default: false
  }
  /**
   * Whether to render translation without a root element.
   */
  noTag: {
    type: BooleanConstructor
    default: false
  }
}>

// eslint-disable-next-line ts/ban-ts-comment
// @ts-ignore: works on Vue 2, fails in Vue 3
declare module 'vue/types/vue' {
  export interface Vue {
    $t: <Key extends keyof FluentMap = keyof FluentMap>(key: Key, variables?: FluentVariableRecord<Key>) => string
    $ta: <Key extends keyof FluentMap = keyof FluentMap>(key: Key, variables?: FluentVariableRecord<Key>) => FluentAttributeRecord<Key>
  }
}

// eslint-disable-next-line ts/ban-ts-comment
// @ts-ignore: works on Vue 3, fails in Vue 2
declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $t: <Key extends keyof FluentMap = keyof FluentMap>(key: Key, variables?: FluentVariableRecord<Key>) => string
    $ta: <Key extends keyof FluentMap = keyof FluentMap>(key: Key, variables?: FluentVariableRecord<Key>) => FluentAttributeRecord<Key>
    vT: FunctionDirective<HTMLElement, Record<string, FluentVariable>>
  }

  export interface GlobalComponents {
    i18n: ComponentType
  }
}
