import BiaMusic from "./biaMusic.js";

(async () => {
    const obj = new BiaMusic("وحید تاج", "https://biamusic.ir/artist/vahid-taj/");
    await obj.find();
})();