const { exec } = require('child_process');

const inputFilePath = '../ToBeCompressed/bigvideo_high_bitrate.avi';
const outputFilePath = '../CompressedStuff/bigvideo_high_bitrate.avi.bz2';

function compressWithBzip2(inputFilePath, outputFilePath) {
    return new Promise((resolve, reject) => {
        exec(`bzip2 -c ${inputFilePath} > ${outputFilePath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                reject(error);
            }
            resolve(outputFilePath);
        });
    });
}

compressWithBzip2(inputFilePath, outputFilePath);