export default class Modal extends HTMLElement {
  private label: string
  private dialog: HTMLDialogElement
  private outsideClick: boolean = true

  constructor() {
    super()
    this.hide = this.hide.bind(this)
    this.show = this.show.bind(this)
    this.hideOnNav = this.hideOnNav.bind(this)
    this.showOnNav = this.showOnNav.bind(this)
    this.outsideClickHandler = this.outsideClickHandler.bind(this)
    this.insideClickHandler = this.insideClickHandler.bind(this)

    this.dialog = this.querySelector('[js-dialog]') as HTMLDialogElement
    this.label = this.getAttribute('js-modal') || ''
    document.querySelectorAll(`[js-modal-open="${this.label}"]`).forEach((openBtn) => {
      (openBtn as HTMLElement).addEventListener('click', this.show)
    })
    
    const contentElement = this.querySelector('[js-modal-content]') as HTMLElement
    contentElement.addEventListener('click', this.insideClickHandler)
    
    this.querySelectorAll('[js-modal-close]').forEach((closeBtn) => {
      (closeBtn as HTMLElement).addEventListener('click', this.hide)
    })

    // Prevent the default "cancel" dialog event to take place
    this.dialog.addEventListener('cancel', (event: Event) => event.preventDefault())
    this.addEventListener('click', this.outsideClickHandler)
  }

  show(_?: MouseEvent, pushState = true) {
    window.Arbolado.hideBodyScroll()
    window.Arbolado.callOnEscPush(this.hide)
    this.dialog.showModal()
    this.classList.add('open')
    if (pushState) window.history.pushState({ modal: this.label }, 'modal-open')
    window.removeEventListener('popstate', this.showOnNav)
    window.addEventListener('popstate', this.hideOnNav)
  }

  hide(_?: MouseEvent, pushState = true) {
    this.addEventListener('transitionend', () => this.dialog.close(), { once: true })
    this.classList.remove('open')
    window.Arbolado.showBodyScroll()
    window.Arbolado.callOnEscRemove(this.hide)
    if (pushState) window.history.pushState({ modal: false }, 'modal-close')
    window.removeEventListener('popstate', this.hideOnNav)
    window.addEventListener('popstate', this.showOnNav)
  }

  private insideClickHandler() {
    this.outsideClick = false
  }

  private outsideClickHandler() {
    if (this.outsideClick) this.hide()
    else this.outsideClick = true
  }

  private hideOnNav(event: PopStateEvent) { if (!(event.state?.modal === this.label.toString())) this.hide(undefined, false) }

  private showOnNav(event: PopStateEvent) { if (event.state?.modal === this.label.toString()) this.show(undefined, false) }
}
