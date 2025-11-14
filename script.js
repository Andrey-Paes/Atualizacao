// =============================================================
// 1. LOADER
// =============================================================
// Garante que o conteúdo só apareça após o loader terminar
window.addEventListener("load", () => {
  const loader = document.querySelector(".loader");
  const conteudo = document.getElementById("conteudo");

  // Define um atraso de 1500ms (1.5s) para o loader
  // OBS: O código inicial tinha dois timers para o loader (um de 6000ms e outro de 1500ms).
  // Mantemos a lógica mais curta e eficiente no 'load'.
  setTimeout(() => {
    loader.classList.add("hidden");

    // Adiciona um pequeno atraso para o fade-in do conteúdo
    setTimeout(() => {
      conteudo.classList.remove("hidden");
      // Certifica-se de que o elemento está visível (se for necessário usar a classe fade-in)
      conteudo.style.opacity = "2";
    }, 300);
  }, 5500);
});

// =============================================================
// 2. THEME TOGGLE (Modo Escuro)
// =============================================================
(function () {
  const toggle = document.getElementById("toggleTheme");
  const body = document.body;
  const sensorImage = document.querySelector(".sensor-image");

  // Pré-carrega as imagens para evitar travamento na troca
  const preload = (src) => {
    const img = new Image();
    img.src = src;
  };
  preload("Img/SensorFinal.png");
  preload("Img/Darkv1.png");

  // Função com fade controlado (mantida a lógica de fade-out/fade-in suave)
  function setSensorImage(src) {
    if (!sensorImage) return;
    sensorImage.style.transition = "opacity 0.4s ease";
    sensorImage.style.opacity = "0";
    setTimeout(() => {
      // Usamos o 'src' no JS para controle, embora o CSS também defina 'content'
      sensorImage.src = src;
      sensorImage.onload = () => {
        sensorImage.style.opacity = "1";
      };
    }, 250);
  }

  // === Aplica tema salvo ===
  const savedTheme = localStorage.getItem("theme");
  const isDark = savedTheme === "dark";

  if (isDark) {
    body.classList.add("dark-mode");
    // O CSS deve cuidar da imagem, mas a chamada JS garante a transição se o CSS falhar
    setSensorImage("Img/Darkv1.png");
  } else {
    setSensorImage("Img/SensorFinal.png");
  }

  if (!toggle) return;

  // Usa o elemento existente
  toggle.addEventListener("click", () => {
    const isDarkNow = body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDarkNow ? "dark" : "light");
    setSensorImage(isDarkNow ? "Img/Darkv1.png" : "Img/SensorFinal.png");
  });
})();

// =============================================================
// 3. LÓGICA DE CÁLCULO PTEMP
// =============================================================

// === Elementos DOM ===
// OBS: 'btn' renomeado para 'btnCalcular' para clareza
const faixaMinEl = document.getElementById("faixaMin");
const faixaMaxEl = document.getElementById("faixaMax");
const resEl = document.getElementById("res");
const saidaEl = document.getElementById("saida");
const tempEl = document.getElementById("saidaTemp");
const inputTempEl = document.getElementById("inputTemp");
const saidaResEl = document.getElementById("saidaRes");
const btnCalcular = document.getElementById("btnCalcular");
const btnCalcularRes = document.getElementById("btnCalcularRes");
const tipoSensorEl = document.getElementById("tipoSensor");
const tipoSaidaEl = document.getElementById("tipoSaida");

// Constantes Callendar-Van Dusen
const A = 3.9083e-3;
const B = -5.775e-7;

// === Funções de Conversão ===
function obterR0() {
  const tipo = tipoSensorEl.value;
  if (tipo === "PT500") return 500;
  if (tipo === "PT1000") return 1000;
  return 100; // Padrão PT100
}

function resistenciaParaTemperatura(R) {
  const R0 = obterR0();
  if (R <= 0) return null;

  const discriminante = A * A - 4 * B * (1 - R / R0);
  if (discriminante < 0) return null;

  const T = (-A + Math.sqrt(discriminante)) / (2 * B);

  if (T < -200 || T > 850) return null; // Limites de precisão

  return T;
}

function temperaturaParaResistencia(T) {
  const R0 = obterR0();
  if (T < -200 || T > 850) return null;

  return R0 * (1 + A * T + B * T * T);
}

// === Calcula Corrente/Tensão (Saída do Transmissor) ===
function calcularSaida(temp, faixaMin, faixaMax, tipoSaida) {
  const rangeTemp = faixaMax - faixaMin;
  let percent = (temp - faixaMin) / rangeTemp;

  // Limita o percentual de 0 a 1 (0% a 100%) para clipping da saída
  percent = Math.min(Math.max(percent, 0), 1);

  if (tipoSaida === "ma") {
    // 4-20 mA (Offset de 4 mA)
    const mA = 4 + percent * 16;
    return mA.toFixed(2) + " mA";
  } else if (tipoSaida === "v") {
    // 0-10 V (Offset de 0 V)
    const v = percent * 10;
    return v.toFixed(2) + " V";
  }
}

// =============================================================
// 4. LISTENERS E FUNÇÕES DE AÇÃO (Consolidadas)
// =============================================================

// === Ação: Calcule °C (Resistência -> Temperatura + Saída) ===
function calcularTemperaturaESaida() {
  const faixaMin = parseFloat(faixaMinEl.value);
  const faixaMax = parseFloat(faixaMaxEl.value);
  const R = parseFloat(resEl.value);

  // Limpa outputs
  tempEl.value = "";
  saidaEl.value = "";
  saidaResEl.value = "";
  inputTempEl.value = "";

  if (isNaN(R) || R <= 0) {
    alert("⚠️ Digite uma resistência válida (Ω) maior que 0.");
    resEl.focus();
    return;
  }

  if (faixaMin >= faixaMax) {
    alert("❌ O valor mínimo deve ser MENOR que o máximo.");
    faixaMinEl.focus();
    return;
  }

  if (faixaMin < -200 || faixaMax > 850) {
    alert("❌ Faixa inválida: utilize valores entre -200°C e 850°C.");
    return;
  }

  const temp = resistenciaParaTemperatura(R);
  if (temp === null) {
    tempEl.value = "R fora da faixa";
    saidaEl.value = "—";
    return;
  }

  tempEl.value = temp.toFixed(2) + " °C";
  saidaEl.value = calcularSaida(temp, faixaMin, faixaMax, tipoSaidaEl.value);
}

// === Ação: Calcule Ω (Temperatura -> Resistência + Saída) ===
function calcularResistenciaESaida() {
  const faixaMin = parseFloat(faixaMinEl.value);
  const faixaMax = parseFloat(faixaMaxEl.value);
  const T = parseFloat(inputTempEl.value);

  // Limpa outputs
  resEl.value = "";
  saidaEl.value = "";
  saidaResEl.value = "";
  tempEl.value = "";

  if (isNaN(T)) {
    alert("⚠️ Digite uma temperatura válida (°C).");
    inputTempEl.focus();
    return;
  }

  if (T < -200 || T > 850) {
    alert(
      "❌ Temperatura fora da faixa de precisão do sensor (-200°C a 850°C)."
    );
    return;
  }

  if (faixaMin >= faixaMax) {
    alert("❌ O valor mínimo deve ser MENOR que o máximo.");
    faixaMinEl.focus();
    return;
  }

  const R = temperaturaParaResistencia(T);
  if (R === null) {
    saidaResEl.value = "T fora da faixa";
    saidaEl.value = "—";
    return;
  }

  saidaResEl.value = R.toFixed(2) + " Ω";
  saidaEl.value = calcularSaida(T, faixaMin, faixaMax, tipoSaidaEl.value);
}

// === Event Listeners ===
btnCalcular.addEventListener("click", calcularTemperaturaESaida);
btnCalcularRes.addEventListener("click", calcularResistenciaESaida);

tipoSensorEl.addEventListener("change", () => {
  // Apenas limpa os resultados para forçar um novo cálculo com o novo R0
  resEl.value = "";
  inputTempEl.value = "";
  saidaEl.value = "";
  saidaResEl.value = "";
  tempEl.value = "";
});
