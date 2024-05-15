import BiaMusic, {Quality} from "./biaMusic.js";
// import Downloader from "./downloder.js";

(async () => {
    const obj = new BiaMusic("وحید تاج", "https://biamusic.ir/artist/vahid-taj/", Quality._320);
    await obj.find();
    // await obj.download("/home/fanaa/projects/other/music_downloader/data");
    // const downloader = new Downloader("/home/fanaa/projects/other/music_downloader");
    // await downloader.download("https://dl.biamusic.ir/Tak/Vahid%20Taj/Vahid%20Taj%20-%20Bekhan%20Be%20Name%20Asheghi.mp3", "test.mp3");
})();