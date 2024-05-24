// import hash function argon2id for password
const {argon2id} = window.hashwasm;
// Salt should be at least 8 bytes long
const salt = 'Cerberosï\x8Dzß~9ão'
export const hashPassword = async (username, password) => {
    // salt + username bit level xor
    const _salt = Array.from(salt)
    .map((item, idx) => username[idx] ?
      String.fromCharCode(item.charCodeAt(0) ^ username[idx].charCodeAt(0))
      : item)
    .join('')
  const key = await argon2id({
    password,
    salt: _salt, // salt is a buffer containing random bytes
    parallelism: 1,
    iterations: 128,
    memorySize: 256, // use 512KB memory
    hashLength: 32, // output size = 32 bytes
    outputType: 'encoded', // return standard encoded string containing parameters needed to verify the key
  });
  return key
}
