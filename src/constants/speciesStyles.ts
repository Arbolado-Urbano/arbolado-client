export const ICON_PATH = '/imgs/markers/'

type SpeciesStyle = { icon: string, color: string }

const speciesStyles: Record<string, SpeciesStyle> = {
  'no-determinable': { icon: 'marker-sin-especie.png', color: '#a0a0a0' },
  'no-determinado': { icon: 'marker-sin-especie.png', color: '#a0a0a0' },
  'jacaranda-mimosifolia': { icon: 'marker-violeta.png', color: '#9798fb' },
  'persea-americana': { icon: 'marker-palta.png', color: '#f8ff92' },
  'liquidambar- styraciflua': { icon: 'marker-rojo.png', color: '#f83a3a' },
  'ceiba-speciosa': { icon: 'marker-rosa.png', color: '#fb7a9b' },
  'syagrus-romanzoffiana': { icon: 'marker-syagrus.png', color: '#788059' },
  'erythrina-cristagalli': { icon: 'marker-ceibo.png', color: '#e6262b' },
  'morus-alba': { icon: 'marker-morus.png', color: '#28316f' },
  'handroanthus-impetiginosa': { icon: 'marker-rosa.png', color: '#fb7a9b' },
  'tabebuia-chrysotricha': { icon: 'marker-amarillo.png', color: '#ffd500' },
  'ginkgo-biloba': { icon: 'marker-ginkgo.png', color: '#f9d11f' },
  'bauhinia-forficata': { icon: 'marker-bauhinia.png', color: '#538036' },
  'bauhinia-variegata': { icon: 'marker-bauhinia.png', color: '#538036' },
  'peltophorum-dubium': { icon: 'marker-amarillo.png', color: '#ffd500' },
  'celtis-ehrembergiana': { icon: 'marker-tala.png', color: '#e79737' },
  'acer-palmatum': { icon: 'marker-rojo.png', color: '#f83a3a' },
  'acacia-caven': { icon: 'marker-amarillo.png', color: '#ffd500' },
  'citrus-aurantifolia': { icon: 'marker-lima.png', color: '#89b833' },
  'citrus-aurantium': { icon: 'marker-naranjo-amargo.png', color: '#ffaf1f' },
  'citrus-limon': { icon: 'marker-limon.png', color: '#f7d020' },
  'citrus-paradisi': { icon: 'marker-pomelo.png', color: '#ffdb15' },
  'citrus-reticulata': { icon: 'marker-citrus.png', color: '#ffaf1f' },
  'citrus-sinensis': { icon: 'marker-naranjo-dulce.png', color: '' },
  'erythrina-falcata': { icon: 'marker-ceibo.png', color: '#e6262b' },
  'morus-alba-var-pendula': { icon: 'marker-morus.png', color: '#28316f' },
  'morus-nigra': { icon: 'marker-morus.png', color: '#28316f' },
  'tecoma-stans': { icon: 'marker-amarillo.png', color: '#ffd500' },
  'morus-sp': { icon: 'marker-morus.png', color: '#28316f' },
  'citrus sp': { icon: 'marker-citrus.png', color: '#ffaf1f' },
  'mangifera-sp': { icon: 'marker-naranja.png', color: '#f76619' },
  'mangifera-indica': { icon: 'marker-naranja.png', color: '#f76619' },
  'citrus-tangerina': { icon: 'marker-citrus.png', color: '#ffaf1f' },
  'plantera-vacia': { icon: 'marker-vacia.png', color: '#d6d6d7' },
  'handroanthus-ochraceus': { icon: 'marker-amarillo.png', color: '#ffd500' },
  'tabebuia-rosea': { icon: 'marker-rosa.png', color: '#fb7a9b' },
  'erythrina-variegata': { icon: 'marker-ceibo.png', color: '#e6262b' },
}

export const DEFAULTS: SpeciesStyle = { icon: 'marker-default.png', color: '#5cba9d' }

export function getSpeciesStyle(url?: string): SpeciesStyle {
  if (!url) return DEFAULTS
  return speciesStyles[url] ?? DEFAULTS
}