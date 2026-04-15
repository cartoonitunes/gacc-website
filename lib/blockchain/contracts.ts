import { Contract, JsonRpcProvider, BrowserProvider, JsonRpcSigner } from 'ethers';
import mutantAbi from '@/data/abi/mutant.json';
import kittenAbi from '@/data/abi/kitten.json';
import lunagemAbi from '@/data/abi/lunagem.json';

type SignerOrProvider = BrowserProvider | JsonRpcProvider | JsonRpcSigner;

export function getMACCContract(signerOrProvider: SignerOrProvider) {
  return new Contract(process.env.NEXT_PUBLIC_MACC_ADDRESS!, mutantAbi, signerOrProvider);
}

export function getGAKCContract(signerOrProvider: SignerOrProvider) {
  return new Contract(process.env.NEXT_PUBLIC_KITTEN_ADDRESS!, kittenAbi, signerOrProvider);
}

export function getLunagemContract(signerOrProvider: SignerOrProvider) {
  return new Contract(process.env.NEXT_PUBLIC_LUNAGEM_ADDRESS!, lunagemAbi, signerOrProvider);
}

export function getReadProvider() {
  if (typeof window === 'undefined') {
    return new JsonRpcProvider(process.env.RPC_URL);
  }
  return new JsonRpcProvider(`${window.location.origin}/api/rpc`);
}
