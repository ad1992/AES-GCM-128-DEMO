import { useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import "./styles.scss";

export default function App() {
  const [inputVal, setInputVal] = useState();
  const [encodeData, setEncodeData] = useState();
  const [encryptData, setEncryptData] = useState();
  const [iv, setIV] = useState();
  const [decryptKey, setDecryptKey] = useState();
  const [decryptIV, setDecryptIV] = useState();
  const [encryptKey, setEncryptKey] = useState();
  const [decryptedContent, setDecryptedContent] = useState();
  const [error, setError] = useState();
  const compRef = useRef(null);

  const cryptoKey = useRef(null);

  useEffect(() => {
    (async () => {
      const key = await window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 128
        },
        true, // extractable
        ["encrypt", "decrypt"]
      );
      cryptoKey.current = key;
    })();
  }, []);

  const encrypt = async () => {
    if (!inputVal) {
      return;
    }

    const exportedkey = await window.crypto.subtle.exportKey(
      "jwk",
      cryptoKey.current
    );

    const arr = new Uint8Array(12);
    const iv = window.crypto.getRandomValues(arr);
    const encodedData = new TextEncoder().encode(inputVal);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv
      },
      cryptoKey.current,
      encodedData
    );
    setEncryptKey(exportedkey.k);

    setIV(Array.apply([], iv).join(","));
    setEncodeData(Array.from(encodedData).join(","));

    setEncryptData(encryptedBuffer);
    setDecryptedContent(null);
  };

  const decrypt = async () => {
    try {
      const cryptoKey = await window.crypto.subtle.importKey(
        "jwk",
        {
          alg: "A128GCM",
          ext: true,
          k: decryptKey,
          key_ops: ["encrypt", "decrypt"],
          kty: "oct"
        },
        {
          name: "AES-GCM",
          length: 128
        },
        false, // Indicates whether it will be possible to export the key using subtle.export / subtle.wrap
        ["decrypt"]
      );
      const iv = new Uint8Array(decryptIV.split(","));
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv
        },
        cryptoKey,
        encryptData
      );
      const content = new TextDecoder().decode(decryptedBuffer);
      setDecryptedContent(content);
      setError("");
    } catch (error) {
      console.error(error.message);
      setDecryptedContent("");
      setError(error.message || "Decryption failed!");
    }
  };

  const reset = () => {
    setEncodeData(null);
    setEncryptData(null);
    setIV(null);
    setEncryptKey(null);
    setDecryptIV("");
    setDecryptedContent(null);
    setDecryptKey("");
    setInputVal("");
  };
  return (
    <div className="App" ref={compRef}>
      <h1>
        AES-GCM DEMO{" "}
        <span role="img" aria-label="celebrate">
          🥳
        </span>{" "}
      </h1>
      <button onClick={reset} style={{ backgroundColor: "#adb5bd" }}>
        {" "}
        Reset
      </button>
      <div className="encrypt">
        <h2> Encrypt</h2>

        <label>
          <input
            value={inputVal}
            onChange={(event) => setInputVal(event.target.value)}
            placeholder="Text to encrypt"
          />{" "}
        </label>

        <table className="encrypted-data">
          <thead>
            <tr>
              <th>Encryption Key</th>
              <th>Initialization Vector</th>
              <th>Encoded Data</th>
              <th>Encrypted Buffer</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>{encryptKey} </td>
              <td> {iv && `[ ${iv} ]`} </td>
              <td>{encodeData && `[ ${encodeData} ]`} </td>
              <td>
                {" "}
                {encryptData &&
                  `[ ${Array.from(new Uint8Array(encryptData)).join(
                    ","
                  )} ]`}{" "}
              </td>
            </tr>
          </tbody>
        </table>

        <button onClick={encrypt}> Encrypt</button>
      </div>{" "}
      <div className="decrypt">
        <h2> Decrypt</h2>
        <label>
          <input
            value={decryptKey}
            onChange={(event) => setDecryptKey(event.target.value.trim())}
            placeholder="Key to decrypt with"
          />{" "}
        </label>
        <label>
          <input
            value={decryptIV}
            onChange={(event) => setDecryptIV(event.target.value.trim())}
            placeholder="Initialization vector"
          />{" "}
        </label>
        <button onClick={decrypt}> Decrypt</button>
        {decryptedContent && (
          <>
            <p className="decrypt-content">{decryptedContent}</p>{" "}
            <Confetti
              numberOfPieces={500}
              gravity={0.4}
              width={window.innerWidth}
              height={window.innerHeight}
            />
          </>
        )}
        <p className="error">{error}</p>
      </div>
    </div>
  );
}
