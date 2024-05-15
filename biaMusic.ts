import {GoToOptions, Page} from "puppeteer";
import Downloader from "./downloader.js";
import fs from "fs";
import fsPromise from 'fs/promises';
import path from "path";
import SingleBrowser from "./singleBrowser.js";
import {sleep} from "./tools.js";

interface ILink {
    name: string,
    url: string
}

interface IAlbum {
    name: string,
    musics: ILink[]
}

interface IMusicUrls {
    single_musics: ILink[],
    album_musics: IAlbum[]
}

export enum Quality {
    _320,
    _128
}

export default class BiaMusic {
    // static URL: string = "https://biamusic.ir";
    private static readonly GO_TO_OPTIONS: GoToOptions = {
        waitUntil: "load",
        // could place in an env file
        // it need to be base on page numbers and connection speed
        timeout: 30000
    };
    private static readonly MAX_CONCURRENT_DOWNLOAD_FILE = 5;

    static browser: SingleBrowser;
    private readonly _url: string;
    private _musicUrls: IMusicUrls;
    private readonly _singerName: string;
    private _limit: number;
    private _page: null | Page;
    private _quality: Quality;
    private _downloader: Downloader | null;


    constructor(singerName: string, url: string, quality: Quality, limit: number = 0) {
        this._url = url;
        this._singerName = singerName;
        this._limit = Math.abs(limit);
        this._musicUrls = {
            single_musics: [],
            album_musics: []
        };
        this._page = null;
        this._quality = quality;
        this._downloader = null;
    }

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

    public async find() {
        await BiaMusic.createBrowser();
        this._page = await this.createPage();
        await this._page!.goto(this._url, BiaMusic.GO_TO_OPTIONS);
        // await this.findSingleMusicsDownloadUrl();
        await this.findAlbumDownloadUrl();

        console.log(this._musicUrls, this._musicUrls.single_musics.length + this._musicUrls.album_musics.length);


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

    // @ts-ignore
    private async findSingleMusicsDownloadUrl() {
        const SELECTOR = "div.biartpost:nth-child(3) > ul:nth-child(2)";
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
                try {
                    if (i + index >= urls.length)
                        return;
                    await page!.goto(urls[i + index].url, BiaMusic.GO_TO_OPTIONS);
                    let url;
                    if (this._quality === Quality._320) {
                        const QUALITY_320_SELECTOR = ".biadl > a:nth-child(3)";
                        url = await (await (await page!.waitForSelector(QUALITY_320_SELECTOR))!.getProperty("href")).jsonValue();
                    } else {
                        const QUALITY_128_SELECTOR = ".biadl > a:nth-child(4)";
                        url = await (await (await page!.waitForSelector(QUALITY_128_SELECTOR))!.getProperty("href")).jsonValue();
                    }
                    urls[i + index].url = url;
                } catch (err) {
                    if (err instanceof Error)
                        console.error(err.message);
                }
            });
            await Promise.all(queue);
        }
        // just need to set it is not busy
        this._musicUrls.single_musics = urls;
    }

    // @ts-ignore
    private async findAlbumDownloadUrl() {
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
                try {
                    if (i + index >= urls.length)
                        return;
                    await page!.goto(urls[i + index]?.url, BiaMusic.GO_TO_OPTIONS);
                    const SELECTOR = ".bialbum";
                    let temp = (await (await page.waitForSelector(SELECTOR))?.$$("li:nth-child(odd)"))?.map(async li => {
                        let music: ILink = {
                            name: "",
                            url: ""
                        };
                        try {
                            await sleep(1000);
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
                } catch (err) {
                    if (err instanceof Error)
                        console.error(err.message);
                }
            });
            await Promise.all(queue);
        }
        // just need to set it is not busy
        this._musicUrls.album_musics = albums;
    }

    public async download(downloadPath: string) {
        const SINGLE_MUSIC_PATH = path.join(downloadPath, "single_musics");
        const ALBUM_PATH = path.join(downloadPath, "albums");
        if (!fs.existsSync(SINGLE_MUSIC_PATH))
            await fsPromise.mkdir(SINGLE_MUSIC_PATH, {recursive: true});
        if (!fs.existsSync(ALBUM_PATH))
            await fsPromise.mkdir(ALBUM_PATH);
        if (!this._downloader)
            this._downloader = new Downloader(SINGLE_MUSIC_PATH)
        await this.downloadSingleMusics();
    }

    private async downloadSingleMusics() {
        let queue = [];
        for (let i = 0; i < this._musicUrls.single_musics.length; i += BiaMusic.MAX_CONCURRENT_DOWNLOAD_FILE) {
            queue = Array.from(Array(BiaMusic.MAX_CONCURRENT_DOWNLOAD_FILE).keys())
                .map(async (_, index) => {
                    if (i + index >= this._musicUrls.single_musics.length)
                        return;
                    let music = this._musicUrls.single_musics[i + index];
                    try {
                        await this._downloader!.download(music.url, `${music.name}.mp3`)
                    } catch (err) {
                        if (err instanceof Error)
                            console.error(err.message)
                    }
                });
            await Promise.all(queue);
        }
    }

    get quality(): Quality {
        return this._quality;
    }

    set quality(value: Quality) {
        this._quality = value;
    }

    get limit(): number {
        return this._limit;
    }

    set limit(value: number) {
        this._limit = value;
    }

    get singerName(): string {
        return this._singerName;
    }
}