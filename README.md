# CanvasKit

CanvasKit は、OpenSiv3D の即時描画スタイルに影響を受けた、小さな TypeScript 製 Canvas 2D 描画ライブラリです。

Webサイト上で、図形、絵文字、軽いアニメーション演出をコンパクトなAPIで書くことを目的にしています。本格的なゲームエンジンではなく、Siv3D完全互換も目指していません。

## 対象

- Webサイトの装飾やビジュアルスケッチ
- 図解、軽いアニメーション、絵文字演出
- フレームワーク非依存の Canvas 2D 描画
- 即時描画に近い感覚で書きたいコード

## 対象外

- 本格的なゲームエンジン機能
- PixiJS 的なシーン管理
- Vue / React / Nuxt / Astro 用コンポーネントラッパー
- WebGL 描画
- 物理演算
- 画像編集ツール
- 通常のUI部品を Canvas UI で置き換えること

## 基本方針

- TypeScript を使う
- ESM として出力する
- Canvas 2D のみを使う
- runtime dependency を増やさない
- コアはフレームワーク非依存にする
- 即時描画スタイルを基本にする
- 抽象化より小さく動くAPIを優先する
- 暗黙のフォールバックを入れない

CanvasKit は、重要な処理に失敗した場合に明確に例外を投げます。たとえば `createCanvasApp()` は 2D context を取得できなければ throw します。未対応の描画機能を、別の描画方法へ勝手に置き換えることはしません。

`createCanvasApp()` の第1引数には `HTMLCanvasElement` または CSS selector 文字列を渡せます。selector 指定は canvas 取得を楽にするための便利APIであり、フォールバックではありません。selector が何にも一致しない場合、または canvas 以外の要素に一致した場合は throw します。

## ローカル利用

このプロジェクトは、現時点では npm からインストールする前提ではなく、ローカルで使う前提です。

```sh
npm install
npm run build
```

サンプルはローカルHTTPサーバー経由で開いてください。

```txt
examples/basic.html
examples/geometry.html
examples/shapes.html
examples/colors.html
examples/transform.html
examples/lifecycle.html
examples/offscreen.html
```

サンプルは `../dist/index.js` を import します。`src/` を変更した後は `npm run build` を実行してください。

## Examples

- `examples/basic.html`
  - `createCanvasApp`
  - basic shapes
  - emoji
  - mouse input
  - `EffectManager` click ripple

- `examples/shapes.html`
  - geometry values
  - circle / rect / line helpers
  - `draw.shape()`
  - `moved()`
  - `centerOf()`
  - ellipse / triangle / polygon / polyline / arc
  - dashed lines

- `examples/colors.html`
  - `rgb()` / `rgba()` / `hsl()` / `hsla()`
  - hue animation
  - Palette 色見本

- `examples/transform.html`
  - `draw.withTransform()`
  - rotate / scale animation
  - 入れ子 transform

- `examples/lifecycle.html`
  - `pauseWhenHidden: true`
  - frame count / deltaTime readout
  - `stop()` / `start()`

- `examples/offscreen.html`
  - `pauseWhenOffscreen: true`
  - scroll で pause / resume
  - fixed HUD

## 最小サンプル

```ts
import {
  createCanvasApp,
  Palette,
} from "./dist/index.js";

createCanvasApp("#canvas", ({ draw, size }) => {
  draw.clear("#0f1117");

  draw.circle(size.center, 40, {
    fill: Palette.Skyblue,
  });
}, {
  autoStart: true,
  maxDpr: 2,
});
```

## createCanvasApp options

- `autoStart` は自動で開始するかどうかです。既定値は `false` です。
- `maxDpr` は Canvas の最大 devicePixelRatio です。
- `clearEachFrame` は毎フレーム自動で clear するかどうかです。既定値は `false` です。
- `pauseWhenHidden` は Web ページが非表示の間だけ Canvas の rAF loop を止めるかどうかです。既定値は `false` です。`hidden` で停止し、`visible` で再開します。再開直後に `deltaTime` が跳ねないように `lastTime` をリセットします。`time` は wall-clock なので pause 中も進みます。`stop()` 後は `visible` になっても再開しません。`destroy()` は `visibilitychange` listener も外します。
- `pauseWhenOffscreen` は Canvas が viewport 外にある間だけ rAF loop を止めるかどうかです。既定値は `false` です。複数の Canvas 装飾を置くページで、画面外の Canvas が描き続けないようにするための設定です。内部では `IntersectionObserver` を使います。再開時は `lastTime` をリセットするため、`deltaTime` は大きく跳ねません。`stop()` で止めた場合は、viewport に戻っても再開しません。`destroy()` は `IntersectionObserver.disconnect()` も呼びます。`IntersectionObserver` がない環境への fallback はありません。`pauseWhenHidden` と両方 `true` の場合、hidden または offscreen のどちらかなら停止し、visible かつ onscreen のときだけ再開します。

```ts
createCanvasApp("#canvas", frame, {
  autoStart: true,
  pauseWhenHidden: true,
  pauseWhenOffscreen: true,
});
```

## 図形描画

`draw` には基本図形を描くメソッドがあります。style は `ShapeStyle` オブジェクトで指定します。単色塗りだけは `Palette.White` のような文字列短縮形も使えます。

```ts
draw.ellipse({ x: 160, y: 120 }, 80, 40, {
  fill: "#7aa2ff",
});

draw.triangle(
  { x: 320, y: 80 },
  { x: 260, y: 180 },
  { x: 380, y: 180 },
  {
    fill: "#ffb86c",
  },
);

draw.polygon([
  { x: 480, y: 80 },
  { x: 540, y: 120 },
  { x: 520, y: 190 },
  { x: 440, y: 190 },
  { x: 420, y: 120 },
], {
  fill: "#50fa7b",
  stroke: "#ffffff66",
  width: 2,
});

draw.polyline([
  { x: 80, y: 280 },
  { x: 160, y: 240 },
  { x: 240, y: 300 },
  { x: 320, y: 260 },
], {
  stroke: "#ffffff99",
  width: 3,
  dash: [8, 6],
});

draw.arc({ x: 480, y: 280 }, 60, 0, Math.PI * 1.5, {
  stroke: "#ff79c6",
  width: 4,
});
```

`ShapeStyle` には `dash?: number[]` があります。`line()` / `polyline()` / `arc()` などで `ctx.setLineDash()` を使い、点線を描けます。dash はその描画呼び出し内だけに閉じます。

`arc()` の角度はラジアンで指定します。現時点の `arc()` は線として描くだけで、扇形塗りは実装していません。`polygon()` は3点未満、`polyline()` は2点未満なら throw します。矢印、扇形塗り、ベジェ、スプラインは未対応です。

## Effect

`createEffectManager()` は、クリック時の波紋、粒子、絵文字の発生、ホバー時の一時演出など、短命な描画エフェクトを管理します。

effect 関数は経過時間 `t` と現在の frame context を受け取ります。`true` を返すと継続し、`false` を返すと削除されます。effect 内で発生した例外は catch せず、そのまま外へ伝わります。非同期 effect、Promise、自動フォールバックは扱いません。

```ts
import {
  createCanvasApp,
  createEffectManager,
  Palette,
  type CanvasFrameContext,
} from "./dist/index.js";

const effects = createEffectManager<CanvasFrameContext>();

createCanvasApp("#canvas", (context) => {
  const { draw, input, deltaTime } = context;

  draw.clear("#0f1117");

  if (input.mouse.left.down) {
    const pos = { ...input.mouse.position };

    effects.add((t, { draw }) => {
      draw.circle(pos, t * 120, {
        stroke: Palette.White,
        width: 2,
        alpha: 1 - t,
      });

      return t < 1.0;
    });
  }

  effects.update(deltaTime, context);
}, {
  autoStart: true,
});
```

## Geometry Values

`geometry.ts` は、軽量な図形データ型と helper 関数を提供します。図形はクラスではなく plain object なので、値として保持し、描画や当たり判定へ渡しやすい形です。

- `vec2(x, y)` は点またはベクトルを作ります。
- `rect(x, y, w, h)` は `kind: "rect"` 付きの矩形を作ります。
- `circle(center, r)` は `kind: "circle"` 付きの円を作ります。
- `line(from, to)` は `kind: "line"` 付きの線分データを作ります。
- `contains(shape, point)` は点が矩形または円の内側にあるか判定します。境界上も含みます。
- `intersects(a, b)` は rect/rect、circle/circle、rect/circle の交差を判定します。接しているだけの場合も交差として扱います。
- `moved(shape, offset)` は元の図形を変更せず、移動後の新しい図形を返します。

`circle()` / `rect()` / `line()` は描画ではなく、`kind` 付きの geometry value を作る関数です。一方、`draw.circle()` / `draw.rect()` / `draw.line()` は実際に Canvas へ描画する関数です。

`draw.shape(shape, style)` を使うと、`Circle` / `Rect` / `Line` を分解せずにそのまま描画できます。現時点で `draw.shape()` が対応するのは `Circle` / `Rect` / `Line` のみです。`draw.roundRect()` のように追加引数が必要な描画は、専用メソッドを使います。

CanvasKit は `shape.draw()` 形式や図形クラス化ではなく、plain object + draw call 形式を採用しています。`draw.shape()` はその方針のまま、geometry value を描くときの冗長さを減らすためのAPIです。同じ図形を何度も使う、`moved()` で別図形を作る、`contains()` / `intersects()` の判定にも使う、といった場合は geometry helper で図形を変数として保持すると読みやすくなります。

回転Rect、Polygon、Line交差判定はまだ対応していません。未対応のgeometry処理を近似的な別処理へ置き換えるフォールバックも入れていません。

```ts
const c = circle(vec2(120, 80), 32);
const shifted = moved(c, vec2(80, 0));

draw.circle(c.center, c.r, {
  fill: Palette.Skyblue,
});

draw.circle(shifted.center, shifted.r, {
  stroke: Palette.White,
  width: 2,
});
```

```ts
const c = circle(vec2(120, 80), 32);
const shifted = moved(c, vec2(80, 0));

draw.shape(c, {
  fill: Palette.Skyblue,
});

draw.shape(shifted, {
  stroke: Palette.White,
  width: 2,
});
```

```ts
const button = rect(40, 40, 220, 72);
const hovered = contains(button, input.mouse.position);

draw.roundRect(button, 16, {
  fill: hovered ? "#263246" : "#171d2a",
});

draw.text("Button", centerOf(button), {
  size: 20,
  fill: Palette.White,
  align: "center",
  baseline: "middle",
});
```

## Style Objects

図形のstyleは、基本的にオブジェクトで指定します。オプションが増えても意味が読みやすいためです。

```ts
draw.circle(pos, 32, {
  fill: Palette.White,
});

draw.circle(pos, 32, {
  stroke: Palette.Red,
  width: 2,
});
```

単色塗りだけは短縮形を使えます。

```ts
draw.circle(pos, 32, Palette.White);
```

`fill, stroke, width` を位置引数で並べるような、意味が分かりづらい可変長引数APIは用意しません。

## 色

`rgb()` / `rgba()` / `hsl()` / `hsla()` は CSS color string を返します。`fill` / `stroke` / `draw.clear()` など、色文字列を受け取る場所でそのまま使えます。出力は `rgb(255 128 0)` や `hsl(210 80% 60%)` のような modern space-separated syntax です。

範囲は `r/g/b: 0..255`、`s/l: 0..100`、`a: 0..1` です。`h` は有限の角度なら任意の値を渡せます。範囲外や `NaN` / `Infinity` は `RangeError` です。勝手に clamp しません。Color class はまだありません。

```ts
draw.circle(pos, 32, {
  fill: hsl(210, 80, 60),
  stroke: rgba(255, 255, 255, 0.4),
  width: 2,
});
```

## Transform

`draw.withTransform(transform, callback)` は、callback の間だけ描画座標を変換します。transform は `{ translate?, rotate?, scale? }` で、適用順は translate → rotate → scale です。rotate はラジアン指定です。角度で書きたい場合は `deg()` を使えます。scale は `number` なら均等拡大、`Vec2` なら x / y 別々の拡大です。

内部では `ctx.save()` / `ctx.restore()` を使います。callback が例外を投げても restore は実行されます。変換されるのは描画だけです。mouse input / `contains()` / `intersects()` の座標は変換しません。`NaN` / `Infinity` のような非有限値は `RangeError` です。origin、Camera2D、matrix API、mouse 座標変換はまだありません。

```ts
draw.withTransform({
  translate: vec2(400, 300),
  rotate: deg(30),
  scale: 1.2,
}, () => {
  draw.shape(circle(vec2(0, 0), 48), {
    fill: Palette.Skyblue,
  });

  draw.emoji("🛰️", vec2(90, 0), {
    size: 48,
  });
});
```

## 絵文字描画

`draw.emoji()` は、現時点では Canvas の text 描画、つまり `fillText()` で実装しています。

絵文字の見た目は、ブラウザ、OS、インストールされている絵文字フォントに依存します。CanvasKit は絵文字画像アセットを読み込まず、独自に絵文字をラスタライズせず、絵文字フォントがない場合に代替図形を描くこともしません。

## フォールバック方針

この段階では、フォールバックを意図的に入れていません。

- `CanvasRenderingContext2D` を取得できない場合のフォールバックはしない
- selector が一致しない場合に canvas を自動生成しない
- selector が canvas 以外に一致した場合に別要素へフォールバックしない
- 未対応の描画機能を別の描画方法で代替しない
- `OffscreenCanvas` から通常 Canvas への自動フォールバックはしない
- 絵文字画像アセット方式へのフォールバックはしない
- 画像読み込み失敗時の透明プレースホルダーは作らない
- 複雑なブラウザ互換レイヤーは入れない

代替手段が必要になった場合は、API設計を決めたうえで明示的に追加します。暫定的なフォールバックは TODO に留めます。

## 現在のAPI

- `createCanvasApp(canvasOrSelector, frame, options?)`
- `createEffectManager()`
- `Palette`
- `rgb()`
- `rgba()`
- `hsl()`
- `hsla()`
- `vec2()`
- `rect()`
- `circle()`
- `line()`
- `add()`
- `sub()`
- `mul()`
- `distance()`
- `length()`
- `centerOf()`
- `moved()`
- `contains()`
- `intersects()`
- `deg()`
- `rad()`
- `clamp()`
- `lerp()`
- `inverseLerp()`
- `mapRange()`
- `smoothstep()`
- `pingPong()`
- `easeOutCubic()`
- `easeInOutCubic()`

style object では次の `ShapeStyle` properties を使えます。

- `ShapeStyle.fill`
- `ShapeStyle.stroke`
- `ShapeStyle.width`
- `ShapeStyle.alpha`
- `ShapeStyle.lineCap`
- `ShapeStyle.lineJoin`
- `ShapeStyle.dash`

描画メソッドは、frame callback に渡される `draw` オブジェクトから使います。

- `draw.clear(color?)`
- `draw.withTransform(transform, callback)`
- `draw.shape(shape, style?)`
- `draw.circle(pos, radius, style?)`
- `draw.ellipse(pos, radiusX, radiusY, style?)`
- `draw.rect(rect, style?)`
- `draw.roundRect(rect, radius, style?)`
- `draw.triangle(p1, p2, p3, style?)`
- `draw.polygon(points, style?)`
- `draw.line(from, to, style?)`
- `draw.polyline(points, style?)`
- `draw.arc(pos, radius, startAngle, endAngle, style?)`
- `draw.text(text, pos, style?)`
- `draw.emoji(emoji, pos, style?)`

## ロードマップ

### v0.1 completed

- createCanvasApp
- draw.clear / circle / rect / roundRect / line / text / emoji
- Palette
- math helpers
- mouse input
- EffectManager

### v0.2 completed or in progress

- Vec2 / Rect / Circle / Line helper
- kind付きShape設計
- draw.shape()
- contains
- intersects
- ellipse
- triangle
- polygon
- polyline
- arc
- dashed line via ShapeStyle.dash

### v0.3 completed or in progress

- Palette拡張
- rgb() / rgba() / hsl() / hsla()
- withTransform
- pauseWhenHidden
- pauseWhenOffscreen

### v0.3 candidate

- draw.image
- respectReducedMotion

### v0.4 candidate

- Color class
- RenderState
- withState
- RenderTarget
- Camera2D
