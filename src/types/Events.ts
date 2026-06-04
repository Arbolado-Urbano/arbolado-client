import { Step } from "../elements/AddTreeForm/AddTreeForm"
import { Filters } from "./Filters"
import { Species } from "./Species"
import { Tree } from "./Tree"

export type ArboladoEventMap = {
  'arbolado:loading': CustomEvent<{ loading: boolean }>
  'arbolado:ios/location': CustomEvent<{ error: '2' | '3', coords?: never } | { error?: never, coords: GeolocationCoordinates }>
  'arbolado:captcha/callback': CustomEvent<{ token: string }>
  'arbolado:captcha/loaded': CustomEvent<void>
  'arbolado:queryParams/update': CustomEvent<void>
  'arbolado:overlay/click': CustomEvent<void>
  'arbolado:tab/open': CustomEvent<void>
  'arbolado:tab/close': CustomEvent<void>
  'arbolado:alert/closed': CustomEvent<void>
  'arbolado:geo/searching': CustomEvent<void>
  'arbolado:address/selected': CustomEvent<{ lat: number, lng: number }>
  'arbolado:geo/success': CustomEvent<{ lat: number, lng: number }>
  'arbolado:geo/error': CustomEvent<{ error: GeolocationPositionError | '2' | '3' }>
  'arbolado:form/step': CustomEvent<{ previous: Step, current: Step }>
  'arbolado:species/change': CustomEvent<{ species: Species | null }>
  'arbolado:species/loaded': CustomEvent<void>
  'arbolado:map/loaded': CustomEvent<void>
  'arbolado:map/move': CustomEvent<{ bounds: maplibregl.LngLatBounds }>
  'arbolado:search': CustomEvent<{ filters: Filters }>
  'arbolado:tree/selected': CustomEvent<{ id: string }>
  'arbolado:tree/displayed': CustomEvent<{ tree: Tree }>
}