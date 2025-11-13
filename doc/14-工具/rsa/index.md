# RSA 加密算法

## Web 端

```js
// 工具：将 PEM 转 ArrayBuffer
function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN .* KEY-----/, '')
    .replace(/-----END .* KEY-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ArrayBuffer 转字符串
function arrayBufferToString(buffer) {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

// Base64 转 ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// 将 ArrayBuffer 转成 Base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// RSA 加密函数，使用公钥和 SHA-256
export async function rsaEncrypt(publicKeyPem, text) {
  // 1. 导入公钥
  const keyBuffer = pemToArrayBuffer(publicKeyPem);
  const publicKey = await crypto.subtle.importKey(
    'spki', // 公钥格式
    keyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false, // 是否可导出
    ['encrypt'] // 用途
  );

  // 2. 将文本编码为 Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // 3. 加密
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    data
  );

  // 4. 转为 Base64 返回
  return arrayBufferToBase64(encrypted);
}

// RSA 解密函数
export async function rsaDecrypt(privateKeyPem, base64Cipher) {
  // 1. 导入私钥
  const keyBuffer = pemToArrayBuffer(privateKeyPem);
  const privateKey = await crypto.subtle.importKey(
    'pkcs8', // 私钥格式
    keyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['decrypt']
  );

  // 2. 将 Base64 密文转 ArrayBuffer
  const cipherBuffer = base64ToArrayBuffer(base64Cipher);

  // 3. 解密
  const decrypted = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    cipherBuffer
  );

  // 4. 转为字符串
  return arrayBufferToString(decrypted);
}

```

## Java 端

```java
package com.ycfm.rc.provider.utils;


import javax.crypto.Cipher;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.MGF1ParameterSpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

public class RsaUtils {

    final static String publicKey = "";
    final static String privateKey = "";

    public static void main(String[] args) throws Exception {
        String data = "123";
        String encrypt = encryptWebCrypto(data, publicKey);
        System.out.println("加密后的数据:\n" + encrypt);
        String decrypt = decryptWebCrypto(encrypt, privateKey);
        System.out.println("解密后的数据:\n" + decrypt);
    }

    /**
     * 生成密钥
     * @throws Exception
     */
    public static void generateKeyPair() throws Exception {
        KeyPairGenerator keyPairGen = KeyPairGenerator.getInstance("RSA");
        keyPairGen.initialize(2048);
        KeyPair keyPair = keyPairGen.generateKeyPair();
        // 4. 获取公钥和私钥
        PublicKey publicKey = keyPair.getPublic();
        PrivateKey privateKey = keyPair.getPrivate();

        // 5. 转换为Base64字符串
        String publicKeyStr = publicKeyToString(publicKey);
        String privateKeyStr = privateKeyToString(privateKey);

        System.out.println("公钥:\n" + publicKeyStr);
        System.out.println("私钥:\n" + privateKeyStr);
    }

    /**
     * 加密
     * @param data
     * @param publicKey
     * @return
     * @throws Exception
     */
    public static String encrypt(String data, String publicKey) throws Exception {
        Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
        cipher.init(Cipher.ENCRYPT_MODE, loadPublicKey(publicKey));
        byte[] encryptedBytes = cipher.doFinal(data.getBytes());
        return Base64.getEncoder().encodeToString(encryptedBytes);
    }

    /**
     * 解密
     * @param encryptedData
     * @param privateKey
     * @return
     * @throws Exception
     */
    public static String decrypt(String encryptedData, String privateKey) throws Exception {
        Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
        cipher.init(Cipher.DECRYPT_MODE, loadPrivateKey(privateKey));
        byte[] decodedBytes = Base64.getDecoder().decode(encryptedData);
        byte[] decryptedBytes = cipher.doFinal(decodedBytes);
        return new String(decryptedBytes);
    }

    /**
     * 从Base64字符串加载公钥
     * @param publicKeyStr
     * @return
     * @throws Exception
     */
    public static PublicKey loadPublicKey(String publicKeyStr) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(publicKeyStr);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePublic(spec);
    }

    /**
     * 从Base64字符串加载私钥
     * @param privateKeyStr
     * @return
     * @throws Exception
     */
    public static PrivateKey loadPrivateKey(String privateKeyStr) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(privateKeyStr);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePrivate(spec);
    }

    /**
     * 公钥转Base64字符串
     * @param publicKey
     * @return
     */
    public static String publicKeyToString(PublicKey publicKey) {
        return Base64.getEncoder().encodeToString(publicKey.getEncoded());
    }

    /**
     * 私钥转Base64字符串
     * @param privateKey
     * @return
     */
    public static String privateKeyToString(PrivateKey privateKey) {
        return Base64.getEncoder().encodeToString(privateKey.getEncoded());
    }

    /**
     * web段加密
     * @param base64Cipher
     * @param publicKeyBase64
     * @return
     * @throws Exception
     */
    public static String encryptWebCrypto(String base64Cipher, String publicKeyBase64) throws Exception {
        // 1. 解码Base64公钥
        byte[] publicBytes = Base64.getDecoder().decode(publicKeyBase64);
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(publicBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PublicKey publicKey = keyFactory.generatePublic(keySpec);
        Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        // 6. 设置OAEP参数（可选，Java默认使用SHA-1作为MGF1哈希）
        OAEPParameterSpec oaepParams = new OAEPParameterSpec(
                "SHA-256",
                "MGF1",
                new MGF1ParameterSpec("SHA-256"),
                PSource.PSpecified.DEFAULT
        );
        cipher.init(Cipher.ENCRYPT_MODE, publicKey, oaepParams);
        byte[] encryptedBytes = cipher.doFinal(base64Cipher.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(encryptedBytes);
    }

    /**
     * web段解密
     * @param base64Cipher
     * @param privateKeyBase64
     * @return
     * @throws Exception
     */
    public static String decryptWebCrypto(String base64Cipher, String privateKeyBase64) throws Exception {
        byte[] privateBytes = Base64.getDecoder().decode(privateKeyBase64);
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(privateBytes);
        PrivateKey privateKey = KeyFactory.getInstance("RSA").generatePrivate(keySpec);
        Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        OAEPParameterSpec oaepParams = new OAEPParameterSpec(
                "SHA-256",
                "MGF1",
                MGF1ParameterSpec.SHA256,
                javax.crypto.spec.PSource.PSpecified.DEFAULT
        );
        cipher.init(Cipher.DECRYPT_MODE, privateKey, oaepParams);
        byte[] decoded = Base64.getDecoder().decode(base64Cipher.replaceAll("\\s",""));
        byte[] decrypted = cipher.doFinal(decoded);
        return new String(decrypted, StandardCharsets.UTF_8);
    }
}

```
