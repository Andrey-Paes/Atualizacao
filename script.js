document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  const conteudoApp = document.getElementById("conteudo");
  // === CONFIGURAÇÃO DE CANVAS ===
  const canvasChuva = document.getElementById("chuva");
  const ctxChuva = canvasChuva.getContext("2d");
  const canvasRaio = document.getElementById("raio");
  const ctxRaio = canvasRaio.getContext("2d");

  function resizeCanvas() {
    canvasChuva.width = window.innerWidth;
    canvasChuva.height = window.innerHeight;
    canvasRaio.width = window.innerWidth;
    canvasRaio.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // === CHUVA REALISTA ===
  class Gota {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvasChuva.width;
      this.y = Math.random() * -canvasChuva.height;
      this.velY = 4 + Math.random() * 25; // velocidade vertical
      this.velX = -1 + Math.random() * 1; // vento horizontal
      this.tamanho = 1 + Math.random() * 1.0; // espessura
      this.opacity = 0.2 + Math.random() * 0.1; // opacidade
    }

    desenhar() {
      ctxChuva.beginPath();
      ctxChuva.strokeStyle = `rgba(173,216,230,${this.opacity})`;
      ctxChuva.lineWidth = this.tamanho;
      ctxChuva.moveTo(this.x, this.y);
      ctxChuva.lineTo(this.x + this.velX * 5, this.y + this.velY * 2);
      ctxChuva.stroke();
    }

    atualizar() {
      this.x += this.velX;
      this.y += this.velY;

      if (
        this.y > canvasChuva.height ||
        this.x < 0 ||
        this.x > canvasChuva.width
      ) {
        this.reset();
      }
    }
  }

  // Cria muitas gotas para profundidade
  const gotas = [];
  for (let i = 0; i < 600; i++) {
    gotas.push(new Gota());
  }

  function animarChuva() {
    ctxChuva.clearRect(0, 0, canvasChuva.width, canvasChuva.height);

    // Fundo levemente azul escuro
    ctxChuva.fillStyle = "rgba(167, 166, 173, 0.01)";
    ctxChuva.fillRect(0, 0, canvasChuva.width, canvasChuva.height);

    for (let gota of gotas) {
      gota.desenhar();
      gota.atualizar();
    }

    requestAnimationFrame(animarChuva);
  }
  animarChuva();

  function flashRaio(opacidade = 0.4) {
    ctxRaio.fillStyle = `rgba(255,255,255,${opacidade})`;
    ctxRaio.fillRect(0, 0, canvasRaio.width, canvasRaio.height);
    setTimeout(
      () => ctxRaio.clearRect(0, 0, canvasRaio.width, canvasRaio.height),
      80
    );
  }

  function desenharRaio(x, y, profundidade = 0) {
    if (profundidade > 3) return;

    const comprimento = 50 + Math.random() * 50;
    const angulo = ((Math.random() - 0.5) * Math.PI) / 4;
    const x2 = x + comprimento * Math.sin(angulo);
    const y2 = y + comprimento * Math.cos(angulo);

    ctxRaio.beginPath();
    ctxRaio.moveTo(x, y);
    ctxRaio.lineTo(x2, y2);
    ctxRaio.strokeStyle = "rgba(250, 250, 251, 0.94)";
    ctxRaio.lineWidth = 2;
    ctxRaio.shadowBlur = 20;
    ctxRaio.shadowColor = "white";
    ctxRaio.stroke();

    if (Math.random() < 0.9) desenharRaio(x2, y2, profundidade + 1);
  }

  // Raio aleatório com piscadas múltiplas
  function raioAleatorio() {
    const x = Math.random() * canvasRaio.width;
    const piscadas = 1 + Math.floor(Math.random() * 3); // 1 a 3 piscadas
    let i = 0;

    function piscar() {
      const opacidade = 0.3 + Math.random() * 0.3; // 0.3 a 0.6
      desenharRaio(x, 20);
      flashRaio(opacidade);
      i++;
      if (i < piscadas) {
        // intervalo curto entre piscadas (50~200ms)
        setTimeout(piscar, 50 + Math.random() * 150);
      }
    }

    piscar();

    // próximo evento de raio depois de 8 a 12 segundos
    const tempoProximo = 8000 + Math.random() * 4000;
    setTimeout(raioAleatorio, tempoProximo);
  }

  // inicia o loop
  raioAleatorio();
});

// === elementos DOM ===
const faixaMinEl = document.getElementById("faixaMin");
const faixaMaxEl = document.getElementById("faixaMax");
const resEl = document.getElementById("res");
const saidaEl = document.getElementById("saida");
const tempEl = document.getElementById("saidaTemp");
const inputTempEl = document.getElementById("inputTemp");
const saidaResEl = document.getElementById("saidaRes");
const btn = document.getElementById("btnCalcular");
const btnCalcularRes = document.getElementById("btnCalcularRes");
const tipoSensorEl = document.getElementById("tipoSensor");

// === função para obter o R0 conforme o tipo de sensor ===
function obterR0() {
  const tipo = tipoSensorEl.value;
  if (tipo === "PT100") return 100;
  if (tipo === "PT500") return 500;
  if (tipo === "PT1000") return 1000;
  return 100;
}

// === converte resistência -> temperatura ===
function resistenciaParaTemperatura(R) {
  const R0 = obterR0();
  const A = 3.9083e-3;
  const B = -5.775e-7;

  if (R <= 0) return null;

  const discriminante = A * A - 4 * B * (1 - R / R0);
  if (discriminante < 0) return null;

  const T = (-A + Math.sqrt(discriminante)) / (2 * B);
  if (T < -200 || T > 850) return null;

  return T;
}

// === converte temperatura -> resistência ===
function temperaturaParaResistencia(T) {
  const R0 = obterR0();
  const A = 3.9083e-3;
  const B = -5.775e-7;

  if (T < -200 || T > 850) return null;

  return R0 * (1 + A * T + B * T * T);
}

//=== cálculo resistência -> temperatura -> corrente ou tensão ===
function calcular() {
  const faixaMin = parseFloat(faixaMinEl.value);
  const faixaMax = parseFloat(faixaMaxEl.value);
  const R = parseFloat(resEl.value);
  const tipoSaida = document.getElementById("tipoSaida").value; // pega a escolha do usuário

  tempEl.value = "";
  saidaEl.value = "";

  if (isNaN(R) || R <= 0) {
    alert("⚠️ Digite uma resistência válida (Ω) maior que 0.");
    resEl.focus();
    return;
  }

  if (faixaMin < -0 || faixaMax > 850) {
    alert("❌ Faixa inválida: -0 a 850°C.");
    return;
  }

  if (faixaMin >= faixaMax) {
    alert("❌ O valor mínimo deve ser MENOR que o máximo.");
    faixaMinEl.focus();
    return;
  }

  const temp = resistenciaParaTemperatura(R);
  if (temp === null) {
    tempEl.value = "Fora da faixa";
    saidaEl.value = "—";
    return;
  }

  tempEl.value = temp.toFixed(2) + " °C";

  if (tipoSaida === "ma") {
    let mA = 4 + ((temp - faixaMin) / (faixaMax - faixaMin)) * 16;
    if (mA < 4) mA = 4;
    if (mA > 20) mA = 20;
    saidaEl.value = mA.toFixed(2) + " mA";
  } else if (tipoSaida === "v") {
    let v = ((temp - faixaMin) / (faixaMax - faixaMin)) * 10;
    if (v < 0) v = 0;
    if (v > 10) v = 10;
    saidaEl.value = v.toFixed(2) + " V";
  }
}
// === cálculo temperatura -> resistência ===
function calcularResistencia() {
  const T = parseFloat(inputTempEl.value);
  saidaResEl.value = "";

  if (isNaN(T)) {
    alert("⚠️ Digite uma temperatura válida.");
    inputTempEl.focus();
    return;
  }

  const R = temperaturaParaResistencia(T);
  if (R === null) {
    alert("❌ Temperatura fora da faixa: -200 a 850°C.");
    return;
  }

  saidaResEl.value = R.toFixed(2) + " Ω";
}

// === eventos ===
btn.addEventListener("click", calcular);
btnCalcularRes.addEventListener("click", calcularResistencia);
