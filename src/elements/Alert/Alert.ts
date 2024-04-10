import AlertTemplate from './Alert.html?raw'

export default class Alert extends HTMLElement {
  contentElement: HTMLElement
  
  constructor(type: AlertType, content: string = '') {
    super()
    this.innerHTML = AlertTemplate
    this.show = this.show.bind(this)
    this.hide = this.hide.bind(this)
    this.setType = this.setType.bind(this)
    this.setContent = this.setContent.bind(this)

    const template = window.Arbolado.loadTemplate(AlertTemplate) as HTMLTemplateElement
    this.append(template)
    this.classList.add('alert')
    this.classList.add('alert-dismissible')
    this.classList.add('fade')
    this.setAttribute('role', 'alert')
    this.contentElement = this.querySelector('[js-alert-content]') as HTMLElement
    if (type) this.setType(type)
    this.setContent(content)
    if (this.dataset['content']) this.setContent(this.dataset['content'])
    const closeElement = this.querySelector('[js-alert-close]') as HTMLButtonElement
    closeElement.addEventListener('click', this.hide.bind(this))
  }

  show(time?: number) {
    this.classList.add('show')
    if (time) setTimeout(this.hide.bind(this), time)
  }
  
  hide() {
    // Wait for the animation to finish before dispatching the "closed" event
    this.addEventListener('transitionend', () => window.Arbolado.emitEvent(this, 'arbolado:alert/closed'), { once: true })
    this.classList.remove('show')
  }

  setType(type: AlertType) {
    this.classList.remove('alert-danger')
    this.classList.remove('alert-info')
    this.classList.remove('alert-success')
    this.classList.add(`alert-${type}`)
  }

  setContent(content: string) {
    this.contentElement.innerHTML = content
  }
}

export type AlertType = 'danger' | 'info' | 'success'
