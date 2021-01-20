import { createWriteStream } from "fs";
import path from "path";

// import axios from "axios";
import { createCanvas, Image } from "canvas";
import GIFEncoder from "gif-encoder-2";

const geturl = (psi: string, seed: string) =>
  `https://thisanimedoesnotexist.ai/results/psi-${psi}/seed${seed}.png`;

const getImage = (url: string) =>
  new Promise<Image>((res, rej) => {
    const i = new Image();
    i.onerror = (e) => rej(e);
    i.onload = () => res(i);
    i.src = url;
  });

async function* getImages(seed: string) {
  const min = 0.3;
  const max = 2.0;

  let lasturl = "";
  for (let psi = min; psi <= max + 0.001; psi += 0.1) {
    const url = geturl(psi.toFixed(1), seed);
    if (lasturl === url) continue;
    lasturl = url;
    console.log("adding", url);
    yield getImage(url);
  }
}

// function lerpr(from: number, to: number, t: number): string {
//   return (from * (1 - t) + to * t).toFixed(1);
// }

function rint(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

const getSeed = () => rint(0, 50000).toString().padStart(4, "0");

async function createGif({ seed = getSeed(), delay = 50 } = {}) {
  const dest = path.join(__dirname, `../out/${seed}.gif`);
  const writeStream = createWriteStream(dest);
  writeStream.on("error", (e) => {
    throw e;
  });

  const encoder = new GIFEncoder(512, 512, "neuquant");
  encoder.createReadStream().pipe(writeStream);
  encoder.start();
  encoder.setDelay(delay);

  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext("2d");

  for await (const i of getImages(seed)) {
    ctx.drawImage(i, 0, 0);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  // writeStream.close();
}

void createGif().then(() => {
  console.log("done");
});
