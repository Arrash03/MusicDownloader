import puppeteer, {Browser, PuppeteerLaunchOptions, Page, GoToOptions} from "puppeteer";

interface IMusic {
    name: string,
    url: string
}

interface IAlbum {
    name: string,
    musics: IMusic[]
}

interface IMusicUrls {
    single_musics: IMusic[],
    album_musics: IAlbum[]
}

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
    musicUrls: IMusicUrls;
    singerName: string;
    limit: number;
    page: null | Page;

    constructor(singerName: string, url: string, limit: number = 0) {
        this.url = url;
        this.singerName = singerName;
        this.limit = Math.abs(limit);
        this.musicUrls = {
            single_musics: [],
            album_musics: []
        };
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
        await this.find_single_musics();

        console.log(this.musicUrls.single_musics);


    }

    private async find_single_musics() {
        const SELECTOR = "div.biartpost:nth-child(3) > ul:nth-child(2)";
        const ul = await this.page?.waitForSelector(SELECTOR);
        const urls = (await ul?.$$("li"))!.map(async li => {
            const music: IMusic = {
                name: "",
                url: ""
            };
            try {
                music.name = (await((await (await li!.$("strong"))!.getProperty("textContent"))!.jsonValue()))!;
                music.url = (await((await (await li!.$("a"))!.getProperty("href"))!.jsonValue()))!;
            } catch (err){
                if (err instanceof Error)
                    console.error(err.message);
            }
            return music;
        });
        this.musicUrls.single_musics = await Promise.all(urls);
    }

}