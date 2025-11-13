// === THEME TOGGLE + troca de imagem com fade (versão aprimorada) ===
(function () {
  const toggle = document.getElementById("toggleTheme");
  const body = document.body;
  const sensorImage = document.querySelector(".sensor-image");

  // Pré-carrega as imagens pra evitar travamento na troca
  const preload = (src) => {
    const img = new Image();
    img.src = src;
  };
  preload("Img/SensorFinal.png");
  preload("Img/Darkv1.png");

  // Função com fade controlado
  function setSensorImage(src) {
    if (!sensorImage) return;
    sensorImage.style.transition = "opacity 0.4s ease";
    sensorImage.style.opacity = "0";
    setTimeout(() => {
      sensorImage.src = src;
      sensorImage.onload = () => {
        sensorImage.style.opacity = "1";
      };
    }, 250);
  }

  // === aplica tema salvo ===
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    body.classList.add("dark-mode");
    setSensorImage("Img/Darkv1.png");
  } else {
    setSensorImage("Img/SensorFinal.png");
  }

  if (!toggle) return;

  // remove possíveis eventos duplicados
  toggle.replaceWith(toggle.cloneNode(true));
  const newToggle = document.getElementById("toggleTheme");

  newToggle.addEventListener("click", () => {
    const isDark = body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setSensorImage(isDark ? "Img/Darkv1.png" : "Img/SensorFinal.png");
  });
})();
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
