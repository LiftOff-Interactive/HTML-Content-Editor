/**
 * HCEZip (Stage 11 F5) — minimal dependency-free ZIP writer.
 *
 * STORE method only (no compression): SCORM packages are mostly one HTML file
 * whose bulk is base64 images, which barely compress anyway, and zero
 * dependencies is a project rule. Standard PKZIP structure: local file
 * headers + central directory + end-of-central-directory, CRC-32 checksums,
 * UTF-8 names (general-purpose flag bit 11).
 *
 *   HCEZip.build([{ name: 'imsmanifest.xml', text: '<?xml…' }, …]) → Uint8Array
 */
(function () {
  'use strict';

  // ── CRC-32 (IEEE 802.3 polynomial, table-driven) ──────────────────────────
  var CRC_TABLE = (function () {
    var table = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    var c = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) {
      c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  // ── DOS date/time (zip timestamp format) ──────────────────────────────────
  function dosDateTime(d) {
    var year = Math.max(1980, d.getFullYear());
    return {
      time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
      date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
    };
  }

  // ── Little-endian byte writer ─────────────────────────────────────────────
  function Writer() {
    this.chunks = [];
    this.length = 0;
  }
  Writer.prototype.bytes = function (arr) { this.chunks.push(arr); this.length += arr.length; };
  Writer.prototype.u16 = function (v) { this.bytes(new Uint8Array([v & 0xff, (v >>> 8) & 0xff])); };
  Writer.prototype.u32 = function (v) {
    this.bytes(new Uint8Array([v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]));
  };
  Writer.prototype.concat = function () {
    var out = new Uint8Array(this.length);
    var off = 0;
    this.chunks.forEach(function (c) { out.set(c, off); off += c.length; });
    return out;
  };

  // ── Zip assembly ──────────────────────────────────────────────────────────
  var UTF8_FLAG = 0x0800; // general-purpose bit 11: names are UTF-8

  function build(entries) {
    var enc = new TextEncoder();
    var now = dosDateTime(new Date());
    var w = new Writer();
    var central = [];

    entries.forEach(function (entry) {
      var nameBytes = enc.encode(entry.name);
      var dataBytes = (entry.text !== undefined) ? enc.encode(entry.text) : entry.bytes;
      var crc = crc32(dataBytes);
      var offset = w.length;

      // Local file header
      w.u32(0x04034b50);
      w.u16(20);            // version needed
      w.u16(UTF8_FLAG);
      w.u16(0);             // method: STORE
      w.u16(now.time);
      w.u16(now.date);
      w.u32(crc);
      w.u32(dataBytes.length); // compressed
      w.u32(dataBytes.length); // uncompressed
      w.u16(nameBytes.length);
      w.u16(0);             // extra length
      w.bytes(nameBytes);
      w.bytes(dataBytes);

      central.push({ nameBytes: nameBytes, crc: crc, size: dataBytes.length, offset: offset });
    });

    var cdStart = w.length;
    central.forEach(function (c) {
      w.u32(0x02014b50);
      w.u16(20);            // version made by
      w.u16(20);            // version needed
      w.u16(UTF8_FLAG);
      w.u16(0);             // method
      w.u16(now.time);
      w.u16(now.date);
      w.u32(c.crc);
      w.u32(c.size);
      w.u32(c.size);
      w.u16(c.nameBytes.length);
      w.u16(0);             // extra
      w.u16(0);             // comment
      w.u16(0);             // disk start
      w.u16(0);             // internal attrs
      w.u32(0);             // external attrs
      w.u32(c.offset);
      w.bytes(c.nameBytes);
    });
    var cdSize = w.length - cdStart;

    // End of central directory
    w.u32(0x06054b50);
    w.u16(0);               // disk number
    w.u16(0);               // cd start disk
    w.u16(central.length);
    w.u16(central.length);
    w.u32(cdSize);
    w.u32(cdStart);
    w.u16(0);               // comment length

    return w.concat();
  }

  window.HCEZip = { build: build, crc32: crc32 };
})();
