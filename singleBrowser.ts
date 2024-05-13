import puppeteer, {Browser, PuppeteerLaunchOptions, Page} from "puppeteer";

// interface IPage {
//     page: Page,
//     isBusy: boolean,
//     data: number
// }

export default class SingleBrowser {
    public static readonly BROWSER_CONFIGS: PuppeteerLaunchOptions = {
        product: "firefox",
        protocol: "webDriverBiDi",
        headless: false
    };
    public static readonly MAX_OPEN_TAB = 5;
    public static instance: SingleBrowser | null = null;
    private browser: Browser;
    // private pages: IPage[]


    private constructor(browser: Browser) {
        this.browser = browser;
        // this.pages = []
    }

    public static async getInstance() {
        if (!this.instance) {
            const browser = await puppeteer.launch(this.BROWSER_CONFIGS);
            this.instance = new SingleBrowser(browser);
        }
        return this.instance;
    }

    // could add options
    public async createNewPage(): Promise<Page | null> {
        let page: Page | null = null
        if ((await this.browser.pages()).length <= SingleBrowser.MAX_OPEN_TAB) {
            page = await this.browser.newPage();
            await page.setViewport({width: 1920, height: 1080});
        }
        return page;
    }
}