import puppeteer, {Browser, PuppeteerLaunchOptions, Page} from "puppeteer";

export default class PuppeteerWrapper {
    public static readonly BROWSER_CONFIGS: PuppeteerLaunchOptions = {
        product: "firefox",
        protocol: "webDriverBiDi",
        headless: false
    };
    public static readonly MAX_OPEN_TAB = 5;
    public static instance: PuppeteerWrapper | null = null;
    private browser: Browser;
    private isFirstTime: boolean;


    private constructor(browser: Browser) {
        this.browser = browser;
        this.isFirstTime = true;
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
            this.isFirstTime = false;
        } else if ((await this.browser.pages()).length <= PuppeteerWrapper.MAX_OPEN_TAB) {
            page = await this.browser.newPage();
            await page.setViewport({width: 1920, height: 1080});
        }
        return page;
    }
}