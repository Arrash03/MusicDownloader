import puppeteer from "puppeteer";

(async () => {
    const browser = await puppeteer.launch({
        product: "firefox",
        protocol: "webDriverBiDi",
        headless: false
    })
    const page = await browser.newPage()
    await page.setRequestInterception(true)

    page.on('request', (request) => {
        console.log('Request: ', request.method(), request.url())
        request.continue()
    })

    await page.goto('https://google.com/')

    await browser.close()
})()
