export type Species = {
  url?: string
  nombre_cientifico: string
  nombre_comun?: string
  comestible?: string
  medicinal?: string
  origen?: string
}

export type SpeciesFilters = {
  url?: string
  user_sabores?: boolean
}