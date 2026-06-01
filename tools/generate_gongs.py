#!/usr/bin/env python3
"""
Erzeugt die drei Gong-Klänge der Innercraft-Meditations-App als WAV-Dateien.

  gong.wav         — Klangschalen-Gong, beendet jede Iteration
  gong-deep.wav    — tieferer Gong, leitet das Outro ein
  gong-deepest.wav — ganz tiefer Gong, beschließt die Meditation

Aufruf:  python3 tools/generate_gongs.py
Ausgabe: app/audio/*.wav  (werden auch von der iOS-App gebündelt)
"""

import os
import struct
import wave

import numpy as np

SAMPLE_RATE = 32000  # ausreichend für Gong-Obertöne, hält die Dateien klein
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "app", "audio")


def synth_gong(f0, duration, partial_ratios, partial_gains, decays,
               beating=1.5, strike_noise=0.18, bloom=0.012):
    """Synthetisiert einen Klangschalen-/Gong-Klang aus inharmonischen Teiltönen."""
    n = int(SAMPLE_RATE * duration)
    t = np.arange(n) / SAMPLE_RATE
    signal = np.zeros(n)

    for ratio, gain, decay in zip(partial_ratios, partial_gains, decays):
        freq = f0 * ratio
        if freq > SAMPLE_RATE / 2 - 500:
            continue
        # Jeder Teilton als leicht verstimmtes Paar -> langsames Schweben ("Singen")
        env = np.exp(-t / decay)
        beat = beating * (ratio ** 0.4)
        signal += gain * env * np.sin(2 * np.pi * (freq - beat / 2) * t)
        signal += gain * env * np.sin(2 * np.pi * (freq + beat / 2) * t + 0.7)

    # Anschlag: kurzes, gefiltertes Rauschen
    n_strike = int(SAMPLE_RATE * 0.06)
    rng = np.random.default_rng(42)
    noise = rng.normal(0, 1, n_strike) * np.exp(-np.arange(n_strike) / (SAMPLE_RATE * 0.012))
    # einfacher Tiefpass durch gleitenden Mittelwert
    kernel = np.ones(24) / 24
    noise = np.convolve(noise, kernel, mode="same")
    signal[:n_strike] += strike_noise * noise * np.max(np.abs(signal[:n_strike]) + 1e-9)

    # Sanfter Attack (Aufblühen) und sanftes Ausklingen
    attack = np.minimum(t / bloom, 1.0)
    release = np.minimum((duration - t) / 0.5, 1.0)
    signal *= attack * release

    # Normalisieren mit Headroom
    signal /= np.max(np.abs(signal))
    signal *= 0.85
    return signal


def write_wav(path, signal):
    pcm = (signal * 32767).astype(np.int16)
    with wave.open(path, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(pcm.tobytes())
    size_kb = os.path.getsize(path) / 1024
    print(f"  {os.path.basename(path):20s} {size_kb:7.0f} kB")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("Erzeuge Gong-Klänge:")

    # Klangschalen-typische, inharmonische Teiltonverhältnisse
    bowl_ratios = [1.0, 2.71, 4.95, 7.60, 10.53, 13.9]

    # 1) Iterations-Gong — heller Klangschalen-Klang (G3)
    write_wav(
        os.path.join(OUT_DIR, "gong.wav"),
        synth_gong(
            f0=196.0, duration=10.0,
            partial_ratios=bowl_ratios,
            partial_gains=[1.0, 0.55, 0.32, 0.18, 0.09, 0.04],
            decays=[5.5, 3.5, 2.2, 1.4, 0.9, 0.6],
            beating=1.8,
        ),
    )

    # 2) Tieferer Gong — leitet das Outro ein (A2)
    write_wav(
        os.path.join(OUT_DIR, "gong-deep.wav"),
        synth_gong(
            f0=110.0, duration=13.0,
            partial_ratios=bowl_ratios,
            partial_gains=[1.0, 0.6, 0.35, 0.2, 0.1, 0.05],
            decays=[7.5, 4.5, 2.8, 1.8, 1.1, 0.7],
            beating=1.2,
        ),
    )

    # 3) Ganz tiefer Gong — Abschluss der Meditation (C2)
    write_wav(
        os.path.join(OUT_DIR, "gong-deepest.wav"),
        synth_gong(
            f0=65.41, duration=18.0,
            partial_ratios=bowl_ratios,
            partial_gains=[1.0, 0.65, 0.4, 0.22, 0.12, 0.06],
            decays=[11.0, 6.5, 4.0, 2.5, 1.5, 0.9],
            beating=0.8,
            strike_noise=0.22,
            bloom=0.02,
        ),
    )

    print("Fertig.")


if __name__ == "__main__":
    main()
