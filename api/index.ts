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
    // console.log("adding", url);
    yield getImage(url);
  }
}

function rint(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

const getSeed = () => rint(0, 50000).toString().padStart(4, "0");

const app = new Koa();

app.use(async ({ path, res, query }) => {
  if (path !== "/") {
    res.statusCode = 404;
    return;
  }

  const { seed, delay } = query;

  const padded = seed ? seed.toString().padStart(4, "0") : getSeed();

  const encoder = new GIFEncoder(512, 512, "neuquant");

  encoder.createReadStream().pipe(res);
  encoder.start();
  encoder.setDelay(parseInt(delay) || 50);

  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext("2d");

  for await (const i of getImages(padded)) {
    ctx.drawImage(i, 0, 0);
    encoder.addFrame(ctx);
  }

  encoder.finish();
});

app.listen(3000);
