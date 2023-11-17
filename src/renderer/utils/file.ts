import path from 'path';
import { createHash } from 'crypto';
import fs, { promises as fsPromises } from 'fs';

/**
 * 根据 buffer 数据生成 hash 值
 * 
 * @param buffer 原始数据
 * @param algorithm hash 算法，默认：md5
 */
export function getHash(buffer: Uint8Array, algorithm = 'md5') {
    return createHash(algorithm).update(buffer).digest('hex');
}

/**
 * 检查文件头信息
 * 
 * @param headers 文件头信息
 */
export function check(headers: number[]) {
    return (buffer: Uint8Array, options = { offset: 0 }) => {
        return headers.every((header, index) => header === buffer[options.offset + index]);
    }
}

/**
 * 检查是不是 jpg 文件
 */
export const isJPEG = check([0xff, 0xd8, 0xff]);

/**
 * 检查是不是 png 文件
 */
export const isPNG = check([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);


/**
 * 向文件追加内容
 *
 * @param { string } filePath - 文件路径
 * @param { string } content - 追加内容
 * @returns { Promise<boolean> }
 */
export const appendContent = (filePath: string, content: string) => {
    return new Promise((resolve, reject) => {
        try {
            const wrapContent = `${content}\r\n`;

            fs.appendFileSync(filePath, wrapContent);
            resolve(true);
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * 是否存在目录或者文件
 *
 * @param { string } filePath - 文件路径或者目录路径
 * @returns { Promise<boolean> } - 是否存在文件或目錄
 */
export const isExist = (filePath: string) => {
    return new Promise((resolve) => {
        const isExist = fs.existsSync(filePath);

        resolve(isExist);
    });
};

/**
 * 创建目录，支持多级目录
 *
 * @param { string } fileDirectory - 目录路径
 * @returns { Promise<boolean> } - 是否创建成功
 */
export const createDir = (fileDirectory: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const fileDir = path.join(fileDirectory);
            const isExistDir = await isExist(fileDir);

            if (isExistDir) {
                return resolve(true);
            }

            fs.mkdirSync(fileDir, { recursive: true });

            return resolve(true);
        } catch (err) {
            console.log("mkdir err: ", err);
            reject(err);
        }
    });
};

/**
 * 监听文件变化
 *
 * @param { string } filePath - 文件名路径
 * @param { number } interval - 延迟器
 * @param { (size: number) => void } callback - 回调函数
 */
export const watchFile = (filePath: string, interval: number, callback: (size: number) => void) => {
    fs.watchFile(filePath, { interval }, (current) => {
        callback(current.size);
    });
};

/**
 * 取消监听文件变化事件
 *
 * @param { string } filePath - 文件名路径
 */
export const unWatchFile = (filePath: string) => {
    fs.unwatchFile(filePath);
};

/**
 * 重命名文件名称
 *
 * @param { string } filePath - 文件名路径
 * @param { string } newFilePath - 新文件名路径
 * @returns { Promise<boolean> } - 是否成功
 */
export const renameFile = (filePath: string, newFilePath: string) => {
    return new Promise(async (resolve) => {
        const isExistFile = await isExist(filePath);

        if (isExistFile) {
            try {
                fs.renameSync(filePath, newFilePath);
            } catch (err) {
                console.log("rename file err: ", err);
            }
        } else {
            console.log("rename file not exist");
        }

        resolve(true);
    });
};

/**
 * 复制文件到新路径下
 *
 * @param { string } filePath - 文件名路径
 * @param { string } newFilePath - 新文件名路径
 * @returns { Promise<boolean> }
 */
export const copyFile = (filePath: string, newFilePath: string) => {
    return new Promise(async (resolve) => {
        const isExistFile = await isExist(filePath);

        if (isExistFile) {
            try {
                fs.copyFileSync(filePath, newFilePath);
                console.log("copy file success");
            } catch (err) {
                console.log("copy file err: ", err);
            }
        } else {
            console.log("copy file not exist");
        }

        resolve(true);
    });
};

/**
 * 清空文件内容
 *
 * @param { string } filePath - 文件名路径
 * @returns { Promise<boolean> }
 */
export const clearFile = (filePath: string) => {
    return new Promise((resolve) => {
        fs.writeFileSync(filePath, "");

        resolve(true);
    });
};

/**
 * 读取目录列表，获取过滤后的目录下所有文件名
 *
 * @param { string } fileDir - 目录路径
 * @param { string } filterFile - 过滤获取此名称下的文件
 * @returns { Promise<string[]> } - 文件名列表
 */
export const readDir = (fileDir: string, filterFile: string) => {
    return new Promise((resolve) => {
        try {
            const fileNameList: string[] = fs
                .readdirSync(fileDir)
                .filter((name) => name.includes(filterFile));

            resolve(fileNameList);
        } catch (err) {
            console.log("read dir error: ", err);
        }
    });
};

/**
 * 删除文件或者文件夹
 * @param {string} pathLink - 要删除的文件或目录
 * @param {number} retry - 重试次数，默认：1 次
 * @returns { Promise<void> }
 */
export const rm = (pathLink: string, retry = 1) => {
    return fsPromises.rm(pathLink, { maxRetries: retry });
}

/**
 * 读取文件
 * 
 * @param filePath 文件路径
 * @returns {Promise<Buffer>}
 */
export const readFile = (filePath: string) => {
    return fsPromises.readFile(filePath);
}
  
/**
 * 写入文件
 * 
 * @param {string} filePath - 文件路径
 * @param {string | NodeJS.ArrayBufferView} content - 要写入的内容
 * @returns {Promise<void>}
 */
export const writeFile = (filePath: string, content: string | NodeJS.ArrayBufferView) => {
    return fsPromises.writeFile(filePath, content);
}

/**
 * 读取文件夹中的所有文件，并返回每个文件的绝对路径
 * 
 * @param dirPath 要读取的文件夹
 * @returns {Promise<{dirent: Dirent; filePath: string}>}
 */
export const getChildrenFiles = (dirPath: string) => {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    const direntList = files.filter(item => item.isFile());

    const fileList = direntList.map((dirent) => {
        return { dirent, filePath: path.resolve(dirPath, dirent.name) };
    });

    return fileList;
}
