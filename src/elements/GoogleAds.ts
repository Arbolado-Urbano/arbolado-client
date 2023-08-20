export default class GoogleAds extends HTMLElement {
  constructor() {
    super()
    const { VITE_GOOGLE_ADSENSE_CLIENT: client, VITE_GOOGLE_ADSENSE_SLOT: slot, VITE_ENV } = import.meta.env
    const script = document.createElement('script')
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`
    script.crossOrigin = 'anonymous'
    script.addEventListener('load', () => (window.adsbygoogle = window.adsbygoogle || []).push({}))
    const ins = document.createElement('ins')
    ins.classList.add('adsbygoogle')
    ins.classList.add('mt-4')
    ins.classList.add('d-block')
    ins.setAttribute('data-ad-client', client)
    ins.setAttribute('data-ad-slot', slot)
    ins.setAttribute('data-full-width-responsive', 'true')
    if (VITE_ENV === 'DEV') ins.setAttribute('data-adtest', 'on')
    this.appendChild(script)
    this.appendChild(ins)
  }
}