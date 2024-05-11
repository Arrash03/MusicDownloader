import puppeteer, {Browser, PuppeteerLaunchOptions, Page, GoToOptions} from "puppeteer";
import Downloader from "./downloader.js";
import fs from "fs";
import fsPromise from 'fs/promises';
import path from "path";

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

export enum Quality {
    _320,
    _128
}

export default class BiaMusic {
    // static URL: string = "https://biamusic.ir";
    static BROWSER_CONFIGS: PuppeteerLaunchOptions = {
        product: "firefox",
        protocol: "webDriverBiDi",
        headless: false
    };
    static GO_TO_OPTIONS: GoToOptions = {
        waitUntil: "load",
        // could place in an env file
        // it need to be base on page numbers and connection speed
        timeout: 20000
    };
    static MAX_OPEN_TAB= 5;
    static MAX_CONCURRENT_DOWNLOAD_FILE = 5;
    static browser: Browser;
    url: string;
    musicUrls: IMusicUrls;
    singerName: string;
    limit: number;
    page: null | Page;
    quality: Quality;
    downloader: Downloader | null;


    constructor(singerName: string, url: string, quality: Quality, limit: number = 0) {
        this.url = url;
        this.singerName = singerName;
        this.limit = Math.abs(limit);
        this.musicUrls = {
            single_musics: [],
            album_musics: []
        };
        this.page = null;
        this.quality = quality;
        this.downloader = null;
    }

    private async createBrowser() {
        if (!BiaMusic.browser)
            BiaMusic.browser = await puppeteer.launch(BiaMusic.BROWSER_CONFIGS);
        this.page = (await BiaMusic.browser.pages()).at(0)!;
    }

    public async find() {
        await this.createBrowser();
        await this.page!.goto(this.url, BiaMusic.GO_TO_OPTIONS);
        await this.findSingleMusics();

        console.log(this.musicUrls.single_musics, this.musicUrls.single_musics.length);


    }

    private async findSingleMusics() {
        const SELECTOR = "div.biartpost:nth-child(3) > ul:nth-child(2)";
        const ul = await this.page?.waitForSelector(SELECTOR);
        let temp = (await ul?.$$("li"))!.map(async li => {
            const music: IMusic = {
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
        const urls = await Promise.all(temp);
        this.musicUrls.single_musics = await this.findSingleMusicsDownloadUrl(urls);
    }

    private async findSingleMusicsDownloadUrl(urls: IMusic[]) {
        const temp = [];
        for (let i = 0; i < BiaMusic.MAX_OPEN_TAB; i++) {
            temp.push(BiaMusic.browser.newPage());
        }
        const pages = await Promise.all(temp);
        await Promise.all(pages.map(page => {
            return page.setViewport({ width: 1920, height: 1080 });
        }));
        let queue = [];
        for (let i = 0; i < urls.length; i+=BiaMusic.MAX_OPEN_TAB) {
            queue = pages.map(async (page, index) => {
                try {
                    if (i + index >= urls.length)
                        return;
                    await page.goto(urls[i + index].url, BiaMusic.GO_TO_OPTIONS);
                    let url;
                    if (this.quality === Quality._320) {
                        const QUALITY_320_SELECTOR = ".biadl > a:nth-child(3)";
                        url = await (await (await page.waitForSelector(QUALITY_320_SELECTOR))!.getProperty("href")).jsonValue();
                    } else {
                        const QUALITY_128_SELECTOR = ".biadl > a:nth-child(4)";
                        url = await (await (await page.waitForSelector(QUALITY_128_SELECTOR))!.getProperty("href")).jsonValue();
                    }
                    urls[i + index].url = url;
                } catch (err) {
                    if (err instanceof Error)
                        console.error(err.message);
                }
            });
            await Promise.all(queue);
        }
        await Promise.all(pages.map(page => {
            page.close();
        }));
        return urls;
    }

    public async download(downloadPath: string) {
        const SINGLE_MUSIC_PATH = path.join(downloadPath, "single_musics");
        const ALBUM_PATH = path.join(downloadPath, "albums");
        if (!fs.existsSync(SINGLE_MUSIC_PATH))
            await fsPromise.mkdir(SINGLE_MUSIC_PATH, {recursive: true});
        if (!fs.existsSync(ALBUM_PATH))
            await fsPromise.mkdir(ALBUM_PATH);
        if (!this.downloader)
            this.downloader = new Downloader(SINGLE_MUSIC_PATH)
        await this.downloadSingleMusics();
    }

    private async downloadSingleMusics() {
        let queue = [];
        for (let i = 0; i < this.musicUrls.single_musics.length; i+=BiaMusic.MAX_CONCURRENT_DOWNLOAD_FILE) {
            queue = Array.from(Array(BiaMusic.MAX_CONCURRENT_DOWNLOAD_FILE).keys())
                .map(async (_, index) => {
                    if (i + index >= this.musicUrls.single_musics.length)
                        return;
                    let music = this.musicUrls.single_musics[i + index];
                    try {
                        await this.downloader!.download(music.url, `${music.name}.mp3`)
                    } catch (err) {
                        if (err instanceof Error)
                            console.error(err.message)
                    }
                });
            await Promise.all(queue);
        }
    }
}