import BiaMusic from "./biaMusic.js";
import path from "path";
import fs from "fs";
import fsPromise from "fs/promises";
import downloader from "./downloader.js";
import {IAlbum, ILink, Quality} from "./music.js";
import crypto from "crypto";

const downloadSingleMusics = async (musics: ILink[], musicPath: string) => {
    const queue = [];
    for (let i = 0; i < musics.length; i+=5) {
        let j = 0;
        while (j < 5) {
            if (i + j >= musics.length)
                break
            if (musics[i + j].url) {
                let name = musics[i + j].name;
                if (!name)
                    name = crypto.randomBytes(16).toString('hex');
                queue.push(downloader(musics[i + j].url, musicPath, `${name}.mp3`));
                ++j;
            }
        }
        await Promise.all(queue);
        queue.splice(0, queue.length);
    }
}

const downloadAlbums = async (albums: IAlbum[], albumsPath: string) => {
    let albumPath;
    for (const album of albums) {
        albumPath = path.join(albumsPath, album.name);
        if (!fs.existsSync(albumPath))
            await fsPromise.mkdir(albumPath);
        await downloadSingleMusics(album.musics, albumPath);
    }
}

(async () => {
    const obj = new BiaMusic("https://biamusic.ir/artist/vahid-taj/", Quality._320);
    const archive = await obj.findArchive();
    await obj.finish();
    const DOWNLOAD_PATH = path.join(__dirname, "data");
    const SINGER_DOWNLOAD_PATH = path.join(DOWNLOAD_PATH, "vahid_taj");
    const SINGLE_MUSIC_PATH = path.join(SINGER_DOWNLOAD_PATH, "single_musics");
    const ALBUM_PATH = path.join(SINGER_DOWNLOAD_PATH, "albums");
    if (!fs.existsSync(SINGLE_MUSIC_PATH))
        await fsPromise.mkdir(SINGLE_MUSIC_PATH, {recursive: true});
    if (!fs.existsSync(ALBUM_PATH))
        await fsPromise.mkdir(ALBUM_PATH);
    await downloadSingleMusics(archive.single_musics, SINGLE_MUSIC_PATH);
    await downloadAlbums(archive.album_musics, ALBUM_PATH);

    await downloader("https://dl.biamusic.ir/Tak/Vahid%20Taj/Vahid%20Taj%20-%20Naghash.mp3", "/home/fanaa/projects/other/music_downloader", "waa");
})();