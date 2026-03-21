from pathlib import Path
import random
import string

try:
    from PIL import Image, ImageDraw, ImageFont
except Exception as exc:  # pragma: no cover
    raise SystemExit("Pillow is required. Install with: pip install pillow") from exc


def _escape_pdf_text(value: str) -> str:
    return value.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def _build_stream(lines: list[str]) -> str:
    y = 760
    chunks = []
    for line in lines:
        escaped = _escape_pdf_text(line)
        chunks.append(f"BT /F1 12 Tf 72 {y} Td ({escaped}) Tj ET")
        y -= 20
    return "\n".join(chunks)


def write_simple_pdf(path: Path, lines: list[str]) -> None:
    stream = _build_stream(lines)
    stream_bytes = stream.encode("ascii", errors="replace")

    objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        f"<< /Length {len(stream_bytes)} >>\\nstream\\n{stream}\\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    content = bytearray(b"%PDF-1.4\\n")
    offsets = []

    for index, obj in enumerate(objects, start=1):
        offsets.append(len(content))
        content.extend(f"{index} 0 obj\\n{obj}\\nendobj\\n".encode("ascii"))

    xref_offset = len(content)
    content.extend(f"xref\\n0 {len(objects) + 1}\\n".encode("ascii"))
    content.extend(b"0000000000 65535 f \\n")
    for offset in offsets:
        content.extend(f"{offset:010d} 00000 n \\n".encode("ascii"))

    content.extend(
        (
            "trailer\\n"
            f"<< /Size {len(objects) + 1} /Root 1 0 R >>\\n"
            "startxref\\n"
            f"{xref_offset}\\n"
            "%%EOF\\n"
        ).encode("ascii")
    )

    path.write_bytes(bytes(content))


def random_name(ext: str) -> str:
    token = "".join(random.choice(string.ascii_lowercase + string.digits) for _ in range(6))
    return f"{token}.{ext}"


def write_png_with_text(path: Path, text: str) -> None:
    img = Image.new("RGB", (1400, 900), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()

    y = 40
    for line in text.splitlines():
        draw.text((40, y), line, fill=(0, 0, 0), font=font)
        y += 30

    img.save(path, format="PNG")


def main() -> None:
    random.seed(20260321)
    target = Path(__file__).resolve().parents[1] / "public" / "documents" / "upload-pack-obf"
    target.mkdir(parents=True, exist_ok=True)

    names = {
        "tech_pdf": random_name("pdf"),
        "fin_pdf": random_name("pdf"),
        "admin_pdf": random_name("pdf"),
        "admin_txt": random_name("txt"),
        "admin_png": random_name("png"),
    }

    write_simple_pdf(
        target / names["tech_pdf"],
        [
            "Dossier technique pour AO 2026.",
            "Contenu: offre technique, methodologie, planning.",
            "Mots cles: offre technique, specifications, conformite.",
        ],
    )

    write_simple_pdf(
        target / names["fin_pdf"],
        [
            "Dossier financier pour AO 2026.",
            "Contenu: offre financiere, montant, bordereau des prix.",
            "Mots cles: offre financiere, prix, total.",
        ],
    )

    write_simple_pdf(
        target / names["admin_pdf"],
        [
            "Piece administrative.",
            "Registre de commerce numero 16 00 1234567A26.",
            "Societe en situation reguliere.",
        ],
    )

    (target / names["admin_txt"]).write_text(
        "Attestation CNAS valide\\n"
        "Attestation CASNOS valide\\n"
        "Extrait de role a jour\\n",
        encoding="utf-8",
    )

    write_png_with_text(
        target / names["admin_png"],
        "DOCUMENT ADMINISTRATIF\\n"
        "Registre de commerce\\n"
        "CNAS\\n"
        "CASNOS\\n"
        "Extrait de role\\n",
    )

    manifest = target / "manifest.json"
    manifest.write_text(
        "{\n"
        + ",\n".join([f'  "{k}": "{v}"' for k, v in names.items()])
        + "\n}\n",
        encoding="utf-8",
    )

    print(f"Generated obfuscated asset pack in: {target}")
    for key, value in names.items():
        print(f"{key}={value}")


if __name__ == "__main__":
    main()
