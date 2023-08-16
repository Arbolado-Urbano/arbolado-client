import { LatLng } from 'leaflet'

declare type NominatimResponse = {
  latlng: LatLng
  displayName: string
  type: string
  address: object
}

export default NominatimResponse