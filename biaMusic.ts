import puppeteer, {Browser, PuppeteerLaunchOptions, Page, GoToOptions} from "puppeteer";

export default class BiaMusic {
    // static URL: string = "https://biamusic.ir";
    static BROWSER_CONFIGS: PuppeteerLaunchOptions = {
        product: "firefox",
        protocol: "webDriverBiDi",
        headless: false
    };
    static GO_TO_OPTIONS: GoToOptions = {
        waitUntil: "domcontentloaded",
        // could place in an env file
        timeout: 30000
    };
    static browser: Browser;
    url: string;
    musicUrls: string[];
    singerName: string;
    limit: number;
    page: null | Page;

    constructor(singerName: string, url: string, limit: number = 0) {
        this.url = url;
        this.singerName = singerName;
        this.limit = Math.abs(limit);
        this.musicUrls = [];
        this.page = null;
    }

    private async createBrowser() {
        if (!BiaMusic.browser)
            BiaMusic.browser = await puppeteer.launch(BiaMusic.BROWSER_CONFIGS);
        this.page = (await BiaMusic.browser.pages()).at(0)!;
    }

    public async find() {
        await this.createBrowser();
        await this.page!.goto(this.url, BiaMusic.GO_TO_OPTIONS);


    }

}