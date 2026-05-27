export type Species = {
  url?: string
  nombre_cientifico: string
  nombre_comun?: string
  comestible?: string
  medicinal?: string
  origen?: string
  region_pampeana?: string
  region_nea?: string
  region_noa?: string
  region_cuyana?: string
  region_patagonica?: string
}

export type SpeciesFilters = {
  url?: string
  user_sabores?: boolean
  borigen_cuyana?: boolean
  borigen_nea?: boolean
  borigen_noa?: boolean
  borigen_pampeana?: boolean
  borigen_patagonica?: boolean
}