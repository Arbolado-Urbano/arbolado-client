export default class Captcha extends HTMLElement {
  private sitekey: string
  public rendered: boolean = false

  constructor() {
    super()
    this.render = this.render.bind(this)
    this.callback = this.callback.bind(this)

    this.sitekey = this.getAttribute('data-sitekey') || ''
    document.addEventListener('arbolado:captcha/loaded', this.render, { once: true })
  }

  execute(): Promise<string> {
    this.classList.add("show")
    if (!this.rendered) this.render()
    return new Promise((resolve, reject) => {
      document.addEventListener('arbolado:captcha/callback', (event) => {
        const { token } = (event as CustomEvent).detail
        this.classList.remove("show")
        resolve(token)
      }, { once: true })
      try {
        window.turnstile.execute(this)
      } catch (error) {
        this.classList.remove("show")
        reject(error)
      }
    })
  }

  render() {
    window.turnstile.render(this, {
      sitekey: this.sitekey,
      callback: this.callback,
      size: 'normal',
    })
    this.rendered = true
  }

  callback(token: string) {
    window.Arbolado.emitEvent(document, 'arbolado:captcha/callback', { token })
    window.turnstile.reset()
  }
}