/**
 * Kits Ingeniables — programa original de cada kit.
 *
 * Cada kit puede traer su workspace en uno de dos formatos:
 *
 *  - `workspace`: JSON nativo de Ingeniables Blocks (Blockly serialization),
 *    igual que un .ib exportado. Cargar es directo.
 *  - `hbXml`: XML original de Hello Blocks (.hb). Se traduce en runtime
 *    mediante `transformHelloBlocksXml` + `loadHelloBlocksXml`.
 *
 * Esto permite mantener Franky y Tellurion como los .hb auténticos que
 * acompañan al kit físico, y Elastor (nativo) como JSON.
 */

import elastorWorkspace from './kits-workspaces/elastor.json';
import frankyWorkspace from './kits-workspaces/franky.json';
import tellurionHbXml from './kits-workspaces/tellurion.hb?raw';
import tellurionV2HbXml from './kits-workspaces/tellurion-v2.hb?raw';

/**
 * Una variante de un kit: el mismo modelo físico pero con una placa /
 * módulo distinto, lo que cambia el cableado de pines y por tanto el
 * programa. Tras elegir el kit se pregunta al alumno cuál tiene.
 */
export interface KitVariant {
  id: string;
  /** Etiqueta corta, ej. "Módulo Inteligente V2". */
  label: string;
  /** Texto de ayuda para distinguir la variante. */
  description: string;
  /** Ruta relativa a public/ de la imagen del módulo. */
  image: string;
  workspace?: object;
  hbXml?: string;
}

export interface KitProject {
  id: string;
  name: string;
  description: string;
  /** Ruta relativa a public/, ej. 'kits/franky.png'. Si falta, se muestra el emoji. */
  image: string;
  /** Emoji de respaldo si la imagen no carga. */
  emoji: string;
  /** Lista breve de funcionalidades (máx 4). */
  features: string[];
  boardId: string;
  /** Workspace en formato JSON nativo de Ingeniables Blocks. */
  workspace?: object;
  /** Workspace en formato XML de Hello Blocks. Si está presente, se prefiere. */
  hbXml?: string;
  /**
   * Si el kit tiene varias versiones de hardware, en vez de cargar
   * directamente se muestra esta pregunta y las variantes para elegir.
   */
  variantPrompt?: string;
  variants?: KitVariant[];
}

/** Lo que el diálogo entrega para cargar: ya resuelto a un workspace concreto. */
export interface KitLoadable {
  name: string;
  boardId: string;
  workspace?: object;
  hbXml?: string;
}

// ────────────────────────────────────────────────────────────────────────
//  Catálogo
// ────────────────────────────────────────────────────────────────────────
export const kits: KitProject[] = [
  {
    id: 'tellurion',
    name: 'Ingeniables Tellurion',
    description:
      'Sistema solar mecánico motorizado. Tres botones táctiles controlan la rotación del planeta y la iluminación del Sol con NeoPixels.',
    image: 'kits/tellurion.png',
    emoji: '🌍',
    features: [
      'Motor paso a paso 28BYJ-48',
      '3 sensores táctiles capacitivos',
      'Anillo NeoPixel de 3 LEDs',
      'Ciclo de 4 colores para el Sol',
    ],
    boardId: 'arduino-nano',
    variantPrompt:
      '¿Cuál de estos módulos inteligentes tienes conectado a tu Tellurion? Si ya lo tienes montado, puedes verificarlo también en el manual.',
    variants: [
      {
        id: 'v1',
        label: 'Módulo Inteligente V1',
        description: 'Versión inicial del módulo inteligente (la primera que se distribuyó).',
        image: 'kits/modulo-v1.png',
        hbXml: tellurionHbXml,
      },
      {
        id: 'v2',
        label: 'Módulo Inteligente V2',
        description: 'Versión más actualizada del módulo inteligente.',
        image: 'kits/modulo-v2.jpg',
        hbXml: tellurionV2HbXml,
      },
    ],
  },
  {
    id: 'franky',
    name: 'Ingeniables Franky',
    description:
      'Robot móvil con control Bluetooth y modo autónomo. Esquiva obstáculos con sensor ultrasónico y reacciona con NeoPixels.',
    image: 'kits/franky.png',
    emoji: '🤖',
    features: [
      '2 motores DC con driver puente H',
      'Control Bluetooth (HC-05/06)',
      'Modo autónomo con ultrasonidos',
      'Anillo NeoPixel de 3 LEDs',
    ],
    boardId: 'arduino-nano',
    workspace: frankyWorkspace,
  },
  {
    id: 'elastor',
    name: 'Ingeniables Elastor',
    description:
      'Lanzador / brazo articulado controlado por Bluetooth. Dos servos orientan la dirección y altura, y un motor DC dispara el mecanismo elástico.',
    image: 'kits/elastor.png',
    emoji: '🎯',
    features: [
      '2 servomotores (orientación + altura)',
      'Motor DC con driver puente H',
      'Control Bluetooth (HC-05/06)',
      'Procedimientos: Subir, Bajar, Rotar…',
    ],
    boardId: 'arduino-nano',
    workspace: elastorWorkspace,
  },
];
