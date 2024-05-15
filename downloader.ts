import axios from "axios";
import fs from "fs";
import path from "path";

export default class Downloader {
    private _downloadPath: string;
    private isDownloading: boolean;
    constructor(downloadPath: string) {
        this._downloadPath = downloadPath;
        this.isDownloading = false;
    }
    public async download(url: string, fileName: string) {
            try {
                this.isDownloading = true;
                console.log("download started...");
                const start = Date.now();
                const response = await axios.get(url, { responseType: 'stream' }); // Specify stream response type

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
                console.error('Error downloading file:', error);
            }
            finally {
                this.isDownloading = false;
            }
    }
    public downloadPath(path: string) {
        let result = false;
        if (!this.isDownloading) {
            this._downloadPath = path;
            result = true;
        }
        return result;
    }
    // public downloadPath() {
    //     return this._downloadPath;
    // }
}