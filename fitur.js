const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const instagramDl = require("@sasmeee/igdl");

const mediaStoragePath = path.join(__dirname, ''); // Ganti dengan path yang sesuai

const ensureDirectoryExists = (filePath) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};

const downloadMedia = async (url) => {
    if (!url || !url.includes("http")) {
      throw new Error("Please specify a media URL...");
    }
    url = extractUrlFromString(url);
    console.log('URL yang digunakan untuk unduhan:', url); // Log URL untuk debugging
    await deleteTempMediaFiles();
  
    if (url.includes("instagram.com/")) {
      return downloadInstagramMedia(url);
    } else {
      throw new Error("Please specify a media URL from Instagram...");
    }
  };
  

const downloadInstagramMedia = async (url) => {
  try {
    const dataList = await instagramDl(url);
    if (!dataList || !dataList[0]) {
      throw new Error("Error: Invalid media URL...");
    }
    const mediaURL = dataList[0].download_link;
    return await downloadDirectMedia(mediaURL, getFileName(mediaURL, "jpg"));
  } catch (error) {
    throw new Error("Error downloading Instagram media: " + error.message);
  }
};

const downloadDirectMedia = async (url, fileName) => {
  try {
    const response = await axios({
      url: url,
      method: "GET",
      responseType: "stream",
    });
    return await saveStreamToFile(response.data, fileName);
  } catch (error) {
    console.error(`Error downloading media from URL ${url}: ${error.message}`);
    throw new Error("Error downloading media: " + error.message);
  }
};

const saveStreamToFile = (stream, fileName) => {
  ensureDirectoryExists(fileName);
  const mediaWriter = fs.createWriteStream(fileName);
  stream.pipe(mediaWriter);

  return new Promise((resolve, reject) => {
    mediaWriter.on("finish", () => {
      console.log(`File saved: ${fileName}`);
      resolve(fileName);
    });
    mediaWriter.on("error", (error) => {
      console.error(`Error saving file ${fileName}: ${error.message}`);
      reject(error);
    });
  });
};

const getFileName = (url, extension) => {
  const hash = crypto.createHash("md5").update(url).digest("hex");
  const datetime = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(mediaStoragePath, `${hash}_${datetime}.${extension}`);
};

const extractUrlFromString = (string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matchedUrls = string.match(urlRegex);
  return matchedUrls ? matchedUrls[0] : null;
};

const deleteTempMediaFiles = async () => {
  const now = Date.now();
  const ageLimit = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

  fs.readdir(mediaStoragePath, (err, files) => {
    if (err) {
      console.error(`Error reading media storage path: ${err.message}`);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(mediaStoragePath, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting stats for file ${filePath}: ${err.message}`);
          return;
        }

        const fileAge = now - stats.mtimeMs;
        if (fileAge > ageLimit) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file ${filePath}: ${err.message}`);
            } else {
              console.log(`Deleted old media file: ${filePath}`);
            }
          });
        }
      });
    });
  });
};

module.exports = { downloadMedia };
