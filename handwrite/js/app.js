(() => {
  const MODEL_CANDIDATES = [
    "./model/model.json",
    "https://cdn.jsdelivr.net/npm/mnist-react-tfjs@0.1.2/public/assets/model.json",
  ];

  const canvas = document.getElementById("draw-canvas");
  const preview = document.getElementById("preview-canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const previewCtx = preview.getContext("2d");
  const statusEl = document.getElementById("model-status");
  const digitEl = document.getElementById("predicted-digit");
  const confEl = document.getElementById("predicted-confidence");
  const barsEl = document.getElementById("prob-bars");
  const brushEl = document.getElementById("brush-size");
  const predictBtn = document.getElementById("predict-btn");
  const clearBtn = document.getElementById("clear-btn");
  const undoBtn = document.getElementById("undo-btn");

  const history = [];
  let model = null;
  let drawing = false;
  let lastPoint = null;
  let predictTimer = null;

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "model-status" + (kind ? ` ${kind}` : "");
  }

  function clearCanvas() {
    ctx.fillStyle = "#fbf7ee";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function snapshot() {
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.length > 40) history.shift();
  }

  function renderBars(probs) {
    const maxIdx = probs.indexOf(Math.max(...probs));
    barsEl.innerHTML = probs
      .map((p, i) => {
        const pct = Math.round(p * 1000) / 10;
        return `<li class="${i === maxIdx ? "top" : ""}">
          <span>${i}</span>
          <div class="bar" aria-hidden="true"><i style="width:${Math.max(p * 100, 1.5)}%"></i></div>
          <span class="pct">${pct.toFixed(1)}%</span>
        </li>`;
      })
      .join("");
  }

  function getInkBounds(imageData) {
    const { data, width, height } = imageData;
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4;
        const ink = 255 - (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        if (ink > 28) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return null;
    const pad = 18;
    return {
      x: Math.max(0, minX - pad),
      y: Math.max(0, minY - pad),
      w: Math.min(width - 1, maxX + pad) - Math.max(0, minX - pad),
      h: Math.min(height - 1, maxY + pad) - Math.max(0, minY - pad),
    };
  }

  function toMnistTensor() {
    const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bounds = getInkBounds(src);
    const off = document.createElement("canvas");
    off.width = 28;
    off.height = 28;
    const octx = off.getContext("2d");
    octx.fillStyle = "#000";
    octx.fillRect(0, 0, 28, 28);

    if (bounds) {
      const scale = Math.min(20 / bounds.w, 20 / bounds.h);
      const dw = Math.max(1, bounds.w * scale);
      const dh = Math.max(1, bounds.h * scale);
      const dx = (28 - dw) / 2;
      const dy = (28 - dh) / 2;
      const tmp = document.createElement("canvas");
      tmp.width = bounds.w;
      tmp.height = bounds.h;
      const tctx = tmp.getContext("2d");
      tctx.putImageData(ctx.getImageData(bounds.x, bounds.y, bounds.w, bounds.h), 0, 0);
      octx.filter = "invert(1)";
      octx.drawImage(tmp, 0, 0, bounds.w, bounds.h, dx, dy, dw, dh);
      octx.filter = "none";
    }

    previewCtx.imageSmoothingEnabled = false;
    previewCtx.drawImage(off, 0, 0);
    const pixels = octx.getImageData(0, 0, 28, 28).data;
    const input = new Float32Array(28 * 28);
    for (let i = 0; i < 28 * 28; i += 1) {
      input[i] = pixels[i * 4] / 255;
    }
    return tf.tensor4d(input, [1, 28, 28, 1]);
  }

  async function predict() {
    if (!model) return;
    const tensor = toMnistTensor();
    const output = model.predict(tensor);
    const probs = Array.from(await output.data());
    tensor.dispose();
    output.dispose();

    const best = probs.indexOf(Math.max(...probs));
    const confidence = probs[best];
    if (confidence < 0.12 || !getInkBounds(ctx.getImageData(0, 0, canvas.width, canvas.height))) {
      digitEl.textContent = "—";
      confEl.textContent = "숫자를 조금 더 크고 진하게 써 주세요";
      renderBars(probs.map(() => 0));
      return;
    }
    digitEl.textContent = String(best);
    confEl.textContent = `${(confidence * 100).toFixed(1)}% 확신으로 ${best}(으)로 보입니다`;
    renderBars(probs);
  }

  function schedulePredict() {
    clearTimeout(predictTimer);
    predictTimer = setTimeout(() => {
      predict().catch((err) => {
        console.error(err);
        setStatus("인식 중 오류가 났습니다", "error");
      });
    }, 180);
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = event.touches ? event.touches[0] : event;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  }

  function drawTo(point) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1b1814";
    ctx.lineWidth = Number(brushEl.value);
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPoint = point;
  }

  function startDraw(event) {
    event.preventDefault();
    snapshot();
    drawing = true;
    lastPoint = canvasPoint(event);
  }

  function moveDraw(event) {
    if (!drawing) return;
    event.preventDefault();
    drawTo(canvasPoint(event));
  }

  function endDraw() {
    if (!drawing) return;
    drawing = false;
    lastPoint = null;
    schedulePredict();
  }

  async function loadModel() {
    let lastError = null;
    for (const url of MODEL_CANDIDATES) {
      try {
        setStatus("모델 불러오는 중…");
        model = await tf.loadLayersModel(url);
        setStatus("모델 준비 완료", "ready");
        predictBtn.disabled = false;
        return;
      } catch (err) {
        lastError = err;
      }
    }
    console.error(lastError);
    setStatus("모델을 불러오지 못했습니다", "error");
  }

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", moveDraw);
  window.addEventListener("mouseup", endDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", moveDraw, { passive: false });
  window.addEventListener("touchend", endDraw);

  clearBtn.addEventListener("click", () => {
    snapshot();
    clearCanvas();
    digitEl.textContent = "—";
    confEl.textContent = "아직 쓴 숫자가 없습니다";
    previewCtx.fillStyle = "#000";
    previewCtx.fillRect(0, 0, 28, 28);
    renderBars(Array(10).fill(0));
  });

  undoBtn.addEventListener("click", () => {
    const prev = history.pop();
    if (!prev) return;
    ctx.putImageData(prev, 0, 0);
    schedulePredict();
  });

  predictBtn.addEventListener("click", () => predict());
  predictBtn.disabled = true;

  renderBars(Array(10).fill(0));
  clearCanvas();
  loadModel();
})();
