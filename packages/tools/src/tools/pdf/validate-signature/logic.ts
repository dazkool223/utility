import * as asn1js from 'asn1js';
import * as pkijs from 'pkijs';
import { ToolError } from '@/core/types';

/**
 * Check the digital signatures in a PDF, entirely offline.
 *
 * What is checked: the signed bytes still match the signature's digest, the signature verifies with the certificate
 * stored in the file, and whether the file was extended after signing.
 * What is not checked: whether the certificate chains to a trusted root, and whether it was revoked (OCSP/CRL need the network).
 */

export type Verdict = 'valid' | 'valid-extended' | 'invalid' | 'unsupported';

export interface SignatureReport {
  /** 1-based, in file order. */
  index: number;
  verdict: Verdict;
  /** One plain sentence for the verdict. */
  summary: string;
  /** Signed content still matches the digest in the signature. null when it could not be checked. */
  digestMatches: boolean | null;
  /** The signature verifies with the embedded certificate. null when it could not be checked. */
  signatureVerifies: boolean | null;
  /** The signature covers the file up to its end. False means bytes were appended after signing. */
  coversWholeFile: boolean;
  subFilter: string | null;
  isTimestamp: boolean;
  signer: string | null;
  signerCertificate: {
    subject: string;
    issuer: string;
    serialNumber: string;
    notBefore: string;
    notAfter: string;
    selfSigned: boolean;
    issuerIncludedInFile: boolean;
    keyAlgorithm: string;
  } | null;
  /** Signing time claimed inside the signature (not independently proven without a timestamp authority). */
  signingTime: string | null;
  /** Value of the /M entry in the signature dictionary. */
  claimedDate: string | null;
  certificateValidAtSigning: boolean | null;
  reason: string | null;
  location: string | null;
  contactInfo: string | null;
  name: string | null;
  digestAlgorithm: string | null;
  byteRange: [number, number, number, number] | null;
  /** Things the reader should know, in plain language. */
  notes: string[];
}

export interface ValidationResult {
  signatures: SignatureReport[];
  fileSize: number;
}

const RDN_NAMES: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.4': 'SN',
  '2.5.4.5': 'serialNumber',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.9': 'street',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '2.5.4.12': 'T',
  '2.5.4.42': 'GN',
  '1.2.840.113549.1.9.1': 'E',
  '0.9.2342.19200300.100.1.25': 'DC',
};

const HASH_NAMES: Record<string, string> = {
  '1.3.14.3.2.26': 'SHA-1',
  '2.16.840.1.101.3.4.2.1': 'SHA-256',
  '2.16.840.1.101.3.4.2.2': 'SHA-384',
  '2.16.840.1.101.3.4.2.3': 'SHA-512',
  '1.2.840.113549.2.5': 'MD5',
};

const KEY_NAMES: Record<string, string> = {
  '1.2.840.113549.1.1.1': 'RSA',
  '1.2.840.10045.2.1': 'ECDSA',
  '1.3.101.112': 'Ed25519',
};

function ensureCrypto() {
  if (!globalThis.crypto?.subtle) throw new ToolError('This browser does not provide the Web Crypto API needed to check signatures.');
  pkijs.setEngine('pdf-signature', new pkijs.CryptoEngine({ name: 'pdf-signature', crypto: globalThis.crypto, subtle: globalThis.crypto.subtle }));
}

function indexOfBytes(hay: Uint8Array, needle: string, from = 0): number {
  const n = needle.length;
  const first = needle.charCodeAt(0);
  const last = hay.length - n;
  outer: for (let i = hay.indexOf(first, from); i !== -1 && i <= last; i = hay.indexOf(first, i + 1)) {
    for (let k = 1; k < n; k++) if (hay[i + k] !== needle.charCodeAt(k)) continue outer;
    return i;
  }
  return -1;
}

function lastIndexOfBytes(hay: Uint8Array, needle: string, from: number): number {
  const n = needle.length;
  for (let i = Math.min(from, hay.length - n); i >= 0; i--) {
    let ok = true;
    for (let k = 0; k < n; k++) {
      if (hay[i + k] !== needle.charCodeAt(k)) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }
  return -1;
}

function latin1(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 8192) out += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, bytes.length)));
  return out;
}

function decodePdfText(raw: Uint8Array): string {
  if (raw.length >= 2 && raw[0] === 0xfe && raw[1] === 0xff) return new TextDecoder('utf-16be').decode(raw.subarray(2));
  return latin1(raw);
}

/** Read the value of a string entry such as /Reason (…) or /Name <…> from the text of a dictionary. */
export function readPdfStringEntry(dict: string, key: string): string | null {
  const m = new RegExp(`/${key}\\s*([(<])`).exec(dict);
  if (!m) return null;
  let i = m.index + m[0].length;
  const out: number[] = [];
  if (m[1] === '<') {
    const end = dict.indexOf('>', i);
    if (end === -1) return null;
    const hex = dict.slice(i, end).replace(/\s+/g, '');
    for (let k = 0; k + 1 < hex.length + 1; k += 2) {
      const pair = hex.slice(k, k + 2).padEnd(2, '0');
      const v = parseInt(pair, 16);
      if (Number.isNaN(v)) return null;
      out.push(v);
    }
    return decodePdfText(Uint8Array.from(out)) || null;
  }
  let depth = 1;
  while (i < dict.length && depth > 0) {
    const c = dict[i]!;
    if (c === '\\') {
      const n = dict[i + 1] ?? '';
      i += 2;
      if (n === 'n') out.push(10);
      else if (n === 'r') out.push(13);
      else if (n === 't') out.push(9);
      else if (n === 'b') out.push(8);
      else if (n === 'f') out.push(12);
      else if (/[0-7]/.test(n)) {
        let oct = n;
        while (oct.length < 3 && /[0-7]/.test(dict[i] ?? '')) oct += dict[i++];
        out.push(parseInt(oct, 8) & 0xff);
      } else if (n === '\n' || n === '\r') {
        // line continuation
      } else out.push(n.charCodeAt(0) & 0xff);
      continue;
    }
    if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth === 0) break;
    }
    out.push(c.charCodeAt(0) & 0xff);
    i++;
  }
  return decodePdfText(Uint8Array.from(out)) || null;
}

/** PDF date "D:YYYYMMDDHHmmSSOHH'mm'" to an ISO string, or null when it is not a valid date. */
export function parsePdfDate(value: string | null): string | null {
  if (!value) return null;
  const m = /^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(Z|[+-]\d{2}'?(?:\d{2}'?)?)?/.exec(value);
  if (!m) return null;
  const [, y, mo = '01', d = '01', h = '00', mi = '00', s = '00', tz] = m;
  let offset = 'Z';
  if (tz && tz !== 'Z') {
    const t = /([+-])(\d{2})'?(\d{2})?/.exec(tz)!;
    offset = `${t[1]}${t[2]}:${t[3] ?? '00'}`;
  }
  const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${offset}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function dnToString(rdns: pkijs.RelativeDistinguishedNames): string {
  return rdns.typesAndValues
    .map((tv) => `${RDN_NAMES[tv.type] ?? tv.type}=${String((tv.value.valueBlock as { value?: unknown }).value ?? '')}`)
    .join(', ');
}

function hex(buf: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(buf instanceof Uint8Array ? buf : buf), (b) => b.toString(16).padStart(2, '0')).join(':');
}

/** Exact length of the DER object at the start of `bytes`, or the full length when it cannot be told (indefinite BER). */
export function derLength(bytes: Uint8Array): number {
  if (bytes.length < 2) return bytes.length;
  const first = bytes[1]!;
  if (first === 0x80) return bytes.length;
  if (first < 0x80) return Math.min(bytes.length, 2 + first);
  const n = first & 0x7f;
  if (n > 4 || bytes.length < 2 + n) return bytes.length;
  let len = 0;
  for (let i = 0; i < n; i++) len = len * 256 + bytes[2 + i]!;
  return Math.min(bytes.length, 2 + n + len);
}

function hexToBytes(text: string): Uint8Array {
  const clean = text.replace(/\s+/g, '');
  const out = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function concat(a: Uint8Array, b: Uint8Array): ArrayBuffer {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out.buffer;
}

function emptyReport(index: number): SignatureReport {
  return {
    index,
    verdict: 'unsupported',
    summary: '',
    digestMatches: null,
    signatureVerifies: null,
    coversWholeFile: false,
    subFilter: null,
    isTimestamp: false,
    signer: null,
    signerCertificate: null,
    signingTime: null,
    claimedDate: null,
    certificateValidAtSigning: null,
    reason: null,
    location: null,
    contactInfo: null,
    name: null,
    digestAlgorithm: null,
    byteRange: null,
    notes: [],
  };
}

function commonName(rdns: pkijs.RelativeDistinguishedNames): string | null {
  const cn = rdns.typesAndValues.find((tv) => tv.type === '2.5.4.3');
  const v = cn && (cn.value.valueBlock as { value?: unknown }).value;
  return typeof v === 'string' ? v : null;
}

async function checkOne(file: Uint8Array, byteRangeAt: number, index: number): Promise<SignatureReport> {
  const report = emptyReport(index);

  // The signature dictionary: from its "obj" to its "endobj". Only used for descriptive entries.
  const objStart = Math.max(0, lastIndexOfBytes(file, ' obj', byteRangeAt));
  const objEndRaw = indexOfBytes(file, 'endobj', byteRangeAt);
  const objEnd = objEndRaw === -1 ? Math.min(file.length, byteRangeAt + 200_000) : objEndRaw;
  const dict = latin1(file.subarray(objStart, Math.min(objEnd, objStart + 400_000)));
  report.subFilter = /\/SubFilter\s*\/([^\s/<>[\]()]+)/.exec(dict)?.[1] ?? null;
  report.reason = readPdfStringEntry(dict, 'Reason');
  report.location = readPdfStringEntry(dict, 'Location');
  report.contactInfo = readPdfStringEntry(dict, 'ContactInfo');
  report.name = readPdfStringEntry(dict, 'Name');
  const m = readPdfStringEntry(dict, 'M');
  report.claimedDate = parsePdfDate(m) ?? m;
  report.isTimestamp = /\/Type\s*\/DocTimeStamp/.test(dict) || report.subFilter === 'ETSI.RFC3161';

  const rangeMatch = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/.exec(latin1(file.subarray(byteRangeAt, byteRangeAt + 200)));
  if (!rangeMatch) {
    report.summary = 'The signature has a malformed /ByteRange entry, so it cannot be checked.';
    return report;
  }
  const br = rangeMatch.slice(1, 5).map(Number) as [number, number, number, number];
  report.byteRange = br;
  const [a, b, c, d] = br;
  if (a !== 0 || b > c || c + d > file.length || file.length - (c + d) > 1 << 30) {
    report.verdict = 'invalid';
    report.summary = 'The signature does not describe a valid part of this file. The file may have been truncated or altered.';
    return report;
  }
  // The trailing bytes of a signed file are normally just the end-of-file marker, a few characters.
  const tail = file.length - (c + d);
  report.coversWholeFile = tail <= 2 || latin1(file.subarray(c + d)).trim() === '';

  if (file[b] !== 0x3c || file[c - 1] !== 0x3e) {
    report.summary = 'The signature data could not be located inside the file.';
    return report;
  }
  const contents = hexToBytes(latin1(file.subarray(b + 1, c - 1)));
  const der = contents.subarray(0, derLength(contents));

  if (report.isTimestamp) {
    report.summary = 'This is a document timestamp, not a person\'s signature. Its authority is not checked here.';
    report.notes.push('Timestamp tokens are not validated.');
    return report;
  }

  let signedData: pkijs.SignedData;
  try {
    const asn = asn1js.fromBER(der.slice().buffer);
    if (asn.offset === -1) throw new Error('not DER');
    const info = new pkijs.ContentInfo({ schema: asn.result });
    if (info.contentType !== pkijs.ContentInfo.SIGNED_DATA) throw new Error('not signed data');
    signedData = new pkijs.SignedData({ schema: info.content });
  } catch {
    report.summary = 'The signature data is not a readable CMS/PKCS#7 signature, so it cannot be checked.';
    return report;
  }
  const signerInfo = signedData.signerInfos[0];
  if (!signerInfo) {
    report.summary = 'The signature contains no signer, so it cannot be checked.';
    return report;
  }
  report.digestAlgorithm = HASH_NAMES[signerInfo.digestAlgorithm.algorithmId] ?? signerInfo.digestAlgorithm.algorithmId;
  if (signedData.signerInfos.length > 1) report.notes.push('This signature has more than one signer. Only the first is checked.');

  // Signing time claimed in the signature's signed attributes.
  const timeAttr = signerInfo.signedAttrs?.attributes.find((at) => at.type === '1.2.840.113549.1.9.5');
  const timeValue = timeAttr?.values[0] as { toDate?: () => Date } | undefined;
  if (timeValue && typeof timeValue.toDate === 'function') {
    try {
      report.signingTime = timeValue.toDate().toISOString();
    } catch {
      report.signingTime = null;
    }
  }

  const signed = concat(file.subarray(a, a + b), file.subarray(c, c + d));
  let signerCert: pkijs.Certificate | null = null;
  let result: { signatureVerified?: boolean | null; signerCertificate?: pkijs.Certificate | null } | undefined;
  try {
    result = await signedData.verify({ signer: 0, data: signed, checkChain: false, extendedMode: true });
  } catch (e) {
    const err = e as { message?: string; signerCertificate?: pkijs.Certificate | null };
    signerCert = err.signerCertificate ?? null;
    const message = err.message ?? '';
    if (/message digest/i.test(message)) {
      report.digestMatches = false;
    } else if (/unsupported|incorrect hash|hash algorithm/i.test(message)) {
      report.summary = `This signature uses an algorithm this browser cannot check (${report.digestAlgorithm}).`;
      describeCert(report, signerCert, signedData);
      return report;
    } else {
      report.summary = `The signature could not be verified: ${message.replace(/^Error during verification: /, '') || 'unknown problem'}.`;
      describeCert(report, signerCert, signedData);
      return report;
    }
  }
  if (result) {
    signerCert = result.signerCertificate ?? null;
    report.digestMatches = true;
    report.signatureVerifies = result.signatureVerified === true;
  }
  await describeCertAsync(report, signerCert, signedData);

  if (report.signingTime && report.signerCertificate) {
    const t = Date.parse(report.signingTime);
    report.certificateValidAtSigning = t >= Date.parse(report.signerCertificate.notBefore) && t <= Date.parse(report.signerCertificate.notAfter);
    if (!report.certificateValidAtSigning) report.notes.push('The certificate was not within its validity dates at the signing time claimed in the signature.');
  }
  if (report.signerCertificate && Date.parse(report.signerCertificate.notAfter) < Date.now()) {
    report.notes.push('The signer certificate has since expired. That does not invalidate an earlier signature on its own.');
  }

  if (report.digestMatches === false) {
    report.verdict = 'invalid';
    report.summary = 'The signed part of the file no longer matches the signature. The document was changed after it was signed, or the signature is forged.';
  } else if (!report.signatureVerifies) {
    report.verdict = 'invalid';
    report.summary = 'The signature itself does not verify with the certificate in the file.';
  } else if (!report.coversWholeFile) {
    report.verdict = 'valid-extended';
    report.summary = 'The signature is mathematically valid for the part it covers, but the file has additional content after the signed part (for example a later signature or edit).';
  } else {
    report.verdict = 'valid';
    report.summary = 'The signature is valid and the document has not been changed since it was signed.';
  }
  if (report.verdict !== 'invalid') {
    report.notes.push('The signer is not checked against trusted root certificates, and revocation is not checked (that needs the network). Valid here means unaltered, not that the signer is trusted.');
  }
  return report;
}

function describeCert(report: SignatureReport, cert: pkijs.Certificate | null, signedData: pkijs.SignedData) {
  void describeCertAsync(report, cert, signedData);
}

async function describeCertAsync(report: SignatureReport, cert: pkijs.Certificate | null, signedData: pkijs.SignedData): Promise<void> {
  if (!cert) return;
  const subject = dnToString(cert.subject);
  const issuer = dnToString(cert.issuer);
  let selfSigned = false;
  if (subject === issuer) {
    try {
      selfSigned = await cert.verify();
    } catch {
      selfSigned = false;
    }
  }
  const included = (signedData.certificates ?? []).some(
    (other) => other instanceof pkijs.Certificate && other !== cert && dnToString(other.subject) === issuer && !(subject === issuer),
  );
  report.signer = commonName(cert.subject) ?? subject;
  report.signerCertificate = {
    subject,
    issuer,
    serialNumber: hex(cert.serialNumber.valueBlock.valueHexView),
    notBefore: cert.notBefore.value.toISOString(),
    notAfter: cert.notAfter.value.toISOString(),
    selfSigned,
    issuerIncludedInFile: included,
    keyAlgorithm: KEY_NAMES[cert.subjectPublicKeyInfo.algorithm.algorithmId] ?? cert.subjectPublicKeyInfo.algorithm.algorithmId,
  };
  if (selfSigned) report.notes.push('The certificate is self-signed, so anyone could have made it.');
}

/** Find and check every signature in a PDF. */
export async function validateSignatures(input: Uint8Array | ArrayBuffer): Promise<ValidationResult> {
  const file = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (indexOfBytes(file.subarray(0, 1024), '%PDF-') === -1) throw new ToolError('This file is not a valid PDF, or it is damaged.');
  ensureCrypto();
  const signatures: SignatureReport[] = [];
  let at = indexOfBytes(file, '/ByteRange');
  while (at !== -1) {
    signatures.push(await checkOne(file, at, signatures.length + 1));
    at = indexOfBytes(file, '/ByteRange', at + 10);
  }
  return { signatures, fileSize: file.length };
}
