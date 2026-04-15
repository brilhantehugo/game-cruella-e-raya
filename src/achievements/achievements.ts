import { AchievementDef } from './AchievementDef'

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Combate ──────────────────────────────────────────────────────────────
  { id: 'first_blood', title: 'Primeira Baixa', description: 'Derrotaste o teu primeiro inimigo', icon: '🗡️', category: 'combat', condition: { type: 'counter', key: 'enemies_killed', threshold: 1 } },
  { id: 'pest_control', title: 'Controlo de Pragas', description: 'Derrota 50 inimigos', icon: '🐀', category: 'combat', condition: { type: 'counter', key: 'enemies_killed', threshold: 50 } },
  { id: 'exterminator', title: 'Exterminadora', description: 'Derrota 200 inimigos', icon: '💀', category: 'combat', condition: { type: 'counter', key: 'enemies_killed', threshold: 200 } },
  { id: 'boss_slayer', title: 'Caçadora de Chefes', description: 'Derrota todos os 4 bosses', icon: '👑', category: 'combat', condition: { type: 'counter', key: 'bosses_defeated', threshold: 4 } },
  { id: 'speed_kill', title: 'Relâmpago', description: 'Derrota um boss em menos de 90 segundos', icon: '⚡', category: 'combat', condition: { type: 'flag', key: 'speed_kill_achieved' } },
  { id: 'no_damage_boss', title: 'Intocável', description: 'Derrota qualquer boss sem levar dano', icon: '🛡️', category: 'combat', condition: { type: 'flag', key: 'no_damage_boss' } },
  // ── Colecção ─────────────────────────────────────────────────────────────
  { id: 'first_bone', title: 'Boa Menina', description: 'Apanha o teu primeiro golden bone', icon: '🦴', category: 'collection', condition: { type: 'counter', key: 'golden_bones', threshold: 1 } },
  { id: 'bone_collector', title: 'Coleccionadora', description: 'Apanha 10 golden bones', icon: '✨', category: 'collection', condition: { type: 'counter', key: 'golden_bones', threshold: 10 } },
  { id: 'bone_master', title: 'Mestre dos Ossos', description: 'Apanha todos os 64 golden bones', icon: '🏅', category: 'collection', condition: { type: 'counter', key: 'golden_bones', threshold: 64 } },
  { id: 'item_hoarder', title: 'Acumuladora', description: 'Apanha 100 itens no total', icon: '🎒', category: 'collection', condition: { type: 'counter', key: 'items_collected', threshold: 100 } },
  { id: 'pizza_lover', title: 'Amante de Pizza', description: 'Apanha 5 pizzas', icon: '🍕', category: 'collection', condition: { type: 'counter', key: 'pizzas_collected', threshold: 5 } },
  // ── Estilo de Jogo ────────────────────────────────────────────────────────
  { id: 'pacifist', title: 'Pacifista', description: 'Completa um nível sem derrotar nenhum inimigo', icon: '☮️', category: 'style', condition: { type: 'flag', key: 'pacifist_level' } },
  { id: 'speedrunner', title: 'Speedrunner', description: 'Completa um nível com 60 segundos ou mais no relógio', icon: '⏱️', category: 'style', condition: { type: 'flag', key: 'speedrun_level' } },
  { id: 'no_death_world', title: 'Sem Arranhões', description: 'Completa um mundo inteiro sem morrer', icon: '💚', category: 'style', condition: { type: 'flag', key: 'no_death_world' } },
  { id: 'checkpoint_free', title: 'Voo Livre', description: 'Completa um nível sem usar o checkpoint', icon: '🚀', category: 'style', condition: { type: 'flag', key: 'checkpoint_free_level' } },
  { id: 'full_health_boss', title: 'Sã e Salva', description: 'Derrota um boss com a vida cheia', icon: '❤️', category: 'style', condition: { type: 'flag', key: 'full_health_boss' } },
  // ── Narrativa ────────────────────────────────────────────────────────────
  { id: 'world_1_done', title: 'Rua Conquistada', description: 'Completa o Mundo 1', icon: '🏙️', category: 'narrative', condition: { type: 'flag', key: 'world_1_done' } },
  { id: 'world_2_done', title: 'Prédio Conquistado', description: 'Completa o Mundo 2', icon: '🏢', category: 'narrative', condition: { type: 'flag', key: 'world_2_done' } },
  { id: 'world_3_done', title: 'Noite Conquistada', description: 'Completa o Mundo 3', icon: '🌙', category: 'narrative', condition: { type: 'flag', key: 'world_3_done' } },
  { id: 'true_ending', title: 'Finalmente em Casa', description: 'Vê o final completo do jogo', icon: '🏠', category: 'narrative', condition: { type: 'flag', key: 'ending_seen' } },
]
