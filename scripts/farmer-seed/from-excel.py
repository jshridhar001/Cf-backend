#!/usr/bin/env python3
"""Convert Registered Farmer details 2026.xlsx → data.json for seed-farmers.ts."""

from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
SHEET_NAME = "Final_acerage_CF_with details"
CONFIDENCE_RE = re.compile(r"\s*\(low confidence[^)]*\)", re.I)
HAS_RELATION_RE = re.compile(r"\b(?:S/O|W/O|D/O)\b", re.I)
AADHAAR_RE = re.compile(r"^\d{12}$")
PIN_RE = re.compile(r"^\d{6}$")
PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
IFSC_RE = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")
BANK_ACCOUNT_RE = re.compile(r"^\d{9,18}$")
TITLE_HINTS = ("legend", "summary", "total", "note", "unmatched")

IFSC_BANKS = {
    "SBIN": "State Bank of India",
    "HDFC": "HDFC Bank",
    "ICIC": "ICICI Bank",
    "PUNB": "Punjab National Bank",
    "UTIB": "Axis Bank",
    "BARB": "Bank of Baroda",
    "CNRB": "Canara Bank",
    "UBIN": "Union Bank of India",
    "IBKL": "IDBI Bank",
    "BKID": "Bank of India",
    "IDFB": "IDFC FIRST Bank",
    "YESB": "Yes Bank",
    "KKBK": "Kotak Mahindra Bank",
    "PSIB": "Punjab & Sind Bank",
}

HERE = Path(__file__).resolve().parent
XLSX_PATH = HERE / "registered-farmers-2026.xlsx"
OUT_PATH = HERE / "data.json"


def col_to_idx(col: str) -> int:
    n = 0
    for ch in col:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def load_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    strings: list[str] = []
    for si in root.findall("m:si", NS):
        strings.append("".join(t.text or "" for t in si.findall(".//m:t", NS)))
    return strings


def cell_value(cell: ET.Element, strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    value = cell.find("m:v", NS)
    inline = cell.find("m:is", NS)
    if cell_type == "s" and value is not None and value.text:
        return strings[int(value.text)]
    if cell_type == "inlineStr" and inline is not None:
        return "".join(t.text or "" for t in inline.findall(".//m:t", NS))
    if value is not None and value.text:
        return value.text
    return ""


def sheet_rows(zf: zipfile.ZipFile, sheet_path: str, strings: list[str]) -> list[list[str]]:
    root = ET.fromstring(zf.read(sheet_path))
    rows: list[list[str]] = []
    for row in root.findall("m:sheetData/m:row", NS):
        cells: list[tuple[int, str]] = []
        for cell in row.findall("m:c", NS):
            ref = cell.attrib.get("r", "")
            col = re.sub(r"\d+", "", ref)
            cells.append((col_to_idx(col), cell_value(cell, strings)))
        if not cells:
            rows.append([])
            continue
        max_col = max(i for i, _ in cells)
        arr = [""] * (max_col + 1)
        for i, value in cells:
            arr[i] = value
        rows.append(arr)
    return rows


def find_sheet_path(zf: zipfile.ZipFile) -> str:
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rid_to_target = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}
    for sheet in workbook.findall("m:sheets/m:sheet", NS):
        name = (sheet.attrib.get("name") or "").strip()
        if name.startswith(SHEET_NAME.strip()):
            rid = sheet.attrib.get(f"{REL_NS}id")
            target = rid_to_target[rid]
            return "xl/" + target.lstrip("/")
    raise SystemExit(f"Sheet not found: {SHEET_NAME}")


def clean_text(value: str | None) -> str:
    text = CONFIDENCE_RE.sub("", (value or "").replace("\xa0", " ")).strip()
    return re.sub(r"\s+", " ", text)


def digits(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def is_title_row(name: str) -> bool:
    lowered = name.lower()
    return any(hint in lowered for hint in TITLE_HINTS)


def convert() -> None:
    with zipfile.ZipFile(XLSX_PATH) as zf:
        strings = load_shared_strings(zf)
        rows = sheet_rows(zf, find_sheet_path(zf), strings)

    header_idx = next(i for i, row in enumerate(rows) if "AADHAAR CARD" in [c.strip() for c in row])
    headers = [clean_text(h) for h in rows[header_idx]]
    col = {name: i for i, name in enumerate(headers)}

    farmers: list[dict] = []
    skipped: list[dict] = []
    seen_aadhaar: set[str] = set()
    seen_pan: set[str] = set()
    seq = 0

    for excel_row, row in enumerate(rows[header_idx + 1 :], start=header_idx + 2):
        def get(name: str) -> str:
            idx = col.get(name)
            if idx is None or idx >= len(row):
                return ""
            return clean_text(row[idx])

        name = get("Farmer Name (source)")
        if not name or is_title_row(name) or len(name) > 120:
            continue

        aadhaar = digits(get("AADHAAR CARD"))
        village = get("Village")
        district = get("District")
        state = get("State")
        pincode = digits(get("Pincode"))
        station = get("Station")
        post_office = get("Post Office")
        police_station = get("Police Station")
        father = get("Father/Husband Name")

        missing: list[str] = []
        if not AADHAAR_RE.fullmatch(aadhaar):
            missing.append("Aadhaar")
        if not village:
            missing.append("village")
        if not district:
            missing.append("district")
        if not state:
            missing.append("state")
        if not PIN_RE.fullmatch(pincode):
            missing.append("pincode")

        if missing:
            skipped.append({"row": excel_row, "name": name, "reason": "missing " + ", ".join(missing)})
            continue

        if aadhaar in seen_aadhaar:
            skipped.append({"row": excel_row, "name": name, "reason": f"duplicate Aadhaar {aadhaar}"})
            continue
        seen_aadhaar.add(aadhaar)

        if not post_office:
            post_office = f"{village} PO"
        if not police_station:
            police_station = station or village

        display_name = name
        if father and not HAS_RELATION_RE.search(display_name):
            display_name = f"{display_name} S/O {father}"

        seq += 1
        account_number = f"CF2026-{seq:03d}"
        pan = get("PAN CARD").upper().replace(" ", "")
        if not PAN_RE.fullmatch(pan) or pan in seen_pan:
            pan = None
        else:
            seen_pan.add(pan)

        ifsc = get("IFSC Code").upper().replace(" ", "")
        if not IFSC_RE.fullmatch(ifsc):
            ifsc = None
        bank_name = IFSC_BANKS.get(ifsc[:4]) if ifsc else None

        bank_account = digits(get("Bank Account Number"))
        if not BANK_ACCOUNT_RE.fullmatch(bank_account):
            bank_account = None

        farmers.append(
            {
                "name": display_name,
                "accountNumber": account_number,
                "mobileNumber": str(9000000000 + seq),
                "aadharNumber": aadhaar,
                "panNumber": pan,
                "accountType": "INDIVIDUAL",
                "status": "ACTIVE",
                "familyAccountNumber": None,
                "bankName": bank_name,
                "ifscCode": ifsc,
                "bankAccountNumber": bank_account,
                "address": {
                    "state": state,
                    "district": district,
                    "postOffice": post_office,
                    "pincode": pincode,
                    "policeStation": police_station,
                    "village": village,
                    "area": village,
                },
            }
        )

    payload = {"families": [], "farmers": farmers, "skipped": skipped}
    OUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(farmers)} farmers, skipped {len(skipped)} rows → {OUT_PATH}")
    for item in skipped:
        print(f"  skip row {item['row']}: {item['name']} ({item['reason']})")


if __name__ == "__main__":
    convert()
