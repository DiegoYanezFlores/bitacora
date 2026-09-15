#!/usr/bin/env python3
"""Genera los iconos PWA de Bitácora: fondo #1B2321 con una "B" en #E9EBE6.

Solo usa la librería estándar (zlib + struct). La "B" se dibuja como geometría
(tallo + dos lóbulos en forma de D) con supermuestreo 4x4 para antialiasing.
La letra ocupa el 50% central, dentro de la zona segura de iconos "maskable".

Uso: python3 scripts/make_icons.py
"""
import pathlib
import struct
import zlib

BG = (0x1B, 0x23, 0x21)
FG = (0xE9, 0xEB, 0xE6)

# Geometría de la letra en coordenadas unitarias (0..1).
TOP, BOTTOM = 0.25, 0.75
LEFT = 0.345
STROKE = 0.088
MID = 0.49            # centro de la barra horizontal
RIGHT_UPPER = 0.625   # lóbulo superior algo más estrecho
RIGHT_LOWER = 0.66

SIZES = {"icon-192.png": 192, "icon-512.png": 512, "apple-touch-icon.png": 180}
SS = 4  # supermuestreo por eje


def in_d(x, y, x0, y0, y1, xr):
    """Forma de "D": rectángulo a la izquierda + semicírculo a la derecha."""
    if y < y0 or y > y1 or x < x0:
        return False
    r = (y1 - y0) / 2
    cx, cy = xr - r, (y0 + y1) / 2
    if x <= cx:
        return True
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def in_bowl(x, y, y0, y1, xr):
    outer = in_d(x, y, LEFT, y0, y1, xr)
    inner = in_d(x, y, LEFT + STROKE, y0 + STROKE, y1 - STROKE, xr - STROKE)
    return outer and not inner


def in_b(x, y):
    half = STROKE / 2
    return in_bowl(x, y, TOP, MID + half, RIGHT_UPPER) or in_bowl(x, y, MID - half, BOTTOM, RIGHT_LOWER)


def render(size):
    rows = []
    step = 1 / (size * SS)
    for py in range(size):
        row = bytearray()
        for px in range(size):
            hits = 0
            for sy in range(SS):
                y = (py * SS + sy + 0.5) * step
                for sx in range(SS):
                    if in_b((px * SS + sx + 0.5) * step, y):
                        hits += 1
            a = hits / (SS * SS)
            row.extend(round(b + (f - b) * a) for b, f in zip(BG, FG))
        rows.append(bytes(row))
    return rows


def png(size, rows):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = b"".join(b"\x00" + r for r in rows)  # filtro 0 por fila
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)  # 8 bits, RGB
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def main():
    out = pathlib.Path(__file__).resolve().parent.parent / "icons"
    out.mkdir(exist_ok=True)
    for name, size in SIZES.items():
        (out / name).write_bytes(png(size, render(size)))
        print(f"icons/{name} ({size}x{size})")


if __name__ == "__main__":
    main()
