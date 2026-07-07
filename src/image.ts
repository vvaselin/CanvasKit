export function loadImage(src: string): Promise<HTMLImageElement> {
  if (src === "") {
    throw new Error("loadImage: src must not be empty.");
  }

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error(`loadImage: failed to load "${src}".`));
    };

    image.src = src;
  });
}
