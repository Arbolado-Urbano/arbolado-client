export default class TabGroup extends HTMLElement {
  private tabs: NodeListOf<Element>
  private tabBtns: NodeListOf<Element>
  
  constructor() {
    super()
    this.tabs = this.querySelectorAll('[js-tab]')
    this.tabBtns = this.querySelectorAll('[js-tab-btn]')
    this.tabBtns.forEach((tabBtn) => tabBtn.addEventListener('click', () => this.show(tabBtn)))
  }

  private show(tabBtn: Element) {
    const tabTarget = tabBtn.getAttribute('js-tab-btn')
    const tab = this.querySelector(`[js-tab="${tabTarget}"]`)
    if (!tab) return
    this.tabs.forEach((tab) => {
      const hidden = tab.classList.toggle('d-none')
      if (hidden) window.Arbolado.emitEvent(tab, 'arbolado:tab/close')
      else window.Arbolado.emitEvent(tab, 'arbolado:tab/open')
    })
    tab.classList.remove('d-none')
    this.tabBtns.forEach((tabBtn) => {
      tabBtn.classList.remove('active')
      tabBtn.removeAttribute('aria-current')
    })
    tabBtn.classList.add('active')
    tabBtn.setAttribute('aria-current', 'page')
    window.Arbolado.emitEvent(tab, 'arbolado:tab/open')
  }
}