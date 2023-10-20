declare type Tree = {
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
  records: {
    id: number
    altura?: string
    diametro_a_p?: string
    diametro_a_copa?: string
    inclinacion?: string
    fecha_creacion: string
    source: {
      id: number
      nombre: string
      descripcion: string
      facebook?: string
      instagram?: string
      twitter?: string
      url?: string
    }
  }[]
}

export default Tree