import BiaMusic from "./biaMusic.js";

(async () => {
    const obj = new BiaMusic("وحید تاج");
    await obj.find();
})();