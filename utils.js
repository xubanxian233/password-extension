// 核心密码生成逻辑

export const DEFAULT_CONFIG = {
  length: 16,
  useUppercase: true,
  useLowercase: true,
  useNumbers: true,
  useSymbols: true,
  includeChars: "",
  excludeChars: "0oO1iIlLq9g", // Default excluded chars to avoid confusion
  themeColor: "#8400ff"
};

const CHAR_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?"
};

export function generatePassword(config) {
  // Merge provided config with defaults to ensure all keys exist
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  let allowedChars = "";
  let requiredChars = [];

  // 1. Build the pool of allowed characters
  if (cfg.useUppercase) allowedChars += CHAR_SETS.uppercase;
  if (cfg.useLowercase) allowedChars += CHAR_SETS.lowercase;
  if (cfg.useNumbers) allowedChars += CHAR_SETS.numbers;
  if (cfg.useSymbols) allowedChars += CHAR_SETS.symbols;

  // 2. Add specific included characters
  if (cfg.includeChars) {
    allowedChars += cfg.includeChars;
  }

  // 3. Remove excluded characters
  if (cfg.excludeChars) {
    const excludeSet = new Set(cfg.excludeChars.split(''));
    allowedChars = allowedChars.split('').filter(c => !excludeSet.has(c)).join('');
  }

  // Safety check: if pool is empty, return empty or default
  if (!allowedChars) return "";

  let password = "";

  // 4. Ensure we have at least one character from each selected type (if possible after exclusion)
  // This is a "best effort" to ensure complexity.
  // Helper to check if a char is available in the allowed pool
  const isAvailable = (char) => allowedChars.includes(char);

  if (cfg.useUppercase) {
    const valid = CHAR_SETS.uppercase.split('').filter(isAvailable);
    if (valid.length) requiredChars.push(valid[Math.floor(Math.random() * valid.length)]);
  }
  if (cfg.useLowercase) {
    const valid = CHAR_SETS.lowercase.split('').filter(isAvailable);
    if (valid.length) requiredChars.push(valid[Math.floor(Math.random() * valid.length)]);
  }
  if (cfg.useNumbers) {
    const valid = CHAR_SETS.numbers.split('').filter(isAvailable);
    if (valid.length) requiredChars.push(valid[Math.floor(Math.random() * valid.length)]);
  }
  if (cfg.useSymbols) {
    const valid = CHAR_SETS.symbols.split('').filter(isAvailable);
    if (valid.length) requiredChars.push(valid[Math.floor(Math.random() * valid.length)]);
  }
  
  // Also ensure includeChars are present if possible
  if (cfg.includeChars) {
     const valid = cfg.includeChars.split('').filter(isAvailable);
     // We don't force ALL include chars, but we could mix them in. 
     // For now let's just treat them as part of the pool, but maybe ensure at least one?
     if (valid.length) requiredChars.push(valid[Math.floor(Math.random() * valid.length)]);
  }

  // 5. Fill the rest
  // We need to fill (length - requiredChars.length)
  // But wait, if length is shorter than required, we truncate later.
  
  for (let i = 0; i < cfg.length; i++) {
    const randomIndex = Math.floor(Math.random() * allowedChars.length);
    password += allowedChars[randomIndex];
  }

  // 6. Inject required chars at random positions to ensure constraints are met
  // Note: This replaces random characters in the generated password with the required ones.
  if (requiredChars.length > 0) {
      const passwordArr = password.split('');
      // Shuffle required chars to avoid predictable order
      requiredChars.sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < requiredChars.length && i < passwordArr.length; i++) {
          passwordArr[i] = requiredChars[i];
      }
      password = passwordArr.join('');
  }
  
  // 7. Shuffle the result one last time to mix the injected chars
  // Actually, step 6 just replaced the first N chars. We should shuffle the whole string.
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
