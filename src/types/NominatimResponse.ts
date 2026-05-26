declare type NominatimResponse = {
  latlng: { lat: number, lng: number }
  displayName: string
  type: string
  address: object
}

export default NominatimResponse