export type AchievementCategory = 'combat' | 'collection' | 'style' | 'narrative'

export type AchievementCondition =
  | { type: 'counter'; key: string; threshold: number }
  | { type: 'flag';    key: string }

export interface AchievementDef {
  id: string
  title: string
  description: string
  icon: string
  category: AchievementCategory
  secret?: boolean
  condition: AchievementCondition
}
