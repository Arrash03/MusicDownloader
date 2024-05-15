import puppeteer from "puppeteer";

const a = () => {
    console.log("A")
}

let b = a;

console.log(b === null)

// (async () => {
//     // Launch the browser and open a new blank page
//     const browser = await puppeteer.launch({
//         product: "firefox",
//         protocol: "webDriverBiDi",
//         headless: false
//     });
//     const page = (await browser.pages())[0];
//     // Navigate the page to a URL
//     await page.goto('https://developer.chrome.com/');
//     // Set screen size
//     await page.setViewport({width: 1080, height: 1024});
//     // Type into search box
//     await page.type('.devsite-search-field', 'automate beyond recorder');
//     // Wait and click on first result
//     const searchResultSelector = '.devsite-result-item-link';
//     await page.waitForSelector(searchResultSelector);
//     await page.click(searchResultSelector);
//     // Locate the full title with a unique string
//     const textSelector = await page.waitForSelector(
//         'text/Customize and automate'
//     );
//     await browser.close();
// })()