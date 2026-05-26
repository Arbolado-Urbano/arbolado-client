type NominatimAddress = {
  railway?: string
  road?: string
  suburb?: string
  city?: string
  state_district?: string
  state?: string
  postcode?: string
  country?: string
  country_code?: string
  [key: string]: string | undefined
}

export type NominatimSearchResult = {
  place_id: number
  licence: string
  osm_type: 'node' | 'way' | 'relation'
  osm_id: number
  lat: string
  lon: string
  class: string
  type: string
  place_rank: number
  importance: number
  addresstype: string
  name?: string
  display_name: string
  address?: NominatimAddress
  boundingbox: [string, string, string, string]
  icon?: string
}

export type NominatimResponse = {
  latlng: { lat: number, lng: number }
  displayName: string
  type: string
  address: object
}