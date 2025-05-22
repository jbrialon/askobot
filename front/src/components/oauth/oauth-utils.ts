// The purpose of this nonce is no create a random unique identifier before calling Twitch oauth
// and ensuring the response we are getting back matches so we know that the transaction has not been compromised.

export function nonce(length: number) {
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz+/";
  let result = "";

  while (length > 0) {
    const bytes = new Uint8Array(16);
    const random = window.crypto.getRandomValues(bytes);

    random.forEach((c) => {
      if (length == 0) {
        return;
      }
      if (c < charset.length) {
        result += charset[c];
        length--;
      }
    });
  }
  return result;
}
