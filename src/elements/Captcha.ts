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
    return new Promise((resolve, reject) => {
      document.addEventListener('arbolado:captcha/callback', (event) => {
        const { token } = (event as CustomEvent).detail
        resolve(token)
      }, { once: true })
      try {
        window.grecaptcha.execute()
      } catch (error) {
        reject(error)
      }
    })
  }

  render() {
    window.grecaptcha.render(this, {
      sitekey: this.sitekey,
      callback: this.callback,
      size: 'invisible',
    })
    this.rendered = true
  }

  callback(token: string) {
    window.Arbolado.emitEvent(document, 'arbolado:captcha/callback', { token })
    window.grecaptcha.reset()
  }
}