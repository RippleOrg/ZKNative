// Type declarations for snarkjs (no official @types package available)
declare module 'snarkjs' {
  export interface Groth16Proof {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
    protocol: string;
    curve: string;
  }

  export interface FullProveResult {
    proof: Groth16Proof;
    publicSignals: string[];
  }

  export const groth16: {
    fullProve(
      input: Record<string, unknown>,
      wasmFile: string | Uint8Array,
      zkeyFileName: string | Uint8Array
    ): Promise<FullProveResult>;
    verify(
      vk: unknown,
      publicSignals: string[],
      proof: Groth16Proof
    ): Promise<boolean>;
    exportSolidityCallData(proof: Groth16Proof, publicSignals: string[]): Promise<string>;
  };
}
