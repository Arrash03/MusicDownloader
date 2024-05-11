import BiaMusic, {Quality} from "./biaMusic.js";

(async () => {
    const obj = new BiaMusic("وحید تاج", "https://biamusic.ir/artist/vahid-taj/", Quality._320);
    await obj.find();
})();