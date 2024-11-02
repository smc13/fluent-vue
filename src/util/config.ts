import type { FluentVariable } from '@fluent/bundle'

/**
 * Allows customisation of types
 */
export declare interface TypesConfig {}

export interface FluentMessageInfo {
  variables: string[] | undefined
  attributes: string[]
}

export type FluentMap = TypesConfig extends Record<
  'FluentMessageMap',
  infer FluentMessageMap
> ? FluentMessageMap : Record<string, FluentMessageInfo>

export type FluentMapGeneric = Record<string, NonNullable<FluentMessageInfo>>

export type FluentRecord<Key extends keyof FluentMap, value> = Record<Key, value>
export type FluentVariableRecord<Key extends keyof FluentMap> = FluentMap[Key]['variables'] extends string[] ? Record<FluentMap[Key]['variables'][number], FluentVariable> : undefined

export type FluentAttributeRecord<Key extends keyof FluentMap> = Record<FluentMap[Key]['attributes'][number], string>
