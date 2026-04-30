export default class TabGroup extends HTMLElement {
  private tabs: NodeListOf<Element>
  private tabBtns: NodeListOf<Element>
  private current?: string | null

  constructor() {
    super()
    this.tabs = this.querySelectorAll('[js-tab]')
    this.tabBtns = this.querySelectorAll('[js-tab-btn]')
    this.tabBtns.forEach((tabBtn) => tabBtn.addEventListener('click', () => this.show(tabBtn.getAttribute("js-tab-btn") ?? "")))
    this.current = this.querySelector('[aria-current]')?.getAttribute('js-tab-btn')
  }

  public currentTab() {
    return this.current
  }

  public show(tabName: string) {
    if (!tabName) return
    const currentOpenTab = this.querySelector(`[js-tab="${this.current}"]`)
    this.current = tabName
    const tabBtn = this.querySelector(`[js-tab-btn="${tabName}"]`)
    const tab = this.querySelector(`[js-tab="${tabName}"]`)
    if (!tabBtn || !tab) return
    this.tabs.forEach((tab) => tab.classList.add('d-none'))
    tab.classList.remove('d-none')
    this.tabBtns.forEach((tabBtn) => {
      tabBtn.classList.remove('active')
      tabBtn.removeAttribute('aria-current')
    })
    tabBtn.classList.add('active')
    tabBtn.setAttribute('aria-current', 'page')
    window.Arbolado.emitEvent(tab, 'arbolado:tab/open')
    if (currentOpenTab) window.Arbolado.emitEvent(currentOpenTab, 'arbolado:tab/close')
  }
}