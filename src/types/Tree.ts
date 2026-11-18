export type TreeRecord = {
  id: number
  altura?: string
  diametro_a_p?: string
  diametro_copa?: string
  altura_copa?: string
  altura_tronco?: string
  lugar?: string
  cobertura?: string
  inclinacion?: string
  fecha_creacion: string
  estado_fitosanitario?: string
  etapa_desarrollo?: string
  source: {
    id: number
    nombre: string
    descripcion: string
    facebook?: string
    instagram?: string
    twitter?: string
    url?: string
  }
}

export type Tree = {
  id: number
  calle?: string
  calle_altura?: string
  espacio_verde?: string
  streetview?: string
  lat: number
  lng: number
  species: {
    id: number
    nombre_cientifico: string
    nombre_comun: string
    origen: string
    procedencia_exotica?: string
    icono: string
    url?: string
    family: { id: number, familia: string }
    type: { id: number, tipo: string }
  },
  records: TreeRecord[]
}

export type Trees = {
  id: number,
  lat: number,
  lng: number,
  species: number,
  deleted?: string,
}[]

export type GeoJSONTrees = {
  type: 'FeatureCollection',
  features: {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [number, number],
    },
    properties: {
      id: number,
      species: number,
    },
  }[],
}