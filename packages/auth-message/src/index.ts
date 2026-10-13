export function buildSignInMessage(address: string, nonce: string): string {
  return `CrowdLens sign-in\nAddress: ${address}\nNonce: ${nonce}`;
}
