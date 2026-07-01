export function terbilangArab(n: number): string {
  if (n === 0) return "صفر";
  const ones = [
    "", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة",
    "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"
  ];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  if (n < 20) {
    return ones[n];
  } else if (n < 100) {
    const unit = n % 10;
    const ten = Math.floor(n / 10);
    if (unit === 0) {
      return tens[ten];
    } else {
      return `${ones[unit]} و ${tens[ten]}`;
    }
  } else if (n === 100) {
    return "مائة";
  }
  return n.toString();
}

export function terbilangIndo(angka: number): string {
  const satuan = ["Nol", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  if (angka < 12) {
    return satuan[angka];
  } else if (angka < 20) {
    return satuan[angka - 10] + " Belas";
  } else if (angka < 100) {
    const unit = angka % 10;
    const ten = Math.floor(angka / 10);
    if (unit === 0) {
      return satuan[ten] + " Puluh";
    } else {
      return satuan[ten] + " Puluh " + satuan[unit];
    }
  } else if (angka === 100) {
    return "Seratus";
  }
  return angka.toString();
}
