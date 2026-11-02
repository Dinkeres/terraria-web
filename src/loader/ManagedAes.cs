using System;
using System.Linq;
using System.Security.Cryptography;

// Browser .NET has no synchronous AES (Aes.Create() throws PlatformNotSupported).
// Terraria encrypts .plr files and achievements with RijndaelManaged (AES-128, CBC); Patches.cs redirects
// `new RijndaelManaged()` to Create() here. Plain FIPS-197 AES in managed code: slow-ish, but player files are small.
public sealed class ManagedAes : Aes
{
    public static SymmetricAlgorithm Create() => new ManagedAes();

    static bool selfTested;

    public ManagedAes()
    {
        LegalBlockSizesValue = new[] { new KeySizes(128, 128, 0) };
        LegalKeySizesValue = new[] { new KeySizes(128, 256, 64) };
        BlockSizeValue = 128; KeySizeValue = 256; FeedbackSizeValue = 8;
        ModeValue = CipherMode.CBC; PaddingValue = PaddingMode.PKCS7;
        if (!selfTested) { SelfTest(); selfTested = true; }
    }

    public override ICryptoTransform CreateEncryptor(byte[] key, byte[] iv) => new Cbc(key, iv, true, Padding);
    public override ICryptoTransform CreateDecryptor(byte[] key, byte[] iv) => new Cbc(key, iv, false, Padding);
    public override void GenerateKey() { KeyValue = RandomNumberGenerator.GetBytes(KeySizeValue / 8); }
    public override void GenerateIV() { IVValue = RandomNumberGenerator.GetBytes(16); }

    // FIPS-197 appendix C.1 known answer; refuse to touch save files if the cipher is wrong.
    static void SelfTest()
    {
        var key = Enumerable.Range(0, 16).Select(i => (byte)i).ToArray();
        var block = Convert.FromHexString("00112233445566778899aabbccddeeff");
        var ks = new KeySchedule(key);
        ks.Encrypt(block, 0);
        if (Convert.ToHexString(block) != "69C4E0D86A7B0430D8CDB78070B4C55A") throw new CryptographicException("ManagedAes self-test (encrypt) failed");
        ks.Decrypt(block, 0);
        if (Convert.ToHexString(block) != "00112233445566778899AABBCCDDEEFF") throw new CryptographicException("ManagedAes self-test (decrypt) failed");
    }

    sealed class Cbc : ICryptoTransform
    {
        readonly KeySchedule ks; readonly bool enc; readonly PaddingMode pad;
        readonly byte[] chain = new byte[16];
        byte[] heldPlain; // decrypt: last plaintext block held back until we know whether it carries padding

        public Cbc(byte[] key, byte[] iv, bool encrypt, PaddingMode padding)
        {
            ks = new KeySchedule(key); enc = encrypt; pad = padding;
            Buffer.BlockCopy(iv, 0, chain, 0, 16);
        }

        public int InputBlockSize => 16;
        public int OutputBlockSize => 16;
        public bool CanTransformMultipleBlocks => true;
        public bool CanReuseTransform => false;
        public void Dispose() { }

        public int TransformBlock(byte[] input, int inOff, int count, byte[] output, int outOff)
        {
            if (count % 16 != 0) throw new CryptographicException("partial block");
            var data = new byte[count];
            Buffer.BlockCopy(input, inOff, data, 0, count);
            Process(data);
            if (enc || pad == PaddingMode.None) { Buffer.BlockCopy(data, 0, output, outOff, count); return count; }
            // decrypt with padding: emit the previously held block + all but the last new block
            int n = 0;
            if (heldPlain != null) { Buffer.BlockCopy(heldPlain, 0, output, outOff, 16); n = 16; }
            Buffer.BlockCopy(data, 0, output, outOff + n, count - 16);
            heldPlain = data[^16..];
            return n + count - 16;
        }

        public byte[] TransformFinalBlock(byte[] input, int inOff, int count)
        {
            if (enc)
            {
                int padLen = pad switch { PaddingMode.None => 0, PaddingMode.Zeros => (16 - count % 16) % 16, _ => 16 - count % 16 };
                var data = new byte[count + padLen];
                Buffer.BlockCopy(input, inOff, data, 0, count);
                for (int i = count; i < data.Length; i++)
                    data[i] = pad switch { PaddingMode.PKCS7 => (byte)padLen, PaddingMode.ANSIX923 => i == data.Length - 1 ? (byte)padLen : (byte)0, PaddingMode.ISO10126 => i == data.Length - 1 ? (byte)padLen : (byte)Random.Shared.Next(256), _ => 0 };
                if (data.Length % 16 != 0) throw new CryptographicException("length not a multiple of the block size");
                Process(data);
                return data;
            }
            if (count % 16 != 0) throw new CryptographicException("partial block");
            var rest = new byte[count];
            Buffer.BlockCopy(input, inOff, rest, 0, count);
            Process(rest);
            var all = heldPlain == null ? rest : heldPlain.Concat(rest).ToArray();
            heldPlain = null;
            if (pad is PaddingMode.None or PaddingMode.Zeros || all.Length == 0) return all;
            int p = all[^1];
            if (p < 1 || p > 16 || p > all.Length) throw new CryptographicException("bad padding");
            if (pad == PaddingMode.PKCS7 && all[^p..].Any(b => b != p)) throw new CryptographicException("bad padding");
            return all[..^p];
        }

        void Process(byte[] data)
        {
            var tmp = new byte[16];
            for (int o = 0; o < data.Length; o += 16)
            {
                if (enc)
                {
                    for (int i = 0; i < 16; i++) data[o + i] ^= chain[i];
                    ks.Encrypt(data, o);
                    Buffer.BlockCopy(data, o, chain, 0, 16);
                }
                else
                {
                    Buffer.BlockCopy(data, o, tmp, 0, 16);
                    ks.Decrypt(data, o);
                    for (int i = 0; i < 16; i++) data[o + i] ^= chain[i];
                    Buffer.BlockCopy(tmp, 0, chain, 0, 16);
                }
            }
        }
    }

    // AES block cipher (FIPS-197), byte-oriented.
    sealed class KeySchedule
    {
        static readonly byte[] S = new byte[256], Si = new byte[256];
        static KeySchedule()
        {
            byte p = 1, q = 1;
            do
            {
                p = (byte)(p ^ (p << 1) ^ ((p & 0x80) != 0 ? 0x1B : 0));
                q ^= (byte)(q << 1); q ^= (byte)(q << 2); q ^= (byte)(q << 4);
                if ((q & 0x80) != 0) q ^= 0x09;
                byte x = (byte)(q ^ Rotl(q, 1) ^ Rotl(q, 2) ^ Rotl(q, 3) ^ Rotl(q, 4) ^ 0x63);
                S[p] = x; Si[x] = p;
            } while (p != 1);
            S[0] = 0x63; Si[0x63] = 0;
        }
        static byte Rotl(byte x, int s) => (byte)((x << s) | (x >> (8 - s)));
        static byte Xt(byte x) => (byte)((x << 1) ^ ((x & 0x80) != 0 ? 0x1B : 0));
        static byte Mul(byte a, byte b) { byte r = 0; while (b != 0) { if ((b & 1) != 0) r ^= a; a = Xt(a); b >>= 1; } return r; }

        readonly byte[] w; readonly int rounds;
        public KeySchedule(byte[] key)
        {
            int nk = key.Length / 4; rounds = nk + 6;
            w = new byte[16 * (rounds + 1)];
            Buffer.BlockCopy(key, 0, w, 0, key.Length);
            byte rcon = 1; var t = new byte[4];
            for (int i = nk; i < 4 * (rounds + 1); i++)
            {
                Buffer.BlockCopy(w, (i - 1) * 4, t, 0, 4);
                if (i % nk == 0)
                {
                    byte t0 = t[0]; t[0] = (byte)(S[t[1]] ^ rcon); t[1] = S[t[2]]; t[2] = S[t[3]]; t[3] = S[t0];
                    rcon = Xt(rcon);
                }
                else if (nk > 6 && i % nk == 4) for (int j = 0; j < 4; j++) t[j] = S[t[j]];
                for (int j = 0; j < 4; j++) w[i * 4 + j] = (byte)(w[(i - nk) * 4 + j] ^ t[j]);
            }
        }

        void AddKey(byte[] s, int o, int r) { for (int i = 0; i < 16; i++) s[o + i] ^= w[r * 16 + i]; }

        public void Encrypt(byte[] s, int o)
        {
            AddKey(s, o, 0);
            for (int r = 1; r <= rounds; r++)
            {
                for (int i = 0; i < 16; i++) s[o + i] = S[s[o + i]];
                ShiftRows(s, o, false);
                if (r != rounds) MixColumns(s, o, false);
                AddKey(s, o, r);
            }
        }

        public void Decrypt(byte[] s, int o)
        {
            AddKey(s, o, rounds);
            for (int r = rounds - 1; r >= 0; r--)
            {
                ShiftRows(s, o, true);
                for (int i = 0; i < 16; i++) s[o + i] = Si[s[o + i]];
                AddKey(s, o, r);
                if (r != 0) MixColumns(s, o, true);
            }
        }

        static void ShiftRows(byte[] s, int o, bool inv)
        {
            var t = new byte[16];
            for (int c = 0; c < 4; c++)
                for (int r = 0; r < 4; r++)
                    t[c * 4 + r] = inv ? s[o + ((c - r + 4) % 4) * 4 + r] : s[o + ((c + r) % 4) * 4 + r];
            Buffer.BlockCopy(t, 0, s, o, 16);
        }

        static void MixColumns(byte[] s, int o, bool inv)
        {
            for (int c = 0; c < 4; c++)
            {
                int i = o + c * 4;
                byte a0 = s[i], a1 = s[i + 1], a2 = s[i + 2], a3 = s[i + 3];
                if (!inv)
                {
                    s[i] = (byte)(Mul(a0, 2) ^ Mul(a1, 3) ^ a2 ^ a3);
                    s[i + 1] = (byte)(a0 ^ Mul(a1, 2) ^ Mul(a2, 3) ^ a3);
                    s[i + 2] = (byte)(a0 ^ a1 ^ Mul(a2, 2) ^ Mul(a3, 3));
                    s[i + 3] = (byte)(Mul(a0, 3) ^ a1 ^ a2 ^ Mul(a3, 2));
                }
                else
                {
                    s[i] = (byte)(Mul(a0, 14) ^ Mul(a1, 11) ^ Mul(a2, 13) ^ Mul(a3, 9));
                    s[i + 1] = (byte)(Mul(a0, 9) ^ Mul(a1, 14) ^ Mul(a2, 11) ^ Mul(a3, 13));
                    s[i + 2] = (byte)(Mul(a0, 13) ^ Mul(a1, 9) ^ Mul(a2, 14) ^ Mul(a3, 11));
                    s[i + 3] = (byte)(Mul(a0, 11) ^ Mul(a1, 13) ^ Mul(a2, 9) ^ Mul(a3, 14));
                }
            }
        }
    }
}
