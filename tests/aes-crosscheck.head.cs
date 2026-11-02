using System.Security.Cryptography;
static byte[] Run(SymmetricAlgorithm alg, bool enc, byte[] key, byte[] iv, byte[] data, PaddingMode p) {
  alg.Padding = p; var ms = new MemoryStream();
  using (var cs = new CryptoStream(ms, enc ? alg.CreateEncryptor(key, iv) : alg.CreateDecryptor(key, iv), CryptoStreamMode.Write)) { cs.Write(data, 0, data.Length); cs.FlushFinalBlock(); }
  return ms.ToArray(); }
static byte[] RunRead(SymmetricAlgorithm alg, byte[] key, byte[] iv, byte[] data, PaddingMode p) {
  alg.Padding = p; using var cs = new CryptoStream(new MemoryStream(data), alg.CreateDecryptor(key, iv), CryptoStreamMode.Read); var o = new MemoryStream(); cs.CopyTo(o); return o.ToArray(); }
var rng = new Random(1); int checks = 0;
foreach (var keyLen in new[] { 16, 32 })
foreach (var len in new[] { 0, 1, 15, 16, 17, 31, 32, 100, 4096, 70001 })
foreach (var pad in new[] { PaddingMode.PKCS7, PaddingMode.Zeros }) {
  var key = new byte[keyLen]; var iv = new byte[16]; var data = new byte[len]; rng.NextBytes(key); rng.NextBytes(iv); rng.NextBytes(data);
  var real = Aes.Create(); real.Mode = CipherMode.CBC;
  var a = Run(new ManagedAes(), true, key, iv, data, pad); var b = Run(real, true, key, iv, data, pad);
  if (!a.SequenceEqual(b)) throw new Exception($"encrypt mismatch key{keyLen} len{len} {pad}");
  var d1 = RunRead(new ManagedAes(), key, iv, b, pad); var d2 = Run(new ManagedAes(), false, key, iv, b, pad);
  var expect = pad == PaddingMode.PKCS7 ? data : RunRead(real, key, iv, b, pad);
  if (!d1.SequenceEqual(expect) || !d2.SequenceEqual(expect)) throw new Exception($"decrypt mismatch key{keyLen} len{len} {pad}");
  checks++; }
Console.WriteLine($"OK {checks} cases match System.Security.Cryptography.Aes");
