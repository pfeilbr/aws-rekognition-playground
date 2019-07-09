const AWS = require("aws-sdk");
const rekognition = new AWS.Rekognition();
const util = require("util");
const fs = require("fs");
const path = require("path");
const gm = require("gm");

const log = o => console.log(JSON.stringify(o, null, 2));
const assetsDirectoryPath = path.join(__dirname, "..", "assets");
const imagesDirectoryPath = path.join(assetsDirectoryPath, "images");
const videosDirectoryPath = path.join(assetsDirectoryPath, "videos");
const imagePath = imageName => path.join(imagesDirectoryPath, imageName);
const videoPath = videoName => path.join(imagesDirectoryPath, videoName);

const detectLabelsExample = async () => {
  const pathToImage = imagePath("city-street.jpg");
  const resp = await rekognition
    .detectLabels({
      Image: {
        Bytes: fs.readFileSync(pathToImage)
      },
      MaxLabels: 123,
      MinConfidence: 70
    })
    .promise();

  const gmImage = gm(pathToImage);

  const imageSize = await util.promisify(gmImage.size).bind(gmImage)();
  //log(`image size: ${JSON.stringify(imageSize)}`);

  for (const label of resp.Labels) {
    for (const instance of label.Instances) {
      const box = instance.BoundingBox;
      //log(`instance.BoundingBox: ${JSON.stringify(box)}`);
      const rect = {
        x0: box.Left * imageSize.width,
        y0: box.Top * imageSize.height,
        x1: box.Left * imageSize.width + box.Width * imageSize.width,
        y1: box.Top * imageSize.height + box.Height * imageSize.height
      };
      //log(`rect: ${JSON.stringify(rect)}`);
      gmImage
        .stroke("red", 1)
        .fill("none")
        .drawRectangle(rect.x0, rect.y0, rect.x1, rect.y1)
        .fontSize(18)
        .stroke("white")
        .strokeWidth(1)
        .drawText(rect.x0, rect.y0, label.Name);
    }
  }

  const labelledImagePath = `${pathToImage}-labelled.jpg`;
  await util.promisify(gmImage.write).bind(gmImage)(labelledImagePath);
  log(`view labelled image at ${labelledImagePath}`);
};

(async () => {
  await detectLabelsExample();
})();
