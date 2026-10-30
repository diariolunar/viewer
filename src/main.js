import "./style.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/playfair-display/latin-400.css";
import "@fontsource/playfair-display/latin-400-italic.css";
import * as pdfjs from "pdfjs-dist";
import worker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PageFlip } from "page-flip";
pdfjs.GlobalWorkerOptions.workerSrc = worker;
const app = document.querySelector("#app");
app.innerHTML = `<header><a class="brand" href="/">◒ <span>lunar<span class="brand-dot">.</span></span></a><span class="header-label">O SEU LIVRO COMEÇA AQUI</span><span class="privacy">◈ Privado por natureza</span></header><main><section class="intro"><span class="eyebrow">DO ARQUIVO À EXPERIÊNCIA</span><h1>Uma nova forma de<br><em>ver o seu livro.</em></h1><p>Envie seu PDF e sinta a experiência de folhear cada página.<br>Seu próximo livro merece ser visto de perto.</p></section><section id="upload-section"><label id="dropzone" tabindex="0" role="button" aria-label="Selecionar PDF"><span class="upload-icon">↥</span><h2>Abra as páginas da sua história</h2><p>Arraste seu PDF até aqui ou <strong>escolha um arquivo</strong></p><span class="file-hint">PDF · Até 50 MB · Até 500 páginas</span><input type="file" id="file" accept="application/pdf,.pdf" hidden></label><p class="local-note">♧ Seu arquivo fica no seu dispositivo. Nada é enviado ao servidor.</p></section><section id="reader" hidden><div class="reader-top"><div><span class="eyebrow">NA SUA ESTANTE</span><h2 id="filename"></h2></div><button id="replace">↥ Trocar PDF</button></div><div class="toolbar"><div class="view-options"><button id="book-mode" aria-pressed="true">▥ Livro</button><button id="single-mode" aria-pressed="false">▯ Página</button></div><div class="zoom"><button id="zoom-out" aria-label="Diminuir zoom">−</button><span id="zoom-value">100%</span><button id="zoom-in" aria-label="Aumentar zoom">+</button></div><button id="fullscreen">⛶ <span>Tela cheia</span></button></div><div id="stage"><div id="book"></div></div><nav class="navigation" aria-label="Navegação das páginas"><button id="prev" aria-label="Página anterior">←</button><form id="page-form"><label for="page-number">Página</label> <input id="page-number" type="number" min="1" value="1" aria-label="Ir para página"> <span id="page-total"></span></form><button id="next" aria-label="Próxima página">→</button></nav><p class="reader-hint">Clique ou arraste o canto das páginas para folhear · Use as setas do teclado</p></section><div id="status" role="status" aria-live="polite"></div><div class="features"><div><span>01</span><h3>Como um livro de verdade</h3><p>Páginas, movimento e um novo olhar.</p></div><div><span>02</span><h3>Seu arquivo, só seu</h3><p>Sem upload, cadastro ou armazenamento.</p></div><div><span>03</span><h3>Do seu jeito</h3><p>Folheie, aproxime e explore cada detalhe.</p></div></div></main><footer><span>lunar. <small>Feito para dar vida às suas páginas.</small></span><span>UM NOVO OLHAR PARA CADA HISTÓRIA</span></footer>`;
const $ = (s) => document.querySelector(s);
let pdf,
  flip,
  page = 0,
  single = false,
  zoom = 1,
  generation = 0,
  busy = false;
const status = (message, error = false) => {
  $("#status").textContent = message;
  $("#status").classList.toggle("error", error);
};
function updateNavigation() {
  if (!flip || !pdf) return;
  page = flip.getCurrentPageIndex();
  $("#page-number").value = page + 1;
  $("#prev").disabled = page === 0;
  $("#next").disabled =
    page >=
    pdf.numPages - (single || flip.getOrientation() === "portrait" ? 1 : 2);
}
async function renderBook() {
  const id = ++generation;
  if (flip) {
    flip.destroy();
    flip = null;
  }
  $("#stage").innerHTML = '<div id="book"></div>';
  $("#stage").style.width = "";
  const portrait = single || $("#stage").clientWidth < 640;
  const first = await pdf.getPage(1);
  const viewport = first.getViewport({ scale: 1 });
  const width = Math.min(
    portrait ? 580 : 430,
    Math.max(140, ($("#stage").clientWidth - 32) / (portrait ? 1 : 2)),
  );
  const height = Math.min(620, (width * viewport.height) / viewport.width);
  const actualWidth = (height * viewport.width) / viewport.height;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const el = document.createElement("div");
    el.className = "pdf-page";
    el.innerHTML = `<div class="page-placeholder">${i}</div>`;
    $("#book").append(el);
    pages.push(el);
  }
  if (portrait) $("#stage").style.width = `${actualWidth + 24}px`;
  flip = new PageFlip($("#book"), {
    width: actualWidth,
    height,
    size: "fixed",
    usePortrait: true,
    showCover: false,
    flippingTime: 650,
    maxShadowOpacity: 0.25,
    mobileScrollSupport: false,
    startPage: Math.min(page, pdf.numPages - 1),
  });
  flip.loadFromHTML(pages);
  flip.on("flip", updateNavigation);
  flip.on("changeOrientation", updateNavigation);
  $("#page-total").textContent = `de ${pdf.numPages}`;
  $("#page-number").max = pdf.numPages;
  updateNavigation();
  // Render visible pages first; keep a bounded raster size even for print-resolution PDFs.
  const order = [...pages.keys()].sort(
    (a, b) => Math.abs(a - page) - Math.abs(b - page),
  );
  for (const index of order) {
    if (id !== generation) return;
    const p = await pdf.getPage(index + 1);
    const base = p.getViewport({ scale: 1 });
    const v = p.getViewport({
      scale: Math.min(2, 1100 / Math.max(base.width, base.height)),
    });
    const canvas = document.createElement("canvas");
    canvas.width = v.width;
    canvas.height = v.height;
    await p.render({ canvasContext: canvas.getContext("2d"), viewport: v })
      .promise;
    if (id !== generation) return;
    const img = document.createElement("img");
    img.alt = `Página ${index + 1}`;
    img.src = canvas.toDataURL("image/jpeg", 0.85);
    pages[index].replaceChildren(img);
    p.cleanup();
  }
}
async function openFile(file) {
  if (!file || busy) return;
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf")
    return status("Escolha um arquivo PDF válido.", true);
  if (file.size > 50 * 1024 * 1024)
    return status("O PDF deve ter no máximo 50 MB.", true);
  busy = true;
  status("Preparando suas páginas…");
  let candidate;
  try {
    candidate = await pdfjs.getDocument({
      data: await file.arrayBuffer(),
      isEvalSupported: false,
      cMapUrl: "/pdfjs/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "/pdfjs/standard_fonts/",
      wasmUrl: "/pdfjs/wasm/",
    }).promise;
    if (candidate.numPages > 500) {
      await candidate.loadingTask.destroy();
      throw new Error("LIMIT");
    }
    ++generation;
    if (pdf) await pdf.loadingTask.destroy();
    pdf = candidate;
    page = 0;
    zoom = 1;
    $("#filename").textContent = file.name;
    $("#upload-section").hidden = true;
    $("#reader").hidden = false;
    $(".intro").classList.add("compact");
    $("#stage").style.transform = "";
    $("#stage").style.zoom = "1";
    $("#zoom-value").textContent = "100%";
    await renderBook();
    status("");
  } catch (error) {
    console.error("PDF loading failed", error);
    status(
      error.message === "LIMIT"
        ? "Este visualizador aceita PDFs com até 500 páginas."
        : error.name === "PasswordException"
          ? "Este PDF está protegido por senha. Envie uma cópia sem senha."
          : "Não foi possível abrir este PDF. Verifique se o arquivo está íntegro e tente novamente.",
      true,
    );
  } finally {
    busy = false;
    $("#file").value = "";
  }
}
$("#file").onchange = (e) => openFile(e.target.files[0]);
$("#replace").onclick = () => $("#file").click();
$("#dropzone").onkeydown = (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    $("#file").click();
  }
};
for (const event of ["dragover", "dragleave", "drop"])
  $("#dropzone").addEventListener(event, (e) => {
    e.preventDefault();
    $("#dropzone").classList.toggle("dragging", event === "dragover");
    if (event === "drop") openFile(e.dataTransfer.files[0]);
  });
$("#prev").onclick = () => flip?.flipPrev();
$("#next").onclick = () => flip?.flipNext();
$("#page-form").onsubmit = (e) => {
  e.preventDefault();
  const n = Number($("#page-number").value);
  if (Number.isInteger(n) && n >= 1 && n <= pdf.numPages) {
    flip.turnToPage(n - 1);
    updateNavigation();
  }
};
document.addEventListener("keydown", (e) => {
  if (/INPUT|BUTTON/.test(e.target.tagName)) return;
  if (e.key === "ArrowRight") flip?.flipNext();
  if (e.key === "ArrowLeft") flip?.flipPrev();
});
for (const [selector, mode] of [
  ["#book-mode", false],
  ["#single-mode", true],
])
  $(selector).onclick = async () => {
    if (busy || single === mode) return;
    busy = true;
    single = mode;
    $("#stage").style.width = "";
    $("#book-mode").setAttribute("aria-pressed", !single);
    $("#single-mode").setAttribute("aria-pressed", single);
    try {
      await renderBook();
    } finally {
      busy = false;
    }
  };
for (const [selector, delta] of [
  ["#zoom-in", 0.1],
  ["#zoom-out", -0.1],
])
  $(selector).onclick = () => {
    zoom = Math.max(0.6, Math.min(1.5, zoom + delta));
    $("#stage").style.zoom = zoom;
    $("#zoom-value").textContent = `${Math.round(zoom * 100)}%`;
  };
$("#fullscreen").onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $("#reader").requestFullscreen();
  } catch {
    status("Tela cheia não está disponível neste navegador.", true);
  }
};
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (pdf && !busy)
      renderBook().catch(() =>
        status("Não foi possível ajustar a visualização.", true),
      );
  }, 250);
});
