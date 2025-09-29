// Claude Code Update - 更新import路径
import AssetsManager from "../../core/assets";
require('./wasm_exec.js');

declare class Go {
  argv: string[];
  env: { [envKey: string]: string };
  exit: (code: number) => void;
  importObject: WebAssembly.Imports;
  exited: boolean;
  mem: DataView;
  run(instance: WebAssembly.Instance): Promise<void>;
}

let WasmLoaded = false;

export function IsWasmReady() {
    return WasmLoaded;
}

export async function LoadWasm() {
    if (WasmLoaded) {
        return;
    }
    const assets = AssetsManager.getInstance();
    const wasmContent = await assets.loadWasm();

    if (!wasmContent) {

      // throw new Error('WASM content not found');
      return;
    }
    const go = new Go();
    const ret = await WebAssembly.instantiate(wasmContent, go.importObject);
    go.run(ret.instance);
    WasmLoaded = true;
}
