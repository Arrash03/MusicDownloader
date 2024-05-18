import axios from "axios";
import fs from "fs";
import path from "path";

const downloader = async (url: string, filePath: string, fileName: string) => {
    const start = Date.now();
    try {
        console.log(`download '${fileName}' started...`);
        const response = await axios.get(url, { responseType: 'stream' }); // Specify stream response type
        if (response.status !== 200) {
            throw new Error(`Failed to download file. Status: ${response.status}`);
        }
        const fileStream = fs.createWriteStream(path.join(filePath, fileName));
        response.data.pipe(fileStream);
        await new Promise((resolve, reject) => {
            fileStream.on('finish', resolve);
            fileStream.on('error', reject);
        });
        console.log(`${fileName} downloaded successfully at ${Date.now() - start} ms`);
    }
    catch (error) {
        console.error(`Error downloading '${url}' at ${Date.now() - start} ms`);
        if (error instanceof Error)
            console.error(error.message)
    }
}

export default downloader;