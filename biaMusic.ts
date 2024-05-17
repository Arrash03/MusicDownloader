import {GoToOptions, Page} from "puppeteer";
import SingleBrowser from "./singleBrowser.js";
import {IAlbum, IArchive, ILink, Quality} from "./music.js";

export default class BiaMusic {
    // could get musics from full archive page url
    private static readonly GO_TO_OPTIONS: GoToOptions = {
        waitUntil: "load",
        // could place in an env file
        // it need to be base on page numbers and connection speed
        timeout: 30000
    };
    static browser: SingleBrowser;

    // @ts-ignore
    private readonly _url: string;
    private _page: null | Page;
    private _quality: Quality;


    constructor(url: string, quality: Quality) {
        this._url = url;
        this._page = null;
        this._quality = quality;
    }

    // @ts-ignore
    private static async createBrowser() {
        this.browser = await SingleBrowser.getInstance();
    }

    private async createPage() {
        let newPage: Page | null = null;
        while (newPage === null) {
            newPage = await BiaMusic.browser.createNewPage();
        }
        return newPage
    }

    public async findArchive() {
        await BiaMusic.createBrowser();
        this._page = await this.createPage();
        await this._page!.goto(this._url, BiaMusic.GO_TO_OPTIONS);
        const result: IArchive = {
            single_musics: [],
            album_musics: []
        };
        // result.single_musics = await this.findSingleMusics();
        result.album_musics = await this.findAlbums();
        return result;
    }

    private async findMusicPagesUrl(selector: string) {
        const ul = await this._page?.waitForSelector(selector);
        let temp = (await ul?.$$("li"))!.map(async li => {
            const music: ILink = {
                name: "",
                url: ""
            };
            try {
                music.name = (await ((await (await li!.$("strong"))!.getProperty("textContent"))!.jsonValue()))!;
                music.url = (await ((await (await li!.$("a"))!.getProperty("href"))!.jsonValue()))!;
            } catch (err) {
                if (err instanceof Error)
                    console.error(err.message);
            }
            return music;
        });
        return await Promise.all(temp);
    }

    public async findSingleMusics() {
        const SELECTOR = "div.biartpost:nth-child(3) > ul:nth-child(2)";
        const urls = await this.findMusicPagesUrl(SELECTOR);
        const result: ILink[] = [];
        const temp = [];
        for (let i = 0; i < SingleBrowser.MAX_OPEN_TAB; i++) {
            temp.push(this.createPage());
        }
        // right now just this scraper works so none of them will be null
        const pages = await Promise.all(temp);
        let queue = [];
        for (let i = 0; i < urls.length; i += SingleBrowser.MAX_OPEN_TAB) {
            queue = pages.map(async (page, index) => {
                if (i + index >= urls.length)
                    return;
                try {
                    await page!.goto(urls[i + index].url, BiaMusic.GO_TO_OPTIONS);
                } catch (err) {
                    if (err instanceof Error)
                        console.error(err.message);
                }
                let url = "";
                try {
                    if (this._quality === Quality._320) {
                        const QUALITY_320_SELECTOR = ".biadl > a:nth-child(3)";
                        url = await (await (await page!.waitForSelector(QUALITY_320_SELECTOR))!.getProperty("href")).jsonValue();
                    } else {
                        const QUALITY_128_SELECTOR = ".biadl > a:nth-child(4)";
                        url = await (await (await page!.waitForSelector(QUALITY_128_SELECTOR))!.getProperty("href")).jsonValue();
                    }
                } catch (err) {
                    if (err instanceof Error)
                        console.warn(err.message);
                } finally {
                    urls[i + index].url = url;
                }
            });
            await Promise.all(queue);
        }
        // just need to set it is not busy
        return result;
    }

    private async findAlbums() {
        const SELECTOR = "div.biartpost:nth-child(4) > ul:nth-child(2)";
        const albums: IAlbum[] = [];
        const urls = await this.findMusicPagesUrl(SELECTOR);
        const temp = [];
        for (let i = 0; i < SingleBrowser.MAX_OPEN_TAB; i++) {
            temp.push(this.createPage());
        }
        // right now just this scraper works so none of them will be null
        const pages = await Promise.all(temp);
        let queue = [];
        for (let i = 0; i < urls.length; i += SingleBrowser.MAX_OPEN_TAB) {
            queue = pages.map(async (page, index) => {
                if (i + index >= urls.length)
                    return;
                try {
                    await page!.goto(urls[i + index]?.url, BiaMusic.GO_TO_OPTIONS);
                } catch (err) {
                    if (err instanceof Error)
                        console.error(err.message);
                }
                const SELECTOR = ".bialbum";
                let temp = (await (await page.waitForSelector(SELECTOR))?.$$("li:nth-child(odd)"))?.map(async li => {
                    let music: ILink = {
                        name: "",
                        url: ""
                    };
                    try {
                        music = {
                            name: (await (await (await li!.waitForSelector("strong"))!.getProperty("textContent"))!.jsonValue())!,
                            url: (await (await (await li!.waitForSelector("a"))!.getProperty("href"))!.jsonValue())!
                        }
                    } catch (err) {
                        console.info(urls[i + index]?.url);
                        if (err instanceof Error)
                            console.warn(err.message);
                    }
                    return music;
                })
                const album: IAlbum = {
                    name: urls[i + index].name,
                    musics: await Promise.all(temp!)
                };
                albums.push(album);
            });
            await Promise.all(queue);
        }
        // just need to set it is not busy
        return albums;
    }

    get quality(): Quality {
        return this._quality;
    }

    set quality(value: Quality) {
        this._quality = value;
    }
}