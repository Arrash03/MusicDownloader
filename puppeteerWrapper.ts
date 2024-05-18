import puppeteer, {Browser, PuppeteerLaunchOptions, Page, GoToOptions} from "puppeteer";

export default class PuppeteerWrapper {
    // temporary. if project grows more and need more features of puppeteer i need to implement a wrapper for puppeteer, browser and page
    public static readonly BROWSER_CONFIGS: PuppeteerLaunchOptions = {
        product: "firefox",
        protocol: "webDriverBiDi",
        headless: false
    };
    public static readonly MAX_OPEN_TAB = 5;
    public static instance: PuppeteerWrapper | null = null;
    public static MAXIMUM_TRY = 3;
    public static ABORTED_REQUESTS_TYPE = [".png", ".mp3", ".gif", ".jpg", ".jpeg", ".mpeg"]
    private browser: Browser;
    private isFirstTime: boolean;


    private constructor(browser: Browser) {
        this.browser = browser;
        this.isFirstTime = true;
    }

    private static isRequestNeedToAbort(url: string) {
        return PuppeteerWrapper.ABORTED_REQUESTS_TYPE.some(type => {
            return url.endsWith(type);
        })
    }

    public static async getInstance() {
        if (!this.instance) {
            const browser = await puppeteer.launch(this.BROWSER_CONFIGS);
            this.instance = new PuppeteerWrapper(browser);
        }
        return this.instance;
    }

    public async createNewPage(): Promise<Page | null> {
        let page: Page | null = null
        if (this.isFirstTime) {
            page = (await this.browser.pages())[0];
            await page.setRequestInterception(true);
            page.on("request", req => {
                if (PuppeteerWrapper.isRequestNeedToAbort(req.url()))
                    req.abort("timedout");
                else
                    req.continue();
            });
            this.isFirstTime = false;
        } else if ((await this.browser.pages()).length <= PuppeteerWrapper.MAX_OPEN_TAB) {
            page = await this.browser.newPage();
            await page.setRequestInterception(true);
            page.on("request", req => {
                if (PuppeteerWrapper.isRequestNeedToAbort(req.url()))
                    req.abort("timedout");
                else
                    req.continue();
            });
            await page.setViewport({width: 1920, height: 1080});
        }
        return page;
    }

    public async goto(page: Page, url: string, options?: GoToOptions) {
        for (let i = 0; i < PuppeteerWrapper.MAXIMUM_TRY; i++) {
            try {
                if (i !== 0)
                    console.info(`${i + 1}th try for ${url}`)
                await page.goto(url, options);
                break;
            } catch (err) {
                if (PuppeteerWrapper.MAXIMUM_TRY - 1)
                    console.warn(`fetching page ${url} reaches to timeout...`)
            }

        }
    }

    public async close() {
        await this.browser.close();
    }
}