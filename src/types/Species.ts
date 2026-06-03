export type Species = {
  id?: number
  url?: string
  nombre_cientifico: string
  nombre_comun?: string
  comestible?: string
  medicinal?: string
}

export type SpeciesFilters = {
  url?: string
  user_sabores?: boolean
}