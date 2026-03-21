from pathlib import Path


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
        f"<< /Length {len(stream_bytes)} >>\nstream\n{stream}\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    content = bytearray(b"%PDF-1.4\n")
    offsets = []

    for index, obj in enumerate(objects, start=1):
        offsets.append(len(content))
        content.extend(f"{index} 0 obj\n{obj}\nendobj\n".encode("ascii"))

    xref_offset = len(content)
    content.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    content.extend(b"0000000000 65535 f \n")
    for offset in offsets:
        content.extend(f"{offset:010d} 00000 n \n".encode("ascii"))

    content.extend(
        (
            "trailer\n"
            f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            "startxref\n"
            f"{xref_offset}\n"
            "%%EOF\n"
        ).encode("ascii")
    )

    path.write_bytes(bytes(content))


def main() -> None:
    target = Path(__file__).resolve().parents[1] / "public" / "documents" / "upload-pack"
    target.mkdir(parents=True, exist_ok=True)

    docs = {
        "offre_technique.pdf": [
            "OFFRE TECHNIQUE",
            "Societe: Exemple SARL",
            "Reference AO: AO-2026-001",
            "Objet: Proposition technique",
            "Date: 2026-03-21",
        ],
        "offre_financiere.pdf": [
            "OFFRE FINANCIERE",
            "Societe: Exemple SARL",
            "Reference AO: AO-2026-001",
            "Montant propose: 1 250 000 DZD",
            "Date: 2026-03-21",
        ],
        "registre_commerce.pdf": [
            "REGISTRE DE COMMERCE",
            "Societe: Exemple SARL",
            "Numero RC: 16/00-1234567A26",
            "Date emission: 2026-01-15",
        ],
        "attestation_cnas.pdf": [
            "ATTESTATION CNAS",
            "Societe: Exemple SARL",
            "Situation: A jour",
            "Date emission: 2026-02-10",
        ],
        "attestation_casnos.pdf": [
            "ATTESTATION CASNOS",
            "Societe: Exemple SARL",
            "Situation: A jour",
            "Date emission: 2026-02-11",
        ],
        "extrait_role.pdf": [
            "EXTRAIT DE ROLE",
            "Societe: Exemple SARL",
            "Situation fiscale: Conforme",
            "Date emission: 2026-02-12",
        ],
    }

    for filename, lines in docs.items():
        write_simple_pdf(target / filename, lines)

    readme = target / "README-upload-pack.txt"
    readme.write_text(
        "Pack de test genere automatiquement.\n"
        "Documents obligatoires pour soumission:\n"
        "- offre_technique.pdf\n"
        "- offre_financiere.pdf\n"
        "Documents administratifs (profil operateur):\n"
        "- registre_commerce.pdf\n"
        "- attestation_cnas.pdf\n"
        "- attestation_casnos.pdf\n"
        "- extrait_role.pdf\n",
        encoding="ascii",
    )

    print(f"Generated {len(docs)} PDF files in: {target}")


if __name__ == "__main__":
    main()
