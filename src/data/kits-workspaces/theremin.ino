#include "frecuencias.h"
#include <Adafruit_NeoPixel.h>
#include <Wire.h>
#include <VL53L0X.h>
#include <avr/io.h>
#include <avr/interrupt.h>

// --- Struct usado por funciones (debe estar arriba para prototipos auto-generados) ---
struct NotaMelodia {
  int frecuencia;
  int duracion;
  uint8_t r, g, b;
  uint8_t patron;
};

// --- Pines ---
const int pinLeds    = 3;
const int pinBuzzer  = A3;   // PC3 en ATmega328P
const int pinTouch1  = A2;   // Luz: corto = cambiar escala color, largo = apagar
                              // En modo melodía: alterna luz auto / luz manual
const int pinTouch2  = A1;   // Sonido: corto = cambiar escala musical, largo = apagar
const int pinTouch3  = A0;   // Melodía: cíclico off -> mel1 -> mel2 -> mel3 -> off

// --- NeoPixel ---
const int nLeds = 8;
Adafruit_NeoPixel strip(nLeds, pinLeds, NEO_GRB + NEO_KHZ800);

// --- Sensor ToF ---
VL53L0X tofSensor;
const int distanciaMin = 20;    // mm
const int distanciaMax = 250;   // mm — más allá de esto, todo se apaga
const int distanciaMapeo = 220; // mm — a partir de aquí ya están todos los LEDs / nota máxima

// --- Buzzer ---
const int volumenBuzzer = 50;  // duty fijo al máximo
const int brilloLed    = 255;  // brillo fijo al máximo

// --- Estados ---
bool luzActiva    = false;
bool sonidoActivo = false;
bool modoMelodia  = false;
bool luzManualEnMelodia = false;  // en modo melodía: si true, luz controlada por mano

// --- Escalas de color (luz) ---
const int numEscalasColor = 7;
int escalaColor = 0;

const uint8_t coloresEscalaRGB[][3] = {
  {255, 0,   0},    // Rojo
  {255, 255, 255},  // Blanco
  {0,   0,   255},  // Azul
  {0,   100, 255},  // Azul claro
  {255, 165, 0},    // Naranja
  {255, 255, 0},    // Amarillo
  {128, 0,   128}   // Púrpura
};

// --- Escalas musicales (sonido) ---
const int escCromatica[]      = {NOTE_C4, NOTE_CS4, NOTE_D4, NOTE_DS4, NOTE_E4, NOTE_F4, NOTE_FS4, NOTE_G4, NOTE_GS4, NOTE_A4, NOTE_AS4, NOTE_B4, NOTE_C5};
const int escDoMayor[]        = {NOTE_C4, NOTE_D4, NOTE_E4, NOTE_F4, NOTE_G4, NOTE_A4, NOTE_B4, NOTE_C5};
const int escLaMenor[]        = {NOTE_A4, NOTE_B4, NOTE_C5, NOTE_D5, NOTE_E5, NOTE_F5, NOTE_G5, NOTE_A5};
const int escBluesDo[]        = {NOTE_C4, NOTE_DS4, NOTE_F4, NOTE_FS4, NOTE_G4, NOTE_AS4, NOTE_C5, NOTE_DS5};
const int escEspanola[]       = {NOTE_C4, NOTE_CS4, NOTE_E4, NOTE_F4, NOTE_G4, NOTE_GS4, NOTE_AS4, NOTE_C5};
const int escJudia[]          = {NOTE_E4, NOTE_F4, NOTE_GS4, NOTE_A4, NOTE_B4, NOTE_C4, NOTE_D4, NOTE_E5};
const int escDobleArmonica[]  = {NOTE_C5, NOTE_CS5, NOTE_E5, NOTE_F5, NOTE_G5, NOTE_GS5, NOTE_B5, NOTE_C6};

const int numEscalasSonido = 7;
const int* escalas[]    = {escCromatica, escDoMayor, escLaMenor, escBluesDo, escEspanola, escJudia, escDobleArmonica};
const int  tamEscalas[] = {13, 8, 8, 8, 8, 8, 8};

int escalaSonido = 0;

// --- Detección pulsación corta / larga ---
const unsigned long umbralLargo = 800;
unsigned long touch1Inicio = 0;
unsigned long touch2Inicio = 0;
unsigned long touch3Inicio = 0;
bool touch1Prev = false;
bool touch2Prev = false;
bool touch3Prev = false;
bool touch1LargoConsumido = false;
bool touch2LargoConsumido = false;
bool touch3LargoConsumido = false;

// =============================================
// --- BUZZER por Timer1 ---
// =============================================

volatile unsigned int ticksHigh = 0;
volatile unsigned int ticksLow  = 0;
volatile bool buzzerEstado = false;
volatile bool buzzerActivo = false;

ISR(TIMER1_COMPA_vect) {
  if (!buzzerActivo) {
    PORTC &= ~(1 << PC3);
    return;
  }

  if (buzzerEstado) {
    PORTC &= ~(1 << PC3);
    buzzerEstado = false;
    OCR1A += ticksLow;
  } else {
    PORTC |= (1 << PC3);
    buzzerEstado = true;
    OCR1A += ticksHigh;
  }
}

void iniciarNota(int frecuencia, int duty) {
  unsigned long periodo = 2000000UL / frecuencia;
  ticksHigh = periodo * duty / 100;
  ticksLow  = periodo - ticksHigh;
  if (ticksHigh < 1) ticksHigh = 1;
  if (ticksLow < 1)  ticksLow = 1;
  buzzerActivo = true;
}

void pararNota() {
  buzzerActivo = false;
  PORTC &= ~(1 << PC3);
}

void setupTimer1() {
  cli();
  TCCR1A = 0;
  TCCR1B = (1 << CS11);
  TIMSK1 = (1 << OCIE1A);
  OCR1A  = TCNT1 + 2000;
  sei();
}

// =============================================
// --- MELODÍAS con patrones de luz ---
// =============================================

// --- Oda a la Alegría ---
const NotaMelodia odaAlegria[] PROGMEM = {
  {NOTE_E4, 400, 255, 255, 0,   1},
  {NOTE_E4, 400, 255, 255, 0,   1},
  {NOTE_F4, 400, 255, 200, 0,   2},
  {NOTE_G4, 400, 255, 100, 0,   3},
  {NOTE_G4, 400, 255, 100, 0,   3},
  {NOTE_F4, 400, 255, 200, 0,   2},
  {NOTE_E4, 400, 255, 255, 0,   1},
  {NOTE_D4, 400, 0,   255, 0,   4},
  {NOTE_C4, 400, 0,   255, 100, 5},
  {NOTE_C4, 400, 0,   255, 100, 5},
  {NOTE_D4, 400, 0,   255, 0,   4},
  {NOTE_E4, 400, 255, 255, 0,   1},
  {NOTE_E4, 600, 255, 255, 0,   1},
  {NOTE_D4, 200, 0,   255, 0,   4},
  {NOTE_D4, 800, 0,   255, 0,   1},
  {NOTE_E4, 400, 255, 200, 50,  2},
  {NOTE_E4, 400, 255, 200, 50,  3},
  {NOTE_F4, 400, 255, 150, 0,   1},
  {NOTE_G4, 400, 255, 80,  0,   5},
  {NOTE_G4, 400, 255, 80,  0,   5},
  {NOTE_F4, 400, 255, 150, 0,   1},
  {NOTE_E4, 400, 255, 200, 50,  4},
  {NOTE_D4, 400, 0,   200, 50,  2},
  {NOTE_C4, 400, 0,   255, 100, 3},
  {NOTE_C4, 400, 0,   255, 100, 3},
  {NOTE_D4, 400, 0,   200, 50,  5},
  {NOTE_E4, 400, 255, 200, 50,  1},
  {NOTE_D4, 600, 0,   200, 50,  4},
  {NOTE_C4, 200, 0,   255, 100, 5},
  {NOTE_C4, 800, 0,   255, 100, 1},
  {0, 0, 0, 0, 0, 0}
};

// --- Cumpleaños Feliz ---
const NotaMelodia cumpleanos[] PROGMEM = {
  {NOTE_C4,  300, 255, 200, 0,   1},   // Cum
  {NOTE_C4,  100, 255, 200, 0,   2},   // ple
  {NOTE_D4,  400, 255, 150, 50,  3},   // a
  {NOTE_C4,  400, 255, 200, 0,   4},   // ños
  {NOTE_F4,  400, 255, 100, 100, 5},   // fe
  {NOTE_E4,  800, 255, 200, 50,  1},   // liz
  {0,        100, 0,   0,   0,   0},

  {NOTE_C4,  300, 255, 200, 0,   1},   // Cum
  {NOTE_C4,  100, 255, 200, 0,   2},   // ple
  {NOTE_D4,  400, 255, 150, 50,  3},   // a
  {NOTE_C4,  400, 255, 200, 0,   4},   // ños
  {NOTE_G4,  400, 255, 100, 100, 5},   // fe
  {NOTE_F4,  800, 255, 100, 100, 1},   // liz
  {0,        100, 0,   0,   0,   0},

  {NOTE_C4,  300, 255, 200, 0,   1},   // Cum
  {NOTE_C4,  100, 255, 200, 0,   2},   // ple
  {NOTE_C5,  400, 255, 150, 100, 3},   // a
  {NOTE_A4,  400, 255, 100, 150, 4},   // ños
  {NOTE_F4,  400, 255, 100, 100, 5},   // te
  {NOTE_E4,  400, 255, 200, 100, 1},   // de
  {NOTE_D4,  800, 255, 150, 50,  2},   // sea-mos
  {0,        100, 0,   0,   0,   0},

  {NOTE_AS4, 300, 255, 150, 50,  3},   // to
  {NOTE_AS4, 100, 255, 150, 50,  4},   // dos
  {NOTE_A4,  400, 255, 100, 150, 5},   // a
  {NOTE_F4,  400, 255, 100, 100, 1},   // ti
  {NOTE_G4,  400, 255, 100, 100, 2},   // fe
  {NOTE_F4,  800, 255, 100, 100, 1},   // liz
  {0, 0, 0, 0, 0, 0}
};

// --- Martinillo (Frère Jacques) ---
const NotaMelodia martinillo[] PROGMEM = {
  {NOTE_C4, 400, 0,   200, 100, 1},   // Mar
  {NOTE_D4, 400, 0,   200, 50,  2},   // ti
  {NOTE_E4, 400, 0,   220, 0,   3},   // ni
  {NOTE_C4, 400, 0,   200, 100, 1},   // llo

  {NOTE_C4, 400, 0,   200, 100, 4},   // Mar
  {NOTE_D4, 400, 0,   200, 50,  5},   // ti
  {NOTE_E4, 400, 0,   220, 0,   2},   // ni
  {NOTE_C4, 400, 0,   200, 100, 3},   // llo

  {NOTE_E4, 400, 100, 220, 0,   1},   // ¿Dón
  {NOTE_F4, 400, 100, 200, 0,   2},   // de
  {NOTE_G4, 800, 200, 200, 0,   1},   // estás?

  {NOTE_E4, 400, 100, 220, 0,   4},   // ¿Dón
  {NOTE_F4, 400, 100, 200, 0,   5},   // de
  {NOTE_G4, 800, 200, 200, 0,   1},   // estás?

  {NOTE_G4, 200, 200, 200, 0,   2},   // Toca
  {NOTE_A4, 200, 200, 150, 0,   3},   // la
  {NOTE_G4, 200, 200, 200, 0,   2},   // cam
  {NOTE_F4, 200, 100, 200, 0,   3},   // pa
  {NOTE_E4, 400, 0,   220, 0,   1},   // na
  {NOTE_C4, 400, 0,   200, 100, 4},   // (si)

  {NOTE_G4, 200, 200, 200, 0,   2},
  {NOTE_A4, 200, 200, 150, 0,   3},
  {NOTE_G4, 200, 200, 200, 0,   2},
  {NOTE_F4, 200, 100, 200, 0,   3},
  {NOTE_E4, 400, 0,   220, 0,   1},
  {NOTE_C4, 400, 0,   200, 100, 4},

  {NOTE_C4, 400, 0,   100, 200, 5},   // Din
  {NOTE_G3, 400, 0,   50,  200, 4},   // don
  {NOTE_C4, 800, 0,   100, 200, 1},   // dan

  {NOTE_C4, 400, 0,   100, 200, 5},
  {NOTE_G3, 400, 0,   50,  200, 4},
  {NOTE_C4, 800, 0,   100, 200, 1},
  {0, 0, 0, 0, 0, 0}
};

// --- Twinkle Twinkle ---
const NotaMelodia twinkle[] PROGMEM = {
  {NOTE_C4, 400, 0,   0,   255, 1},
  {NOTE_C4, 400, 0,   0,   255, 1},
  {NOTE_G4, 400, 0,   100, 255, 5},
  {NOTE_G4, 400, 0,   100, 255, 5},
  {NOTE_A4, 400, 100, 0,   255, 2},
  {NOTE_A4, 400, 100, 0,   255, 2},
  {NOTE_G4, 800, 0,   100, 255, 1},
  {NOTE_F4, 400, 0,   255, 255, 3},
  {NOTE_F4, 400, 0,   255, 255, 3},
  {NOTE_E4, 400, 0,   255, 100, 4},
  {NOTE_E4, 400, 0,   255, 100, 4},
  {NOTE_D4, 400, 0,   255, 0,   5},
  {NOTE_D4, 400, 0,   255, 0,   5},
  {NOTE_C4, 800, 0,   0,   255, 1},
  {NOTE_G4, 400, 0,   100, 255, 2},
  {NOTE_G4, 400, 0,   100, 255, 2},
  {NOTE_F4, 400, 0,   255, 255, 3},
  {NOTE_F4, 400, 0,   255, 255, 3},
  {NOTE_E4, 400, 0,   255, 100, 4},
  {NOTE_E4, 400, 0,   255, 100, 4},
  {NOTE_D4, 800, 0,   255, 0,   1},
  {NOTE_G4, 400, 0,   100, 255, 5},
  {NOTE_G4, 400, 0,   100, 255, 5},
  {NOTE_F4, 400, 0,   255, 255, 2},
  {NOTE_F4, 400, 0,   255, 255, 2},
  {NOTE_E4, 400, 0,   255, 100, 3},
  {NOTE_E4, 400, 0,   255, 100, 3},
  {NOTE_D4, 800, 0,   255, 0,   1},
  {NOTE_C4, 400, 0,   0,   255, 1},
  {NOTE_C4, 400, 0,   0,   255, 1},
  {NOTE_G4, 400, 0,   100, 255, 5},
  {NOTE_G4, 400, 0,   100, 255, 5},
  {NOTE_A4, 400, 100, 0,   255, 2},
  {NOTE_A4, 400, 100, 0,   255, 2},
  {NOTE_G4, 800, 0,   100, 255, 1},
  {NOTE_F4, 400, 0,   255, 255, 3},
  {NOTE_F4, 400, 0,   255, 255, 3},
  {NOTE_E4, 400, 0,   255, 100, 4},
  {NOTE_E4, 400, 0,   255, 100, 4},
  {NOTE_D4, 400, 0,   255, 0,   5},
  {NOTE_D4, 400, 0,   255, 0,   5},
  {NOTE_C4, 800, 0,   0,   255, 1},
  {0, 0, 0, 0, 0, 0}
};

const NotaMelodia* const melodias[] = {odaAlegria, cumpleanos, twinkle, martinillo};
const int numMelodias = 4;
int melodiaActual = 0;
int notaActual = 0;
unsigned long tiempoNotaInicio = 0;

NotaMelodia leerNota(const NotaMelodia* melodia, int indice) {
  NotaMelodia n;
  memcpy_P(&n, &melodia[indice], sizeof(NotaMelodia));
  return n;
}

void aplicarPatronLed(uint8_t patron, uint8_t r, uint8_t g, uint8_t b) {
  uint32_t color = strip.Color(r, g, b);

  strip.clear();

  switch (patron) {
    case 1:
      for (int i = 0; i < nLeds; i++) strip.setPixelColor(i, color);
      break;
    case 2:
      for (int i = 0; i < nLeds; i += 2) strip.setPixelColor(i, color);
      break;
    case 3:
      for (int i = 1; i < nLeds; i += 2) strip.setPixelColor(i, color);
      break;
    case 4:
      strip.setPixelColor(3, color);
      strip.setPixelColor(4, color);
      break;
    case 5:
      strip.setPixelColor(0, color);
      strip.setPixelColor(1, color);
      strip.setPixelColor(nLeds - 2, color);
      strip.setPixelColor(nLeds - 1, color);
      break;
    default:
      break;
  }

  strip.show();
}

void iniciarMelodia() {
  notaActual = 0;
  tiempoNotaInicio = millis();
  NotaMelodia n = leerNota(melodias[melodiaActual], 0);
  if (n.frecuencia > 0) {
    iniciarNota(n.frecuencia, volumenBuzzer);
  } else {
    pararNota();
  }
  // Solo aplicar patrón si la luz va sincronizada con la melodía
  if (!luzManualEnMelodia) {
    aplicarPatronLed(n.patron, n.r, n.g, n.b);
  }
}

void actualizarMelodia() {
  NotaMelodia n = leerNota(melodias[melodiaActual], notaActual);

  if (n.frecuencia == 0 && n.duracion == 0) {
    iniciarMelodia();
    return;
  }

  if (millis() - tiempoNotaInicio >= (unsigned long)n.duracion) {
    notaActual++;
    NotaMelodia sig = leerNota(melodias[melodiaActual], notaActual);

    if (sig.frecuencia == 0 && sig.duracion == 0) {
      iniciarMelodia();
      return;
    }

    tiempoNotaInicio = millis();
    if (sig.frecuencia > 0) {
      iniciarNota(sig.frecuencia, volumenBuzzer);
    } else {
      pararNota();
    }
    if (!luzManualEnMelodia) {
      aplicarPatronLed(sig.patron, sig.r, sig.g, sig.b);
    }
  }
}

void entrarModoMelodia() {
  luzActiva = false;
  sonidoActivo = false;
  modoMelodia = true;
  luzManualEnMelodia = false;
}

void salirModoMelodia() {
  modoMelodia = false;
  luzManualEnMelodia = false;
  pararNota();
  strip.clear();
  strip.show();
}

// =============================================
// --- LEDs modo normal / luz manual ---
// =============================================

uint32_t colorEscalaLed(int indice, int total) {
  float intensidad = (float)(indice + 1) / total;

  int r = (int)(coloresEscalaRGB[escalaColor][0] * intensidad);
  int g = (int)(coloresEscalaRGB[escalaColor][1] * intensidad);
  int b = (int)(coloresEscalaRGB[escalaColor][2] * intensidad);

  return strip.Color(constrain(r, 0, 255), constrain(g, 0, 255), constrain(b, 0, 255));
}

void mostrarDistanciaEnLeds(int distanciaMm) {
  distanciaMm = constrain(distanciaMm, distanciaMin, distanciaMapeo);
  int ledsEncendidos = map(distanciaMm, distanciaMin, distanciaMapeo, 1, nLeds);

  strip.clear();
  for (int i = 0; i < ledsEncendidos; i++) {
    strip.setPixelColor(i, colorEscalaLed(i, ledsEncendidos));
  }
  strip.show();
}

void apagarLeds() {
  strip.clear();
  strip.show();
}

// --- Sonido modo normal ---

void tocarNota(int distanciaMm) {
  distanciaMm = constrain(distanciaMm, distanciaMin, distanciaMapeo);

  int numNotas = tamEscalas[escalaSonido];
  int idx = map(distanciaMm, distanciaMin, distanciaMapeo, 0, (numNotas - 1) * 10);
  int nota = escalas[escalaSonido][idx / 10];

  iniciarNota(nota, volumenBuzzer);
}

// --- Feedback visual ---

void flashColor(uint32_t color) {
  for (int i = 0; i < nLeds; i++) strip.setPixelColor(i, color);
  strip.show();
  delay(200);
  strip.clear();
  strip.show();
  delay(100);
}

void feedbackEscalaColor() {
  uint32_t color = strip.Color(
    coloresEscalaRGB[escalaColor][0],
    coloresEscalaRGB[escalaColor][1],
    coloresEscalaRGB[escalaColor][2]
  );

  for (int i = 0; i < nLeds; i++) strip.setPixelColor(i, color);
  strip.show();
  delay(200);
  strip.clear();
  strip.show();
  delay(100);
}

void feedbackApagado() {
  for (int i = nLeds - 1; i >= 0; i--) {
    strip.setPixelColor(i, strip.Color(80, 0, 0));
    strip.show();
    delay(30);
    strip.setPixelColor(i, 0);
  }
  strip.show();
}

void feedbackMelodia() {
  for (int i = 0; i < nLeds; i++) {
    int hue = (i * 65536L / nLeds);
    strip.setPixelColor(i, strip.gamma32(strip.ColorHSV(hue, 255, 150)));
  }
  strip.show();
  delay(400);
  strip.clear();
  strip.show();
  delay(100);
}

// =============================================
// --- SETUP y LOOP ---
// =============================================

void setup() {
  Wire.begin();

  DDRC |= (1 << PC3);
  pinMode(pinTouch1, INPUT);
  pinMode(pinTouch2, INPUT);
  pinMode(pinTouch3, INPUT);

  strip.begin();
  strip.clear();
  strip.show();

  setupTimer1();

  tofSensor.setTimeout(500);
  if (!tofSensor.init()) {
    while (1) {
      for (int i = 0; i < nLeds; i++) strip.setPixelColor(i, strip.Color(255, 0, 0));
      strip.show();
      delay(300);
      strip.clear();
      strip.show();
      delay(300);
    }
  }

  tofSensor.startContinuous();

  for (int i = 0; i < nLeds; i++) {
    strip.setPixelColor(i, strip.Color(0, 255, 0));
    strip.show();
    delay(60);
  }
  delay(200);
  strip.clear();
  strip.show();
}

void loop() {
  bool t1 = digitalRead(pinTouch1);
  bool t2 = digitalRead(pinTouch2);
  bool t3 = digitalRead(pinTouch3);

  // =============================================
  // --- Touch 3: corto = cambiar/activar melodía (cíclico), largo = salir ---
  // =============================================
  if (t3 && !touch3Prev) {
    touch3Inicio = millis();
    touch3LargoConsumido = false;
  }
  // Acción de pulso largo: se dispara al cruzar el umbral aunque siga pulsado
  if (t3 && !touch3LargoConsumido && (millis() - touch3Inicio >= umbralLargo)) {
    if (modoMelodia) {
      salirModoMelodia();
      feedbackApagado();
    }
    touch3LargoConsumido = true;
  }
  // Acción de pulso corto: al soltar antes del umbral
  if (!t3 && touch3Prev && !touch3LargoConsumido) {
    if (!modoMelodia) {
      melodiaActual = 0;
      entrarModoMelodia();
      feedbackMelodia();
      iniciarMelodia();
    } else {
      melodiaActual = (melodiaActual + 1) % numMelodias;
      pararNota();
      feedbackMelodia();
      iniciarMelodia();
    }
  }

  // =============================================
  // --- Modo melodía activo ---
  // =============================================
  if (modoMelodia) {
    // Touch 1: alterna luz auto / luz manual, o cicla color si ya está en manual
    if (t1 && !touch1Prev) {
      touch1Inicio = millis();
      touch1LargoConsumido = false;
    }
    // Pulso largo: vuelve a luz automática inmediatamente
    if (t1 && !touch1LargoConsumido && (millis() - touch1Inicio >= umbralLargo)) {
      luzManualEnMelodia = false;
      feedbackApagado();
      touch1LargoConsumido = true;
    }
    // Pulso corto: al soltar antes del umbral
    if (!t1 && touch1Prev && !touch1LargoConsumido) {
      if (!luzManualEnMelodia) {
        luzManualEnMelodia = true;
        feedbackEscalaColor();
      } else {
        escalaColor = (escalaColor + 1) % numEscalasColor;
        feedbackEscalaColor();
      }
    }

    touch1Prev = t1;
    touch2Prev = t2;
    touch3Prev = t3;

    // Avanzar la melodía
    actualizarMelodia();

    // Si la luz es manual, mostrar la distancia con el color de la escala
    if (luzManualEnMelodia) {
      int distancia = tofSensor.readRangeContinuousMillimeters();
      if (!tofSensor.timeoutOccurred() && distancia <= distanciaMax) {
        mostrarDistanciaEnLeds(distancia);
      } else {
        apagarLeds();
      }
    }

    delay(20);
    return;
  }

  // =============================================
  // --- Modo normal ---
  // =============================================

  // Touch 1: Luz (corto = cambiar escala / activar, largo = apagar)
  if (t1 && !touch1Prev) {
    touch1Inicio = millis();
    touch1LargoConsumido = false;
  }
  // Pulso largo: apaga al cruzar el umbral
  if (t1 && !touch1LargoConsumido && (millis() - touch1Inicio >= umbralLargo)) {
    luzActiva = false;
    feedbackApagado();
    touch1LargoConsumido = true;
  }
  // Pulso corto: al soltar antes del umbral
  if (!t1 && touch1Prev && !touch1LargoConsumido) {
    luzActiva = true;
    escalaColor = (escalaColor + 1) % numEscalasColor;
    feedbackEscalaColor();
  }

  // Touch 2: Sonido (corto = cambiar escala / activar, largo = apagar)
  if (t2 && !touch2Prev) {
    touch2Inicio = millis();
    touch2LargoConsumido = false;
  }
  // Pulso largo: apaga al cruzar el umbral
  if (t2 && !touch2LargoConsumido && (millis() - touch2Inicio >= umbralLargo)) {
    sonidoActivo = false;
    pararNota();
    feedbackApagado();
    touch2LargoConsumido = true;
  }
  // Pulso corto: al soltar antes del umbral
  if (!t2 && touch2Prev && !touch2LargoConsumido) {
    sonidoActivo = true;
    pararNota();
    escalaSonido = (escalaSonido + 1) % numEscalasSonido;
    flashColor(strip.Color(0, 0, 80));
  }

  touch1Prev = t1;
  touch2Prev = t2;
  touch3Prev = t3;

  // --- Lógica principal modo normal ---
  if (!luzActiva && !sonidoActivo) {
    apagarLeds();
    pararNota();
    delay(50);
    return;
  }

  int distancia = tofSensor.readRangeContinuousMillimeters();

  if (tofSensor.timeoutOccurred() || distancia > distanciaMax) {
    apagarLeds();
    pararNota();
    delay(50);
    return;
  }

  if (luzActiva) {
    mostrarDistanciaEnLeds(distancia);
  } else {
    apagarLeds();
  }

  if (sonidoActivo) {
    tocarNota(distancia);
  } else {
    pararNota();
  }

  delay(50);
}
