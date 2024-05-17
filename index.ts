import BiaMusic from "./biaMusic.js";
import path from "path";
import fs from "fs";
import fsPromise from "fs/promises";
import Downloader from "./downloader.js";
import {sleep} from "./tools.js";
import {IAlbum, ILink, Quality} from "./music.js";

// @ts-ignore
const downloadSingleMusics = async (musics: ILink[], musicPath: string, downloader: Downloader) => {
    let res: null | void = null;
    for (const music of musics) {
        try {
            while (res === null) {
                res = await downloader.download(music.url, path.join(musicPath, `${music.name}.mp3`));
                // it could be changed dynamically
                await sleep(100);
            }
        } catch (err) {
            if (err instanceof Error)
                console.warn(err.message)
        }
        res = null;
    }
}

// @ts-ignore
const downloadAlbums = async (albums: IAlbum[], albumsPath: string, downloader: Downloader) => {
    let albumPath: string;
    for (const album of albums) {
        albumPath = path.join(albumsPath, album.name);
        if (!fs.existsSync(albumPath))
            await fsPromise.mkdir(albumPath);
        await downloadSingleMusics(album.musics, albumPath, downloader);
    }
}

(async () => {
    const obj = new BiaMusic("https://biamusic.ir/artist/vahid-taj/", Quality._320);
    const archive = await obj.findArchive();
    console.log(archive.album_musics);
    // const DOWNLOAD_PATH = "/home/fanaa/projects/other/music_downloader/data";
    // const SINGLE_MUSIC_PATH = path.join(DOWNLOAD_PATH, "single_musics");
    // const ALBUM_PATH = path.join(DOWNLOAD_PATH, "albums");
    // if (!fs.existsSync(SINGLE_MUSIC_PATH))
    //     await fsPromise.mkdir(SINGLE_MUSIC_PATH, {recursive: true});
    // if (!fs.existsSync(ALBUM_PATH))
    //     await fsPromise.mkdir(ALBUM_PATH);
    // const downloader = new Downloader(DOWNLOAD_PATH);
    // await downloadSingleMusics(archive.single_musics, DOWNLOAD_PATH, downloader);
    // await downloadAlbums(archive.album_musics, ALBUM_PATH, downloader);
})();