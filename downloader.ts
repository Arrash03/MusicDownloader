import axios from "axios";
import fs from "fs";
import path from "path";

export default class Downloader {
    static readonly MAX_CONCURRENT_DOWNLOAD_FILE = 5;

    private _downloadPath: string;
    private concurrentDownload: number;

    constructor(downloadPath: string) {
        this._downloadPath = downloadPath;
        this.concurrentDownload = 0;
    }

    public async download(url: string, fileName: string): Promise<null | void> {
        if (this.concurrentDownload >= Downloader.MAX_CONCURRENT_DOWNLOAD_FILE)
            return null;
        const start = Date.now();
        try {
            this.concurrentDownload++;
            console.log("download started...");
            const response = await axios.get(url, {responseType: 'stream'}); // Specify stream response type

            if (response.status !== 200) {
                throw new Error(`Failed to download file. Status: ${response.status}`);
            }

            const fileStream = fs.createWriteStream(path.join(this._downloadPath, fileName));
            response.data.pipe(fileStream);

            await new Promise((resolve, reject) => {
                fileStream.on('finish', resolve);
                fileStream.on('error', reject);
            });

            console.log(`${fileName} downloaded successfully at ${Date.now() - start} ms`);
        } catch (error) {
            console.error(`Error downloading ${fileName} at ${Date.now() - start} ms`);
            throw error;
        } finally {
            // check is this one reduced after throwing an error
            this.concurrentDownload--;
        }
    }

    public downloadPath(path: string) {
        let result = false;
        if (this.concurrentDownload === 0) {
            this._downloadPath = path;
            result = true;
        }
        return result;
    }

    // public downloadPath() {
    //     return this._downloadPath;
    // }
}