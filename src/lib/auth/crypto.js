import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

function getEncryptionKey() {
  const secret = process.env.RAINDROP_ENCRYPTION_KEY
  if (!secret) {
    throw new Error('RAINDROP_ENCRYPTION_KEY environment variable is required')
  }

  // 生成固定长度的key
  return crypto.createHash('sha256').update(secret).digest()
}

export function encrypt(text) {
  if (!text) return null

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const tag = cipher.getAuthTag()

  // 返回: iv + tag + encrypted (all hex)
  return iv.toString('hex') + tag.toString('hex') + encrypted
}

export function decrypt(encryptedData) {
  if (!encryptedData) return null

  const key = getEncryptionKey()

  // 解析: iv + tag + encrypted
  const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex')
  const tag = Buffer.from(encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), 'hex')
  const encrypted = encryptedData.slice((IV_LENGTH + TAG_LENGTH) * 2)

  // --- 新格式: createCipheriv (显式 IV) ---
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    // --- 旧格式 fallback: createCipher (EVP_BytesToKey 派生) ---
    // 旧 API 忽略传入的 IV，自行派生 key+IV，加密数据不含独立 IV/tag
    try {
      const decipher = crypto.createDecipher(ALGORITHM, key)
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    } catch {
      return null
    }
  }
}
